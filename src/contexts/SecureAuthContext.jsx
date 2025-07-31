// SecureAuthContext.jsx - Enhanced authentication context with security improvements
// Addresses security and type safety improvements from code review

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import SecureAuthService from '../services/SecureAuthService';
import { withErrorBoundary } from '../components/ErrorBoundary';

// Action types for better type safety
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  CHECK_AUTH_START: 'CHECK_AUTH_START',
  CHECK_AUTH_SUCCESS: 'CHECK_AUTH_SUCCESS',
  CHECK_AUTH_FAILURE: 'CHECK_AUTH_FAILURE',
  LOGOUT_START: 'LOGOUT_START',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  LOGOUT_FAILURE: 'LOGOUT_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  SESSION_WARNING: 'SESSION_WARNING',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  REFRESH_SESSION: 'REFRESH_SESSION'
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  sessionExpiresAt: null,
  lastActivity: null,
  sessionWarning: false,
  retryCount: 0
};

// Auth reducer with comprehensive state management
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.CHECK_AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
        sessionExpiresAt: action.payload.sessionExpiresAt || null,
        lastActivity: new Date().toISOString(),
        sessionWarning: false,
        retryCount: 0
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: false, // User needs to verify email
        isLoading: false,
        isInitialized: true,
        error: null,
        retryCount: 0
      };

    case AUTH_ACTIONS.CHECK_AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
        isInitialized: true,
        error: null,
        lastActivity: new Date().toISOString(),
        sessionWarning: false
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.CHECK_AUTH_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: action.payload.error,
        retryCount: state.retryCount + 1
      };

    case AUTH_ACTIONS.LOGOUT_START:
      return {
        ...state,
        isLoading: true
      };

    case AUTH_ACTIONS.LOGOUT_SUCCESS:
    case AUTH_ACTIONS.LOGOUT_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.type === AUTH_ACTIONS.LOGOUT_FAILURE ? action.payload.error : null,
        sessionExpiresAt: null,
        lastActivity: null,
        sessionWarning: false,
        retryCount: 0
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload.user,
        lastActivity: new Date().toISOString()
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading
      };

    case AUTH_ACTIONS.SESSION_WARNING:
      return {
        ...state,
        sessionWarning: true
      };

    case AUTH_ACTIONS.SESSION_TIMEOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        sessionExpiresAt: null,
        lastActivity: null,
        sessionWarning: false,
        error: 'Your session has expired. Please log in again.'
      };

    case AUTH_ACTIONS.REFRESH_SESSION:
      return {
        ...state,
        lastActivity: new Date().toISOString(),
        sessionWarning: false,
        sessionExpiresAt: action.payload.sessionExpiresAt || state.sessionExpiresAt
      };

    default:
      return state;
  }
}

// Create contexts
const AuthContext = createContext(null);
const AuthDispatchContext = createContext(null);

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  const dispatch = useContext(AuthDispatchContext);

  if (!context || !dispatch) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return { ...context, dispatch };
}

