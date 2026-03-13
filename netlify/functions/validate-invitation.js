import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { getSupabaseClient } from "./utils/auth-helper.js";
import { createSuccessResponse, createErrorResponse, handleNotFoundError } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Validate Invitation Token
// Checks if an invitation token is valid and returns invitation details

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "validate-invitation",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false, // Invitation validation should be public
    handler: async (event, _context, { requestId }) => {
      const token = event.queryStringParameters?.token;

      if (!token) {
        return createErrorResponse(
          "Token is required",
          400,
          "validation_error",
          requestId,
        );
      }

      const supabase = getSupabaseClient();

      const { data: invitation, error: inviteError } = await supabase
        .from("team_invitations")
        .select(
          `
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
        `,
        )
        .eq("token", token)
        .single();

      if (inviteError || !invitation) {
        return handleNotFoundError("Invitation", requestId);
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
        await supabase
          .from("team_invitations")
          .update({ status: "expired" })
          .eq("id", invitation.id);

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
          message: "Invitation is valid",
        },
        requestId,
      );
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
