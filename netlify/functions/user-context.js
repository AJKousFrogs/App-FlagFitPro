
// Netlify Function: User Context API
// Returns comprehensive user context for AI coaching system
// Aggregates: users, injuries, training_sessions, wellness_checkins, supplements_logs

import { baseHandler } from "./utils/base-handler.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { computeAcwrAt } from "./utils/acwr.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.user-context" });

/**
 * Get comprehensive user context
 * GET /api/user/context
 * Returns: body metrics, injuries, role, last 7/28 day loads, active program, team role
 */
async function getUserContext(userId) {
  // Get user basic info (note: role is in team_members, not users)
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select(
      "id, email, full_name, position, height_cm, weight_kg, updated_at",
    )
    .eq("id", userId)
    .single();

  if (userError) {
    if (userError.code === "PGRST116") {
      const notFoundError = new Error("User not found");
      notFoundError.code = "not_found";
      notFoundError.statusCode = 404;
      throw notFoundError;
    }
    logger.error("user_data_fetch_failed", userError);
    throw userError;
  }

    // Injuries, last-28d sessions, latest wellness, recent supplements, and team
    // membership all read by userId (+ constant date windows) and are independent of one
    // another — fetch concurrently (5 sequential round-trips -> 1). ACWR is computed
    // in-memory from the sessions result below.
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const supplementsSince = sevenDaysAgo.toISOString().split("T")[0];

    const [
      { data: injuries, error: injuriesError },
      { data: sessions, error: sessionsError },
      { data: latestWellness, error: wellnessError },
      { data: supplements, error: supplementsError },
      { data: teamMemberships },
    ] = await Promise.all([
      // clinical injuries via the compat view (athlete_injuries -> legacy column shape)
      supabaseAdmin
        .from("v_injuries_unified")
        .select("id, type, severity, occurred_at, status, restrictions")
        .eq("user_id", userId)
        .in("status", ["active", "recovering"])
        .order("occurred_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("training_sessions")
        .select("workload, session_date, completed_at")
        .eq("user_id", userId)
        .gte("completed_at", twentyEightDaysAgo.toISOString())
        .order("completed_at", { ascending: false }),
      supabaseAdmin
        .from("daily_wellness_checkin")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabaseAdmin
        .from("supplement_logs")
        .select("supplement_name, created_at, date, dosage")
        .eq("user_id", userId)
        .gte("date", supplementsSince)
        .order("date", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", userId)
        .limit(1),
    ]);

    if (injuriesError) {
      logger.error("injuries_fetch_failed", injuriesError); // optional
    }
    if (sessionsError) {
      logger.error("sessions_fetch_failed", sessionsError); // optional
    }
    if (wellnessError && wellnessError.code !== "PGRST116") {
      logger.error("wellness_fetch_failed", wellnessError); // optional
    }
    if (supplementsError) {
      logger.error("supplements_fetch_failed", supplementsError); // optional
    }

    // Calculate ACWR (Acute:Chronic Workload Ratio) from the sessions just fetched.
    // CRITICAL: Use null when no data - do not use fake defaults
    let acuteLoad = 0;
    let chronicLoad = 0;
    let acwr = null; // null = no data, not 1.0
    const last7Days = [];

    if (sessions && sessions.length > 0) {
      const last7DaysMap = new Map();
      const last28DaysMap = new Map();

      sessions.forEach((session) => {
        const date = new Date(session.completed_at || session.session_date);
        const dateKey = date.toISOString().split("T")[0];
        const workload = session.workload || 0;
        if (date >= sevenDaysAgo) {
          last7DaysMap.set(dateKey, (last7DaysMap.get(dateKey) || 0) + workload);
        }
        if (date >= twentyEightDaysAgo) {
          last28DaysMap.set(dateKey, (last28DaysMap.get(dateKey) || 0) + workload);
        }
      });

      // Canonical EWMA + uncoupled ACWR (utils/acwr.js — the single source of
      // truth). Replaces the coupled hand-rolled ratio (chronic window included
      // the acute days + a /4 weekly average), which under-reported spike risk.
      const acwrResult = computeAcwrAt(last28DaysMap, new Date());
      acuteLoad = acwrResult.acuteLoad;
      chronicLoad = acwrResult.chronicLoad;
      acwr = acwrResult.acwr;

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        last7Days.push({ date: dateKey, load: last7DaysMap.get(dateKey) || 0 });
      }
    }

    // Team role from membership
    let teamRole = null;
    if (teamMemberships && teamMemberships.length > 0) {
      teamRole = teamMemberships[0].role; // 'captain', 'member', etc.
    }

    // Get active training program (if exists)
    // Note: This would require a training_programs table
    // For now, return null
    const activeProgram = null;

  return {
    userId: userData.id,
    role: teamRole || "player",
    position: userData.position || null,
    teamRole,
    bodyMetrics: {
      height: userData.height_cm || null,
      weight: userData.weight_kg || null,
      lastUpdated: userData.updated_at || null,
    },
    injuries: (injuries || []).map((injury) => ({
      id: injury.id,
      type: injury.type,
      severity: injury.severity,
      occurredAt: injury.occurred_at,
      status: injury.status,
      restrictions: injury.restrictions || [],
    })),
    loadData: {
      acute: acuteLoad,
      chronic: chronicLoad,
      acwr,
      last7Days,
    },
    wellness: latestWellness
      ? {
          lastCheckin: latestWellness.created_at,
          readiness: latestWellness.readiness,
          sleep: latestWellness.sleep,
          energy: latestWellness.energy,
          mood: latestWellness.mood,
          soreness: latestWellness.soreness,
        }
      : null,
    activeProgram,
    supplements: {
      recentLogs: (supplements || []).map((log) => ({
        supplement: log.supplement_name,
        loggedAt: log.created_at || log.date,
        dose: log.dosage, // User logged, AI never recommends
      })),
    },
  };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "user-context",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // SECURITY: Explicit auth for user context
    handler: async (event, context, { userId, requestId }) => {
      try {
        const result = await getUserContext(userId);
        return createSuccessResponse(result);
      } catch (error) {
        if (error?.statusCode === 404 || error?.code === "not_found") {
          return createErrorResponse("User not found", 404, "not_found", requestId);
        }
        logger.error("handler_error_unexpected", error);
        return createErrorResponse(
          "Failed to fetch user context",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
