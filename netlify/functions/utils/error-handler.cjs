// Standardized Error Handling for Netlify Functions
// Provides consistent error responses and logging across all backend functions
// Updated: 2024 - Modern JavaScript patterns with enhanced error handling

"use strict";

/**
 * Error types for categorization
 * @readonly
 * @enum {string}
 */
const ErrorType = Object.freeze({
  VALIDATION: "validation_error",
  AUTHENTICATION: "authentication_error",
  AUTHORIZATION: "authorization_error",
  NOT_FOUND: "not_found",
  METHOD_NOT_ALLOWED: "method_not_allowed",
  CONFLICT: "conflict",
  RATE_LIMIT: "rate_limit_exceeded",
  SERVER: "server_error",
  DATABASE: "database_error",
  NETWORK: "network_error",
  TIMEOUT: "timeout_error",
  UNKNOWN: "unknown_error",
});

/**
 * Standard CORS headers
 * In production, restrict to your actual domain for security
 */
const ALLOWED_ORIGINS = [
  "https://flagfit-pro.netlify.app",
  "https://flagfitpro.com",
  "http://localhost:4200", // Angular dev server
  "http://localhost:8888", // Netlify Dev proxy
];

const getCorsOrigin = (requestOrigin) => {
  // In development, allow all origins
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NETLIFY_DEV === "true"
  ) {
    return requestOrigin || "*";
  }
  // In production, validate against allowed origins
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Default to first allowed origin if no match
  return ALLOWED_ORIGINS[0];
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "development" ? "*" : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json",
};

/**
 * Create a standardized error response
 *
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorType - Error type from ErrorType enum
 * @param {object|string} additionalDataOrRequestId - Additional data to include or requestId string
 * @returns {object} Netlify function response
 */
function createErrorResponse(
  error,
  statusCode = 500,
  errorType = ErrorType.UNKNOWN,
  additionalDataOrRequestId = {},
) {
  // Backward compatibility for legacy call order: (statusCode, message, errorType)
  let resolvedStatusCode = statusCode;
  let resolvedError = error;
  let resolvedErrorType = errorType;

  if (typeof error === "number" && typeof statusCode === "string") {
    resolvedStatusCode = error;
    resolvedError = statusCode;
    resolvedErrorType = errorType;
  }

  if (
    resolvedErrorType === ErrorType.VALIDATION &&
    resolvedStatusCode === 400
  ) {
    resolvedStatusCode = 422;
  }

  const errorMessage =
    resolvedError instanceof Error ? resolvedError.message : resolvedError;
  const timestamp = new Date().toISOString();

  // Handle backward compatibility: if fourth param is string (requestId), include it
  let additionalData = {};
  let requestId = null;

  if (typeof additionalDataOrRequestId === "string") {
    // Legacy: fourth param is requestId string
    requestId = additionalDataOrRequestId;
  } else if (
    additionalDataOrRequestId !== null &&
    typeof additionalDataOrRequestId === "object"
  ) {
    additionalData = additionalDataOrRequestId;
    // Check if requestId is in the additional data
    if (additionalData.requestId) {
      requestId = additionalData.requestId;
      delete additionalData.requestId;
    }
  }

  // Log the error with requestId if available
  const logPrefix = requestId ? `[${requestId}]` : "";
  console.error(
    `${logPrefix}[${errorType}] ${statusCode}:`,
    errorMessage,
    error.stack || "",
  );

  const errorDetails =
    additionalData?.details ||
    additionalData?.errors ||
    additionalData?.fields ||
    null;

  if (additionalData?.details) {
    delete additionalData.details;
  }
  if (additionalData?.errors) {
    delete additionalData.errors;
  }
  if (additionalData?.fields) {
    delete additionalData.fields;
  }

  const responseBody = {
    success: false,
    error: {
      code: resolvedErrorType,
      message: errorMessage,
      details: errorDetails,
    },
    errorType: resolvedErrorType,
    timestamp,
    ...additionalData,
  };

  // Include requestId in response if available
  if (requestId) {
    responseBody.requestId = requestId;
  }

  return {
    statusCode: resolvedStatusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  };
}

