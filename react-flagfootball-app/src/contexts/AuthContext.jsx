import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  CHECK_AUTH_START: 'CHECK_AUTH_START',
  CHECK_AUTH_SUCCESS: 'CHECK_AUTH_SUCCESS',
  CHECK_AUTH_FAILURE: 'CHECK_AUTH_FAILURE',
  UPDATE_PROFILE_START: 'UPDATE_PROFILE_START',
  UPDATE_PROFILE_SUCCESS: 'UPDATE_PROFILE_SUCCESS',
  UPDATE_PROFILE_FAILURE: 'UPDATE_PROFILE_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Custom reducer for auth-specific logic
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.CHECK_AUTH_START:
    case AUTH_ACTIONS.UPDATE_PROFILE_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.CHECK_AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.CHECK_AUTH_FAILURE:
    case AUTH_ACTIONS.UPDATE_PROFILE_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Ref to track if component is mounted (prevent race conditions)
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();
        
        if (!isMountedRef.current) return;
        dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_START });
        
        const { authService } = await import('../services/auth.service');
        const user = await authService.getCurrentUser(abortControllerRef.current.signal);
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;
        
        if (user) {
          dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_SUCCESS, payload: { user } });
        } else {
          dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_FAILURE, payload: 'No authenticated user found' });
        }
      } catch (error) {
        // Only update state if component is still mounted and not aborted
        if (isMountedRef.current && error.name !== 'AbortError') {
          dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_FAILURE, payload: error.message });
        }
      }
    };

    // Only check auth on mount
    checkAuth();

    // Cleanup function to prevent race conditions
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Login function with race condition protection
  const login = React.useCallback(async (credentials) => {
    const abortController = new AbortController();
    try {
      if (!isMountedRef.current) return;
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const { authService } = await import('../services/auth.service');
      const result = await authService.login(credentials, abortController.signal);
      
      if (!isMountedRef.current) return;
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: result });
      return result;
    } catch (error) {
      if (isMountedRef.current && error.name !== 'AbortError') {
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      }
      throw error;
    }
  }, []);

  // Register function with race condition protection
  const register = React.useCallback(async (userData) => {
    const abortController = new AbortController();
    try {
      if (!isMountedRef.current) return;
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const { authService } = await import('../services/auth.service');
      const result = await authService.register(userData, abortController.signal);
      
      if (!isMountedRef.current) return;
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: result });
      return result;
    } catch (error) {
      if (isMountedRef.current && error.name !== 'AbortError') {
        dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: error.message });
      }
      throw error;
    }
  }, []);

  // Logout function
  const logout = React.useCallback(async () => {
    try {
      const { authService } = await import('../services/auth.service');
      await authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server logout fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Update profile function
  const updateProfile = React.useCallback(async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_START });
      const { authService } = await import('../services/auth.service');
      const result = await authService.updateProfile(profileData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_SUCCESS, payload: result });
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_FAILURE, payload: error.message });
      throw error;
    }
  }, []);

  // Clear error function
  const clearError = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = React.useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError
  }), [state, login, register, logout, updateProfile, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 