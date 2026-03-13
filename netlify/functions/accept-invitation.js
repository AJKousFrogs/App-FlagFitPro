import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { getSupabaseClient } from "./utils/auth-helper.js";
import { createSuccessResponse, createErrorResponse, handleNotFoundError } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Accept Team Invitation
// Handles accepting a team invitation and adding user to team

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "accept-invitation",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
          requestId,
        );
      }

      const { token } = body;

      if (!token) {
        return createErrorResponse(
          "Token is required",
          400,
          "validation_error",
          requestId,
        );
      }

      const supabase = getSupabaseClient();

      // Get user info
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      // Fallback: get email from auth
      let userEmail;
      if (userError || !userData) {
        const authHeader = event.headers.authorization;
        const authToken = authHeader?.replace("Bearer ", "");
        if (authToken) {
          const {
            data: { user },
          } = await supabase.auth.getUser(authToken);
          userEmail = user?.email;
        }
      } else {
        userEmail = userData.email;
      }

      if (!userEmail) {
        return createErrorResponse(
          "Could not determine user email",
          400,
          "user_error",
          requestId,
        );
      }

      // Get invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("token", token)
        .single();

      if (inviteError || !invitation) {
        return handleNotFoundError("Invitation", requestId);
      }

      if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
        return createErrorResponse(
          "This invitation was sent to a different email address",
          403,
          "forbidden",
          requestId,
        );
      }

      if (invitation.status === "accepted") {
        return createErrorResponse(
          "This invitation has already been accepted",
          400,
          "invitation_accepted",
          requestId,
        );
      }

      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);

      if (now > expiresAt || invitation.status === "expired") {
        return createErrorResponse(
          "This invitation has expired",
          400,
          "invitation_expired",
          requestId,
        );
      }

      if (invitation.status !== "pending") {
        return createErrorResponse(
          "This invitation is no longer active",
          409,
          "invitation_inactive",
          requestId,
        );
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", invitation.team_id)
        .eq("user_id", userId)
        .single();

      if (existingMember) {
        await supabase
          .from("team_invitations")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", invitation.id);

        return createErrorResponse(
          "You are already a member of this team",
          400,
          "already_member",
          requestId,
        );
      }

      // Add user to team
      const { data: teamMember, error: memberError } = await supabase
        .from("team_members")
        .insert({
          user_id: userId,
          team_id: invitation.team_id,
          role: invitation.role,
          position: invitation.position,
          jersey_number: invitation.jersey_number,
          status: "active",
        })
        .select()
        .single();

      if (memberError) {
        throw new Error("Failed to add you to the team");
      }

      // Update invitation status
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
          message: "Successfully joined the team",
        },
        requestId,
      );
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
