/**
 * Evidence Configuration Service
 *
 * Manages active evidence preset and provides access to evidence-based configurations.
 * Tracks preset usage and allows for preset switching.
 */

import { Injectable, effect, inject, signal, computed } from "@angular/core";
import { EvidencePreset } from "../config/evidence-config";
import {
  getPresetById,
  getDefaultPreset,
  getAllPresets,
  derivePresetId,
} from "../config/evidence-presets";
import { ageYearsFromUserMetadata } from "../utils/age-years.util";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

@Injectable({
  providedIn: "root",
})
export class EvidenceConfigService {
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);

  /**
   * Cohort assignment is DERIVED, not selected (2026-07-14, audit §4.1 —
   * this un-orphans the youth/RTP presets, which had zero setPreset callers
   * since creation, and adds the masters preset):
   *   active RTP protocol → return_to_play_v1 (highest precedence)
   *   age < 18            → youth_flag_v1
   *   age ≥ 35            → masters_flag_v1
   *   else / unknown age  → adult_flag_competitive_v1 (the server baseline)
   * The safe-direction rule holds: every non-adult cohort only TIGHTENS
   * thresholds vs the population-blind backend (LOGIC §10). An explicit
   * setActivePreset() call (coach override) still wins over the derivation.
   */
  private readonly hasActiveRtp = signal<boolean>(false);
  private readonly manualOverrideId = signal<string | null>(null);

  private readonly derivedPresetId = computed<string>(() => {
    const user = this.supabase.currentUser?.();
    const age = ageYearsFromUserMetadata(
      (user?.user_metadata ?? {}) as Record<string, unknown>,
    );
    return derivePresetId(age, this.hasActiveRtp());
  });

  private readonly activePresetId = computed<string>(
    () => this.manualOverrideId() ?? this.derivedPresetId(),
  );

  // Active preset
  readonly activePreset = computed<EvidencePreset>(() => {
    const presetId = this.activePresetId();
    return getPresetById(presetId) || getDefaultPreset();
  });

  constructor() {
    // Auth-reactive (2026-07-15 audit fix): a constructor-only query missed
    // logins that happen AFTER service construction — an RTP athlete stayed
    // age-cohorted until a reload. The effect re-queries whenever the signed-in
    // user changes; until it lands the derivation runs on age alone (adult
    // default — the safe baseline).
    effect(() => {
      const userId = this.supabase.userId?.();
      if (userId) {
        void this.refreshRtpState();
      } else {
        this.hasActiveRtp.set(false);
      }
    });
  }

  /** Re-query the active return-to-play state (call after RTP changes). */
  async refreshRtpState(): Promise<void> {
    try {
      const userId = this.supabase.userId?.();
      if (!userId) return;
      const { data, error } = await this.supabase.client
        .from("return_to_play_protocols")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1);
      if (!error) {
        this.hasActiveRtp.set((data ?? []).length > 0);
      }
    } catch {
      /* cohort stays age-derived — never blocks anything */
    }
  }

  // All available presets
  readonly availablePresets = signal<EvidencePreset[]>(getAllPresets());

  /**
   * Get active preset
   */
  getActivePreset(): EvidencePreset {
    return this.activePreset();
  }

  /**
   * Set active preset
   */
  setActivePreset(presetId: string): boolean {
    const preset = getPresetById(presetId);
    if (preset) {
      // Manual override wins over the derived cohort until cleared.
      this.manualOverrideId.set(presetId);
      // Log preset change for analytics
      this.logPresetChange(presetId);
      return true;
    }
    return false;
  }

  /** Clear a manual override — the derived cohort takes over again. */
  clearPresetOverride(): void {
    this.manualOverrideId.set(null);
  }

  /**
   * Get ACWR config from active preset
   */
  getACWRConfig() {
    return this.activePreset().acwr;
  }

  /**
   * Get Readiness config from active preset
   */
  getReadinessConfig() {
    return this.activePreset().readiness;
  }

  /**
   * Get Tapering config from active preset
   */
  getTaperingConfig() {
    return this.activePreset().tapering;
  }

  /**
   * Get Injury-Prevention evidence from active preset (optional section —
   * undefined for presets that don't define it, e.g. youth/RTP/masters until
   * they add one). Evidence-only: no numeric protocol values live here.
   */
  getInjuryPreventionEvidence() {
    return this.activePreset().injuryPrevention ?? null;
  }

  /**
   * Get game-day environment evidence (playing surface, cramping) from the
   * active preset. Optional section — null for presets that don't define one.
   * Evidence-only: no numeric protocol values live here.
   */
  getGameDayEnvironmentEvidence() {
    return this.activePreset().gameDayEnvironment ?? null;
  }

  /**
   * Log preset change (for analytics/calibration)
   */
  private logPresetChange(presetId: string): void {
    // Structured log only. The former Supabase write targeted `user_activity_logs`,
    // a table that does not exist in the live schema (the insert was try/caught into
    // a no-op) — removed 2026-07-13 to kill the frontend↔DB drift. If preset-change
    // analytics are ever needed, add a real table + endpoint first.
    this.logger.info("evidence_config_preset_changed", { presetId });
  }
}
