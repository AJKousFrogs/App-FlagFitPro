import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import {
  tryParseJsonObjectBody,
  isFiniteNumber,
} from "./utils/input-validator.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.rtp-phase-progress" });

/**
 * RTP Phase Progress Tracking Endpoints
 * - POST /api/rtp/phase-progress: Update weekly RTP progress
 * - GET /api/rtp/phase-progress/:athleteId/:injuryId: Fetch progress history
 *
 * Used by coaches to track functional criteria compliance and gate advancement.
 * Criteria: strength LSI ≥90%, hop tests ≥90%, ACL-RSI ≥56, TSK-11 <37
 */

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
    return {
      authorized: false,
      message: "Not authorized to manage RTP for another athlete",
    };
  }

  const { shared } = await sharesStaffedTeam(requestUserId, athleteId, {
    roles: LOAD_MANAGEMENT_ACCESS_ROLES,
  });
  if (!shared) {
    return {
      authorized: false,
      message: "Not authorized to access athletes outside your team",
    };
  }

  return { authorized: true };
}

async function updateRtpProgress(supabase, payload, requestLogger) {
  const {
    athleteId,
    injuryId,
    weekEnding,
    currentRtpPhase,
    strengthLsiPct,
    hopTestBatteryPct,
    aclRsiPct,
    tsk11Normalized,
    biomechanicsSymmetrical,
    athleteConfidence,
    coachConfidence,
    painLevel,
    acwrTargetMin,
    acwrTargetMax,
    acwrCompliancePct,
    readyForNextPhase,
    coachNotes,
  } = payload;

  // Validate required fields
  if (!athleteId || !injuryId || !weekEnding) {
    return {
      error: handleValidationError(
        "athleteId, injuryId, and weekEnding are required"
      ),
    };
  }

  // Validate week_ending is a valid date
  const weekDate = new Date(weekEnding);
  if (Number.isNaN(weekDate.getTime())) {
    return {
      error: handleValidationError("weekEnding must be a valid date"),
    };
  }

  const rtpPayload = {
    user_id: athleteId,
    injury_id: injuryId,
    week_ending: weekEnding,
    current_rtp_phase: currentRtpPhase ?? 0,
    strength_lsi_pct: isFiniteNumber(strengthLsiPct) ? strengthLsiPct : null,
    hop_test_battery_pct: isFiniteNumber(hopTestBatteryPct)
      ? hopTestBatteryPct
      : null,
    acl_rsi_pct: isFiniteNumber(aclRsiPct) ? aclRsiPct : null,
    tsk11_normalized: tsk11Normalized ?? false,
    biomechanics_symmetrical: biomechanicsSymmetrical ?? false,
    athlete_confidence_1_10: isFiniteNumber(athleteConfidence)
      ? athleteConfidence
      : null,
    coach_confidence_1_10: isFiniteNumber(coachConfidence)
      ? coachConfidence
      : null,
    pain_level_0_10: isFiniteNumber(painLevel) ? painLevel : null,
    acwr_target_min: isFiniteNumber(acwrTargetMin) ? acwrTargetMin : null,
    acwr_target_max: isFiniteNumber(acwrTargetMax) ? acwrTargetMax : null,
    acwr_compliance_pct: isFiniteNumber(acwrCompliancePct)
      ? acwrCompliancePct
      : null,
    ready_for_next_phase: readyForNextPhase ?? false,
    coach_notes: coachNotes ?? null,
  };

  const { data, error } = await supabase
    .from("rtp_phase_progress")
    .upsert(rtpPayload, {
      onConflict: "user_id,injury_id,week_ending",
    })
    .select()
    .single();

  if (error) {
    requestLogger.error("rtp_progress_upsert_failed", error, {
      athlete_id: athleteId,
      injury_id: injuryId,
      week_ending: weekEnding,
    });
    return { error };
  }

  requestLogger.info("rtp_progress_updated", {
    athlete_id: athleteId,
    injury_id: injuryId,
    week_ending: weekEnding,
    phase: currentRtpPhase,
    ready_for_next: readyForNextPhase,
  });

  return { data };
}

async function getRtpProgressHistory(supabase, athleteId, injuryId) {
  const { data, error } = await supabase
    .from("rtp_phase_progress")
    .select("*")
    .eq("user_id", athleteId)
    .eq("injury_id", injuryId)
    .order("week_ending", { ascending: false });

  return { data, error };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "rtp-phase-progress",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId, correlationId }) => {
      const requestLogger = logger.child(
        buildRequestLogContext(evt, {
          function_name: "rtp-phase-progress",
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
        })
      );

      try {
        if (evt.httpMethod === "GET") {
          // GET /api/rtp/phase-progress?athleteId=X&injuryId=Y
          const { athleteId, injuryId } = evt.queryStringParameters || {};

          if (!athleteId || !injuryId) {
            return handleValidationError(
              "athleteId and injuryId are required"
            );
          }

          const access = await verifyAthleteAccess(userId, athleteId);
          if (!access.authorized) {
            return createErrorResponse(access.message, 403, "authorization_error");
          }

          const { data, error } = await getRtpProgressHistory(
            supabaseAdmin,
            athleteId,
            injuryId
          );

          if (error) {
            requestLogger.error("rtp_progress_fetch_failed", error);
            return createErrorResponse(
              "Failed to fetch RTP progress history",
              500,
              "database_error"
            );
          }

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data,
              count: data?.length || 0,
            }),
          };
        }

        // POST /api/rtp/phase-progress
        if (evt.httpMethod === "POST") {
          const parsedBody = tryParseJsonObjectBody(evt.body);
          if (!parsedBody.ok) {
            return parsedBody.error;
          }

          const payload = parsedBody.data;
          const { athleteId } = payload;

          if (!athleteId) {
            return handleValidationError("athleteId is required");
          }

          const access = await verifyAthleteAccess(userId, athleteId);
          if (!access.authorized) {
            return createErrorResponse(access.message, 403, "authorization_error");
          }

          const result = await updateRtpProgress(
            supabaseAdmin,
            payload,
            requestLogger
          );
          if (result.error) {
            // If error is already a full HTTP response (from validation), return it directly
            if (result.error.statusCode) {
              return result.error;
            }
            // Otherwise treat as database error
            return createErrorResponse(
              "Failed to update RTP progress",
              500,
              "database_error"
            );
          }

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: result.data,
              message: "RTP progress updated successfully",
            }),
          };
        }

        return createErrorResponse("Method not allowed", 405, "method_not_allowed");
      } catch (error) {
        requestLogger.error("rtp_phase_progress_request_failed", error);
        return createErrorResponse(
          "Failed to process RTP phase progress request",
          500,
          "server_error"
        );
      }
    },
  });
};

export { handler };
