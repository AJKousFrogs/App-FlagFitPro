// Standardized Error Handling for Netlify Functions
// Provides consistent error responses and logging across all backend functions

/**
 * Error types for categorization
 */
const ErrorType = {
  VALIDATION: 'validation_error',
  AUTHENTICATION: 'authentication_error',
  AUTHORIZATION: 'authorization_error',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  RATE_LIMIT: 'rate_limit_exceeded',
  SERVER: 'server_error',
  DATABASE: 'database_error',
  NETWORK: 'network_error',
  UNKNOWN: 'unknown_error'
};

/**
 * Standard CORS headers
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Create a standardized error response
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorType - Error type from ErrorType enum
 * @param {object} additionalData - Additional data to include
 * @returns {object} Netlify function response
 */
function createErrorResponse(error, statusCode = 500, errorType = ErrorType.UNKNOWN, additionalData = {}) {
  const errorMessage = error instanceof Error ? error.message : error;
  const timestamp = new Date().toISOString();

  // Log the error
  console.error(`[${errorType}] ${statusCode}:`, errorMessage, error.stack || '');

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: errorMessage,
      errorType,
      timestamp,
      ...additionalData
    })
  };
}

/**
 * Create a standardized success response
 * @param {*} data - Data to return
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Optional success message
 * @returns {object} Netlify function response
 */
function createSuccessResponse(data, statusCode = 200, message = null) {
  const response = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(response)
  };
}

/**
 * Handle authentication errors
 * @param {string} message - Error message
 * @returns {object} 401 response
 */
function handleAuthenticationError(message = 'Authentication required') {
  return createErrorResponse(message, 401, ErrorType.AUTHENTICATION);
}

/**
 * Handle authorization errors
 * @param {string} message - Error message
 * @returns {object} 403 response
 */
function handleAuthorizationError(message = 'Permission denied') {
  return createErrorResponse(message, 403, ErrorType.AUTHORIZATION);
}

/**
 * Handle validation errors
 * @param {string|array} errors - Validation errors
 * @returns {object} 400 response
 */
function handleValidationError(errors) {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
  return createErrorResponse(errorMessage, 400, ErrorType.VALIDATION, {
    errors: Array.isArray(errors) ? errors : [errors]
  });
}

/**
 * Handle not found errors
 * @param {string} resource - Resource that wasn't found
 * @returns {object} 404 response
 */
function handleNotFoundError(resource = 'Resource') {
  return createErrorResponse(`${resource} not found`, 404, ErrorType.NOT_FOUND);
}

/**
 * Handle conflict errors (e.g., duplicate resources)
 * @param {string} message - Error message
 * @returns {object} 409 response
 */
function handleConflictError(message = 'Resource already exists') {
  return createErrorResponse(message, 409, ErrorType.CONFLICT);
}

/**
 * Handle database errors
 * @param {Error} error - Database error
 * @param {string} context - Error context
 * @returns {object} 500 response
 */
function handleDatabaseError(error, context = 'Database operation') {
  console.error(`[Database Error] ${context}:`, error);
  return createErrorResponse(
    'A database error occurred. Please try again later.',
    500,
    ErrorType.DATABASE
  );
}

/**
 * Handle server errors
 * @param {Error} error - Server error
 * @param {string} context - Error context
 * @returns {object} 500 response
 */
function handleServerError(error, context = 'Operation') {
  console.error(`[Server Error] ${context}:`, error);
  return createErrorResponse(
    'An internal server error occurred. Please try again later.',
    500,
    ErrorType.SERVER
  );
}

/**
 * Async error wrapper - wraps async function handlers with error handling
 * @param {function} handler - Async handler function
 * @param {string} context - Context for error logging
 * @returns {function} Wrapped handler
 */
function withErrorHandling(handler, context = 'Function') {
  return async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (error) {
      console.error(`[${context}] Unhandled error:`, error);

      // Categorize and handle different error types
      if (error.code === 'PGRST116' || error.message?.includes('not found')) {
        return handleNotFoundError();
      } else if (error.code?.startsWith('23')) {
        // PostgreSQL constraint violations
        return handleDatabaseError(error, context);
      } else if (error.statusCode) {
        // Error with status code
        return createErrorResponse(error.message, error.statusCode, ErrorType.UNKNOWN);
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
 * @returns {Promise<object>} Response object
 */
async function tryCatch(operation, context = 'Operation') {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    return {
      success: false,
      error: error.message || 'Operation failed',
      errorType: ErrorType.UNKNOWN
    };
  }
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

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: handleAuthenticationError('Authorization token required')
    };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, secret);
    return { success: true, decoded };
  } catch (jwtError) {
    console.error('[JWT Validation] Error:', jwtError.message);
    return {
      success: false,
      error: handleAuthenticationError('Invalid or expired token')
    };
  }
}

/**
 * Log function execution for debugging
 * @param {string} functionName - Name of the function
 * @param {object} event - Netlify function event
 */
function logFunctionCall(functionName, event) {
  console.log(`[${functionName}] ${event.httpMethod} request from ${event.headers['x-forwarded-for'] || 'unknown'}`);
}

module.exports = {
  ErrorType,
  CORS_HEADERS,
  createErrorResponse,
  createSuccessResponse,
  handleAuthenticationError,
  handleAuthorizationError,
  handleValidationError,
  handleNotFoundError,
  handleConflictError,
  handleDatabaseError,
  handleServerError,
  withErrorHandling,
  tryCatch,
  validateJWT,
  logFunctionCall
};
