// API Configuration for FlagFit Pro
// Handles different environments (development, production, Netlify)

import { config } from "./config/environment.js";
import { NETWORK } from "./js/config/app-constants.js";
import { csrfProtection } from "./js/security/csrf-protection.js";
import { cacheService } from "./js/services/cache-service.js";
import { storageService } from "./js/services/storage-service-unified.js";
import { logger } from "./logger.js";

const getApiBaseUrl = () => {
  // Use environment configuration for API base URL
  const envBaseUrl = config.API_BASE_URL;

  // If we have a configured API URL, use it
  if (envBaseUrl) {
    logger.debug("Using configured API URL:", envBaseUrl);
    return envBaseUrl;
  }

  // Auto-detect based on hostname for backward compatibility
  if (
    window.location.hostname.includes("netlify.app") ||
    window.location.hostname.includes("netlify.com")
  ) {
    // Use Netlify Functions for production
    const netlifyUrl = `${window.location.origin}/.netlify/functions`;
    logger.debug("Using Netlify Functions:", netlifyUrl);
    return netlifyUrl;
  }

  // Check if we're in local development with Netlify Dev (port 8888)
  if (
    window.location.hostname === "localhost" &&
    window.location.port === "8888"
  ) {
    // Netlify Dev environment
    const netlifyDevUrl = "http://localhost:8888/.netlify/functions";
    logger.debug("Using Netlify Dev:", netlifyDevUrl);
    return netlifyDevUrl;
  }

  // For local development, try to use current origin for Netlify Functions
  // This works if Netlify Dev is running on the same port
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    // Use current origin - this allows the dev server to proxy or serve functions
    const currentOrigin = window.location.origin;
    const localNetlifyUrl = `${currentOrigin}/.netlify/functions`;
    logger.debug(
      "Local development - using current origin for Netlify Functions:",
      localNetlifyUrl,
    );
    return localNetlifyUrl;
  }

  // Default fallback to Netlify Functions using current origin
  const defaultUrl = `${window.location.origin}/.netlify/functions`;
  logger.debug("Using default Netlify Functions URL:", defaultUrl);
  return defaultUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to normalize endpoints - remove /api/ prefix if base URL already includes /api
const normalizeEndpoint = (endpoint) => {
  // If endpoint starts with /api/ and base URL already ends with /api, remove the /api prefix
  if (endpoint.startsWith("/api/") && API_BASE_URL.endsWith("/api")) {
    return endpoint.replace(/^\/api/, "");
  }
  return endpoint;
};

