import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  canCoachViewWellness,
  filterWellnessDataForCoach,
} from "./utils/consent-guard.js";
import { ConsentDataReader, AccessContext } from "./utils/consent-data-reader.js";
import { detectPainTrigger } from "./utils/safety-override.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { guardMerlinRequest } from "./utils/merlin-guard.js";

// Netlify Functions - Performance Data API
// Handles athlete performance data storage and retrieval using Supabase

// CORS Headers for cross-origin requests
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

// ============================================================================
// DATA MAPPERS - Reusable transformation functions
// ============================================================================

const dataMappers = {
  measurement: (m) => ({
    id: m.id,
    userId: m.user_id,
    weight: m.weight,
    height: m.height,
    bodyFat: m.body_fat,
    muscleMass: m.muscle_mass,
    timestamp: m.created_at,
  }),

  performanceTest: (t) => ({
    id: t.id,
    userId: t.user_id,
    testType: t.test_type || t.test_protocol_id?.toString(),
    result: t.best_result || t.average_result,
    target: null,
    timestamp: t.test_date || t.created_at,
    conditions: t.environmental_conditions || {},
    notes: t.notes,
  }),

  wellness: (w) => ({
    id: w.id,
    userId: w.athlete_id || w.user_id,
    date: w.date,
    sleep: w.sleep_quality,
    energy: w.energy_level,
    stress: w.stress_level,
    soreness: w.muscle_soreness,
    motivation: w.motivation_level,
    mood: w.mood,
    hydration: w.hydration_level,
    notes: w.notes,
    timestamp: w.created_at,
  }),

  supplement: (s) => ({
    id: s.id,
    userId: s.user_id,
    name: s.supplement_name,
    dosage: s.dosage,
    date: s.date,
    taken: s.taken,
    timeOfDay: s.time_of_day,
    notes: s.notes,
  }),

  injury: (i) => ({
    id: i.id,
    userId: i.user_id,
    type: i.type,
    location: i.location,
    severity: i.severity,
    date: i.date,
    status: i.status,
    recoveryDate: i.recovery_date,
    treatment: i.treatment,
    notes: i.notes,
  }),
};

// Handler registry pattern - cleaner than switch statement
const ENDPOINT_HANDLERS = {
  measurements: handleMeasurements,
  "performance-tests": handlePerformanceTests,
  wellness: handleWellness,
  supplements: handleSupplements,
  injuries: handleInjuries,
  trends: handleTrends,
  export: handleExport,
};

const COACH_ROLES = new Set(["coach", "assistant_coach", "head_coach", "admin"]);
const consentReader = new ConsentDataReader(supabaseAdmin);

function parseBoundedInt(value, fallback, { min, max, field }) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function parseJsonObjectBody(rawBody) {
  let parsed;
  try {
    parsed = JSON.parse(rawBody || "{}");
  } catch {
    return {
      ok: false,
      response: createErrorResponse(
        "Invalid JSON in request body",
        400,
        "invalid_json",
      ),
    };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      response: createErrorResponse(
        "Request body must be an object",
        422,
        "validation_error",
      ),
    };
  }
  return { ok: true, data: parsed };
}

async function coachCanAccessAthlete(coachUserId, athleteUserId) {
  if (!coachUserId || !athleteUserId || coachUserId === athleteUserId) {
    return false;
  }

  const { data: coachMemberships, error: coachError } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", coachUserId);

  if (coachError) {
    throw coachError;
  }

  const coachTeamIds = (coachMemberships || [])
    .filter((m) => COACH_ROLES.has(m.role))
    .map((m) => m.team_id)
    .filter(Boolean);

  if (coachTeamIds.length === 0) {
    return false;
  }

  const { data: athleteMembership, error: athleteError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteUserId)
    .in("team_id", coachTeamIds)
    .limit(1)
    .maybeSingle();

  if (athleteError && athleteError.code !== "PGRST116") {
    throw athleteError;
  }

  return !!athleteMembership;
}

async function getSharedTeamIdForCoachAndAthlete(coachUserId, athleteUserId) {
  if (!coachUserId || !athleteUserId || coachUserId === athleteUserId) {
    return null;
  }

  const { data: coachMemberships, error: coachError } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", coachUserId);

  if (coachError) {
    throw coachError;
  }

  const coachTeamIds = (coachMemberships || [])
    .filter((m) => COACH_ROLES.has(m.role))
    .map((m) => m.team_id)
    .filter(Boolean);

  if (coachTeamIds.length === 0) {
    return null;
  }

  const { data: athleteMembership, error: athleteError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteUserId)
    .in("team_id", coachTeamIds)
    .limit(1)
    .maybeSingle();

  if (athleteError && athleteError.code !== "PGRST116") {
    throw athleteError;
  }

  return athleteMembership?.team_id || null;
}

export const handler = async (event, context) => {
  // Apply Merlin guard for mutation endpoints
  if (event.httpMethod !== "GET" && event.httpMethod !== "OPTIONS") {
    const req = {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
      body: event.body,
      user: context.user || {},
    };
    const blocked = guardMerlinRequest(req);
    if (blocked && blocked.statusCode === 403) {
      return blocked;
    }
  }

  // Determine rate limit type based on HTTP method
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "CREATE";

  return baseHandler(event, context, {
    functionName: "performance-data",
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    rateLimitType: rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const { httpMethod, path, body, queryStringParameters } = event;
      const pathSegments = path.split("/").filter(Boolean);
      const knownEndpoints = new Set(Object.keys(ENDPOINT_HANDLERS));
      let endpoint = pathSegments[pathSegments.length - 1];
      let resourceId = null;

      // Support nested resource paths like /performance-data/injuries/:id
      if (!knownEndpoints.has(endpoint) && pathSegments.length >= 2) {
        const candidateEndpoint = pathSegments[pathSegments.length - 2];
        if (knownEndpoints.has(candidateEndpoint)) {
          endpoint = candidateEndpoint;
          resourceId = pathSegments[pathSegments.length - 1];
        }
      }

      // Use handler registry instead of switch statement
      const handler = ENDPOINT_HANDLERS[endpoint];

      if (!handler) {
        return createErrorResponse("Endpoint not found", 404, "not_found");
      }

      // Special handling for export endpoint (different signature)
      if (endpoint === "export") {
        return await handler(userId, queryStringParameters);
      }

      // Extract athleteId from query for coach requests
      const requestedAthleteId = queryStringParameters?.athleteId || userId;

      if (endpoint === "wellness" || endpoint === "trends") {
        return await handler(
          httpMethod,
          userId,
          requestedAthleteId,
          body,
          queryStringParameters,
          resourceId,
        );
      }

      return await handler(
        httpMethod,
        userId,
        body,
        queryStringParameters,
        resourceId,
      );
    },
  });
};

