/**
 * Shared Authentication Helper for Netlify Functions
 * Provides Supabase-based authentication for all backend functions
 *
 * SECURITY: Uses Supabase auth instead of JWT_SECRET
 */

const { supabaseAdmin, setAuthContextToken } = require("../supabase-client.cjs");
const { handleAuthenticationError } = require("./error-handler.cjs");

/**
 * Get Supabase client with service role key
 * Uses shared client from supabase-client.cjs
 * @returns {object} Supabase client instance
 */
function getSupabaseClient() {
  return supabaseAdmin;
}

/**
 * Authenticate request using Supabase JWT
 * @param {object} event - Netlify function event
 * @returns {Promise<object>} { success: boolean, user?: object, token?: string, error?: object }
 */
async function authenticateRequest(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: handleAuthenticationError("Authorization token required"),
    };
  }

  const token = authHeader.substring(7);

  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("[Auth] Supabase auth error:", authError?.message);
      return {
        success: false,
        error: handleAuthenticationError("Invalid or expired token"),
      };
    }

    // Return user with consistent format
    setAuthContextToken(token);
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "player",
        name: user.user_metadata?.name || user.email,
        emailVerified: user.email_confirmed_at !== null,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        metadata: user.user_metadata,
      },
    };
  } catch (error) {
    console.error("[Auth] Unexpected error during authentication:", error);
    return {
      success: false,
      error: handleAuthenticationError("Authentication failed"),
    };
  }
}

/**
 * Verify user has permission to access a resource
 * @param {string} userId - User ID from auth
 * @param {string} resourceUserId - User ID that owns the resource
 * @param {string} resourceType - Type of resource (for error messages)
 * @returns {object} { authorized: boolean, error?: object }
 */
function checkResourceOwnership(
  userId,
  resourceUserId,
  resourceType = "resource",
) {
  if (userId !== resourceUserId) {
    const { handleAuthorizationError } = require("./error-handler.cjs");
    return {
      authorized: false,
      error: handleAuthorizationError(
        `You don't have permission to access this ${resourceType}`,
      ),
    };
  }

  return { authorized: true };
}

/**
 * Verify user is member of a team
 * @param {string} userId - User ID from auth
 * @param {string} teamId - Team ID to check
 * @returns {Promise<object>} { authorized: boolean, error?: object }
 */
async function checkTeamMembership(userId, teamId) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single();

    if (error || !data) {
      const { handleAuthorizationError } = require("./error-handler.cjs");
      return {
        authorized: false,
        error: handleAuthorizationError("You are not a member of this team"),
      };
    }

    return { authorized: true };
  } catch (error) {
    console.error("[Auth] Error checking team membership:", error);
    const { handleAuthorizationError } = require("./error-handler.cjs");
    return {
      authorized: false,
      error: handleAuthorizationError("Failed to verify team membership"),
    };
  }
}

/**
 * Get user's team ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Team ID or null
 */
async function getUserTeamId(userId) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error || !data) {
      // User might not be on a team yet, return default
      return `TEAM_${userId}`;
    }

    return data.team_id;
  } catch (error) {
    console.error("[Auth] Error getting user team:", error);
    return `TEAM_${userId}`;
  }
}

module.exports = {
  getSupabaseClient,
  authenticateRequest,
  checkResourceOwnership,
  checkTeamMembership,
  getUserTeamId,
};
