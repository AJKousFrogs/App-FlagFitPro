/**
 * Hybrid Analytics Service
 * Combines PocketBase (for basic tracking) with Neon/PostgreSQL (for advanced analytics)
 * 
 * Architecture:
 * - PocketBase: Real-time events, basic metrics, offline support
 * - Neon/PostgreSQL: Advanced analytics, complex queries, reporting
 */

// Removed direct import - will use dynamic import when needed
// Removed direct import - will use dynamic import when needed

class HybridAnalyticsService {
  constructor() {
    this.functionsUrl = '/.netlify/functions';
    this.isOnline = navigator.onLine;
    this.eventQueue = [];
    this.setupOnlineStatusListener();
  }

  setupOnlineStatusListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEventQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Track event to both PocketBase and Neon
   * @param {Object} eventData - Event data to track
   */
  async trackEvent(eventData) {
    const enrichedEvent = {
      ...eventData,
      timestamp: new Date().toISOString(),
      session_id: this.getSessionId(),
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    try {
      // Always track to PocketBase first (faster, real-time)
      await analyticsService.trackEvent(enrichedEvent);
      
      // Track to Neon for advanced analytics (if online)
      if (this.isOnline) {
        await this.trackToNeon(enrichedEvent);
      } else {
        // Queue for later if offline
        this.eventQueue.push(enrichedEvent);
      }
    } catch (error) {
      logger.error('Failed to track event:', error);
    }
  }

  /**
   * Track performance metrics to Neon
   * @param {Object} performanceData - Performance metrics
   */
  async trackPerformance(performanceData) {
    // Temporarily disabled to prevent 500 errors
    // TODO: Configure Neon database for production
    console.log('Performance tracking temporarily disabled:', performanceData);
    return null;
  }

  /**
   * Get basic analytics from PocketBase (fast)
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Basic analytics data
   */
  async getBasicAnalytics(filters = {}) {
    try {
      return await analyticsService.getEvents(filters);
    } catch (error) {
      logger.error('Failed to get basic analytics:', error);
      return [];
    }
  }

  /**
   * Get advanced analytics from Neon (powerful)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Advanced analytics data
   */
  async getAdvancedAnalytics(params = {}) {
    // Temporarily disabled to prevent 500 errors
    // TODO: Configure Neon database for production
    console.log('Advanced analytics temporarily disabled, using basic analytics');
    return this.getBasicAnalytics(params);
  }

  /**
   * Get user behavior analysis from Neon
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - User behavior data
   */
  async getUserBehavior(params = {}) {
    // Temporarily disabled to prevent 500 errors
    // TODO: Configure Neon database for production
    console.log('User behavior analytics temporarily disabled');
    return { userJourneys: [], featureUsage: [], conversionFunnel: [], retention: [] };
  }

  /**
   * Get performance report from Neon
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Performance report
   */
  async getPerformanceReport(params = {}) {
    // Temporarily disabled to prevent 500 errors
    // TODO: Configure Neon database for production
    console.log('Performance report temporarily disabled');
    return { summary: {}, pagePerformance: [], trends: [] };
  }

  /**
   * Track to Neon database via Netlify Functions
   * @param {Object} eventData - Event data
   */
  async trackToNeon(eventData) {
    // Temporarily disabled to prevent 500 errors
    // TODO: Configure Neon database for production
    console.log('Neon tracking temporarily disabled:', eventData.type);
    return null;
  }

  /**
   * Flush queued events when coming back online
   */
  async flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    logger.info(`Flushing ${this.eventQueue.length} queued events`);
    
    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      try {
        await this.trackToNeon(event);
      } catch (error) {
        logger.error('Failed to flush queued event:', error);
        // Re-queue if still failing
        this.eventQueue.push(event);
      }
    }
  }

  /**
   * Get session ID (create if doesn't exist)
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    try {
      const authData = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
      return authData.model?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  /**
   * Get offline analytics (from PocketBase only)
   */
  async getOfflineAnalytics() {
    try {
      const events = await analyticsService.getEvents({ limit: 100 });
      return {
        events,
        metrics: {
          totalEvents: events.length,
          uniqueUsers: new Set(events.map(e => e.user_id)).size,
          message: 'Offline mode - limited analytics available'
        },
        topPages: []
      };
    } catch (error) {
      logger.error('Failed to get offline analytics:', error);
      return {
        events: [],
        metrics: { totalEvents: 0, uniqueUsers: 0 },
        topPages: []
      };
    }
  }

  /**
   * Track page view (convenience method)
   */
  trackPageView(additionalData = {}) {
    return this.trackEvent({
      type: 'page_view',
      ...additionalData
    });
  }

  /**
   * Track feature usage (convenience method)
   */
  trackFeatureUsage(feature, additionalData = {}) {
    return this.trackEvent({
      type: 'feature_usage',
      feature,
      ...additionalData
    });
  }

  /**
   * Track user action (convenience method)
   */
  trackUserAction(action, additionalData = {}) {
    return this.trackEvent({
      type: 'user_action',
      action,
      ...additionalData
    });
  }

  /**
   * Auto-track performance metrics
   */
  startPerformanceTracking() {
    // Track initial page load
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.trackPerformance({
          load_time: navigation.loadEventEnd - navigation.fetchStart,
          api_response_time: navigation.responseEnd - navigation.requestStart,
          connection_type: navigator.connection?.effectiveType || 'unknown'
        });
      }
    });

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.trackPerformance({
              fcp: entry.startTime,
              metric_type: 'core_web_vital'
            });
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.trackPerformance({
            lcp: lastEntry.startTime,
            metric_type: 'core_web_vital'
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }
}

// Export singleton instance
export const hybridAnalyticsService = new HybridAnalyticsService();
export default hybridAnalyticsService;