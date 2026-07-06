/**
 * Plyometrics Exercises API
 * Provides plyometric exercises from the database for training plans
 */

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { parseBoundedInt } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.plyometrics" });

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "plyometrics",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false,
    handler: async (evt, _ctx, { supabase }) => {
      try {
        const params = evt.queryStringParameters || {};
        const { difficulty } = params;
        const { category } = params;
        const limit =
          parseBoundedInt(params.limit, "limit", {
            min: 1,
            max: 100,
          }) ?? 10;

        let query = supabase
          .from("plyometrics_exercises")
          .select("*")
          .order("effectiveness_rating", { ascending: false })
          .limit(limit);

        if (difficulty) {
          query = query.eq("difficulty_level", difficulty);
        }

        if (category) {
          query = query.eq("exercise_category", category);
        }

        const { data: exercises, error } = await query;

        if (error) {
          logger.error("exercises_fetch_failed", error, {
            details: "Error fetching plyometric exercises",
          });
          return createErrorResponse(
            "Failed to fetch exercises",
            500,
            "database_error",
          );
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            count: exercises.length,
            exercises,
          }),
        };
      } catch (error) {
        if (error?.isValidation) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        logger.error("plyometrics_api_error", error, {});
        return createErrorResponse(
          "Internal server error",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
