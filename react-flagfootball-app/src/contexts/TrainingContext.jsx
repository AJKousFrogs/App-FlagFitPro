import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { trainingService } from '../services/training.service';
import { usePocket } from './PocketContext';

// Initial state
const initialState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  stats: {
    totalSessions: 0,
    totalDuration: 0,
    averageScore: 0,
    streakDays: 0
  },
  goals: [],
  progress: {}
};

// Action types
const TRAINING_ACTIONS = {
  FETCH_SESSIONS_START: 'FETCH_SESSIONS_START',
  FETCH_SESSIONS_SUCCESS: 'FETCH_SESSIONS_SUCCESS',
  FETCH_SESSIONS_FAILURE: 'FETCH_SESSIONS_FAILURE',
  CREATE_SESSION_START: 'CREATE_SESSION_START',
  CREATE_SESSION_SUCCESS: 'CREATE_SESSION_SUCCESS',
  CREATE_SESSION_FAILURE: 'CREATE_SESSION_FAILURE',
  UPDATE_SESSION_START: 'UPDATE_SESSION_START',
  UPDATE_SESSION_SUCCESS: 'UPDATE_SESSION_SUCCESS',
  UPDATE_SESSION_FAILURE: 'UPDATE_SESSION_FAILURE',
  DELETE_SESSION_START: 'DELETE_SESSION_START',
  DELETE_SESSION_SUCCESS: 'DELETE_SESSION_SUCCESS',
  DELETE_SESSION_FAILURE: 'DELETE_SESSION_FAILURE',
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  CLEAR_CURRENT_SESSION: 'CLEAR_CURRENT_SESSION',
  FETCH_STATS_START: 'FETCH_STATS_START',
  FETCH_STATS_SUCCESS: 'FETCH_STATS_SUCCESS',
  FETCH_STATS_FAILURE: 'FETCH_STATS_FAILURE',
  FETCH_GOALS_START: 'FETCH_GOALS_START',
  FETCH_GOALS_SUCCESS: 'FETCH_GOALS_SUCCESS',
  FETCH_GOALS_FAILURE: 'FETCH_GOALS_FAILURE',
  UPDATE_GOAL_START: 'UPDATE_GOAL_START',
  UPDATE_GOAL_SUCCESS: 'UPDATE_GOAL_SUCCESS',
  UPDATE_GOAL_FAILURE: 'UPDATE_GOAL_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const trainingReducer = (state, action) => {
  switch (action.type) {
    case TRAINING_ACTIONS.FETCH_SESSIONS_START:
    case TRAINING_ACTIONS.CREATE_SESSION_START:
    case TRAINING_ACTIONS.UPDATE_SESSION_START:
    case TRAINING_ACTIONS.DELETE_SESSION_START:
    case TRAINING_ACTIONS.FETCH_STATS_START:
    case TRAINING_ACTIONS.FETCH_GOALS_START:
    case TRAINING_ACTIONS.UPDATE_GOAL_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case TRAINING_ACTIONS.FETCH_SESSIONS_SUCCESS:
      return {
        ...state,
        sessions: action.payload,
        isLoading: false,
        error: null
      };

    case TRAINING_ACTIONS.CREATE_SESSION_SUCCESS:
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
        isLoading: false,
        error: null
      };

    case TRAINING_ACTIONS.UPDATE_SESSION_SUCCESS:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        ),
        currentSession: state.currentSession?.id === action.payload.id 
          ? action.payload 
          : state.currentSession,
        isLoading: false,
        error: null
      };

    case TRAINING_ACTIONS.DELETE_SESSION_SUCCESS:
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
        currentSession: state.currentSession?.id === action.payload 
          ? null 
          : state.currentSession,
        isLoading: false,
        error: null
      };

    case TRAINING_ACTIONS.SET_CURRENT_SESSION:
      return {
        ...state,
        currentSession: action.payload
      };

    case TRAINING_ACTIONS.CLEAR_CURRENT_SESSION:
      return {
        ...state,
        currentSession: null
      };

    case TRAINING_ACTIONS.FETCH_STATS_SUCCESS:
      return {
        ...state,
        stats: action.payload,
        isLoading: false,
        error: null
      };

    case TRAINING_ACTIONS.FETCH_GOALS_SUCCESS:
      return {
        ...state,
        goals: action.payload,
        isLoading: false,
        error: null
      };

    case TRAINING_ACTIONS.UPDATE_GOAL_SUCCESS:
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        ),
        isLoading: false,
        error: null
      };

    case TRAINING_ACTIONS.FETCH_SESSIONS_FAILURE:
    case TRAINING_ACTIONS.CREATE_SESSION_FAILURE:
    case TRAINING_ACTIONS.UPDATE_SESSION_FAILURE:
    case TRAINING_ACTIONS.DELETE_SESSION_FAILURE:
    case TRAINING_ACTIONS.FETCH_STATS_FAILURE:
    case TRAINING_ACTIONS.FETCH_GOALS_FAILURE:
    case TRAINING_ACTIONS.UPDATE_GOAL_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case TRAINING_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const TrainingContext = createContext();

