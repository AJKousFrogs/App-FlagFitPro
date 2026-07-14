import { Injectable, computed, inject, signal } from "@angular/core";
import { QB_THROW_MONITOR } from "../config/position-volume.config";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import {
  QbThrowingData,
  QbThrowingSessionInput,
} from "../models/qb-throwing.models";

/**
 * QB Throwing Service — thin client for the previously-orphaned
 * `/api/qb-throwing` lane (V2.2). Wires the throw-count logger the engine's
 * `QB_THROW_MONITOR` (2026-07-14 re-anchor) consumes: ramp + arm-feeling
 * fatigue flags, never a borrowed pitch count.
 */
@Injectable({ providedIn: "root" })
export class QbThrowingService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  private readonly _data = signal<QbThrowingData | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.get<QbThrowingData>("/api/qb-throwing"),
      );
      if (res.success && res.data) {
        this._data.set(res.data);
      } else {
        this._error.set(res.error ?? "Could not load throwing data");
      }
    } catch (err) {
      this._error.set("Could not load throwing data");
      this.logger.error("qb_throwing_load_failed", err);
    } finally {
      this._loading.set(false);
    }
  }

  async logSession(input: QbThrowingSessionInput): Promise<void> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.post("/api/qb-throwing", input),
      );
      if (!res.success) {
        throw new Error(res.error ?? "Could not log throwing session");
      }
      await this.load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not log throwing session";
      this._error.set(message);
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
      const data = this._data();
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
