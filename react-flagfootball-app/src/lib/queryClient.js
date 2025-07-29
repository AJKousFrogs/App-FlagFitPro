import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import securityService from '../services/security.service.js';

/**
 * Enterprise-grade React Query configuration
 * Provides optimized caching, error handling, and performance
 */

// Global error handler for queries
const onError = (error, query) => {
  console.error('Query error:', error, 'Query:', query?.queryKey);
  
  // Handle authentication errors globally
  if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
    // Clear auth data and redirect to login
    securityService.clearSecurityData();
    window.location.href = '/login';
    return;
  }
  
  // Handle network errors
  if (!navigator.onLine) {
    console.warn('Network is offline, queries will retry when back online');
    return;
  }
  
  // Log errors in production
  if (process.env.NODE_ENV === 'production') {
    // In production, you'd send this to your error reporting service
    console.error('Production query error:', {
      error: error.message,
      queryKey: query?.queryKey,
      timestamp: new Date().toISOString()
    });
  }
};

// Global error handler for mutations
const onMutationError = (error, variables, context, mutation) => {
  console.error('Mutation error:', error, 'Variables:', variables);
  
  // Handle authentication errors
  if (error?.status === 401) {
    securityService.clearSecurityData();
    window.location.href = '/login';
    return;
  }
  
  // Show user-friendly error message
  if (mutation?.options?.meta?.errorMessage) {
    // You could show a toast notification here
    console.error('User error:', mutation.options.meta.errorMessage);
  }
};

// Create Query Cache with error handling
const queryCache = new QueryCache({
  onError
});

// Create Mutation Cache with error handling
const mutationCache = new MutationCache({
  onError: onMutationError
});

// Create the Query Client with optimized settings
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Cache time - how long data stays in cache when not in use (10 minutes)
      gcTime: 10 * 60 * 1000,
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (disabled for better UX)
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Enable background refetching
      refetchInterval: false, // Disabled by default, can be enabled per query
      
      // Network mode - always try to fetch, even offline
      networkMode: 'online',
      
      // Error handling
      useErrorBoundary: (error) => {
        // Use error boundary for 5xx errors
        return error?.status >= 500;
      },
      
      // Suspense support (disabled by default)
      suspense: false,
      
      // Placeholder data
      placeholderData: (previousData) => previousData,
      
      // Meta for additional query information
      meta: {
        persist: true // Persist queries by default
      }
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Network mode
      networkMode: 'online',
      
      // Error boundary usage
      useErrorBoundary: (error) => {
        return error?.status >= 500;
      },
      
      // Global mutation options
      meta: {
        showSuccessMessage: true
      }
    }
  }
});

// Query key factory for consistent key generation
export const queryKeys = {
  // Authentication queries
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
    permissions: () => [...queryKeys.auth.all, 'permissions'] as const,
  },
  
  // User-related queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: (id: string) => [...queryKeys.users.all, 'profile', id] as const,
  },
  
  // Training-related queries
  training: {
    all: ['training'] as const,
    sessions: {
      all: () => [...queryKeys.training.all, 'sessions'] as const,
      list: (filters: any) => [...queryKeys.training.sessions.all(), { filters }] as const,
      detail: (id: string) => [...queryKeys.training.sessions.all(), id] as const,
    },
    programs: {
      all: () => [...queryKeys.training.all, 'programs'] as const,
      list: (filters: any) => [...queryKeys.training.programs.all(), { filters }] as const,
      detail: (id: string) => [...queryKeys.training.programs.all(), id] as const,
    },
    analytics: {
      all: () => [...queryKeys.training.all, 'analytics'] as const,
      performance: (userId: string, timeRange: string) => 
        [...queryKeys.training.analytics.all(), 'performance', userId, timeRange] as const,
      progress: (userId: string) => 
        [...queryKeys.training.analytics.all(), 'progress', userId] as const,
    }
  },
  
  // Team-related queries
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.teams.lists(), { filters }] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
    members: (teamId: string) => [...queryKeys.teams.all, 'members', teamId] as const,
    stats: (teamId: string) => [...queryKeys.teams.all, 'stats', teamId] as const,
  },
  
  // Nutrition queries
  nutrition: {
    all: ['nutrition'] as const,
    plans: {
      all: () => [...queryKeys.nutrition.all, 'plans'] as const,
      user: (userId: string) => [...queryKeys.nutrition.plans.all(), userId] as const,
    },
    foods: {
      all: () => [...queryKeys.nutrition.all, 'foods'] as const,
      search: (query: string) => [...queryKeys.nutrition.foods.all(), 'search', query] as const,
    }
  },
  
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    overview: (userId: string) => [...queryKeys.dashboard.all, 'overview', userId] as const,
    stats: (userId: string, timeRange: string) => 
      [...queryKeys.dashboard.all, 'stats', userId, timeRange] as const,
    recent: (userId: string) => [...queryKeys.dashboard.all, 'recent', userId] as const,
  }
};

