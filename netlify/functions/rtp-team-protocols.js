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

const logger = createLogger({ service: "netlify.rtp-team-protocols" });

async function getTeamProtocols(supabase, teamId, requestLogger) {
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
        rtp_functional_criteria!inner(id)
        `
      )
      .neq("updated_at", null);

    if (assignError) {
      requestLogger.error("DB error fetching team protocols", {
        code: assignError.code,
      });
      return createErrorResponse("Failed to fetch protocols", 500);
    }

    if (!assignments || assignments.length === 0) {
      return createSuccessResponse({
        protocols: [],
        phaseProgress: {},
        teamId,
      });
    }

    // rtp_athlete_protocol_assignments.athlete_id has no declared FK to
    // public.users (it targets auth.users), so PostgREST can't embed the
    // name via the select() above — batch-fetch it instead. Was previously
    // omitted entirely, leaving RtpProtocolListComponent's athlete_name
    // field always blank despite the component expecting it.
    const athleteIds = [
      ...new Set(assignments.map((a) => a.athlete_id).filter(Boolean)),
    ];
    const nameById = new Map();
    if (athleteIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", athleteIds);

      if (usersError) {
        requestLogger.error("DB error fetching athlete names", {
          code: usersError.code,
        });
      } else {
        for (const u of users || []) {
          nameById.set(u.id, u.full_name || "Unknown");
        }
      }
    }

    const protocols = assignments.map((assignment) => ({
      id: assignment.id,
      athlete_id: assignment.athlete_id,
      athlete_name: nameById.get(assignment.athlete_id) || "Unknown",
      injury_id: assignment.injury_id,
      injury_type: assignment.rtp_protocol_definitions?.[0]?.injury_type || "",
      display_name: assignment.rtp_protocol_definitions?.[0]?.display_name || "",
      current_phase: assignment.current_phase,
      phase_name: assignment.rtp_protocol_phases?.find(
        (p) => p.phase_number === assignment.current_phase
      )?.phase_name,
      estimated_return_date: assignment.estimated_return_date,
      rts_rate_percent:
        assignment.rtp_protocol_definitions?.[0]?.rts_rate_percent || 0,
      created_at: assignment.created_at,
    }));

    const phaseProgress = {};
    assignments.forEach((assignment) => {
      const criteria = assignment.rtp_functional_criteria || [];
      const currentPhaseCriteria = criteria.filter(
        (c) => c.phase_required <= assignment.current_phase
      );
      const passedCriteria = criteria.filter(
        (c) => c.phase_required <= assignment.current_phase && c.latestAssessment?.pass_fail
      );

      phaseProgress[assignment.id] = {
        passed: passedCriteria.length,
        total: currentPhaseCriteria.length,
      };
    });

    return createSuccessResponse({
      protocols,
      phaseProgress,
      teamId,
      count: protocols.length,
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getTeamProtocols", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "rtp-team-protocols",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = buildRequestLogContext(logger, event);

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse("Not authorized to view protocols", 403);
      }

      // Path is /api/rtp/team/:teamId/protocols — teamId is second-to-last,
      // not last (that's "protocols"). Was reading the last segment, which
      // never resolves to a real team, so this endpoint always returned an
      // empty protocol list regardless of live data.
      const pathParts = event.path.split("/");
      const teamId = pathParts[pathParts.length - 2];

      if (!teamId) {
        return createErrorResponse("Missing teamId in path", 400);
      }

      const supabase = getSupabaseClient();
      return getTeamProtocols(supabase, teamId, requestLogger);
    },
  });

export { handler };
