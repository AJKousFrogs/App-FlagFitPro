import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin, db } from "./supabase-client.js";
import { ConsentDataReader, AccessContext } from "./utils/consent-data-reader.js";
import { DataState } from "./utils/data-state.js";
import { getUserRole, requireRole, logViolation } from "./utils/authorization-guard.js";
import { resolveStaffedTeam } from "./utils/team-scope.js";
import { parseJsonObjectBody as sharedParseJsonObjectBody } from "./utils/input-validator.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

// Netlify Function: Coach API
// Handles coach-specific operations: dashboard, team management, training analytics

// Initialize consent-aware data reader
const consentReader = new ConsentDataReader(supabaseAdmin);
const logger = createLogger({ service: "netlify.coach" });
const CALENDAR_EVENT_TYPES = new Set(["practice", "game", "meeting", "other"]);
const COACH_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "assistant_coach",
  "offense_coordinator",
  "defense_coordinator",
];

const isValidTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const isValidDate = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const buildDateTime = (date, time) => {
  if (!date) {
    return null;
  }
  if (time) {
    return `${date}T${time}:00`;
  }
  return `${date}T00:00:00`;
};

const MAX_COACH_MESSAGE_LENGTH = 1000;

const parseRequiredTrimmedString = (value, fieldName, maxLength = MAX_COACH_MESSAGE_LENGTH) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }
  return trimmed;
};

const parseJsonBody = (body) => {
  if (!body) {
    return {};
  }
  try {
    return sharedParseJsonObjectBody(body);
  } catch (err) {
    if (err?.message === "Request body must be an object") {
      const validationError = new Error("Request body must be an object");
      validationError.isValidation = true;
      throw validationError;
    }
    const parseError = new Error("Invalid JSON in request body");
    parseError.isInvalidJson = true;
    throw parseError;
  }
};

/**
 * Get the team ID for a coach.
 *
 * Multi-team coaches: pass `requestedTeamId` (?teamId= / payload.teamId) to
 * operate on a specific team — it is validated against the coach's active
 * staffed memberships, never trusted. Without it, the most recently updated
 * membership wins (deterministic, unlike the old unordered limit(1)).
 * @private
 */
async function getCoachTeamId(coachId, requestedTeamId = null) {
  return resolveStaffedTeam(coachId, requestedTeamId, { roles: COACH_ROLES });
}

async function getActiveCoachTeamMembers(coachId, requestedTeamId = null) {
  const teamId = await getCoachTeamId(coachId, requestedTeamId);
  if (!teamId) {
    throw new Error("Not authorized");
  }

  const { data: members, error } = await supabaseAdmin
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", teamId)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  return {
    teamId,
    members: members || [],
  };
}

async function createCoachTeamMessage(coachId, payload) {
  const message = parseRequiredTrimmedString(payload?.message, "message");
  const { teamId, members } = await getActiveCoachTeamMembers(
    coachId,
    payload?.teamId || null,
  );

  const recipients = members
    .filter((member) => member.user_id && member.user_id !== coachId)
    .map((member) => ({
      user_id: member.user_id,
      notification_type: "team",
      message,
      priority: "normal",
      is_read: false,
      metadata: {
        source: "coach_dashboard",
        team_id: teamId,
        sender_id: coachId,
        action: "team_message",
      },
    }));

  if (recipients.length === 0) {
    return { sent: 0 };
  }

  const { error } = await supabaseAdmin.from("notifications").insert(recipients);
  if (error) {
    throw error;
  }

  return { sent: recipients.length };
}

async function createCoachAccessRequest(coachId, payload) {
  const playerId = parseRequiredTrimmedString(payload?.playerId, "playerId", 128);
  const message = parseRequiredTrimmedString(payload?.message, "message");
  const { teamId, members } = await getActiveCoachTeamMembers(
    coachId,
    payload?.teamId || null,
  );

  const targetPlayer = members.find(
    (member) => member.user_id === playerId && member.role === "player",
  );

  if (!targetPlayer) {
    throw new Error("playerId must reference an active player in coach team");
  }

  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: playerId,
    notification_type: "general",
    message,
    priority: "normal",
    is_read: false,
    metadata: {
      source: "coach_dashboard",
      team_id: teamId,
      sender_id: coachId,
      action: "access_request",
    },
  });

  if (error) {
    throw error;
  }

  return { sent: 1 };
}

