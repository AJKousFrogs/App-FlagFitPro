// API Configuration for FlagFit Pro
// Handles different environments (development, production, Netlify)

const getApiBaseUrl = () => {
  // Check if we're in production (Netlify)
  if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com')) {
    // Production Netlify deployment
    return 'https://flagfit-pro-api.herokuapp.com'; // Update with your backend URL
  }
  
  // Check if we're in local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Default fallback
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    csrf: '/api/auth/csrf'
  },
  
  // Dashboard
  dashboard: {
    overview: '/api/dashboard/overview',
    trainingCalendar: '/api/dashboard/training-calendar',
    olympicQualification: '/api/dashboard/olympic-qualification',
    sponsorRewards: '/api/dashboard/sponsor-rewards',
    wearables: '/api/dashboard/wearables',
    teamChemistry: '/api/dashboard/team-chemistry',
    notifications: '/api/dashboard/notifications',
    dailyQuote: '/api/dashboard/daily-quote',
    health: '/api/dashboard/health'
  },
  
  // Analytics
  analytics: {
    performanceTrends: '/api/analytics/performance-trends',
    teamChemistry: '/api/analytics/team-chemistry',
    trainingDistribution: '/api/analytics/training-distribution',
    positionPerformance: '/api/analytics/position-performance',
    injuryRisk: '/api/analytics/injury-risk',
    speedDevelopment: '/api/analytics/speed-development',
    userEngagement: '/api/analytics/user-engagement',
    summary: '/api/analytics/summary',
    health: '/api/analytics/health'
  },
  
  // Coach
  coach: {
    dashboard: '/api/coach/dashboard',
    team: '/api/coach/team',
    trainingAnalytics: '/api/coach/training-analytics',
    createTrainingSession: '/api/coach/training-session',
    games: '/api/coach/games',
    health: '/api/coach/health'
  },
  
  // Community
  community: {
    feed: '/api/community/feed',
    createPost: '/api/community/posts',
    getComments: (postId) => `/api/community/posts/${postId}/comments`,
    likePost: (postId) => `/api/community/posts/${postId}/like`,
    leaderboard: '/api/community/leaderboard',
    challenges: '/api/community/challenges',
    health: '/api/community/health'
  },
  
  // Tournaments
  tournaments: {
    list: '/api/tournaments',
    details: (tournamentId) => `/api/tournaments/${tournamentId}`,
    register: (tournamentId) => `/api/tournaments/${tournamentId}/register`,
    bracket: (tournamentId) => `/api/tournaments/${tournamentId}/bracket`,
    health: '/api/tournaments/health'
  },
  
  // Algorithms (simplified)
  algorithms: {
    health: '/api/algorithms/health'
  },
  
  // General
  health: '/api/health'
};

// HTTP Client helper
export class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
  
  // Set authentication token
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }
  
  // Get authentication token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }
  
  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders },
      ...options
    };
    
    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, config);
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET'
    });
  }
  
  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
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
  getCsrfToken: () => apiClient.get(API_ENDPOINTS.auth.csrf)
};

export const dashboard = {
  getOverview: (userId) => apiClient.get(API_ENDPOINTS.dashboard.overview, { userId }),
  getTrainingCalendar: (userId) => apiClient.get(API_ENDPOINTS.dashboard.trainingCalendar, { userId }),
  getOlympicQualification: (userId) => apiClient.get(API_ENDPOINTS.dashboard.olympicQualification, { userId }),
  getSponsorRewards: (userId) => apiClient.get(API_ENDPOINTS.dashboard.sponsorRewards, { userId }),
  getWearables: (userId) => apiClient.get(API_ENDPOINTS.dashboard.wearables, { userId }),
  getTeamChemistry: (userId) => apiClient.get(API_ENDPOINTS.dashboard.teamChemistry, { userId }),
  getNotifications: (userId) => apiClient.get(API_ENDPOINTS.dashboard.notifications, { userId }),
  getDailyQuote: () => apiClient.get(API_ENDPOINTS.dashboard.dailyQuote)
};

export const analytics = {
  getPerformanceTrends: (userId, weeks = 7) => apiClient.get(API_ENDPOINTS.analytics.performanceTrends, { userId, weeks }),
  getTeamChemistry: (userId) => apiClient.get(API_ENDPOINTS.analytics.teamChemistry, { userId }),
  getTrainingDistribution: (userId, period = '30days') => apiClient.get(API_ENDPOINTS.analytics.trainingDistribution, { userId, period }),
  getPositionPerformance: (userId) => apiClient.get(API_ENDPOINTS.analytics.positionPerformance, { userId }),
  getInjuryRisk: (userId) => apiClient.get(API_ENDPOINTS.analytics.injuryRisk, { userId }),
  getSpeedDevelopment: (userId, weeks = 7) => apiClient.get(API_ENDPOINTS.analytics.speedDevelopment, { userId, weeks }),
  getUserEngagement: (period = '30days') => apiClient.get(API_ENDPOINTS.analytics.userEngagement, { period }),
  getSummary: (userId) => apiClient.get(API_ENDPOINTS.analytics.summary, { userId })
};

export const community = {
  getFeed: (userId, limit = 20) => apiClient.get(API_ENDPOINTS.community.feed, { userId, limit }),
  createPost: (postData) => apiClient.post(API_ENDPOINTS.community.createPost, postData),
  getComments: (postId) => apiClient.get(API_ENDPOINTS.community.getComments(postId)),
  likePost: (postId, userId) => apiClient.post(API_ENDPOINTS.community.likePost(postId), { userId }),
  getLeaderboard: (category = 'overall', limit = 10) => apiClient.get(API_ENDPOINTS.community.leaderboard, { category, limit }),
  getChallenges: () => apiClient.get(API_ENDPOINTS.community.challenges)
};

export const tournaments = {
  getList: (status = 'all', limit = 20) => apiClient.get(API_ENDPOINTS.tournaments.list, { status, limit }),
  getDetails: (tournamentId) => apiClient.get(API_ENDPOINTS.tournaments.details(tournamentId)),
  register: (tournamentId, registrationData) => apiClient.post(API_ENDPOINTS.tournaments.register(tournamentId), registrationData),
  getBracket: (tournamentId) => apiClient.get(API_ENDPOINTS.tournaments.bracket(tournamentId))
};

export const coach = {
  getDashboard: (coachId) => apiClient.get(API_ENDPOINTS.coach.dashboard, { coachId }),
  getTeam: (coachId) => apiClient.get(API_ENDPOINTS.coach.team, { coachId }),
  getTrainingAnalytics: (coachId) => apiClient.get(API_ENDPOINTS.coach.trainingAnalytics, { coachId }),
  createTrainingSession: (sessionData) => apiClient.post(API_ENDPOINTS.coach.createTrainingSession, sessionData),
  getGames: (coachId) => apiClient.get(API_ENDPOINTS.coach.games, { coachId })
};

// Export default client
export default apiClient;