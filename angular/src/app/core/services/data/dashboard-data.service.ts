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

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  description?: string;
}

export interface UpcomingSession {
  id: string;
  title: string;
  date: string;
  type: string;
  duration?: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  upcomingSessions: UpcomingSession[];
  performanceChart: ChartData | null;
  trainingChart: ChartData | null;
}

interface DashboardResponse {
  recentActivity?: ActivityItem[];
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
  getTrainingCalendar(): Observable<UpcomingSession[]> {
    return this.apiService
      .get<UpcomingSession[]>(API_ENDPOINTS.dashboard.trainingCalendar)
      .pipe(
        map((response) =>
          response.success && response.data ? response.data : [],
        ),
      );
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit: number = 10): Observable<ActivityItem[]> {
    return this.apiService
      .get<DashboardResponse>(API_ENDPOINTS.dashboard.overview, { activityLimit: limit })
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
  getUpcomingSessions(limit: number = 5): Observable<UpcomingSession[]> {
    return this.apiService
      .get<UpcomingSession[]>(API_ENDPOINTS.dashboard.trainingCalendar, { upcoming: true, limit })
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
