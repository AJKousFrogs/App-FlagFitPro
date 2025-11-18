import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { environment } from "../../../environments/environment";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = this.getApiBaseUrl();

  private getApiBaseUrl(): string {
    // Check environment configuration first
    if (environment.apiUrl && environment.apiUrl !== "mock://api") {
      return environment.apiUrl;
    }

    // Auto-detect based on hostname
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (
        hostname.includes("netlify.app") ||
        hostname.includes("netlify.com")
      ) {
        return window.location.origin + "/.netlify/functions";
      }

      if (hostname === "localhost" && window.location.port === "8888") {
        return "http://localhost:8888/.netlify/functions";
      }

      // For localhost, try to use backend server on port 3001
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:3001";
      }
    }

    return "http://localhost:3001";
  }

  private normalizeEndpoint(endpoint: string): string {
    if (endpoint.startsWith("/api/") && this.baseUrl.endsWith("/api")) {
      return endpoint.replace(/^\/api/, "");
    }
    return endpoint;
  }

  get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .get<ApiResponse<T>>(url, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .post<ApiResponse<T>>(url, data)
      .pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .put<ApiResponse<T>>(url, data)
      .pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .delete<ApiResponse<T>>(url)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: any): Observable<never> => {
    let errorMessage = "An unknown error occurred";

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage =
        error.error?.error ||
        error.error?.message ||
        `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    // Fallback to mock API in development
    if (this.baseUrl.includes("localhost") || this.baseUrl === "mock://api") {
      console.debug("API server not available, using mock data");
    }

    return throwError(() => new Error(errorMessage));
  };
}

// API Endpoints Configuration
export const API_ENDPOINTS = {
  auth: {
    login: "/auth-login",
    register: "/auth-register",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    me: "/auth-me",
    csrf: "/api/auth/csrf",
  },
  dashboard: {
    overview: "/dashboard",
    trainingCalendar: "/api/dashboard/training-calendar",
    olympicQualification: "/api/dashboard/olympic-qualification",
    sponsorRewards: "/api/dashboard/sponsor-rewards",
    wearables: "/api/dashboard/wearables",
    teamChemistry: "/api/dashboard/team-chemistry",
    notifications: "/api/dashboard/notifications",
    dailyQuote: "/api/dashboard/daily-quote",
    health: "/api/dashboard/health",
  },
  training: {
    stats: "/training-stats",
    complete: "/api/training/complete",
  },
  analytics: {
    performanceTrends: "/api/analytics/performance-trends",
    teamChemistry: "/api/analytics/team-chemistry",
    trainingDistribution: "/api/analytics/training-distribution",
    positionPerformance: "/api/analytics/position-performance",
    injuryRisk: "/api/analytics/injury-risk",
    speedDevelopment: "/api/analytics/speed-development",
    userEngagement: "/api/analytics/user-engagement",
    summary: "/api/analytics/summary",
    health: "/api/analytics/health",
  },
  coach: {
    dashboard: "/api/coach/dashboard",
    team: "/api/coach/team",
    trainingAnalytics: "/api/coach/training-analytics",
    createTrainingSession: "/api/coach/training-session",
    games: "/api/coach/games",
    health: "/api/coach/health",
  },
  community: {
    feed: "/api/community/feed",
    createPost: "/api/community/posts",
    getComments: (postId: string) => `/api/community/posts/${postId}/comments`,
    likePost: (postId: string) => `/api/community/posts/${postId}/like`,
    leaderboard: "/api/community/leaderboard",
    challenges: "/api/community/challenges",
    health: "/api/community/health",
  },
  tournaments: {
    list: "/api/tournaments",
    details: (tournamentId: string) => `/api/tournaments/${tournamentId}`,
    register: (tournamentId: string) =>
      `/api/tournaments/${tournamentId}/register`,
    bracket: (tournamentId: string) =>
      `/api/tournaments/${tournamentId}/bracket`,
    health: "/api/tournaments/health",
  },
  knowledge: {
    search: "/knowledge-search",
    entry: (topic: string) => `/knowledge-search?topic=${topic}`,
    articles: "/knowledge-search",
  },
  wellness: {
    checkin: "/api/wellness/checkin",
  },
  supplements: {
    log: "/api/supplements/log",
  },
  health: "/api/health",
};
