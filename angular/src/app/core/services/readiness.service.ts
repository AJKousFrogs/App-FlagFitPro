/**
 * Readiness Service
 *
 * Evidence-based readiness scoring service
 * Combines session-RPE, ACWR, wellness, and game proximity into 0-100 readiness score
 *
 * Evidence Base:
 * - Strong links between sleep duration/quality and readiness (Halson 2014, Fullagar et al. 2015)
 * - Wellness scores (mood, stress, soreness, fatigue) predict perceived performance (Saw et al. 2016)
 * - Team-sport contexts show stronger associations with self-reported wellness (McLellan et al. 2011)
 * - Simple sleep metrics can proxy broader wellness when resources are limited (Saw et al. 2016)
 *
 * Weightings (Team-Sport Optimized):
 * - Workload (ACWR): 35% - Reduced from 40% to increase wellness/sleep influence
 * - Wellness Index: 30% - Increased from 25% for team-sport contexts
 * - Sleep: 20% - Maintained (strong evidence base)
 * - Game Proximity: 15% - Maintained
 *
 * Cut-Points (Starting Points - Require Team Calibration):
 * - < 55: Low readiness → Deload
 * - 55-75: Moderate readiness → Maintain
 * - > 75: High readiness → Push
 *
 * These thresholds are starting points based on common athlete monitoring scales.
 * Teams should calibrate using their own injury/performance history over time.
 */

import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, tap, map } from "rxjs/operators";
import { ApiService } from "./api.service";
import { EvidenceConfigService } from "./evidence-config.service";
import { LoggerService } from "./logger.service";

export type ReadinessLevel = "low" | "moderate" | "high";
export type Suggestion = "deload" | "maintain" | "push";
export type DataMode = "full" | "reduced"; // Full wellness data vs sleep-proxy mode

/**
 * Wellness Index modeled on common athlete monitoring scales
 * Uses 1-5 ratings for each component (standardized from 1-10 scale)
 */
export interface WellnessIndex {
  fatigue: number; // 1-5 scale (1 = very fresh, 5 = exhausted)
  sleepQuality: number; // 1-5 scale (1 = poor, 5 = excellent)
  soreness: number; // 1-5 scale (1 = no soreness, 5 = very sore)
  mood: number; // 1-5 scale (1 = poor, 5 = excellent) - optional
  stress: number; // 1-5 scale (1 = no stress, 5 = very stressed) - optional
  energy?: number; // 1-5 scale (optional)
  subscore: number; // Calculated wellness subscore (0-100)
  completeness: number; // 0-100, percentage of wellness data available
}

/**
 * Readiness scoring configuration
 */
export interface ReadinessConfig {
  // Component weightings (team-sport optimized)
  weightings: {
    workload: number; // Default: 0.35 (35%)
    wellness: number; // Default: 0.30 (30%)
    sleep: number; // Default: 0.20 (20%)
    proximity: number; // Default: 0.15 (15%)
  };

  // Cut-points for readiness levels (starting points - require calibration)
  cutPoints: {
    lowMax: number; // Default: 55 - Below this = low readiness
    moderateMax: number; // Default: 75 - Below this = moderate readiness
    // Above moderateMax = high readiness
  };

  // Reduced data mode settings
  reducedDataMode: {
    enabled: boolean; // Default: true
    wellnessCompletenessThreshold: number; // Default: 60% - Below this, use sleep-proxy
    sleepWeightMultiplier: number; // Default: 1.5 - Increase sleep weight in reduced mode
  };

  // Wellness index settings
  wellnessIndex: {
    use1to5Scale: boolean; // Default: true - Convert 1-10 to 1-5
    requiredFields: string[]; // Default: ['fatigue', 'sleepQuality', 'soreness']
    optionalFields: string[]; // Default: ['mood', 'stress', 'energy']
  };
}

export interface ReadinessResponse {
  score: number;
  level: ReadinessLevel;
  suggestion: Suggestion;
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  dataMode: DataMode; // NEW: Full vs reduced data mode
  wellnessIndex?: WellnessIndex; // NEW: Detailed wellness index
  componentScores: {
    workload: number;
    wellness: number;
    sleep: number;
    proximity: number;
  };
  calibrationNote?: string; // NEW: Note about threshold calibration
}

export interface ReadinessHistory {
  day: string;
  score: number;
  level: ReadinessLevel;
  suggestion: Suggestion;
  acwr: number;
}

