import { Injectable, computed, inject, resource } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
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
 *
 * Follows the `resource()` convention in `core/services/README.md`. Loads
 * eagerly on the signed-in user: the engine reads {@link restrictions} on every
 * plan, so this is not an opt-in lane.
 *
 * Keying on userId also removed a coupling rather than working around it.
 * PeriodizationService used to reach in and clear this service's state on
 * logout (`this.injury.active.set([])`) and force a load on sign-in. With the
 * user in the resource key both happen on their own — logout drives userId to
 * null, the loader short-circuits, and `active` empties. `active` is now a
 * computed (read-only), which is what every consumer already treated it as.
 */
@Injectable({ providedIn: "root" })
export class InjuryService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);

  private readonly injuriesResource = resource({
    params: () => this.supabase.userId(),
    loader: async ({ params: userId }) => {
      if (!userId) return [];
      try {
        const res = await firstValueFrom(
          this.api.get<{ injuries: ActiveInjury[] }>("/api/athlete-injuries"),
        );
        if (res.success && res.data) return res.data.injuries ?? [];
        throw new Error(res.error ?? "Could not load injuries");
      } catch (err) {
        this.logger.error("injuries_load_failed", err);
        throw err instanceof Error ? err : new Error("Could not load injuries");
      }
    },
  });

  /**
   * Currently-flagged injuries. `[]` until loaded, on logout, and on a failed
   * load — the pre-resource service also left this empty on failure, so the
   * engine's injury guard fails OPEN exactly as before. Changing that is a
   * safety call, not a refactor.
   */
  readonly active = computed<ActiveInjury[]>(() =>
    this.injuriesResource.hasValue() ? this.injuriesResource.value() : [],
  );
  readonly loading = this.injuriesResource.isLoading;

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

  /** Force a refetch (fire-and-forget). */
  load(): void {
    this.injuriesResource.reload();
  }

  /**
   * Refetch and AWAIT the fresh list before resolving.
   *
   * Deliberately not `reload()`: this feeds the engine's injury guard, and
   * `report()`'s pre-resource contract was that it resolved only once the new
   * state was in. Keeping the stronger guarantee on a safety path is worth one
   * hand-rolled fetch — same reasoning (and shape) as `schedule#refresh`.
   */
  private async refreshNow(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.api.get<{ injuries: ActiveInjury[] }>("/api/athlete-injuries"),
      );
      if (res.success && res.data) {
        this.injuriesResource.value.set(res.data.injuries ?? []);
      }
    } catch (err) {
      this.logger.error("injuries_load_failed", err);
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
    await this.refreshNow();
  }
}
