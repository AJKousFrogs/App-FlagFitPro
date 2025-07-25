// Training Service for React - Updated for Neon Database
// Removed direct import - will use dynamic import when needed
// Removed direct import - will use dynamic import when needed
import { getStartDateForTimeframe, calculateStreakDays, formatDuration } from '../utils/dateUtils';

class TrainingService {
  constructor() {
    this.database = null;
    this.config = null;
  }

  // Lazy initialization to avoid circular dependencies
  _getDatabase() {
    if (!this.database) {
      this.database = neonDatabaseService;
    }
    return this.database;
  }

  _getConfig() {
    if (!this.config) {
      this.config = {
        apiTimeout: 30000,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
        maxRetries: 3
      };
    }
    return this.config;
  }

  /**
   * Get training sessions with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of training sessions
   */
  async getSessions(filters = {}) {
    return this.getTrainingSessions(filters);
  }

  /**
   * Get training statistics (alias for getTrainingStats)
   * @param {string} timeframe - Timeframe for stats
   * @returns {Promise<Object>} - Training statistics
   */
  async getStats(timeframe = '7d') {
    return this.getTrainingStats(timeframe);
  }

  /**
   * Get training goals (alias for getTrainingGoals)
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of training goals
   */
  async getGoals(filters = {}) {
    return this.getTrainingGoals(filters);
  }

