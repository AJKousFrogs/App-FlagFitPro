import React, { createContext, useContext, useEffect } from 'react';
import { useStandardReducer } from '../hooks/useReducer';

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
  UPDATE_PROFILE_FAILURE: 'UPDATE_PROFILE_FAILURE'
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
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, , actions] = useStandardReducer(
    initialState,
    AUTH_ACTIONS,
    authReducer
  );

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        actions.checkAuthStart();
        const { authService } = await import('../services/auth.service');
        const user = await authService.getCurrentUser();
        if (user) {
          actions.checkAuthSuccess({ user });
        } else {
          actions.checkAuthFailure('No authenticated user found');
        }
      } catch (error) {
        actions.checkAuthFailure(error.message);
      }
    };

    // Only check auth on mount, don't depend on actions
    checkAuth();
  }, []); // Empty dependency array to run only once

  // Login function
  const login = React.useCallback(async (credentials) => {
    try {
      console.log('AuthContext: Starting login process');
      actions.loginStart();
      const { authService } = await import('../services/auth.service');
      const result = await authService.login(credentials);
      console.log('AuthContext: Login service returned result, calling loginSuccess');
      actions.loginSuccess(result);
      console.log('AuthContext: LoginSuccess called, new auth state should be:', { 
        isAuthenticated: true, 
        user: result.user?.email 
      });
      return result;
    } catch (error) {
      console.error('AuthContext: Login failed:', error.message);
      actions.loginFailure(error.message);
      throw error;
    }
  }, [actions]);

  // Register function
  const register = React.useCallback(async (userData) => {
    try {
      actions.registerStart();
      const { authService } = await import('../services/auth.service');
      const result = await authService.register(userData);
      actions.registerSuccess(result);
      return result;
    } catch (error) {
      actions.registerFailure(error.message);
      throw error;
    }
  }, [actions]);

  // Logout function
  const logout = React.useCallback(async () => {
    try {
      const { authService } = await import('../services/auth.service');
      await authService.logout();
      actions.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server logout fails
      actions.logout();
    }
  }, []); // Remove actions dependency

  // Update profile function
  const updateProfile = React.useCallback(async (profileData) => {
    try {
      actions.updateProfileStart();
      const { authService } = await import('../services/auth.service');
      const result = await authService.updateProfile(profileData);
      actions.updateProfileSuccess(result);
      return result;
    } catch (error) {
      actions.updateProfileFailure(error.message);
      throw error;
    }
  }, []); // Remove actions dependency

  // Clear error function
  const clearError = React.useCallback(() => {
    actions.clearError();
  }, []); // Remove actions dependency

  const value = React.useMemo(() => {
    console.log('AuthContext: Current state update:', {
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      hasUser: !!state.user,
      userEmail: state.user?.email,
      error: state.error
    });
    
    return {
      ...state,
      login,
      register,
      logout,
      updateProfile,
      clearError
    };
  }, [state, login, register, logout, updateProfile, clearError]);

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