// Query invalidation helpers
export const invalidateQueries = {
  // Invalidate all auth-related queries
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
  
  // Invalidate user queries
  user: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    }
  },
  
  // Invalidate training queries
  training: (sessionId?: string) => {
    if (sessionId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.training.sessions.detail(sessionId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.training.all });
    }
  },
  
  // Invalidate team queries
  team: (teamId?: string) => {
    if (teamId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.members(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.stats(teamId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    }
  },
  
  // Invalidate dashboard
  dashboard: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recent(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    }
  }
};

// Prefetch helpers for better UX
export const prefetchQueries = {
  // Prefetch user profile
  userProfile: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.profile(userId),
      queryFn: () => fetch(`/api/users/${userId}/profile`).then(res => res.json()),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },
  
  // Prefetch dashboard data
  dashboard: async (userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.overview(userId),
        queryFn: () => fetch(`/api/dashboard/${userId}/overview`).then(res => res.json()),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.recent(userId),
        queryFn: () => fetch(`/api/dashboard/${userId}/recent`).then(res => res.json()),
      })
    ]);
  }
};

// Optimistic updates helpers
export const optimisticUpdates = {
  // Update user profile optimistically
  updateUserProfile: (userId: string, updates: any) => {
    queryClient.setQueryData(
      queryKeys.users.profile(userId),
      (oldData: any) => ({ ...oldData, ...updates })
    );
  },
  
  // Add training session optimistically
  addTrainingSession: (session: any) => {
    queryClient.setQueryData(
      queryKeys.training.sessions.list({}),
      (oldData: any) => ({
        ...oldData,
        data: [session, ...(oldData?.data || [])]
      })
    );
  }
};

// Cache persistence for offline support
export const persistCache = {
  save: () => {
    const cache = queryClient.getQueryCache();
    const persistedQueries = {};
    
    cache.getAll().forEach(query => {
      if (query.meta?.persist && query.state.data) {
        persistedQueries[JSON.stringify(query.queryKey)] = {
          data: query.state.data,
          dataUpdatedAt: query.state.dataUpdatedAt,
        };
      }
    });
    
    localStorage.setItem('react-query-cache', JSON.stringify(persistedQueries));
  },
  
  restore: () => {
    try {
      const persistedCache = localStorage.getItem('react-query-cache');
      if (persistedCache) {
        const queries = JSON.parse(persistedCache);
        
        Object.entries(queries).forEach(([keyString, queryData]: [string, any]) => {
          const queryKey = JSON.parse(keyString);
          queryClient.setQueryData(queryKey, queryData.data);
        });
      }
    } catch (error) {
      console.error('Failed to restore query cache:', error);
      localStorage.removeItem('react-query-cache');
    }
  },
  
  clear: () => {
    localStorage.removeItem('react-query-cache');
  }
};

// Development tools
export const devTools = {
  logCacheState: () => {
    const cache = queryClient.getQueryCache();
    console.table(
      cache.getAll().map(query => ({
        key: JSON.stringify(query.queryKey),
        status: query.state.status,
        fetchStatus: query.state.fetchStatus,
        dataUpdatedAt: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
        staleTime: query.staleTime,
        cacheTime: query.gcTime,
      }))
    );
  },
  
  clearCache: () => {
    queryClient.clear();
    persistCache.clear();
    console.log('Query cache cleared');
  }
};

// Auto-save cache every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(persistCache.save, 30000);
  
  // Save cache before page unload
  window.addEventListener('beforeunload', persistCache.save);
  
  // Restore cache on load
  persistCache.restore();
}

export default queryClient;