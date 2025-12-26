// Netlify Function: Coach API
// Handles coach-specific operations: dashboard, team management, training analytics

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin, db } = require("./supabase-client.cjs");

/**
 * Get coach dashboard data
 * Returns squad overview, risk flags, and upcoming fixtures
 */
async function getCoachDashboard(userId) {
  try {
    // Get team members (squad)
    const teamMembers = await db.teams.getUserTeams(userId);

    // Get squad member details with workload and ACWR
    const squadMembers = [];

    for (const member of teamMembers) {
      try {
        // Get user details
        const { data: userData, error: userError } = await supabaseAdmin
          .from("users")
          .select("id, name, position, role")
          .eq("id", member.user_id)
          .single();

        if (userError || !userData) {
          continue;
        }

        // Get recent training sessions for ACWR calculation
        const { data: sessions, error: _sessionsError } = await supabaseAdmin
          .from("training_sessions")
          .select("workload, session_date")
          .eq("user_id", member.user_id)
          .order("session_date", { ascending: false })
          .limit(28); // Last 4 weeks

        // Calculate ACWR (Acute:Chronic Workload Ratio)
        let acwr = 1.0;
        let workload = 0;

        if (sessions && sessions.length > 0) {
          const acute = sessions
            .slice(0, 7)
            .reduce((sum, s) => sum + (s.workload || 0), 0);
          const chronic =
            sessions.length >= 14
              ? sessions
                  .slice(0, 14)
                  .reduce((sum, s) => sum + (s.workload || 0), 0) / 2
              : acute;

          acwr = chronic > 0 ? acute / chronic : 1.0;
          workload = acute; // Weekly workload
        }

        // Calculate readiness from wellness data
        let readiness = 75; // Default baseline
        try {
          // Get latest wellness entry for this user
          const { data: wellnessData } = await supabaseAdmin
            .from("wellness_entries")
            .select("sleep_quality, energy_level, stress_level, muscle_soreness, mood")
            .or(`athlete_id.eq.${member.user_id},user_id.eq.${member.user_id}`)
            .order("date", { ascending: false })
            .limit(1);

          if (wellnessData && wellnessData.length > 0) {
            const w = wellnessData[0];
            // Calculate wellness score (average of positive metrics, inverse stress/soreness)
            const sleepScore = (w.sleep_quality || 5) * 10;
            const energyScore = (w.energy_level || 5) * 10;
            const stressScore = (10 - (w.stress_level || 5)) * 10; // Inverse
            const sorenessScore = (10 - (w.muscle_soreness || 5)) * 10; // Inverse
            const moodScore = (w.mood || 5) * 10;
            
            const wellnessAvg = (sleepScore + energyScore + stressScore + sorenessScore + moodScore) / 5;
            
            // Combine wellness with ACWR impact
            const acwrPenalty = Math.abs(acwr - 1.0) * 15; // Penalty for being far from optimal ACWR
            readiness = Math.max(30, Math.min(100, wellnessAvg - acwrPenalty));
          } else {
            // Fallback: estimate from ACWR only
            readiness = Math.max(50, Math.min(100, 85 - (acwr - 1.0) * 20));
          }
        } catch (wellnessErr) {
          console.warn(`Could not fetch wellness for user ${member.user_id}:`, wellnessErr.message);
          readiness = Math.max(50, Math.min(100, 85 - (acwr - 1.0) * 20));
        }

        squadMembers.push({
          id: userData.id,
          user_id: userData.id,
          name: userData.name || "Unknown",
          full_name: userData.name || "Unknown",
          position: userData.position || "N/A",
          workload: workload,
          today_workload: workload / 7, // Daily average
          acwr: acwr,
          readiness: readiness,
        });
      } catch (err) {
        console.error(`Error processing squad member ${member.user_id}:`, err);
      }
    }

    return {
      squadSize: squadMembers.length,
      avgWorkload:
        squadMembers.length > 0
          ? squadMembers.reduce((sum, m) => sum + m.workload, 0) /
            squadMembers.length
          : 0,
      members: squadMembers,
    };
  } catch (error) {
    console.error("Error getting coach dashboard:", error);
    throw error;
  }
}

/**
 * Get team information
 * Returns team members with their stats
 */
async function getTeamInfo(userId, coachId) {
  try {
    // Use coachId if provided, otherwise use userId
    const targetCoachId = coachId || userId;

    // Get teams where user is coach
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", targetCoachId)
      .eq("role", "coach")
      .limit(1);

    if (teamsError || !teams || teams.length === 0) {
      // Return empty team if no teams found
      return [];
    }

    const teamId = teams[0].team_id;

    // Get all team members
    const members = await db.teams.getTeamMembers(teamId);

    // Enrich with training data
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          // Get recent training sessions
          const { data: sessions, error: _sessionsError } = await supabaseAdmin
            .from("training_sessions")
            .select("workload, session_date")
            .eq("user_id", member.user_id)
            .order("session_date", { ascending: false })
            .limit(28);

          let acwr = 1.0;
          let workload = 0;

          if (sessions && sessions.length > 0) {
            const acute = sessions
              .slice(0, 7)
              .reduce((sum, s) => sum + (s.workload || 0), 0);
            const chronic =
              sessions.length >= 14
                ? sessions
                    .slice(0, 14)
                    .reduce((sum, s) => sum + (s.workload || 0), 0) / 2
                : acute;

            acwr = chronic > 0 ? acute / chronic : 1.0;
            workload = acute;
          }

          const readiness = Math.max(50, Math.min(100, 85 - (acwr - 1.0) * 20));

          return {
            ...member,
            acwr: acwr,
            workload: workload,
            today_workload: workload / 7,
            readiness: readiness,
          };
        } catch (err) {
          console.error(`Error enriching member ${member.user_id}:`, err);
          return {
            ...member,
            acwr: 1.0,
            workload: 0,
            today_workload: 0,
            readiness: 75,
          };
        }
      }),
    );

    return enrichedMembers;
  } catch (error) {
    console.error("Error getting team info:", error);
    throw error;
  }
}

