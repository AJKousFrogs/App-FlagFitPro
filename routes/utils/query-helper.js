/**
 * Shared Database Query Helper Utilities
 * Provides safe query execution functions for route handlers
 * 
 * @module routes/utils/query-helper
 * @version 1.0.0
 */

import { serverLogger } from './server-logger.js';

/**
 * Safely execute database queries with error handling
 * 
 * @param {Pool} pool - PostgreSQL connection pool instance
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters for parameterized queries
 * @param {string} routeName - Name of the route (for error logging)
 * @returns {Promise<object>} Query result object
 * @throws {Error} If database connection is unavailable or query fails
 * 
 * @example
 * ```javascript
 * import { safeQuery } from '../utils/query-helper.js';
 * const result = await safeQuery(pool, 'SELECT * FROM users WHERE id = $1', [userId], 'dashboard');
 * ```
 */
export async function safeQuery(pool, query, params = [], routeName = 'unknown') {
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  // Validate query is not empty
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Invalid query: Query string is required');
  }
  
  // Validate params is an array
  if (!Array.isArray(params)) {
    throw new Error('Invalid parameters: Parameters must be an array');
  }
  
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    serverLogger.error(`${routeName.toUpperCase()} database query error:`, {
      message: error.message,
      code: error.code,
      query: query.substring(0, 100) + '...'
    });
    throw new Error(`Database operation failed: ${error.message}`);
  }
}

/**
 * Safely parse integers with validation
 * 
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed integer or default value
 * 
 * @example
 * ```javascript
 * import { safeParseInt } from '../utils/query-helper.js';
 * const page = safeParseInt(req.query.page, 1);
 * ```
 */
export function safeParseInt(value, defaultValue = 0) {
  try {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely format dates to ISO string
 * 
 * @param {Date|string|number} date - Date to format
 * @returns {string} ISO formatted date string
 * 
 * @example
 * ```javascript
 * import { safeFormatDate } from '../utils/query-helper.js';
 * const timestamp = safeFormatDate(new Date());
 * ```
 */
export function safeFormatDate(date) {
  try {
    if (!date) return new Date().toISOString();
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