// API Endpoints - Using centralized configuration
// All endpoints use /api/... format - Netlify redirects handle routing to functions
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: normalizeEndpoint("/api/auth/login"),
    register: normalizeEndpoint("/api/auth/register"),
    logout: normalizeEndpoint("/api/auth/logout"),
    refresh: normalizeEndpoint("/api/auth/refresh"),
    me: normalizeEndpoint("/api/auth/me"),
    csrf: normalizeEndpoint("/api/auth/csrf"),
  },

  // Dashboard endpoints
  dashboard: {
    overview: normalizeEndpoint("/api/dashboard/overview"),
    trainingCalendar: normalizeEndpoint("/api/dashboard/training-calendar"),
    olympicQualification: normalizeEndpoint(
      "/api/dashboard/olympic-qualification",
    ),
    sponsorRewards: normalizeEndpoint("/api/dashboard/sponsor-rewards"),
    wearables: normalizeEndpoint("/api/dashboard/wearables"),
    teamChemistry: normalizeEndpoint("/api/dashboard/team-chemistry"),
    dailyQuote: normalizeEndpoint("/api/dashboard/daily-quote"),
    health: normalizeEndpoint("/api/dashboard/health"),
    // NOTE: Notifications moved to dedicated /api/notifications routes
  },

  // Notifications (dedicated routes - consolidated from dashboard)
  notifications: {
    list: normalizeEndpoint("/api/notifications"),
    count: normalizeEndpoint("/api/notifications/count"),
    markRead: normalizeEndpoint("/api/notifications/mark-read"),
    delete: (id) => normalizeEndpoint(`/api/notifications/${id}`),
    preferences: normalizeEndpoint("/api/notifications/preferences"),
  },

  // Training endpoints
  training: {
    stats: normalizeEndpoint("/api/training/stats"),
    statsEnhanced: normalizeEndpoint("/api/training/stats-enhanced"),
    sessions: normalizeEndpoint("/api/training/sessions"),
    complete: normalizeEndpoint("/api/training/complete"),
    suggestions: normalizeEndpoint("/api/training/suggestions"),
    // Training Programs (Database-driven)
    programs: normalizeEndpoint("/api/training/programs"),
    programDetails: (id) => normalizeEndpoint(`/api/training/programs/${id}`),
    programPhases: (id) => normalizeEndpoint(`/api/training/programs/${id}/phases`),
    programWeeks: (id) => normalizeEndpoint(`/api/training/programs/${id}/weeks`),
    programSessions: (id) => normalizeEndpoint(`/api/training/programs/${id}/sessions`),
    programExercises: (id) => normalizeEndpoint(`/api/training/programs/${id}/exercises`),
    programCurrentWeek: normalizeEndpoint("/api/training/programs/current-week"),
  },

  // Analytics
  analytics: {
    performanceTrends: normalizeEndpoint("/api/analytics/performance-trends"),
    teamChemistry: normalizeEndpoint("/api/analytics/team-chemistry"),
    trainingDistribution: normalizeEndpoint(
      "/api/analytics/training-distribution",
    ),
    positionPerformance: normalizeEndpoint(
      "/api/analytics/position-performance",
    ),
    injuryRisk: normalizeEndpoint("/api/analytics/injury-risk"),
    speedDevelopment: normalizeEndpoint("/api/analytics/speed-development"),
    userEngagement: normalizeEndpoint("/api/analytics/user-engagement"),
    summary: normalizeEndpoint("/api/analytics/summary"),
    health: normalizeEndpoint("/api/analytics/health"),
  },

  // Coach
  coach: {
    dashboard: normalizeEndpoint("/api/coach/dashboard"),
    team: normalizeEndpoint("/api/coach/team"),
    trainingAnalytics: normalizeEndpoint("/api/coach/training-analytics"),
    createTrainingSession: normalizeEndpoint("/api/coach/training-session"),
    games: normalizeEndpoint("/api/coach/games"),
    health: normalizeEndpoint("/api/coach/health"),
  },

  // Community endpoints
  community: {
    feed: normalizeEndpoint("/api/community/feed"),
    createPost: normalizeEndpoint("/api/community/posts"),
    getComments: (postId) =>
      normalizeEndpoint(`/api/community/posts/${postId}/comments`),
    likePost: (postId) =>
      normalizeEndpoint(`/api/community/posts/${postId}/like`),
    leaderboard: normalizeEndpoint("/api/community/leaderboard"),
    challenges: normalizeEndpoint("/api/community/challenges"),
    health: normalizeEndpoint("/api/community/health"),
  },

  // Tournaments endpoints
  tournaments: {
    list: normalizeEndpoint("/api/tournaments"),
    details: (tournamentId) =>
      normalizeEndpoint(`/api/tournaments/${tournamentId}`),
    register: (tournamentId) =>
      normalizeEndpoint(`/api/tournaments/${tournamentId}/register`),
    bracket: (tournamentId) =>
      normalizeEndpoint(`/api/tournaments/${tournamentId}/bracket`),
    health: normalizeEndpoint("/api/tournaments/health"),
  },

  // Algorithms (simplified)
  algorithms: {
    health: normalizeEndpoint("/api/algorithms/health"),
  },

  // Knowledge Base endpoints
  knowledge: {
    search: normalizeEndpoint("/api/knowledge/search"),
    entry: (topic) => normalizeEndpoint(`/api/knowledge/entry/${topic}`),
    articles: normalizeEndpoint("/api/knowledge/articles"),
  },

  // Wellness endpoints
  wellness: {
    checkin: normalizeEndpoint("/api/wellness-checkin"),
    injuries: normalizeEndpoint("/api/wellness/injuries"),
  },

  // Readiness Score endpoints
  readiness: {
    calculate: normalizeEndpoint("/api/calc-readiness"),
    history: normalizeEndpoint("/api/readiness-history"),
  },

  // Supplements endpoints
  supplements: {
    log: normalizeEndpoint("/api/supplements/log"),
    get: normalizeEndpoint("/api/performance-data/supplements"),
  },

  // Performance Data endpoints
  performanceData: {
    wellness: normalizeEndpoint("/api/performance-data/wellness"),
    supplements: normalizeEndpoint("/api/performance-data/supplements"),
    measurements: normalizeEndpoint("/api/performance-data/measurements"),
    injuries: normalizeEndpoint("/api/performance-data/injuries"),
    trends: normalizeEndpoint("/api/performance-data/trends"),
    export: normalizeEndpoint("/api/performance-data/export"),
  },

  // Games
  games: {
    list: normalizeEndpoint("/games"),
    create: normalizeEndpoint("/games"),
    get: (gameId) => normalizeEndpoint(`/games/${gameId}`),
    update: (gameId) => normalizeEndpoint(`/games/${gameId}`),
    stats: (gameId) => normalizeEndpoint(`/games/${gameId}/stats`),
    plays: (gameId) => normalizeEndpoint(`/games/${gameId}/plays`),
    playerStats: (gameId, _playerId) =>
      normalizeEndpoint(`/games/${gameId}/player-stats`),
  },

  // Player Statistics endpoints (Centralized - always up to and including today)
  playerStats: {
    aggregated: normalizeEndpoint("/api/player-stats/aggregated"),
    dateRange: normalizeEndpoint("/api/player-stats/date-range"),
  },

  // Training Plan endpoints (Evidence-based, date-filtered)
  trainingPlan: {
    today: normalizeEndpoint("/api/training-plan"),
    date: (date) => normalizeEndpoint(`/api/training-plan?date=${date}`),
  },

  // User Context endpoint (for AI coaching)
  user: {
    context: normalizeEndpoint("/api/user/context"),
  },

  // General
  health: normalizeEndpoint("/api/health"),
};

