import React, { createContext, useContext, useEffect } from "react";
import { useStandardReducer } from "../hooks/useReducer";
import { authManager } from "../auth-manager.js";
import { logger } from "../logger.js";

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  REGISTER_START: "REGISTER_START",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  REGISTER_FAILURE: "REGISTER_FAILURE",
  LOGOUT: "LOGOUT",
  CHECK_AUTH_START: "CHECK_AUTH_START",
  CHECK_AUTH_SUCCESS: "CHECK_AUTH_SUCCESS",
  CHECK_AUTH_FAILURE: "CHECK_AUTH_FAILURE",
  UPDATE_PROFILE_START: "UPDATE_PROFILE_START",
  UPDATE_PROFILE_SUCCESS: "UPDATE_PROFILE_SUCCESS",
  UPDATE_PROFILE_FAILURE: "UPDATE_PROFILE_FAILURE",
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading while we check auth
  error: null,
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
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CHECK_AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CHECK_AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        error: null,
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
    authReducer,
  );

  // Synchronize state with AuthManager changes
  useEffect(() => {
    const handleLogin = (user) => {
      actions.loginSuccess({ 
        user, 
        token: authManager.getToken() 
      });
    };

    const handleLogout = () => {
      actions.logout();
    };

    authManager.onLogin(handleLogin);
    authManager.onLogout(handleLogout);

    return () => {
      // AuthManager doesn't currently support removing callbacks, 
      // but in a real app you'd want to handle this.
    };
  }, [actions]);

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        actions.checkAuthStart();
        
        // Wait for AuthManager to initialize and check session
        await authManager.waitForInit();
        const isAuthenticated = await authManager.checkAuthentication();
        const user = authManager.getCurrentUser();
        const token = authManager.getToken();

        if (isMounted) {
          if (isAuthenticated && user) {
            actions.checkAuthSuccess({ user, token });
          } else {
            actions.checkAuthFailure("No authenticated user found");
          }
        }
      } catch (error) {
        if (isMounted) {
          actions.checkAuthFailure(error.message);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [actions]);

  // Login function
  const login = React.useCallback(
    async (email, password) => {
      try {
        actions.loginStart();
        const result = await authManager.login(email, password);
        if (result.success) {
          // State is updated via handleLogin callback in useEffect
          return result;
        } else {
          throw new Error(result.error || "Login failed");
        }
      } catch (error) {
        actions.loginFailure(error.message);
        throw error;
      }
    },
    [actions],
  );

  // Register function
  const register = React.useCallback(
    async (userData) => {
      try {
        actions.registerStart();
        const result = await authManager.register(userData);
        if (result.success) {
          // If registration auto-logs in, state is updated via handleLogin
          // If not, we stay logged out
          return result;
        } else {
          throw new Error(result.error || "Registration failed");
        }
      } catch (error) {
        actions.registerFailure(error.message);
        throw error;
      }
    },
    [actions],
  );

  // Logout function
  const logout = React.useCallback(async () => {
    try {
      await authManager.logout();
      // State is updated via handleLogout callback in useEffect
    } catch (error) {
      logger.error("Logout error:", error);
      actions.logout();
    }
  }, [actions]);

  // Update profile function
  const updateProfile = React.useCallback(
    async (profileData) => {
      try {
        actions.updateProfileStart();
        const result = await authManager.updateProfile(profileData);
        if (result.success) {
          actions.updateProfileSuccess(result);
          return result;
        } else {
          throw new Error(result.error || "Profile update failed");
        }
      } catch (error) {
        actions.updateProfileFailure(error.message);
        throw error;
      }
    },
    [actions],
  );

  // Clear error function
  const clearError = React.useCallback(() => {
    actions.clearError();
  }, [actions]);

  const value = React.useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  }), [state, login, register, logout, updateProfile, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
