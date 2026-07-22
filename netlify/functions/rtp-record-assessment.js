import { getSupabaseClient } from "./utils/auth-helper.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, PHYSIOTHERAPIST_ROLES } from "./utils/role-sets.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.rtp-record-assessment" });

/**
 * Record RTP Functional Criteria Assessment
 * POST /api/rtp/assessments
 *
 * Physiotherapist-protected endpoint. Records assessment result for a functional criterion.
 * Payload: { assignmentId, criteriaId, assessedValue, pass_fail, notes }
 */

async function recordAssessment(
  supabase,
  userId,
  payload,
  requestLogger
) {
  const { assignmentId, criteriaId, assessedValue, pass_fail, notes } =
    payload;

  if (!assignmentId || !criteriaId || assessedValue === undefined) {
    return createErrorResponse(
      "Missing required fields: assignmentId, criteriaId, assessedValue",
      400
    );
  }

  try {
    // Verify assignment exists
    const { data: assignment, error: assignmentError } = await supabase
      .from("rtp_athlete_protocol_assignments")
      .select("id, athlete_id, current_phase, protocol_id")
      .eq("id", assignmentId)
      .single();

    if (assignmentError) {
      return createErrorResponse("Protocol assignment not found", 404);
    }

    // Verify criteria exists and belongs to this protocol
    const { data: criteria, error: criteriaError } = await supabase
      .from("rtp_functional_criteria")
      .select("id, criteria_name, phase_required")
      .eq("id", criteriaId)
      .eq("protocol_id", assignment.protocol_id)
      .single();

    if (criteriaError) {
      return createErrorResponse("Criteria not found for this protocol", 404);
    }

    // Record assessment
    const { data: assessment, error: insertError } = await supabase
      .from("rtp_criteria_assessments")
      .insert({
        assignment_id: assignmentId,
        criteria_id: criteriaId,
        assessed_date: new Date().toISOString().split("T")[0],
        assessed_value: assessedValue,
        pass_fail: pass_fail === true,
        notes: notes || null,
        assessed_by_staff_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      requestLogger.error("DB error recording assessment", {
        code: insertError.code,
      });
      return createErrorResponse("Failed to record assessment", 500);
    }

    // Check if all criteria for next phase are now met
    let phaseAdvancementEligible = false;
    let nextPhase = null;

    if (assignment.current_phase < 5) {
      const { data: nextPhaseCriteria } = await supabase
        .from("rtp_functional_criteria")
        .select("id, criteria_name")
        .eq("protocol_id", assignment.protocol_id)
        .eq("phase_required", assignment.current_phase + 1);

      if (nextPhaseCriteria && nextPhaseCriteria.length > 0) {
        // Check if all next-phase criteria are passed
        const { data: passedForNextPhase } = await supabase
          .from("rtp_criteria_assessments")
          .select("DISTINCT criteria_id")
          .eq("assignment_id", assignmentId)
          .eq("pass_fail", true)
          .in(
            "criteria_id",
            nextPhaseCriteria.map((c) => c.id)
          );

        phaseAdvancementEligible =
          passedForNextPhase &&
          passedForNextPhase.length === nextPhaseCriteria.length;
        nextPhase = assignment.current_phase + 1;
      } else {
        // No criteria required for next phase — eligible to advance
        phaseAdvancementEligible = true;
        nextPhase = assignment.current_phase + 1;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        assessment,
        phaseAdvancementEligible,
        nextPhase,
      }),
    };
  } catch (err) {
    requestLogger.error("Unexpected error in recordAssessment", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "rtp-record-assessment",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = buildRequestLogContext(logger, event);

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, PHYSIOTHERAPIST_ROLES)) {
        return createErrorResponse(
          "Not authorized to record assessments",
          403
        );
      }

      let payload;
      try {
        payload = JSON.parse(event.body);
      } catch (err) {
        return createErrorResponse("Invalid JSON body", 400);
      }

      const supabase = getSupabaseClient();
      return recordAssessment(supabase, userId, payload, requestLogger);
    },
  });

export { handler };
