// Netlify Function: Staff Nutritionist API
// Handles nutritionist dashboard data: athlete nutrition profiles, body composition, supplements

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Verify user is a staff member with nutritionist role
 */
async function verifyNutritionistAccess(userId) {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("role, team_id")
    .eq("user_id", userId)
    .in("role", ["nutritionist", "coach", "admin", "staff"])
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return member;
}

/**
 * Get team athletes with nutrition data
 */
async function getAthleteNutritionOverview(teamId) {
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
      .order("measurement_date", { ascending: false })
      .limit(1)
      .single();

    // Get recent wellness entry for hydration
    const { data: wellness } = await supabaseAdmin
      .from("wellness_entries")
      .select("hydration_level, date")
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
      .order("date", { ascending: false })
      .limit(1)
      .single();

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
      weight: measurements?.weight_kg || nutritionProfile?.weight_kg || null,
      bodyFat:
        measurements?.body_fat_percentage ||
        nutritionProfile?.body_fat_percentage ||
        null,
      leanMass:
        measurements?.muscle_mass_kg || nutritionProfile?.lean_mass_kg || null,
      hydrationStatus: getHydrationStatus(wellness?.hydration_level),
      supplementCompliance,
      dailyCalories: nutritionProfile?.tdee_kcal || null,
      proteinTarget: nutritionProfile?.protein_target_g || null,
      lastUpdated:
        measurements?.measurement_date || nutritionProfile?.updated_at || null,
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
    .select("measurement_date, weight_kg, body_fat_percentage, muscle_mass_kg")
    .eq("user_id", userId)
    .gte("measurement_date", startDate.toISOString().split("T")[0])
    .order("measurement_date", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((m) => ({
    date: m.measurement_date,
    weight: m.weight_kg,
    bodyFat: m.body_fat_percentage,
    leanMass: m.muscle_mass_kg,
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
async function getTeamHydrationSummary(teamId) {
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("role", "player");

  const userIds = members?.map((m) => m.user_id) || [];
  if (userIds.length === 0) {
    return { adequate: 0, warning: 0, critical: 0 };
  }

  const { data: wellness } = await supabaseAdmin
    .from("wellness_entries")
    .select("user_id, hydration_level, date")
    .or(
      `user_id.in.(${userIds.join(",")}),athlete_id.in.(${userIds.join(",")})`,
    )
    .gte("date", new Date().toISOString().split("T")[0]);

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
    .gte("measurement_date", startDate.toISOString().split("T")[0])
    .order("measurement_date", { ascending: true });

  // Get supplement logs
  const { data: supplements } = await supabaseAdmin
    .from("supplement_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  // Get hydration logs
  const { data: hydration } = await supabaseAdmin
    .from("hydration_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate.toISOString().split("T")[0]);

  // Calculate metrics
  const supplementsTaken = supplements?.filter((s) => s.taken)?.length || 0;
  const supplementsExpected = supplements?.length || 0;

  const avgHydration = hydration?.length
    ? hydration.reduce((sum, h) => sum + (h.fluid_ml || 0), 0) /
      hydration.length
    : 0;

  const weightChange =
    measurements?.length >= 2
      ? measurements[measurements.length - 1].weight_kg -
        measurements[0].weight_kg
      : 0;

  return {
    period: reportType,
    startDate: startDate.toISOString(),
    endDate: new Date().toISOString(),
    profile: profile || {},
    metrics: {
      currentWeight:
        measurements?.[measurements.length - 1]?.weight_kg ||
        profile?.weight_kg,
      weightChange,
      bodyFatChange:
        measurements?.length >= 2
          ? (measurements[measurements.length - 1].body_fat_percentage || 0) -
            (measurements[0].body_fat_percentage || 0)
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

// Main handler
async function handler(event) {
  return baseHandler(event, async (event, userId) => {
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
      const athletes = await getAthleteNutritionOverview(teamId);
      return createSuccessResponse({ athletes });
    }

    // GET /athletes/:id/trends - Get body composition trends
    if (method === "GET" && path.match(/^\/athletes\/[\w-]+\/trends$/)) {
      const athleteId = path.split("/")[2];
      const days = parseInt(event.queryStringParameters?.days || "90");
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
      const summary = await getTeamHydrationSummary(teamId);
      return createSuccessResponse({ summary });
    }

    // POST /reports/:athleteId - Generate nutrition report
    if (method === "POST" && path.match(/^\/reports\/[\w-]+$/)) {
      const athleteId = path.split("/")[2];
      const body = JSON.parse(event.body || "{}");
      const reportType = body.type || "weekly";
      const report = await generateNutritionReport(athleteId, reportType);
      return createSuccessResponse({ report });
    }

    // GET /summary - Dashboard summary
    if (method === "GET" && path === "/summary") {
      const [athletes, hydration, supplements] = await Promise.all([
        getAthleteNutritionOverview(teamId),
        getTeamHydrationSummary(teamId),
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

    return createErrorResponse(404, "Endpoint not found");
  });
}

module.exports = { handler };
