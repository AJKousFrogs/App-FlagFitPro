import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { verifyPhysioAccess } from "./staff-physiotherapist.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.physiotherapist-dashboard" });

// Netlify Function: Physiotherapist Dashboard API
// Single-source read over rtp_athlete_protocol_assignments (the same TIER-1/
// Phase-1D RTP tables rtp-team-protocols.js reads — CLAUDE.md §4: one place
// computes RTP phase/timeline, this just reshapes it for the roster view).

/**
 * Phase 1-5 -> acute/rehab/rtp status bucket, per the 5-mesocycle RTP model
 * (Acute Protection / Early Mobilization / Intermediate Strengthening /
 * Advanced RTP / Return to Sport, docs/generated DATA_MODEL comment on
 * rtp_protocol_phases). Pure derivation, not a second source of truth.
 */
function phaseToStatus(phase) {
  if (phase <= 2) {
    return "acute";
  }
  if (phase <= 4) {
    return "rehab";
  }
  return "rtp";
}

async function getDashboardData(teamId) {
  const { data: members, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("role", "player")
    .eq("status", "active");

  if (membersError) {
    throw membersError;
  }

  const playerIds = (members || []).map((m) => m.user_id);
  if (playerIds.length === 0) {
    return { injuries: [], stats: emptyStats() };
  }

  const { data: assignments, error: assignError } = await supabaseAdmin
    .from("rtp_athlete_protocol_assignments")
    .select(
      `
      id,
      athlete_id,
      current_phase,
      estimated_return_date,
      created_at,
      rtp_protocol_definitions (
        injury_type,
        rts_rate_percent
      )
      `,
    )
    .in("athlete_id", playerIds)
    .order("estimated_return_date", { ascending: true });

  if (assignError) {
    throw assignError;
  }

  const athleteIds = [...new Set((assignments || []).map((a) => a.athlete_id))];
  const nameById = new Map();
  if (athleteIds.length > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, full_name")
      .in("id", athleteIds);

    if (usersError) {
      throw usersError;
    }
    for (const u of users || []) {
      nameById.set(u.id, u.full_name || "Unknown");
    }
  }

  const injuries = (assignments || []).map((assignment) => ({
    id: assignment.id,
    athlete_id: assignment.athlete_id,
    athlete_name: nameById.get(assignment.athlete_id) || "Unknown",
    injury_type: assignment.rtp_protocol_definitions?.injury_type || "",
    status: phaseToStatus(assignment.current_phase),
    current_phase: assignment.current_phase,
    estimated_return_date: assignment.estimated_return_date,
    rts_rate_percent:
      assignment.rtp_protocol_definitions?.rts_rate_percent || 0,
    created_at: assignment.created_at,
  }));

  const stats = {
    total_active: injuries.length,
    in_phase_1: injuries.filter((i) => i.current_phase === 1).length,
    in_phase_2: injuries.filter((i) => i.current_phase === 2).length,
    in_phase_3: injuries.filter((i) => i.current_phase === 3).length,
    in_phase_4: injuries.filter((i) => i.current_phase === 4).length,
    in_phase_5: injuries.filter((i) => i.current_phase === 5).length,
  };

  return { injuries, stats };
}

function emptyStats() {
  return {
    total_active: 0,
    in_phase_1: 0,
    in_phase_2: 0,
    in_phase_3: 0,
    in_phase_4: 0,
    in_phase_5: 0,
  };
}

async function handleRequest(_event, _context, { userId }) {
  const access = await verifyPhysioAccess(userId);
  if (!access) {
    return createErrorResponse(
      "Access denied. Physiotherapist role required.",
      403,
      ErrorType.AUTHORIZATION,
    );
  }

  try {
    const data = await getDashboardData(access.team_id);
    return createSuccessResponse(data);
  } catch (error) {
    logger.error("dashboard_query_failed", error);
    throw error;
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "physiotherapist-dashboard",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: handleRequest,
  });

export { handler };
