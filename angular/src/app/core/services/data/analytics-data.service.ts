/**
 * Analytics Data Service
 *
 * Pure data service for analytics API calls
 * Returns Observables - no state management
 */

import { Injectable, inject } from "@angular/core";
import { Observable, interval } from "rxjs";
import { switchMap, map, shareReplay } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "../api.service";

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

export interface AnalyticsData {
  performanceTrends?: PerformanceTrendsData;
  teamChemistry?: TeamChemistryData;
  trainingDistribution?: TrainingDistributionData;
  positionPerformance?: any;
  injuryRisk?: any;
  speedDevelopment?: any;
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
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          return { labels: [], values: [] };
        }),
      );
  }

  /**
   * Get team chemistry data
   */
  getTeamChemistry(): Observable<TeamChemistryData> {
    return this.apiService
      .get<TeamChemistryData>(API_ENDPOINTS.analytics.teamChemistry)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          return { labels: [], values: [] };
        }),
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
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          return { labels: [], values: [] };
        }),
      );
  }

  /**
   * Get position performance data
   */
  getPositionPerformance(): Observable<any> {
    return this.apiService
      .get<any>(API_ENDPOINTS.analytics.positionPerformance)
      .pipe(
        map((response) =>
          response.success && response.data ? response.data : null,
        ),
      );
  }

  /**
   * Get injury risk data
   */
  getInjuryRisk(): Observable<any> {
    return this.apiService
      .get<any>(API_ENDPOINTS.analytics.injuryRisk)
      .pipe(
        map((response) =>
          response.success && response.data ? response.data : null,
        ),
      );
  }

  /**
   * Get speed development data
   */
  getSpeedDevelopment(): Observable<any> {
    return this.apiService
      .get<any>(API_ENDPOINTS.analytics.speedDevelopment)
      .pipe(
        map((response) =>
          response.success && response.data ? response.data : null,
        ),
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
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          return {};
        }),
      );
  }
}
