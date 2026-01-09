/**
 * Shared Validation & Response Utilities
 * Centralizes validation functions and standardized response helpers
 *
 * @module routes/utils/validation
 * @version 1.1.0 - Added XSS sanitization
 */

import DOMPurify from "isomorphic-dompurify";
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

/**
 * Validate RPE (Rate of Perceived Exertion) value
 * @param {any} rpe - RPE value to validate
 * @returns {object} Validation result
 */
export function validateRPE(rpe) {
  if (rpe === undefined || rpe === null) {
    return { isValid: true, rpe: 5 }; // Default to 5
  }

  const parsed = parseInt(rpe, 10);

  if (isNaN(parsed)) {
    return { isValid: false, error: "RPE must be a number" };
  }

  if (parsed < 1 || parsed > 10) {
    return { isValid: false, error: "RPE must be between 1 and 10" };
  }

  return { isValid: true, rpe: parsed };
}

/**
 * Validate duration in minutes
 * @param {any} duration - Duration to validate
 * @param {number} min - Minimum duration (default: 1)
 * @param {number} max - Maximum duration (default: 1440 = 24 hours)
 * @returns {object} Validation result
 */
export function validateDuration(duration, min = 1, max = 1440) {
  if (!duration) {
    return { isValid: false, error: "Duration is required" };
  }

  const parsed = parseInt(duration, 10);

  if (isNaN(parsed)) {
    return { isValid: false, error: "Duration must be a number" };
  }

  if (parsed < min || parsed > max) {
    return {
      isValid: false,
      error: `Duration must be between ${min} and ${max} minutes`,
    };
  }

  return { isValid: true, duration: parsed };
}

/**
 * Validate hydration amount in ml
 * @param {any} amount - Amount in ml to validate
 * @returns {object} Validation result
 */
export function validateHydrationAmount(amount) {
  if (!amount) {
    return { isValid: false, error: "Amount is required" };
  }

  const parsed = parseFloat(amount);

  if (isNaN(parsed)) {
    return { isValid: false, error: "Amount must be a number" };
  }

  if (parsed <= 0 || parsed > 10000) {
    return {
      isValid: false,
      error: "Amount must be between 1 and 10000 ml (10L)",
    };
  }

  return { isValid: true, amount: parsed };
}

/**
 * Validate date is in valid format and reasonable range
 * @param {string} dateString - Date string to validate
 * @returns {object} Validation result
 */
export function validateDate(dateString) {
  if (!dateString) {
    return { isValid: false, error: "Date is required" };
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: "Invalid date format" };
  }

  // Check not in future
  const now = new Date();
  if (date > now) {
    return { isValid: false, error: "Date cannot be in the future" };
  }

  // Check not more than 5 years in past
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  if (date < fiveYearsAgo) {
    return {
      isValid: false,
      error: "Date cannot be more than 5 years in the past",
    };
  }

  return { isValid: true, date: date.toISOString() };
}

// =============================================================================
// INPUT SANITIZATION (XSS Prevention)
// =============================================================================

/**
 * Sanitize text input to prevent XSS attacks
 * Removes all HTML tags and malicious code while preserving text content
 *
 * @param {string} text - Text to sanitize
 * @param {object} options - DOMPurify options
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, options = {}) {
  if (!text || typeof text !== "string") {
    return text;
  }

  const defaultOptions = {
    ALLOWED_TAGS: [], // Remove all HTML tags by default
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content when removing tags
    ...options,
  };

  return DOMPurify.sanitize(text, defaultOptions).trim();
}

/**
 * Sanitize multiple fields in an object
 * Useful for sanitizing all text fields in request bodies
 *
 * @param {object} obj - Object containing fields to sanitize
 * @param {string[]} fields - Array of field names to sanitize
 * @returns {object} Object with sanitized fields
 *
 * @example
 * const sanitized = sanitizeFields(req.body, ['notes', 'description', 'feedback']);
 */
export function sanitizeFields(obj, fields) {
  const sanitized = { ...obj };

  for (const field of fields) {
    if (sanitized[field] && typeof sanitized[field] === "string") {
      sanitized[field] = sanitizeText(sanitized[field]);
    }
  }

  return sanitized;
}

/**
 * Sanitize rich text that may contain some allowed HTML
 * More permissive than sanitizeText, allows basic formatting
 *
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML with only safe tags
 */
export function sanitizeRichText(html) {
  if (!html || typeof html !== "string") {
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
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
 * Send validation error response with field-specific errors
 * @param {Response} res - Express response object
 * @param {object} errors - Object with field names as keys and error messages as values
 */
export function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    fields: errors,
    timestamp: safeFormatDate(new Date()),
  });
}

/**
 * Send error response to client
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {string} details - Additional error details
 */
export function sendError(
  res,
  message,
  code,
  statusCode = 500,
  details = null,
) {
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

  const validValues = values.map((v) => parseFloat(v)).filter((v) => !isNaN(v));

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
  validateRPE,
  validateDuration,
  validateHydrationAmount,
  validateDate,
  sanitizeText,
  sanitizeFields,
  sanitizeRichText,
  createErrorResponse,
  createSuccessResponse,
  sendError,
  sendSuccess,
  sendValidationError,
  safeParseFloat,
  safePercentage,
  safeAverage,
};
