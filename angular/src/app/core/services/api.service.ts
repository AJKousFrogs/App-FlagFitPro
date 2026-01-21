import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";
import { type MinimalSchema, validateApiResponse } from "../schemas/api-response.schema";
import { ApiResponse } from "../models/common.models";

/**
 * Options for API requests with optional schema validation.
 */
export interface ApiRequestOptions<T> {
  /** Schema to validate response data against */
  schema?: MinimalSchema<T>;
  /** Whether to throw on validation failure (default: true) */
  throwOnValidationError?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private baseUrl = this.getApiBaseUrl();

  constructor() {
    this.logger.info(`[ApiService] Initialized with baseUrl: ${this.baseUrl}`);
  }

  private getApiBaseUrl(): string {
    // Check environment configuration first (includes auto-detection from environment.ts)
    if (environment.apiUrl) {
      this.logger.info(
        `[ApiService] Using environment apiUrl: ${environment.apiUrl}`,
      );
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

      // Local development: auto-detect API port
      // Default is 4000, but can be overridden via URL query param ?API_PORT=3000
      const urlParams = new URLSearchParams(window.location.search);
      const apiPort = urlParams.get("API_PORT") || "4000";

      // localhost or 127.0.0.1
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        const apiUrl = `http://${hostname}:${apiPort}`;
        this.logger.info(
          `[ApiService] Development mode: targeting local server at ${apiUrl}`,
        );
        return apiUrl;
      }

      // Local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const localNetworkPattern =
        /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
      if (localNetworkPattern.test(hostname)) {
        const apiUrl = `http://${hostname}:${apiPort}`;
        this.logger.info(
          `[ApiService] LAN development mode: targeting server at ${apiUrl}`,
        );
        return apiUrl;
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

  /**
   * Validate API response data against a schema.
   * @param response - The API response to validate
   * @param options - Request options including schema
   * @returns Validated response or throws on validation error
   */
  private validateResponse<T>(
    response: ApiResponse<T>,
    options?: ApiRequestOptions<T>,
  ): ApiResponse<T> {
    if (!options?.schema || !response.data) {
      return response;
    }

    const validationResult = validateApiResponse(response.data, options.schema);

    if (!validationResult.success) {
      const errorMsg = `Response validation failed: ${validationResult.error.message}`;
      this.logger.warn(`[ApiService] ${errorMsg}`, {
        path: validationResult.error.path,
        expected: validationResult.error.expected,
        received: validationResult.error.received,
      });

      if (options.throwOnValidationError !== false) {
        throw new Error(errorMsg);
      }
    }

    return response;
  }

  get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: ApiRequestOptions<T>,
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

    return this.http.get<ApiResponse<T>>(url, { params: httpParams }).pipe(
      map((response) => this.validateResponse(response, options)),
      catchError(this.handleError),
    );
  }

  post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions<T>,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    this.logger.info(`[ApiService] POST ${url}`);

    return this.http.post<ApiResponse<T>>(url, data).pipe(
      map((response) => this.validateResponse(response, options)),
      catchError(this.handleError),
    );
  }

