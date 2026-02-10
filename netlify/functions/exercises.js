import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse } from "./utils/error-handler.js";

/**
 * Exercises API
 * Serves exercises from the exercise library for the Exercise Library component
 * Combines data from: exercises, plyometrics_exercises, and isometrics_exercises tables
 *
 * Endpoints:
 * GET /api/exercises - Get all active exercises
 * GET /api/exercises?category=mobility - Filter by category
 * GET /api/exercises?search=hip - Search by name/description
 */

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

/**
 * Map plyometric exercise to unified format
 */
function mapPlyometricExercise(ex) {
  return {
    id: ex.id,
    name: ex.exercise_name,
    slug: ex.exercise_name.toLowerCase().replace(/\s+/g, "-"),
    category: "plyometric",
    subcategory: ex.exercise_category,
    difficulty_level: ex.difficulty_level?.toLowerCase() || "intermediate",
    how_text: ex.description,
    description: ex.description,
    // Handle both string and array formats for backward compatibility
    feel_text: Array.isArray(ex.coaching_cues)
      ? ex.coaching_cues.join(" ")
      : ex.coaching_cues || null,
    compensation_text: Array.isArray(ex.common_mistakes)
      ? ex.common_mistakes.join(" ")
      : ex.common_mistakes || null,
    target_muscles: ex.target_muscles || [],
    equipment_required: ex.equipment_needed || [],
    video_url: ex.video_url,
    video_id: extractYoutubeId(ex.video_url),
    default_sets: 3,
    default_reps: 8,
    is_high_intensity:
      ex.intensity_level === "High" || ex.intensity_level === "Very High",
    load_contribution_au: ex.effectiveness_rating
      ? ex.effectiveness_rating * 2
      : 10,
    position_specific: ex.position_applications
      ? Object.keys(ex.position_applications)
      : null,
  };
}

/**
 * Map isometric exercise to unified format
 */
function mapIsometricExercise(ex) {
  return {
    id: ex.id,
    name: ex.name,
    slug: ex.name.toLowerCase().replace(/\s+/g, "-"),
    category: "strength", // Isometrics are strength exercises
    subcategory: ex.category,
    difficulty_level: ex.difficulty_level?.toLowerCase() || "intermediate",
    how_text: ex.description,
    description: ex.description,
    // Handle both string and array formats for backward compatibility
    feel_text: Array.isArray(ex.instructions)
      ? ex.instructions.join(" ")
      : ex.instructions || null,
    compensation_text: Array.isArray(ex.safety_notes)
      ? ex.safety_notes.join(" ")
      : ex.safety_notes || null,
    target_muscles: ex.target_muscles || [],
    equipment_required: [],
    video_url: ex.video_url,
    video_id: extractYoutubeId(ex.video_url),
    default_sets: ex.sets || 3,
    default_reps: ex.reps || 1,
    default_hold_seconds: ex.hold_duration_seconds || 30,
    is_high_intensity: false,
    load_contribution_au: ex.effectiveness_rating
      ? ex.effectiveness_rating * 2
      : 8,
    position_specific: null,
  };
}

/**
 * Map main exercises table to unified format
 */
function mapMainExercise(ex) {
  return {
    id: ex.id,
    name: ex.name,
    slug: ex.slug,
    category: ex.category,
    subcategory: ex.subcategory,
    difficulty_level: ex.difficulty_level || "beginner",
    how_text: ex.how_text,
    description: ex.how_text,
    feel_text: ex.feel_text,
    compensation_text: ex.compensation_text,
    target_muscles: ex.target_muscles || [],
    equipment_required: ex.equipment_required || [],
    video_url: ex.video_url,
    video_id: ex.video_id || extractYoutubeId(ex.video_url),
    default_sets: ex.default_sets,
    default_reps: ex.default_reps,
    default_hold_seconds: ex.default_hold_seconds,
    default_duration_seconds: ex.default_duration_seconds,
    is_high_intensity: ex.is_high_intensity,
    load_contribution_au: ex.load_contribution_au,
    position_specific: ex.position_specific,
  };
}

/**
 * Extract YouTube video ID from URL
 */
function extractYoutubeId(url) {
  if (!url) {
    return null;
  }
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * GET - Retrieve exercises from all sources
 */
async function getExercises(params) {
  const { category, search, limit = 500, offset = 0 } = params;

  const allExercises = [];

  // 1. Query main exercises table
  let mainQuery = supabase
    .from("exercises")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (category && category !== "all") {
    mainQuery = mainQuery.eq("category", category);
  }

  if (search && search.trim()) {
    mainQuery = mainQuery.or(
      `name.ilike.%${search}%,how_text.ilike.%${search}%,subcategory.ilike.%${search}%`,
    );
  }

  const { data: mainExercises, error: mainError } = await mainQuery;

  if (mainError) {
    console.error("Error fetching main exercises:", mainError);
  } else if (mainExercises) {
    allExercises.push(...mainExercises.map(mapMainExercise));
  }

  // 2. Query plyometrics exercises (if category matches or is "all")
  if (!category || category === "all" || category === "plyometric") {
    let plyoQuery = supabase
      .from("plyometrics_exercises")
      .select("*")
      .order("exercise_name", { ascending: true });

    if (search && search.trim()) {
      plyoQuery = plyoQuery.or(
        `exercise_name.ilike.%${search}%,description.ilike.%${search}%,exercise_category.ilike.%${search}%`,
      );
    }

    const { data: plyoExercises, error: plyoError } = await plyoQuery;

    if (plyoError) {
      console.error("Error fetching plyometric exercises:", plyoError);
    } else if (plyoExercises) {
      allExercises.push(...plyoExercises.map(mapPlyometricExercise));
    }
  }

  // 3. Query isometrics exercises (if category matches or is "all")
  if (!category || category === "all" || category === "strength") {
    let isoQuery = supabase
      .from("isometrics_exercises")
      .select("*")
      .order("name", { ascending: true });

    if (search && search.trim()) {
      isoQuery = isoQuery.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`,
      );
    }

    const { data: isoExercises, error: isoError } = await isoQuery;

    if (isoError) {
      console.error("Error fetching isometric exercises:", isoError);
    } else if (isoExercises) {
      allExercises.push(...isoExercises.map(mapIsometricExercise));
    }
  }

  // Sort by name
  allExercises.sort((a, b) => a.name.localeCompare(b.name));

  // Apply pagination
  const paginatedExercises = allExercises.slice(
    parseInt(offset),
    parseInt(offset) + parseInt(limit),
  );

  return { exercises: paginatedExercises, count: allExercises.length };
}

/**
 * Main handler
 */
export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return withHeaders(
      createErrorResponse("Method not allowed", 405, "method_not_allowed"),
    );
  }

  const params = event.queryStringParameters || {};

  try {
    const results = await getExercises(params);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: results.exercises }),
    };
  } catch (error) {
    console.error("Exercises API error:", error);
    return withHeaders(
      createErrorResponse(
        error.message || "Internal server error",
        500,
        "server_error",
      ),
    );
  }
};
