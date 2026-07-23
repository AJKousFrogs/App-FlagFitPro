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

const logger = createLogger({ service: "netlify.rtp-advance-phase" });

/**
 * Advance RTP Protocol Phase
 * PATCH /api/rtp/athletes/:athleteId/:injuryId/phase
 *
 * Physiotherapist-protected endpoint. Advances athlete to next phase if criteria are met.
 * Returns: updated assignment with new phase, estimated return date
 */

async function advancePhase(supabase, athleteId, injuryId, requestLogger) {
  try {
    // Get current assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("rtp_athlete_protocol_assignments")
      .select(
        "id, athlete_id, injury_id, protocol_id, current_phase, phase_start_date"
      )
      .eq("athlete_id", athleteId)
      .eq("injury_id", injuryId)
      .single();

    if (assignmentError) {
      return createErrorResponse("Protocol assignment not found", 404);
    }

    // Cannot advance beyond phase 5
    if (assignment.current_phase >= 5) {
      return createErrorResponse(
        "Athlete is already at final phase (Return to Sport)",
        400
      );
    }

    const nextPhase = assignment.current_phase + 1;

    // Get criteria required for next phase
    const { data: nextPhaseCriteria, error: criteriaError } = await supabase
      .from("rtp_functional_criteria")
      .select("id, criteria_name")
      .eq("protocol_id", assignment.protocol_id)
      .eq("phase_required", nextPhase);

    if (criteriaError) {
      requestLogger.warn("DB error fetching criteria", { code: criteriaError.code });
    }

    // If criteria exist, verify all are passed
    if (nextPhaseCriteria && nextPhaseCriteria.length > 0) {
      const { data: passedAssessments, error: assessmentError } = await supabase
        .from("rtp_criteria_assessments")
        .select("criteria_id")
        .eq("assignment_id", assignment.id)
        .eq("pass_fail", true)
        .in(
          "criteria_id",
          nextPhaseCriteria.map((c) => c.id)
        );

      if (assessmentError) {
        requestLogger.error("DB error checking assessments", {
          code: assessmentError.code,
        });
        return createErrorResponse("Failed to verify criteria", 500);
      }

      // "DISTINCT criteria_id" isn't valid PostgREST select syntax (it's not
      // SQL) — was previously failing the query whenever any criteria
      // existed for the next phase. Dedupe in JS instead: a criterion can
      // have multiple pass_fail=true assessment rows over time, but only
      // counts once toward "all criteria passed".
      const passedCount = passedAssessments
        ? new Set(passedAssessments.map((a) => a.criteria_id)).size
        : 0;
      if (passedCount < nextPhaseCriteria.length) {
        return createErrorResponse(
          `Not all criteria passed for phase ${nextPhase}. Passed: ${passedCount}/${nextPhaseCriteria.length}`,
          400
        );
      }
    }

    // Get protocol to calculate estimated return date
    const { data: protocol, error: protocolError } = await supabase
      .from("rtp_protocol_definitions")
      .select("typical_rtp_timeline_days_min")
      .eq("id", assignment.protocol_id)
      .single();

    if (protocolError) {
      requestLogger.warn("DB error fetching protocol", {
        code: protocolError.code,
      });
    }

    // Calculate estimated return date based on next phase
    let estimatedReturnDate = null;
    if (protocol && protocol.typical_rtp_timeline_days_min) {
      const timelineForPhase =
        (nextPhase * protocol.typical_rtp_timeline_days_min) / 5;
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + timelineForPhase);
      estimatedReturnDate = returnDate.toISOString().split("T")[0];
    }

    // Update assignment with new phase
    const { data: updatedAssignment, error: updateError } = await supabase
      .from("rtp_athlete_protocol_assignments")
      .update({
        current_phase: nextPhase,
        phase_start_date: new Date().toISOString().split("T")[0],
        estimated_return_date: estimatedReturnDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignment.id)
      .select()
      .single();

    if (updateError) {
      requestLogger.error("DB error updating phase", {
        code: updateError.code,
      });
      return createErrorResponse("Failed to advance phase", 500);
    }

    // Get next phase details
    const { data: nextPhaseDetails, error: nextPhaseError } = await supabase
      .from("rtp_protocol_phases")
      .select("id, phase_name, week_start, week_end, description")
      .eq("protocol_id", assignment.protocol_id)
      .eq("phase_number", nextPhase)
      .single();

    if (nextPhaseError) {
      requestLogger.warn("DB error fetching next phase details", {
        code: nextPhaseError.code,
      });
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        assignment: updatedAssignment,
        nextPhaseDetails: nextPhaseDetails || null,
        message: `Advanced to ${nextPhaseDetails?.phase_name || `Phase ${nextPhase}`}`,
      }),
    };
  } catch (err) {
    requestLogger.error("Unexpected error in advancePhase", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "rtp-advance-phase",
    allowedMethods: ["PATCH"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = buildRequestLogContext(logger, event);

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, PHYSIOTHERAPIST_ROLES)) {
        return createErrorResponse(
          "Not authorized to advance phases",
          403
        );
      }

      // Extract athleteId and injuryId from path
      const pathParts = event.path.split("/");
      const athleteId = pathParts[pathParts.length - 3];
      const injuryId = pathParts[pathParts.length - 2];

      if (!athleteId || !injuryId) {
        return createErrorResponse(
          "Missing athleteId or injuryId in path",
          400
        );
      }

      const supabase = getSupabaseClient();
      return advancePhase(supabase, athleteId, injuryId, requestLogger);
    },
  });

export { handler };
