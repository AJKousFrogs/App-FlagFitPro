// Netlify Function: Coach API
// Handles coach-specific operations: dashboard, team management, training analytics

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin, db } = require("./supabase-client.cjs");
const {
  ConsentDataReader,
  AccessContext,
} = require("./utils/consent-data-reader.cjs");
const { DataState } = require("./utils/data-state.cjs");

// Initialize consent-aware data reader
const consentReader = new ConsentDataReader(supabaseAdmin);

/**
 * Get the team ID for a coach
 * @private
 */
async function getCoachTeamId(coachId) {
  const { data: teams, error } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", coachId)
    .eq("role", "coach")
    .limit(1);

  if (error || !teams || teams.length === 0) {
    return null;
  }
  return teams[0].team_id;
}

/**
 * Get coach dashboard data
 * Returns squad overview, risk flags, and upcoming fixtures
 *
 * Uses ConsentDataReader for consent-protected tables (training_sessions, wellness_entries)
 */
async function getCoachDashboard(userId) {
  try {
    // Get team members (squad)
    const teamMembers = await db.teams.getUserTeams(userId);
    const teamId = await getCoachTeamId(userId);

    // Track consent info across all members
    const allBlockedPlayerIds = new Set();
    let totalAccessibleCount = 0;

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

        // Get recent training sessions for ACWR calculation using ConsentDataReader
        const sessionsResult = await consentReader.readTrainingSessions({
          requesterId: userId,
          playerId: member.user_id,
          teamId,
          context: AccessContext.COACH_TEAM_DATA,
          filters: {
            limit: 28, // Last 4 weeks
          },
        });

        const sessions = sessionsResult.data || [];

        // Track blocked players
        if (sessionsResult.consentInfo?.blockedPlayerIds?.length > 0) {
          sessionsResult.consentInfo.blockedPlayerIds.forEach((id) =>
            allBlockedPlayerIds.add(id),
          );
        }

        // Calculate ACWR (Acute:Chronic Workload Ratio)
        let acwr = 1.0;
        let workload = 0;
        let dataState = DataState.NO_DATA;

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
          dataState =
            sessions.length >= 7
              ? DataState.REAL_DATA
              : DataState.INSUFFICIENT_DATA;
          totalAccessibleCount += sessions.length;
        }

        // Calculate readiness from wellness data using ConsentDataReader
        let readiness = 75; // Default baseline
        let wellnessDataState = DataState.NO_DATA;

        try {
          const wellnessResult = await consentReader.readWellnessEntries({
            requesterId: userId,
            playerId: member.user_id,
            teamId,
            context: AccessContext.COACH_TEAM_DATA,
            filters: {
              limit: 1,
            },
          });

          // Track blocked players from wellness
          if (wellnessResult.consentInfo?.blockedPlayerIds?.length > 0) {
            wellnessResult.consentInfo.blockedPlayerIds.forEach((id) =>
              allBlockedPlayerIds.add(id),
            );
          }

          const wellnessData = wellnessResult.data || [];

          if (wellnessData && wellnessData.length > 0) {
            const w = wellnessData[0];
            // Calculate wellness score (average of positive metrics, inverse stress/soreness)
            const sleepScore = (w.sleep_quality || 5) * 10;
            const energyScore = (w.energy_level || 5) * 10;
            const stressScore = (10 - (w.stress_level || 5)) * 10; // Inverse
            const sorenessScore = (10 - (w.muscle_soreness || 5)) * 10; // Inverse
            const moodScore = (w.mood || 5) * 10;

            const wellnessAvg =
              (sleepScore +
                energyScore +
                stressScore +
                sorenessScore +
                moodScore) /
              5;

            // Combine wellness with ACWR impact
            const acwrPenalty = Math.abs(acwr - 1.0) * 15; // Penalty for being far from optimal ACWR
            readiness = Math.max(30, Math.min(100, wellnessAvg - acwrPenalty));
            wellnessDataState = DataState.REAL_DATA;
          } else {
            // Fallback: estimate from ACWR only
            readiness = Math.max(50, Math.min(100, 85 - (acwr - 1.0) * 20));
          }
        } catch (wellnessErr) {
          console.warn(
            `Could not fetch wellness for user ${member.user_id}:`,
            wellnessErr.message,
          );
          readiness = Math.max(50, Math.min(100, 85 - (acwr - 1.0) * 20));
        }

        squadMembers.push({
          id: userData.id,
          user_id: userData.id,
          name: userData.name || "Unknown",
          full_name: userData.name || "Unknown",
          position: userData.position || "N/A",
          workload,
          today_workload: workload / 7, // Daily average
          acwr,
          readiness,
          dataState: {
            training: dataState,
            wellness: wellnessDataState,
          },
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
      consentInfo: {
        blockedPlayerIds: [...allBlockedPlayerIds],
        blockedCount: allBlockedPlayerIds.size,
        accessibleCount: totalAccessibleCount,
      },
      dataState:
        squadMembers.length > 0 ? DataState.REAL_DATA : DataState.NO_DATA,
    };
  } catch (error) {
    console.error("Error getting coach dashboard:", error);
    throw error;
  }
}

/**
 * Get team information
 * Returns team members with their stats
 *
 * Uses ConsentDataReader for consent-protected tables (training_sessions)
 */
