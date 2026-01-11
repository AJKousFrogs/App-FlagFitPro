/**
 * Plyometrics Exercises API
 * Provides plyometric exercises from the database for training plans
 */

const { supabaseAdmin } = require("./supabase-client.cjs");

const supabase = supabaseAdmin;

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
      console.error("Error fetching plyometric exercises:", error);
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
    console.error("Plyometrics API error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