  put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions<T>,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http.put<ApiResponse<T>>(url, data).pipe(
      map((response) => this.validateResponse(response, options)),
      catchError(this.handleError),
    );
  }

  patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions<T>,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http.patch<ApiResponse<T>>(url, data).pipe(
      map((response) => this.validateResponse(response, options)),
      catchError(this.handleError),
    );
  }

  delete<T = unknown>(
    endpoint: string,
    options?: ApiRequestOptions<T>,
  ): Observable<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.http.delete<ApiResponse<T>>(url).pipe(
      map((response) => this.validateResponse(response, options)),
      catchError(this.handleError),
    );
  }

  private handleError = (error: unknown): Observable<never> => {
    let errorMessage = "An unknown error occurred";
    let errorType: string | undefined;
    let requestId: string | undefined;

    if (error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.message}`;
    } else if (error && typeof error === "object" && "error" in error) {
      const httpError = error as {
        error?: {
          error?: string;
          errorType?: string;
          message?: string;
          requestId?: string;
        };
        status?: number;
        message?: string;
      };

      // Extract error details from API response
      errorMessage =
        httpError.error?.error ||
        httpError.error?.message ||
        `Error Code: ${httpError.status}\nMessage: ${httpError.message}`;

      // Extract errorType and requestId for better error handling
      errorType = httpError.error?.errorType;
      requestId = httpError.error?.requestId;
    }

    // Log with requestId if available
    const logContext = requestId ? `[${requestId}]` : "";
    this.logger.error(
      `[ApiService]${logContext} API request failed: ${errorMessage}`,
      { errorType, requestId },
    );

    // Create error with additional context
    const apiError = new Error(errorMessage) as Error & {
      errorType?: string;
      requestId?: string;
    };
    apiError.errorType = errorType;
    apiError.requestId = requestId;

    return throwError(() => apiError);
  };
}

// Note: Auth login/register/logout use Supabase directly via SupabaseService
// Only auth-me endpoint uses backend API for token verification
export const API_ENDPOINTS = {
  auth: {
    me: "/auth-me", // ✅ Exists - used for token verification
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
    dailyQuote: "/api/dashboard/daily-quote",
    health: "/api/dashboard/health",
    // NOTE: Notifications moved to dedicated /api/notifications routes
  },
  // Notifications (dedicated routes - consolidated from dashboard)
  notifications: {
    list: "/api/notifications",
    count: "/api/notifications/count",
    markRead: "/api/notifications/mark-read",
    delete: (id: string) => `/api/notifications/${id}`,
    preferences: "/api/notifications/preferences",
  },
  training: {
    stats: "/api/training/stats",
    statsEnhanced: "/api/training/stats-enhanced",
    complete: "/api/training/complete",
    suggestions: "/api/training/suggestions",
    sessions: "/api/training/sessions",
    createSession: "/api/training/sessions",
    // Annual Training Programs (Database-driven)
    programs: "/api/training/programs",
    programDetails: (id: string) => `/api/training/programs/${id}`,
    programPhases: (id: string) => `/api/training/programs/${id}/phases`,
    programWeeks: (id: string) => `/api/training/programs/${id}/weeks`,
    programSessions: (id: string) => `/api/training/programs/${id}/sessions`,
    programExercises: (id: string) => `/api/training/programs/${id}/exercises`,
    programCurrentWeek: "/api/training/programs/current-week",
    generateSubstitute: "/api/training/generate-substitute",
  },
  performance: {
    metrics: "/api/performance/metrics",
    trends: "/api/performance/trends",
    heatmap: "/api/performance/heatmap",
    // Performance records (fitness tests: sprints, jumps, strength)
    records: "/api/performance/records",
    latestRecord: "/api/performance/records/latest",
    speedInsights: "/api/performance/speed-insights",
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
    games: "/api/games", // Uses main games endpoint - coach role handled server-side
    health: "/api/coach/health",
  },
  community: {
    // RESTful endpoints (v2.0.0)
    feed: "/api/community/posts", // Changed from /feed to /posts
    posts: "/api/community/posts",
    createPost: "/api/community/posts",
    getComments: (postId: string) => `/api/community/posts/${postId}/comments`,
    addComment: (postId: string) => `/api/community/posts/${postId}/comments`,
    likePost: (postId: string) => `/api/community/posts/${postId}/like`,
    bookmarkPost: (postId: string) => `/api/community/posts/${postId}/bookmark`,
    likeComment: (commentId: string) => `/api/community/comments/${commentId}/like`,
    votePoll: (optionId: string) => `/api/community/polls/${optionId}/vote`,
    leaderboard: "/api/community/leaderboard",
    trending: "/api/community/trending",
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
    search: "/api/knowledge-search",
    entry: (topic: string) => `/api/knowledge-search?topic=${topic}`,
    articles: "/api/knowledge-search",
  },
  wellness: {
    checkin: "/api/wellness-checkin",
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
  // Staff - Nutritionist endpoints
  staffNutritionist: {
    athletes: "/api/staff-nutritionist/athletes",
    athleteTrends: (athleteId: string) =>
      `/api/staff-nutritionist/athletes/${athleteId}/trends`,
    supplements: "/api/staff-nutritionist/supplements",
    hydration: "/api/staff-nutritionist/hydration",
    generateReport: (athleteId: string) =>
      `/api/staff-nutritionist/reports/${athleteId}`,
    summary: "/api/staff-nutritionist/summary",
  },
  // Staff - Physiotherapist endpoints
  staffPhysiotherapist: {
    athletes: "/api/staff-physiotherapist/athletes",
    athleteDetails: (athleteId: string) =>
      `/api/staff-physiotherapist/athletes/${athleteId}`,
    rtp: "/api/staff-physiotherapist/rtp",
    updateRtp: (injuryId: string) =>
      `/api/staff-physiotherapist/rtp/${injuryId}`,
    summary: "/api/staff-physiotherapist/summary",
    logInjury: "/api/staff-physiotherapist/injuries",
  },
  // Staff - Psychology endpoints
  staffPsychology: {
    myData: "/api/staff-psychology/my-data",
    logEntry: "/api/staff-psychology/my-data/log",
    wellnessReport: "/api/staff-psychology/reports/wellness",
    preCompetitionReport: "/api/staff-psychology/reports/pre-competition",
    team: "/api/staff-psychology/team",
    athleteData: (athleteId: string) =>
      `/api/staff-psychology/athletes/${athleteId}`,
    createAssessment: "/api/staff-psychology/assessments",
  },
  // Scouting endpoints
  scouting: {
    reports: "/api/scouting/reports",
    report: (reportId: string) => `/api/scouting/reports/${reportId}`,
    opponents: "/api/scouting/opponents",
    tendencies: (opponent: string) =>
      `/api/scouting/tendencies/${encodeURIComponent(opponent)}`,
    shareReport: (reportId: string) =>
      `/api/scouting/reports/${reportId}/share`,
  },
  // Film Room endpoints
  filmRoom: {
    list: "/api/film-room",
    watched: "/api/film-room/watched",
    reply: "/api/film-room/reply",
  },
  // Playbook endpoints (player side)
  playbook: {
    list: "/api/playbook",
    study: "/api/playbook/study",
    memorized: "/api/playbook/memorized",
  },
  // Coach Calendar endpoints
  coachCalendar: {
    list: "/api/coach/calendar",
    create: "/api/coach/calendar",
    update: (eventId: string) => `/api/coach/calendar?id=${eventId}`,
    delete: (eventId: string) => `/api/coach/calendar?id=${eventId}`,
  },
  // Season/Account management endpoints
  season: {
    archive: "/api/season/archive",
  },
  account: {
    resume: "/api/account/resume",
  },
  player: {
    notifyInactive: "/api/player/notify-inactive",
  },
  // Calibration logging endpoints
  calibration: {
    logs: "/api/calibration-logs",
    outcome: "/api/calibration-logs/outcome",
  },
  // Micro-sessions endpoints
  microSessions: {
    analytics: "/api/micro-sessions/analytics",
  },
  // Response feedback (AI response rating)
  responseFeedback: "/api/response-feedback",
  // Performance live data
  performanceLive: "/api/performance/live",
};