/**
 * Create a standardized success response
 *
 * Supports two calling conventions:
 * 1. createSuccessResponse(data) - Simple response with data
 * 2. createSuccessResponse(data, statusCode, message, cacheTTL) - Full options
 *
 * Note: If second parameter is a string (requestId), it's ignored for backward compatibility
 * with older code that passed requestId. Use options object for new code.
 *
 * @param {*} data - Data to return
 * @param {number|string} statusCodeOrRequestId - HTTP status code (default: 200) or requestId (ignored)
 * @param {string} message - Optional success message
 * @param {number} cacheTTL - Cache TTL in seconds (0 = no cache)
 * @returns {object} Netlify function response
 */
function createSuccessResponse(
  data,
  statusCodeOrRequestId = 200,
  message = null,
  cacheTTL = 0,
) {
  // Handle backward compatibility: if second param is a string (requestId), use defaults
  let statusCode = 200;
  if (typeof statusCodeOrRequestId === "number") {
    statusCode = statusCodeOrRequestId;
  }
  // If it's a string (requestId), we ignore it and use default statusCode

  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  // Add cache headers based on TTL
  const cacheHeaders =
    cacheTTL > 0
      ? {
          "Cache-Control": `public, max-age=${cacheTTL}, stale-while-revalidate=${cacheTTL * 5}`,
          "CDN-Cache-Control": `public, max-age=${cacheTTL}`,
        }
      : {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        };

  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      ...cacheHeaders,
    },
    body: JSON.stringify(response),
  };
}

/**
 * Handle authentication errors
 * @param {string} message - Error message
 * @returns {object} 401 response
 */
function handleAuthenticationError(message = "Authentication required") {
  return createErrorResponse(message, 401, ErrorType.AUTHENTICATION);
}

/**
 * Handle authorization errors
 * @param {string} message - Error message
 * @returns {object} 403 response
 */
function handleAuthorizationError(message = "Permission denied") {
  return createErrorResponse(message, 403, ErrorType.AUTHORIZATION);
}

/**
 * Handle validation errors
 * @param {string|array} errors - Validation errors
 * @returns {object} 400 response
 */
function handleValidationError(errors) {
  const errorMessage = Array.isArray(errors) ? errors.join(", ") : errors;
  return createErrorResponse(errorMessage, 422, ErrorType.VALIDATION, {
    details: Array.isArray(errors) ? errors : [errors],
  });
}

/**
 * Handle not found errors
 * @param {string} resource - Resource that wasn't found
 * @returns {object} 404 response
 */
function handleNotFoundError(resource = "Resource") {
  return createErrorResponse(`${resource} not found`, 404, ErrorType.NOT_FOUND);
}

/**
 * Handle method not allowed errors
 * @param {string} method - HTTP method that was attempted
 * @param {string[]} allowedMethods - List of allowed methods
 * @returns {object} 405 response
 */
function handleMethodNotAllowedError(
  method = "Method",
  allowedMethods = ["GET", "POST"],
) {
  return createErrorResponse(
    `${method} method not allowed. Allowed: ${allowedMethods.join(", ")}`,
    405,
    ErrorType.METHOD_NOT_ALLOWED,
    { allowedMethods },
  );
}

/**
 * Handle conflict errors (e.g., duplicate resources)
 * @param {string} message - Error message
 * @returns {object} 409 response
 */
function handleConflictError(message = "Resource already exists") {
  return createErrorResponse(message, 409, ErrorType.CONFLICT);
}

/**
 * Handle database errors
 * @param {Error} error - Database error
 * @param {string} context - Error context
 * @returns {object} 500 response
 */
function handleDatabaseError(error, context = "Database operation") {
  console.error(`[Database Error] ${context}:`, error);
  return createErrorResponse(
    "A database error occurred. Please try again later.",
    500,
    ErrorType.DATABASE,
  );
}

/**
 * Handle server errors
 * @param {Error} error - Server error
 * @param {string} context - Error context
 * @returns {object} 500 response
 */
