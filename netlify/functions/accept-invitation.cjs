// Netlify Function: Accept Team Invitation
// Handles accepting a team invitation and adding user to team

const { getSupabaseClient } = require("./utils/auth-helper.cjs");
const {
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");

exports.handler = async (event, _context) => {
  logFunctionCall("Accept-Invitation", event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  try {
    const { token } = JSON.parse(event.body || "{}");

    if (!token) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: "Token is required" }),
      };
    }

    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
      };
    }

    const supabase = getSupabaseClient();

    const authToken = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "Invalid authentication token",
        }),
      };
    }

    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "Invalid invitation token",
        }),
      };
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "This invitation was sent to a different email address",
        }),
      };
    }

    if (invitation.status === "accepted") {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "This invitation has already been accepted",
        }),
      };
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt || invitation.status === "expired") {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "This invitation has expired",
        }),
      };
    }

    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", invitation.team_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      await supabase
        .from("team_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "You are already a member of this team",
        }),
      };
    }

    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .insert({
        user_id: user.id,
        team_id: invitation.team_id,
        role: invitation.role,
        position: invitation.position,
        jersey_number: invitation.jersey_number,
        status: "active",
      })
      .select()
      .single();

    if (memberError) {
      // Re-throw error
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "Failed to add you to the team",
        }),
      };
    }

    await supabase
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    return createSuccessResponse(
      {
        teamId: invitation.team_id,
        memberId: teamMember.id,
        role: invitation.role,
      },
      200,
      "Successfully joined the team",
    );
  } catch (error) {
    // Re-throw error
    return handleServerError(error, "Failed to accept invitation");
  }
};
