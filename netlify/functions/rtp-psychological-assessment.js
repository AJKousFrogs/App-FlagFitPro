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

const logger = createLogger({
  service: "netlify.rtp-psychological-assessment",
});

/**
 * Psychological Readiness Assessment Endpoints
 * - POST /api/rtp/psychological-assessment: Log ACL-RSI, TSK-11, confidence
 * - GET /api/rtp/psychological-assessment/:athleteId: Fetch assessment history
 *
 * ACL-RSI ≥56/100 correlates r=0.56 with successful return-to-sport
 * TSK-11 <37 indicates low fear-avoidance (psychological readiness)
 *
 * Used by coaches/psychologists to gate RTP advancement on psychological safety.
 */

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (
    !hasAnyRole(role, [
      ...LOAD_MANAGEMENT_ACCESS_ROLES,
      "psychologist",
      "sport_psychologist",
    ])
  ) {
    return {
      authorized: false,
      message: "Not authorized to access psychological assessments",
    };
  }

  const { shared } = await sharesStaffedTeam(requestUserId, athleteId, {
    roles: [
      ...LOAD_MANAGEMENT_ACCESS_ROLES,
      "psychologist",
      "sport_psychologist",
    ],
  });
  if (!shared) {
    return {
      authorized: false,
      message: "Not authorized to access athletes outside your team",
    };
  }

  return { authorized: true };
}

async function logPsychologicalAssessment(supabase, payload, requestLogger) {
  const {
    athleteId,
    assessmentDate,
    injuryId,
    aclRsiScore,
    tsk11Score,
    confidence,
    copingStrategies,
  } = payload;

  // Validate required fields
  if (!athleteId || !assessmentDate) {
    return {
      error: handleValidationError(
        "athleteId and assessmentDate are required"
      ),
    };
  }

  // Validate assessment date
  const assessDate = new Date(assessmentDate);
  if (Number.isNaN(assessDate.getTime())) {
    return {
      error: handleValidationError("assessmentDate must be a valid date"),
    };
  }

  // Validate ACL-RSI score (0-100)
  if (aclRsiScore !== undefined && aclRsiScore !== null) {
    if (!isFiniteNumber(aclRsiScore) || aclRsiScore < 0 || aclRsiScore > 100) {
      return {
        error: handleValidationError(
          "aclRsiScore must be between 0 and 100"
        ),
      };
    }
  }

  // Validate TSK-11 score (11-55)
  if (tsk11Score !== undefined && tsk11Score !== null) {
    if (!isFiniteNumber(tsk11Score) || tsk11Score < 11 || tsk11Score > 55) {
      return {
        error: handleValidationError(
          "tsk11Score must be between 11 and 55"
        ),
      };
    }
  }

  // Validate confidence (1-10)
  if (confidence !== undefined && confidence !== null) {
    if (!isFiniteNumber(confidence) || confidence < 1 || confidence > 10) {
      return {
        error: handleValidationError("confidence must be between 1 and 10"),
      };
    }
  }

  const assessmentPayload = {
    user_id: athleteId,
    assessment_date: assessmentDate,
    injury_id: injuryId || null,
    acl_rsi_score: isFiniteNumber(aclRsiScore) ? aclRsiScore : null,
    tsk11_score: isFiniteNumber(tsk11Score) ? tsk11Score : null,
    confidence_1_10: isFiniteNumber(confidence) ? confidence : null,
    coping_strategies: copingStrategies ?? null,
  };

  const { data, error } = await supabase
    .from("psychological_assessments")
    .upsert(assessmentPayload, {
      onConflict: "user_id,assessment_date,injury_id",
    })
    .select()
    .single();

  if (error) {
    requestLogger.error("psych_assessment_upsert_failed", error, {
      athlete_id: athleteId,
      assessment_date: assessmentDate,
      injury_id: injuryId,
    });
    return { error };
  }

  // Log assessment readiness gates
  const aclRsiReady = aclRsiScore !== undefined && aclRsiScore >= 56;
  const tsk11Ready = tsk11Score !== undefined && tsk11Score < 37;
  const overallReady = aclRsiReady && tsk11Ready;

  requestLogger.info("psych_assessment_logged", {
    athlete_id: athleteId,
    assessment_date: assessmentDate,
    acl_rsi_score: aclRsiScore,
    acl_rsi_ready: aclRsiReady,
    tsk11_score: tsk11Score,
    tsk11_ready: tsk11Ready,
    overall_psych_ready: overallReady,
  });

  return { data, aclRsiReady, tsk11Ready, overallReady };
}