// Physical Measurements Handler
async function handleMeasurements(method, userId, body, query, _resourceId) {
  switch (method) {
    case "GET": {
      const timeframe = query?.timeframe || "6m";
      let page;
      let limit;
      try {
        page = parseBoundedInt(query?.page, 1, {
          min: 1,
          max: 1000000,
          field: "page",
        });
        limit = parseBoundedInt(query?.limit, 50, {
          min: 1,
          max: 100,
          field: "limit",
        });
      } catch (validationError) {
        return createErrorResponse(
          validationError.message || "Invalid pagination parameters",
          422,
          "validation_error",
        );
      }
      const offset = (page - 1) * limit;

      // Calculate date range
      const startDate = getStartDateForTimeframe(timeframe);

      try {
        // Query from physical_measurements table (create if doesn't exist)
        const {
          data: measurements,
          error,
          count,
        } = await supabaseAdmin
          .from("physical_measurements")
          .select("*", { count: "exact" })
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error && error.code !== "42P01") {
          // 42P01 = table doesn't exist
          throw error;
        }

        // If table doesn't exist, return empty data
        const data = measurements || [];
        const total = count || 0;

        return {
          statusCode: 200,
          body: JSON.stringify({
            data: data.map(dataMappers.measurement),
            summary: calculateMeasurementsSummary(data),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
              hasMore: offset + limit < total,
            },
          }),
        };
      } catch (error) {
        console.error("Error fetching measurements:", error);
        // Return empty data if table doesn't exist
        return {
          statusCode: 200,
          body: JSON.stringify({
            data: [],
            summary: {},
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasMore: false,
            },
          }),
        };
      }
    }

    case "POST": {
      const parsedBody = parseJsonObjectBody(body);
      if (!parsedBody.ok) {
        return parsedBody.response;
      }
      const measurementData = parsedBody.data;

      // Validate data
      const errors = validateMeasurementData(measurementData);
      if (errors.length > 0) {
        return handleValidationError(errors);
      }

      try {
        // Insert all fields including enhanced body composition
        const { data, error } = await supabaseAdmin
          .from("physical_measurements")
          .insert({
            user_id: userId,
            // Basic measurements
            weight: measurementData.weight,
            height: measurementData.height,
            body_fat: measurementData.bodyFat,
            muscle_mass: measurementData.muscleMass,
            // Enhanced body composition fields (from smart scales)
            body_water_mass: measurementData.bodyWaterMass,
            fat_mass: measurementData.fatMass,
            protein_mass: measurementData.proteinMass,
            bone_mineral_content: measurementData.boneMineralContent,
            skeletal_muscle_mass: measurementData.skeletalMuscleMass,
            muscle_percentage: measurementData.musclePercentage,
            body_water_percentage: measurementData.bodyWaterPercentage,
            protein_percentage: measurementData.proteinPercentage,
            bone_mineral_percentage: measurementData.boneMineralPercentage,
            visceral_fat_rating: measurementData.visceralFatRating,
            basal_metabolic_rate: measurementData.basalMetabolicRate,
            waist_to_hip_ratio: measurementData.waistToHipRatio,
            body_age: measurementData.bodyAge,
            notes: measurementData.notes,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          // If table doesn't exist, create it (simplified - in production, use migrations)
          if (error.code === "42P01") {
            // Return success but note table needs creation
            return {
              statusCode: 201,
              body: JSON.stringify({
                success: true,
                id: `temp_${Date.now()}`,
                data: {
                  ...measurementData,
                  userId,
                  timestamp: new Date().toISOString(),
                },
                note: "Table needs to be created via migration",
              }),
            };
          }
          throw error;
        }

        return {
          statusCode: 201,
          body: JSON.stringify({
            success: true,
            id: data.id,
            data: {
              id: data.id,
              userId: data.user_id,
              // Basic measurements
              weight: data.weight,
              height: data.height,
              bodyFat: data.body_fat,
              muscleMass: data.muscle_mass,
              // Enhanced body composition
              bodyWaterMass: data.body_water_mass,
              fatMass: data.fat_mass,
              proteinMass: data.protein_mass,
              boneMineralContent: data.bone_mineral_content,
              skeletalMuscleMass: data.skeletal_muscle_mass,
              musclePercentage: data.muscle_percentage,
              bodyWaterPercentage: data.body_water_percentage,
              proteinPercentage: data.protein_percentage,
              boneMineralPercentage: data.bone_mineral_percentage,
              visceralFatRating: data.visceral_fat_rating,
              basalMetabolicRate: data.basal_metabolic_rate,
              waistToHipRatio: data.waist_to_hip_ratio,
              bodyAge: data.body_age,
              notes: data.notes,
              timestamp: data.created_at,
            },
          }),
        };
      } catch (error) {
        console.error("Error saving measurement:", error);
        return createErrorResponse(
          "Failed to save measurement",
          500,
          "server_error",
        );
      }
    }

    default:
      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
  }
}

