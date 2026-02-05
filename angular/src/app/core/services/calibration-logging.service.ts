/**
 * Calibration Logging Service
 *
 * Logs training recommendations alongside outcomes for real-world calibration.
 * Tracks:
 * - System recommendations (deload/maintain/push)
 * - Subsequent outcomes (injury flags, performance ratings, session quality)
 *
 * Over time, this allows fitting simple internal models showing whether
 * thresholds are conservative or aggressive for actual users.
 */

import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map } from "rxjs";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { LoggerService } from "./logger.service";

export interface CalibrationLogEntry {
  athleteId: string;
  timestamp: Date;

  // System recommendation
  recommendation: {
    type: "deload" | "maintain" | "push";
    readinessScore: number;
    acwr: number;
    rationale: string;
  };

  // Context
  context: {
    presetId: string;
    presetVersion: string;
    phase?: string;
    daysUntilEvent?: number;
    eventImportance?: string;
  };

  // Outcomes (filled in later)
  outcomes?: {
    injuryFlagged: boolean;
    injuryDate?: Date;
    injuryType?: string;
    performanceRating?: number; // 1-10 scale
    sessionQuality?: number; // 1-10 scale
    subjectiveFeedback?: string;
    recordedAt?: Date;
  };
}

@Injectable({
  providedIn: "root",
})
export class CalibrationLoggingService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // Local cache of recent logs (for offline support)
  private localLogCache: CalibrationLogEntry[] = [];

  /**
   * Log a training recommendation
   */
  logRecommendation(
    entry: Omit<CalibrationLogEntry, "outcomes">,
  ): Observable<void> {
    // Add to local cache
    this.localLogCache.push({
      ...entry,
      outcomes: undefined,
    });

    // Send to backend (async, don't block)
    this.apiService.post(API_ENDPOINTS.calibration.logs, entry).subscribe({
      next: () => {
        this.logger.info(
          "[CalibrationLogging] Recommendation logged:",
          entry.recommendation.type,
        );
      },
      error: (err) => {
        this.logger.error(
          "[CalibrationLogging] Failed to log recommendation:",
          err,
        );
        // Keep in local cache for retry
      },
    });

    return of(undefined);
  }

  /**
   * Log outcome for a previous recommendation
   */
  logOutcome(
    athleteId: string,
    timestamp: Date,
    outcomes: CalibrationLogEntry["outcomes"],
  ): Observable<void> {
    const entry: Partial<CalibrationLogEntry> = {
      athleteId,
      timestamp,
      outcomes: {
        injuryFlagged: false, // Default to false if not provided
        ...outcomes,
        recordedAt: new Date(),
      },
    };

    // Update local cache if exists
    const cachedIndex = this.localLogCache.findIndex(
      (e) =>
        e.athleteId === athleteId &&
        Math.abs(e.timestamp.getTime() - timestamp.getTime()) <
          24 * 60 * 60 * 1000, // Within 24 hours
    );

    if (cachedIndex >= 0) {
      this.localLogCache[cachedIndex].outcomes = entry.outcomes;
    }

    // Send to backend
    this.apiService.post(API_ENDPOINTS.calibration.outcome, entry).subscribe({
      next: () => {
        this.logger.info("[CalibrationLogging] Outcome logged");
      },
      error: (err) => {
        this.logger.error("[CalibrationLogging] Failed to log outcome:", err);
      },
    });

    return of(undefined);
  }

  /**
   * Get calibration statistics for an athlete
   */
  getCalibrationStats(athleteId: string): Observable<CalibrationStats> {
    return this.apiService
      .get(`/api/calibration-logs/stats/${athleteId}`)
      .pipe(map((response) => response.data as CalibrationStats));
  }

  /**
   * Get calibration statistics for a preset
   */
  getPresetCalibrationStats(
    presetId: string,
  ): Observable<PresetCalibrationStats> {
    return this.apiService
      .get(`/api/calibration-logs/preset-stats/${presetId}`)
      .pipe(map((response) => response.data as PresetCalibrationStats));
  }
}

/** Calibration statistics for an athlete */
interface CalibrationStats {
  totalRecommendations: number;
  recommendationsByType: {
    deload: number;
    maintain: number;
    push: number;
  };
  outcomesRecorded: number;
  injuryRate: {
    deload: number;
    maintain: number;
    push: number;
  };
  averagePerformanceRating: {
    deload: number;
    maintain: number;
    push: number;
  };
}

/** Preset calibration statistics */
interface PresetCalibrationStats {
  presetId: string;
  totalRecommendations: number;
  thresholdEffectiveness: {
    lowReadinessThreshold: number;
    injuryRateBelowThreshold: number;
    injuryRateAboveThreshold: number;
    recommendation: "conservative" | "optimal" | "aggressive";
  };
}
