import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse, ErrorType } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { supabaseAdmin } from "./supabase-client.js";
import { ConsentDataReader, AccessContext } from "./utils/consent-data-reader.js";
import { NUTRITION_ACCESS_ROLES } from "./utils/role-sets.js";

// Netlify Function: Staff Nutritionist API
// Handles nutritionist dashboard data: athlete nutrition profiles, body composition, supplements
const consentReader = new ConsentDataReader(supabaseAdmin);

/**
 * Verify user is a staff member with nutritionist role
 */
async function verifyNutritionistAccess(userId) {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("role, team_id")
    .eq("user_id", userId)
    .in("role", NUTRITION_ACCESS_ROLES)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return member;
}

async function verifyAthleteOnTeam(teamId, athleteId) {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", athleteId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return !!member;
}

/**
 * Get team athletes with nutrition data
 */
async function getAthleteNutritionOverview(teamId, requesterId) {
  // Get team members who are players
  const { data: members, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select(
      `
      user_id,
      users:user_id (
        id,
        full_name,
        position,
        avatar_url
      )
    `,
    )
    .eq("team_id", teamId)
    .eq("role", "player");

  if (membersError) {
    throw membersError;
  }

  const athletes = [];

  for (const member of members || []) {
    const userId = member.user_id;
    const user = member.users;

    if (!user) {
      continue;
    }

    // Get nutrition profile
    const { data: nutritionProfile } = await supabaseAdmin
      .from("athlete_nutrition_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    // Get latest physical measurements
    const { data: measurements } = await supabaseAdmin
      .from("physical_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get recent wellness entry for hydration
    const wellnessResult = await consentReader.readWellnessEntries({
      requesterId,
      playerId: userId,
      teamId,
      context: AccessContext.COACH_TEAM_DATA,
      filters: { limit: 1 },
    });
    const wellness = wellnessResult.success ? (wellnessResult.data || [])[0] : null;

    // Get recent supplement logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: supplementLogs } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    // Calculate supplement compliance
    const supplementCompliance = calculateSupplementCompliance(supplementLogs);

    athletes.push({
      id: user.id,
      name: user.full_name || "Unknown",
      position: user.position || "N/A",
      avatarUrl: user.avatar_url,
      weight: measurements?.weight || nutritionProfile?.weight_kg || null,
      bodyFat:
        measurements?.body_fat ||
        nutritionProfile?.body_fat_percentage ||
        null,
      leanMass:
        measurements?.muscle_mass || nutritionProfile?.lean_mass_kg || null,
      hydrationStatus: getHydrationStatus(wellness?.hydration_level),
      supplementCompliance,
      dailyCalories: nutritionProfile?.tdee_kcal || null,
      proteinTarget: nutritionProfile?.protein_target_g || null,
      lastUpdated:
        measurements?.created_at || nutritionProfile?.updated_at || null,
    });
  }

  return athletes;
}

/**
 * Get body composition trends for an athlete
 */
async function getBodyCompositionTrends(userId, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from("physical_measurements")
    // physical_measurements columns are weight/body_fat/muscle_mass (+ created_at
    // as the measurement timestamp) — NOT the *_kg / *_percentage / measurement_date
    // names this function used, which 400'd the query and 500'd the /trends lane.
    .select("created_at, weight, body_fat, muscle_mass")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((m) => ({
    date: m.created_at,
    weight: m.weight,
    bodyFat: m.body_fat,
    leanMass: m.muscle_mass,
  }));
}

/**
 * Get supplement compliance details for team
 */
async function getTeamSupplementCompliance(teamId) {
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("user_id, users:user_id(full_name)")
    .eq("team_id", teamId)
    .eq("role", "player");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const compliance = [];

  for (const member of members || []) {
    const { data: logs } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", member.user_id)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

    const { data: supplements } = await supabaseAdmin
      .from("user_supplements")
      .select("supplement_name")
      .eq("user_id", member.user_id)
      .eq("is_active", true);

    const totalSupplements = supplements?.length || 0;
    const takenCount = logs?.filter((l) => l.taken)?.length || 0;
    const expectedDoses = totalSupplements * 7; // 7 days

    compliance.push({
      athleteId: member.user_id,
      athleteName: member.users?.full_name || "Unknown",
      supplements: supplements?.map((s) => s.supplement_name) || [],
      compliance:
        expectedDoses > 0 ? Math.round((takenCount / expectedDoses) * 100) : 0,
      takenCount,
      missedCount: Math.max(0, expectedDoses - takenCount),
    });
  }

  return compliance;
}

/**
 * Get hydration summary for team
 */
async function getTeamHydrationSummary(teamId, requesterId) {
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("role", "player");

  const userIds = members?.map((m) => m.user_id) || [];
  if (userIds.length === 0) {
    return { adequate: 0, warning: 0, critical: 0 };
  }

  const entriesByAthlete = await Promise.all(
    userIds.map(async (athleteId) => {
      const result = await consentReader.readWellnessEntries({
        requesterId,
        playerId: athleteId,
        teamId,
        context: AccessContext.COACH_TEAM_DATA,
        filters: { limit: 1 },
      });
      if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
        return null;
      }
      return result.data[0];
    }),
  );
  const wellness = entriesByAthlete.filter(Boolean);

  const hydrationMap = new Map();
  for (const entry of wellness || []) {
    const id = entry.user_id || entry.athlete_id;
    if (!hydrationMap.has(id) || entry.date > hydrationMap.get(id).date) {
      hydrationMap.set(id, entry);
    }
  }

  let adequate = 0,
    warning = 0,
    critical = 0;
  for (const [, entry] of hydrationMap) {
    const level = entry.hydration_level || 5;
    if (level >= 7) {
      adequate++;
    } else if (level >= 4) {
      warning++;
    } else {
      critical++;
    }
  }

  return { adequate, warning, critical };
}

/**
 * Generate nutrition report for athlete
 */
async function generateNutritionReport(userId, reportType = "weekly") {
  const days = reportType === "weekly" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get nutrition profile
  const { data: profile } = await supabaseAdmin
    .from("athlete_nutrition_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get physical measurements trend
  const { data: measurements } = await supabaseAdmin
    .from("physical_measurements")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Get supplement logs
  const { data: supplements } = await supabaseAdmin
    .from("supplement_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  // Get hydration logs (canonical: athlete_hydration_logs)
  const { data: hydration } = await supabaseAdmin
    .from("athlete_hydration_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_at", startDate.toISOString().split("T")[0]);

  // Calculate metrics
  const supplementsTaken = supplements?.filter((s) => s.taken)?.length || 0;
  const supplementsExpected = supplements?.length || 0;

  const avgHydration = hydration?.length
    ? hydration.reduce((sum, h) => sum + (h.amount_ml || 0), 0) /
      hydration.length
    : 0;

  const weightChange =
    measurements?.length >= 2
      ? measurements[measurements.length - 1].weight -
        measurements[0].weight
      : 0;

  return {
    period: reportType,
    startDate: startDate.toISOString(),
    endDate: new Date().toISOString(),
    profile: profile || {},
    metrics: {
      currentWeight:
        measurements?.[measurements.length - 1]?.weight ||
        profile?.weight_kg,
      weightChange,
      bodyFatChange:
        measurements?.length >= 2
          ? (measurements[measurements.length - 1].body_fat || 0) -
            (measurements[0].body_fat || 0)
          : 0,
      supplementCompliance:
        supplementsExpected > 0
          ? Math.round((supplementsTaken / supplementsExpected) * 100)
          : 0,
      avgDailyHydration: Math.round(avgHydration),
    },
    recommendations: generateRecommendations(
      profile,
      weightChange,
      avgHydration,
    ),
  };
}

// Helper functions
function calculateSupplementCompliance(logs) {
  if (!logs || logs.length === 0) {
    return 0;
  }
  const taken = logs.filter((l) => l.taken).length;
  return Math.round((taken / logs.length) * 100);
}

function getHydrationStatus(level) {
  if (!level) {
    return "unknown";
  }
  if (level >= 7) {
    return "adequate";
  }
  if (level >= 4) {
    return "warning";
  }
  return "critical";
}

function generateRecommendations(profile, weightChange, avgHydration) {
  const recommendations = [];

  if (avgHydration < 2000) {
    recommendations.push({
      type: "hydration",
      priority: "high",
      message: "Increase daily fluid intake to at least 2-3 liters",
    });
  }

  if (profile?.primary_goal === "weight_loss" && weightChange > 0) {
    recommendations.push({
      type: "nutrition",
      priority: "medium",
      message: "Review caloric intake - weight trending up against goal",
    });
  }

  if (profile?.primary_goal === "muscle_gain" && weightChange < 0) {
    recommendations.push({
      type: "nutrition",
      priority: "medium",
      message:
        "Consider increasing protein and overall calories for muscle gain",
    });
  }

  return recommendations;
}

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

// Main handler
async function handleRequest(event, _context, { userId }) {
    const path = event.path.replace(
      "/.netlify/functions/staff-nutritionist",
      "",
    );
    const method = event.httpMethod;

    // Verify nutritionist access
    const access = await verifyNutritionistAccess(userId);
    if (!access) {
      return createErrorResponse(
        403,
        "Access denied. Nutritionist role required.",
      );
    }

    const teamId = access.team_id;

    // GET /athletes - Get all athletes with nutrition data
    if (
      method === "GET" &&
      (path === "" || path === "/" || path === "/athletes")
    ) {
      const athletes = await getAthleteNutritionOverview(teamId, userId);
      return createSuccessResponse({ athletes });
    }

    // GET /athletes/:id/trends - Get body composition trends
    if (method === "GET" && path.match(/^\/athletes\/[\w-]+\/trends$/)) {
      const athleteId = path.split("/")[2];
      let days;
      try {
        days = parseBoundedInt(event.queryStringParameters?.days, 90, {
          min: 1,
          max: 365,
          field: "days",
        });
      } catch (validationError) {
        return createErrorResponse(
          validationError.message || "days must be an integer between 1 and 365",
          422,
          "validation_error",
        );
      }
      const canAccessAthlete = await verifyAthleteOnTeam(teamId, athleteId);
      if (!canAccessAthlete) {
        return createErrorResponse(
          "Access denied to athlete data",
          403,
          ErrorType.AUTHORIZATION,
        );
      }
      const trends = await getBodyCompositionTrends(athleteId, days);
      return createSuccessResponse({ trends });
    }

    // GET /supplements - Get team supplement compliance
    if (method === "GET" && path === "/supplements") {
      const compliance = await getTeamSupplementCompliance(teamId);
      return createSuccessResponse({ compliance });
    }

    // GET /hydration - Get team hydration summary
    if (method === "GET" && path === "/hydration") {
      const summary = await getTeamHydrationSummary(teamId, userId);
      return createSuccessResponse({ summary });
    }

    // POST /reports/:athleteId - Generate nutrition report
    if (method === "POST" && path.match(/^\/reports\/[\w-]+$/)) {
      const athleteId = path.split("/")[2];
      let body = {};
      try {
        body = parseJsonObjectBody(event.body);
      } catch (error) {
        const isObjectError = error.message === "Request body must be an object";
        return createErrorResponse(
          isObjectError ? error.message : "Invalid JSON in request body",
          isObjectError ? 422 : 400,
          isObjectError ? "validation_error" : "invalid_json",
        );
      }
      const reportType = body.type || "weekly";
      if (!["weekly", "monthly"].includes(reportType)) {
        return createErrorResponse(
          "type must be one of: weekly, monthly",
          422,
          "validation_error",
        );
      }
      const canAccessAthlete = await verifyAthleteOnTeam(teamId, athleteId);
      if (!canAccessAthlete) {
        return createErrorResponse(
          "Access denied to athlete data",
          403,
          ErrorType.AUTHORIZATION,
        );
      }
      const report = await generateNutritionReport(athleteId, reportType);
      // Persist so the athlete can read it in their Reports screen (staff→athlete
      // loop). Best-effort: a storage hiccup shouldn't fail the generation itself.
      let reportId = null;
      try {
        const { data: saved } = await supabaseAdmin
          .from("nutrition_reports")
          .insert({
            user_id: athleteId,
            created_by: userId,
            team_id: teamId,
            report_type: reportType,
            report_data: report,
            period_start: report.startDate ? report.startDate.split("T")[0] : null,
            period_end: report.endDate ? report.endDate.split("T")[0] : null,
          })
          .select("id")
          .single();
        reportId = saved?.id ?? null;
      } catch {
        // swallow — report is still returned to the requester
      }
      return createSuccessResponse({ report, reportId });
    }

    // GET /summary - Dashboard summary
    if (method === "GET" && path === "/summary") {
      const [athletes, hydration, supplements] = await Promise.all([
        getAthleteNutritionOverview(teamId, userId),
        getTeamHydrationSummary(teamId, userId),
        getTeamSupplementCompliance(teamId),
      ]);

      const avgCompliance = supplements.length
        ? Math.round(
            supplements.reduce((sum, s) => sum + s.compliance, 0) /
              supplements.length,
          )
        : 0;

      return createSuccessResponse({
        totalAthletes: athletes.length,
        hydrationStatus: hydration,
        avgSupplementCompliance: avgCompliance,
        athletesNeedingAttention: athletes.filter(
          (a) =>
            a.hydrationStatus === "critical" || a.supplementCompliance < 50,
        ).length,
      });
    }

    return createErrorResponse("Endpoint not found", 404, ErrorType.NOT_FOUND);
}

const handler = async (event, context) => {
  if (event.httpMethod === "GET") {
    return baseHandler(event, context, {
      functionName: "staff-nutritionist",
      allowedMethods: ["GET"],
      rateLimitType: "READ",
      requireAuth: true,
      handler: handleRequest,
    });
  }

  return baseHandler(event, context, {
    functionName: "staff-nutritionist",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: handleRequest,
  });
};

export const testHandler = handler;
export { handler };
