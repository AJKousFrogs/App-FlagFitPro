import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

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

  private static readonly SPRINT_RESTRICTING = new Set([
    "sprint",
    "high_intensity",
    "plyometric",
    "agility",
  ]);
  private static readonly SEV_RANK: Record<string, number> = {
    minor: 1,
    moderate: 2,
    severe: 3,
  };

  /** Restriction summary the engine keys on. */
  readonly restrictions = computed(() => {
    const sprintInjuries = this.active().filter((i) =>
      (i.restrictions ?? []).some((r) => InjuryService.SPRINT_RESTRICTING.has(r)),
    );
    const restrictsSprint = sprintInjuries.length > 0;
    const regions = [...new Set(sprintInjuries.map((i) => i.region).filter(Boolean))];
    const severity = sprintInjuries.reduce<InjurySeverity | null>((max, i) => {
      const s = (i.severity as InjurySeverity) ?? "minor";
      const rank = InjuryService.SEV_RANK[s] ?? 1;
      return !max || rank > (InjuryService.SEV_RANK[max] ?? 0) ? s : max;
    }, null);
    return { restrictsSprint, regions, severity };
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
  async report(region: string, severity: InjurySeverity, note?: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.post<ActiveInjury>("/api/athlete-injuries", { region, severity, note }),
    );
    if (!res.success) {
      throw new Error(res.error ?? "Could not log tightness");
    }
    await this.load();
  }
}
