import { supabaseAdmin } from "./supabase-client.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";

/**
 * ExerciseDB API Integration
 * Fetches exercises from ExerciseDB API and stores curated ones for flag football
 *
 * Endpoints:
 * GET /api/exercisedb - Get curated exercises from our database
 * GET /api/exercisedb/search - Search ExerciseDB API directly
 * POST /api/exercisedb/import - Import exercises from ExerciseDB (admin only)
 * POST /api/exercisedb/approve - Approve an exercise for use (coach only)
 */

const supabase = supabaseAdmin;

// ExerciseDB API configuration
const EXERCISEDB_API_URL = "https://exercisedb-api.vercel.app/api/v1";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Content-Type": "application/json",
};

/**
 * Verify user has coach/admin role
 */
async function verifyCoachRole(event) {
  const auth = await authenticateRequest(event);
  if (!auth.success) {
    return { authorized: false, error: auth.error };
  }
  const { user } = auth;

  // Get role from team_members table (not users table)
  const { data: memberData } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = memberData?.role || "player";
  if (!["coach", "admin", "head_coach", "assistant_coach"].includes(role)) {
    return {
      authorized: false,
      error: createErrorResponse(
        "Insufficient permissions",
        403,
        "authorization_error",
      ),
    };
  }

  return { authorized: true, user, role };
}

/**
 * Fetch exercises from ExerciseDB API
 */