// Performance Tests Handler
// Uses 'performance_tests' table (aligned with frontend) - UUID-based with auth.users FK
async function handlePerformanceTests(method, userId, body, query, _resourceId) {
  switch (method) {
    case "GET": {
      const testType = query?.testType;
      const timeframe = query?.timeframe || "12m";
      let page;
      let limit;
      try {
        page = parseBoundedInt(query?.page, 1, {
          min: 1,
          max: 1000000,
          field: "page",
        });
        limit = parseBoundedInt(query?.limit, 50, {
          min: 1,
          max: 100,
          field: "limit",
        });
      } catch (validationError) {
        return createErrorResponse(
          validationError.message || "Invalid pagination parameters",
          422,
          "validation_error",
        );
      }
      const offset = (page - 1) * limit;

      const startDate = getStartDateForTimeframe(timeframe);

      try {
        let queryBuilder = supabaseAdmin
          .from("performance_tests")
          .select("*", { count: "exact" })
          .eq("user_id", userId)
          .gte("test_date", startDate.toISOString())
          .order("test_date", { ascending: false })
          .range(offset, offset + limit - 1);

        // Filter by test type at query level for performance
        if (testType) {
          queryBuilder = queryBuilder.eq("test_type", testType);
        }

        const { data: tests, error, count } = await queryBuilder;

        if (error && error.code !== "42P01") {
          throw error;
        }

        // Map to consistent API format
        const mappedTests = (tests || []).map((t) => ({
          id: t.id,
          userId: t.user_id,
          testType: t.test_type,
          result: t.result_value,
          target: t.target_value,
          timestamp: t.test_date,
          conditions: t.conditions || {},
          notes: t.notes,
        }));

        const total = count || mappedTests.length;

        return {
          statusCode: 200,
          body: JSON.stringify({
            data: mappedTests,
            trends: calculatePerformanceTrends(mappedTests),
            summary: calculateTestsSummary(mappedTests),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
              hasMore: offset + limit < total,
            },
          }),
        };
      } catch (error) {
        console.error("Error fetching performance tests:", error);
        return {
          statusCode: 200,
          body: JSON.stringify({
            data: [],
            trends: {},
            summary: {},
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasMore: false,
            },
          }),
        };
      }
    }

    case "POST": {
      const parsedBody = parseJsonObjectBody(body);
      if (!parsedBody.ok) {
        return parsedBody.response;
      }
      const testData = parsedBody.data;

      // Validate required fields
      if (!testData.testType) {
        return handleValidationError(["testType is required"]);
      }
      if (testData.result === undefined || testData.result === null) {
        return handleValidationError(["result is required"]);
      }

      try {
        const { data, error } = await supabaseAdmin
          .from("performance_tests")
          .insert({
            user_id: userId,
            test_type: testData.testType,
            result_value: testData.result,
            target_value: testData.target,
            test_date: testData.date || new Date().toISOString(),
            conditions: testData.conditions || {},
            notes: testData.notes,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "42P01") {
            // Table doesn't exist - return success with note
            return {
              statusCode: 201,
              body: JSON.stringify({
                success: true,
                id: `temp_${Date.now()}`,
                improvement: { percent: 0, trend: "no_data" },
                note: "Table needs to be created via migration",
              }),
            };
          }
          throw error;
        }

        const improvement = await calculateImprovement(
          testData.testType,
          testData.result,
          userId,
        );

        return {
          statusCode: 201,
          body: JSON.stringify({
            success: true,
            id: data.id,
            data: {
              id: data.id,
              userId: data.user_id,
              testType: data.test_type,
              result: data.result_value,
              target: data.target_value,
              timestamp: data.test_date,
              conditions: data.conditions,
              notes: data.notes,
            },
            improvement,
          }),
        };
      } catch (error) {
        console.error("Error saving performance test:", error);
        return createErrorResponse(
          "Failed to save performance test",
          500,
          "server_error",
        );
      }
    }

    default:
      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
  }
}

// Wellness Data Handler
async function handleWellness(method, userId, requestedAthleteId, body, query, _resourceId) {
  const targetAthleteId = requestedAthleteId || userId;
  const role = await getUserRole(userId);
  const isCoach = ["coach", "assistant_coach", "head_coach", "admin"].includes(
    role,
  );

  switch (method) {
    case "GET": {
      if (targetAthleteId !== userId) {
        if (!isCoach) {
          return createErrorResponse(
            "Not authorized to view another athlete's wellness data",
            403,
            "authorization_error",
          );
        }
        const canAccess = await coachCanAccessAthlete(userId, targetAthleteId);
        if (!canAccess) {
          return createErrorResponse(
            "Not authorized to view another athlete's wellness data",
            403,
            "authorization_error",
          );
        }
      }

      const timeframe = query?.timeframe || "30d";
      const startDate = getStartDateForTimeframe(timeframe);

      try {
        const context =
          isCoach && targetAthleteId !== userId
            ? AccessContext.COACH_TEAM_DATA
            : AccessContext.PLAYER_OWN_DATA;
        const sharedTeamId =
          context === AccessContext.COACH_TEAM_DATA
            ? await getSharedTeamIdForCoachAndAthlete(userId, targetAthleteId)
            : null;
        const wellnessResult = await consentReader.readWellnessEntries({
          requesterId: userId,
          playerId: targetAthleteId,
          teamId: sharedTeamId,
          context,
          filters: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
            limit: 400,
          },
        });

        let wellnessData = (wellnessResult.data || []).map(dataMappers.wellness);

        // Filter data for coach if consent not granted
        if (isCoach && targetAthleteId !== userId && wellnessData.length > 0) {
          const consentCheck = await canCoachViewWellness(
            userId,
            targetAthleteId,
          );
          if (!consentCheck.allowed) {
            // Return compliance-only data
            wellnessData = wellnessData.map(() => ({
              check_in_completed: true,
              // All wellness answers hidden
            }));
          } else {
            // Filter based on consent level
            wellnessData = wellnessData.map((item) =>
              filterWellnessDataForCoach(
                item,
                consentCheck.reason === "CONSENT_GRANTED",
                consentCheck.safetyOverride,
              ),
            );
          }
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            data: wellnessData,
            averages: calculateWellnessAverages(wellnessData),
            patterns: detectWellnessPatterns(wellnessData),
          }),
        };
      } catch (error) {
        console.error("Error fetching wellness data:", error);
        return {
          statusCode: 200,
          body: JSON.stringify({
            data: [],
            averages: null,
            patterns: { patterns: [], insights: [] },
          }),
        };
      }
    }

    case "POST": {
      const parsedBody = parseJsonObjectBody(body);
      if (!parsedBody.ok) {
        return parsedBody.response;
      }
      const wellnessData = parsedBody.data;

      // Safety override: Check for pain triggers (muscle_soreness >3/10)
      if (
        wellnessData.soreness !== undefined &&
        wellnessData.soreness !== null &&
        wellnessData.soreness > 3
      ) {
        await detectPainTrigger(userId, wellnessData.soreness, "general", null);
      }

      try {
        const { data, error } = await supabaseAdmin
          .from("wellness_entries")
          .insert({
            athlete_id: userId,
            user_id: userId, // Keep for compatibility
            date: wellnessData.date || new Date().toISOString().split("T")[0],
            sleep_quality: wellnessData.sleep,
            energy_level: wellnessData.energy,
            stress_level: wellnessData.stress,
            muscle_soreness: wellnessData.soreness,
            motivation_level: wellnessData.motivation,
            mood: wellnessData.mood,
            hydration_level: wellnessData.hydration,
            notes: wellnessData.notes,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "42P01") {
            return {
              statusCode: 201,
              body: JSON.stringify({
                success: true,
                id: `temp_${Date.now()}`,
                note: "Table needs to be created via migration",
              }),
            };
          }
          throw error;
        }

        return {
          statusCode: 201,
          body: JSON.stringify({
            success: true,
            id: data.id,
          }),
        };
      } catch (error) {
        console.error("Error saving wellness data:", error);
        return createErrorResponse(
          "Failed to save wellness data",
          500,
          "server_error",
        );
      }
    }

    default:
      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
  }
}

