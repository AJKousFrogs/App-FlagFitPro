
/**
 * Isometrics Exercises API
 * Provides isometric exercises from the database for training plans
 */

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { parseBoundedInt } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.isometrics" });

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "isometrics",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false,
    handler: async (evt, _ctx, { supabase }) => {
      try {
        const params = evt.queryStringParameters || {};
        const { difficulty } = params;
        const { category } = params;
        const limit = parseBoundedInt(params.limit, "limit", {
          min: 1,
          max: 100,
        }) ?? 10;

        let query = supabase
          .from("isometrics_exercises")
          .select("*")
          .order("difficulty_level", { ascending: true })
          .limit(limit);

        if (difficulty) {
          query = query.eq("difficulty_level", difficulty);
        }

        if (category) {
          query = query.eq("category", category);
        }

        const { data: exercises, error } = await query;

        if (error) {
          logger.error("isometric_exercises_fetch_failed", error, {});
          return createErrorResponse(
            "Failed to fetch exercises",
            500,
            "database_error",
          );
        }

        return createSuccessResponse({ count: exercises.length, exercises });
      } catch (error) {
        if (error?.isValidation) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        logger.error("isometrics_api_error", error, {});
        return createErrorResponse("Internal server error", 500, "server_error");
      }
    },
  });

export const testHandler = handler;
export { handler };
