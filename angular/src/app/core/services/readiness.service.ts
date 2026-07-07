/**
 * Readiness Service
 *
 * Thin client for `/api/calc-readiness` and `/api/readiness-history`.
 *
 * v11 contract (architecture doc §6 item 6): the **server is canonical** for
 * readiness scoring. The Netlify function (`netlify/functions/calc-readiness.js`)
 * is the only place that computes a score, applies cut-points, picks a
 * suggestion, and writes the calibration note. Clients are read-through.
 *
 * Display helpers used to live here (level / suggestion / severity / score
 * color / calibration note) and recomputed those values from a separate local
 * `ReadinessConfig` signal — that drifted from the server's cut-points and
 * had no consumers. Removed in favor of reading `current().level`,
 * `current().suggestion`, and `current().calibrationNote` directly off the
 * server response.
 */

import { Injectable, inject, signal } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, finalize, map, tap } from "rxjs";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { LoggerService } from "./logger.service";
import { getErrorMessage } from "../../shared/utils/error.utils";
import {
  extractApiArray,
  extractApiPayload,
} from "../utils/api-response-mapper";

export type ReadinessLevel = "low" | "moderate" | "high";
// The three training recommendations the calibration log records...
export type TrainingRecommendation = "deload" | "maintain" | "push";
// ...plus "log_wellness", which the API returns as a UI prompt (score=null) when
// no wellness check-in exists yet. It is NOT a training recommendation, so it must
// never be sent to /api/calibration-logs (the backend 422s anything outside the
// three values above). Keeping it in the union stops the type from lying.
export type Suggestion = TrainingRecommendation | "log_wellness";

const TRAINING_RECOMMENDATIONS: readonly TrainingRecommendation[] = [
  "deload",
  "maintain",
  "push",
];
export type DataMode = "full" | "reduced"; // Full wellness data vs sleep-proxy mode

/**
 * Wellness Index modeled on common athlete monitoring scales (1-5 ratings).
 * Computed by the server; clients read it from `ReadinessResponse.wellnessIndex`.
 */
export interface WellnessIndex {
  fatigue: number;
  sleepQuality: number;
  soreness: number;
  mood: number;
  stress: number;
  energy?: number;
  /** 0-100 wellness subscore. */
  subscore: number;
  /** 0-100, percentage of wellness data available. */
  completeness: number;
}

export interface ReadinessResponse {
  score: number;
  level: ReadinessLevel;
  suggestion: Suggestion;
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  dataMode: DataMode;
  wellnessIndex?: WellnessIndex;
  componentScores: {
    workload: number;
    wellness: number;
    sleep: number;
    proximity: number;
  };
  calibrationNote?: string;
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
  private logger = inject(LoggerService);

  readonly loading = signal(false);
  readonly current = signal<ReadinessResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly history = signal<ReadinessHistory[]>([]);
  // Monotonic token guarding calculateToday() against out-of-order responses —
  // today.component.ts and wellness.component.ts can both trigger a recalc in
  // close succession; without this, a slower-but-earlier request could resolve
  // after a newer one and overwrite the fresher readiness score with a stale one.
  private calcRequestSeq = 0;

  /**
   * Calculate readiness score for today.
   * Server uses authenticated user from token — no need to send userId in body.
   */
  getHistory(_athleteId: string, days = 7): Observable<ReadinessHistory[]> {
    return this.apiService
      .get<ReadinessHistory[]>(`/api/readiness-history?days=${days}`)
      .pipe(
        map((response) => extractApiArray<ReadinessHistory>(response) ?? []),
        tap((history) => this.history.set(history)),
        catchError((error) => {
          this.logger.error("Failed to load readiness history", error);
          return throwError(() => error);
        }),
      );
  }

  calculateToday(_athleteId?: string): Observable<ReadinessResponse> {
    this.loading.set(true);
    this.error.set(null);
    const requestId = ++this.calcRequestSeq;

    return this.apiService
      .post<ReadinessResponse>("/api/calc-readiness", {})
      .pipe(
        map(
          (response) =>
            extractApiPayload<ReadinessResponse>(response) ||
            ({} as ReadinessResponse),
        ),
        tap((res) => {
          // Only the most recently-started request may update `current` — an
          // older, slower request must never clobber a newer response.
          if (requestId === this.calcRequestSeq) {
            this.current.set(res);
          }
          this.logCalibration(res);
        }),
        catchError((error) => {
          if (requestId === this.calcRequestSeq) {
            this.error.set(
              getErrorMessage(error, "Failed to calculate readiness"),
            );
          }
          return throwError(() => error);
        }),
        finalize(() => {
          if (requestId === this.calcRequestSeq) {
            this.loading.set(false);
          }
        }),
      );
  }

  /**
   * Fire-and-forget: record the deload/maintain/push recommendation that was shown to
   * the athlete so the server can later correlate it with outcomes and calibrate the
   * readiness model. POST /api/calibration-logs (athleteId defaults to the authed user
   * server-side). Never blocks or fails the readiness calc.
   */
  private logCalibration(res: ReadinessResponse): void {
    // Only log an actual training recommendation. When wellness data is missing
    // the API returns suggestion="log_wellness" (a UI prompt, score=null) — sending
    // that to /api/calibration-logs returns 422, so skip it.
    if (
      !res?.suggestion ||
      !TRAINING_RECOMMENDATIONS.includes(
        res.suggestion as TrainingRecommendation,
      )
    ) {
      return;
    }
    this.apiService
      .post(API_ENDPOINTS.calibration.logs, {
        recommendation: {
          type: res.suggestion,
          readinessScore: res.score,
          acwr: res.acwr,
          rationale: res.calibrationNote ?? null,
        },
      })
      .subscribe({ error: () => undefined });
  }
}
