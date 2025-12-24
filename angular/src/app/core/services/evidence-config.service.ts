/**
 * Evidence Configuration Service
 *
 * Manages active evidence preset and provides access to evidence-based configurations.
 * Tracks preset usage and allows for preset switching.
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { EvidencePreset } from "../config/evidence-config";
import {
  getPresetById,
  getDefaultPreset,
  getAllPresets,
} from "../config/evidence-presets";
import { LoggerService } from "./logger.service";

@Injectable({
  providedIn: "root",
})
export class EvidenceConfigService {
  private logger = inject(LoggerService);

  // Active preset ID
  private readonly activePresetId = signal<string>("adult_flag_competitive_v1");

  // Active preset
  readonly activePreset = computed<EvidencePreset>(() => {
    const presetId = this.activePresetId();
    return getPresetById(presetId) || getDefaultPreset();
  });

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
      this.activePresetId.set(presetId);
      // Log preset change for analytics
      this.logPresetChange(presetId);
      return true;
    }
    return false;
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
   * Log preset change (for analytics/calibration)
   */
  private logPresetChange(presetId: string): void {
    // See issue #21 - Implement backend logging service
    this.logger.info(`[EvidenceConfig] Preset changed to: ${presetId}`);
  }
}