// Provider component
export const TrainingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(trainingReducer, initialState);

  // Fetch sessions
  const fetchSessions = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: TRAINING_ACTIONS.FETCH_SESSIONS_START });
      const sessions = await trainingService.getSessions(filters);
      dispatch({
        type: TRAINING_ACTIONS.FETCH_SESSIONS_SUCCESS,
        payload: sessions
      });
      return sessions;
    } catch (error) {
      dispatch({
        type: TRAINING_ACTIONS.FETCH_SESSIONS_FAILURE,
        payload: error.message
      });
      console.error('Failed to fetch sessions:', error);
      // Return empty array to prevent further errors
      return [];
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async (timeframe = 'all') => {
    try {
      dispatch({ type: TRAINING_ACTIONS.FETCH_STATS_START });
      const stats = await trainingService.getStats(timeframe);
      dispatch({
        type: TRAINING_ACTIONS.FETCH_STATS_SUCCESS,
        payload: stats
      });
      return stats;
    } catch (error) {
      dispatch({
        type: TRAINING_ACTIONS.FETCH_STATS_FAILURE,
        payload: error.message
      });
      console.error('Failed to fetch stats:', error);
      // Return default stats to prevent errors
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageScore: 0,
        streakDays: 0
      };
    }
  }, []);

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      dispatch({ type: TRAINING_ACTIONS.FETCH_GOALS_START });
      const goals = await trainingService.getGoals();
      dispatch({
        type: TRAINING_ACTIONS.FETCH_GOALS_SUCCESS,
        payload: goals
      });
      return goals;
    } catch (error) {
      dispatch({
        type: TRAINING_ACTIONS.FETCH_GOALS_FAILURE,
        payload: error.message
      });
      console.error('Failed to fetch goals:', error);
      // Return empty array to prevent errors
      return [];
    }
  }, []);

  // Only initialize training data after successful authentication
  const { isAuthenticated, isLoading: authLoading } = usePocket();
  
  useEffect(() => {
    // Only initialize when user is authenticated and not loading
    if (!authLoading && isAuthenticated) {
      console.log('Initializing training data for authenticated user...');
      
      const initializeTraining = async () => {
        try {
          await Promise.all([
            fetchSessions(),
            fetchStats(),
            fetchGoals()
          ]);
          console.log('Training data initialization completed');
        } catch (error) {
          console.error('Failed to initialize training data:', error);
        }
      };

      initializeTraining();
    } else {
      console.log('Skipping training data initialization - auth not ready:', { authLoading, isAuthenticated });
    }
  }, [isAuthenticated, authLoading]);

  // Create session
  const createSession = async (sessionData) => {
    dispatch({ type: TRAINING_ACTIONS.CREATE_SESSION_START });
    const session = await trainingService.createSession(sessionData);
    dispatch({
      type: TRAINING_ACTIONS.CREATE_SESSION_SUCCESS,
      payload: session
    });
    return session;
  };

  // Update session
  const updateSession = async (sessionId, updates) => {
    dispatch({ type: TRAINING_ACTIONS.UPDATE_SESSION_START });
    const session = await trainingService.updateSession(sessionId, updates);
    dispatch({
      type: TRAINING_ACTIONS.UPDATE_SESSION_SUCCESS,
      payload: session
    });
    return session;
  };

  // Delete session
  const deleteSession = async (sessionId) => {
    dispatch({ type: TRAINING_ACTIONS.DELETE_SESSION_START });
    await trainingService.deleteSession(sessionId);
    dispatch({
      type: TRAINING_ACTIONS.DELETE_SESSION_SUCCESS,
      payload: sessionId
    });
  };

  // Set current session
  const setCurrentSession = (session) => {
    dispatch({
      type: TRAINING_ACTIONS.SET_CURRENT_SESSION,
      payload: session
    });
  };

  // Clear current session
  const clearCurrentSession = () => {
    dispatch({ type: TRAINING_ACTIONS.CLEAR_CURRENT_SESSION });
  };

  // Update goal
  const updateGoal = async (goalId, updates) => {
    dispatch({ type: TRAINING_ACTIONS.UPDATE_GOAL_START });
    const goal = await trainingService.updateGoal(goalId, updates);
    dispatch({
      type: TRAINING_ACTIONS.UPDATE_GOAL_SUCCESS,
      payload: goal
    });
    return goal;
  };

  // Create goal
  const createGoal = async (goalData) => {
    dispatch({ type: TRAINING_ACTIONS.UPDATE_GOAL_START });
    const goal = await trainingService.createGoal(goalData);
    dispatch({
      type: TRAINING_ACTIONS.UPDATE_GOAL_SUCCESS,
      payload: goal
    });
    return goal;
  };

  // Delete goal
  const deleteGoal = async (goalId) => {
    dispatch({ type: TRAINING_ACTIONS.UPDATE_GOAL_START });
    await trainingService.deleteGoal(goalId);
    // Refresh goals after deletion
    await fetchGoals();
  };

  // Get session by ID
  const getSessionById = async (sessionId) => {
    const session = await trainingService.getSessionById(sessionId);
    return session;
  };

  // Get recommended drills
  const getRecommendedDrills = async (filters = {}) => {
    const drills = await trainingService.getRecommendedDrills(filters);
    return drills;
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: TRAINING_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    setCurrentSession,
    clearCurrentSession,
    fetchStats,
    fetchGoals,
    updateGoal,
    createGoal,
    deleteGoal,
    getSessionById,
    getRecommendedDrills,
    clearError
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
};

// Custom hook to use training context
export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}; 