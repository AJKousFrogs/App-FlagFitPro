import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.physio-protocol" });

/**
 * Physiotherapist Protocol Adherence Endpoints
 * - GET /api/physio-protocol/:athleteId/:injuryId: Fetch protocol adherence
 * - POST /api/physio-protocol/:athleteId/:injuryId: Update protocol progress
 *
 * Used by physiotherapists to track exercise compliance, pain levels,
 * and functional milestone achievement during RTP protocols.
 */

async function verifyPhysioAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (!hasAnyRole(role, [...LOAD_MANAGEMENT_ACCESS_ROLES, "physiotherapist"])) {
    return {
      authorized: false,
      message: "Not authorized to access physio protocol data",
    };
  }

  const { shared } = await sharesStaffedTeam(requestUserId, athleteId, {
    roles: [...LOAD_MANAGEMENT_ACCESS_ROLES, "physiotherapist"],
  });
  if (!shared) {
    return {
      authorized: false,
      message: "Not authorized to access athletes outside your team",
    };
  }

  return { authorized: true };
}

async function getPhysioProtocol(supabase, athleteId, injuryId, requestLogger) {
  try {
    const { data: rtp, error: rtpError } = await supabase
      .from("return_to_play_phases")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("injury_id", injuryId)
      .order("current_phase", { ascending: false })
      .limit(1)
      .single();

    if (rtpError && rtpError.code !== "PGRST116") {
      requestLogger.error("DB error fetching RTP phase", {
        code: rtpError.code,
      });
      return createErrorResponse("Failed to fetch protocol data", 500);
    }

    if (!rtp) {
      return createSuccessResponse({
        success: true,
        data: [],
        count: 0,
      });
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from("rtp_exercise_compliance")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("injury_id", injuryId)
      .eq("phase", rtp.current_phase);

    if (exercisesError) {
      requestLogger.error("DB error fetching exercises", {
        code: exercisesError.code,
      });
    }

    const { data: milestones, error: milestonesError } = await supabase
      .from("rtp_phase_milestones")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("injury_id", injuryId)
      .eq("phase", rtp.current_phase);

    if (milestonesError) {
      requestLogger.error("DB error fetching milestones", {
        code: milestonesError.code,
      });
    }

    const overallCompliance =
      exercises && exercises.length > 0
        ? Math.round(
            (exercises.reduce((sum, e) => sum + (e.compliance_percent || 0), 0) /
              exercises.length) *
              100
          ) / 100
        : 0;

    const snapshot = {
      athleteId,
      athleteName: rtp.athlete_name || "Unknown",
      injury_type: rtp.injury_type || "Unknown",
      injury_id: injuryId,
      current_phase: rtp.current_phase,
      phase_details: {
        phase: rtp.current_phase,
        phase_name: rtp.phase_name || `Phase ${rtp.current_phase}`,
        started_date: rtp.phase_start_date,
        target_duration_weeks: rtp.target_weeks || 4,
        weeks_elapsed:
          Math.floor(
            (new Date() -
              new Date(rtp.phase_start_date || new Date())) /
              (1000 * 60 * 60 * 24 * 7)
          ) + 1,
        completion_percent:
          Math.floor(
            ((new Date() - new Date(rtp.phase_start_date || new Date())) /
              ((rtp.target_weeks || 4) * 7 * 24 * 60 * 60 * 1000)) *
              100
          ) || 0,
        key_milestones: (milestones || []).map((m) => ({
          milestone: m.milestone_name,
          achieved: m.achieved,
          achieved_date: m.achieved_date,
        })),
        exercises: (exercises || []).map((e) => ({
          exercise_id: e.exercise_id,
          exercise_name: e.exercise_name,
          prescribed_sets: e.prescribed_sets,
          prescribed_reps: e.prescribed_reps,
          actual_sets_completed: e.actual_sets_completed || 0,
          compliance_percent: e.compliance_percent || 0,
          pain_during_exercise: e.pain_during_exercise || 0,
          progression_ready: e.progression_ready || false,
        })),
      },
      overall_compliance: overallCompliance,
      red_flags: rtp.red_flags || [],
      recommendations: rtp.clinical_recommendations || [],
      timestamp: new Date().toISOString(),
      lastModifiedBy: requestUserId,
    };

    return createSuccessResponse({
      success: true,
      data: [snapshot],
      count: 1,
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getPhysioProtocol", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

async function updatePhysioProtocol(
  supabase,
  athleteId,
  injuryId,
  payload,
  requestLogger
) {
  try {
    const {
      exerciseId,
      actualSetsCompleted,
      painLevel,
      progressionReady,
      milestoneId,
      achieved,
      achievedDate,
    } = payload;

    if (exerciseId) {
      const { error: updateError } = await supabase
        .from("rtp_exercise_compliance")
        .update({
          actual_sets_completed: actualSetsCompleted,
          pain_during_exercise: painLevel,
          progression_ready: progressionReady,
          updated_at: new Date().toISOString(),
        })
        .eq("exercise_id", exerciseId)
        .eq("athlete_id", athleteId)
        .eq("injury_id", injuryId);

      if (updateError) {
        requestLogger.error("DB error updating exercise", {
          code: updateError.code,
        });
        return createErrorResponse("Failed to update exercise", 500);
      }
    }

    if (milestoneId && achieved !== undefined) {
      const { error: milestoneError } = await supabase
        .from("rtp_phase_milestones")
        .update({
          achieved,
          achieved_date: achieved ? achievedDate || new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", milestoneId)
        .eq("athlete_id", athleteId)
        .eq("injury_id", injuryId);

      if (milestoneError) {
        requestLogger.error("DB error updating milestone", {
          code: milestoneError.code,
        });
        return createErrorResponse("Failed to update milestone", 500);
      }
    }

    return createSuccessResponse({
      success: true,
      message: "Protocol updated successfully",
    });
  } catch (err) {
    requestLogger.error("Unexpected error in updatePhysioProtocol", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

async function handler(event, context) {
  const requestLogger = buildRequestLogContext(logger, event);

  return baseHandler(
    event,
    context,
    async (supabase, requestUserId) => {
      const pathParts = event.path.split("/").filter((p) => p);
      const athleteId = pathParts[3];
      const injuryId = pathParts[4];

      if (!athleteId || !injuryId) {
        return handleValidationError("athleteId and injuryId required");
      }

      const access = await verifyPhysioAccess(requestUserId, athleteId);
      if (!access.authorized) {
        return createErrorResponse(access.message, 403);
      }

      if (event.httpMethod === "GET") {
        return getPhysioProtocol(supabase, athleteId, injuryId, requestLogger);
      }

      if (event.httpMethod === "POST") {
        const payload = tryParseJsonObjectBody(event.body);
        if (!payload) {
          return createErrorResponse("Invalid JSON body", 400);
        }
        return updatePhysioProtocol(
          supabase,
          athleteId,
          injuryId,
          payload,
          requestLogger
        );
      }

      return createErrorResponse("Method not allowed", 405);
    },
    requestLogger
  );
}

export { handler };
