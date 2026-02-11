/**
 * Handler Factory for Netlify Functions
 * Provides a simplified wrapper around baseHandler that includes userRole
 *
 * @example
 * *
 * export const handler = createHandler({
 *   functionName: 'my-function',
 *   handler: async (event, context, { userId, userRole }) => {
 *     // Your function logic here
 *   }
 * });
 */

"use strict";

import { baseHandler } from "./base-handler.js";
import { getUserRole } from "./authorization-guard.js";

/**
 * Create a handler with automatic authentication and role extraction
 *
 * @param {object} options - Handler options
 * @param {string} options.functionName - Name of the function (for logging)
 * @param {string[]} [options.allowedMethods] - Array of allowed HTTP methods (default: ['GET', 'POST'])
 * @param {string} [options.rateLimitType] - Rate limit type: 'READ', 'CREATE', 'AUTH', or 'DEFAULT' (default: 'READ')
 * @param {boolean} [options.requireAuth] - Whether authentication is required (default: true)
 * @param {Function} options.handler - The actual handler function to execute
 * @returns {Function} Netlify function handler
 */
function createHandler(options) {
  const {
    functionName,
    allowedMethods = ["GET", "POST"],
    rateLimitType = "READ",
    requireAuth = true,
    handler,
  } = options;

  return async (event, context) => {
    return baseHandler(event, context, {
      functionName,
      allowedMethods,
      rateLimitType,
      requireAuth,
      handler: async (event, context, { userId, requestId }) => {
        // Get user role from authentication
        let userRole = "player"; // default role

        if (requireAuth && userId) {
          try {
            const resolvedRole = await getUserRole(userId);
            userRole = resolvedRole || "player";
          } catch (error) {
            console.warn(
              `[${functionName}] Could not get user role:`,
              error.message,
            );
          }
        }

        // Call the actual handler with userId and userRole
        return handler(event, context, { userId, userRole, requestId });
      },
    });
  };
}

export { createHandler };

export default { createHandler };
