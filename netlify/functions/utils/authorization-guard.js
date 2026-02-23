import { supabaseAdmin, supabaseService } from "../utils/supabase-client.js";
import { createErrorResponse } from "./error-handler.js";
const TRAINING_SESSIONS_TABLE = "training_sessions";

/**
 * Authorization Guard Utility
 * Implements AUTHORIZATION_AND_GUARDRAILS_CONTRACT_v1
 * Date: 2026-01-06
 */

/**
 * Get user role from database (not JWT)
 * Contract: Section 1.1 - Roles MUST be assigned explicitly, MUST NOT be inferred from token
 * Note: Role is stored in team_members table, NOT users table
 */
async function getUserRole(userId) {
  if (!userId) {
    return null;
  }

  // Get role from team_members table (authoritative source for team roles)
  const { data: membership, error: memberError } = await supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!memberError && membership?.role) {
    return membership.role;
  }

  // Fallback to auth.users metadata
  if (!supabaseService) {
    return null;
  }

  const { data: authUser, error: authError } =
    await supabaseService.auth.admin.getUserById(userId);

  if (authError || !authUser?.user) {
    return null;
  }

  return authUser.user.user_metadata?.role || "player";
}

/**
 * Check if session can be modified
 * Contract: Section 3.1 - Session Mutation APIs
 */
async function canModifySession(
  userId,
  sessionId,
  modificationType = "structure",
) {
  if (!userId || !sessionId) {
    return {
      authorized: false,
      error: "MISSING_PARAMS",
      message: "User ID and session ID required",
    };
  }

  // Get session with current state
  const { data: session, error } = await supabaseAdmin
    .from(TRAINING_SESSIONS_TABLE)
    .select(
      "coach_locked, session_state, modified_by_coach_id, user_id, athlete_id",
    )
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return {
      authorized: false,
      error: "SESSION_NOT_FOUND",
      message: "Session not found",
    };
  }

  // Determine owner (handle both user_id and athlete_id columns)
  const ownerId = session.user_id || session.athlete_id;

  // Check coach_locked
  if (session.coach_locked) {
    // Only the coach who locked it can modify
    if (session.modified_by_coach_id !== userId) {
      return {
        authorized: false,
        error: "COACH_LOCKED",
        message: "Cannot modify coach_locked session",
      };
    }
  }

  // Check session state
  const mutableStates = ["PLANNED", "GENERATED", "VISIBLE", "ACKNOWLEDGED"];
  if (session.session_state && !mutableStates.includes(session.session_state)) {
    return {
      authorized: false,
      error: "STATE_IMMUTABLE",
      message: `Cannot modify session: session is ${session.session_state}`,
    };
  }

  // Check role for structure modifications
  if (modificationType === "structure") {
    const role = await getUserRole(userId);
    if (!["coach", "admin"].includes(role)) {
      return {
        authorized: false,
        error: "INSUFFICIENT_PERMISSIONS",
        message: "Coach role required for structure modifications",
      };
    }
  }

  // Check ownership for execution logging
  if (modificationType === "execution") {
    if (ownerId !== userId) {
      return {
        authorized: false,
        error: "OWNERSHIP_MISMATCH",
        message: "Can only log execution for own sessions",
      };
    }

    // Execution logging only allowed in IN_PROGRESS or COMPLETED states
    if (!["IN_PROGRESS", "COMPLETED"].includes(session.session_state)) {
      return {
        authorized: false,
        error: "STATE_IMMUTABLE",
        message: `Cannot log execution: session is ${session.session_state}`,
      };
    }
  }

  return { authorized: true };
}

/**
 * Log authorization violation
 * Contract: Section 8 - Violation Handling
 */
async function logViolation(
  userId,
  resourceId,
  resourceType,
  action,
  errorCode,
  errorMessage,
  requestInfo = {},
) {
  try {
    await supabaseAdmin.from("authorization_violations").insert({
      user_id: userId,
      resource_id: resourceId,
      resource_type: resourceType,
      action,
      error_code: errorCode,
      error_message: errorMessage,
      ip_address: requestInfo.ip,
      user_agent: requestInfo.userAgent,
      request_path: requestInfo.path,
      request_method: requestInfo.method,
      request_body: requestInfo.body
        ? typeof requestInfo.body === "string"
          ? JSON.parse(requestInfo.body)
          : requestInfo.body
        : null,
    });
  } catch (error) {
    console.error("[Authorization] Failed to log violation:", error);
    // Don't throw - logging failures shouldn't break the request
  }
}

/**
 * Authorization guard middleware
 * Contract: Section 2 - Global Authorization Model
 */
async function requireAuthorization(
  userId,
  resourceId,
  resourceType,
  action,
  modificationType = "structure",
  requestInfo = {},
) {
  const result = await canModifySession(userId, resourceId, modificationType);

  if (!result.authorized) {
    // Log violation
    await logViolation(
      userId,
      resourceId,
      resourceType,
      action,
      result.error,
      result.message,
      requestInfo,
    );

    return {
      success: false,
      error: createErrorResponse(
        result.message || "Authorization failed",
        403,
        result.error || "AUTHORIZATION_FAILED",
      ),
    };
  }

  return { success: true };
}

/**
 * Check if user has required role
 */
async function requireRole(userId, requiredRoles) {
  const role = await getUserRole(userId);

  if (!role || !requiredRoles.includes(role)) {
    return {
      authorized: false,
      error: "INSUFFICIENT_PERMISSIONS",
      message: `Required role: ${requiredRoles.join(" or ")}`,
    };
  }

  return { authorized: true, role };
}

/**
 * Check consent for data access
 * Contract: Section 7 - Consent Enforcement
 */
async function checkConsent(
  viewerUserId,
  dataOwnerUserId,
  consentType = "wellness",
) {
  // Users can always view their own data
  if (viewerUserId === dataOwnerUserId) {
    return { authorized: true };
  }

  // Check consent settings
  const { data: consent, error } = await supabaseAdmin
    .from("consent_settings")
    .select(`${consentType}_consent`)
    .eq("user_id", dataOwnerUserId)
    .single();

  if (error || !consent) {
    // Default to no consent if settings don't exist
    return {
      authorized: false,
      error: "CONSENT_REQUIRED",
      message: "Consent required to access this data",
    };
  }

  const consentField = `${consentType}_consent`;
  if (!consent[consentField]) {
    return {
      authorized: false,
      error: "CONSENT_REQUIRED",
      message: "Consent required to access this data",
    };
  }

  return { authorized: true };
}

export { getUserRole,
  canModifySession,
  logViolation,
  requireAuthorization,
  requireRole,
  checkConsent, };
