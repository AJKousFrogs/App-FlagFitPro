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

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "update-chatbot-stats",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      try {
        let bodyData = {};
        try {
          bodyData = JSON.parse(evt.body || "{}");
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        const { topic } = bodyData;

        await pool.query(`SELECT update_chatbot_query_stats($1, $2)`, [
          userId,
          topic || null,
        ]);

        return createSuccessResponse({
          message: "Statistics updated successfully",
        });
      } catch (error) {
        console.error("Error in update-chatbot-stats function:", error);
        return createErrorResponse("Internal server error", 500, "server_error");
      } finally {
        // Don't close pool - it's reused across invocations
      }
    },
  });