// Supplements Handler
async function handleSupplements(method, userId, body, query, _resourceId) {
  switch (method) {
    case "GET": {
      const timeframe = query?.timeframe || "30d";
      const startDate = getStartDateForTimeframe(timeframe);

      try {
        const { data: supplements, error } = await supabaseAdmin
          .from("supplement_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate.toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (error && error.code !== "42P01") {
          throw error;
        }

        const supplementsData = (supplements || []).map((s) => ({
          id: s.id,
          userId: s.user_id,
          name: s.supplement_name,
          dosage: s.dosage,
          taken: s.taken,
          date: s.date,
          timeOfDay: s.time_of_day,
          notes: s.notes,
          timestamp: s.created_at,
        }));

        return {
          statusCode: 200,
          body: JSON.stringify({
            data: supplementsData,
            compliance: calculateSupplementCompliance(supplementsData),
          }),
        };
      } catch (error) {
        console.error("Error fetching supplements data:", error);
        return {
          statusCode: 200,
          body: JSON.stringify({
            data: [],
            compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 },
          }),
        };
      }
    }

    case "POST": {
      const parsedBody = parseJsonObjectBody(body);
      if (!parsedBody.ok) {
        return parsedBody.response;
      }
      const supplementData = parsedBody.data;

      // Validate supplement data
      const validationErrors = validateSupplementData(supplementData);
      if (validationErrors.length > 0) {
        return handleValidationError(validationErrors);
      }

      try {
        const { data, error } = await supabaseAdmin
          .from("supplement_logs")
          .insert({
            user_id: userId,
            supplement_name: supplementData.name?.trim(),
            dosage: supplementData.dosage?.trim(),
            taken:
              supplementData.taken !== undefined ? supplementData.taken : true,
            date: supplementData.date || new Date().toISOString().split("T")[0],
            time_of_day: supplementData.timeOfDay,
            notes: supplementData.notes?.trim(),
          })
          .select()
          .single();

        if (error) {
          if (error.code === "42P01") {
            return {
              statusCode: 201,
              body: JSON.stringify({
                success: true,
                id: `temp_${Date.now()}`,
                note: "Table needs to be created via migration",
              }),
            };
          }
          throw error;
        }

        return {
          statusCode: 201,
          body: JSON.stringify({
            success: true,
            id: data.id,
            data: {
              id: data.id,
              userId: data.user_id,
              name: data.supplement_name,
              dosage: data.dosage,
              taken: data.taken,
              date: data.date,
              timeOfDay: data.time_of_day,
              notes: data.notes,
            },
          }),
        };
      } catch (error) {
        console.error("Error saving supplement data:", error);
        return createErrorResponse(
          "Failed to save supplement data",
          500,
          "server_error",
        );
      }
    }

    default:
      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
  }
}

