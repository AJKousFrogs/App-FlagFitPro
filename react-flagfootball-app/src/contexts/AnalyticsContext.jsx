import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { analyticsService } from '../services/analytics.service';
import { usePocket } from './PocketContext';

// Initial state
const initialState = {
  events: [],
  metrics: {
    pageViews: 0,
    uniqueUsers: 0,
    sessionDuration: 0,
    conversionRate: 0
  },
  userBehavior: {
    mostVisitedPages: [],
    userJourney: [],
    dropoffPoints: []
  },
  performance: {
    loadTimes: [],
    errorRates: [],
    apiResponseTimes: []
  },
  isLoading: false,
  error: null,
  filters: {
    dateRange: '7d',
    eventType: 'all',
    userId: null
  }
};

// Action types
const ANALYTICS_ACTIONS = {
  FETCH_EVENTS_START: 'FETCH_EVENTS_START',
  FETCH_EVENTS_SUCCESS: 'FETCH_EVENTS_SUCCESS',
  FETCH_EVENTS_FAILURE: 'FETCH_EVENTS_FAILURE',
  TRACK_EVENT_START: 'TRACK_EVENT_START',
  TRACK_EVENT_SUCCESS: 'TRACK_EVENT_SUCCESS',
  TRACK_EVENT_FAILURE: 'TRACK_EVENT_FAILURE',
  FETCH_METRICS_START: 'FETCH_METRICS_START',
  FETCH_METRICS_SUCCESS: 'FETCH_METRICS_SUCCESS',
  FETCH_METRICS_FAILURE: 'FETCH_METRICS_FAILURE',
  FETCH_USER_BEHAVIOR_START: 'FETCH_USER_BEHAVIOR_START',
  FETCH_USER_BEHAVIOR_SUCCESS: 'FETCH_USER_BEHAVIOR_SUCCESS',
  FETCH_USER_BEHAVIOR_FAILURE: 'FETCH_USER_BEHAVIOR_FAILURE',
  FETCH_PERFORMANCE_START: 'FETCH_PERFORMANCE_START',
  FETCH_PERFORMANCE_SUCCESS: 'FETCH_PERFORMANCE_SUCCESS',
  FETCH_PERFORMANCE_FAILURE: 'FETCH_PERFORMANCE_FAILURE',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const analyticsReducer = (state, action) => {
  switch (action.type) {
    case ANALYTICS_ACTIONS.FETCH_EVENTS_START:
    case ANALYTICS_ACTIONS.TRACK_EVENT_START:
    case ANALYTICS_ACTIONS.FETCH_METRICS_START:
    case ANALYTICS_ACTIONS.FETCH_USER_BEHAVIOR_START:
    case ANALYTICS_ACTIONS.FETCH_PERFORMANCE_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ANALYTICS_ACTIONS.FETCH_EVENTS_SUCCESS:
      return {
        ...state,
        events: action.payload,
        isLoading: false,
        error: null
      };

    case ANALYTICS_ACTIONS.TRACK_EVENT_SUCCESS:
      return {
        ...state,
        events: [action.payload, ...state.events],
        isLoading: false,
        error: null
      };

    case ANALYTICS_ACTIONS.FETCH_METRICS_SUCCESS:
      return {
        ...state,
        metrics: action.payload,
        isLoading: false,
        error: null
      };

    case ANALYTICS_ACTIONS.FETCH_USER_BEHAVIOR_SUCCESS:
      return {
        ...state,
        userBehavior: action.payload,
        isLoading: false,
        error: null
      };

    case ANALYTICS_ACTIONS.FETCH_PERFORMANCE_SUCCESS:
      return {
        ...state,
        performance: action.payload,
        isLoading: false,
        error: null
      };

    case ANALYTICS_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case ANALYTICS_ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: {
          dateRange: '7d',
          eventType: 'all',
          userId: null
        }
      };

    case ANALYTICS_ACTIONS.FETCH_EVENTS_FAILURE:
    case ANALYTICS_ACTIONS.TRACK_EVENT_FAILURE:
    case ANALYTICS_ACTIONS.FETCH_METRICS_FAILURE:
    case ANALYTICS_ACTIONS.FETCH_USER_BEHAVIOR_FAILURE:
    case ANALYTICS_ACTIONS.FETCH_PERFORMANCE_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case ANALYTICS_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AnalyticsContext = createContext();

// Provider component
export const AnalyticsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);

  // Only initialize analytics data after successful authentication
  const { isAuthenticated, isLoading: authLoading } = usePocket();

  useEffect(() => {
    // Only initialize when user is authenticated and not loading
    if (!authLoading && isAuthenticated) {
      console.log('Initializing analytics data for authenticated user...');
      
      const initializeAnalytics = async () => {
        try {
          await Promise.all([
            fetchMetrics(),
            fetchUserBehavior(),
            fetchPerformance()
          ]);
          console.log('Analytics data initialization completed');
        } catch (error) {
          console.error('Failed to initialize analytics data:', error);
        }
      };

      initializeAnalytics();
    } else {
      console.log('Skipping analytics data initialization - auth not ready:', { authLoading, isAuthenticated });
    }
  }, [isAuthenticated, authLoading]);

  // Fetch events
  const fetchEvents = async (filters = {}) => {
    try {
      dispatch({ type: ANALYTICS_ACTIONS.FETCH_EVENTS_START });
      const events = await analyticsService.getEvents(filters);
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_EVENTS_SUCCESS,
        payload: events
      });
      return events;
    } catch (error) {
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_EVENTS_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Track event
  const trackEvent = async (eventData) => {
    try {
      dispatch({ type: ANALYTICS_ACTIONS.TRACK_EVENT_START });
      const event = await analyticsService.trackEvent(eventData);
      dispatch({
        type: ANALYTICS_ACTIONS.TRACK_EVENT_SUCCESS,
        payload: event
      });
      return event;
    } catch (error) {
      dispatch({
        type: ANALYTICS_ACTIONS.TRACK_EVENT_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Fetch metrics
  const fetchMetrics = async (timeframe = '7d') => {
    try {
      dispatch({ type: ANALYTICS_ACTIONS.FETCH_METRICS_START });
      const metrics = await analyticsService.getMetrics(timeframe);
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_METRICS_SUCCESS,
        payload: metrics
      });
      return metrics;
    } catch (error) {
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_METRICS_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Fetch user behavior
  const fetchUserBehavior = async (filters = {}) => {
    try {
      dispatch({ type: ANALYTICS_ACTIONS.FETCH_USER_BEHAVIOR_START });
      const behavior = await analyticsService.getUserBehavior(filters);
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_USER_BEHAVIOR_SUCCESS,
        payload: behavior
      });
      return behavior;
    } catch (error) {
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_USER_BEHAVIOR_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Fetch performance data
  const fetchPerformance = async (timeframe = '7d') => {
    try {
      dispatch({ type: ANALYTICS_ACTIONS.FETCH_PERFORMANCE_START });
      const performance = await analyticsService.getPerformance(timeframe);
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_PERFORMANCE_SUCCESS,
        payload: performance
      });
      return performance;
    } catch (error) {
      dispatch({
        type: ANALYTICS_ACTIONS.FETCH_PERFORMANCE_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Set filters
  const setFilters = (filters) => {
    dispatch({
      type: ANALYTICS_ACTIONS.SET_FILTERS,
      payload: filters
    });
  };

  // Clear filters
  const clearFilters = () => {
    dispatch({ type: ANALYTICS_ACTIONS.CLEAR_FILTERS });
  };

  // Track page view
  const trackPageView = async (pageData) => {
    try {
      const eventData = {
        type: 'page_view',
        timestamp: new Date().toISOString(),
        ...pageData
      };
      await trackEvent(eventData);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  // Track user interaction
  const trackInteraction = async (interactionData) => {
    try {
      const eventData = {
        type: 'user_interaction',
        timestamp: new Date().toISOString(),
        ...interactionData
      };
      await trackEvent(eventData);
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  // Track performance metric
  const trackPerformance = async (performanceData) => {
    try {
      const eventData = {
        type: 'performance',
        timestamp: new Date().toISOString(),
        ...performanceData
      };
      await trackEvent(eventData);
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  };

  // Get conversion funnel
  const getConversionFunnel = async (funnelId) => {
    return analyticsService.getConversionFunnel(funnelId);
  };

  // Get A/B test results
  const getABTestResults = async (testId) => {
    return analyticsService.getABTestResults(testId);
  };

  // Export analytics data
  const exportData = async (format = 'csv', filters = {}) => {
    return analyticsService.exportData(format, filters);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: ANALYTICS_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    fetchEvents,
    trackEvent,
    fetchMetrics,
    fetchUserBehavior,
    fetchPerformance,
    setFilters,
    clearFilters,
    trackPageView,
    trackInteraction,
    trackPerformance,
    getConversionFunnel,
    getABTestResults,
    exportData,
    clearError
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}; 