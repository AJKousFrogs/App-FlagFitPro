import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool;
let retryCount = 0;
const maxRetries = 3;

const createDatabasePool = async () => {
  try {
    if (!process.env.DATABASE_URL && !process.env.VITE_NEON_DATABASE_URL) {
      throw new Error('No database URL configured. Please set DATABASE_URL or VITE_NEON_DATABASE_URL environment variable.');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 20,
      retryDelay: 1000,
      maxRetries: 3
    });
    
    pool.on('connect', () => {
      console.log('✅ Connected to Neon PostgreSQL database');
      retryCount = 0;
    });
    
    pool.on('error', (err) => {
      console.error('❌ Database connection error:', err);
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`🔄 Retrying database connection (${retryCount}/${maxRetries})...`);
        setTimeout(createDatabasePool, 2000);
      }
    });
    
    // Test initial connection
    await pool.query('SELECT NOW()');
    console.log('✅ Initial database connection test successful');
    
  } catch (error) {
    console.error('❌ Failed to create database pool:', error);
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`🔄 Retrying database connection (${retryCount}/${maxRetries})...`);
      setTimeout(createDatabasePool, 2000);
    } else {
      console.error('❌ Max retries reached. Database connection failed.');
      pool = null;
    }
  }
};

// Initialize database connection
createDatabasePool();

// Helper function to safely execute database queries
export const safeQuery = async (query, params = []) => {
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

// Export pool for direct access
export const getPool = () => pool;

// Graceful shutdown
export const closeDatabaseConnection = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
};

export default pool;