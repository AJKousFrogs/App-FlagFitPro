/**
 * Analytics Data Service
 *
 * Pure data service for analytics API calls
 * Returns Observables - no state management
 */

import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../api.service";
import { extractApiPayload } from "../../utils/api-response-mapper";

export interface PerformanceTrendsData {
  labels: string[];
  values: number[];
}

export interface TeamChemistryData {
  labels: string[];
  values: number[];
}

export interface TrainingDistributionData {
  labels: string[];
  values: number[];
}

export interface PositionPerformanceData {
  position: string;
  metrics: {
    averageScore: number;
    gamesPlayed: number;
    improvementRate: number;
  };
  playersByPosition: Record<string, number>;
}

export interface InjuryRiskData {
  riskLevel: "low" | "medium" | "high";
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
}

export interface SpeedDevelopmentData {
  timeline: Array<{
    date: string;
    speed: number;
    acceleration: number;
  }>;
  improvement: {
    percentChange: number;
    trend: "improving" | "stable" | "declining";
  };
}

export interface AnalyticsData {
  performanceTrends?: PerformanceTrendsData;
  teamChemistry?: TeamChemistryData;
  trainingDistribution?: TrainingDistributionData;
  positionPerformance?: PositionPerformanceData;
  injuryRisk?: InjuryRiskData;
  speedDevelopment?: SpeedDevelopmentData;
}

@Injectable({
  providedIn: "root",
})
export class AnalyticsDataService {
  private apiService = inject(ApiService);

  /**
   * Get performance trends
   */
  getPerformanceTrends(athleteId?: string): Observable<PerformanceTrendsData> {
    return this.apiService
      .get<PerformanceTrendsData>(
        API_ENDPOINTS.analytics.performanceTrends,
        athleteId ? { athleteId } : undefined,
      )
      .pipe(
        map(
          (response) =>
            extractApiPayload<PerformanceTrendsData>(response) || {
              labels: [],
              values: [],
            },
        ),
      );
  }

  /**
   * Get team chemistry data
   */
  getTeamChemistry(): Observable<TeamChemistryData> {
    return this.apiService
      .get<TeamChemistryData>(API_ENDPOINTS.analytics.teamChemistry)
      .pipe(
        map(
          (response) =>
            extractApiPayload<TeamChemistryData>(response) || {
              labels: [],
              values: [],
            },
        ),
      );
  }

  /**
   * Get training distribution
   */
  getTrainingDistribution(): Observable<TrainingDistributionData> {
    return this.apiService
      .get<TrainingDistributionData>(
        API_ENDPOINTS.analytics.trainingDistribution,
      )
      .pipe(
        map(
          (response) =>
            extractApiPayload<TrainingDistributionData>(response) || {
              labels: [],
              values: [],
            },
        ),
      );
  }

  /**
   * Get position performance data
   */
  getPositionPerformance(): Observable<PositionPerformanceData | null> {
    return this.apiService
      .get<PositionPerformanceData>(API_ENDPOINTS.analytics.positionPerformance)
      .pipe(
        map((response) => extractApiPayload<PositionPerformanceData>(response)),
      );
  }

  /**
   * Get injury risk data
   */
  getInjuryRisk(): Observable<InjuryRiskData | null> {
    return this.apiService
      .get<InjuryRiskData>(API_ENDPOINTS.analytics.injuryRisk)
      .pipe(
        map((response) => extractApiPayload<InjuryRiskData>(response)),
      );
  }

  /**
   * Get speed development data
   */
  getSpeedDevelopment(): Observable<SpeedDevelopmentData | null> {
    return this.apiService
      .get<SpeedDevelopmentData>(API_ENDPOINTS.analytics.speedDevelopment)
      .pipe(
        map((response) => extractApiPayload<SpeedDevelopmentData>(response)),
      );
  }

  /**
   * Get all analytics data at once
   */
  getAllAnalytics(athleteId?: string): Observable<AnalyticsData> {
    return this.apiService
      .get<AnalyticsData>(
        API_ENDPOINTS.analytics.summary,
        athleteId ? { athleteId } : undefined,
      )
      .pipe(
        map((response) => extractApiPayload<AnalyticsData>(response) || {}),
      );
  }
}
