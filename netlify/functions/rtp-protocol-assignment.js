import { getSupabaseClient } from "./utils/auth-helper.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.rtp-protocol-assignment" });

/**
 * RTP Protocol Assignment Endpoint
 * GET /api/rtp/protocols/:athleteId/:injuryId
 *
 * Staff-protected endpoint. Returns current protocol assignment for an athlete's injury.
 * Includes: protocol definition, current phase, phase start date, estimated return date,
 * individual modifiers, and progress toward next phase (criteria assessment status).
 */

async function getProtocolAssignment(
  supabase,
  athleteId,
  injuryId,
  requestLogger
) {
  try {
    // Get protocol assignment with protocol definition
    const { data: assignment, error: assignmentError } = await supabase
      .from("rtp_athlete_protocol_assignments")
      .select(
        `
        id,
        athlete_id,
        injury_id,
        protocol_id,
        current_phase,
        phase_start_date,
        estimated_return_date,
        individual_modifiers,
        biological_maturity_gate_passed,
        created_at,
        updated_at,
        rtp_protocol_definitions (
          id,
          injury_type,
          display_name,
          evidence_grade,
          typical_rtp_timeline_days_min,
          typical_rtp_timeline_days_max,
          rts_rate_percent,
          description,
          key_studies
        )
      `
      )
      .eq("athlete_id", athleteId)
      .eq("injury_id", injuryId)
      .single();

    if (assignmentError) {
      if (assignmentError.code === "PGRST116") {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            success: true,
            assignment: null,
            message: "No protocol assignment found for this injury",
          }),
        };
      }
      requestLogger.error("DB error fetching assignment", {
        code: assignmentError.code,
      });
      return createErrorResponse("Failed to fetch protocol assignment", 500);
    }

    // Get current phase definition
    const { data: currentPhase, error: phaseError } = await supabase
      .from("rtp_protocol_phases")
      .select(
        "id, phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones"
      )
      .eq("protocol_id", assignment.protocol_id)
      .eq("phase_number", assignment.current_phase)
      .single();

    if (phaseError && phaseError.code !== "PGRST116") {
      requestLogger.warn("DB error fetching current phase", {
        code: phaseError.code,
      });
    }

    // Get functional criteria for current phase
    const { data: criteria, error: criteriaError } = await supabase
      .from("rtp_functional_criteria")
      .select(
        "id, criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required"
      )
      .eq("protocol_id", assignment.protocol_id)
      .lte("phase_required", assignment.current_phase);

    if (criteriaError) {
      requestLogger.warn("DB error fetching criteria", {
        code: criteriaError.code,
      });
    }

    // Get assessment status for current phase criteria
    const { data: assessments, error: assessmentsError } = await supabase
      .from("rtp_criteria_assessments")
      .select("criteria_id, assessed_value, pass_fail, assessed_date")
      .eq("assignment_id", assignment.id)
      .order("assessed_date", { ascending: false });

    if (assessmentsError) {
      requestLogger.warn("DB error fetching assessments", {
        code: assessmentsError.code,
      });
    }

    // Map criteria with latest assessment status
    const criteriaWithStatus = (criteria || []).map((criterion) => {
      const latestAssessment = (assessments || []).find(
        (a) => a.criteria_id === criterion.id
      );
      return {
        ...criterion,
        latestAssessment: latestAssessment || null,
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        assignment: {
          ...assignment,
          currentPhase: currentPhase || null,
          criteria: criteriaWithStatus,
        },
      }),
    };
  } catch (err) {
    requestLogger.error("Unexpected error in getProtocolAssignment", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "rtp-protocol-assignment",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse("Not authorized to view protocols", 403);
      }

      // Extract athleteId and injuryId from path
      const pathParts = event.path.split("/");
      const athleteId = pathParts[pathParts.length - 2];
      const injuryId = pathParts[pathParts.length - 1];

      if (!athleteId || !injuryId) {
        return createErrorResponse(
          "Missing athleteId or injuryId in path",
          400
        );
      }

      const supabase = getSupabaseClient();
      return getProtocolAssignment(supabase, athleteId, injuryId, requestLogger);
    },
  });

export { handler };
