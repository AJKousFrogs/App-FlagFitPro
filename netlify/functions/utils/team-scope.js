/**
 * Team-scope resolution — the single source of truth for "which team(s) does a
 * user staff / belong to, and may staff-user X act on athlete Y?".
 *
 * Before this module the same `team_members` query was hand-written in 7+ files
 * with subtly different shapes; several used `.limit(1)`/`.maybeSingle()` which
 * resolves an ARBITRARY team for multi-team users (an athlete on both a club and
 * a national team, a coach of two squads) and could both wrongly authorise and
 * wrongly deny. Every check here spans ALL active memberships.
 *
 * Service-role queries (RLS bypassed), so callers MUST scope in code — that is
 * exactly what these helpers do.
 */

import { supabaseAdmin } from "../supabase-client.js";
import { TEAM_OPERATIONS_ROLES } from "./role-sets.js";

/**
 * Active team_ids where `userId` holds one of `roles`, most-recent membership
 * first (deterministic — never an arbitrary row).
 * @returns {Promise<string[]>}
 */
export async function getStaffedTeamIds(
  userId,
  { roles = TEAM_OPERATIONS_ROLES, client = supabaseAdmin } = {},
) {
  if (!userId) {return [];}
  const { data, error } = await client
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", roles)
    .order("updated_at", { ascending: false });
  if (error || !data) {return [];}
  return data.map((r) => r.team_id).filter(Boolean);
}

/**
 * Active team_ids `userId` belongs to (any role), most-recent first.
 * @returns {Promise<string[]>}
 */
export async function getMemberTeamIds(userId, { client = supabaseAdmin } = {}) {
  if (!userId) {return [];}
  const { data, error } = await client
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false });
  if (error || !data) {return [];}
  return data.map((r) => r.team_id).filter(Boolean);
}

/**
 * Does `staffUserId` staff a team that `athleteUserId` is an active member of?
 * Intersection across ALL of the staff user's teams.
 * @returns {Promise<{ shared: boolean, teamIds: string[] }>} teamIds = shared teams
 */
export async function sharesStaffedTeam(
  staffUserId,
  athleteUserId,
  { roles = TEAM_OPERATIONS_ROLES, client = supabaseAdmin } = {},
) {
  const staffTeamIds = await getStaffedTeamIds(staffUserId, { roles, client });
  if (staffTeamIds.length === 0) {return { shared: false, teamIds: [] };}
  const { data, error } = await client
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteUserId)
    .eq("status", "active")
    .in("team_id", staffTeamIds);
  if (error || !data) {return { shared: false, teamIds: [] };}
  const teamIds = data.map((r) => r.team_id).filter(Boolean);
  return { shared: teamIds.length > 0, teamIds };
}

/**
 * The team a staffed user acts on. An explicit `requestedTeamId` is validated
 * against the user's staffed teams (never trusted); without it the most-recent
 * staffed team wins.
 * @returns {Promise<string|null>} team_id, or null if the user staffs no matching team
 */
export async function resolveStaffedTeam(
  userId,
  requestedTeamId = null,
  { roles = TEAM_OPERATIONS_ROLES, client = supabaseAdmin } = {},
) {
  const teamIds = await getStaffedTeamIds(userId, { roles, client });
  if (teamIds.length === 0) {return null;}
  if (requestedTeamId) {
    return teamIds.includes(requestedTeamId) ? requestedTeamId : null;
  }
  return teamIds[0];
}

/** Is `userId` active staff (one of `roles`) of `teamId`? */
export async function isStaffOfTeam(
  userId,
  teamId,
  { roles = TEAM_OPERATIONS_ROLES, client = supabaseAdmin } = {},
) {
  if (!userId || !teamId) {return false;}
  const { data, error } = await client
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .eq("status", "active")
    .in("role", roles)
    .limit(1)
    .maybeSingle();
  return !error && Boolean(data?.team_id);
}

/** Is `userId` an active member of `teamId` (any role)? */
export async function isActiveTeamMember(
  userId,
  teamId,
  { client = supabaseAdmin } = {},
) {
  if (!userId || !teamId) {return false;}
  const { data, error } = await client
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return !error && Boolean(data?.team_id);
}