/**
 * Get coach dashboard data
 * Returns squad overview, risk flags, and upcoming fixtures
 *
 * Uses ConsentDataReader for consent-protected tables (training_sessions, wellness_entries)
 */
async function getCoachDashboard(userId, requestedTeamId = null) {
  try {
    // Get team members (squad)
    const teamMembers = await db.teams.getUserTeams(userId);
    const teamId = await getCoachTeamId(userId, requestedTeamId);

    // Track consent info across all members
    const allBlockedPlayerIds = new Set();
    let totalAccessibleCount = 0;

    // Batch-fetch all user details in a single query (avoids N+1)
    const memberUserIds = teamMembers.map((m) => m.user_id);
    const { data: allUserData, error: allUserError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, position")
      .in("id", memberUserIds);

    if (allUserError) {
      logger.warn("batch_fetch_users_failed", { error: allUserError?.message });
    }

    const userDataMap = new Map();
    (allUserData || []).forEach((u) => userDataMap.set(u.id, u));

    // Canonical readiness for today (what each athlete sees on their own Today
    // screen), batch-read once. Preferred over the dashboard's local wellness
    // approximation so the coach and the athlete never see different numbers.
    const today = new Date().toISOString().slice(0, 10);
    const { data: readinessRows } = await supabaseAdmin
      .from("readiness_scores")
      .select("user_id, score")
      .in("user_id", memberUserIds)
      .eq("day", today);
    const canonicalReadiness = new Map();
    (readinessRows || []).forEach((r) => {
      if (r.score !== null) {
        canonicalReadiness.set(r.user_id, Math.round(Number(r.score)));
      }
    });

    // Build each squad member's overview independently and in PARALLEL.
    // Previously this was a sequential for-loop with 2 awaits per member
    // (sessions + wellness) — a 15-player squad meant ~30 serial round trips.
    // Each task returns its own blocked-id/accessible tallies which are merged
    // after, so the shared counters never race.
    const memberResults = await Promise.all(
      teamMembers.map(async (member) => {
        const blockedIds = [];
        let accessibleCount = 0;
        try {
          const userData = userDataMap.get(member.user_id);
          if (!userData) {
            return { member: null, blockedIds, accessibleCount };
          }

          // Sessions (ACWR) and wellness are independent — fetch concurrently.
          const [sessionsResult, wellnessResult] = await Promise.all([
            consentReader.readTrainingSessions({
              requesterId: userId,
              playerId: member.user_id,
              teamId,
              context: AccessContext.COACH_TEAM_DATA,
              filters: { limit: 28 }, // Last 4 weeks
            }),
            consentReader
              .readWellnessEntries({
                requesterId: userId,
                playerId: member.user_id,
                teamId,
                context: AccessContext.COACH_TEAM_DATA,
                filters: { limit: 1 },
              })
              .catch((wellnessErr) => {
                logger.warn("coach_dashboard_wellness_fetch_failed", wellnessErr, {
                  player_user_id: member.user_id,
                });
                return null; // readiness stays null — do NOT estimate
              }),
          ]);

          const sessions = sessionsResult.data || [];
          if (sessionsResult.consentInfo?.blockedPlayerIds?.length > 0) {
            blockedIds.push(...sessionsResult.consentInfo.blockedPlayerIds);
          }

          // Calculate ACWR (Acute:Chronic Workload Ratio).
          // CRITICAL: null when no data — do not use fake defaults.
          let acwr = null;
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

            acwr = chronic > 0 ? acute / chronic : null;
            workload = acute; // Weekly workload
            dataState =
              sessions.length >= 7
                ? DataState.REAL_DATA
                : DataState.INSUFFICIENT_DATA;
            accessibleCount += sessions.length;
          }

          // Calculate readiness from wellness data.
          // CRITICAL: no fake defaults — null means no data.
          let readiness = null;
          let wellnessDataState = DataState.NO_DATA;

          if (wellnessResult?.consentInfo?.blockedPlayerIds?.length > 0) {
            blockedIds.push(...wellnessResult.consentInfo.blockedPlayerIds);
          }

          const wellnessData = wellnessResult?.data || [];
          if (wellnessData && wellnessData.length > 0) {
            const w = wellnessData[0];
            const hasSleep = w.sleep_quality !== null;
            const hasEnergy = w.energy_level !== null;

            if (hasSleep && hasEnergy) {
              const sleepScore = (w.sleep_quality / 10) * 100;
              const energyScore = (w.energy_level / 10) * 100;
              const hasStress = w.stress_level !== null;
              const hasSoreness = w.muscle_soreness !== null;

              let wellnessAvg;
              if (hasStress && hasSoreness) {
                const stressScore = ((10 - w.stress_level) / 10) * 100;
                const sorenessScore = ((10 - w.muscle_soreness) / 10) * 100;
                wellnessAvg =
                  sleepScore * 0.3 +
                  energyScore * 0.25 +
                  stressScore * 0.25 +
                  sorenessScore * 0.2;
              } else {
                wellnessAvg = sleepScore * 0.55 + energyScore * 0.45;
              }

              if (acwr !== null) {
                const acwrPenalty = Math.abs(acwr - 1.0) * 15;
                readiness = Math.max(30, Math.min(100, wellnessAvg - acwrPenalty));
              } else {
                readiness = Math.round(wellnessAvg);
              }
              wellnessDataState = DataState.REAL_DATA;
            }
          }

          // Canonical (server-computed) readiness wins when today's score exists.
          const canonical = canonicalReadiness.get(member.user_id);
          if (canonical !== undefined) {
            readiness = canonical;
            wellnessDataState = DataState.REAL_DATA;
          }

          return {
            blockedIds,
            accessibleCount,
            member: {
              id: userData.id,
              user_id: userData.id,
              name: userData.full_name || "Unknown",
              full_name: userData.full_name || "Unknown",
              position: userData.position || "N/A",
              workload,
              today_workload: workload / 7, // Daily average
              acwr,
              readiness,
              dataState: {
                training: dataState,
                wellness: wellnessDataState,
              },
            },
          };
        } catch (err) {
          logger.error("coach_dashboard_squad_member_failed", err, {
            player_user_id: member.user_id,
          });
          return { member: null, blockedIds, accessibleCount };
        }
      }),
    );

    const squadMembers = [];
    for (const r of memberResults) {
      r.blockedIds.forEach((id) => allBlockedPlayerIds.add(id));
      totalAccessibleCount += r.accessibleCount;
      if (r.member) {
        squadMembers.push(r.member);
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
    logger.error("coach_dashboard_fetch_failed", error, { user_id: userId });
    throw error;
  }
}

async function resolveTargetCoachId(requesterId, requestedCoachId) {
  if (!requestedCoachId || requestedCoachId === requesterId) {
    return requesterId;
  }

  const adminCheck = await requireRole(requesterId, ["admin"]);
  if (!adminCheck.authorized) {
    throw new Error("Not authorized to access another coach's data");
  }

  return requestedCoachId;
}

/**
 * Get team information
 * Returns team members with their stats
 *
 * Uses ConsentDataReader for consent-protected tables (training_sessions)
 */
async function getTeamInfo(userId, coachId, requestedTeamId = null) {
  try {
    // Use coachId if provided, otherwise use userId
    const targetCoachId = coachId || userId;

    // Get teams where user is coach
    const teamId = await getCoachTeamId(targetCoachId, requestedTeamId);

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
          logger.error("coach_team_enrichment_failed", err, {
            member_user_id: member.user_id,
          });
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
    logger.error("coach_team_info_fetch_failed", error, {
      user_id: userId,
      coach_id: coachId,
    });
    throw error;
  }
}

/**
 * Get training analytics
 * Returns training statistics and trends
 *
 * Uses ConsentDataReader for consent-protected tables (training_sessions)
 */
async function getTrainingAnalytics(userId, coachId, requestedTeamId = null) {
  try {
    const targetCoachId = coachId || userId;

    // Get team ID
    const teamId = await getCoachTeamId(targetCoachId, requestedTeamId);

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
    logger.error("coach_training_analytics_fetch_failed", error, {
      user_id: userId,
      coach_id: coachId,
    });
    throw error;
  }
}

/**
 * Create training session
 * Note: This is a WRITE operation, not subject to consent reading rules
 * Contract: Section 3.2 - Coach Modification APIs
 */
async function createTrainingSession(userId, sessionData, requestInfo = {}) {
  try {
    // Verify coach role
    const roleCheck = await requireRole(userId, ["coach", "admin"]);

    if (!roleCheck.authorized) {
      await logViolation(
        userId,
        null,
        "session",
        "create",
        "INSUFFICIENT_PERMISSIONS",
        "Coach role required",
        requestInfo,
      );
      throw new Error("Insufficient permissions: coach role required");
    }

    const targetUserId = sessionData.userId || sessionData.user_id;
    if (!targetUserId) {
      throw new Error("user_id is required");
    }
    const teamId = await getCoachTeamId(
      userId,
      sessionData.teamId || sessionData.team_id || null,
    );
    if (!teamId) {
      throw new Error("No team found for coach");
    }

    const { data: targetMember, error: memberError } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }
    if (!targetMember) {
      throw new Error("user_id must reference an active team member in coach team");
    }

    const session = {
      user_id: targetUserId,
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
      modified_by_coach_id: userId, // Set coach attribution
      session_state: "PLANNED", // Set initial state
      coach_locked: false, // New sessions are not locked by default
    };

    const { data, error } = await supabaseAdmin
      .from("training_sessions")
      .insert([session])
      .select()
      .single();

    if (error) {
      logger.error("coach_training_session_insert_failed", error, { user_id: userId });
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("coach_training_session_creation_failed", error, { user_id: userId });
    throw error;
  }
}

/**
 * Get games/fixtures
 */
async function getGames(userId, coachId, requestedTeamId = null) {
  try {
    const targetCoachId = coachId || userId;

    // Get teams where user is coach
    const teamId = await getCoachTeamId(targetCoachId, requestedTeamId);

    if (!teamId) {
      return [];
    }

    // Get games for this team
    const { data: games, error: gamesError } = await supabaseAdmin
      .from("games")
      .select("*")
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order("game_date", { ascending: true })
      .limit(10);

    if (gamesError) {
      logger.error("coach_games_fetch_failed", gamesError, {
        user_id: userId,
        team_id: teamId,
      });
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
    logger.error("coach_games_handler_failed", error, {
      user_id: userId,
      coach_id: coachId,
    });
    throw error;
  }
}

/**
 * Handle calendar requests (GET, POST, PUT, DELETE)
 */
async function handleCalendarRequest(event, userId, coachId) {
  let body = {};
  if (event.body) {
    try {
      body = parseJsonBody(event.body);
    } catch (error) {
      if (error?.isValidation) {
        return createErrorResponse(error.message, 422, "validation_error");
      }
      return createErrorResponse("Invalid JSON in request body", 400, "invalid_json");
    }
  }
  const query = event.queryStringParameters || {};
  const teamId = await getCoachTeamId(coachId, query.teamId || null);

  if (!teamId) {
    return createErrorResponse("No team found for coach", 404, "not_found");
  }

  try {
    if (event.httpMethod === "GET") {
      // Get calendar events
      let queryBuilder = supabaseAdmin
        .from("team_events")
        .select("*")
        .eq("team_id", teamId)
        .order("start_time", { ascending: true });

      if (query.start_date) {
        queryBuilder = queryBuilder.gte("start_time", query.start_date);
      }
      if (query.end_date) {
        queryBuilder = queryBuilder.lte("start_time", query.end_date);
      }
      if (query.event_type) {
        queryBuilder = queryBuilder.eq("event_type", query.event_type);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      // Transform to match component's expected format
      const events = (data || []).map((event) => ({
        id: event.id,
        title: event.title,
        type: event.event_type || "practice",
        date: event.start_time?.split("T")[0] || event.start_time,
        endDate: event.end_time?.split("T")[0],
        startTime: event.start_time?.split("T")[1]?.substring(0, 5) || "",
        endTime: event.end_time?.split("T")[1]?.substring(0, 5) || "",
        location: event.location || "",
        description: event.description || "",
        rsvpSummary: {
          going: 0,
          cantGo: 0,
          pending: 0,
        },
        rsvpDeadline: event.rsvp_deadline || null,
      }));

      return createSuccessResponse({ events });
    }

    if (event.httpMethod === "POST") {
      // Create new event
      const {
        type,
        title,
        date,
        startTime,
        endTime,
        location,
        description,
        requireRsvp,
        rsvpDeadline,
      } = body;

      if (!title || !String(title).trim()) {
        return createErrorResponse("title is required", 422, "validation_error");
      }
      if (!date || !isValidDate(date)) {
        return createErrorResponse("date must be a valid date", 422, "validation_error");
      }
      if (!startTime || !isValidTime(startTime)) {
        return createErrorResponse("startTime must be in HH:MM format", 422, "validation_error");
      }
      if (!endTime || !isValidTime(endTime)) {
        return createErrorResponse("endTime must be in HH:MM format", 422, "validation_error");
      }
      if (buildDateTime(date, startTime) >= buildDateTime(date, endTime)) {
        return createErrorResponse("endTime must be after startTime", 422, "validation_error");
      }
      if (type && !CALENDAR_EVENT_TYPES.has(type)) {
        return createErrorResponse(
          `type must be one of: ${Array.from(CALENDAR_EVENT_TYPES).join(", ")}`,
          422,
          "validation_error",
        );
      }
      if (rsvpDeadline && !isValidDate(rsvpDeadline)) {
        return createErrorResponse(
          "rsvpDeadline must be a valid date",
          422,
          "validation_error",
        );
      }

      // Combine date and time
      const startDateTime = buildDateTime(date, startTime);
      const endDateTime = buildDateTime(date, endTime);

      const { data, error } = await supabaseAdmin
        .from("team_events")
        .insert({
          team_id: teamId,
          event_type: type || "practice",
          title,
          description,
          location,
          start_time: startDateTime,
          end_time: endDateTime,
          is_mandatory: requireRsvp !== false,
          rsvp_deadline: rsvpDeadline || null,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(data, 201);
    }

    if (event.httpMethod === "PUT") {
      // Update event
      const eventId = query.id || body.id;
      if (!eventId) {
        return createErrorResponse("Event ID required", 400, "validation_error");
      }

      // Verify event belongs to coach's team
      const { data: existingEvent, error: fetchError } = await supabaseAdmin
        .from("team_events")
        .select("team_id")
        .eq("id", eventId)
        .single();

      if (fetchError || !existingEvent) {
        return createErrorResponse("Event not found", 404, "not_found");
      }

      if (existingEvent.team_id !== teamId) {
        return createErrorResponse("Not authorized", 403, "not_authorized");
      }

      const updates = {};
      if (body.type && !CALENDAR_EVENT_TYPES.has(body.type)) {
        return createErrorResponse(
          `type must be one of: ${Array.from(CALENDAR_EVENT_TYPES).join(", ")}`,
          422,
          "validation_error",
        );
      }
      if (body.date && !isValidDate(body.date)) {
        return createErrorResponse("date must be a valid date", 422, "validation_error");
      }
      if (body.startTime && !isValidTime(body.startTime)) {
        return createErrorResponse("startTime must be in HH:MM format", 422, "validation_error");
      }
      if (body.endTime && !isValidTime(body.endTime)) {
        return createErrorResponse("endTime must be in HH:MM format", 422, "validation_error");
      }
      if ((body.startTime || body.endTime) && !body.date) {
        return createErrorResponse(
          "date is required when startTime or endTime is provided",
          422,
          "validation_error",
        );
      }
      if (
        body.date &&
        body.startTime &&
        body.endTime &&
        buildDateTime(body.date, body.startTime) >= buildDateTime(body.date, body.endTime)
      ) {
        return createErrorResponse("endTime must be after startTime", 422, "validation_error");
      }
      if (body.rsvpDeadline !== undefined && body.rsvpDeadline !== null && !isValidDate(body.rsvpDeadline)) {
        return createErrorResponse(
          "rsvpDeadline must be a valid date",
          422,
          "validation_error",
        );
      }
      if (body.title) {
        updates.title = body.title;
      }
      if (body.type) {
        updates.event_type = body.type;
      }
      if (body.description !== undefined) {
        updates.description = body.description;
      }
      if (body.location) {
        updates.location = body.location;
      }
      if (body.date && body.startTime) {
        updates.start_time = buildDateTime(body.date, body.startTime);
      }
      if (body.date && body.endTime) {
        updates.end_time = buildDateTime(body.date, body.endTime);
      }
      if (body.rsvpDeadline !== undefined) {
        updates.rsvp_deadline = body.rsvpDeadline;
      }
      if (Object.keys(updates).length === 0) {
        return createErrorResponse("No updatable fields provided", 422, "validation_error");
      }

      const { data, error } = await supabaseAdmin
        .from("team_events")
        .update(updates)
        .eq("id", eventId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(data);
    }

    if (event.httpMethod === "DELETE") {
      // Delete event
      const eventId = query.id || body.id;
      if (!eventId) {
        return createErrorResponse("Event ID required", 400, "validation_error");
      }

      // Verify event belongs to coach's team
      const { data: existingEvent, error: fetchError } = await supabaseAdmin
        .from("team_events")
        .select("team_id")
        .eq("id", eventId)
        .single();

      if (fetchError || !existingEvent) {
        return createErrorResponse("Event not found", 404, "not_found");
      }

      if (existingEvent.team_id !== teamId) {
        return createErrorResponse("Not authorized", 403, "not_authorized");
      }

      const { error } = await supabaseAdmin
        .from("team_events")
        .delete()
        .eq("id", eventId);

      if (error) {
        throw error;
      }

      return createSuccessResponse({ success: true });
    }

    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  } catch (error) {
    logger.error("coach_calendar_request_failed", error, {
      user_id: userId,
      coach_id: coachId,
    });
    if (error.message?.includes("Invalid JSON")) {
      return createErrorResponse(error.message, 400, "invalid_json");
    }
    return createErrorResponse(
      error.message || "Failed to process calendar request",
      500,
      "server_error",
    );
  }
}

/**
 * Main handler function
 */
async function handleRequest(
  event,
  context,
  { userId, requestId, correlationId, requestLogger },
) {
  try {
    // Extract endpoint from path
    const path = event.path.replace("/.netlify/functions/coach", "") || "/";
    const endpoint = path.split("?")[0]; // Remove query params
    const query = event.queryStringParameters || {};
    const targetCoachId = await resolveTargetCoachId(userId, query.coachId);
    // Multi-team coaches select a team with ?teamId= (validated against their
    // staffed memberships); default = most recent active membership.
    const requestedTeamId = query.teamId || null;

    // Route to appropriate handler
    switch (endpoint) {
      case "/dashboard":
      case "": {
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const dashboard = await getCoachDashboard(targetCoachId, requestedTeamId);
        return createSuccessResponse(dashboard);
      }

      case "/team": {
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const teamResult = await getTeamInfo(userId, targetCoachId, requestedTeamId);
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
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const analytics = await getTrainingAnalytics(userId, targetCoachId, requestedTeamId);
        return createSuccessResponse(analytics);
      }

      case "/training-session": {
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const body = parseJsonBody(event.body);
        const session = await createTrainingSession(userId, body);
        return createSuccessResponse(session);
      }

      case "/team-message": {
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const body = parseJsonBody(event.body);
        const result = await createCoachTeamMessage(userId, body);
        return createSuccessResponse(result);
      }

      case "/access-request": {
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const body = parseJsonBody(event.body);
        const result = await createCoachAccessRequest(userId, body);
        return createSuccessResponse(result);
      }

      case "/games": {
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const games = await getGames(userId, targetCoachId, requestedTeamId);
        return createSuccessResponse(games);
      }

      case "/calendar": {
        return await handleCalendarRequest(event, userId, targetCoachId);
      }

      case "/roster/injuries": {
        // Aggregated injury/tightness report for all athletes the coach can see.
        // Returns active athlete_injuries rows for the team, sorted by severity.
        // Enables the coach to see which players have what tightness/injury at a glance.
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const injTeamId = event.queryStringParameters?.teamId;
        if (!injTeamId) {
          return createErrorResponse("teamId query param required", 422, "validation_error");
        }
        const resolvedInjTeamId = await getCoachTeamId(userId, injTeamId);
        if (!resolvedInjTeamId) {
          return createErrorResponse("Not authorized for this team", 403, "authorization_error");
        }

        // 1. Get roster player IDs for the team
        const { data: rosterMembers } = await supabaseAdmin
          .from("team_members")
          .select("user_id, users(id, full_name, first_name, last_name, position)")
          .eq("team_id", resolvedInjTeamId)
          .in("role", ["player", "athlete"])
          .eq("status", "active");

        const playerIds = (rosterMembers || []).map((m) => m.user_id);
        if (!playerIds.length) return createSuccessResponse({ injuries: [], summary: { total: 0 } });

        const playerMap = {};
        for (const m of rosterMembers || []) {
          const u = m.users;
          playerMap[m.user_id] = u?.full_name || `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "Athlete";
        }

        // 2. Active injuries across the roster
        const { data: injuries } = await supabaseAdmin
          .from("athlete_injuries")
          .select("user_id, injury_location, injury_grade, recovery_status, injury_mechanism, expected_return_date, notes, created_at")
          .in("user_id", playerIds)
          .in("recovery_status", ["active", "recovering", "rehab"])
          .order("created_at", { ascending: false });

        // 3. Today's wellness soreness (for athletes without a formal injury record)
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: wellnessRows } = await supabaseAdmin
          .from("daily_wellness_checkin")
          .select("user_id, muscle_soreness, soreness_areas, calculated_readiness")
          .in("user_id", playerIds)
          .eq("checkin_date", todayStr);

        const wellnessMap = {};
        for (const w of wellnessRows || []) {
          wellnessMap[w.user_id] = w;
        }

        const injuryReport = (injuries || []).map((i) => ({
          athleteId: i.user_id,
          athleteName: playerMap[i.user_id] ?? "Athlete",
          location: i.injury_location,
          grade: i.injury_grade,
          status: i.recovery_status,
          mechanism: i.injury_mechanism,
          expectedReturn: i.expected_return_date,
          notes: i.notes,
          reportedAt: i.created_at,
          todaySoreness: wellnessMap[i.user_id]?.muscle_soreness ?? null,
          todayReadiness: wellnessMap[i.user_id]?.calculated_readiness ?? null,
        }));

        // Athletes with high soreness today but no formal injury record
        const injuredIds = new Set((injuries || []).map((i) => i.user_id));
        const tightnessFlags = (wellnessRows || [])
          .filter((w) => !injuredIds.has(w.user_id) && w.muscle_soreness >= 6 && (w.soreness_areas || []).length > 0)
          .map((w) => ({
            athleteId: w.user_id,
            athleteName: playerMap[w.user_id] ?? "Athlete",
            location: (w.soreness_areas || []).join(", "),
            grade: w.muscle_soreness >= 8 ? "severe" : "moderate",
            status: "self_report",
            mechanism: "self_report",
            expectedReturn: null,
            notes: null,
            reportedAt: todayStr,
            todaySoreness: w.muscle_soreness,
            todayReadiness: w.calculated_readiness,
          }));

        const GRADE_ORDER = { severe: 0, "Grade 3": 0, moderate: 1, "Grade 2": 1, minor: 2, "Grade 1": 2 };
        const all = [...injuryReport, ...tightnessFlags]
          .sort((a, b) => (GRADE_ORDER[a.grade] ?? 3) - (GRADE_ORDER[b.grade] ?? 3));

        return createSuccessResponse({
          injuries: all,
          summary: {
            total: all.length,
            severe: all.filter((i) => i.grade === "severe" || i.grade === "Grade 3").length,
            moderate: all.filter((i) => i.grade === "moderate" || i.grade === "Grade 2").length,
            selfReports: tightnessFlags.length,
            checkinDate: todayStr,
          },
        });
      }

      case "/roster/training-cycle": {
        // Per-athlete training cycle summary for the coach: current phase, ACWR,
        // readiness trend (last 7 days), days to next event.
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        const tcTeamId = event.queryStringParameters?.teamId;
        if (!tcTeamId) {
          return createErrorResponse("teamId query param required", 422, "validation_error");
        }
        const resolvedTcTeamId = await getCoachTeamId(userId, tcTeamId);
        if (!resolvedTcTeamId) {
          return createErrorResponse("Not authorized for this team", 403, "authorization_error");
        }

        const { data: tcRoster } = await supabaseAdmin
          .from("team_members")
          .select("user_id, users(full_name, first_name, last_name)")
          .eq("team_id", resolvedTcTeamId)
          .in("role", ["player", "athlete"])
          .eq("status", "active");

        const tcPlayerIds = (tcRoster || []).map((m) => m.user_id);
        if (!tcPlayerIds.length) return createSuccessResponse({ athletes: [] });

        const tcPlayerMap = {};
        for (const m of tcRoster || []) {
          const u = m.users;
          tcPlayerMap[m.user_id] = u?.full_name || `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "Athlete";
        }

        // Last 7 days readiness per athlete
        const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
        const { data: readinessRows } = await supabaseAdmin
          .from("readiness_scores")
          .select("user_id, score, computed_at")
          .in("user_id", tcPlayerIds)
          .gte("created_at", since7)
          .order("created_at", { ascending: false });

        const readinessByPlayer = {};
        for (const r of readinessRows || []) {
          if (!readinessByPlayer[r.user_id]) readinessByPlayer[r.user_id] = [];
          readinessByPlayer[r.user_id].push(r.score);
        }

        // Today's protocols (current phase)
        const todayStr2 = new Date().toISOString().slice(0, 10);
        const { data: protocols } = await supabaseAdmin
          .from("daily_protocols")
          .select("user_id, training_focus, acwr_value")
          .in("user_id", tcPlayerIds)
          .eq("protocol_date", todayStr2);

        const protocolMap = {};
        for (const p of protocols || []) protocolMap[p.user_id] = p;

        // Upcoming events (all athletes share team events via athlete_events — use team_events)
        const { data: upcomingEvents } = await supabaseAdmin
          .from("team_events")
          .select("starts_at, name, event_type")
          .eq("team_id", resolvedTcTeamId)
          .gte("start_time", todayStr2)
          .order("start_time", { ascending: true })
          .limit(1);
        const nextEvent = upcomingEvents?.[0] ?? null;
        const daysToEvent = nextEvent
          ? Math.ceil((new Date(nextEvent.starts_at) - new Date()) / 86_400_000)
          : null;

        const athletes = tcPlayerIds.map((pid) => {
          const scores = readinessByPlayer[pid] ?? [];
          const avgReadiness = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
          const latestReadiness = scores[0] ?? null;
          const protocol = protocolMap[pid];
          return {
            athleteId: pid,
            athleteName: tcPlayerMap[pid],
            trainingFocus: protocol?.training_focus ?? null,
            acwr: protocol?.acwr_value ?? null,
            latestReadiness,
            avgReadiness7d: avgReadiness,
            readinessTrend: scores.slice(0, 7),
          };
        });

        return createSuccessResponse({
          athletes,
          nextTeamEvent: nextEvent ? {
            name: nextEvent.name,
            type: nextEvent.event_type,
            daysAway: daysToEvent,
          } : null,
        });
      }

      case "/health":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }
        return createSuccessResponse({
          status: "healthy",
          service: "coach-api",
        });

      default:
        return createErrorResponse("Endpoint not found", 404, "not_found");
    }
  } catch (error) {
    if (error?.isInvalidJson) {
      return createErrorResponse(error.message, 400, "invalid_json");
    }
    if (error.message.includes("Not authorized")) {
      return createErrorResponse(error.message, 403, "authorization_error");
    }
    if (
      error.message?.includes("is required") ||
      error.message?.includes("must be") ||
      error.message?.includes("must reference") ||
      error.message?.includes("active team member") ||
      error.message?.includes("Invalid")
    ) {
      return createErrorResponse(error.message, 422, "validation_error");
    }
    const log =
      requestLogger ||
      logger.child(
        buildRequestLogContext(event, {
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
          trace_id: correlationId,
        }),
      );
    log.error("coach_handler_failure", error, {
      user_id: userId,
      request_id: requestId,
      correlation_id: correlationId,
    });
    throw error;
  }
}

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET"
    ? "READ"
    : event.httpMethod === "DELETE"
      ? "DELETE"
      : "UPDATE";
  return baseHandler(event, context, {
    functionName: "Coach",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId, correlationId }) => {
      const requestLogger = logger.child(
        buildRequestLogContext(event, {
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
          trace_id: correlationId,
        }),
      );
      return handleRequest(event, _context, {
        userId,
        requestId,
        correlationId,
        requestLogger,
      });
    },
  });
};

export const testHandler = handler;
export { handler };