async function fetchFromExerciseDB(endpoint, params = {}) {
  const url = new URL(`${EXERCISEDB_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`ExerciseDB API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Map ExerciseDB exercise to our schema
 */
function mapExerciseToSchema(exercise) {
  return {
    external_id: exercise.id || exercise.exerciseId,
    name: exercise.name,
    body_part: exercise.bodyPart,
    equipment: exercise.equipment,
    target_muscle: exercise.target,
    secondary_muscles: exercise.secondaryMuscles || [],
    gif_url: exercise.gifUrl,
    instructions: exercise.instructions || [],
  };
}

/**
 * GET - Retrieve curated exercises from our database
 */
async function getCuratedExercises(params) {
  const {
    category,
    position,
    equipment,
    body_part,
    min_relevance = 5,
    approved_only = "true",
    limit = 50,
    offset = 0,
  } = params;

  let query = supabase
    .from("exercisedb_exercises")
    .select("*")
    .eq("is_active", true)
    .gte("flag_football_relevance", parseInt(min_relevance))
    .order("flag_football_relevance", { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (approved_only === "true") {
    query = query.eq("is_approved", true);
  }

  if (category) {
    query = query.eq("ff_category", category);
  }

  if (position) {
    query = query.contains("applicable_positions", [position]);
  }

  if (equipment) {
    query = query.eq("equipment", equipment);
  }

  if (body_part) {
    query = query.eq("body_part", body_part);
  }

  const { data, error, count: _count } = await query;

  if (error) {
    throw error;
  }

  return { exercises: data, count: data?.length || 0 };
}

/**
 * GET - Get available filter options
 */
async function getFilterOptions() {
  const [categories, bodyParts, equipment, positions] = await Promise.all([
    supabase
      .from("exercisedb_exercises")
      .select("ff_category")
      .eq("is_active", true)
      .not("ff_category", "is", null),
    supabase
      .from("exercisedb_exercises")
      .select("body_part")
      .eq("is_active", true),
    supabase
      .from("exercisedb_exercises")
      .select("equipment")
      .eq("is_active", true),
    supabase.from("ff_exercise_mappings").select("applicable_positions"),
  ]);

  return {
    categories: [
      ...new Set(categories.data?.map((c) => c.ff_category).filter(Boolean)),
    ],
    bodyParts: [
      ...new Set(bodyParts.data?.map((b) => b.body_part).filter(Boolean)),
    ],
    equipment: [
      ...new Set(equipment.data?.map((e) => e.equipment).filter(Boolean)),
    ],
    positions: [
      ...new Set(
        positions.data?.flatMap((p) => p.applicable_positions).filter(Boolean),
      ),
    ],
  };
}

/**
 * GET - Search ExerciseDB API directly (for discovery)
 */
async function searchExerciseDB(params) {
  const { body_part, target, equipment, name, limit = 20 } = params;

  let exercises = [];

  try {
    if (body_part) {
      const data = await fetchFromExerciseDB(
        `/exercises/bodyPart/${encodeURIComponent(body_part)}`,
        { limit },
      );
      exercises = data.data || data;
    } else if (target) {
      const data = await fetchFromExerciseDB(
        `/exercises/target/${encodeURIComponent(target)}`,
        { limit },
      );
      exercises = data.data || data;
    } else if (equipment) {
      const data = await fetchFromExerciseDB(
        `/exercises/equipment/${encodeURIComponent(equipment)}`,
        { limit },
      );
      exercises = data.data || data;
    } else if (name) {
      const data = await fetchFromExerciseDB(
        `/exercises/name/${encodeURIComponent(name)}`,
        { limit },
      );
      exercises = data.data || data;
    } else {
      // Get general exercises
      const data = await fetchFromExerciseDB("/exercises", { limit });
      exercises = data.data || data;
    }

    return {
      exercises: Array.isArray(exercises) ? exercises.slice(0, limit) : [],
      source: "exercisedb_api",
    };
  } catch (error) {
    console.error("ExerciseDB API search error:", error);
    throw new Error(`Failed to search ExerciseDB: ${error.message}`);
  }
}

/**
 * POST - Import exercises from ExerciseDB API
 */
async function importExercises(params, userId) {
  const {
    body_parts = ["upper legs", "waist", "back", "shoulders"],
    equipment_filter,
    auto_approve = false,
  } = params;

  // Create import log
  const { data: importLog, error: logError } = await supabase
    .from("exercisedb_import_logs")
    .insert({
      import_type: "targeted",
      status: "started",
      body_parts_filter: body_parts,
      equipment_filter: equipment_filter ? [equipment_filter] : null,
      triggered_by: userId,
    })
    .select()
    .single();

  if (logError) {
    console.error("Failed to create import log:", logError);
  }

  let totalFetched = 0;
  let totalImported = 0;
  let totalUpdated = 0;
  const totalSkipped = 0;
  let totalErrors = 0;

  try {
    for (const bodyPart of body_parts) {
      try {
        const data = await fetchFromExerciseDB(
          `/exercises/bodyPart/${encodeURIComponent(bodyPart)}`,
        );
        const exercises = data.data || data || [];

        totalFetched += exercises.length;

        for (const exercise of exercises) {
          try {
            // Check if exercise already exists
            const { data: existing } = await supabase
              .from("exercisedb_exercises")
              .select("id")
              .eq("external_id", exercise.id || exercise.exerciseId)
              .single();

            const mappedExercise = mapExerciseToSchema(exercise);

            if (existing) {
              // Update existing
              const { error: updateError } = await supabase
                .from("exercisedb_exercises")
                .update({
                  ...mappedExercise,
                  last_synced_at: new Date().toISOString(),
                })
                .eq("id", existing.id);

              if (updateError) {
                totalErrors++;
              } else {
                totalUpdated++;
              }
            } else {
              // Insert new
              const { error: insertError } = await supabase
                .from("exercisedb_exercises")
                .insert({
                  ...mappedExercise,
                  is_approved: auto_approve,
                  approved_by: auto_approve ? userId : null,
                  approved_at: auto_approve ? new Date().toISOString() : null,
                });

              if (insertError) {
                console.error("Insert error:", insertError);
                totalErrors++;
              } else {
                totalImported++;
              }
            }
          } catch (err) {
            console.error("Exercise processing error:", err);
            totalErrors++;
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${bodyPart}:`, err);
        totalErrors++;
      }
    }

    // Update import log
    if (importLog) {
      await supabase
        .from("exercisedb_import_logs")
        .update({
          status: "completed",
          total_fetched: totalFetched,
          total_imported: totalImported,
          total_updated: totalUpdated,
          total_skipped: totalSkipped,
          total_errors: totalErrors,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importLog.id);
    }

    return {
      success: true,
      stats: {
        fetched: totalFetched,
        imported: totalImported,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: totalErrors,
      },
    };
  } catch (error) {
    // Update import log with error
    if (importLog) {
      await supabase
        .from("exercisedb_import_logs")
        .update({
          status: "failed",
          error_message: error.message,
          total_fetched: totalFetched,
          total_imported: totalImported,
          total_errors: totalErrors,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importLog.id);
    }

    throw error;
  }
}

/**
 * POST - Approve an exercise for use
 */
async function approveExercise(exerciseId, userId, approvalData) {
  const {
    flag_football_relevance,
    ff_category,
    ff_training_focus,
    applicable_positions,
    difficulty_level,
    recommended_sets,
    recommended_reps,
    recommended_rest_seconds,
    safety_notes,
    coaching_cues,
  } = approvalData;

  const { data, error } = await supabase
    .from("exercisedb_exercises")
    .update({
      is_approved: true,
      approved_by: userId,
      approved_at: new Date().toISOString(),
      is_curated: true,
      flag_football_relevance,
      ff_category,
      ff_training_focus,
      applicable_positions,
      difficulty_level,
      recommended_sets,
      recommended_reps,
      recommended_rest_seconds,
      safety_notes,
      coaching_cues,
    })
    .eq("id", exerciseId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return { success: true, exercise: data };
}

/**
 * Main handler
 */
export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const path = event.path
    .replace("/.netlify/functions/exercisedb", "")
    .replace("/api/exercisedb", "");
  const params = event.queryStringParameters || {};

  try {
    // GET requests
    if (event.httpMethod === "GET") {
      // GET /api/exercisedb/filters - Get filter options
      if (path === "/filters") {
        const filters = await getFilterOptions();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, filters }),
        };
      }

      // GET /api/exercisedb/search - Search ExerciseDB API
      if (path === "/search") {
        const auth = await verifyCoachRole(event);
        if (!auth.authorized) {
          return auth.error;
        }

        const results = await searchExerciseDB(params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, ...results }),
        };
      }

      // GET /api/exercisedb/logs - Get import logs
      if (path === "/logs") {
        const auth = await verifyCoachRole(event);
        if (!auth.authorized) {
          return auth.error;
        }

        const { data: logs, error } = await supabase
          .from("exercisedb_import_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          throw error;
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, logs }),
        };
      }

      // GET /api/exercisedb - Get curated exercises
      const results = await getCuratedExercises(params);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, ...results }),
      };
    }

    // POST requests (require auth)
    if (event.httpMethod === "POST") {
      const auth = await verifyCoachRole(event);
      if (!auth.authorized) {
        return auth.error;
      }

      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }

      // POST /api/exercisedb/import - Import exercises
      if (path === "/import") {
        const result = await importExercises(body, auth.user.id);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      }

      // POST /api/exercisedb/approve/:id - Approve an exercise
      if (path.startsWith("/approve/")) {
        const exerciseId = path.replace("/approve/", "");
        const result = await approveExercise(exerciseId, auth.user.id, body);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      }

      return {
        ...createErrorResponse("Endpoint not found", 404, "not_found"),
        headers,
      };
    }

    return {
      ...createErrorResponse("Method not allowed", 405, "method_not_allowed"),
      headers,
    };
  } catch (error) {
    console.error("ExerciseDB API error:", error);
    return {
      ...createErrorResponse(
        error.message || "Internal server error",
        500,
        "server_error",
      ),
      headers,
    };
  }
};
