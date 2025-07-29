import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service.js';
import { queryKeys, invalidateQueries } from '../lib/queryClient.js';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Advanced authentication hook with React Query
 * Provides optimized caching, mutations, and state management
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Current user query with optimized caching
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: ({ signal }) => authService.getCurrentUser(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: !!authService.getToken(), // Only run if token exists
    meta: {
      persist: true
    }
  });

  // Login mutation with optimistic updates
  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onMutate: async () => {
      // Show loading state immediately
      return { isLoading: true };
    },
    onSuccess: (data) => {
      // Update auth cache immediately
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      
      // Prefetch dashboard data for better UX
      if (data.user?.id) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.overview(data.user.id),
          queryFn: () => fetch(`/api/dashboard/${data.user.id}/overview`).then(res => res.json()),
          staleTime: 2 * 60 * 1000
        });
      }
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      console.error('Login failed:', error);
      // Clear any stale auth data
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    },
    meta: {
      errorMessage: 'Login failed. Please check your credentials and try again.',
      successMessage: 'Welcome back!'
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData) => authService.register(userData),
    onSuccess: (data) => {
      // Update auth cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      
      // Navigate to onboarding or dashboard
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
    meta: {
      errorMessage: 'Registration failed. Please try again.',
      successMessage: 'Account created successfully! Welcome to FlagFit Pro!'
    }
  });

  // Logout mutation with cleanup
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onMutate: async () => {
      // Cancel any outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.all });
      
      // Optimistically remove user data
      queryClient.setQueryData(queryKeys.auth.currentUser(), null);
      
      return { previousUser: user };
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Navigate to login
      navigate('/login', { replace: true });
    },
    onError: (error, variables, context) => {
      // Restore previous user data on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), context.previousUser);
      }
      console.error('Logout failed:', error);
    },
    onSettled: () => {
      // Always invalidate auth queries
      invalidateQueries.auth();
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => authService.updateProfile(profileData),
    onMutate: async (newProfile) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.currentUser() });
      
      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(queryKeys.auth.currentUser());
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.auth.currentUser(), (old) => ({
        ...old,
        ...newProfile
      }));
      
      return { previousUser };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), context.previousUser);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
    },
    meta: {
      errorMessage: 'Failed to update profile. Please try again.',
      successMessage: 'Profile updated successfully!'
    }
  });

  // Refresh token mutation (for automatic token renewal)
  const refreshTokenMutation = useMutation({
    mutationFn: () => authService.refreshToken(),
    onSuccess: () => {
      // Invalidate current user to trigger refetch with new token
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
    },
    onError: () => {
      // Token refresh failed, logout user
      logoutMutation.mutate();
    },
    retry: false // Don't retry token refresh
  });

  // Computed states
  const isAuthenticated = !!user && !!authService.getToken();
  const isLoading = isUserLoading || loginMutation.isPending || registerMutation.isPending;
  const error = userError || loginMutation.error || registerMutation.error;

  // Action handlers
  const login = useCallback(async (credentials) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const register = useCallback(async (userData) => {
    return registerMutation.mutateAsync(userData);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const updateProfile = useCallback(async (profileData) => {
    return updateProfileMutation.mutateAsync(profileData);
  }, [updateProfileMutation]);

  const refreshToken = useCallback(async () => {
    return refreshTokenMutation.mutateAsync();
  }, [refreshTokenMutation]);

  // Utility functions
  const clearError = useCallback(() => {
    loginMutation.reset();
    registerMutation.reset();
    updateProfileMutation.reset();
  }, [loginMutation, registerMutation, updateProfileMutation]);

  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission) || user?.role === 'admin';
  }, [user]);

  const isRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // Auto-refresh token before expiration
  const setupTokenRefresh = useCallback(() => {
    const token = authService.getToken();
    if (!token) return;

    // Decode token to get expiration (this is a simplified version)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeUntilRefresh = expirationTime - currentTime - (5 * 60 * 1000); // Refresh 5 minutes before expiration

      if (timeUntilRefresh > 0) {
        setTimeout(() => {
          refreshToken();
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.warn('Could not decode token for auto-refresh:', error);
    }
  }, [refreshToken]);

  // Set up auto-refresh on mount
  React.useEffect(() => {
    if (isAuthenticated) {
      setupTokenRefresh();
    }
  }, [isAuthenticated, setupTokenRefresh]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Loading states for individual operations
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    refetchUser,
    clearError,
    
    // Utilities
    hasPermission,
    isRole,
    
    // CSRF token for forms
    csrfToken: authService.getCSRFToken(),
    
    // Raw mutation objects for advanced usage
    loginMutation,
    registerMutation,
    logoutMutation,
    updateProfileMutation,
    refreshTokenMutation
  };
};

export default useAuth;