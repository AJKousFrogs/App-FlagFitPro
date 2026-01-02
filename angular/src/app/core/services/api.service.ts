import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";

export interface ApiResponse<T = unknown> {
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

  constructor() {
    console.log(`[ApiService] Initialized with baseUrl: ${this.baseUrl}`);
  }

  private getApiBaseUrl(): string {
    // Check environment configuration first
    if (environment.apiUrl) {
      return environment.apiUrl;
    }

    // Auto-detect based on hostname
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      // Production: Netlify deployment
      if (
        hostname.includes("netlify.app") ||
        hostname.includes("netlify.com")
      ) {
        return window.location.origin;
      }

      // Local development: use the local Node server
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        // Use port 4000 for local development (matches server.js)
        this.logger.info(
          "[ApiService] Development mode: targeting local server on port 4000",
        );
        return "http://localhost:4000";
      }
    }

    // Default: use relative paths (same origin)
    return "";
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

  get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .get<ApiResponse<T>>(url, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  post<T = unknown>(
    endpoint: string,
    data?: unknown,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    this.logger.info(`[ApiService] POST ${url}`);

    return this.http
      .post<ApiResponse<T>>(url, data)
      .pipe(catchError(this.handleError));
  }

  put<T = unknown>(
    endpoint: string,
    data?: unknown,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .put<ApiResponse<T>>(url, data)
      .pipe(catchError(this.handleError));
  }

  patch<T = unknown>(
    endpoint: string,
    data?: unknown,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .patch<ApiResponse<T>>(url, data)
      .pipe(catchError(this.handleError));
  }

  delete<T = unknown>(endpoint: string): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http
      .delete<ApiResponse<T>>(url)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: unknown): Observable<never> => {
    let errorMessage = "An unknown error occurred";

    if (error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.message}`;
    } else if (error && typeof error === "object" && "error" in error) {
      const httpError = error as {
        error?: {
          error?: string;
          message?: string;
        };
        status?: number;
        message?: string;
      };
      errorMessage =
        httpError.error?.error ||
        httpError.error?.message ||
        `Error Code: ${httpError.status}\nMessage: ${httpError.message}`;
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
    // Annual Training Programs (Database-driven)
    programs: "/api/training-programs",
    programPhases: "/api/training-programs/phases",
    programWeeks: "/api/training-programs/weeks",
    programSessions: "/api/training-programs/sessions",
    programExercises: "/api/training-programs/exercises",
    programCurrentWeek: "/api/training-programs/current-week",
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
    latest: "/api/wellness/latest",
    checkins: "/api/wellness/checkins",
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
  // Load Management endpoints
  loadManagement: {
    acwr: "/api/load-management/acwr",
    monotony: "/api/load-management/monotony",
    tsb: "/api/load-management/tsb",
    injuryRisk: "/api/load-management/injury-risk",
    trainingLoads: "/api/load-management/training-loads",
  },
  // Readiness endpoints
  readiness: {
    calculate: "/api/calc-readiness",
    history: "/api/readiness-history",
  },
  // Games endpoints
  games: {
    list: "/api/games",
    create: "/api/games",
    details: (gameId: string) => `/api/games/${gameId}`,
    update: (gameId: string) => `/api/games/${gameId}`,
    stats: (gameId: string) => `/api/games/${gameId}/stats`,
    plays: (gameId: string) => `/api/games/${gameId}/plays`,
  },
  // Player Stats endpoints
  playerStats: {
    aggregated: "/api/player-stats",
    dateRange: "/api/player-stats/date-range",
  },
  // Fixtures
  fixtures: "/api/fixtures",
  // Health check
  health: "/api/health",
  // API documentation
  apiDocs: "/api/api-docs",
  // AI Chat endpoints (with safety tiers)
  aiChat: {
    send: "/api/ai/chat",
    session: (sessionId: string) => `/api/ai/chat/session/${sessionId}`,
    feedback: "/api/ai/feedback",
  },
  // Attendance endpoints
  attendance: {
    events: "/api/attendance/events",
    createEvent: "/api/attendance/events",
    eventDetails: (eventId: string) => `/api/attendance/events/${eventId}`,
    eventAttendance: (eventId: string) =>
      `/api/attendance/events/${eventId}/attendance`,
    record: "/api/attendance/record",
    recordBulk: "/api/attendance/record/bulk",
    playerStats: (playerId: string) =>
      `/api/attendance/stats/player/${playerId}`,
    teamStats: (teamId: string) => `/api/attendance/stats/team/${teamId}`,
    absenceRequest: "/api/attendance/absence-request",
    absenceRequests: "/api/attendance/absence-requests",
  },
  // Depth Chart endpoints
  depthChart: {
    templates: "/api/depth-chart/templates",
    templateDetails: (templateId: string) =>
      `/api/depth-chart/templates/${templateId}`,
    templateHistory: (templateId: string) =>
      `/api/depth-chart/templates/${templateId}/history`,
    unassigned: (templateId: string) =>
      `/api/depth-chart/templates/${templateId}/unassigned`,
    entries: "/api/depth-chart/entries",
    entry: (entryId: string) => `/api/depth-chart/entries/${entryId}`,
    swap: "/api/depth-chart/entries/swap",
    initialize: "/api/depth-chart/initialize",
  },
  // Equipment endpoints
  equipment: {
    items: "/api/equipment/items",
    item: (itemId: string) => `/api/equipment/items/${itemId}`,
    itemHistory: (itemId: string) => `/api/equipment/items/${itemId}/history`,
    assignments: "/api/equipment/assignments",
    playerAssignments: (playerId: string) =>
      `/api/equipment/player/${playerId}/assignments`,
    checkout: "/api/equipment/checkout",
    checkoutBulk: "/api/equipment/checkout/bulk",
    return: "/api/equipment/return",
    summary: (teamId: string) => `/api/equipment/summary/${teamId}`,
    alerts: (teamId: string) => `/api/equipment/alerts/${teamId}`,
  },
  // Officials endpoints
  officials: {
    list: "/api/officials",
    details: (officialId: string) => `/api/officials/${officialId}`,
    games: (officialId: string) => `/api/officials/${officialId}/games`,
    availability: (officialId: string) =>
      `/api/officials/${officialId}/availability`,
    available: "/api/officials/available",
    schedule: "/api/officials/schedule",
    gameOfficials: (gameId: string) => `/api/officials/game/${gameId}`,
    assignment: (assignmentId: string) =>
      `/api/officials/assignments/${assignmentId}`,
    paymentSummary: "/api/officials/payments/summary",
  },
  // Push Notification endpoints
  push: {
    register: "/api/push/register",
    unregister: "/api/push/unregister",
    preferences: "/api/push/preferences",
    devices: "/api/push/devices",
    device: (tokenId: string) => `/api/push/devices/${tokenId}`,
    test: "/api/push/test",
  },
};
