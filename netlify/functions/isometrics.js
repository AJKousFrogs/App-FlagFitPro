/**
 * Isometrics Exercises API
 * Provides isometric exercises from the database for training plans
 */

import { supabaseAdmin } from "./supabase-client.js";

import { createErrorResponse } from "./utils/error-handler.js";

const supabase = supabaseAdmin;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

function withHeaders(response) {
  return { ...response, headers };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return withHeaders(
      createErrorResponse("Method not allowed", 405, "method_not_allowed"),
    );
  }

  try {
    const params = event.queryStringParameters || {};
    const { difficulty } = params;
    const { category } = params;
    const limit = parseInt(params.limit) || 10;

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
      return withHeaders(
        createErrorResponse("Failed to fetch exercises", 500, "database_error"),
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: exercises.length,
        exercises,
      }),
    };
  } catch (error) {
    console.error("Isometrics API error:", error);
    return withHeaders(
      createErrorResponse("Internal server error", 500, "server_error"),
    );
  }
};
