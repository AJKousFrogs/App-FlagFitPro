import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Get database URL from environment variables
const getDatabaseUrl = () => {
  // Check for actual Neon database URLs only
  const neonUrl = import.meta.env.VITE_NEON_DATABASE_URL || 
                  import.meta.env.VITE_DATABASE_URL ||
                  process.env.NETLIFY_DATABASE_URL ||
                  process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  
  // Only return valid Neon URLs (not PocketBase URLs or empty strings)
  if (neonUrl && neonUrl.includes('neon.tech')) {
    return neonUrl;
  }
  
  return null; // Force demo mode if no valid Neon URL
};

let db = null;
let sql = null;

// Initialize database connection
export const initializeDatabase = () => {
  const databaseUrl = getDatabaseUrl();
  
  if (!databaseUrl) {
    console.warn('No database URL found. Running in demo mode.');
    return null;
  }

  try {
    sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
    console.log('✅ Neon database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize Neon database:', error);
    return null;
  }
};

// Get database instance
export const getDatabase = () => {
  if (!db) {
    return initializeDatabase();
  }
  return db;
};

// Raw SQL query function
export const executeRawQuery = async (query, params = []) => {
  if (!sql) {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      throw new Error('Database not initialized and no URL available');
    }
    sql = neon(databaseUrl);
  }

  try {
    const result = await sql(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Test database connection
export const testConnection = async () => {
  // Skip connection test if no database URL
  if (!getDatabaseUrl()) {
    console.log('🔧 Demo mode active - skipping database connection test');
    return false;
  }
  
  try {
    const result = await executeRawQuery('SELECT NOW() as current_time');
    console.log('✅ Database connection test successful:', result);
    return true;
  } catch (error) {
    console.warn('⚠️ Database connection test failed, falling back to demo mode:', error.message);
    return false;
  }
};

// Demo mode detection
export const isDemoMode = () => {
  return !getDatabaseUrl();
};

export { sql, db };