async function getPsychologicalHistory(supabase, athleteId, limit = 10) {
  const { data, error } = await supabase
    .from("psychological_assessments")
    .select("*")
    .eq("user_id", athleteId)
    .order("assessment_date", { ascending: false })
    .limit(limit);

  return { data, error };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "rtp-psychological-assessment",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId, correlationId }) => {
      const requestLogger = logger.child(
        buildRequestLogContext(evt, {
          function_name: "rtp-psychological-assessment",
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
        })
      );

      try {
        if (evt.httpMethod === "GET") {
          // GET /api/rtp/psychological-assessment?athleteId=X&limit=10
          const { athleteId, limit } = evt.queryStringParameters || {};

          if (!athleteId) {
            return handleValidationError("athleteId is required");
          }

          const access = await verifyAthleteAccess(userId, athleteId);
          if (!access.authorized) {
            return createErrorResponse(access.message, 403, "authorization_error");
          }

          const limitNum = limit ? parseInt(limit, 10) : 10;
          if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return handleValidationError("limit must be between 1 and 100");
          }

          const { data, error } = await getPsychologicalHistory(
            supabaseAdmin,
            athleteId,
            limitNum
          );

          if (error) {
            requestLogger.error("psych_history_fetch_failed", error);
            return createErrorResponse(
              "Failed to fetch psychological assessment history",
              500,
              "database_error"
            );
          }

          // Compute readiness status from latest assessment
          const latest = data?.[0];
          const latestStatus = {
            aclRsiReady: latest?.acl_rsi_score
              ? latest.acl_rsi_score >= 56
              : null,
            tsk11Ready: latest?.tsk11_score
              ? latest.tsk11_score < 37
              : null,
            overallReady:
              latest?.acl_rsi_score &&
              latest?.tsk11_score &&
              latest.acl_rsi_score >= 56 &&
              latest.tsk11_score < 37,
          };

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data,
              latestStatus,
              count: data?.length || 0,
            }),
          };
        }

        // POST /api/rtp/psychological-assessment
        if (evt.httpMethod === "POST") {
          const parsedBody = tryParseJsonObjectBody(evt.body);
          if (!parsedBody.ok) {
            return parsedBody.error;
          }

          const payload = parsedBody.data;
          const { athleteId } = payload;

          // Validate athleteId exists before checking authorization
          if (!athleteId) {
            return handleValidationError("athleteId is required");
          }

          const access = await verifyAthleteAccess(userId, athleteId);
          if (!access.authorized) {
            return createErrorResponse(access.message, 403, "authorization_error");
          }

          const result = await logPsychologicalAssessment(
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
              "Failed to log psychological assessment",
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
              readinessStatus: {
                aclRsiReady: result.aclRsiReady,
                tsk11Ready: result.tsk11Ready,
                overallReady: result.overallReady,
              },
              message: "Psychological assessment logged successfully",
            }),
          };
        }

        return createErrorResponse("Method not allowed", 405, "method_not_allowed");
      } catch (error) {
        requestLogger.error("psych_assessment_request_failed", error);
        return createErrorResponse(
          "Failed to process psychological assessment request",
          500,
          "server_error"
        );
      }
    },
  });
};

export { handler };