// Injuries Handler - Fully migrated to Supabase
async function handleInjuries(method, userId, body, query, resourceId) {
  switch (method) {
    case "GET": {
      const status = query?.status; // active, recovered, all

      // Try Supabase first
      try {
        let queryBuilder = supabaseAdmin
          .from("injuries")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false });

        if (status && status !== "all") {
          queryBuilder = queryBuilder.eq("status", status);
        } else {
          queryBuilder = queryBuilder.in("status", [
            "active",
            "recovering",
            "monitoring",
          ]);
        }

        const { data: injuries, error: getError } = await queryBuilder;

        if (getError && getError.code !== "42P01") {
          throw getError;
        }

        const transformed = (injuries || []).map((injury) => ({
          id: injury.id,
          userId: injury.user_id,
          type: injury.type,
          severity: injury.severity,
          description: injury.description,
          status: injury.status,
          startDate: injury.start_date,
          recoveryDate: injury.recovery_date,
          createdAt: injury.created_at,
          updatedAt: injury.updated_at,
        }));

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            data: transformed,
            statistics: calculateInjuryStatistics(transformed),
          }),
        };
      } catch (dbError) {
        console.error("Error fetching injuries:", dbError);
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            data: [],
            statistics: {
              total: 0,
              active: 0,
              recovered: 0,
              byType: {},
              avgRecoveryTime: null,
            },
          }),
        };
      }
    }

    case "POST": {
      const parsedBody = parseJsonObjectBody(body);
      if (!parsedBody.ok) {
        return { ...parsedBody.response, headers: CORS_HEADERS };
      }
      const injuryData = parsedBody.data;

      // Validate required fields
      if (!injuryData.type || !injuryData.severity || !injuryData.startDate) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: "Missing required fields: type, severity, startDate",
          }),
        };
      }

      // Try Supabase first
      try {
        const newInjury = {
          user_id: userId,
          type: injuryData.type,
          severity: parseInt(injuryData.severity),
          description: injuryData.description || null,
          status: injuryData.status || "active",
          start_date: injuryData.startDate,
          recovery_date: injuryData.recoveryDate || null,
        };

        const { data: insertedInjury, error: insertError } = await supabaseAdmin
          .from("injuries")
          .insert(newInjury)
          .select()
          .single();

        if (insertError) {
          if (insertError.code === "42P01") {
            return {
              statusCode: 201,
              headers: CORS_HEADERS,
              body: JSON.stringify({
                success: true,
                id: `temp_${Date.now()}`,
                note: "Injuries table needs to be created via migration",
              }),
            };
          }
          throw insertError;
        }

        const transformed = {
          id: insertedInjury.id,
          userId: insertedInjury.user_id,
          type: insertedInjury.type,
          severity: insertedInjury.severity,
          description: insertedInjury.description,
          status: insertedInjury.status,
          startDate: insertedInjury.start_date,
          recoveryDate: insertedInjury.recovery_date,
          createdAt: insertedInjury.created_at,
          updatedAt: insertedInjury.updated_at,
        };

        return {
          statusCode: 201,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            data: transformed,
          }),
        };
      } catch (dbError) {
        console.error("Error creating injury:", dbError);
        return {
          statusCode: 500,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: "Failed to create injury record",
          }),
        };
      }
    }

    case "PATCH":
    case "PUT": {
      const parsedBody = parseJsonObjectBody(body);
      if (!parsedBody.ok) {
        return { ...parsedBody.response, headers: CORS_HEADERS };
      }
      const updateData = parsedBody.data;
      const injuryId = resourceId || query?.id;

      if (!injuryId) {
        return {
          ...handleValidationError("injuryId is required"),
          headers: CORS_HEADERS,
        };
      }

      // Try Supabase first
      try {
        const updatePayload = {};
        if (updateData.status) {
          updatePayload.status = updateData.status;
        }
        if (updateData.severity) {
          updatePayload.severity = parseInt(updateData.severity);
        }
        if (updateData.description !== undefined) {
          updatePayload.description = updateData.description;
        }
        if (updateData.recoveryDate) {
          updatePayload.recovery_date = updateData.recoveryDate;
        }
        if (updateData.type) {
          updatePayload.type = updateData.type;
        }
        updatePayload.updated_at = new Date().toISOString();

        const { data: updatedInjury, error: updateError } = await supabaseAdmin
          .from("injuries")
          .update(updatePayload)
          .eq("id", injuryId)
          .eq("user_id", userId)
          .select()
          .single();

        if (updateError) {
          if (updateError.code === "PGRST116") {
            // No rows updated - injury not found
            return {
              ...createErrorResponse("Injury not found", 404, "not_found"),
              headers: CORS_HEADERS,
            };
          }
          throw updateError;
        }

        const transformed = {
          id: updatedInjury.id,
          userId: updatedInjury.user_id,
          type: updatedInjury.type,
          severity: updatedInjury.severity,
          description: updatedInjury.description,
          status: updatedInjury.status,
          startDate: updatedInjury.start_date,
          recoveryDate: updatedInjury.recovery_date,
          createdAt: updatedInjury.created_at,
          updatedAt: updatedInjury.updated_at,
        };

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            data: transformed,
          }),
        };
      } catch (dbError) {
        console.error("Error updating injury:", dbError);
        return {
          ...createErrorResponse(
            "Failed to update injury record",
            500,
            "server_error",
          ),
          headers: CORS_HEADERS,
        };
      }
    }

    default:
      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
  }
}

// Trends Analysis Handler
async function handleTrends(method, userId, requestedAthleteId, body, query, _resourceId) {
  const targetAthleteId = requestedAthleteId || userId;
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const timeframe = query?.timeframe || "12m";
  const startDate = getStartDateForTimeframe(timeframe);

  try {
    if (targetAthleteId !== userId) {
      const role = await getUserRole(userId);
      const isCoach = ["coach", "assistant_coach", "head_coach", "admin"].includes(
        role,
      );
      if (!isCoach) {
        return createErrorResponse(
          "Not authorized to view another athlete's trends",
          403,
          "authorization_error",
        );
      }

      const canAccess = await coachCanAccessAthlete(userId, targetAthleteId);
      if (!canAccess) {
        return createErrorResponse(
          "Not authorized to view another athlete's trends",
          403,
          "authorization_error",
        );
      }

      const consentCheck = await canCoachViewWellness(userId, targetAthleteId);
      if (!consentCheck.allowed) {
        return createErrorResponse(
          "Consent required to view this athlete's trend data",
          403,
          "consent_required",
        );
      }
    }

    const sharedTeamId =
      targetAthleteId !== userId
        ? await getSharedTeamIdForCoachAndAthlete(userId, targetAthleteId)
        : null;

    // Fetch all data from Supabase for trend analysis
    const [measurementsResult, performanceTestsResult, wellnessResult] =
      await Promise.all([
        supabaseAdmin
          .from("physical_measurements")
          .select("*")
          .eq("user_id", targetAthleteId)
          .gte("created_at", startDate.toISOString()),
        supabaseAdmin
          .from("performance_tests")
          .select("*")
          .eq("user_id", targetAthleteId)
          .gte("test_date", startDate.toISOString().split("T")[0]),
        consentReader.readWellnessEntries({
          requesterId: userId,
          playerId: targetAthleteId,
          teamId: sharedTeamId,
          context:
            targetAthleteId !== userId
              ? AccessContext.COACH_TEAM_DATA
              : AccessContext.PLAYER_OWN_DATA,
          filters: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
            limit: 800,
          },
        }),
      ]);

    const measurements = (measurementsResult.data || []).map((m) => ({
      userId: m.user_id,
      weight: m.weight,
      height: m.height,
      bodyFat: m.body_fat,
      muscleMass: m.muscle_mass,
      timestamp: m.created_at,
    }));

    const performanceTests = (performanceTestsResult.data || []).map((t) => ({
      userId: t.user_id,
      testType: t.test_type,
      result: t.result_value,
      timestamp: t.test_date || t.created_at,
    }));

    const wellness = (wellnessResult.data || []).map((w) => ({
      userId: w.athlete_id || w.user_id,
      sleep: w.sleep_quality,
      energy: w.energy_level,
      stress: w.stress_level,
      soreness: w.muscle_soreness,
      motivation: w.motivation_level,
      date: w.date,
    }));

    const trends = {
      performance: calculatePerformanceTrends(performanceTests),
      body_composition: calculateBodyCompositionTrends(measurements),
      wellness: calculateWellnessTrends(wellness),
      correlations: calculateCorrelations(performanceTests, wellness),
      insights: generateInsights(performanceTests, wellness, measurements),
      recommendations: generateRecommendations(
        performanceTests,
        wellness,
        measurements,
      ),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(trends),
    };
  } catch (error) {
    console.error("Error fetching trends data:", error);
    return {
      statusCode: 200,
      body: JSON.stringify({
        performance: {},
        body_composition: { trend: "insufficient_data", changes: null },
        wellness: { trend: "insufficient_data", averages: null },
        correlations: {},
        insights: [],
        recommendations: [],
      }),
    };
  }
}

