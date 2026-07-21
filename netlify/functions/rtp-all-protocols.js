import { baseHandler } from "./utils/base-handler.js";
import {
  LOAD_MANAGEMENT_ACCESS_ROLES,
} from "./utils/role-sets.js";

const handler = baseHandler(async (req, res, context) => {
  if (req.method === "GET") {
    return getAllProtocols(req, res, context);
  }

  res.statusCode = 405;
  res.body = JSON.stringify({ error: "Method not allowed" });
  return res;
});

async function getAllProtocols(req, res, context) {
  const { supabase, userRole, userId } = context;

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
      athletes!inner(
        id,
        user_id,
        first_name,
        last_name
      ),
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
    console.error("Error fetching protocols:", assignError);
    res.statusCode = 500;
    res.body = JSON.stringify({ error: "Failed to fetch protocols" });
    return res;
  }

  if (!assignments || assignments.length === 0) {
    res.body = JSON.stringify({
      protocols: [],
      phaseProgress: {},
      count: 0,
    });
    return res;
  }

  const protocols = assignments.map((assignment) => {
    const athlete = assignment.athletes || {};
    return {
      id: assignment.id,
      athlete_id: assignment.athlete_id,
      athlete_name: `${athlete.first_name || ""} ${athlete.last_name || ""}`.trim() || "Unknown",
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

  res.body = JSON.stringify({
    protocols,
    phaseProgress,
    count: protocols.length,
  });

  return res;
}

export default handler;
