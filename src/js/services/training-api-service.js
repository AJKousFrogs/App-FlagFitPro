/**
 * Training API Service
 * Fetches training sessions from backend API instead of localStorage
 * Ensures consistency with Angular components and backend filtering
 */

import { apiClient, API_ENDPOINTS } from "../../api-config.js";
import { logger } from "../../logger.js";
import { authManager } from "../../auth-manager.js";

class TrainingApiService {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Fetch training sessions from backend API
   * By default, filters to sessions up to and including today
   *
   * @param {Object} options - Query options
   * @param {string} options.startDate - Optional start date filter
   * @param {string} options.endDate - Optional end date filter
   * @param {boolean} options.includeUpcoming - Include future sessions (default: false)
   * @param {string} options.status - Filter by status
   * @param {number} options.limit - Limit number of results (default: 50)
   * @returns {Promise<Array>} Array of training sessions
   */
  async getTrainingSessions(options = {}) {
    try {
      // Check cache first
      if (
        this.cache &&
        this.cacheTimestamp &&
        Date.now() - this.cacheTimestamp < this.cacheTTL
      ) {
        logger.debug("Returning cached training sessions");
        return this.cache;
      }

      const user = authManager.getCurrentUser();
      if (!user) {
        logger.warn("User not authenticated, returning empty array");
        return [];
      }

      const params = {};

      if (options.startDate) params.startDate = options.startDate;
      if (options.endDate) params.endDate = options.endDate;
      if (options.includeUpcoming) params.includeUpcoming = "true";
      if (options.status) params.status = options.status;
      if (options.limit) params.limit = options.limit.toString();

      const response = await apiClient.get(API_ENDPOINTS.training.sessions, params);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch training sessions");
      }

      // Transform backend format to frontend format
      const sessions = (response.data || []).map((session) => ({
        id: session.id,
        date: session.session_date || session.date,
        type: session.session_type || session.type,
        duration: session.duration_minutes || session.duration,
        intensity: session.intensity_level || session.intensity,
        rpe: session.rpe,
        score: session.score,
        notes: session.notes,
        status: session.status,
        timestamp: session.created_at || new Date().toISOString(),
      }));

      // Cache the result
      this.cache = sessions;
      this.cacheTimestamp = Date.now();

      return sessions;
    } catch (error) {
      logger.error("Error fetching training sessions from API:", error);

      // Fallback to localStorage if API fails
      try {
        const { storageService } = await import("./storage-service-unified.js");
        const localWorkouts = storageService.getRecentWorkouts();
        logger.warn("Falling back to localStorage for training sessions");
        return localWorkouts;
      } catch (fallbackError) {
        logger.error("Fallback to localStorage also failed:", fallbackError);
        return [];
      }
    }
  }

  /**
   * Get training statistics from backend API
   * Uses centralized endpoint for consistent calculations
   *
   * @param {Object} options - Query options
   * @param {string} options.startDate - Optional start date filter
   * @param {string} options.endDate - Optional end date filter
   * @returns {Promise<Object>} Training statistics
   */
  async getTrainingStats(options = {}) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        logger.warn("User not authenticated, returning empty stats");
        return this.getEmptyStats();
      }

      const params = {};
      if (options.startDate) params.startDate = options.startDate;
      if (options.endDate) params.endDate = options.endDate;

      const response = await apiClient.get(API_ENDPOINTS.training.statsEnhanced || "/api/training/stats-enhanced", params);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch training stats");
      }

      return response.data || this.getEmptyStats();
    } catch (error) {
      logger.error("Error fetching training stats from API:", error);
      return this.getEmptyStats();
    }
  }

  /**
   * Clear cache (useful after creating/updating sessions)
   */
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Get empty stats object
   */
  getEmptyStats() {
    return {
      totalSessions: 0,
      totalDuration: 0,
      totalLoad: 0,
      avgDuration: 0,
      avgLoad: 0,
      currentStreak: 0,
      acwr: null,
      acuteLoad: 0,
      chronicLoad: 0,
      acwrRiskZone: "insufficient_data",
      acwrMessage: "Insufficient data",
      weeklyVolume: 0,
      weeklyDuration: 0,
      weeklySessions: 0,
      weeklyAvgIntensity: 0,
      sessionsByType: {},
    };
  }
}

// Export singleton instance
export const trainingApiService = new TrainingApiService();