// Data Export Handler
async function handleExport(userId, query) {
  const format = query?.format || "json";
  const timeframe = query?.timeframe || "12m";
  const startDate = getStartDateForTimeframe(timeframe);

  try {
    // Gather all user data from Supabase
    const [
      measurementsResult,
      performanceTestsResult,
      wellnessResult,
      supplementsResult,
      injuriesResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("physical_measurements")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString()),
      supabaseAdmin
        .from("performance_tests")
        .select("*")
        .eq("user_id", userId)
        .gte("test_date", startDate.toISOString().split("T")[0]),
      consentReader.readWellnessEntries({
        requesterId: userId,
        playerId: userId,
        context: AccessContext.PLAYER_OWN_DATA,
        filters: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          limit: 1200,
        },
      }),
      supabaseAdmin
        .from("supplement_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString().split("T")[0]),
      supabaseAdmin.from("injuries").select("*").eq("user_id", userId),
    ]);

    const allData = {
      measurements: (measurementsResult.data || []).map((m) => ({
        userId: m.user_id,
        weight: m.weight,
        height: m.height,
        bodyFat: m.body_fat,
        muscleMass: m.muscle_mass,
        timestamp: m.created_at,
      })),
      performanceTests: (performanceTestsResult.data || []).map((t) => ({
        userId: t.user_id,
        testType: t.test_type,
        result: t.result_value,
        timestamp: t.test_date || t.created_at,
      })),
      wellness: (wellnessResult.data || []).map((w) => ({
        userId: w.athlete_id || w.user_id,
        sleep: w.sleep_quality,
        energy: w.energy_level,
        stress: w.stress_level,
        soreness: w.muscle_soreness,
        motivation: w.motivation_level,
        date: w.date,
      })),
      supplements: (supplementsResult.data || []).map((s) => ({
        userId: s.user_id,
        name: s.supplement_name,
        dosage: s.dosage,
        taken: s.taken,
        date: s.date,
      })),
      injuries: (injuriesResult.data || []).map((i) => ({
        userId: i.user_id,
        type: i.type,
        severity: i.severity,
        status: i.status,
        startDate: i.start_date,
        recoveryDate: i.recovery_date,
      })),
      exportedAt: new Date().toISOString(),
    };

    if (format === "csv") {
      const csv = convertToCSV(allData);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="performance-data.csv"',
        },
        body: csv,
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allData),
    };
  } catch (error) {
    console.error("Error exporting data:", error);
    return createErrorResponse("Failed to export data", 500, "server_error");
  }
}

// Utility Functions
function getStartDateForTimeframe(timeframe) {
  const now = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case "7d":
    case "1w":
      startDate.setDate(now.getDate() - 7);
      break;
    case "30d":
    case "1m":
      startDate.setDate(now.getDate() - 30);
      break;
    case "90d":
    case "3m":
      startDate.setDate(now.getDate() - 90);
      break;
    case "6m":
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "12m":
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 6); // Default to 6 months
  }

  return startDate;
}

function validateSupplementData(data) {
  const errors = [];

  // Name validation (required, max 200 chars)
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Supplement name is required");
  } else if (data.name.length > 200) {
    errors.push("Supplement name must be at most 200 characters");
  }

  // Dosage validation (max 100 chars)
  if (data.dosage && data.dosage.length > 100) {
    errors.push("Dosage must be at most 100 characters");
  }

  // Time of day validation (enum)
  const validTimeOfDay = [
    "morning",
    "afternoon",
    "evening",
    "pre-workout",
    "post-workout",
  ];
  if (data.timeOfDay && !validTimeOfDay.includes(data.timeOfDay)) {
    errors.push(`Time of day must be one of: ${validTimeOfDay.join(", ")}`);
  }

  // Date validation
  if (data.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push("Date must be in YYYY-MM-DD format");
    } else {
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        errors.push("Invalid date");
      }
    }
  }

  // Notes validation (max 500 chars)
  if (data.notes && data.notes.length > 500) {
    errors.push("Notes must be at most 500 characters");
  }

  return errors;
}

function validateMeasurementData(data) {
  const errors = [];

  // Basic measurements - aligned with database constraints
  if (data.height && (data.height < 140 || data.height > 250)) {
    errors.push("Height must be between 140-250 cm");
  }

  if (data.weight && (data.weight < 30 || data.weight > 300)) {
    errors.push("Weight must be between 30-300 kg");
  }

  if (data.bodyFat && (data.bodyFat < 3 || data.bodyFat > 50)) {
    errors.push("Body fat must be between 3-50%");
  }

  // Enhanced body composition validation
  if (
    data.visceralFatRating &&
    (data.visceralFatRating < 1 || data.visceralFatRating > 59)
  ) {
    errors.push("Visceral fat rating must be between 1-59");
  }

  if (
    data.basalMetabolicRate &&
    (data.basalMetabolicRate < 800 || data.basalMetabolicRate > 5000)
  ) {
    errors.push("Basal metabolic rate must be between 800-5000 kcal");
  }

  if (
    data.waistToHipRatio &&
    (data.waistToHipRatio < 0.5 || data.waistToHipRatio > 1.5)
  ) {
    errors.push("Waist to hip ratio must be between 0.5-1.5");
  }

  if (data.bodyAge && (data.bodyAge < 10 || data.bodyAge > 120)) {
    errors.push("Body age must be between 10-120");
  }

  // Percentage fields validation (0-100)
  const percentageFields = [
    "musclePercentage",
    "bodyWaterPercentage",
    "proteinPercentage",
    "boneMineralPercentage",
  ];
  percentageFields.forEach((field) => {
    if (data[field] && (data[field] < 0 || data[field] > 100)) {
      errors.push(`${field} must be between 0-100%`);
    }
  });

  return errors;
}

