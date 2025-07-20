// Training Service for React
import pocketbaseService from './pocketbase-client.service';
import cacheService from './cache.service';
import { getStartDateForTimeframe, calculateStreakDays, formatDuration } from '../utils/dateUtils';

class TrainingService {
  constructor() {
    this.pocketbase = null;
    this.config = null;
  }

  // Lazy initialization to avoid circular dependencies
  _getPocketbase() {
    if (!this.pocketbase) {
      this.pocketbase = pocketbaseService;
    }
    return this.pocketbase;
  }

  _getConfig() {
    if (!this.config) {
      this.config = {
        pocketbaseUrl: import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090',
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
      // Check if user is authenticated
      const pocketbase = this._getPocketbase();
      if (!pocketbase.isAuthenticated()) {
        console.log('User not authenticated, returning empty training sessions');
        return [];
      }

      const options = {
        page: filters.page || 1,
        perPage: filters.perPage || 50,
        sort: filters.sort || '-created',
        filter: this.buildFilterString(filters)
      };

      const result = await pocketbase.getList('training_sessions', options);
      
      if (result.error) {
        console.error('PocketBase error fetching training sessions:', result.error);
        throw new Error(`Failed to fetch training sessions: ${result.error}`);
      }

      cacheService.set(cacheKey, result.data, 2 * 60 * 1000); // 2 minutes
      return result.data;
    } catch (error) {
      console.error('Training sessions service error:', error.message);
      // Return empty array for auth errors, throw for actual API errors
      if (error.message.includes('User not authenticated') || error.message.includes('401')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create a new training session
   * @param {Object} sessionData - Training session data
   * @returns {Promise<Object>} - Created session
   */
  async createTrainingSession(sessionData) {
    try {
      const pocketbase = this._getPocketbase();
      const result = await pocketbase.create('training_sessions', {
        ...sessionData,
        user_id: pocketbase.authStore.model?.id,
        created: new Date().toISOString()
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear related cache
      cacheService.invalidatePattern('training:sessions');
      cacheService.invalidatePattern('training:stats');

      return result.data;
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
      const result = await this._getPocketbase().update('training_sessions', sessionId, {
        ...sessionData,
        updated: new Date().toISOString()
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear related cache
      cacheService.invalidatePattern('training:sessions');
      cacheService.invalidatePattern('training:stats');

      return result.data;
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
      const result = await this._getPocketbase().delete('training_sessions', sessionId);

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear related cache
      cacheService.invalidatePattern('training:sessions');
      cacheService.invalidatePattern('training:stats');

      return result.data;
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
  async getTrainingStats(timeframe = '7d') {
    const cacheKey = `training:stats:${timeframe}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Check if user is authenticated
      const pocketbase = this._getPocketbase();
      if (!pocketbase.isAuthenticated()) {
        console.log('User not authenticated, returning empty training stats');
        return {
          totalSessions: 0,
          totalDuration: 0,
          averageDuration: 0,
          streakDays: 0,
          formattedTotalDuration: '0m',
          formattedAverageDuration: '0m'
        };
      }

      const startDate = getStartDateForTimeframe(timeframe);
      const filter = startDate ? `created >= "${startDate.toISOString()}"` : '';
      
      const sessions = await this.getTrainingSessions({ filter });
      
      const stats = {
        totalSessions: sessions.length,
        totalDuration: sessions.reduce((sum, session) => sum + (session.duration || 0), 0),
        averageDuration: sessions.length > 0 ? Math.round(sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length) : 0,
        streakDays: calculateStreakDays(sessions),
        formattedTotalDuration: formatDuration(sessions.reduce((sum, session) => sum + (session.duration || 0), 0)),
        formattedAverageDuration: formatDuration(sessions.length > 0 ? Math.round(sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length) : 0)
      };

      cacheService.set(cacheKey, stats, 5 * 60 * 1000); // 5 minutes
      return stats;
    } catch (error) {
      console.error('Training stats service error:', error.message);
      // Return empty stats for auth errors, throw for actual API errors
      if (error.message.includes('User not authenticated') || error.message.includes('401')) {
        return {
          totalSessions: 0,
          totalDuration: 0,
          averageDuration: 0,
          streakDays: 0,
          formattedTotalDuration: '0m',
          formattedAverageDuration: '0m'
        };
      }
      throw error;
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
      // Check if user is authenticated
      const pocketbase = this._getPocketbase();
      if (!pocketbase.isAuthenticated()) {
        console.log('User not authenticated, returning empty training goals');
        return [];
      }

      const options = {
        page: filters.page || 1,
        perPage: filters.perPage || 50,
        sort: filters.sort || '-created',
        filter: this.buildFilterString(filters)
      };

      const result = await pocketbase.getList('training_goals', options);
      
      if (result.error) {
        console.error('PocketBase error fetching training goals:', result.error);
        throw new Error(`Failed to fetch training goals: ${result.error}`);
      }

      cacheService.set(cacheKey, result.data, 5 * 60 * 1000); // 5 minutes
      return result.data;
    } catch (error) {
      console.error('Training goals service error:', error.message);
      // Return empty array for auth errors, throw for actual API errors
      if (error.message.includes('User not authenticated') || error.message.includes('401')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create a new training goal
   * @param {Object} goalData - Training goal data
   * @returns {Promise<Object>} - Created goal
   */
  async createTrainingGoal(goalData) {
    try {
      const pocketbase = this._getPocketbase();
      const result = await pocketbase.create('training_goals', {
        ...goalData,
        user_id: pocketbase.authStore.model?.id,
        created: new Date().toISOString()
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear related cache
      cacheService.invalidatePattern('training:goals');

      return result.data;
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
      const result = await this._getPocketbase().update('training_goals', goalId, {
        ...goalData,
        updated: new Date().toISOString()
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear related cache
      cacheService.invalidatePattern('training:goals');

      return result.data;
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
      const result = await this._getPocketbase().delete('training_goals', goalId);

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear related cache
      cacheService.invalidatePattern('training:goals');

      return result.data;
    } catch (error) {
      console.error('Failed to delete training goal:', error);
      throw error;
    }
  }

  /**
   * Build filter string for PocketBase queries
   * @param {Object} filters - Filter object
   * @returns {string} - Filter string
   */
  buildFilterString(filters) {
    const conditions = [];
    
    // Always filter by current user if authenticated
    const pocketbase = this._getPocketbase();
    const currentUserId = filters.userId || pocketbase.authStore.model?.id;
    if (currentUserId) {
      conditions.push(`user_id = "${currentUserId}"`);
    }

    if (filters.dateFrom) {
      conditions.push(`created >= "${filters.dateFrom}"`);
    }

    if (filters.dateTo) {
      conditions.push(`created <= "${filters.dateTo}"`);
    }

    if (filters.type) {
      conditions.push(`type = "${filters.type}"`);
    }

    if (filters.status) {
      conditions.push(`status = "${filters.status}"`);
    }

    if (filters.filter) {
      conditions.push(filters.filter);
    }

    return conditions.join(' && ');
  }

  /**
   * Subscribe to real-time training session updates
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToTrainingSessions(callback) {
    return this._getPocketbase().subscribe('training_sessions', callback);
  }

  /**
   * Subscribe to real-time training goal updates
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToTrainingGoals(callback) {
    return this._getPocketbase().subscribe('training_goals', callback);
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