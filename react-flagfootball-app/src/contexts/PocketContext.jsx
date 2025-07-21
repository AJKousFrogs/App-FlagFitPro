import PocketBase from 'pocketbase';
import { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';

export const PocketContext = createContext(null);

export function PocketProvider({ children }) {
  // BUILD IDENTIFIER FOR DEPLOYMENT VERIFICATION - FORCE CACHE BUST
  const BUILD_ID = 'EMERGENCY_DEMO_FIX_v3_FINAL_' + Date.now();
  console.log('🚀🚀🚀 FINAL BUILD ID:', BUILD_ID);
  
  // Force cache busting in browser
  if (typeof window !== 'undefined') {
    console.log('🌐 Current URL:', window.location.href);
    console.log('🌐 User Agent:', navigator.userAgent);
    document.title = `${import.meta.env.VITE_APP_NAME || 'FlagFit Pro'} - Build ${BUILD_ID.substring(BUILD_ID.length - 10)}`;
  }
  
  // Demo mode flag - when true, bypasses authentication
  const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;
  const isProduction = import.meta.env.PROD;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Smart demo mode detection based on environment
  const isDemoMode = !pocketbaseUrl || 
    pocketbaseUrl.includes('your-pocketbase-instance') ||
    pocketbaseUrl.includes('127.0.0.1') ||
    pocketbaseUrl.includes('localhost') ||
    import.meta.env.VITE_APP_ENVIRONMENT === 'demo';
  
  console.log('🔧 Environment Check:', {
    pocketbaseUrl,
    hostname,
    isDemoMode,
    environment: import.meta.env.VITE_APP_ENVIRONMENT
  });
  
  /* 
  Demo mode is enabled when:
  - No PocketBase URL configured
  - URL points to localhost/127.0.0.1
  - Explicitly set to demo environment
  */
  
  console.log('🔧 PocketContext initialization:', {
    pocketbaseUrl,
    isProduction,
    isDemoMode,
    env: import.meta.env.MODE,
    hostname,
    timestamp: new Date().toISOString()
  });

  // Emergency alert to confirm demo mode in browser
  if (typeof window !== 'undefined' && isDemoMode) {
    console.log('🚨 DEMO MODE ACTIVE - Authentication bypassed');
    // Uncomment for debugging in production:
    // alert('DEMO MODE ACTIVE - Any email/password will work!');
  }
  
  // Create PocketBase instance ONCE and reuse it
  const pb = useMemo(() => {
    // In demo mode, create a dummy instance that won't try to connect
    if (isDemoMode) {
      console.log('Demo mode: Creating dummy PocketBase instance');
      return new PocketBase('https://demo.example.com'); // Dummy URL
    }
    
    // Use environment variable or fallback to localhost for development
    const finalUrl = pocketbaseUrl || 'http://127.0.0.1:8090';
    const instance = new PocketBase(finalUrl);
    
    // Load persisted auth from localStorage on initialization
    const savedAuth = localStorage.getItem('pocketbase_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        instance.authStore.save(authData.token, authData.model);
      } catch (error) {
        console.warn('Failed to load persisted auth:', error);
        localStorage.removeItem('pocketbase_auth');
      }
    }
    
    return instance;
  }, [isDemoMode, pocketbaseUrl]);

  // Sync React state with PocketBase authStore (or demo state)
  const [token, setToken] = useState(() => {
    if (isDemoMode) {
      const savedAuth = localStorage.getItem('pocketbase_auth');
      if (savedAuth) {
        try {
          return JSON.parse(savedAuth).token;
        } catch (error) {
          return null;
        }
      }
      return null;
    }
    return pb.authStore.token;
  });
  const [user, setUser] = useState(() => {
    if (isDemoMode) {
      const savedAuth = localStorage.getItem('pocketbase_auth');
      if (savedAuth) {
        try {
          return JSON.parse(savedAuth).model;
        } catch (error) {
          return null;
        }
      }
      return null;
    }
    return pb.authStore.model;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Subscribe to authStore changes to keep React state in sync (skip in demo mode)
  useEffect(() => {
    if (isDemoMode) {
      console.log('Demo mode: Skipping authStore subscription');
      return;
    }
    
    const unsubscribe = pb.authStore.onChange((token, model) => {
      console.log('PocketBase authStore changed:', { hasToken: !!token, userEmail: model?.email });
      setToken(token);
      setUser(model);
      
      // Persist auth state to localStorage
      if (token && model) {
        localStorage.setItem('pocketbase_auth', JSON.stringify({ token, model }));
      } else {
        localStorage.removeItem('pocketbase_auth');
      }
    });

    return unsubscribe;
  }, [pb, isDemoMode]);

  // Initialize and validate auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Skip validation in demo mode
        if (isDemoMode) {
          console.log('Demo mode: Skipping auth validation');
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }
        
        // If we have a token, validate it with a refresh call
        if (pb.authStore.isValid) {
          console.log('Validating existing auth token...');
          await pb.collection('_pb_users_auth_').authRefresh();
          console.log('Auth token validated successfully');
        }
      } catch (error) {
        console.warn('Auth validation failed, clearing invalid token:', error);
        pb.authStore.clear();
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [pb, isDemoMode]);

  // Auto-refresh token every 2 minutes if valid (skip in demo mode)
  useEffect(() => {
    if (isDemoMode) {
      return; // No need to refresh tokens in demo mode
    }
    
    const refreshInterval = setInterval(async () => {
      if (pb.authStore.isValid) {
        try {
          console.log('Auto-refreshing token...');
          await pb.collection('_pb_users_auth_').authRefresh();
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Token is invalid, clear it
          pb.authStore.clear();
        }
      }
    }, 120000); // 2 minutes

    return () => clearInterval(refreshInterval);
  }, [pb, isDemoMode]);

  // Actions
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Demo mode - simulate successful login
      if (isDemoMode) {
        console.log('Demo mode: Simulating login for:', email);
        const demoUser = {
          id: 'demo-user-123',
          email: email,
          name: 'Demo User',
          verified: true
        };
        const demoToken = 'demo-token-' + Date.now();
        
        // Simulate auth store update
        setToken(demoToken);
        setUser(demoUser);
        localStorage.setItem('pocketbase_auth', JSON.stringify({ token: demoToken, model: demoUser }));
        
        return { token: demoToken, record: demoUser };
      }
      
      console.log('PocketContext: Attempting login for:', email);
      
      // This will automatically update authStore and trigger onChange
      const authData = await pb.collection('_pb_users_auth_').authWithPassword(email, password);
      
      console.log('PocketContext: Login successful:', {
        userEmail: authData.record?.email,
        hasToken: !!authData.token
      });
      
      return authData;
    } catch (error) {
      console.error('PocketContext: Login failed:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pb, isDemoMode]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Demo mode - simulate successful registration
      if (isDemoMode) {
        console.log('Demo mode: Simulating registration for:', userData.email);
        const demoUser = {
          id: 'demo-user-' + Date.now(),
          email: userData.email,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Demo User',
          verified: true
        };
        
        return {
          user: demoUser,
          requiresLogin: true
        };
      }
      
      console.log('PocketContext: Attempting registration for:', userData.email);
      
      // Create user account
      const userPayload = {
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.password
      };
      
      // Add name if provided
      if (userData.firstName || userData.lastName) {
        userPayload.name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      }
      
      const record = await pb.collection('_pb_users_auth_').create(userPayload);
      
      console.log('PocketContext: Registration successful for:', record.email);
      
      // Don't auto-login after registration to avoid conflicts
      return {
        user: record,
        requiresLogin: true
      };
    } catch (error) {
      console.error('PocketContext: Registration failed:', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pb, isDemoMode]);

  const logout = useCallback(async (invalidateTokens = false) => {
    console.log('PocketContext: Logging out', { invalidateTokens, isDemoMode });
    
    // In demo mode, just clear local state
    if (isDemoMode) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('pocketbase_auth');
      setError(null);
      return;
    }
    
    try {
      // If requested, invalidate all tokens server-side (useful after password changes)
      if (invalidateTokens && pb.authStore.isValid) {
        await pb.collection('_pb_users_auth_').authRefresh({ invalidate: true });
      }
    } catch (error) {
      console.warn('Failed to invalidate tokens during logout:', error);
    }
    
    pb.authStore.clear(); // This will trigger onChange and clear React state
    setError(null);
  }, [pb, isDemoMode]);

  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('PocketContext: Updating profile');
      
      const hasPasswordChange = profileData.password && profileData.passwordConfirm;
      const hasEmailChange = profileData.email && profileData.email !== user?.email;
      
      // Update user profile via PocketBase
      const record = await pb.collection('_pb_users_auth_').update(pb.authStore.model.id, profileData);
      
      // If password or email changed, invalidate other sessions for security
      if (hasPasswordChange || hasEmailChange) {
        console.log('Password/email changed, invalidating other sessions...');
        try {
          await pb.collection('_pb_users_auth_').authRefresh({ invalidate: true });
        } catch (refreshError) {
          console.warn('Failed to invalidate other sessions:', refreshError);
        }
      }
      
      // The authStore should update automatically, but we can force it
      setUser(record);
      
      console.log('PocketContext: Profile updated successfully');
      return { user: record };
    } catch (error) {
      console.error('PocketContext: Profile update failed:', error);
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pb, user?.email]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(() => ({
    pb,
    token,
    user,
    isLoading,
    error,
    isInitialized,
    isAuthenticated: !!token && (isDemoMode || pb.authStore.isValid),
    isDemoMode,
    login,
    register,
    logout,
    updateProfile,
    clearError
  }), [pb, token, user, isLoading, error, isInitialized, isDemoMode, login, register, logout, updateProfile, clearError]);

  return (
    <PocketContext.Provider value={value}>
      {children}
    </PocketContext.Provider>
  );
}

// Custom hook to use PocketBase context
export const usePocket = () => {
  const context = useContext(PocketContext);
  if (!context) {
    throw new Error('usePocket must be used within a PocketProvider');
  }
  return context;
};