function handleServerError(error, context = "Operation") {
  console.error(`[Server Error] ${context}:`, error);
  console.error(`[Server Error] Stack:`, error.stack);
  console.error(`[Server Error] Details:`, {
    message: error.message,
    name: error.name,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  // Check if this is a development environment
  const isDevelopment =
    process.env.NETLIFY_DEV === "true" ||
    process.env.NODE_ENV === "development";

  // Provide more detailed error messages in development
  let errorMessage =
    "An internal server error occurred. Please try again later.";
  if (isDevelopment) {
    errorMessage = error.message || errorMessage;
    if (error.details) {
      errorMessage += ` Details: ${error.details}`;
    }
    if (error.hint) {
      errorMessage += ` Hint: ${error.hint}`;
    }
  }

  return createErrorResponse(
    errorMessage,
    500,
    ErrorType.SERVER,
    isDevelopment
      ? {
          originalError: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      : {},
  );
}

/**
 * Async error wrapper - wraps async function handlers with error handling
 * @param {function} handler - Async handler function
 * @param {string} context - Context for error logging
 * @returns {function} Wrapped handler
 */
function withErrorHandling(handler, context = "Function") {
  return async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (error) {
      console.error(`[${context}] Unhandled error:`, error);

      // Categorize and handle different error types
      if (error.code === "PGRST116" || error.message?.includes("not found")) {
        return handleNotFoundError();
      } else if (error.code?.startsWith("23")) {
        // PostgreSQL constraint violations
        return handleDatabaseError(error, context);
      } else if (error.statusCode) {
        // Error with status code
        return createErrorResponse(
          error.message,
          error.statusCode,
          ErrorType.UNKNOWN,
        );
      }

      // Default server error
      return handleServerError(error, context);
    }
  };
}

/**
 * Try-catch wrapper that returns consistent response format
 * @param {function} operation - Async operation to execute
 * @param {string} context - Error context
 * @param {object} options - Additional options
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.retries - Number of retries on failure
 * @returns {Promise<object>} Response object
 */
async function tryCatch(operation, context = "Operation", options = {}) {
  const { timeout = 30000, retries = 0 } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeout}ms`)),
          timeout,
        );
      });

      // Race operation against timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      return { success: true, data: result };
    } catch (error) {
      lastError = error;
      console.error(
        `[${context}] Error (attempt ${attempt + 1}/${retries + 1}):`,
        error,
      );

      // Don't retry on certain errors
      if (error.message?.includes("timed out") || attempt === retries) {
        break;
      }

      // Exponential backoff before retry
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 100));
    }
  }

  return {
    success: false,
    error: lastError?.message || "Operation failed",
    errorType: lastError?.message?.includes("timed out")
      ? ErrorType.TIMEOUT
      : ErrorType.UNKNOWN,
  };
}

/**
 * Validate and extract JWT token from authorization header
 * @param {object} event - Netlify function event
 * @param {object} jwt - JWT library instance
 * @param {string} secret - JWT secret
 * @returns {object} { success: boolean, decoded?: object, error?: object }
 */
function validateJWT(event, jwt, secret) {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: handleAuthenticationError("Authorization token required"),
    };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, secret);

    return { success: true, decoded };
  } catch (jwtError) {
    console.error("[JWT Validation] Error:", jwtError.message);
    return {
      success: false,
      error: handleAuthenticationError("Invalid or expired token"),
    };
  }
}

/**
 * Log function execution for debugging
 * @param {string} functionName - Name of the function
 * @param {object} event - Netlify function event
 */
function logFunctionCall(functionName, event) {
  const ip =
    (event.headers && event.headers["x-forwarded-for"]) ||
    (event.headers && event.headers["X-Forwarded-For"]) ||
    "unknown";
  console.log(`[${functionName}] ${event.httpMethod} request from ${ip}`);
}

// Export functions for use in other Netlify functions
module.exports = {
  ErrorType,
  CORS_HEADERS,
  ALLOWED_ORIGINS,
  getCorsOrigin,
  createErrorResponse,
  createSuccessResponse,
  handleAuthenticationError,
  handleAuthorizationError,
  handleValidationError,
  handleNotFoundError,
  handleMethodNotAllowedError,
  handleConflictError,
  handleDatabaseError,
  handleServerError,
  withErrorHandling,
  tryCatch,
  validateJWT,
  logFunctionCall,
};
