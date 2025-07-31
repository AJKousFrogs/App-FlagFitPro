// NeonDatabaseContext - Neon PostgreSQL database context provider
// Manages database connections and provides database operations throughout the app

import React, { createContext, useContext, useState, useEffect } from 'react';
import { neon } from '@neondatabase/serverless';

// Create the context
const NeonDatabaseContext = createContext(null);

// Custom hook to use the database context
export const useNeonDatabase = () => {
  const context = useContext(NeonDatabaseContext);
  if (!context) {
    throw new Error('useNeonDatabase must be used within a NeonDatabaseProvider');
  }
  return context;
};

// Database Provider Component
export const NeonDatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize database connection
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get database URL from environment
        const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL;
        
        if (!databaseUrl || databaseUrl.includes('your_') || databaseUrl.includes('_here')) {
          
          // Create mock database for development
          const mockDb = {
            async query(sql, params = []) {
              return [];
            },
            async executeQuery(sqlQuery, params = []) {
              return [];
            }
          };
          
          setDb(mockDb);
          setIsConnected(true);
          return;
        }

        // Create Neon database connection
        const sql = neon(databaseUrl);
        
        // Test the connection
        await sql`SELECT 1 as test`;
        
        setDb(sql);
        setIsConnected(true);
        
      } catch (err) {
        console.error('❌ Database connection failed:', err);
        setError(err.message);
        setIsConnected(false);
        setDb(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Database query wrapper with error handling
  const query = async (sql, params = []) => {
    if (!db) {
      throw new Error('Database not connected');
    }

    try {
      // Check if it's a mock database
      if (db.query) {
        const result = await db.query(sql, params);
        return { success: true, data: result };
      } else {
        // Real Neon database
        const result = await db(sql, params);
        return { success: true, data: result };
      }
    } catch (error) {
      console.error('Database query error:', error);
      return { success: false, error: error.message };
    }
  };

  // Execute raw SQL queries
  const executeQuery = async (sqlQuery, params = []) => {
    if (!db) {
      throw new Error('Database not connected');
    }

    try {
      // Check if it's a mock database
      if (db.executeQuery) {
        const result = await db.executeQuery(sqlQuery, params);
        return result;
      } else {
        // Real Neon database
        const result = await db(sqlQuery, params);
        return result;
      }
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  };

  // User-related database operations
  const userOperations = {
    // Get user by ID
    async getUserById(userId) {
      if (!db) throw new Error('Database not connected');
      
      try {
        // Mock user data for development
        if (db.query) {
          return {
            id: userId,
            name: 'Mock User',
            email: 'mock@example.com',
            team: 'Hawks',
            position: 'QB'
          };
        }
        
        const result = await db`
          SELECT * FROM users WHERE id = ${userId}
        `;
        return result[0] || null;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
      }
    },

    // Get user by email
    async getUserByEmail(email) {
      if (!db) throw new Error('Database not connected');
      
      try {
        // Mock user data for development
        if (db.query) {
          return {
            id: 'mock-user-1',
            name: 'Mock User',
            email: email,
            team: 'Hawks',
            position: 'QB',
            experience: 'Intermediate'
          };
        }
        
        const result = await db`
          SELECT * FROM users WHERE email = ${email}
        `;
        return result[0] || null;
      } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error;
      }
    },

    // Create new user
    async createUser(userData) {
      if (!db) throw new Error('Database not connected');
      
      try {
        const result = await db`
          INSERT INTO users (email, username, first_name, last_name, profile_image)
          VALUES (${userData.email}, ${userData.username}, ${userData.firstName}, ${userData.lastName}, ${userData.profileImage})
          RETURNING *
        `;
        return result[0];
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    // Update user
    async updateUser(userId, updateData) {
      if (!db) throw new Error('Database not connected');
      
      try {
        const result = await db`
          UPDATE users 
          SET 
            email = COALESCE(${updateData.email}, email),
            username = COALESCE(${updateData.username}, username),
            first_name = COALESCE(${updateData.firstName}, first_name),
            last_name = COALESCE(${updateData.lastName}, last_name),
            profile_image = COALESCE(${updateData.profileImage}, profile_image),
            updated_at = NOW()
          WHERE id = ${userId}
          RETURNING *
        `;
        return result[0];
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    }
  };

  // Nutrition-related database operations
  const nutritionOperations = {
    // Get user's nutrition data
    async getUserNutrition(userId) {
      if (!db) throw new Error('Database not connected');
      
      try {
        const result = await db`
          SELECT * FROM nutrition_logs 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 100
        `;
        return result;
      } catch (error) {
        console.error('Error fetching nutrition data:', error);
        throw error;
      }
    },

    // Log nutrition entry
    async logNutrition(userId, nutritionData) {
      if (!db) throw new Error('Database not connected');
      
      try {
        const result = await db`
          INSERT INTO nutrition_logs (user_id, food_name, calories, protein, carbs, fat, meal_type)
          VALUES (${userId}, ${nutritionData.foodName}, ${nutritionData.calories}, ${nutritionData.protein}, ${nutritionData.carbs}, ${nutritionData.fat}, ${nutritionData.mealType})
          RETURNING *
        `;
        return result[0];
      } catch (error) {
        console.error('Error logging nutrition:', error);
        throw error;
      }
    }
  };

  // Training-related database operations
  const trainingOperations = {
    // Get user's training sessions
    async getUserTraining(userId) {
      if (!db) throw new Error('Database not connected');
      
      try {
        const result = await db`
          SELECT * FROM training_sessions 
          WHERE user_id = ${userId}
          ORDER BY session_date DESC
          LIMIT 50
        `;
        return result;
      } catch (error) {
        console.error('Error fetching training data:', error);
        throw error;
      }
    },

    // Log training session
    async logTrainingSession(userId, sessionData) {
      if (!db) throw new Error('Database not connected');
      
      try {
        const result = await db`
          INSERT INTO training_sessions (user_id, session_type, duration, exercises, notes)
          VALUES (${userId}, ${sessionData.type}, ${sessionData.duration}, ${JSON.stringify(sessionData.exercises)}, ${sessionData.notes})
          RETURNING *
        `;
        return result[0];
      } catch (error) {
        console.error('Error logging training session:', error);
        throw error;
      }
    }
  };

  // Health check function
  const healthCheck = async () => {
    try {
      if (!db) {
        return { healthy: false, error: 'Database not connected' };
      }

      const result = await db`SELECT 1 as health_check, NOW() as timestamp`;
      return { 
        healthy: true, 
        timestamp: result[0]?.timestamp,
        connected: isConnected 
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  };

  // Reconnect function
  const reconnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('Database URL not configured');
      }

      const sql = neon(databaseUrl);
      await sql`SELECT 1 as test`;
      
      setDb(sql);
      setIsConnected(true);
    } catch (err) {
      console.error('❌ Reconnection failed:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue = {
    // Connection state
    db,
    isConnected,
    isLoading,
    error,
    
    // Core operations
    query,
    executeQuery,
    healthCheck,
    reconnect,
    
    // Specialized operations
    userOperations,
    nutritionOperations,
    trainingOperations
  };

  return (
    <NeonDatabaseContext.Provider value={contextValue}>
      {children}
    </NeonDatabaseContext.Provider>
  );
};

// Export context and provider
export { NeonDatabaseContext };
export default NeonDatabaseContext;