@Injectable({
  providedIn: "root",
})
export class ReadinessService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private evidenceConfigService = inject(EvidenceConfigService);
  private logger = inject(LoggerService);

  /**
   * Get default configuration from active evidence preset
   */
  private getDefaultConfigFromPreset(): ReadinessConfig {
    const evidenceConfig = this.evidenceConfigService.getReadinessConfig();

    return {
      weightings: {
        workload: evidenceConfig.weightings.workload,
        wellness: evidenceConfig.weightings.wellness,
        sleep: evidenceConfig.weightings.sleep,
        proximity: evidenceConfig.weightings.proximity,
      },
      cutPoints: {
        lowMax: evidenceConfig.cutPoints.lowMax,
        moderateMax: evidenceConfig.cutPoints.moderateMax,
      },
      reducedDataMode: {
        enabled: evidenceConfig.reducedDataMode.enabled,
        wellnessCompletenessThreshold:
          evidenceConfig.reducedDataMode.wellnessCompletenessThreshold,
        sleepWeightMultiplier:
          evidenceConfig.reducedDataMode.sleepWeightMultiplier,
      },
      wellnessIndex: {
        use1to5Scale: evidenceConfig.wellnessIndex.use1to5Scale,
        requiredFields: [...evidenceConfig.wellnessIndex.requiredFields],
        optionalFields: [...evidenceConfig.wellnessIndex.optionalFields],
      },
    };
  }

  private readonly config = signal<ReadinessConfig>(
    this.getDefaultConfigFromPreset(),
  );

  readonly loading = signal(false);
  readonly current = signal<ReadinessResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly history = signal<ReadinessHistory[]>([]);

  /**
   * Calculate readiness score for today
   * Server uses authenticated user from token - no need to send userId in body
   */
  calculateToday(_athleteId?: string): Observable<ReadinessResponse> {
    this.loading.set(true);
    this.error.set(null);

    // Let the backend derive userId from the auth token (single source of truth)
    return this.apiService
      .post<ReadinessResponse>("/api/calc-readiness", {})
      .pipe(
        map((res) => res.data || ({} as ReadinessResponse)),
        tap({
          next: (res) => {
            this.current.set(res);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.message || "Failed to calculate readiness");
            this.loading.set(false);
          },
        }),
        catchError((error) => {
          this.error.set(error.message || "Failed to calculate readiness");
          this.loading.set(false);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Calculate readiness for a specific day
   * Server uses authenticated user from token - no need to send userId in body
   */
  calculateForDay(
    _athleteId: string,
    day: string,
  ): Observable<ReadinessResponse> {
    this.loading.set(true);
    this.error.set(null);

    // Let the backend derive userId from the auth token (single source of truth)
    return this.apiService
      .post<ReadinessResponse>("/api/calc-readiness", { day })
      .pipe(
        map((res) => res.data || ({} as ReadinessResponse)),
        tap({
          next: (res) => {
            this.current.set(res);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.message || "Failed to calculate readiness");
            this.loading.set(false);
          },
        }),
        catchError((error) => {
          this.error.set(error.message || "Failed to calculate readiness");
          this.loading.set(false);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Get readiness history
   */
  getHistory(
    athleteId: string,
    days: number = 7,
  ): Observable<ReadinessHistory[]> {
    return this.apiService
      .get<ReadinessHistory[]>("/api/readiness-history", { athleteId, days })
      .pipe(
        map((res) => res.data || []),
        tap((history) => {
          this.history.set(history);
        }),
        catchError((error) => {
          this.logger.error("Error fetching readiness history:", error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Get severity color for PrimeNG Tag
   */
  getSeverity(level: ReadinessLevel): "success" | "warning" | "danger" {
    if (level === "high") return "success";
    if (level === "moderate") return "warning";
    return "danger";
  }

  /**
   * Get suggestion text
   */
  getSuggestionText(suggestion: Suggestion): string {
    const texts = {
      push: "Push day – you can tolerate higher intensity.",
      maintain: "Maintain day – keep planned workload.",
      deload: "Deload day – reduce intensity or volume.",
    };
    return texts[suggestion];
  }

  /**
   * Get score color class using evidence-based cut-points
   */
  getScoreColor(score: number): string {
    const cfg = this.config();
    if (score > cfg.cutPoints.moderateMax) return "text-green-600";
    if (score >= cfg.cutPoints.lowMax) return "text-yellow-600";
    return "text-red-600";
  }

  /**
   * Determine readiness level from score using evidence-based cut-points
   * Cut-points are starting points - teams should calibrate using their own data
   */
  getReadinessLevel(score: number): ReadinessLevel {
    const cfg = this.config();
    if (score > cfg.cutPoints.moderateMax) return "high";
    if (score >= cfg.cutPoints.lowMax) return "moderate";
    return "low";
  }

  /**
   * Get suggestion from score using evidence-based cut-points
   */
  getSuggestion(score: number): Suggestion {
    const cfg = this.config();
    if (score > cfg.cutPoints.moderateMax) return "push";
    if (score >= cfg.cutPoints.lowMax) return "maintain";
    return "deload";
  }

  /**
   * Get calibration note explaining that thresholds are starting points
   */
  getCalibrationNote(): string {
    const cfg = this.config();
    return (
      `Readiness thresholds (Low: <${cfg.cutPoints.lowMax}, Moderate: ${cfg.cutPoints.lowMax}-${cfg.cutPoints.moderateMax}, High: >${cfg.cutPoints.moderateMax}) ` +
      `are evidence-based starting points. Teams should calibrate these thresholds using their own ` +
      `injury and performance history over time for optimal accuracy.`
    );
  }

  /**
   * Update readiness configuration (for personalization/calibration)
   */
  updateConfig(config: Partial<ReadinessConfig>): void {
    this.config.set({ ...this.config(), ...config });
  }

  /**
   * Get current configuration
   */
  getConfig(): ReadinessConfig {
    return this.config();
  }

  /**
   * Reset to default configuration (from active evidence preset)
   */
  resetConfig(): void {
    this.config.set(this.getDefaultConfigFromPreset());
  }

  /**
   * Get evidence citation information for current configuration
   */
  getEvidenceInfo(): {
    preset: string;
    citations: Array<{
      authors: string;
      year: number;
      title: string;
      doi?: string;
    }>;
    scienceNotes: {
      weightings: string;
      cutPoints: string;
      coachOverride: string;
    };
  } {
    const preset = this.evidenceConfigService.getActivePreset();
    const readinessConfig = preset.readiness;

    return {
      preset: `${preset.name} (${preset.version})`,
      citations: readinessConfig.citations.map((c) => ({
        authors: c.authors,
        year: c.year,
        title: c.title,
        doi: c.doi || "",
      })),
      scienceNotes: {
        weightings: readinessConfig.scienceNotes.weightings,
        cutPoints: readinessConfig.scienceNotes.cutPoints,
        coachOverride: readinessConfig.scienceNotes.coachOverride,
      },
    };
  }
}
