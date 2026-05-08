/**
 * HydrationService — canonical reads/writes against `athlete_hydration_logs`.
 *
 * v10 contract: hydration is a *first-class* signal that consumers read
 * via `todayTotalMl()` instead of summing local state. Supports manual
 * taps from the UI, push-notification acknowledgements, and wearable
 * sync — every entry path lands in the same table with a `source` field.
 *
 * The service is thin: it loads today's logs on auth, exposes signal
 * accessors, and delegates persistence to Supabase. Pure helpers
 * (`sumLogs`, `filterToToday`) are exported for testability without DI.
 */

import {
  Injectable,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";

import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import {
  HydrationLog,
  HydrationLogInput,
  HYDRATION_AMOUNT_MAX_ML,
  HYDRATION_AMOUNT_MIN_ML,
} from "../models/hydration.models";

@Injectable({ providedIn: "root" })
export class HydrationService {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  private readonly _logs = signal<HydrationLog[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loadedForUserId = signal<string | null>(null);

  /** All loaded logs, newest first. */
  readonly logs: Signal<HydrationLog[]> = this._logs.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();

  /** Logs whose `loggedAt` falls inside the local current calendar day. */
  readonly todayLogs = computed(() => filterToToday(this._logs(), new Date()));

  /** Sum of `amount_ml` across `todayLogs()`. */
  readonly todayTotalMl = computed(() => sumLogs(this.todayLogs()));

  constructor() {
    // Auto-load today's logs on auth, drop on logout. Mirrors
    // ScheduleService's lifecycle so both signal sources stabilize together.
    effect(() => {
      const userId = this.supabase.userId();
      if (!userId) {
        this._logs.set([]);
        this._loadedForUserId.set(null);
        return;
      }
      if (this._loadedForUserId() !== userId) {
        void this.loadToday();
      }
    });
  }

  /**
   * Refresh today's logs from the server. Call after writes that bypass
   * `logHydration` (e.g. push notification acknowledgements processed
   * server-side, wearable bulk sync) so the UI stays in sync.
   */
  async loadToday(): Promise<void> {
    const userId = this.supabase.userId();
    if (!userId) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    try {
      const startOfDay = startOfLocalDay(new Date()).toISOString();
      const { data, error } = await this.supabase.client
        .from("athlete_hydration_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .order("logged_at", { ascending: false });

      if (error) {
        this._error.set(error.message);
        this.logger.error("[HydrationService] loadToday failed", {
          error: error.message,
        });
        return;
      }
      this._logs.set((data ?? []).map(rowToLog));
      this._loadedForUserId.set(userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      this._error.set(msg);
      this.logger.error("[HydrationService] loadToday threw", { error: msg });
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Persist a hydration log. Resolves with the inserted row so the caller
   * can show optimistic feedback or undo.
   *
   * Validation mirrors the DB constraint set so we surface "amount must
   * be between 1 and 5000 ml" without a network round-trip.
   */
  async logHydration(input: HydrationLogInput): Promise<HydrationLog> {
    if (
      !Number.isFinite(input.amountMl) ||
      input.amountMl < HYDRATION_AMOUNT_MIN_ML ||
      input.amountMl > HYDRATION_AMOUNT_MAX_ML
    ) {
      throw new Error(
        `Hydration amount must be between ${HYDRATION_AMOUNT_MIN_ML} and ${HYDRATION_AMOUNT_MAX_ML} ml`,
      );
    }

    const userId = this.supabase.userId();
    if (!userId) {
      throw new Error("Not signed in");
    }

    const payload = {
      user_id: userId,
      amount_ml: Math.round(input.amountMl),
      beverage_type: input.beverageType ?? "water",
      note: input.note ?? null,
      source: input.source ?? "manual",
      logged_at: input.loggedAt ?? new Date().toISOString(),
      metadata: input.metadata ?? {},
    };

    const { data, error } = await this.supabase.client
      .from("athlete_hydration_logs")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      const msg = error?.message ?? "Insert returned no row";
      this._error.set(msg);
      throw new Error(msg);
    }

    const inserted = rowToLog(data);
    // Insert at the head so todayLogs / todayTotalMl update immediately.
    this._logs.update((current) => [inserted, ...current]);
    return inserted;
  }

  /**
   * Delete a hydration log by id. Used to undo accidental taps or correct
   * data entry mistakes. Returns silently if the row doesn't exist or the
   * caller doesn't own it (RLS handles the auth check server-side).
   */
  async deleteLog(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from("athlete_hydration_logs")
      .delete()
      .eq("id", id);

    if (error) {
      this._error.set(error.message);
      throw new Error(error.message);
    }

    this._logs.update((current) => current.filter((l) => l.id !== id));
  }
}

// =============================================================================
// PURE HELPERS
// =============================================================================

/**
 * Map a snake_case row from `athlete_hydration_logs` to the camelCase
 * client-side `HydrationLog` shape.
 */
function rowToLog(row: Record<string, unknown>): HydrationLog {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    loggedAt: row.logged_at as string,
    amountMl: row.amount_ml as number,
    beverageType: (row.beverage_type as HydrationLog["beverageType"]) ?? "water",
    note: (row.note as string | null) ?? null,
    source: (row.source as HydrationLog["source"]) ?? "manual",
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * 00:00 of `date` in the *local* timezone, expressed as a Date. Used as the
 * lower bound of a "today's logs" query.
 */
function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Sum the `amountMl` field across a list of logs. Pure — no DI, no signals.
 */
export function sumLogs(logs: HydrationLog[]): number {
  return logs.reduce((sum, l) => sum + l.amountMl, 0);
}

/**
 * Return the subset of `logs` whose `loggedAt` falls on the same calendar
 * day as `refDate` in the *local* timezone. Pure — exported for tests.
 */
export function filterToToday(
  logs: HydrationLog[],
  refDate: Date,
): HydrationLog[] {
  const start = startOfLocalDay(refDate).getTime();
  const end = start + 86_400_000;
  return logs.filter((l) => {
    const t = new Date(l.loggedAt).getTime();
    return t >= start && t < end;
  });
}
