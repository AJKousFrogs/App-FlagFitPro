import { Injectable, computed, inject, signal } from "@angular/core";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { PeriodizationService } from "./periodization.service";
import { InjuryService } from "./injury.service";
import { ReadinessService } from "./readiness.service";
import { ScheduleService } from "./schedule.service";
import {
  recommendModalities,
  RecoveryContext,
  ModalityRecommendation,
} from "../models/recovery-modalities";

/**
 * Recovery recommender. Builds today's recovery context from the canonical
 * prescription + ACWR/readiness + self-reported tightness, then recommends
 * modalities GATED by the athlete's owned equipment
 * (athlete_training_config.available_equipment, reused). Equipment gate is a LAW:
 * a modality the athlete doesn't own is never recommended.
 */
@Injectable({ providedIn: "root" })
export class RecoveryService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly periodization = inject(PeriodizationService);
  private readonly injury = inject(InjuryService);
  private readonly readiness = inject(ReadinessService);
  private readonly schedule = inject(ScheduleService);

  /** Owned recovery equipment (available_equipment array). */
  readonly ownedEquipment = signal<string[]>([]);

  constructor() {
    void this.loadEquipment();
  }

  async loadEquipment(): Promise<void> {
    this.api
      .get<{ availableEquipment?: string[] }>("/api/player-settings")
      .subscribe({
        next: (res) => {
          const eq = (res?.data as { availableEquipment?: string[] })
            ?.availableEquipment;
          if (Array.isArray(eq)) this.ownedEquipment.set(eq.map(String));
        },
        error: (e) => this.logger.error("recovery_equipment_load_failed", e),
      });
  }

  /** Today's recovery context, derived from the canonical signals. */
  readonly context = computed<RecoveryContext>(() => {
    const rx = this.periodization.today();
    const injuries = this.injury.active();
    const sev = injuries.reduce<"minor" | "moderate" | "severe" | null>(
      (max, i) => {
        const rank =
          { minor: 1, moderate: 2, severe: 3 }[i.severity as string] ?? 0;
        const maxRank = max ? { minor: 1, moderate: 2, severe: 3 }[max] : 0;
        return rank > maxRank
          ? (i.severity as "minor" | "moderate" | "severe")
          : max;
      },
      null,
    );
    const density = this.schedule.density14d();
    const readinessScore = this.readiness.current()?.score ?? null;
    return {
      highLoad:
        !!rx &&
        (["sprint", "strength", "mixed"].includes(rx.intent) ||
          (rx.targetRpe ?? 0) >= 6),
      acwrSpike: (rx?.acwrAtIssue ?? 0) > 1.3,
      congestedFixtures:
        !!density && (density.totalGames >= 3 || density.hasPeakImportance),
      tightnessRegions: [
        ...new Set(injuries.map((i) => i.region).filter(Boolean)),
      ],
      severity: sev,
      lowReadiness: readinessScore != null && readinessScore < 55,
    };
  });

  /** Modalities recommended for today, gated by owned equipment. */
  readonly recommendations = computed<ModalityRecommendation[]>(() =>
    recommendModalities(this.context(), this.ownedEquipment()),
  );
}
