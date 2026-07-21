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

const logger = createLogger({ service: "netlify.rtp-create-assignment" });

/**
 * Create RTP Protocol Assignment
 * POST /api/rtp/assignments
 *
 * Physiotherapist-protected endpoint. Creates a new protocol assignment for an athlete's injury.
 * Payload: { athleteId, injuryId, protocolId, individualModifiers }
 * Calculates initial estimated return date and sets current_phase to 1.
 */

async function createAssignment(supabase, payload, requestLogger) {
  const { athleteId, injuryId, protocolId, individualModifiers } = payload;

  if (!athleteId || !injuryId || !protocolId) {
    return createErrorResponse(
      "Missing required fields: athleteId, injuryId, protocolId",
      400
    );
  }

  try {
    // Verify injury exists and belongs to athlete
    const { data: injury, error: injuryError } = await supabase
      .from("athlete_injuries")
      .select("id, athlete_id, injury_type")
      .eq("id", injuryId)
      .eq("athlete_id", athleteId)
      .single();

    if (injuryError) {
      return createErrorResponse("Injury not found for this athlete", 404);
    }

    // Verify protocol exists
    const { data: protocol, error: protocolError } = await supabase
      .from("rtp_protocol_definitions")
      .select("id, injury_type, typical_rtp_timeline_days_min")
      .eq("id", protocolId)
      .single();

    if (protocolError) {
      return createErrorResponse("Protocol not found", 404);
    }

    // Check if assignment already exists
    const { data: existingAssignment, error: existingError } = await supabase
      .from("rtp_athlete_protocol_assignments")
      .select("id")
      .eq("athlete_id", athleteId)
      .eq("injury_id", injuryId)
      .single();

    if (existingAssignment) {
      return createErrorResponse(
        "Protocol assignment already exists for this injury",
        409
      );
    }

    // Calculate estimated return date (total timeline)
    let estimatedReturnDate = null;
    if (protocol.typical_rtp_timeline_days_min) {
      const returnDate = new Date();
      returnDate.setDate(
        returnDate.getDate() + protocol.typical_rtp_timeline_days_min
      );
      estimatedReturnDate = returnDate.toISOString().split("T")[0];
    }

    // Create assignment
    const { data: assignment, error: insertError } = await supabase
      .from("rtp_athlete_protocol_assignments")
      .insert({
        athlete_id: athleteId,
        injury_id: injuryId,
        protocol_id: protocolId,
        current_phase: 1,
        phase_start_date: new Date().toISOString().split("T")[0],
        estimated_return_date: estimatedReturnDate,
        individual_modifiers: individualModifiers || {},
        biological_maturity_gate_passed: false,
      })
      .select()
      .single();

    if (insertError) {
      requestLogger.error("DB error creating assignment", {
        code: insertError.code,
      });
      return createErrorResponse("Failed to create protocol assignment", 500);
    }

    return createSuccessResponse({
      success: true,
      assignment,
      message: `Protocol assigned for ${protocol.injury_type}. Estimated return: ${estimatedReturnDate}`,
    });
  } catch (err) {
    requestLogger.error("Unexpected error in createAssignment", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "rtp-create-assignment",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = buildRequestLogContext(logger, event);

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, PHYSIOTHERAPIST_ROLES)) {
        return createErrorResponse(
          "Not authorized to create protocol assignments",
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
      return createAssignment(supabase, payload, requestLogger);
    },
  });

export { handler };