  /**
   * Get training sessions with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of training sessions
   */
  async getTrainingSessions(filters = {}) {
    const cacheKey = `training:sessions:${JSON.stringify(filters)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const database = this._getDatabase();
      await database.initialize();

      // Get current user context (in demo mode, this will be null)
      const userId = filters.userId; // Will be passed from context
      const sessions = await database.getTrainingSessions(userId, {
        limit: filters.perPage || 50,
        ...filters
      });

      cacheService.set(cacheKey, sessions, 2 * 60 * 1000); // 2 minutes
      return sessions;
    } catch (error) {
      console.error('Training sessions service error:', error.message);
      // Return empty array for errors to prevent app crashes
      return [];
    }
  }

  /**
   * Create a new training session
   * @param {Object} sessionData - Training session data
   * @returns {Promise<Object>} - Created session
   */
  async createTrainingSession(sessionData) {
    try {
      const database = this._getDatabase();
      await database.initialize();

      const session = await database.createTrainingSession({
        ...sessionData,
        userId: sessionData.userId, // Should be passed from context
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Clear related cache
      cacheService.invalidatePattern('training:sessions');
      cacheService.invalidatePattern('training:stats');

      return session;
    } catch (error) {
      console.error('Failed to create training session:', error);
      throw error;
    }
  }

  /**
   * Update a training session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Updated session data
   * @returns {Promise<Object>} - Updated session
   */
  async updateTrainingSession(sessionId, sessionData) {
    try {
      const database = this._getDatabase();
      await database.initialize();

      // In a full implementation, we'd add an updateTrainingSession method to the service
      // For now, return updated data (this would be implemented in the database service)
      const session = {
        id: sessionId,
        ...sessionData,
        updatedAt: new Date().toISOString()
      };

      // Clear related cache
      cacheService.invalidatePattern('training:sessions');
      cacheService.invalidatePattern('training:stats');

      return session;
    } catch (error) {
      console.error('Failed to update training session:', error);
      throw error;
    }
  }

  /**
   * Delete a training session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteTrainingSession(sessionId) {
    try {
      const database = this._getDatabase();
      await database.initialize();

      // In a full implementation, we'd add a deleteTrainingSession method to the service
      // For now, return success (this would be implemented in the database service)
      const result = { success: true, id: sessionId };

      // Clear related cache
      cacheService.invalidatePattern('training:sessions');
      cacheService.invalidatePattern('training:stats');

      return result;
    } catch (error) {
      console.error('Failed to delete training session:', error);
      throw error;
    }
  }

  /**
   * Get training statistics
   * @param {string} timeframe - Timeframe for stats
   * @returns {Promise<Object>} - Training statistics
   */
  async getTrainingStats(timeframe = '7d', userId = null) {
    const cacheKey = `training:stats:${timeframe}:${userId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const database = this._getDatabase();
      await database.initialize();

      // Use database service's built-in dashboard stats
      const stats = await database.getDashboardStats(userId);
      
      // If we have specific timeframe requirements, we might need to filter
      // For now, return the basic stats from the database service
      const formattedStats = {
        totalSessions: stats?.totalSessions || 0,
        totalDuration: stats?.averageSessionDuration ? stats.totalSessions * stats.averageSessionDuration : 0,
        averageDuration: stats?.averageSessionDuration || 0,
        streakDays: 0, // TODO: Calculate from actual sessions if needed
        formattedTotalDuration: formatDuration(stats?.averageSessionDuration ? stats.totalSessions * stats.averageSessionDuration : 0),
        formattedAverageDuration: formatDuration(stats?.averageSessionDuration || 0)
      };

      cacheService.set(cacheKey, formattedStats, 5 * 60 * 1000); // 5 minutes
      return formattedStats;
    } catch (error) {
      console.error('Training stats service error:', error.message);
      // Return empty stats for errors to prevent app crashes
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageDuration: 0,
        streakDays: 0,
        formattedTotalDuration: '0m',
        formattedAverageDuration: '0m'
      };
    }
  }

  /**
   * Get training goals
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of training goals
   */
  async getTrainingGoals(filters = {}) {
    const cacheKey = `training:goals:${JSON.stringify(filters)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const database = this._getDatabase();
      await database.initialize();

      const userId = filters.userId; // Will be passed from context
      const goals = await database.getTrainingGoals(userId);

      cacheService.set(cacheKey, goals, 5 * 60 * 1000); // 5 minutes
      return goals;
    } catch (error) {
      console.error('Training goals service error:', error.message);
      // Return empty array for errors to prevent app crashes
      return [];
    }
  }

  /**
   * Create a new training goal
   * @param {Object} goalData - Training goal data
   * @returns {Promise<Object>} - Created goal
   */
  async createTrainingGoal(goalData) {
    try {
      const database = this._getDatabase();
      await database.initialize();

      const goal = await database.createTrainingGoal({
        ...goalData,
        userId: goalData.userId, // Should be passed from context
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Clear related cache
      cacheService.invalidatePattern('training:goals');

      return goal;
    } catch (error) {
      console.error('Failed to create training goal:', error);
      throw error;
    }
  }

  /**
   * Update a training goal
   * @param {string} goalId - Goal ID
   * @param {Object} goalData - Updated goal data
   * @returns {Promise<Object>} - Updated goal
   */
  async updateTrainingGoal(goalId, goalData) {
    try {
      const database = this._getDatabase();
      await database.initialize();

      // In a full implementation, we'd add an updateTrainingGoal method to the service
      // For now, return updated data (this would be implemented in the database service)
      const goal = {
        id: goalId,
        ...goalData,
        updatedAt: new Date().toISOString()
      };

      // Clear related cache
      cacheService.invalidatePattern('training:goals');

      return goal;
    } catch (error) {
      console.error('Failed to update training goal:', error);
      throw error;
    }
  }

  /**
   * Delete a training goal
   * @param {string} goalId - Goal ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteTrainingGoal(goalId) {
    try {
      const database = this._getDatabase();
      await database.initialize();

      // In a full implementation, we'd add a deleteTrainingGoal method to the service
      // For now, return success (this would be implemented in the database service)
      const result = { success: true, id: goalId };

      // Clear related cache
      cacheService.invalidatePattern('training:goals');

      return result;
    } catch (error) {
      console.error('Failed to delete training goal:', error);
      throw error;
    }
  }

  // Helper methods for compatibility
  async createSession(sessionData) {
    return this.createTrainingSession(sessionData);
  }

  async updateSession(sessionId, sessionData) {
    return this.updateTrainingSession(sessionId, sessionData);
  }

  async deleteSession(sessionId) {
    return this.deleteTrainingSession(sessionId);
  }

  async createGoal(goalData) {
    return this.createTrainingGoal(goalData);
  }

  async updateGoal(goalId, goalData) {
    return this.updateTrainingGoal(goalId, goalData);
  }

  async deleteGoal(goalId) {
    return this.deleteTrainingGoal(goalId);
  }

  async getSessionById(sessionId) {
    // In a full implementation, this would query by ID
    return { id: sessionId, title: 'Demo Session' };
  }

  async getRecommendedDrills(filters = {}) {
    // Return demo drills for now
    return [
      { id: '1', name: 'Speed Ladder', category: 'agility' },
      { id: '2', name: 'Cone Weaving', category: 'agility' }
    ];
  }

  /**
   * Subscribe to real-time training session updates
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToTrainingSessions(callback) {
    // Real-time subscriptions would be implemented here for production
    // For now, return a no-op unsubscribe function
    return () => {};
  }

  /**
   * Subscribe to real-time training goal updates
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToTrainingGoals(callback) {
    // Real-time subscriptions would be implemented here for production
    // For now, return a no-op unsubscribe function
    return () => {};
  }

  /**
   * Get mock training sessions for fallback
   * @returns {Array} - Mock training sessions
   */
  getMockTrainingSessions() {
    return [
      {
        id: 'mock-1',
        session_type: 'Agility Training',
        duration: 45,
        exercises: [
          { name: 'Cone Drills', sets: 3, reps: 10 },
          { name: 'Sprint Intervals', sets: 4, reps: 5 }
        ],
        notes: 'Focus on quick direction changes',
        created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'mock-user'
      },
      {
        id: 'mock-2',
        session_type: 'Strength Training',
        duration: 60,
        exercises: [
          { name: 'Squats', sets: 3, reps: 12 },
          { name: 'Push-ups', sets: 3, reps: 15 }
        ],
        notes: 'Great progress on form',
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'mock-user'
      }
    ];
  }

  /**
   * Get mock training goals for fallback
   * @returns {Array} - Mock training goals
   */
  getMockTrainingGoals() {
    return [
      {
        id: 'goal-1',
        title: 'Improve Sprint Speed',
        description: 'Reduce 40-yard dash time by 0.5 seconds',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        progress: 25,
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'mock-user'
      },
      {
        id: 'goal-2',
        title: 'Increase Endurance',
        description: 'Run 2 miles without stopping',
        target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        progress: 60,
        created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'mock-user'
      }
    ];
  }

  /**
   * Get mock training stats for fallback
   * @returns {Object} - Mock training statistics
   */
  getMockTrainingStats() {
    return {
      totalSessions: 5,
      totalDuration: 270,
      averageDuration: 54,
      streakDays: 3,
      formattedTotalDuration: '4h 30m',
      formattedAverageDuration: '54m'
    };
  }
}

// Export singleton instance
export const trainingService = new TrainingService(); 