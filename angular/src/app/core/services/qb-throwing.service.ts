import { Injectable, computed, inject, resource, signal } from "@angular/core";
import { QB_THROW_MONITOR } from "../config/position-volume.config";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { lastGoodByKey } from "./resource-last-good";
import {
  QbThrowingData,
  QbThrowingSessionInput,
} from "../models/qb-throwing.models";

/**
 * QB Throwing Service — thin client for the previously-orphaned
 * `/api/qb-throwing` lane (V2.2). Wires the throw-count logger the engine's
 * `QB_THROW_MONITOR` (2026-07-14 re-anchor) consumes: ramp + arm-feeling
 * fatigue flags, never a borrowed pitch count.
 *
 * ── resource() reference implementation (2026-07-18) ────────────────────────
 * This is the pilot for migrating the hand-rolled
 * `_data`/`_loading`/`_error` signal triad to Angular's `resource()`. The
 * shape to copy:
 *
 *   READS  → `resource()`. It owns loading/error/value and re-fetches when
 *            its `params` identity changes. Never set those by hand.
 *   WRITES → stay imperative (`firstValueFrom` + a plain `_saving` signal),
 *            and call `.reload()` on success. `resource()` is a READ
 *            primitive; forcing a mutation through it fights the API.
 *   GATING → `params` returning `undefined` keeps the resource IDLE (the
 *            loader never runs). That is how an opt-in lane stays free for
 *            athletes it doesn't apply to — see {@link enable}.
 *
 * See `core/services/README.md` for the full convention.
 */
@Injectable({ providedIn: "root" })
export class QbThrowingService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);

  /**
   * The lane is OFF until a caller proves the athlete is a QB. While false,
   * `params` is `undefined` and the loader never runs, so a non-QB never pays
   * for a request they can't use. This replaces the consumer's former manual
   * `loaded` boolean latch — `resource()` already refuses to re-fetch for an
   * unchanged `params` identity, so the latch was guarding something the
   * primitive guarantees.
   */
  private readonly enabled = signal(false);

  private readonly throwingResource = resource({
    // userId is in the key so the lane resets on logout and re-fetches for a
    // different athlete, matching schedule.service.ts.
    params: () => (this.enabled() ? this.supabase.userId() : undefined),
    loader: async ({ params: userId }) => {
      if (!userId) return null;
      try {
        const res = await firstValueFrom(
          this.api.get<QbThrowingData>("/api/qb-throwing"),
        );
        if (res.success && res.data) return res.data;
        throw new Error(res.error ?? "Could not load throwing data");
      } catch (err) {
        // The pre-resource version logged only genuine exceptions, not a
        // `success: false` envelope. Both are load failures worth a log line.
        this.logger.error("qb_throwing_load_failed", err);
        throw err instanceof Error
          ? err
          : new Error("Could not load throwing data");
      }
    },
  });

  /**
   * NOTE the `hasValue()` guard — it is load-bearing, not defensive noise.
   * `resource.value()` THROWS while the resource is in an error state, so the
   * obvious `computed(() => resource.value() ?? null)` propagates an exception
   * into every consumer the moment a request fails, instead of degrading to
   * null. Locked by the "surfaces a failed load" spec.
   */
  readonly data = lastGoodByKey(
    this.throwingResource,
    () => this.supabase.userId(),
    null as QbThrowingData | null,
  );
  readonly loading = this.throwingResource.isLoading;

  // Mutation state is NOT resource state — it stays hand-rolled.
  private readonly _saving = signal(false);
  private readonly _mutationError = signal<string | null>(null);
  readonly saving = this._saving.asReadonly();

  /**
   * One error surface for the component, whichever half failed. A fresh
   * mutation error wins over a stale load error — it's the thing the athlete
   * just did.
   */
  readonly error = computed<string | null>(() => {
    const mutationError = this._mutationError();
    if (mutationError) return mutationError;
    const loadError = this.throwingResource.error();
    if (!loadError) return null;
    return loadError instanceof Error ? loadError.message : String(loadError);
  });

  /**
   * Switch the lane on. Idempotent — safe to call from an effect that
   * re-fires whenever `position` changes.
   */
  enable(): void {
    this.enabled.set(true);
  }

  /** Force a re-fetch (no-op while the lane is disabled). */
  reload(): void {
    this.throwingResource.reload();
  }

  async logSession(input: QbThrowingSessionInput): Promise<void> {
    this._saving.set(true);
    this._mutationError.set(null);
    try {
      const res = await firstValueFrom(
        this.api.post("/api/qb-throwing", input),
      );
      if (!res.success) {
        throw new Error(res.error ?? "Could not log throwing session");
      }
      // Fire-and-forget: the caller awaits the WRITE, not the refetch. The
      // only consumer resets its form afterwards and reads `data()`
      // reactively, so it picks the new value up when it lands.
      this.throwingResource.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not log throwing session";
      this._mutationError.set(message);
      this.logger.error("qb_throwing_log_failed", err);
      throw err;
    } finally {
      this._saving.set(false);
    }
  }

  /**
   * QB throwing monitor (audit §5): mechanics-fatigue + progressive-load
   * advisories from the athlete's own logged sessions — the flag-specific
   * re-anchor (ramp + arm signals), NOT a pitch-count throttle.
   */
  readonly monitor = computed<{ flags: string[]; youthNote: string | null }>(
    () => {
      const data = this.data();
      const sessions = data?.recentSessions ?? [];
      const flags: string[] = [];
      if (sessions.length === 0) return { flags, youthNote: null };

      const now = Date.now();
      const DAY = 86_400_000;
      const volumeIn = (fromDaysAgo: number, toDaysAgo: number) =>
        sessions
          .filter((x) => {
            const t = new Date(x.sessionDate).getTime();
            return t > now - fromDaysAgo * DAY && t <= now - toDaysAgo * DAY;
          })
          .reduce((sum, x) => sum + (x.totalThrows || 0), 0);

      const thisWeek = volumeIn(7, 0);
      const lastWeek = volumeIn(14, 7);
      if (
        lastWeek > 0 &&
        thisWeek > lastWeek * QB_THROW_MONITOR.weeklyVolumeSpikeFactor
      ) {
        flags.push(
          `Throw volume jumped ${Math.round((thisWeek / lastWeek - 1) * 100)}% vs last week (${lastWeek} → ${thisWeek}). Ramp, don't spike — spread the extra volume across the next two weeks.`,
        );
      }

      const latest = sessions[0];
      if (
        latest &&
        latest.armFeelingBefore != null &&
        latest.armFeelingAfter != null &&
        latest.armFeelingBefore - latest.armFeelingAfter >=
          QB_THROW_MONITOR.armFeelingDropFlag
      ) {
        flags.push(
          `Arm feeling dropped ${latest.armFeelingBefore}→${latest.armFeelingAfter} in your last session — that in-session falloff is the fatigue stop-cue. End the next session when crispness fades, and do the post-throw arm care.`,
        );
      }

      return { flags, youthNote: null };
    },
  );
}
