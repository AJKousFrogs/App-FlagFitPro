/**
 * Readiness Service
 *
 * Thin client for `/api/calc-readiness` and `/api/readiness-history`.
 *
 * v10 contract (architecture doc §6 item 6): the **server is canonical** for
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
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { getErrorMessage } from "../../shared/utils/error.utils";
import {
  extractApiArray,
  extractApiPayload,
} from "../utils/api-response-mapper";

export type ReadinessLevel = "low" | "moderate" | "high";
export type Suggestion = "deload" | "maintain" | "push";
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

  /**
   * Calculate readiness score for today.
   * Server uses authenticated user from token — no need to send userId in body.
   */
  calculateToday(_athleteId?: string): Observable<ReadinessResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService
      .post<ReadinessResponse>("/api/calc-readiness", {})
      .pipe(
        map(
          (response) =>
            extractApiPayload<ReadinessResponse>(response) ||
            ({} as ReadinessResponse),
        ),
        tap((res) => this.current.set(res)),
        catchError((error) => {
          this.error.set(getErrorMessage(error, "Failed to calculate readiness"));
          return throwError(() => error);
        }),
        finalize(() => this.loading.set(false)),
      );
  }

}
