// Analytics Service for React
import pocketbaseService from './pocketbase-client.service.js';
import cacheService from './cache.service.js';
import { COLLECTIONS } from '../config/collections.js';

class AnalyticsService {
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
        pocketbaseUrl: import.meta.env.VITE_POCKETBASE_URL || import.meta.env.VITE_DATABASE_URL || process.env.POCKETBASE_URL || '',
        apiTimeout: 30000,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
        maxRetries: 3
      };
    }
    return this.config;
  }

  /**
   * Track an analytics event
   * @param {Object} eventData - Event data to track
   * @returns {Promise<Object>} - Created event record
   */
  async trackEvent(eventData) {
    try {
      const result = await this._getPocketbase().create(COLLECTIONS.ANALYTICS_EVENTS, {
        event_type: eventData.type,
        event_data: eventData,
        user_id: this._getPocketbase().authStore.model?.id,
        session_id: eventData.sessionId,
        timestamp: eventData.timestamp || new Date().toISOString(),
        page_url: eventData.pageUrl,
        user_agent: eventData.userAgent
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      throw new Error(`Failed to track event: ${error.message}`);
    }
  }

  /**
   * Get analytics events with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of events
   */
  async getEvents(filters = {}) {
    try {
      // Check if user is authenticated
      const pocketbase = this._getPocketbase();
      if (!pocketbase.isAuthenticated()) {
        console.log('User not authenticated, returning empty analytics events');
        return [];
      }

      const cacheKey = `analytics:events:${JSON.stringify(filters)}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;

      const options = {
        page: filters.page || 1,
        perPage: filters.perPage || 50,
        sort: filters.sort || '-timestamp',
        filter: this.buildEventFilterString(filters)
      };

      const result = await pocketbase.getList(COLLECTIONS.ANALYTICS_EVENTS, options);
      
      if (result.error) {
        console.error('PocketBase error fetching analytics events:', result.error);
        throw new Error(`Failed to fetch analytics events: ${result.error}`);
      }

      cacheService.set(cacheKey, result.data, 2 * 60 * 1000); // 2 minutes
      return result.data;
    } catch (error) {
      console.warn('Analytics events service error (returning empty array):', error.message);
      // Always return empty array for any error to prevent app crashes
      return [];
    }
  }

  /**
   * Get analytics metrics for a given timeframe
   * @param {string} timeframe - Timeframe ('1d', '7d', '30d', '90d', 'all')
   * @returns {Promise<Object>} - Metrics object
   */
  async getMetrics(timeframe = '7d') {
    try {
      const cacheKey = `analytics:metrics:${timeframe}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;

      const startDate = this.getStartDateForTimeframe(timeframe);
      const filter = startDate ? `timestamp >= "${startDate.toISOString()}"` : '';
      
      const events = await this.getEvents({ filter });

      const metrics = {
        pageViews: events.filter(e => e.event_type === 'page_view').length,
        uniqueUsers: new Set(events.map(e => e.user_id).filter(Boolean)).size,
        sessionDuration: this.calculateAverageSessionDuration(events),
        conversionRate: this.calculateConversionRate(events)
      };

      cacheService.set(cacheKey, metrics, 5 * 60 * 1000); // 5 minutes
      return metrics;
    } catch (error) {
      console.warn('Analytics metrics service error (returning empty metrics):', error.message);
      return {
        pageViews: 0,
        uniqueUsers: 0,
        sessionDuration: 0,
        conversionRate: 0
      };
    }
  }

  /**
   * Calculate average session duration from events
   * @param {Array} events - Array of analytics events
   * @returns {number} - Average session duration in milliseconds
   */
  calculateAverageSessionDuration(events) {
    const sessions = {};
    events.forEach(event => {
      if (!sessions[event.session_id]) {
        sessions[event.session_id] = {
          start: null,
          end: null
        };
      }
      const timestamp = new Date(event.timestamp);
      if (!sessions[event.session_id].start || timestamp < sessions[event.session_id].start) {
        sessions[event.session_id].start = timestamp;
      }
      if (!sessions[event.session_id].end || timestamp > sessions[event.session_id].end) {
        sessions[event.session_id].end = timestamp;
      }
    });

    const durations = Object.values(sessions)
      .filter(session => session.start && session.end)
      .map(session => session.end - session.start);

    return durations.length > 0 ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0;
  }

  /**
   * Calculate conversion rate from events
   * @param {Array} events - Array of analytics events
   * @returns {number} - Conversion rate as percentage
   */
  calculateConversionRate(events) {
    const totalUsers = new Set(events.map(e => e.user_id).filter(Boolean)).size;
    const convertedUsers = new Set(
      events
        .filter(e => e.event_type === 'conversion')
        .map(e => e.user_id)
        .filter(Boolean)
    ).size;

    return totalUsers > 0 ? (convertedUsers / totalUsers) * 100 : 0;
  }

  /**
   * Get user behavior analytics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - User behavior data
   */
  async getUserBehavior(filters = {}) {
    try {
      const cacheKey = `analytics:behavior:${JSON.stringify(filters)}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;

      const events = await this.getEvents({ ...filters, eventType: 'page_view' });

      const behavior = {
        mostVisitedPages: this.getMostVisitedPages(events),
        userJourney: this.getUserJourney(events),
        dropoffPoints: this.getDropoffPoints(events)
      };

      cacheService.set(cacheKey, behavior, 10 * 60 * 1000); // 10 minutes
      return behavior;
    } catch (error) {
      console.warn('Analytics user behavior service error (returning empty behavior):', error.message);
      return {
        mostVisitedPages: [],
        userJourney: [],
        dropoffPoints: []
      };
    }
  }

  /**
   * Get most visited pages from events
   * @param {Array} events - Array of page view events
   * @returns {Array} - Array of page objects with count
   */
  getMostVisitedPages(events) {
    const pageCounts = {};
    events.forEach(event => {
      const page = event.event_data?.pageUrl || 'unknown';
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get user journey data from events
   * @param {Array} events - Array of page view events
   * @returns {Array} - Array of user journeys
   */
  getUserJourney(events) {
    const journeys = {};
    events.forEach(event => {
      const userId = event.user_id;
      if (!journeys[userId]) {
        journeys[userId] = [];
      }
      journeys[userId].push({
        page: event.event_data?.pageUrl || 'unknown',
        timestamp: event.timestamp
      });
    });

    return Object.values(journeys)
      .filter(journey => journey.length > 1)
      .slice(0, 50); // Limit to 50 journeys for performance
  }

  /**
   * Calculate dropoff points from page view events
   * @param {Array} events - Array of page view events
   * @returns {Array} - Array of dropoff point objects
   */
  getDropoffPoints(events) {
    const pageExits = {};
    const pageEntrances = {};
    const pageTransitions = {};

    // Group events by session and user
    const sessions = {};
    events.forEach(event => {
      const sessionId = event.session_id;
      const userId = event.user_id;
      const page = event.event_data?.pageUrl || 'unknown';
      
      if (!sessions[sessionId]) {
        sessions[sessionId] = [];
      }
      sessions[sessionId].push({ page, timestamp: event.timestamp, userId });
      
      pageEntrances[page] = (pageEntrances[page] || 0) + 1;
    });

    // Calculate exits and transitions
    Object.values(sessions).forEach(session => {
      session.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      for (let i = 0; i < session.length; i++) {
        const currentPage = session[i].page;
        const nextPage = session[i + 1]?.page;
        
        if (!nextPage) {
          // This is an exit
          pageExits[currentPage] = (pageExits[currentPage] || 0) + 1;
        } else {
          // This is a transition
          const transitionKey = `${currentPage}->${nextPage}`;
          pageTransitions[transitionKey] = (pageTransitions[transitionKey] || 0) + 1;
        }
      }
    });

    // Calculate dropoff rates
    return Object.entries(pageEntrances)
      .map(([page, entrances]) => {
        const exits = pageExits[page] || 0;
        const dropoffRate = entrances > 0 ? (exits / entrances) * 100 : 0;
        
        return {
          page,
          entrances,
          exits,
          dropoffRate: Math.round(dropoffRate * 100) / 100 // Round to 2 decimal places
        };
      })
      .sort((a, b) => b.dropoffRate - a.dropoffRate)
      .slice(0, 10);
  }

  /**
   * Get performance metrics
   * @param {string} timeframe - Timeframe for performance data
   * @returns {Promise<Object>} - Performance metrics
   */
  async getPerformance(timeframe = '7d') {
    try {
      const cacheKey = `analytics:performance:${timeframe}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;

      const events = await this.getEvents({ 
        eventType: 'performance',
        timeframe 
      });

      const performance = {
        loadTimes: events.map(e => e.event_data?.loadTime || 0),
        errorRates: this.calculateErrorRates(events),
        apiResponseTimes: events.map(e => e.event_data?.apiResponseTime || 0)
      };

      cacheService.set(cacheKey, performance, 5 * 60 * 1000); // 5 minutes
      return performance;
    } catch (error) {
      console.warn('Analytics performance service error (returning empty performance):', error.message);
      return {
        loadTimes: [],
        errorRates: [],
        apiResponseTimes: []
      };
    }
  }

  /**
   * Calculate error rates from performance events
   * @param {Array} events - Array of performance events
   * @returns {number} - Error rate as percentage
   */
  calculateErrorRates(events) {
    const totalEvents = events.length;
    const errorEvents = events.filter(e => e.event_data?.hasError).length;
    return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
  }

  /**
   * Get conversion funnel data
   * @param {string} funnelId - Funnel identifier
   * @returns {Promise<Object>} - Conversion funnel data
   */
  async getConversionFunnel(funnelId) {
    const cacheKey = `analytics:funnel:${funnelId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this._getPocketbase().getOne('conversion_funnels', funnelId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      cacheService.set(cacheKey, result.data, 15 * 60 * 1000); // 15 minutes
      return result.data;
    } catch (error) {
      throw new Error(`Failed to fetch conversion funnel: ${error.message}`);
    }
  }

  /**
   * Get A/B test results
   * @param {string} testId - Test identifier
   * @returns {Promise<Array>} - A/B test results
   */
  async getABTestResults(testId) {
    const cacheKey = `analytics:ab_test:${testId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this._getPocketbase().getList('ab_test_results', {
        filter: `test_id = "${testId}"`
      });
      
      if (result.error) {
        throw new Error(result.error);
      }

      cacheService.set(cacheKey, result.data, 10 * 60 * 1000); // 10 minutes
      return result.data;
    } catch (error) {
      throw new Error(`Failed to fetch A/B test results: ${error.message}`);
    }
  }

  /**
   * Export analytics data in specified format
   * @param {string} format - Export format ('csv', 'json')
   * @param {Object} filters - Filter criteria
   * @returns {Promise<string|Array>} - Exported data
   */
  async exportData(format = 'csv', filters = {}) {
    try {
      const events = await this.getEvents(filters);
      
      if (format === 'csv') {
        const headers = ['timestamp', 'event_type', 'user_id', 'page_url', 'event_data'];
        const csvContent = [
          headers.join(','),
          ...events.map(event => [
            event.timestamp,
            event.event_type,
            event.user_id,
            event.page_url,
            JSON.stringify(event.event_data)
          ].join(','))
        ].join('\n');
        
        return csvContent;
      }
      
      return events;
    } catch (error) {
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }

  /**
   * Build filter string for analytics events
   * @param {Object} filters - Filter object
   * @returns {string} - Filter string
   */
  buildEventFilterString(filters) {
    const conditions = [];

    // Always filter by current user if authenticated
    const pocketbase = this._getPocketbase();
    const currentUserId = filters.userId || pocketbase.authStore.model?.id;
    if (currentUserId) {
      conditions.push(`user_id = "${currentUserId}"`);
    }

    if (filters.eventType && filters.eventType !== 'all') {
      conditions.push(`event_type = "${filters.eventType}"`);
    }

    if (filters.dateFrom) {
      conditions.push(`timestamp >= "${filters.dateFrom}"`);
    }

    if (filters.dateTo) {
      conditions.push(`timestamp <= "${filters.dateTo}"`);
    }

    if (filters.filter) {
      conditions.push(filters.filter);
    }

    return conditions.join(' && ');
  }

  /**
   * Get start date for timeframe
   * @param {string} timeframe - Timeframe string
   * @returns {Date|null} - Start date or null
   */
  getStartDateForTimeframe(timeframe) {
    const now = new Date();
    
    switch (timeframe) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'all':
        return null;
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get mock analytics events for fallback
   * @returns {Array} - Mock analytics events
   */
  getMockAnalyticsEvents() {
    return [
      {
        id: 'event-1',
        event_type: 'performance',
        event_data: {
          metric: 'sprint_time',
          value: 4.2,
          unit: 'seconds'
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user_id: 'mock-user'
      },
      {
        id: 'event-2',
        event_type: 'training_session',
        event_data: {
          session_type: 'agility',
          duration: 45,
          exercises_completed: 8
        },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'mock-user'
      }
    ];
  }
}

// Export an instance
export const analyticsService = new AnalyticsService(); 