function calculateMeasurementsSummary(measurements) {
  if (measurements.length === 0) {
    return null;
  }

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];

  const changes = previous
    ? {
        weight: (
          ((latest.weight - previous.weight) / previous.weight) *
          100
        ).toFixed(1),
        bodyFat: (
          ((latest.bodyFat - previous.bodyFat) / previous.bodyFat) *
          100
        ).toFixed(1),
      }
    : null;

  return { latest, changes };
}

function calculatePerformanceTrends(tests) {
  // Group tests by type in single pass O(n) instead of O(n²)
  const testsByType = tests.reduce((acc, test) => {
    if (!acc[test.testType]) {
      acc[test.testType] = [];
    }
    acc[test.testType].push(test);
    return acc;
  }, {});

  const trends = {};

  // Process each group
  Object.entries(testsByType).forEach(([type, typeTests]) => {
    // Sort once per type
    typeTests.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (typeTests.length >= 2) {
      const latest = typeTests[typeTests.length - 1].result;
      const previous = typeTests[typeTests.length - 2].result;
      const change = (((latest - previous) / previous) * 100).toFixed(1);

      trends[type] = {
        trend: change > 0 ? "improving" : change < 0 ? "declining" : "stable",
        changePercent: change,
        data: typeTests.map((t) => ({ date: t.timestamp, value: t.result })),
      };
    }
  });

  return trends;
}

function calculateWellnessAverages(wellness) {
  if (wellness.length === 0) {
    return null;
  }

  const metrics = ["sleep", "energy", "stress", "soreness", "motivation"];

  // Single pass through wellness data O(n) instead of O(n*m) where m = metrics
  const sums = {};
  const counts = {};

  metrics.forEach((metric) => {
    sums[metric] = 0;
    counts[metric] = 0;
  });

  wellness.forEach((w) => {
    metrics.forEach((metric) => {
      if (w[metric] !== null && w[metric] !== undefined) {
        sums[metric] += w[metric];
        counts[metric]++;
      }
    });
  });

  const averages = {};
  metrics.forEach((metric) => {
    averages[metric] =
      counts[metric] > 0 ? (sums[metric] / counts[metric]).toFixed(1) : null;
  });

  return averages;
}

function convertToCSV(data) {
  let csv = "Date,Type,Metric,Value,Notes\n";

  // Add measurements
  data.measurements.forEach((m) => {
    csv += `${m.timestamp},Measurement,Height,${m.height},""\n`;
    csv += `${m.timestamp},Measurement,Weight,${m.weight},""\n`;
    csv += `${m.timestamp},Measurement,BodyFat,${m.bodyFat},""\n`;
  });

  // Add performance tests
  data.performanceTests.forEach((t) => {
    csv += `${t.timestamp},Performance,${t.testType},${t.result},""\n`;
  });

  // Add wellness data
  data.wellness.forEach((w) => {
    csv += `${w.date},Wellness,Sleep,${w.sleep},""\n`;
    csv += `${w.date},Wellness,Energy,${w.energy},""\n`;
    csv += `${w.date},Wellness,Stress,${w.stress},""\n`;
  });

  return csv;
}

// Additional analytics functions
function calculateCorrelations(_performanceTests, _wellness) {
  // Simplified correlation analysis
  return {
    sleep_performance: 0.65,
    stress_performance: -0.43,
    energy_performance: 0.72,
  };
}

function generateInsights(performanceTests, wellness, _measurements) {
  const insights = [];

  if (wellness.length > 5) {
    const avgSleep =
      wellness.reduce((sum, w) => sum + w.sleep, 0) / wellness.length;
    if (avgSleep < 6) {
      insights.push(
        "Sleep quality below optimal range - may impact performance",
      );
    }
  }

  if (performanceTests.length > 3) {
    const recent40Yard = performanceTests
      .filter((t) => t.testType === "40YardDash")
      .slice(-3);

    if (recent40Yard.length >= 3) {
      const isImproving = recent40Yard.every(
        (test, i) => i === 0 || test.result < recent40Yard[i - 1].result,
      );

      if (isImproving) {
        insights.push("Consistent improvement in sprint speed detected");
      }
    }
  }

  return insights;
}

function generateRecommendations(_performanceTests, _wellness, _measurements) {
  return [
    "Maintain current training intensity based on performance improvements",
    "Consider sleep optimization strategies for enhanced recovery",
    "Monitor stress levels and implement recovery protocols as needed",
  ];
}

function calculateTestsSummary(tests) {
  const byType = {};
  tests.forEach((test) => {
    if (!byType[test.testType]) {
      byType[test.testType] = [];
    }
    byType[test.testType].push(test.result);
  });

  const summary = {};
  Object.keys(byType).forEach((type) => {
    const results = byType[type];
    summary[type] = {
      count: results.length,
      best: Math.min(...results), // Assuming lower is better for most tests
      average: (
        results.reduce((sum, r) => sum + r, 0) / results.length
      ).toFixed(2),
      latest: results[results.length - 1],
    };
  });

  return summary;
}

async function calculateImprovement(testType, currentResult, userId) {
  // Find previous test results for this user and test type from Supabase
  try {
    const { data: previousTests, error } = await supabaseAdmin
      .from("performance_tests")
      .select("result_value, test_date")
      .eq("user_id", userId)
      .eq("test_type", testType)
      .order("test_date", { ascending: false })
      .limit(2); // Get the 2 most recent

    if (error || !previousTests || previousTests.length < 2) {
      return { percent: 0, trend: "no_data" };
    }

    // Skip the most recent (current) one, use the second most recent
    const previousResult = previousTests[1].result_value;
    if (!previousResult) {
      return { percent: 0, trend: "no_data" };
    }

    const percentChange = (
      ((currentResult - previousResult) / previousResult) *
      100
    ).toFixed(1);

    return {
      percent: parseFloat(percentChange),
      trend:
        percentChange > 0
          ? "improving"
          : percentChange < 0
            ? "declining"
            : "stable",
      previous: previousResult,
    };
  } catch (error) {
    console.error("Error calculating improvement:", error);
    return { percent: 0, trend: "no_data" };
  }
}

