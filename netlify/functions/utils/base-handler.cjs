/**
 * Base Handler Middleware for Netlify Functions
 * 
 * Provides standardized handling of:
 * - CORS preflight requests
 * - Environment variable validation
 * - HTTP method validation
 * - Rate limiting
 * - Authentication
 * - Error handling
 * 
 * This eliminates ~40 lines of boilerplate from each function file.
 * 
 * @example
 * const { baseHandler } = require("./utils/base-handler.cjs");
 * 
 * exports.handler = async (event, context) => {
 *   return baseHandler(event, context, {
 *     functionName: 'fixtures',
 *     allowedMethods: ['GET'],
 *     rateLimitType: 'READ',
 *     handler: async (event, context, { userId }) => {
 *       // Your function-specific logic here
 *       const athleteId = event.queryStringParameters?.athleteId || userId;
 *       // ... rest of logic
 *     }
 *   });
 * };
 */

const { checkEnvVars } = require("../supabase-client.cjs");
const {
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./error-handler.cjs");
const { authenticateRequest } = require("./auth-helper.cjs");
const { applyRateLimit } = require("./rate-limiter.cjs");

/**
 * Base handler middleware
 * 
 * @param {object} event - Netlify function event
 * @param {object} context - Netlify function context
 * @param {object} options - Handler options
 * @param {string} options.functionName - Name of the function (for logging)
 * @param {string[]} options.allowedMethods - Array of allowed HTTP methods (default: ['GET'])
 * @param {string} options.rateLimitType - Rate limit type: 'READ', 'CREATE', 'AUTH', or 'DEFAULT' (default: 'READ')
 * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
 * @param {Function} options.handler - The actual handler function to execute
 * @param {Function} [options.onAuth] - Optional callback after authentication (receives userId)
 * @returns {Promise<object>} Netlify function response
 */
async function baseHandler(event, context, options = {}) {
  const {
    functionName,
    allowedMethods = ['GET'],
    rateLimitType = 'READ',
    requireAuth = true,
    handler,
    onAuth = null
  } = options;

  // Validate required options
  if (!functionName) {
    throw new Error('baseHandler: functionName is required');
  }
  if (!handler || typeof handler !== 'function') {
    throw new Error('baseHandler: handler function is required');
  }

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ""
    };
  }

  // Log function call
  logFunctionCall(functionName, event);

  try {
    // Check environment variables
    checkEnvVars();

    // Validate HTTP method
    if (!allowedMethods.includes(event.httpMethod)) {
      return createErrorResponse(
        `Method not allowed. Use ${allowedMethods.join(' or ')}.`,
        405,
        'method_not_allowed'
      );
    }

    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, rateLimitType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authenticate request (if required)
    let userId = null;
    if (requireAuth) {
      const auth = await authenticateRequest(event);
      if (!auth.success) {
        return auth.error;
      }
      userId = auth.user.id;

      // Call optional onAuth callback
      if (onAuth && typeof onAuth === 'function') {
        await onAuth(userId, event);
      }
    }

    // Call the actual handler
    return await handler(event, context, { userId });
  } catch (error) {
    return handleServerError(error, functionName);
  }
}

module.exports = { baseHandler };
