// Netlify Function: Validate Invitation Token
// Checks if an invitation token is valid and returns invitation details

const { getSupabaseClient } = require("./utils/auth-helper.cjs");
const {
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

exports.handler = async (event, context) =>  {
  logFunctionCall('Validate-Invitation', event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  try {
    const token = event.queryStringParameters?.token;

    if (!token) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: "Token is required" }),
      };
    }

    const supabase = getSupabaseClient();

    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        team_id,
        email,
        role,
        position,
        jersey_number,
        status,
        expires_at,
        teams (
          id,
          name,
          description,
          league,
          season,
          home_city
        )
      `)
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: "Invalid invitation token" }),
      };
    }

    if (invitation.status === 'accepted') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: "This invitation has already been accepted" }),
      };
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt || invitation.status === 'expired') {
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: "This invitation has expired" }),
      };
    }

    return createSuccessResponse(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          position: invitation.position,
          jerseyNumber: invitation.jersey_number,
          status: invitation.status,
          expiresAt: invitation.expires_at,
          team: invitation.teams,
        },
      },
      200,
      "Invitation is valid"
    );
  } catch (error) {
    console.error("Error validating invitation:", error);
    return handleServerError(error, "Failed to validate invitation");
  }
};
