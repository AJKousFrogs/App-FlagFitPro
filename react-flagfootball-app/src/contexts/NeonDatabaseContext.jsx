import { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import neonDatabaseService from '../services/neon-database.service';

export const NeonDatabaseContext = createContext(null);

export function NeonDatabaseProvider({ children }) {
  // BUILD IDENTIFIER FOR DEPLOYMENT VERIFICATION - FORCE CACHE BUST
  const BUILD_ID = 'NEON_DB_MIGRATION_v1_' + Date.now();
  console.log('🚀 Neon Database Context BUILD ID:', BUILD_ID);
  
  // Force cache busting in browser
  if (typeof window !== 'undefined') {
    console.log('🌐 Current URL:', window.location.href);
    document.title = `${import.meta.env.VITE_APP_NAME || 'FlagFit Pro'} - Build ${BUILD_ID.substring(BUILD_ID.length - 10)}`;
  }
  
  // Check if we're in demo mode
  const isDemoMode = neonDatabaseService.isInDemoMode();
  
  console.log('🔧 NeonDatabaseContext initialization:', {
    isDemoMode,
    env: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  });

  // Alert to confirm mode in browser
  if (typeof window !== 'undefined') {
    if (isDemoMode) {
      console.log('🚨 DEMO MODE ACTIVE - Using demo data');
    } else {
      console.log('💾 DATABASE MODE - Connected to Neon PostgreSQL');
    }
  }
  
  // State management
  const [token, setToken] = useState(() => {
    const savedAuth = localStorage.getItem('neon_database_auth');
    if (savedAuth) {
      try {
        return JSON.parse(savedAuth).token;
      } catch (error) {
        return null;
      }
    }
    return null;
  });
  
  const [user, setUser] = useState(() => {
    const savedAuth = localStorage.getItem('neon_database_auth');
    if (savedAuth) {
      try {
        return JSON.parse(savedAuth).model;
      } catch (error) {
        return null;
      }
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database service on mount
  useEffect(() => {
    const initializeDatabase = async () => {
      setIsLoading(true);
      
      try {
        await neonDatabaseService.initialize();
        console.log('✅ Neon database service initialized successfully');
      } catch (error) {
        console.warn('Database initialization failed, falling back to demo mode:', error);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Authentication functions
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('NeonDatabaseContext: Attempting login for:', email);
      
      const authData = await neonDatabaseService.authenticate(email, password);
      
      if (authData.success) {
        const authInfo = {
          token: authData.token,
          model: authData.user
        };
        
        setToken(authData.token);
        setUser(authData.user);
        localStorage.setItem('neon_database_auth', JSON.stringify(authInfo));
        
        console.log('NeonDatabaseContext: Login successful:', {
          userEmail: authData.user?.email,
          hasToken: !!authData.token,
          isDemoMode
        });
        
        return { token: authData.token, record: authData.user };
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('NeonDatabaseContext: Login failed:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('NeonDatabaseContext: Attempting registration for:', userData.email);
      
      const newUser = await neonDatabaseService.createUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.email.split('@')[0], // Generate username from email
        role: 'athlete',
        isActive: true,
        emailVerified: isDemoMode, // Auto-verify in demo mode
        passwordHash: userData.password // In real implementation, this would be hashed
      });
      
      console.log('NeonDatabaseContext: Registration successful for:', newUser.email);
      
      // Don't auto-login after registration to avoid conflicts
      return {
        user: newUser,
        requiresLogin: true
      };
    } catch (error) {
      console.error('NeonDatabaseContext: Registration failed:', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const logout = useCallback(async (invalidateTokens = false) => {
    console.log('NeonDatabaseContext: Logging out', { invalidateTokens, isDemoMode });
    
    setToken(null);
    setUser(null);
    localStorage.removeItem('neon_database_auth');
    setError(null);
    
    // In a real implementation, we could invalidate server-side tokens here
    if (invalidateTokens && !isDemoMode) {
      // TODO: Implement server-side token invalidation
      console.log('Token invalidation would be implemented here for production');
    }
  }, [isDemoMode]);

  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('NeonDatabaseContext: Updating profile');
      
      if (!user?.id) {
        throw new Error('No user logged in');
      }
      
      const updatedUser = await neonDatabaseService.updateUser(user.id, profileData);
      
      // Update local state
      setUser(updatedUser);
      
      // Update localStorage
      const currentAuth = JSON.parse(localStorage.getItem('neon_database_auth') || '{}');
      currentAuth.model = updatedUser;
      localStorage.setItem('neon_database_auth', JSON.stringify(currentAuth));
      
      console.log('NeonDatabaseContext: Profile updated successfully');
      return { user: updatedUser };
    } catch (error) {
      console.error('NeonDatabaseContext: Profile update failed:', error);
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Database service proxy - provide access to database operations
  const db = useMemo(() => neonDatabaseService, []);

  const value = useMemo(() => ({
    // Database service access
    db,
    
    // Auth state
    token,
    user,
    isLoading,
    error,
    isInitialized,
    isAuthenticated: !!token && !!user,
    isDemoMode,
    
    // Auth actions
    login,
    register,
    logout,
    updateProfile,
    clearError,
    
    // Legacy compatibility methods (for easier migration)
    pb: db, // Some components might expect 'pb' property
    authStore: {
      token,
      model: user,
      isValid: !!token && !!user
    }
  }), [
    db, token, user, isLoading, error, isInitialized, isDemoMode,
    login, register, logout, updateProfile, clearError
  ]);

  return (
    <NeonDatabaseContext.Provider value={value}>
      {children}
    </NeonDatabaseContext.Provider>
  );
}

// Custom hook to use Neon database context
export const useNeonDatabase = () => {
  const context = useContext(NeonDatabaseContext);
  if (!context) {
    throw new Error('useNeonDatabase must be used within a NeonDatabaseProvider');
  }
  return context;
};

// Legacy compatibility hook (for easier migration)
export const usePocket = () => {
  console.warn('usePocket is deprecated, use useNeonDatabase instead');
  return useNeonDatabase();
};