async function getTeamInfo(userId, coachId) {
  try {
    // Use coachId if provided, otherwise use userId
    const targetCoachId = coachId || userId;

    // Get teams where user is coach
    const teamId = await getCoachTeamId(targetCoachId);

    if (!teamId) {
      // Return empty team if no teams found
      return {
        members: [],
        consentInfo: {
          blockedPlayerIds: [],
          blockedCount: 0,
          accessibleCount: 0,
        },
        dataState: DataState.NO_DATA,
      };
    }

    // Get all team members
    const members = await db.teams.getTeamMembers(teamId);

    // Track consent info
    const allBlockedPlayerIds = new Set();
    let totalAccessibleCount = 0;

    // Enrich with training data using ConsentDataReader
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          // Get recent training sessions using ConsentDataReader
          const sessionsResult = await consentReader.readTrainingSessions({
            requesterId: userId,
            playerId: member.user_id,
            teamId,
            context: AccessContext.COACH_TEAM_DATA,
            filters: {
              limit: 28,
            },
          });

          const sessions = sessionsResult.data || [];

          // Track blocked players
          if (sessionsResult.consentInfo?.blockedPlayerIds?.length > 0) {
            sessionsResult.consentInfo.blockedPlayerIds.forEach((id) =>
              allBlockedPlayerIds.add(id),
            );
          }

          let acwr = 1.0;
          let workload = 0;
          let dataState = DataState.NO_DATA;

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
            dataState =
              sessions.length >= 7
                ? DataState.REAL_DATA
                : DataState.INSUFFICIENT_DATA;
            totalAccessibleCount += sessions.length;
          }

          const readiness = Math.max(50, Math.min(100, 85 - (acwr - 1.0) * 20));

          return {
            ...member,
            acwr,
            workload,
            today_workload: workload / 7,
            readiness,
            dataState,
          };
        } catch (err) {
          console.error(`Error enriching member ${member.user_id}:`, err);
          return {
            ...member,
            acwr: 1.0,
            workload: 0,
            today_workload: 0,
            readiness: 75,
            dataState: DataState.NO_DATA,
          };
        }
      }),
    );

    return {
      members: enrichedMembers,
      consentInfo: {
        blockedPlayerIds: [...allBlockedPlayerIds],
        blockedCount: allBlockedPlayerIds.size,
        accessibleCount: totalAccessibleCount,
      },
      dataState:
        enrichedMembers.length > 0 ? DataState.REAL_DATA : DataState.NO_DATA,
    };
  } catch (error) {
    console.error("Error getting team info:", error);
    throw error;
  }
}

/**
 * Get training analytics
 * Returns training statistics and trends
 *
 * Uses ConsentDataReader for consent-protected tables (training_sessions)
 */
async function getTrainingAnalytics(userId, coachId) {
  try {
    const targetCoachId = coachId || userId;

    // Get team ID
    const teamId = await getCoachTeamId(targetCoachId);

    if (!teamId) {
      return {
        totalSessions: 0,
        totalWorkload: 0,
        avgWorkload: 0,
        trends: [],
        distribution: {},
        consentInfo: {
          blockedPlayerIds: [],
          blockedCount: 0,
          accessibleCount: 0,
        },
        dataState: DataState.NO_DATA,
      };
    }

    // Get training sessions for all team members using ConsentDataReader
    // The reader will handle consent checking internally
    const sessionsResult = await consentReader.readTrainingSessions({
      requesterId: userId,
      teamId,
      context: AccessContext.COACH_TEAM_DATA,
      filters: {
        limit: 100,
      },
    });

    const sessions = sessionsResult.data || [];
    const consentInfo = sessionsResult.consentInfo || {
      blockedPlayerIds: [],
      blockedCount: 0,
      accessibleCount: 0,
    };

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalWorkload: 0,
        avgWorkload: 0,
        trends: [],
        distribution: {},
        consentInfo,
        dataState: DataState.NO_DATA,
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
      consentInfo,
      dataState:
        totalSessions >= 7 ? DataState.REAL_DATA : DataState.INSUFFICIENT_DATA,
    };
  } catch (error) {
    console.error("Error getting training analytics:", error);
    throw error;
  }
}

/**
 * Create training session
 * Note: This is a WRITE operation, not subject to consent reading rules
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
    const teamId = await getCoachTeamId(targetCoachId);

    if (!teamId) {
      return [];
    }

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
      case "": {
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const dashboard = await getCoachDashboard(coachId);
        return createSuccessResponse(dashboard);
      }

      case "/team": {
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const teamResult = await getTeamInfo(userId, coachId);
        // Preserve backwards compatibility: return members array at top level
        // but include consentInfo and dataState
        return createSuccessResponse({
          ...teamResult,
          // For backwards compat, also expose members at root if clients expect array
          // Clients should migrate to using result.members
        });
      }

      case "/training-analytics": {
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const analytics = await getTrainingAnalytics(userId, coachId);
        return createSuccessResponse(analytics);
      }

      case "/training-session": {
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const body = JSON.parse(event.body || "{}");
        const session = await createTrainingSession(userId, body);
        return createSuccessResponse(session);
      }

      case "/games": {
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const games = await getGames(userId, coachId);
        return createSuccessResponse(games);
      }

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
