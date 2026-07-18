import { Injectable, computed, inject, resource, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

export type TravelMode = "bus" | "car" | "plane" | "train" | "other";

export interface EventTravelLeg {
  id: string;
  competitionEventId: string | null;
  teamId: string | null;
  mode: TravelMode;
  departAt: string;
  arriveAt: string;
  timezoneDeltaHours: number | null;
  /** Days since arrival (0 = arrival day) — drives the V2.4 acclimatization guard. */
  adaptationDay: number | null;
  overnightStay: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventTravelInput {
  mode?: TravelMode;
  departAt: string;
  arriveAt: string;
  timezoneDeltaHours?: number | null;
  adaptationDay?: number | null;
  overnightStay?: boolean;
  notes?: string | null;
  competitionEventId?: string | null;
}

/**
 * Event Travel Service — CRUD for declared travel legs (V2.1). Backed by
 * `/api/event-travel`. Feeds a proactive travel-aware card: today's wellness
 * check-in can suggest a travel-hours value from a declared leg instead of
 * only reacting after the fact. See docs/v2/V2.1-plan-travel.md.
 *
 * Follows the `resource()` convention in `core/services/README.md`. Loads
 * eagerly on the signed-in user because the periodization engine reads
 * {@link daysSinceArrival} and {@link arrivalDayTravelHours} on every plan —
 * this is not an opt-in lane.
 *
 * SAFETY NOTE (pre-existing, deliberately preserved): a failed load leaves
 * `legs` empty, so `daysSinceArrival`/`arrivalDayTravelHours` return null and
 * the acclimatization + arrival-day guards simply don't fire. That is
 * fail-OPEN — a transient travel-fetch failure means an athlete who just flew
 * gets no arrival cap. The migration keeps that behaviour byte-for-byte rather
 * than quietly changing it; flipping it to fail-closed is a safety/product
 * call, not a refactor.
 */
@Injectable({ providedIn: "root" })
export class EventTravelService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);

  private readonly travelResource = resource({
    params: () => this.supabase.userId(),
    loader: async ({ params: userId }) => {
      if (!userId) return [];
      try {
        const res = await firstValueFrom(
          this.api.get<{ legs: EventTravelLeg[] }>("/api/event-travel"),
        );
        if (res.success && res.data) return res.data.legs ?? [];
        throw new Error(res.error ?? "Could not load travel");
      } catch (err) {
        this.logger.error("event_travel_load_failed", err);
        throw err instanceof Error ? err : new Error("Could not load travel");
      }
    },
  });

  /** `[]` until loaded / on failure — see the SAFETY NOTE above. */
  readonly legs = computed<EventTravelLeg[]>(() =>
    this.travelResource.hasValue() ? this.travelResource.value() : [],
  );
  readonly loading = this.travelResource.isLoading;

  private readonly _mutationError = signal<string | null>(null);

  readonly error = computed<string | null>(() => {
    const mutationError = this._mutationError();
    if (mutationError) return mutationError;
    const loadError = this.travelResource.error();
    if (!loadError) return null;
    return loadError instanceof Error ? loadError.message : String(loadError);
  });

  /** The leg (if any) whose window covers "now" — the trip happening today. */
  readonly legToday = computed(() => {
    const now = Date.now();
    return (
      this.legs().find((leg) => {
        const depart = new Date(leg.departAt).getTime();
        const arrive = new Date(leg.arriveAt).getTime();
        return now >= depart && now <= arrive;
      }) ?? null
    );
  });

  /**
   * The most recently arrived-at leg (arriveAt in the past), most recent
   * first — "where is the athlete right now, and since when". Self-
   * maintaining from the real arrival timestamp rather than a manually-
   * ticked counter, so it stays correct without the athlete updating
   * anything daily.
   */
  readonly mostRecentArrival = computed(() => {
    const now = Date.now();
    const past = this.legs()
      .filter((leg) => new Date(leg.arriveAt).getTime() <= now)
      .sort(
        (a, b) =>
          new Date(b.arriveAt).getTime() - new Date(a.arriveAt).getTime(),
      );
    return past[0] ?? null;
  });

  /**
   * Days since the athlete's most recent arrival (0 = arrival day), or null
   * if no travel is on record. Feeds the V2.4 heat/cold acclimatization
   * guard in periodization.service.ts — computed from the real `arriveAt`
   * timestamp, not the DB's static `adaptationDay` field (which would need
   * manual daily updates to stay accurate).
   */
  readonly daysSinceArrival = computed(() => {
    const leg = this.mostRecentArrival();
    if (!leg) return null;
    return Math.floor(
      (Date.now() - new Date(leg.arriveAt).getTime()) / 86_400_000,
    );
  });

  /** Rounded seated-travel hours for today's leg, or null if none. */
  readonly todayTravelHours = computed(() => {
    const leg = this.legToday();
    if (!leg) return null;
    const hours =
      (new Date(leg.arriveAt).getTime() - new Date(leg.departAt).getTime()) /
      3_600_000;
    return Math.round(hours);
  });

  /**
   * Seated-travel hours for the leg that arrived TODAY specifically (not
   * "currently in transit" like {@link todayTravelHours}, and not any past
   * arrival like {@link daysSinceArrival}). Null if the athlete didn't land
   * today. Feeds the V2.4 arrival-day load cap — a same-day arrival ≥3h
   * caps the day's session to activation only, no new fatigue on top of the
   * travel itself.
   */
  readonly arrivalDayTravelHours = computed(() => {
    if (this.daysSinceArrival() !== 0) return null;
    const leg = this.mostRecentArrival();
    if (!leg) return null;
    const hours =
      (new Date(leg.arriveAt).getTime() - new Date(leg.departAt).getTime()) /
      3_600_000;
    return Math.round(hours);
  });

  /**
   * Force a refetch. The resource already loads on sign-in and re-loads for a
   * different athlete, so this is only for "I want fresh data right now"
   * (the wellness screen calls it on open, before offering a travel-hours
   * suggestion from a declared leg).
   */
  load(): void {
    this.travelResource.reload();
  }

  async create(input: EventTravelInput): Promise<EventTravelLeg> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.post<EventTravelLeg>("/api/event-travel", input),
    );
    if (res.success && res.data) {
      this.travelResource.reload();
      return res.data;
    }
    const message = res.error ?? "Could not add travel leg";
    this._mutationError.set(message);
    throw new Error(message);
  }

  async remove(id: string): Promise<void> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.delete<{ id: string; deleted: boolean }>(
        `/api/event-travel/${id}`,
      ),
    );
    if (res.success) {
      this.travelResource.reload();
      return;
    }
    const message = res.error ?? "Could not delete travel leg";
    this._mutationError.set(message);
    throw new Error(message);
  }
}
