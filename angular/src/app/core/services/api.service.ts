import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";

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
  private logger = inject(LoggerService);
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

      // Check if we're in local development with Netlify Dev (port 8888)
      // This is the preferred way to access functions locally
      if (hostname === "localhost" && window.location.port === "8888") {
        return "http://localhost:8888/.netlify/functions";
      }

      // Default fallback for development: try to use the Netlify Functions on port 8888
      // even if the frontend is on 4200 (Angular default)
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        this.logger.info(
          "[ApiService] Development mode: targeting Netlify Functions on port 8888",
        );
        return "http://localhost:8888/.netlify/functions";
      }
    }

    return "/.netlify/functions";
  }

  private normalizeEndpoint(endpoint: string): string {
    // If baseUrl is /.netlify/functions, keep /api/ prefix (redirects handle it)
    // If baseUrl ends with /api, remove /api/ prefix
    if (endpoint.startsWith("/api/")) {
      if (this.baseUrl.endsWith("/api")) {
        return endpoint.replace(/^\/api/, "");
      }
      // For Netlify functions, keep the /api/ prefix - redirects will handle routing
      return endpoint;
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

  patch<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .patch<ApiResponse<T>>(url, data)
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

    this.logger.error(`[ApiService] API request failed: ${errorMessage}`);

    return throwError(() => new Error(errorMessage));
  };
}

// API Endpoints Configuration
// Note: Auth login/register/logout use Supabase directly via SupabaseService
// Only auth-me endpoint uses backend API for token verification
export const API_ENDPOINTS = {
  auth: {
    me: "/auth-me", // ✅ Exists - used for token verification
    // login/register: Use SupabaseService.signIn()/signUp() directly
    // logout: Use SupabaseService.signOut() directly
    // refresh/csrf: Not implemented - using Supabase session management
  },
  dashboard: {
    overview: "/api/dashboard/overview",
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
    statsEnhanced: "/training-stats-enhanced",
    complete: "/api/training/complete",
    suggestions: "/api/training/suggestions",
    sessions: "/api/training/sessions",
    createSession: "/api/training/sessions",
  },
  performance: {
    metrics: "/api/performance/metrics",
    trends: "/api/performance/trends",
    heatmap: "/api/performance/heatmap",
  },
  weather: {
    current: "/api/weather/current",
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
  trends: {
    changeOfDirection: "/api/trends/change-of-direction",
    sprintVolume: "/api/trends/sprint-volume",
    gamePerformance: "/api/trends/game-performance",
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
    get: "/api/performance-data/wellness",
    post: "/api/performance-data/wellness",
  },
  supplements: {
    log: "/api/supplements/log",
    get: "/api/performance-data/supplements",
    post: "/api/performance-data/supplements",
  },
  performanceData: {
    measurements: "/api/performance-data/measurements",
    performanceTests: "/api/performance-data/performance-tests",
    wellness: "/api/performance-data/wellness",
    supplements: "/api/performance-data/supplements",
    injuries: "/api/performance-data/injuries",
    trends: "/api/performance-data/trends",
    export: "/api/performance-data/export",
  },
  nutrition: {
    searchFoods: "/api/nutrition/search-foods",
    addFood: "/api/nutrition/add-food",
    goals: "/api/nutrition/goals",
    meals: "/api/nutrition/meals",
    aiSuggestions: "/api/nutrition/ai-suggestions",
    performanceInsights: "/api/nutrition/performance-insights",
  },
  recovery: {
    metrics: "/api/recovery/metrics",
    protocols: "/api/recovery/protocols",
    startSession: "/api/recovery/start-session",
    completeSession: "/api/recovery/complete-session",
    stopSession: "/api/recovery/stop-session",
    researchInsights: "/api/recovery/research-insights",
    weeklyTrends: "/api/recovery/weekly-trends",
    protocolEffectiveness: "/api/recovery/protocol-effectiveness",
  },
  admin: {
    healthMetrics: "/api/admin/health-metrics",
    syncUSDA: "/api/admin/sync-usda",
    syncResearch: "/api/admin/sync-research",
    createBackup: "/api/admin/create-backup",
    syncStatus: "/api/admin/sync-status",
    usdaStats: "/api/admin/usda-stats",
    researchStats: "/api/admin/research-stats",
  },
  health: "/api/health",
};
