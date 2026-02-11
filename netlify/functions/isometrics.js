/**
 * Isometrics Exercises API
 * Provides isometric exercises from the database for training plans
 */

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";

export const handler = async (event, context) =>
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
        const limit = Number.parseInt(params.limit, 10) || 10;

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
          console.error("Error fetching isometric exercises:", error);
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
        console.error("Isometrics API error:", error);
        return createErrorResponse("Internal server error", 500, "server_error");
      }
    },
  });
