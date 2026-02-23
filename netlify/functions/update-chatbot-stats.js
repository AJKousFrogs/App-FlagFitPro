import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { Pool } from "pg";
import { baseHandler } from "./utils/base-handler.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";

// Update Chatbot Statistics API Endpoint
// Updates chatbot usage statistics and tracks preferred topics

// Use shared auth helper for consistency with other backend functions
// This ensures consistent authentication patterns across all Netlify functions

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "update-chatbot-stats",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId }) => {
      try {
        let bodyData = {};
        try {
          bodyData = JSON.parse(evt.body || "{}");
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        if (bodyData === null || typeof bodyData !== "object" || Array.isArray(bodyData)) {
          return handleValidationError("Request body must be an object");
        }

        const { topic } = bodyData;
        if (topic !== undefined) {
          if (typeof topic !== "string") {
            return handleValidationError("topic must be a string");
          }
          if (topic.trim().length > 120) {
            return handleValidationError("topic must be 120 characters or fewer");
          }
        }

        await pool.query(`SELECT update_chatbot_query_stats($1, $2)`, [
          userId,
          topic?.trim() ? topic.trim() : null,
        ]);

        return createSuccessResponse({
          message: "Statistics updated successfully",
        });
      } catch (error) {
        if (error?.code) {
          console.error("Error in update-chatbot-stats function", { code: error.code });
        } else {
          console.error("Error in update-chatbot-stats function");
        }
        return createErrorResponse(
          "Failed to update chatbot statistics",
          500,
          "server_error",
          requestId,
        );
      } finally {
        // Don't close pool - it's reused across invocations
      }
    },
  });

export const testHandler = handler;
export default createRuntimeV2Handler(handler);
