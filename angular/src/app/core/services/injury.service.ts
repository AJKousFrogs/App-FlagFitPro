import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import {
  deriveRestrictions,
  type NormalizedInjury,
} from "./periodization-input-helpers";

export type InjurySeverity = "minor" | "moderate" | "severe";

export interface ActiveInjury {
  id: string;
  injuryType: string;
  region: string;
  severity: string; // grade/severity
  status: string;
  source: string; // 'self_report' | clinical mechanism
  restrictions: string[];
  startDate: string | null;
  expectedReturnDate: string | null;
  note: string | null;
}

/**
 * Active injuries + self-reported tightness (canonical store: athlete_injuries,
 * via /api/athlete-injuries). Drives injury precedence in the periodization
 * engine — when a region used by sprint/high-intensity work is flagged, the plan
 * down-regulates that work (see PeriodizationService / applyInjuryGuard).
 */
@Injectable({ providedIn: "root" })
export class InjuryService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly active = signal<ActiveInjury[]>([]);
  readonly loading = signal(false);

  /** Restriction summary the engine keys on. */
  readonly restrictions = computed(() => {
    // Regions span everything currently flagged (lower-limb, core, AND upper)
    // so the plan can name a shoulder issue, not just sprint-restricting ones —
    // deriveRestrictions (shared with the server, audit F8) preserves that.
    // Adapt ActiveInjury's camelCase shape to the shared NormalizedInjury shape
    // (the periodization-prescription.js server-side call site does the same
    // adaptation from its raw snake_case DB rows).
    const normalized: NormalizedInjury[] = this.active().map((i) => ({
      region: i.region,
      restrictionTypes: i.restrictions ?? [],
      severityGrade: i.severity,
    }));
    return deriveRestrictions(normalized);
  });

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.get<{ injuries: ActiveInjury[] }>("/api/athlete-injuries"),
      );
      if (res.success && res.data) {
        this.active.set(res.data.injuries ?? []);
      }
    } catch (err) {
      this.logger.error("injuries_load_failed", err);
    } finally {
      this.loading.set(false);
    }
  }

  /** Record a self-reported tightness. Throws on failure (caller must surface it). */
  async report(
    region: string,
    severity: InjurySeverity,
    note?: string,
  ): Promise<void> {
    const res = await firstValueFrom(
      this.api.post<ActiveInjury>("/api/athlete-injuries", {
        region,
        severity,
        note,
      }),
    );
    if (!res.success) {
      throw new Error(res.error ?? "Could not log tightness");
    }
    await this.load();
  }
}
