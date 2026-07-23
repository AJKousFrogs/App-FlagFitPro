import { baseHandler } from "./utils/base-handler.js";
import {
  LOAD_MANAGEMENT_ACCESS_ROLES,
  hasAnyRole,
} from "./utils/role-sets.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { getSupabaseClient } from "./utils/auth-helper.js";
import { getUserRole } from "./utils/authorization-guard.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.rtp-all-protocols" });

async function getAllProtocols(supabase, requestLogger) {
  try {
    const { data: assignments, error: assignError } = await supabase
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
        rtp_protocol_definitions(
          id,
          injury_type,
          display_name,
          evidence_grade,
          typical_rtp_timeline_days_min,
          typical_rtp_timeline_days_max,
          rts_rate_percent,
          description,
          key_studies
        ),
        rtp_protocol_phases(
          id,
          phase_number,
          phase_name,
          week_start,
          week_end,
          acwr_target_min,
          acwr_target_max,
          description,
          activities,
          restrictions,
          pain_level_max,
          key_milestones
        ),
        rtp_functional_criteria!inner(id, phase_required, latestAssessment:rtp_criteria_assessments(pass_fail))
        `
      )
      .neq("updated_at", null)
      .order("estimated_return_date", { ascending: true });

    if (assignError) {
      requestLogger.error("DB error fetching protocols", {
        code: assignError.code,
      });
      return createErrorResponse("Failed to fetch protocols", 500);
    }

    if (!assignments || assignments.length === 0) {
      return createSuccessResponse({
        protocols: [],
        phaseProgress: {},
        count: 0,
      });
    }

    // rtp_athlete_protocol_assignments.athlete_id has no declared FK to
    // public.users (it targets auth.users), so PostgREST can't embed the
    // name via select() above — this previously tried embedding a
    // nonexistent "athletes" table, which failed the whole query (see the
    // assignError branch above) on every call. Batch-fetch instead.
    const athleteIds = [
      ...new Set(assignments.map((a) => a.athlete_id).filter(Boolean)),
    ];
    const nameById = new Map();
    if (athleteIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", athleteIds);

      if (usersError) {
        requestLogger.error("DB error fetching athlete names", {
          code: usersError.code,
        });
      } else {
        for (const u of users || []) {
          const name = `${u.first_name || ""} ${u.last_name || ""}`.trim();
          nameById.set(u.id, name || "Unknown");
        }
      }
    }

    const protocols = assignments.map((assignment) => {
      return {
        id: assignment.id,
        athlete_id: assignment.athlete_id,
        athlete_name: nameById.get(assignment.athlete_id) || "Unknown",
        injury_id: assignment.injury_id,
        injury_type: assignment.rtp_protocol_definitions?.[0]?.injury_type || "",
        display_name: assignment.rtp_protocol_definitions?.[0]?.display_name || "",
        current_phase: assignment.current_phase,
        phase_name: assignment.rtp_protocol_phases?.find(
          (p) => p.phase_number === assignment.current_phase
        )?.phase_name || "Unknown",
        estimated_return_date: assignment.estimated_return_date,
        rts_rate_percent:
          assignment.rtp_protocol_definitions?.[0]?.rts_rate_percent || 0,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
      };
    });

    const phaseProgress = {};
    assignments.forEach((assignment) => {
      const criteria = assignment.rtp_functional_criteria || [];
      const currentPhaseCriteria = criteria.filter(
        (c) => c.phase_required <= assignment.current_phase
      );
      const passedCriteria = criteria.filter(
        (c) =>
          c.phase_required <= assignment.current_phase &&
          c.latestAssessment?.[0]?.pass_fail
      );

      phaseProgress[assignment.id] = {
        passed: passedCriteria.length,
        total: currentPhaseCriteria.length,
      };
    });

    return createSuccessResponse({
      protocols,
      phaseProgress,
      count: protocols.length,
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getAllProtocols", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "rtp-all-protocols",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = buildRequestLogContext(logger, event);

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse("Not authorized to view protocols", 403);
      }

      const supabase = getSupabaseClient();
      return getAllProtocols(supabase, requestLogger);
    },
  });

export { handler };
