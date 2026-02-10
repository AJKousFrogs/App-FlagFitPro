import { createErrorResponse, handleValidationError } from "./error-handler.js";
import { executeQuery } from "./utils/db-query-helper.js";
import { parseAthleteId } from "./utils/db-query-helper.js";
import { parseIntParam } from "./utils/db-query-helper.js";
import { parseDateParam } from "./utils/db-query-helper.js";
import { calculateDateRange } from "./utils/db-query-helper.js";

/**
 * Database Query Helper Utilities
 *
 * Provides standardized database query execution with error handling
 * and common query parameter parsing patterns.
 *
 * This eliminates ~8-15 lines of boilerplate from each function file.
 */

/**
 * Execute a Supabase query with standardized error handling
 *
 * @param {Promise} queryPromise - Promise from Supabase query
 * @param {string} errorMessage - Error message prefix (e.g., "Failed to retrieve fixtures")
 * @returns {Promise<object>} { success: boolean, data?: array, error?: object }
 *
 * @example
 * *
 * const result = await executeQuery(
 *   supabaseAdmin.from("fixtures").select("*"),
 *   "Failed to retrieve fixtures"
 * );
 *
 * if (!result.success) {
 *   return result.error;
 * }
 *
 * return createSuccessResponse({ data: result.data });
 */
async function executeQuery(queryPromise, errorMessage) {
  try {
    const { data, error } = await queryPromise;

    if (error) {
      console.error("Database error:", error);
      return {
        success: false,
        error: createErrorResponse(
          `${errorMessage}: ${error.message}`,
          500,
          "database_error",
        ),
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Query execution error:", error);
    return {
      success: false,
      error: createErrorResponse(
        `${errorMessage}: ${error.message}`,
        500,
        "database_error",
      ),
    };
  }
}

/**
 * Parse and validate athleteId from query parameters
 * Falls back to authenticated user's ID if not provided
 *
 * @param {object} event - Netlify function event
 * @param {string} userId - Authenticated user ID
 * @param {boolean} required - Whether athleteId is required (default: false)
 * @returns {object} { valid: boolean, athleteId?: string, error?: object }
 *
 * @example
 * *
 * const { valid, athleteId, error } = parseAthleteId(event, userId, true);
 * if (!valid) {
 *   return error;
 * }
 * // Use athleteId...
 */
function parseAthleteId(event, userId, required = false) {
  const athleteId = event.queryStringParameters?.athleteId || userId;

  if (required && !athleteId) {
    return {
      valid: false,
      error: handleValidationError("athleteId query parameter is required"),
    };
  }

  return { valid: true, athleteId };
}

/**
 * Parse integer query parameter with default value
 *
 * @param {object} event - Netlify function event
 * @param {string} paramName - Parameter name
 * @param {number} defaultValue - Default value if not provided
 * @param {number} min - Minimum allowed value (optional)
 * @param {number} max - Maximum allowed value (optional)
 * @returns {number} Parsed integer value
 *
 * @example
 * *
 * const days = parseIntParam(event, 'days', 7, 1, 365);
 */
function parseIntParam(event, paramName, defaultValue, min = null, max = null) {
  const value = parseInt(
    event.queryStringParameters?.[paramName] || defaultValue,
    10,
  );

  if (isNaN(value)) {
    return defaultValue;
  }

  if (min !== null && value < min) {
    return min;
  }

  if (max !== null && value > max) {
    return max;
  }

  return value;
}

/**
 * Parse date query parameter
 *
 * @param {object} event - Netlify function event
 * @param {string} paramName - Parameter name
 * @param {Date} defaultValue - Default Date object if not provided
 * @returns {Date} Parsed date or default
 *
 * @example
 * *
 * const startDate = parseDateParam(event, 'startDate', new Date());
 */
function parseDateParam(event, paramName, defaultValue) {
  const value = event.queryStringParameters?.[paramName];

  if (!value) {
    return defaultValue;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return defaultValue;
  }

  return date;
}

/**
 * Calculate date range from days parameter
 *
 * @param {number} days - Number of days
 * @param {boolean} forward - If true, calculate forward from today; if false, backward (default: false)
 * @returns {object} { startDate: Date, endDate: Date }
 *
 * @example
 * *
 * // Get last 7 days
 * const { startDate, endDate } = calculateDateRange(7, false);
 *
 * // Get next 14 days
 * const { startDate, endDate } = calculateDateRange(14, true);
 */
function calculateDateRange(days, forward = false) {
  const endDate = new Date();
  const startDate = new Date();

  if (forward) {
    startDate.setTime(endDate.getTime());
    endDate.setDate(endDate.getDate() + days);
  } else {
    startDate.setDate(startDate.getDate() - days);
  }

  return { startDate, endDate };
}

export { executeQuery,
  parseAthleteId,
  parseIntParam,
  parseDateParam,
  calculateDateRange, };
