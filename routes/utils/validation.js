/**
 * Shared Validation & Response Utilities
 * Centralizes validation functions and standardized response helpers
 *
 * @module routes/utils/validation
 * @version 1.0.0
 */

import { safeFormatDate } from "./query-helper.js";

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate user ID parameter
 * @param {string} userId - User ID to validate
 * @returns {object} Validation result with isValid and sanitized userId
 */
export function validateUserId(userId) {
  if (!userId || typeof userId !== "string") {
    return { isValid: false, error: "User ID must be a non-empty string" };
  }

  const sanitized = userId.trim();

  if (sanitized.length === 0) {
    return { isValid: false, error: "User ID cannot be empty" };
  }

  // Support UUID format and alphanumeric IDs
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const alphanumericRegex = /^[a-zA-Z0-9_-]+$/;

  if (!uuidRegex.test(sanitized) && !alphanumericRegex.test(sanitized)) {
    return { isValid: false, error: "User ID contains invalid characters" };
  }

  if (sanitized.length > 128) {
    return { isValid: false, error: "User ID exceeds maximum length" };
  }

  return { isValid: true, userId: sanitized };
}

/**
 * Validate weeks parameter for time-based queries
 * @param {any} weeks - Number of weeks to validate
 * @param {number} min - Minimum weeks (default: 1)
 * @param {number} max - Maximum weeks (default: 52)
 * @returns {object} Validation result
 */
export function validateWeeks(weeks, min = 1, max = 52) {
  if (weeks === undefined || weeks === null) {
    return { isValid: true, weeks: min };
  }

  const parsed = parseInt(weeks, 10);

  if (isNaN(parsed)) {
    return { isValid: false, error: "Weeks parameter must be a number" };
  }

  if (parsed < min || parsed > max) {
    return {
      isValid: false,
      error: `Weeks parameter must be between ${min} and ${max}`,
    };
  }

  return { isValid: true, weeks: parsed };
}

/**
 * Validate period parameter for analytics queries
 * @param {string} period - Period string (7days, 30days, 90days)
 * @returns {object} Validation result with interval value
 */
export function validatePeriod(period) {
  const validPeriods = {
    "7days": 7,
    "30days": 30,
    "90days": 90,
  };

  const normalizedPeriod = (period || "30days").toLowerCase();

  if (!validPeriods[normalizedPeriod]) {
    return {
      isValid: false,
      error: "Period must be one of: 7days, 30days, 90days",
    };
  }

  return {
    isValid: true,
    period: normalizedPeriod,
    days: validPeriods[normalizedPeriod],
  };
}

/**
 * Validate pagination parameters
 * @param {any} page - Page number
 * @param {any} limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit (default: 100)
 * @returns {object} Validation result with page, limit, and offset
 */
export function validatePagination(page, limit, maxLimit = 100) {
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 20;

  if (parsedPage < 1) {
    return { isValid: false, error: "Page must be at least 1" };
  }

  if (parsedLimit < 1 || parsedLimit > maxLimit) {
    return {
      isValid: false,
      error: `Limit must be between 1 and ${maxLimit}`,
    };
  }

  return {
    isValid: true,
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  };
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {string} details - Additional error details (dev only)
 * @returns {object} Error response object with statusCode
 */
export function createErrorResponse(
  message,
  code,
  statusCode = 500,
  details = null,
) {
  const response = {
    success: false,
    error: message,
    code,
    timestamp: safeFormatDate(new Date()),
  };

  if (details && process.env.NODE_ENV === "development") {
    response.details = details;
  }

  return { statusCode, response };
}

/**
 * Create standardized success response
 * @param {any} data - Response data
 * @param {string} message - Optional success message
 * @returns {object} Success response object
 */
export function createSuccessResponse(data, message = null) {
  const response = {
    success: true,
    data,
    timestamp: safeFormatDate(new Date()),
  };

  if (message) {
    response.message = message;
  }

  return response;
}

/**
 * Send error response to client
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {string} details - Additional error details
 */
export function sendError(res, message, code, statusCode = 500, details = null) {
  const { statusCode: status, response } = createErrorResponse(
    message,
    code,
    statusCode,
    details,
  );
  return res.status(status).json(response);
}

/**
 * Send success response to client
 * @param {Response} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Optional success message
 */
export function sendSuccess(res, data, message = null) {
  return res.json(createSuccessResponse(data, message));
}

// =============================================================================
// SAFE PARSING HELPERS
// =============================================================================

/**
 * Safely parse floats with validation
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed float or default value
 */
export function safeParseFloat(value, defaultValue = 0) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely calculate percentages
 * @param {number} numerator - Numerator value
 * @param {number} denominator - Denominator value
 * @param {number} defaultValue - Default value if calculation fails
 * @returns {number} Percentage value (0-100)
 */
export function safePercentage(numerator, denominator, defaultValue = 0) {
  const num = safeParseFloat(numerator, 0);
  const den = safeParseFloat(denominator, 0);

  if (!den || den === 0) {
    return defaultValue;
  }

  const percentage = (num / den) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

/**
 * Safely calculate averages from an array of values
 * @param {Array} values - Array of numeric values
 * @param {number} defaultValue - Default value if calculation fails
 * @returns {number} Average value
 */
export function safeAverage(values, defaultValue = 0) {
  if (!Array.isArray(values) || values.length === 0) {
    return defaultValue;
  }

  const validValues = values
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v));

  if (validValues.length === 0) {
    return defaultValue;
  }

  return validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
}

export default {
  validateUserId,
  validateWeeks,
  validatePeriod,
  validatePagination,
  createErrorResponse,
  createSuccessResponse,
  sendError,
  sendSuccess,
  safeParseFloat,
  safePercentage,
  safeAverage,
};



