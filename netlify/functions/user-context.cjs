// Netlify Function: User Context API
// Returns comprehensive user context for AI coaching system
// Aggregates: users, injuries, training_sessions, wellness_checkins, supplements_logs

const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse } = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Get comprehensive user context
 * GET /api/user/context
 * Returns: body metrics, injuries, role, last 7/28 day loads, active program, team role
 */
async function getUserContext(userId) {
  try {
    // Get user basic info
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, position, height, weight, updated_at")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      throw userError;
    }

    // Get injuries (active and recent)
    const { data: injuries, error: injuriesError } = await supabaseAdmin
      .from("injuries")
      .select("id, type, severity, occurred_at, status, restrictions")
      .eq("user_id", userId)
      .in("status", ["active", "recovering"])
      .order("occurred_at", { ascending: false })
      .limit(10);

    if (injuriesError) {
      console.error("Error fetching injuries:", injuriesError);
      // Don't throw - injuries are optional
    }

    // Get training sessions for load calculation (last 28 days)
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from("training_sessions")
      .select("workload, session_date, completed_at")
      .eq("user_id", userId)
      .gte("completed_at", twentyEightDaysAgo.toISOString())
      .order("completed_at", { ascending: false });

    if (sessionsError) {
      console.error("Error fetching training sessions:", sessionsError);
      // Don't throw - sessions are optional
    }

    // Calculate ACWR (Acute:Chronic Workload Ratio)
    let acuteLoad = 0;
    let chronicLoad = 0;
    let acwr = 1.0;
    const last7Days = [];
    const _last28Days = [];

    if (sessions && sessions.length > 0) {
      // Last 7 days (acute)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const acuteSessions = sessions.filter(
        (s) => new Date(s.completed_at || s.session_date) >= sevenDaysAgo,
      );
      acuteLoad = acuteSessions.reduce((sum, s) => sum + (s.workload || 0), 0);

      // Last 28 days (chronic) - average weekly load
      const chronicSessions = sessions.slice(0, 28);
      chronicLoad =
        chronicSessions.length >= 14
          ? chronicSessions.reduce((sum, s) => sum + (s.workload || 0), 0) / 4 // Average weekly
          : acuteLoad;

      acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 1.0;

      // Build daily load arrays
      const last7DaysMap = new Map();
      const last28DaysMap = new Map();

      sessions.forEach((session) => {
        const date = new Date(session.completed_at || session.session_date);
        const dateKey = date.toISOString().split("T")[0];
        const workload = session.workload || 0;

        if (date >= sevenDaysAgo) {
          last7DaysMap.set(
            dateKey,
            (last7DaysMap.get(dateKey) || 0) + workload,
          );
        }
        if (date >= twentyEightDaysAgo) {
          last28DaysMap.set(
            dateKey,
            (last28DaysMap.get(dateKey) || 0) + workload,
          );
        }
      });

      // Convert maps to arrays
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        last7Days.push({
          date: dateKey,
          load: last7DaysMap.get(dateKey) || 0,
        });
      }
    }

    // Get latest wellness check-in
    const { data: latestWellness, error: wellnessError } = await supabaseAdmin
      .from("wellness_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (wellnessError && wellnessError.code !== "PGRST116") {
      console.error("Error fetching wellness:", wellnessError);
      // Don't throw - wellness is optional
    }

    // Get recent supplement logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: supplements, error: supplementsError } = await supabaseAdmin
      .from("supplements_logs")
      .select("supplement, logged_at, taken_at, dose")
      .eq("user_id", userId)
      .gte("taken_at", sevenDaysAgo.toISOString())
      .order("taken_at", { ascending: false })
      .limit(10);

    if (supplementsError) {
      console.error("Error fetching supplements:", supplementsError);
      // Don't throw - supplements are optional
    }

    // Get team membership (for team role)
    const { data: teamMemberships, error: _teamError } = await supabaseAdmin
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId)
      .limit(1);

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
      role: userData.role || "player",
      position: userData.position || null,
      teamRole,
      bodyMetrics: {
        height: userData.height || null,
        weight: userData.weight || null,
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
          supplement: log.supplement,
          loggedAt: log.logged_at || log.taken_at,
          dose: log.dose, // User logged, AI never recommends
        })),
      },
    };
  } catch (error) {
    console.error("Error in getUserContext:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "user-context",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, context, { userId }) => {
      const result = await getUserContext(userId);
      return createSuccessResponse(result);
    },
  });
};
