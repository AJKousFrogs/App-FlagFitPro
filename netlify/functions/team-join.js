import { baseHandler } from "./utils/base-handler.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";
import { supabaseAdmin } from "./utils/supabase-client.js";

const logger = createLogger({ service: "netlify.team-join" });

// Self-service team join used by onboarding. A user who signs up without an
// invitation would otherwise never get a team membership (role/team came ONLY
// from accept-invitation before this) and would land in the app teamless — no
// weather, no season plan, not on the roster. This lets them pick a team + role
// during onboarding.
//
// SECURITY MODEL (deliberate): self-declared STAFF roles join as
// `pending_approval` — they appear on the roster but do NOT gain access to
// consent-gated health data (that stays behind can_staff_read_athlete RLS +
// approval). Players join `approved` (they only ever see their own data).
// Owner/admin can never be self-granted here. Writes are self-scoped to the
// authenticated userId via the service-role client, exactly like
// player-settings / account-deletion.
const SELF_JOIN_ROLES = new Set([
  "player",
  "head_coach",
  "coach",
  "assistant_coach",
  "offense_coordinator",
  "defense_coordinator",
  "physiotherapist",
  "nutritionist",
  "strength_conditioning_coach",
  "psychologist",
  "manager",
]);

// Positions an athlete may self-declare (mirrors onboarding's picker).
const PLAYER_POSITIONS = new Set([
  "QB",
  "WR",
  "RB",
  "C",
  "Rusher",
  "Safety",
  "CB",
]);

/** GET → the teams a user can join (id/name/city only — nothing sensitive). */
async function listTeams() {
  const { data, error } = await supabaseAdmin
    .from("teams")
    .select("id, name, home_city")
    .order("name", { ascending: true });

  if (error) {
    logger.error("team_join_list_failed", { message: error.message });
    return createErrorResponse("Could not load teams.", 500, "database_error");
  }

  return createSuccessResponse({
    teams: (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      homeCity: t.home_city ?? null,
    })),
  });
}

/** POST → join `teamId` as `role` (+ optional player `position`). */
async function joinTeam(userId, payload, requestLogger) {
  const teamId =
    typeof payload.teamId === "string" ? payload.teamId.trim() : "";
  const role = typeof payload.role === "string" ? payload.role.trim() : "";
  const position =
    typeof payload.position === "string" ? payload.position.trim() : null;

  if (!teamId) {
    return handleValidationError("teamId is required.");
  }
  if (!SELF_JOIN_ROLES.has(role)) {
    return handleValidationError("A valid team role is required.");
  }
  if (role === "player" && position && !PLAYER_POSITIONS.has(position)) {
    return handleValidationError("Invalid player position.");
  }

  // The team must exist.
  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError) {
    requestLogger.error("team_join_team_lookup_failed", {
      message: teamError.message,
    });
    return createErrorResponse("Could not verify team.", 500, "database_error");
  }
  if (!team) {
    return handleValidationError("That team no longer exists.");
  }

  // Already a member? Don't silently overwrite their role — return what they
  // have so onboarding can proceed idempotently.
  const { data: existing } = await supabaseAdmin
    .from("team_members")
    .select("role, status, role_approval_status")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return createSuccessResponse({
      alreadyMember: true,
      teamId,
      role: existing.role,
      status: existing.status,
      approvalStatus: existing.role_approval_status,
    });
  }

  const isPlayer = role === "player";
  const approvalStatus = isPlayer ? "approved" : "pending_approval";

  const { error: insertError } = await supabaseAdmin
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
      status: "active",
      role_approval_status: approvalStatus,
      position: isPlayer ? position : null,
    });

  if (insertError) {
    requestLogger.error("team_join_insert_failed", {
      message: insertError.message,
    });
    return createErrorResponse(
      "Could not join the team.",
      500,
      "database_error",
    );
  }

  // For STAFF, picking a team + role IS their whole onboarding (no physicals /
  // season step follows), so mark onboarding complete here. Players do NOT get
  // it set on join — player-settings sets it at the end of their fuller flow.
  if (!isPlayer) {
    const { error: onboardingError } = await supabaseAdmin
      .from("users")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (onboardingError) {
      // Non-fatal: they joined; onboarding flag can be re-set on next attempt.
      requestLogger.warn("team_join_onboarding_flag_failed", {
        message: onboardingError.message,
      });
    }
  }

  requestLogger.info("team_join_succeeded", {
    teamId,
    role,
    approvalStatus,
  });

  return createSuccessResponse({
    alreadyMember: false,
    teamId,
    role,
    status: "active",
    approvalStatus,
  });
}

export const handler = (event, context) =>
  baseHandler(event, context, {
    functionName: "team-join",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId, correlationId }) => {
      const requestLogger = makeRequestLogger(logger, {
        requestId,
        correlationId,
        userId,
      });

      if (evt.httpMethod === "GET") {
        return listTeams();
      }

      const parsed = tryParseJsonObjectBody(evt.body, { requestId });
      if (!parsed.ok) {
        return parsed.error;
      }
      return joinTeam(userId, parsed.data, requestLogger);
    },
  });

export default handler;
