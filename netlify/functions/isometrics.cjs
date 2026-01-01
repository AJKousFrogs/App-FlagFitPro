/**
 * Isometrics Exercises API
 * Provides isometric exercises from the database for training plans
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to fetch exercises" }),
      };
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
