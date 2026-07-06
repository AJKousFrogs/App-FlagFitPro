import { Injectable, computed, inject, signal } from "@angular/core";

import { ApiService, API_ENDPOINTS } from "./api.service";
import { LoggerService } from "./logger.service";
import {
  DailyProtocol,
  PROTOCOL_BLOCK_ORDER,
  ProtocolBlock,
} from "../models/protocol.models";

/**
 * Protocol Service — the EXERCISE-realization layer composed under the
 * periodization INTENT. Given today's intent (from PeriodizationService), it asks
 * daily-protocol to realize the exercises for THAT intent and exposes the blocks
 * for the Training screen. Periodization stays authoritative for intent/targets;
 * this only fills the exercise list beneath it.
 */
@Injectable({ providedIn: "root" })
export class ProtocolService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly protocol = signal<DailyProtocol | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Blocks that actually have exercises, in render order. */
  readonly blocks = computed<ProtocolBlock[]>(() => {
    const p = this.protocol();
    if (!p) {
      return [];
    }
    return PROTOCOL_BLOCK_ORDER.map(
      (k) => p[k] as ProtocolBlock | undefined,
    ).filter((b): b is ProtocolBlock => !!b && (b.exercises?.length ?? 0) > 0);
  });

  /**
   * Generate + fetch today's protocol for the given intent. Idempotent server-
   * side (one protocol per user+date), so calling on each Training open is safe.
   */
  generateFor(rx: {
    date: string;
    intent: string;
    intentLabel: string;
    position: string | null;
    seasonPhase?: string | null;
    weatherSuitability?: string | null;
    weatherTempC?: number | null;
  }): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api
      .post<DailyProtocol>(API_ENDPOINTS.dailyProtocol.generate, {
        date: rx.date,
        intent: rx.intent,
        intentLabel: rx.intentLabel,
        position: rx.position,
        seasonPhase: rx.seasonPhase ?? null,
        // Weather context lets the server suppress the Saturday-sprint hardcode
        // when current conditions are already too poor for outdoor sessions.
        weatherSuitability: rx.weatherSuitability ?? null,
        weatherTempC: rx.weatherTempC ?? null,
      })
      .subscribe({
        next: (res) => {
          this.protocol.set(res?.success ? (res.data ?? null) : null);
          this.loading.set(false);
          if (!res?.success) {
            this.error.set("Could not load exercises");
          }
        },
        error: (e) => {
          this.logger.error("protocol_generate_failed", e);
          this.error.set("Could not load exercises");
          this.loading.set(false);
        },
      });
  }
}