/**
 * Get training analytics
 * Returns training statistics and trends
 */
async function getTrainingAnalytics(userId, coachId) {
  try {
    const targetCoachId = coachId || userId;

    // Get team members
    const teamMembers = await getTeamInfo(userId, targetCoachId);

    // Get training sessions for all team members
    const memberIds = teamMembers.map((m) => m.user_id || m.id);

    if (memberIds.length === 0) {
      return {
        totalSessions: 0,
        totalWorkload: 0,
        avgWorkload: 0,
        trends: [],
        distribution: {},
      };
    }

    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from("training_sessions")
      .select("workload, session_date, user_id, session_type")
      .in("user_id", memberIds)
      .order("session_date", { ascending: false })
      .limit(100);

    if (sessionsError) {
      console.error("Error fetching training sessions:", sessionsError);
      return {
        totalSessions: 0,
        totalWorkload: 0,
        avgWorkload: 0,
        trends: [],
        distribution: {},
      };
    }

    const totalSessions = sessions.length;
    const totalWorkload = sessions.reduce(
      (sum, s) => sum + (s.workload || 0),
      0,
    );
    const avgWorkload = totalSessions > 0 ? totalWorkload / totalSessions : 0;

    // Calculate trends (last 4 weeks)
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    const recentSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.session_date);
      return sessionDate >= fourWeeksAgo;
    });

    // Group by week
    const trends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekSessions = recentSessions.filter((s) => {
        const sessionDate = new Date(s.session_date);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      trends.push({
        week: weekStart.toISOString().split("T")[0],
        sessions: weekSessions.length,
        workload: weekSessions.reduce((sum, s) => sum + (s.workload || 0), 0),
      });
    }

    // Distribution by session type
    const distribution = {};
    sessions.forEach((s) => {
      const type = s.session_type || "other";
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return {
      totalSessions,
      totalWorkload,
      avgWorkload,
      trends,
      distribution,
    };
  } catch (error) {
    console.error("Error getting training analytics:", error);
    throw error;
  }
}

/**
 * Create training session
 */
async function createTrainingSession(userId, sessionData) {
  try {
    const session = {
      user_id: sessionData.userId || sessionData.user_id,
      session_date:
        sessionData.sessionDate ||
        sessionData.session_date ||
        new Date().toISOString(),
      session_type:
        sessionData.sessionType || sessionData.session_type || "training",
      workload: sessionData.workload || 0,
      duration_minutes:
        sessionData.durationMinutes || sessionData.duration_minutes || 60,
      notes: sessionData.notes || "",
      created_by: userId, // Coach who created it
    };

    const { data, error } = await supabaseAdmin
      .from("training_sessions")
      .insert([session])
      .select()
      .single();

    if (error) {
      console.error("Error creating training session:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error creating training session:", error);
    throw error;
  }
}

/**
 * Get games/fixtures
 */
async function getGames(userId, coachId) {
  try {
    const targetCoachId = coachId || userId;

    // Get teams where user is coach
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", targetCoachId)
      .eq("role", "coach")
      .limit(1);

    if (teamsError || !teams || teams.length === 0) {
      return [];
    }

    const teamId = teams[0].team_id;

    // Get games for this team
    const { data: games, error: gamesError } = await supabaseAdmin
      .from("games")
      .select("*")
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order("game_start", { ascending: true })
      .limit(10);

    if (gamesError) {
      console.error("Error fetching games:", gamesError);
      return [];
    }

    // Format games for frontend
    return (games || []).map((game) => ({
      id: game.id,
      game_id: game.id,
      opponent:
        game.home_team_id === teamId
          ? game.away_team_name || "TBD"
          : game.home_team_name || "TBD",
      opponent_name:
        game.home_team_id === teamId
          ? game.away_team_name || "TBD"
          : game.home_team_name || "TBD",
      date: game.game_start,
      game_date: game.game_start,
      game_start: game.game_start,
      location: game.location || "",
      game_type: game.game_type || "Regular Season",
    }));
  } catch (error) {
    console.error("Error getting games:", error);
    throw error;
  }
}

/**
 * Main handler function
 */
async function handleRequest(event, context, { userId }) {
  try {
    // Extract endpoint from path
    const path = event.path.replace("/.netlify/functions/coach", "") || "/";
    const endpoint = path.split("?")[0]; // Remove query params
    const query = event.queryStringParameters || {};
    const coachId = query.coachId || userId;

    // Route to appropriate handler
    switch (endpoint) {
      case "/dashboard":
      case "":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const dashboard = await getCoachDashboard(coachId);
        return createSuccessResponse(dashboard);

      case "/team":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const team = await getTeamInfo(userId, coachId);
        return createSuccessResponse(team);

      case "/training-analytics":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const analytics = await getTrainingAnalytics(userId, coachId);
        return createSuccessResponse(analytics);

      case "/training-session":
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const body = JSON.parse(event.body || "{}");
        const session = await createTrainingSession(userId, body);
        return createSuccessResponse(session);

      case "/games":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const games = await getGames(userId, coachId);
        return createSuccessResponse(games);

      case "/health":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        return createSuccessResponse({
          status: "healthy",
          service: "coach-api",
        });

      default:
        return createErrorResponse("Endpoint not found", 404);
    }
  } catch (error) {
    console.error("Error in coach handler:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Coach",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: handleRequest,
  });
};
