/**
 * Response Helper Utilities
 * 
 * Provides standardized response formatting for common patterns.
 * 
 * This eliminates repetitive response creation code.
 */

const {
  createSuccessResponse,
  createErrorResponse
} = require("./error-handler.cjs");

/**
 * Create a standardized success response with data array
 * 
 * @param {array} data - Data array to return
 * @param {string} message - Optional success message
 * @returns {object} Netlify function response
 * 
 * @example
 * const { successResponse } = require("./utils/response-helper.cjs");
 * 
 * return successResponse(fixtures);
 * // Returns: { statusCode: 200, headers: {...}, body: JSON.stringify({ success: true, data: fixtures }) }
 */
function successResponse(data, message = null) {
  return createSuccessResponse({ data: data || [] }, 200, message);
}

/**
 * Create a standardized error response
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorType - Error type (default: 'server_error')
 * @returns {object} Netlify function response
 * 
 * @example
 * const { errorResponse } = require("./utils/response-helper.cjs");
 * 
 * return errorResponse("Failed to retrieve data", 500, 'database_error');
 */
function errorResponse(message, statusCode = 500, errorType = 'server_error') {
  return createErrorResponse(message, statusCode, errorType);
}

/**
 * Create a success response with a single object (not array)
 * 
 * @param {object} data - Data object to return
 * @param {string} message - Optional success message
 * @returns {object} Netlify function response
 * 
 * @example
 * const { successObjectResponse } = require("./utils/response-helper.cjs");
 * 
 * return successObjectResponse({ id: 1, name: "Test" });
 */
function successObjectResponse(data, message = null) {
  return createSuccessResponse(data, 200, message);
}

/**
 * Create a paginated response
 * 
 * @param {array} data - Data array
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {object} Netlify function response
 * 
 * @example
 * const { paginatedResponse } = require("./utils/response-helper.cjs");
 * 
 * return paginatedResponse(fixtures, 1, 20, 100);
 */
function paginatedResponse(data, page, limit, total) {
  return createSuccessResponse({
    data: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
}

module.exports = {
  successResponse,
  errorResponse,
  successObjectResponse,
  paginatedResponse
};
