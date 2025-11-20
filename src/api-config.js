// API Configuration for FlagFit Pro
// Handles different environments (development, production, Netlify)

import { config, apiEndpoints } from "./config/environment.js";
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
    const netlifyUrl = window.location.origin + "/.netlify/functions";
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
    logger.debug("Local development - using current origin for Netlify Functions:", localNetlifyUrl);
    return localNetlifyUrl;
  }

  // Default fallback to Netlify Functions using current origin
  const defaultUrl = window.location.origin + "/.netlify/functions";
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
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: API_BASE_URL.includes("netlify/functions")
      ? "/auth-login"
      : apiEndpoints.AUTH.LOGIN,
    register: API_BASE_URL.includes("netlify/functions")
      ? "/auth-register"
      : apiEndpoints.AUTH.REGISTER,
    logout: apiEndpoints.AUTH.LOGOUT,
    refresh: apiEndpoints.AUTH.REFRESH,
    me: API_BASE_URL.includes("netlify/functions")
      ? "/auth-me"
      : normalizeEndpoint("/api/auth/me"),
    csrf: normalizeEndpoint("/api/auth/csrf"),
  },

  // Dashboard (Netlify Functions)
  dashboard: {
    overview: API_BASE_URL.includes("netlify/functions")
      ? "/dashboard"
      : normalizeEndpoint("/api/dashboard/overview"),
    trainingCalendar: normalizeEndpoint("/api/dashboard/training-calendar"),
    olympicQualification: normalizeEndpoint(
      "/api/dashboard/olympic-qualification",
    ),
    sponsorRewards: normalizeEndpoint("/api/dashboard/sponsor-rewards"),
    wearables: normalizeEndpoint("/api/dashboard/wearables"),
    teamChemistry: normalizeEndpoint("/api/dashboard/team-chemistry"),
    notifications: API_BASE_URL.includes("netlify/functions")
      ? "/notifications"
      : normalizeEndpoint("/api/dashboard/notifications"),
    dailyQuote: normalizeEndpoint("/api/dashboard/daily-quote"),
    health: normalizeEndpoint("/api/dashboard/health"),
  },

  // Training (Netlify Functions)
  training: {
    stats: API_BASE_URL.includes("netlify/functions")
      ? "/training-stats"
      : normalizeEndpoint("/api/training/stats"),
    complete: API_BASE_URL.includes("netlify/functions")
      ? "/training-stats"
      : normalizeEndpoint("/api/training/complete"),
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

  // Community (Netlify Functions)
  community: {
    feed: API_BASE_URL.includes("netlify/functions")
      ? "/community?feed=true"
      : normalizeEndpoint("/api/community/feed"),
    createPost: API_BASE_URL.includes("netlify/functions")
      ? "/community"
      : normalizeEndpoint("/api/community/posts"),
    getComments: (postId) =>
      API_BASE_URL.includes("netlify/functions")
        ? `/community?postId=${postId}`
        : normalizeEndpoint(`/api/community/posts/${postId}/comments`),
    likePost: (postId) =>
      API_BASE_URL.includes("netlify/functions")
        ? `/community?like=${postId}`
        : normalizeEndpoint(`/api/community/posts/${postId}/like`),
    leaderboard: API_BASE_URL.includes("netlify/functions")
      ? "/community?leaderboard=true"
      : normalizeEndpoint("/api/community/leaderboard"),
    challenges: normalizeEndpoint("/api/community/challenges"),
    health: normalizeEndpoint("/api/community/health"),
  },

  // Tournaments (Netlify Functions)
  tournaments: {
    list: API_BASE_URL.includes("netlify/functions")
      ? "/tournaments"
      : normalizeEndpoint("/api/tournaments"),
    details: (tournamentId) =>
      API_BASE_URL.includes("netlify/functions")
        ? `/tournaments?id=${tournamentId}`
        : normalizeEndpoint(`/api/tournaments/${tournamentId}`),
    register: (tournamentId) =>
      API_BASE_URL.includes("netlify/functions")
        ? `/tournaments?register=${tournamentId}`
        : normalizeEndpoint(`/api/tournaments/${tournamentId}/register`),
    bracket: (tournamentId) =>
      API_BASE_URL.includes("netlify/functions")
        ? `/tournaments?bracket=${tournamentId}`
        : normalizeEndpoint(`/api/tournaments/${tournamentId}/bracket`),
    health: normalizeEndpoint("/api/tournaments/health"),
  },

  // Algorithms (simplified)
  algorithms: {
    health: normalizeEndpoint("/api/algorithms/health"),
  },

  // Knowledge Base
  knowledge: {
    search: API_BASE_URL.includes("netlify/functions")
      ? "/knowledge-search"
      : normalizeEndpoint("/api/knowledge/search"),
    entry: (topic) =>
      API_BASE_URL.includes("netlify/functions")
        ? `/knowledge-search?topic=${topic}`
        : normalizeEndpoint(`/api/knowledge/entry/${topic}`),
    articles: API_BASE_URL.includes("netlify/functions")
      ? "/knowledge-search"
      : normalizeEndpoint("/api/knowledge/articles"),
  },

  // Wellness
  wellness: {
    checkin: normalizeEndpoint("/api/wellness/checkin"),
    injuries: API_BASE_URL.includes("netlify/functions")
      ? "/performance-data?type=injuries"
      : normalizeEndpoint("/api/wellness/injuries"),
  },

  // Supplements
  supplements: {
    log: normalizeEndpoint("/api/supplements/log"),
  },

  // Games
  games: {
    list: normalizeEndpoint("/games"),
    create: normalizeEndpoint("/games"),
    get: (gameId) => normalizeEndpoint(`/games/${gameId}`),
    update: (gameId) => normalizeEndpoint(`/games/${gameId}`),
    stats: (gameId) => normalizeEndpoint(`/games/${gameId}/stats`),
    plays: (gameId) => normalizeEndpoint(`/games/${gameId}/plays`),
    playerStats: (gameId, playerId) =>
      normalizeEndpoint(`/games/${gameId}/player-stats`),
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

  // Get authentication token from localStorage
  getAuthToken() {
    return localStorage.getItem("authToken");
  }

  // Make HTTP request with cancellation support
  async request(endpoint, options = {}) {
    // Create AbortController for cancellation
    const controller = new AbortController();
    const signal = controller.signal;

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
    const token = this.getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Handle non-200 responses
      if (!response.ok) {
        // For 401 errors, try to parse error message but don't fail completely
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `HTTP ${response.status}`);
          error.status = 401;
          throw error;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
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
      const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const isNetlifyFunction = endpoint.includes("/.netlify/functions") ||
                                 endpoint.startsWith("/notifications") ||
                                 endpoint.startsWith("/dashboard") ||
                                 endpoint.startsWith("/community") ||
                                 endpoint.startsWith("/tournaments") ||
                                 endpoint.startsWith("/community");

      // Handle network errors (Failed to fetch)
      if (error.message === "Failed to fetch" || error.name === "TypeError" || error.message?.includes("Failed to fetch")) {
        // Check if it's a connection refused error (common when Netlify Functions aren't running)
        const isConnectionRefused = true; // All "Failed to fetch" errors in this context are connection issues

        // In dev mode with Netlify Functions, connection refused is expected
        // Don't log errors, just silently handle it
        if (isDev && isNetlifyFunction) {
          // Silently handle - this is expected when Netlify Dev isn't running
          // Don't log anything, just throw a quiet error
        } else {
          logger.debug(`Network error for ${endpoint} - endpoint may be unavailable`);
        }

        const networkError = new Error(`Failed to fetch: ${endpoint}`);
        networkError.isNetworkError = true;
        networkError.isConnectionRefused = isConnectionRefused;
        throw networkError;
      }

      // Log other errors (but use debug for dev environment)
      if (isDev && isNetlifyFunction) {
        // Don't log errors for Netlify Functions in dev - they're expected to fail if Netlify Dev isn't running
        logger.debug(`API request failed (expected in dev): ${endpoint}`);
      } else if (isDev) {
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
    if (!this.activeRequests) return;

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

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: "GET",
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
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
  getNotifications: (userId) =>
    apiClient.get(API_ENDPOINTS.dashboard.notifications, { userId }),
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
  search: (query, category = null, limit = 5) =>
    apiClient.post(API_ENDPOINTS.knowledge.search, { query, category, limit }),
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
