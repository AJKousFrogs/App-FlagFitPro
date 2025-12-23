/**
 * Dashboard Data Service
 *
 * Pure data service - handles API calls only
 * No state management, returns Observables
 *
 * Pattern: Data Services handle API/Netlify function calls
 * View Models handle state management using signals
 */

import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "../api.service";

export interface DashboardStats {
  totalSessions: number;
  performanceScore: number;
  weeklyLoad: number;
  acwr: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: any[];
  upcomingSessions: any[];
  performanceChart: any;
  trainingChart: any;
}

@Injectable({
  providedIn: "root",
})
export class DashboardDataService {
  private apiService = inject(ApiService);

  /**
   * Get dashboard overview data
   * Pure data fetching - returns Observable
   */
  getDashboard(): Observable<DashboardData> {
    return this.apiService
      .get<DashboardData>(API_ENDPOINTS.dashboard.overview)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          // Return default structure if API fails
          return this.getDefaultDashboard();
        }),
      );
  }

  /**
   * Get training calendar data
   */
  getTrainingCalendar(): Observable<any[]> {
    return this.apiService
      .get<any[]>(API_ENDPOINTS.dashboard.trainingCalendar)
      .pipe(
        map((response) =>
          response.success && response.data ? response.data : [],
        ),
      );
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit: number = 10): Observable<any[]> {
    return this.apiService
      .get<any[]>(API_ENDPOINTS.dashboard.overview, { activityLimit: limit })
      .pipe(
        map((response) => {
          if (response.success && response.data?.recentActivity) {
            return response.data.recentActivity;
          }
          return [];
        }),
      );
  }

  /**
   * Get upcoming sessions
   */
  getUpcomingSessions(limit: number = 5): Observable<any[]> {
    return this.apiService
      .get<
        any[]
      >(API_ENDPOINTS.dashboard.trainingCalendar, { upcoming: true, limit })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return Array.isArray(response.data) ? response.data : [];
          }
          return [];
        }),
      );
  }

  /**
   * Default dashboard structure for fallback
   */
  private getDefaultDashboard(): DashboardData {
    return {
      stats: {
        totalSessions: 0,
        performanceScore: 0,
        weeklyLoad: 0,
        acwr: 0,
      },
      recentActivity: [],
      upcomingSessions: [],
      performanceChart: null,
      trainingChart: null,
    };
  }
}
