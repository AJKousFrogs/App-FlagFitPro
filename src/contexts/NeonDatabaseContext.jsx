import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock Neon Database Context for development
const NeonDatabaseContext = createContext();

export const NeonDatabaseProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate database connection
    const connectToDatabase = async () => {
      try {
        setLoading(true);
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock database object
        const mockDb = {
          query: async (sql, params) => {
            console.log('Mock DB Query:', sql, params);
            return { rows: [], rowCount: 0 };
          },
          transaction: async (callback) => {
            console.log('Mock DB Transaction');
            return callback(mockDb);
          }
        };

        setDatabase(mockDb);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err.message);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    connectToDatabase();
  }, []);

  const value = {
    database,
    isConnected,
    loading,
    error,
    reconnect: () => {
      setLoading(true);
      setError(null);
      // Re-run connection logic
    }
  };

  return (
    <NeonDatabaseContext.Provider value={value}>
      {children}
    </NeonDatabaseContext.Provider>
  );
};

export const useNeonDatabase = () => {
  const context = useContext(NeonDatabaseContext);
  if (!context) {
    throw new Error('useNeonDatabase must be used within a NeonDatabaseProvider');
  }
  return context;
};

export default NeonDatabaseContext;