// HTTP Client helper
export class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // Set authentication token
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders["Authorization"];
    }
  }

  // Get authentication token from secure storage
  // Upgraded to use secureStorage API with AES-GCM encryption
  async getAuthToken() {
    // First, try to use secureStorage API (preferred method)
    if (
      window.secureStorage &&
      typeof window.secureStorage.getAuthToken === "function"
    ) {
      try {
        const token = await window.secureStorage.getAuthToken();
        if (token) {
          return token;
        }
      } catch (error) {
        logger.debug(
          "Secure storage getAuthToken failed, trying fallback:",
          error,
        );
      }
    }

    // Fallback: legacy localStorage method via storageService
    return storageService.get("authToken", null, { usePrefix: false });
  }

  // Make HTTP request with cancellation support
  async request(endpoint, options = {}) {
    // Create AbortController for cancellation
    const controller = new AbortController();
    const { signal } = controller;

    // Store controller for cancellation
    if (!this.activeRequests) {
      this.activeRequests = new Map();
    }
    const requestId = `${endpoint}_${Date.now()}`;
    this.activeRequests.set(requestId, controller);

    // Real API request
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders },
      ...options,
      signal, // Add abort signal
    };

    // Add auth token if available
    const token = await this.getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
    const method = (options.method || "GET").toUpperCase();
    if (csrfProtection.requiresProtection(method)) {
      const csrfHeaders = csrfProtection.getHeaders();
      Object.assign(config.headers, csrfHeaders);
      logger.debug(`[CSRF] Token added to ${method} request:`, endpoint);
    }

    try {
      const response = await fetch(url, config);

      // Check Content-Type before parsing
      const contentType = response.headers.get("content-type") || "";
      const isJSON = contentType.includes("application/json");
      const isHTML = contentType.includes("text/html");

      // Handle non-200 responses
      if (!response.ok) {
        // For 401 errors, try to parse error message but don't fail completely
        if (response.status === 401) {
          if (isJSON) {
            const errorData = await response.json().catch(() => ({}));
            const errorPayload = errorData?.error;
            const errorMessage =
              (typeof errorPayload === "string" && errorPayload) ||
              errorPayload?.message ||
              errorData?.message ||
              `HTTP ${response.status}`;
            const error = new Error(errorMessage);
            error.status = 401;
            error.code =
              errorPayload?.code || errorData?.errorType || errorData?.code;
            error.details = errorPayload?.details || errorData?.details;
            throw error;
          } else {
            const error = new Error(`HTTP ${response.status}: Unauthorized`);
            error.status = 401;
            throw error;
          }
        }

        // If response is HTML (like a 404 page), don't try to parse as JSON
        if (isHTML) {
          const error = new Error(
            `HTTP ${response.status}: Server returned HTML instead of JSON. Endpoint may not exist.`,
          );
          error.status = response.status;
          error.isHTMLResponse = true;
          throw error;
        }

        // Try to parse JSON error response
        if (isJSON) {
          const errorData = await response.json().catch(() => ({}));
          const errorPayload = errorData?.error;
          const errorMessage =
            (typeof errorPayload === "string" && errorPayload) ||
            errorPayload?.message ||
            errorData?.message ||
            `HTTP ${response.status}`;
          const error = new Error(errorMessage);
          error.status = response.status;
          error.code = errorPayload?.code || errorData?.errorType || errorData?.code;
          error.details = errorPayload?.details || errorData?.details;
          throw error;
        } else {
          // Non-JSON error response
          const text = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
        }
      }

      // For successful responses, check content type before parsing
      if (isHTML) {
        // Server returned HTML instead of JSON - likely a routing issue
        const error = new Error(
          `Server returned HTML instead of JSON. Endpoint may not exist: ${endpoint}`,
        );
        error.isHTMLResponse = true;
        throw error;
      }

      // Parse JSON response
      const result = isJSON
        ? await response.json()
        : await response.text().then((text) => {
            // Try to parse as JSON anyway (some servers don't set content-type correctly)
            try {
              return JSON.parse(text);
            } catch {
              throw new Error(
                `Expected JSON but received: ${text.substring(0, 100)}`,
              );
            }
          });

      this.activeRequests.delete(requestId);
      return result;
    } catch (error) {
      // Remove from active requests
      this.activeRequests.delete(requestId);

      // Handle abort error
      if (error.name === "AbortError") {
        logger.debug(`Request cancelled: ${endpoint}`);
        throw new Error("Request cancelled");
      }

      // Check if this is a development environment
      const isDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const isNetlifyFunction =
        endpoint.includes("/.netlify/functions") ||
        endpoint.startsWith("/notifications") ||
        endpoint.startsWith("/dashboard") ||
        endpoint.startsWith("/community") ||
        endpoint.startsWith("/tournaments");

      // Handle network errors (Failed to fetch)
      if (
        error.message === "Failed to fetch" ||
        error.name === "TypeError" ||
        error.message?.includes("Failed to fetch")
      ) {
        const networkError = new Error(`Failed to fetch: ${endpoint}`);
        networkError.isNetworkError = true;
        networkError.isConnectionRefused = true;

        // Always log network errors, but at appropriate level
        if (isDev && isNetlifyFunction) {
          logger.debug(
            `Network error for ${endpoint} - Netlify Functions may not be running`,
          );
        } else {
          logger.error(
            `Network error for ${endpoint} - endpoint may be unavailable`,
          );
        }

        throw networkError;
      }

      // Always log errors at appropriate level
      if (isDev) {
        logger.debug(`API request failed (dev mode): ${endpoint}`, error);
      } else {
        logger.error(`API request failed: ${endpoint}`, error);
      }

      throw error;
    }
  }

  // Cancel a specific request
  cancelRequest(requestId) {
    if (this.activeRequests && this.activeRequests.has(requestId)) {
      this.activeRequests.get(requestId).abort();
      this.activeRequests.delete(requestId);
    }
  }

  // Cancel all active requests for a specific endpoint pattern
  cancelRequestsByPattern(pattern) {
    if (!this.activeRequests) {
      return;
    }

    const toCancel = [];
    this.activeRequests.forEach((controller, requestId) => {
      if (requestId.includes(pattern)) {
        controller.abort();
        toCancel.push(requestId);
      }
    });

    toCancel.forEach((id) => this.activeRequests.delete(id));
  }

  // Cancel all active requests
  cancelAllRequests() {
    if (this.activeRequests) {
      this.activeRequests.forEach((controller) => controller.abort());
      this.activeRequests.clear();
    }
  }

  // GET request with caching support
  async get(endpoint, params = {}, options = {}) {
    const {
      useCache = true,
      cacheTTL = NETWORK.CACHE_DURATION_MEDIUM,
      forceRefresh = false,
    } = options;

    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Generate cache key from URL
    const cacheKey = `api:${url}`;

    // Check cache first (unless force refresh)
    if (useCache && !forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached !== null) {
        logger.debug(`[API] Returning cached response for: ${url}`);
        return cached;
      }
    }

    // Make request if no cache or force refresh
    const response = await this.request(url, {
      method: "GET",
    });

    // Cache successful response
    if (useCache && response && !response.error) {
      cacheService.set(cacheKey, response, { ttl: cacheTTL });
      logger.debug(`[API] Cached response for: ${url}`);
    }

    return response;
  }

  // POST request (invalidates related cache)
  async post(endpoint, data = {}) {
    const response = await this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Invalidate cache for this endpoint pattern
    this.invalidateCache(endpoint);

    return response;
  }

  // PUT request (invalidates related cache)
  async put(endpoint, data = {}) {
    const response = await this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    // Invalidate cache for this endpoint pattern
    this.invalidateCache(endpoint);

    return response;
  }

  // PATCH request (invalidates related cache)
  async patch(endpoint, data = {}) {
    const response = await this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    // Invalidate cache for this endpoint pattern
    this.invalidateCache(endpoint);

    return response;
  }

  // DELETE request (invalidates related cache)
  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: "DELETE",
    });

    // Invalidate cache for this endpoint pattern
    this.invalidateCache(endpoint);

    return response;
  }

  // Invalidate cache entries related to an endpoint
  invalidateCache(endpoint) {
    // Extract base endpoint (remove IDs and query params)
    const baseEndpoint = endpoint.split("?")[0].replace(/\/\d+$/g, "");
    const pattern = `api:${baseEndpoint}`;

    cacheService.invalidatePattern(pattern);
    logger.debug(`[API] Invalidated cache for pattern: ${pattern}`);
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Helper functions for common operations
export const auth = {
  login: (credentials) => apiClient.post(API_ENDPOINTS.auth.login, credentials),
  register: (userData) => apiClient.post(API_ENDPOINTS.auth.register, userData),
  logout: () => apiClient.post(API_ENDPOINTS.auth.logout),
  getCurrentUser: () => apiClient.get(API_ENDPOINTS.auth.me),
  getCsrfToken: () => apiClient.get(API_ENDPOINTS.auth.csrf),
};

export const dashboard = {
  getOverview: (userId) =>
    apiClient.get(API_ENDPOINTS.dashboard.overview, { userId }),
  getTrainingCalendar: (userId) =>
    apiClient.get(API_ENDPOINTS.dashboard.trainingCalendar, { userId }),
  getOlympicQualification: (userId) =>
    apiClient.get(API_ENDPOINTS.dashboard.olympicQualification, { userId }),
  getSponsorRewards: (userId) =>
    apiClient.get(API_ENDPOINTS.dashboard.sponsorRewards, { userId }),
  getWearables: (userId) =>
    apiClient.get(API_ENDPOINTS.dashboard.wearables, { userId }),
  getTeamChemistry: (userId) =>
    apiClient.get(API_ENDPOINTS.dashboard.teamChemistry, { userId }),
  getNotifications: (userId, options = {}) =>
    apiClient.get(API_ENDPOINTS.dashboard.notifications, {
      userId,
      ...options,
    }),
  getNotificationCount: () =>
    apiClient.get(API_ENDPOINTS.dashboard.notificationsCount),
  markNotificationAsRead: (notificationId) =>
    apiClient.post(API_ENDPOINTS.dashboard.notifications, { notificationId }),
  markNotificationsAsRead: (ids) =>
    apiClient.post(API_ENDPOINTS.dashboard.notifications, { ids }),
  markAllNotificationsAsRead: () =>
    apiClient.post(API_ENDPOINTS.dashboard.notifications, {
      notificationId: "all",
    }),
  createNotification: (notificationData) =>
    apiClient.post(
      API_ENDPOINTS.dashboard.notificationsCreate,
      notificationData,
    ),
  getNotificationPreferences: () =>
    apiClient.get(API_ENDPOINTS.dashboard.notificationsPreferences),
  updateNotificationPreferences: (preferences) =>
    apiClient.post(API_ENDPOINTS.dashboard.notificationsPreferences, {
      preferences,
    }),
  updateLastOpenedAt: () =>
    apiClient.patch(`${API_ENDPOINTS.dashboard.notifications}/last-opened`),
  getDailyQuote: () => apiClient.get(API_ENDPOINTS.dashboard.dailyQuote),
};

export const analytics = {
  getPerformanceTrends: (userId, weeks = 7) =>
    apiClient.get(API_ENDPOINTS.analytics.performanceTrends, { userId, weeks }),
  getTeamChemistry: (userId) =>
    apiClient.get(API_ENDPOINTS.analytics.teamChemistry, { userId }),
  getTrainingDistribution: (userId, period = "30days") =>
    apiClient.get(API_ENDPOINTS.analytics.trainingDistribution, {
      userId,
      period,
    }),
  getPositionPerformance: (userId) =>
    apiClient.get(API_ENDPOINTS.analytics.positionPerformance, { userId }),
  getInjuryRisk: (userId) =>
    apiClient.get(API_ENDPOINTS.analytics.injuryRisk, { userId }),
  getSpeedDevelopment: (userId, weeks = 7) =>
    apiClient.get(API_ENDPOINTS.analytics.speedDevelopment, { userId, weeks }),
  getUserEngagement: (period = "30days") =>
    apiClient.get(API_ENDPOINTS.analytics.userEngagement, { period }),
  getSummary: (userId) =>
    apiClient.get(API_ENDPOINTS.analytics.summary, { userId }),
};

export const community = {
  getFeed: (userId, limit = 20) =>
    apiClient.get(API_ENDPOINTS.community.feed, { userId, limit }),
  createPost: (postData) =>
    apiClient.post(API_ENDPOINTS.community.createPost, postData),
  getComments: (postId) =>
    apiClient.get(API_ENDPOINTS.community.getComments(postId)),
  likePost: (postId, userId) =>
    apiClient.post(API_ENDPOINTS.community.likePost(postId), { userId }),
  getLeaderboard: (category = "overall", limit = 10) =>
    apiClient.get(API_ENDPOINTS.community.leaderboard, { category, limit }),
  getChallenges: () => apiClient.get(API_ENDPOINTS.community.challenges),
};

export const tournaments = {
  getList: (status = "all", limit = 20) =>
    apiClient.get(API_ENDPOINTS.tournaments.list, { status, limit }),
  getDetails: (tournamentId) =>
    apiClient.get(API_ENDPOINTS.tournaments.details(tournamentId)),
  register: (tournamentId, registrationData) =>
    apiClient.post(
      API_ENDPOINTS.tournaments.register(tournamentId),
      registrationData,
    ),
  getBracket: (tournamentId) =>
    apiClient.get(API_ENDPOINTS.tournaments.bracket(tournamentId)),
};

export const coach = {
  getDashboard: (coachId) =>
    apiClient.get(API_ENDPOINTS.coach.dashboard, { coachId }),
  getTeam: (coachId) => apiClient.get(API_ENDPOINTS.coach.team, { coachId }),
  getTrainingAnalytics: (coachId) =>
    apiClient.get(API_ENDPOINTS.coach.trainingAnalytics, { coachId }),
  createTrainingSession: (sessionData) =>
    apiClient.post(API_ENDPOINTS.coach.createTrainingSession, sessionData),
  getGames: (coachId) => apiClient.get(API_ENDPOINTS.coach.games, { coachId }),
};

export const knowledge = {
  search: (query, category = null, limit = 5, options = {}) =>
    apiClient.post(API_ENDPOINTS.knowledge.search, {
      query,
      category,
      limit,
      options,
    }),
  getEntry: (topic) => apiClient.get(API_ENDPOINTS.knowledge.entry(topic)),
  searchArticles: (query, categories = [], limit = 10) =>
    apiClient.post(API_ENDPOINTS.knowledge.articles, {
      query,
      categories,
      limit,
    }),
};

// Export default client
export default apiClient;
