/**
 * Wellness Service
 * Handles all wellness data operations with Supabase
 */

import { getSupabase } from './supabase-client.js';
import { logger } from '../../logger.js';
import { authManager } from '../../auth-manager.js';

export class WellnessService {
  constructor() {
    this.supabase = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async init() {
    if (!this.supabase) {
      this.supabase = getSupabase();
      if (!this.supabase) {
        logger.error('[Wellness] Failed to initialize Supabase client');
        return false;
      }
    }
    return true;
  }

  /**
   * Get current user ID
   */
  async getUserId() {
    await authManager.waitForInit();
    const user = authManager.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.id || user.email;
  }

  /**
   * Save wellness data for a specific date
   */
  async saveWellnessData(data) {
    if (!(await this.init())) {
      throw new Error('Wellness service not initialized');
    }

    const userId = await this.getUserId();
    const date = data.date || new Date().toISOString().split('T')[0];

    const wellnessEntry = {
      user_id: userId,
      date: date,
      sleep: data.sleep ?? null,
      energy: data.energy ?? null,
      stress: data.stress ?? null,
      soreness: data.soreness ?? null,
      motivation: data.motivation ?? null,
      mood: data.mood ?? null,
      hydration: data.hydration ?? null,
      notes: data.notes || null,
    };

    try {
      // Check if entry exists for this date
      const { data: existing } = await this.supabase
        .from('wellness_data')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      let result;
      if (existing) {
        // Update existing entry
        const { data, error } = await this.supabase
          .from('wellness_data')
          .update(wellnessEntry)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        logger.success('[Wellness] Updated wellness entry for', date);
      } else {
        // Insert new entry
        const { data, error } = await this.supabase
          .from('wellness_data')
          .insert(wellnessEntry)
          .select()
          .single();

        if (error) throw error;
        result = data;
        logger.success('[Wellness] Created wellness entry for', date);
      }

      // Clear cache
      this.cache.clear();

      // Dispatch event
      document.dispatchEvent(
        new CustomEvent('wellnessSubmitted', {
          detail: { entry: result, date },
        }),
      );

      return result;
    } catch (error) {
      logger.error('[Wellness] Error saving wellness data:', error);
      throw error;
    }
  }

  /**
   * Get wellness data for a specific date
   */
  async getWellnessData(date) {
    if (!(await this.init())) {
      return null;
    }

    const userId = await this.getUserId();
    const cacheKey = `wellness_${userId}_${date}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('wellness_data')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw error;
      }

      const result = data || null;

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error('[Wellness] Error fetching wellness data:', error);
      return null;
    }
  }

  /**
   * Get wellness history for a date range
   */
  async getWellnessHistory(startDate, endDate) {
    if (!(await this.init())) {
      return [];
    }

    const userId = await this.getUserId();
    const cacheKey = `wellness_history_${userId}_${startDate}_${endDate}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('wellness_data')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Cache result
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now(),
      });

      return data || [];
    } catch (error) {
      logger.error('[Wellness] Error fetching wellness history:', error);
      return [];
    }
  }

  /**
   * Get wellness summary (averages) for a date range
   */
  async getWellnessSummary(days = 30) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const history = await this.getWellnessHistory(startDateStr, endDate);

    if (history.length === 0) {
      return {
        count: 0,
        avgSleep: null,
        avgEnergy: null,
        avgStress: null,
        avgSoreness: null,
        avgMotivation: null,
        avgMood: null,
        avgHydration: null,
      };
    }

    const metrics = ['sleep', 'energy', 'stress', 'soreness', 'motivation', 'mood', 'hydration'];
    const summary = { count: history.length };

    metrics.forEach((metric) => {
      const values = history
        .map((entry) => entry[metric])
        .filter((val) => val !== null && val !== undefined);
      summary[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`] =
        values.length > 0
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : null;
    });

    return summary;
  }

  /**
   * Calculate recovery score from wellness data
   */
  calculateRecoveryScore(data) {
    if (!data) return null;

    const metrics = {
      sleep: data.sleep || 5,
      energy: data.energy || 5,
      stress: data.stress || 5,
      soreness: data.soreness || 5,
      motivation: data.motivation || 5,
      mood: data.mood || 5,
      hydration: data.hydration || 5,
    };

    // Invert stress and soreness (lower is better)
    const adjustedStress = 10 - metrics.stress;
    const adjustedSoreness = 10 - metrics.soreness;

    // Calculate weighted average
    const score =
      (metrics.sleep * 0.2 +
        metrics.energy * 0.2 +
        adjustedStress * 0.15 +
        adjustedSoreness * 0.15 +
        metrics.motivation * 0.1 +
        metrics.mood * 0.1 +
        metrics.hydration * 0.1) *
      10;

    return Math.round(score);
  }

  /**
   * Get latest wellness entry
   */
  async getLatestWellness() {
    if (!(await this.init())) {
      return null;
    }

    const userId = await this.getUserId();
    const cacheKey = `wellness_latest_${userId}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        // 1 minute cache for latest
        return cached.data;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('wellness_data')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const result = data || null;

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error('[Wellness] Error fetching latest wellness:', error);
      return null;
    }
  }

  /**
   * Get wellness streak (consecutive days with entries)
   */
  async getWellnessStreak() {
    const history = await this.getWellnessHistory(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
    );

    if (history.length === 0) return 0;

    // Sort by date descending
    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const entry of sorted) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate readiness score using API endpoint
   */
  async calculateReadinessScore(date = null) {
    try {
      const userId = await this.getUserId();
      const { API_ENDPOINTS } = await import('../../api-config.js');
      const { apiClient } = await import('../../api-config.js');

      const endpoint = API_ENDPOINTS.readiness.calculate;
      const requestData = {
        athleteId: userId,
      };

      if (date) {
        requestData.day = date;
      }

      const response = await apiClient.post(endpoint, requestData);
      
      if (response.error) {
        logger.warn('[Wellness] Readiness score calculation failed:', response.error);
        return null;
      }

      return response.data || response;
    } catch (error) {
      logger.error('[Wellness] Error calculating readiness score:', error);
      return null;
    }
  }

  /**
   * Get readiness score history
   */
  async getReadinessHistory(days = 30) {
    try {
      const userId = await this.getUserId();
      const { API_ENDPOINTS } = await import('../../api-config.js');
      const { apiClient } = await import('../../api-config.js');

      const endpoint = API_ENDPOINTS.readiness.history;
      const response = await apiClient.get(endpoint, {
        athleteId: userId,
        days: days,
      });

      if (response.error) {
        logger.warn('[Wellness] Readiness history fetch failed:', response.error);
        return [];
      }

      return response.data || response || [];
    } catch (error) {
      logger.error('[Wellness] Error fetching readiness history:', error);
      return [];
    }
  }
}

// Create singleton instance
export const wellnessService = new WellnessService();

