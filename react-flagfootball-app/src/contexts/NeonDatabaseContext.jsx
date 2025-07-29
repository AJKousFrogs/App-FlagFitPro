import React, { createContext, useContext, useState, useEffect } from 'react';

const NeonDatabaseContext = createContext();

export const useNeonDatabase = () => {
  const context = useContext(NeonDatabaseContext);
  if (!context) {
    throw new Error('useNeonDatabase must be used within a NeonDatabaseProvider');
  }
  return context;
};

export const NeonDatabaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize database connection
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is already logged in
      const storedUser = localStorage.getItem('flagfit-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsConnected(true);
      }

      // Test database connection
      await testConnection();
    } catch (err) {
      console.error('Database initialization error:', err);
      setError('Failed to initialize database connection');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      // Simulate database connection test
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsConnected(true);
    } catch (err) {
      console.error('Database connection test failed:', err);
      setIsConnected(false);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data
      const userData = {
        id: 'user_123',
        email,
        firstName: 'John',
        lastName: 'Doe',
        position: 'QB',
        experienceLevel: 'Intermediate',
        team: 'Hawks',
        isPremium: false,
        token: 'mock_token_123'
      };

      setUser(userData);
      setIsConnected(true);
      localStorage.setItem('flagfit-user', JSON.stringify(userData));

      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock registered user data
      const registeredUser = {
        id: 'user_' + Date.now(),
        ...userData,
        isPremium: false,
        token: 'mock_token_' + Date.now()
      };

      setUser(registeredUser);
      setIsConnected(true);
      localStorage.setItem('flagfit-user', JSON.stringify(registeredUser));

      return registeredUser;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsConnected(false);
      localStorage.removeItem('flagfit-user');
      
      // Clear other user-related data
      localStorage.removeItem('flagfit-profile');
      localStorage.removeItem('flagfit-training');
      localStorage.removeItem('flagfit-nutrition');
      localStorage.removeItem('flagfit-recovery');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    }
  };

  const updateUser = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('flagfit-user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (err) {
      console.error('Update user error:', err);
      setError('Failed to update user profile.');
      throw err;
    }
  };

  const upgradeToPremium = async () => {
    try {
      if (!user) throw new Error('No user logged in');

      const updatedUser = { ...user, isPremium: true };
      setUser(updatedUser);
      localStorage.setItem('flagfit-user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (err) {
      console.error('Premium upgrade error:', err);
      setError('Failed to upgrade to premium.');
      throw err;
    }
  };

  const executeQuery = async (query, params = []) => {
    try {
      if (!isConnected) {
        throw new Error('Database not connected');
      }

      // Simulate database query execution
      await new Promise(resolve => setTimeout(resolve, 100));

      // Return mock data based on query type
      if (query.includes('SELECT')) {
        return { rows: [], rowCount: 0 };
      } else if (query.includes('INSERT')) {
        return { rows: [{ id: Date.now() }], rowCount: 1 };
      } else if (query.includes('UPDATE') || query.includes('DELETE')) {
        return { rows: [], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    } catch (err) {
      console.error('Query execution error:', err);
      throw err;
    }
  };

  const getTrainingSessions = async (userId) => {
    try {
      // Mock training sessions data
      return [
        {
          id: 1,
          userId,
          sessionDate: new Date().toISOString(),
          sessionType: 'Passing',
          drillType: 'Accuracy',
          intensityLevel: 'HIGH',
          duration: 60,
          completionRate: 85,
          performanceScore: 8.5,
          xpEarned: 150
        },
        {
          id: 2,
          userId,
          sessionDate: new Date(Date.now() - 86400000).toISOString(),
          sessionType: 'Running',
          drillType: 'Speed',
          intensityLevel: 'MODERATE',
          duration: 45,
          completionRate: 90,
          performanceScore: 7.8,
          xpEarned: 120
        }
      ];
    } catch (err) {
      console.error('Error fetching training sessions:', err);
      return [];
    }
  };

  const saveTrainingSession = async (sessionData) => {
    try {
      const newSession = {
        id: Date.now(),
        ...sessionData,
        createdAt: new Date().toISOString()
      };

      // In a real app, this would save to the database
      console.log('Saving training session:', newSession);

      return newSession;
    } catch (err) {
      console.error('Error saving training session:', err);
      throw err;
    }
  };

  const getNutritionData = async (userId, date) => {
    try {
      // Mock nutrition data
      return {
        meals: [
          {
            id: 1,
            userId,
            date,
            mealType: 'BREAKFAST',
            totalCalories: 450,
            totalProtein: 25,
            totalCarbs: 45,
            totalFat: 15
          }
        ],
        summary: {
          totalCalories: 450,
          totalProtein: 25,
          totalCarbs: 45,
          totalFat: 15
        }
      };
    } catch (err) {
      console.error('Error fetching nutrition data:', err);
      return { meals: [], summary: { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 } };
    }
  };

  const saveNutritionData = async (nutritionData) => {
    try {
      const newNutrition = {
        id: Date.now(),
        ...nutritionData,
        createdAt: new Date().toISOString()
      };

      console.log('Saving nutrition data:', newNutrition);
      return newNutrition;
    } catch (err) {
      console.error('Error saving nutrition data:', err);
      throw err;
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isConnected,
    login,
    register,
    logout,
    updateUser,
    upgradeToPremium,
    executeQuery,
    getTrainingSessions,
    saveTrainingSession,
    getNutritionData,
    saveNutritionData
  };

  return (
    <NeonDatabaseContext.Provider value={value}>
      {children}
    </NeonDatabaseContext.Provider>
  );
};

export default NeonDatabaseContext; 