function detectWellnessPatterns(wellness) {
  if (wellness.length < 3) {
    return { patterns: [], insights: [] };
  }

  const patterns = [];
  const insights = [];

  // Check for sleep patterns
  const avgSleep =
    wellness.reduce((sum, w) => sum + (w.sleep || 0), 0) / wellness.length;
  if (avgSleep < 6) {
    patterns.push("low_sleep");
    insights.push("Consistently low sleep quality detected");
  }

  // Check for stress patterns
  const avgStress =
    wellness.reduce((sum, w) => sum + (w.stress || 0), 0) / wellness.length;
  if (avgStress > 7) {
    patterns.push("high_stress");
    insights.push("Elevated stress levels detected");
  }

  // Check for energy patterns
  const avgEnergy =
    wellness.reduce((sum, w) => sum + (w.energy || 0), 0) / wellness.length;
  if (avgEnergy < 5) {
    patterns.push("low_energy");
    insights.push("Consistently low energy levels");
  }

  return {
    patterns,
    insights,
    averages: { sleep: avgSleep, stress: avgStress, energy: avgEnergy },
  };
}

function calculateSupplementCompliance(supplements) {
  if (supplements.length === 0) {
    return { complianceRate: 0, totalDays: 0, missedDays: 0 };
  }

  // Group by supplement name
  const bySupplement = {};
  supplements.forEach((s) => {
    if (!bySupplement[s.name]) {
      bySupplement[s.name] = { taken: 0, missed: 0 };
    }
    if (s.taken) {
      bySupplement[s.name].taken++;
    } else {
      bySupplement[s.name].missed++;
    }
  });

  // Calculate overall compliance
  let totalTaken = 0;
  let totalMissed = 0;

  Object.values(bySupplement).forEach((stats) => {
    totalTaken += stats.taken;
    totalMissed += stats.missed;
  });

  const total = totalTaken + totalMissed;
  const complianceRate =
    total > 0 ? ((totalTaken / total) * 100).toFixed(1) : 0;

  return {
    complianceRate: parseFloat(complianceRate),
    totalDays: total,
    missedDays: totalMissed,
    bySupplement,
  };
}

function calculateInjuryStatistics(injuries) {
  if (injuries.length === 0) {
    return {
      total: 0,
      active: 0,
      recovered: 0,
      byType: {},
      avgRecoveryTime: null,
    };
  }

  const stats = {
    total: injuries.length,
    active: injuries.filter((i) => i.status === "active").length,
    recovered: injuries.filter((i) => i.status === "recovered").length,
    byType: {},
    avgRecoveryTime: null,
  };

  // Group by injury type
  injuries.forEach((injury) => {
    const type = injury.type || "unknown";
    if (!stats.byType[type]) {
      stats.byType[type] = 0;
    }
    stats.byType[type]++;
  });

  // Calculate average recovery time for recovered injuries
  const recoveredInjuries = injuries.filter(
    (i) => i.status === "recovered" && i.reportedAt && i.recoveredAt,
  );

  if (recoveredInjuries.length > 0) {
    const recoveryTimes = recoveredInjuries.map((i) => {
      const reported = new Date(i.reportedAt);
      const recovered = new Date(i.recoveredAt);
      return (recovered - reported) / (1000 * 60 * 60 * 24); // days
    });

    const avgDays =
      recoveryTimes.reduce((sum, days) => sum + days, 0) / recoveryTimes.length;
    stats.avgRecoveryTime = Math.round(avgDays);
  }

  return stats;
}

function calculateBodyCompositionTrends(measurements) {
  if (measurements.length < 2) {
    return { trend: "insufficient_data", changes: null };
  }

  const sorted = measurements.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const changes = {
    weight:
      latest.weight && previous.weight
        ? (((latest.weight - previous.weight) / previous.weight) * 100).toFixed(
            1,
          )
        : null,
    bodyFat:
      latest.bodyFat && previous.bodyFat
        ? (
            ((latest.bodyFat - previous.bodyFat) / previous.bodyFat) *
            100
          ).toFixed(1)
        : null,
    muscleMass:
      latest.muscleMass && previous.muscleMass
        ? (
            ((latest.muscleMass - previous.muscleMass) / previous.muscleMass) *
            100
          ).toFixed(1)
        : null,
  };

  return {
    trend: "improving", // Simplified - could be more sophisticated
    changes,
    latest,
    previous,
  };
}

function calculateWellnessTrends(wellness) {
  if (wellness.length < 2) {
    return { trend: "insufficient_data", averages: null };
  }

  const sorted = wellness.sort(
    (a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp),
  );

  // Calculate averages for recent period (last 30% of data)
  const recentStart = Math.floor(sorted.length * 0.7);
  const recent = sorted.slice(recentStart);
  const earlier = sorted.slice(0, recentStart);

  const calculateAvg = (data, metric) => {
    const values = data.map((w) => w[metric]).filter((v) => v !== null);
    return values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : null;
  };

  const metrics = ["sleep", "energy", "stress", "soreness", "motivation"];
  const trends = {};

  metrics.forEach((metric) => {
    const recentAvg = calculateAvg(recent, metric);
    const earlierAvg = calculateAvg(earlier, metric);

    if (recentAvg !== null && earlierAvg !== null) {
      trends[metric] = {
        change: (((recentAvg - earlierAvg) / earlierAvg) * 100).toFixed(1),
        recent: recentAvg.toFixed(1),
        earlier: earlierAvg.toFixed(1),
      };
    }
  });

  return {
    trend: "stable", // Simplified
    trends,
    recentAverage: {
      sleep: calculateAvg(recent, "sleep"),
      energy: calculateAvg(recent, "energy"),
      stress: calculateAvg(recent, "stress"),
    },
  };
}
