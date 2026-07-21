import { baseHandler } from "./utils/base-handler.js";
import {
  LOAD_MANAGEMENT_ACCESS_ROLES,
} from "./utils/role-sets.js";

const handler = baseHandler(async (req, res, context) => {
  const { teamId } = context.params;

  if (req.method === "GET") {
    return getTeamProtocols(req, res, context, teamId);
  }

  res.statusCode = 405;
  res.body = JSON.stringify({ error: "Method not allowed" });
  return res;
});

async function getTeamProtocols(req, res, context, teamId) {
  const { supabase, userRole } = context;

  if (!LOAD_MANAGEMENT_ACCESS_ROLES.includes(userRole)) {
    res.statusCode = 403;
    res.body = JSON.stringify({ error: "Access denied" });
    return res;
  }

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
    .eq("athlete_id", null) // Will be modified based on team structure
    .neq("updated_at", null);

  if (assignError) {
    console.error("Error fetching team protocols:", assignError);
    res.statusCode = 500;
    res.body = JSON.stringify({ error: "Failed to fetch protocols" });
    return res;
  }

  if (!assignments || assignments.length === 0) {
    res.body = JSON.stringify({
      protocols: [],
      phaseProgress: {},
      teamId,
    });
    return res;
  }

  const protocols = assignments.map((assignment) => ({
    id: assignment.id,
    athlete_id: assignment.athlete_id,
    athlete_name: "", // Would need athlete_name from athletes table join
    injury_id: assignment.injury_id,
    injury_type: assignment.rtp_protocol_definitions?.[0]?.injury_type || "",
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

  res.body = JSON.stringify({
    protocols,
    phaseProgress,
    teamId,
    count: protocols.length,
  });

  return res;
}

export default handler;