// Auth provider component
function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Session event handlers
  const handleSessionWarning = useCallback((event) => {
    dispatch({ type: AUTH_ACTIONS.SESSION_WARNING });
  }, []);

  const handleSessionTimeout = useCallback((event) => {
    dispatch({ type: AUTH_ACTIONS.SESSION_TIMEOUT });
  }, []);

  // Set up session event listeners
  useEffect(() => {
    window.addEventListener('sessionWarning', handleSessionWarning);
    window.addEventListener('sessionTimeout', handleSessionTimeout);

    return () => {
      window.removeEventListener('sessionWarning', handleSessionWarning);
      window.removeEventListener('sessionTimeout', handleSessionTimeout);
    };
  }, [handleSessionWarning, handleSessionTimeout]);

  // Login function with comprehensive error handling
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await SecureAuthService.login(credentials);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          sessionExpiresAt: response.sessionExpiresAt
        }
      });

      return response;
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      throw error;
    }
  }, []);

  // Register function with validation
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      const response = await SecureAuthService.register(userData);

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user: response.user }
      });

      return response;
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage }
      });

      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGOUT_START });

      await SecureAuthService.logout();

      dispatch({ type: AUTH_ACTIONS.LOGOUT_SUCCESS });
    } catch (error) {
      // Even if logout fails, clear local state
      dispatch({
        type: AUTH_ACTIONS.LOGOUT_SUCCESS,
        payload: { error: error.message }
      });
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_START });

      const response = await SecureAuthService.checkAuth();

      dispatch({
        type: AUTH_ACTIONS.CHECK_AUTH_SUCCESS,
        payload: {
          user: response.user,
          isAuthenticated: response.isAuthenticated
        }
      });

      return response.isAuthenticated;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.CHECK_AUTH_FAILURE,
        payload: { error: error.message }
      });

      return false;
    }
  }, []);

  // Update user information
  const updateUser = useCallback(async (updates) => {
    try {
      const updatedUser = { ...state.user, ...updates };
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user: updatedUser }
      });

      // Update session storage
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, [state.user]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const response = await SecureAuthService.checkAuth();
      
      if (response.isAuthenticated) {
        dispatch({
          type: AUTH_ACTIONS.REFRESH_SESSION,
          payload: { sessionExpiresAt: response.sessionExpiresAt }
        });
        return true;
      } else {
        dispatch({ type: AUTH_ACTIONS.SESSION_TIMEOUT });
        return false;
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SESSION_TIMEOUT });
      return false;
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Activity tracker for session management
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const updateLastActivity = () => {
      dispatch({
        type: AUTH_ACTIONS.REFRESH_SESSION,
        payload: { sessionExpiresAt: state.sessionExpiresAt }
      });
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const throttledUpdate = throttle(updateLastActivity, 60000); // Update at most once per minute

    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdate);
      });
    };
  }, [state.isAuthenticated, state.sessionExpiresAt]);

  // Memoized context values for performance
  const contextValue = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
    clearError,
    refreshSession
  }), [state, login, register, logout, checkAuth, updateUser, clearError, refreshSession]);

  return (
    <AuthContext.Provider value={contextValue}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
}

// HOC for components that require authentication
export function withAuth(Component, options = {}) {
  const { 
    redirectTo = '/login',
    requireAuth = true,
    allowedRoles = null,
    fallback = null 
  } = options;

  return function AuthenticatedComponent(props) {
    const { isAuthenticated, user, isLoading } = useAuth();

    // Show loading state
    if (isLoading) {
      return fallback || <div>Loading...</div>;
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      window.location.href = redirectTo;
      return null;
    }

    // Check role requirements
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return <div>Access denied. Insufficient permissions.</div>;
    }

    return <Component {...props} />;
  };
}

// Session warning component
export function SessionWarning() {
  const { sessionWarning, refreshSession, logout } = useAuth();
  const [timeLeft, setTimeLeft] = React.useState(300); // 5 minutes

  useEffect(() => {
    if (!sessionWarning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionWarning, logout]);

  const handleExtendSession = async () => {
    await refreshSession();
  };

  if (!sessionWarning) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Session Expiring Soon
        </h3>
        <p className="text-gray-600 mb-4">
          Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}. 
          Would you like to extend your session?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExtendSession}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Extend Session
          </button>
          <button
            onClick={logout}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility function for throttling
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Enhanced AuthProvider with error boundary
const SecureAuthProvider = withErrorBoundary(AuthProvider, {
  fallback: ({ error, retry }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Authentication System Error
        </h2>
        <p className="text-gray-600 mb-6">
          There was an error initializing the authentication system.
        </p>
        <button
          onClick={retry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  ),
  level: 'app'
});

export { SecureAuthProvider, AUTH_ACTIONS };
export default SecureAuthProvider;