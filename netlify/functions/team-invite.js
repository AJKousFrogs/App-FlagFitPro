import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { getSupabaseClient } from "./utils/auth-helper.js";
import { createSuccessResponse, createErrorResponse, handleNotFoundError } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Team Invitation
// Sends email invitations to join a team

// Get email transporter
function getEmailTransporter() {
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

function getFromEmail() {
  return (
    process.env.FROM_EMAIL ||
    process.env.SMTP_USER ||
    process.env.GMAIL_EMAIL ||
    "noreply@flagfitpro.com"
  );
}

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.URL ||
    "https://webflagfootballfrogs.netlify.app"
  );
}

// Generate secure invitation token
function generateInvitationToken() {
  return crypto.randomBytes(32).toString("hex");
}

const ALLOWED_INVITE_ROLES = new Set(["player", "assistant_coach"]);
const ALLOWED_INVITER_ROLES = new Set([
  "owner",
  "admin",
  "head_coach",
  "coach",
  "assistant_coach",
  "offense_coordinator",
  "defense_coordinator",
]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Team invitation email template
function getTeamInvitationTemplate(
  inviterName,
  teamName,
  invitationUrl,
  role,
  coachMessage,
) {
  const roleText = role === "assistant_coach" ? "Assistant Coach" : "Player";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation</title>
    <style>
        body { font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 40px; }
        .team-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px; }
        .coach-message { background: #e8f5e9; border-left: 4px solid #10c96b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 FlagFit Pro</h1>
            <h2>Team Invitation</h2>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join their flag football team:</p>

            <div class="team-badge">
                <h2 style="margin: 0; font-size: 24px;">${teamName}</h2>
                <p style="margin: 10px 0 0 0;">Role: ${roleText}</p>
            </div>

            ${
              coachMessage
                ? `
            <div class="coach-message">
                <strong>Message from your coach:</strong>
                <p style="margin: 10px 0 0 0;">"${coachMessage}"</p>
            </div>
            `
                : ""
            }

            <p>Click the button below to accept this invitation and join the team:</p>
            <p style="text-align: center;">
                <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </p>

            <div class="info-box">
                <strong>What happens next?</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Click the button above to accept the invitation</li>
                    <li>If you don't have an account, you'll be guided to create one</li>
                    <li>Once accepted, you'll have access to team training programs and performance tracking</li>
                    <li>Connect with your teammates and coaches</li>
                </ul>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
                <strong>Note:</strong> This invitation link will expire in 7 days.
            </p>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${invitationUrl}
            </p>

            <p>Best regards,<br>The FlagFit Pro Team</p>
        </div>
        <div class="footer">
            <p>© 2025 FlagFit Pro. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "team-invite",
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

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return createErrorResponse(
          "Request body must be an object",
          422,
          "validation_error",
          requestId,
        );
      }

      const { teamId, email, role, position, jerseyNumber, coachMessage } =
        body;

      if (!teamId || !email) {
        return createErrorResponse(
          "teamId and email are required",
          400,
          "validation_error",
          requestId,
        );
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return createErrorResponse(
          "Invalid email format",
          422,
          "validation_error",
          requestId,
        );
      }
      if (role !== undefined && !ALLOWED_INVITE_ROLES.has(role)) {
        return createErrorResponse(
          `role must be one of: ${Array.from(ALLOWED_INVITE_ROLES).join(", ")}`,
          422,
          "validation_error",
          requestId,
        );
      }
      if (
        jerseyNumber !== undefined &&
        (!Number.isInteger(jerseyNumber) || jerseyNumber <= 0 || jerseyNumber > 999)
      ) {
        return createErrorResponse(
          "jerseyNumber must be an integer between 1 and 999",
          422,
          "validation_error",
          requestId,
        );
      }
      if (
        coachMessage !== undefined &&
        (typeof coachMessage !== "string" || coachMessage.length > 1000)
      ) {
        return createErrorResponse(
          "coachMessage must be a string up to 1000 characters",
          422,
          "validation_error",
          requestId,
        );
      }

      const supabase = getSupabaseClient();

      // Get team info
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, name, coach_id")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        return handleNotFoundError("Team", requestId);
      }

      const { data: inviterMembership, error: inviterMembershipError } = await supabase
        .from("team_members")
        .select("role, status")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .eq("status", "active")
        .in("role", Array.from(ALLOWED_INVITER_ROLES))
        .maybeSingle();
      if (inviterMembershipError) {
        throw inviterMembershipError;
      }
      if (!inviterMembership && team.coach_id !== userId) {
        return createErrorResponse(
          "Only active coaches or staff can send invitations",
          403,
          "forbidden",
          requestId,
        );
      }

      // Ensure email service is available before creating an invitation record.
      const transporter = getEmailTransporter();
      if (!transporter) {
        return createErrorResponse(
          "Email service not configured",
          503,
          "service_unavailable",
          requestId,
        );
      }

      // Check for existing pending invitation
      const { data: existingInvitation, error: existingInviteError } = await supabase
        .from("team_invitations")
        .select("id, status, expires_at")
        .eq("team_id", teamId)
        .eq("email", normalizedEmail)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInviteError && existingInviteError.code !== "PGRST116") {
        throw existingInviteError;
      }

      if (existingInvitation) {
        return createSuccessResponse(
          {
            invitationId: existingInvitation.id,
            email: normalizedEmail,
            teamName: team.name,
            expiresAt: existingInvitation.expires_at || null,
            message: "Invitation already pending",
          },
          requestId,
        );
      }

      // Create invitation
      const invToken = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error: inviteError } = await supabase
        .from("team_invitations")
        .insert({
          team_id: teamId,
          email: normalizedEmail,
          invited_by: userId,
          token: invToken,
          role: role || "player",
          position: position || null,
          jersey_number: jerseyNumber || null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.code === "23505") {
          const { data: duplicateInvite } = await supabase
            .from("team_invitations")
            .select("id, expires_at")
            .eq("team_id", teamId)
            .eq("email", normalizedEmail)
            .eq("status", "pending")
            .maybeSingle();
          if (duplicateInvite) {
            return createSuccessResponse(
              {
                invitationId: duplicateInvite.id,
                email: normalizedEmail,
                teamName: team.name,
                expiresAt: duplicateInvite.expires_at || null,
                message: "Invitation already pending",
              },
              requestId,
            );
          }
        }
        console.error("Error creating invitation:", inviteError);
        throw new Error("Failed to create invitation");
      }

      const invitationUrl = `${getAppUrl()}/accept-invitation?token=${invToken}`;

      // Get user info for inviter name
      const { data: userData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      const inviterName = userData?.full_name || userData?.email || "A coach";

      const mailOptions = {
        from: { name: "FlagFit Pro", address: getFromEmail() },
        to: email,
        subject: `You've been invited to join ${team.name}!`,
        html: getTeamInvitationTemplate(
          inviterName,
          team.name,
          invitationUrl,
          role || "player",
          coachMessage,
        ),
        text: `Hi there,\n\n${inviterName} has invited you to join ${team.name} on FlagFit Pro.\n\nClick here to accept: ${invitationUrl}\n\nThis invitation expires in 7 days.\n\nBest regards,\nThe FlagFit Pro Team`,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (mailError) {
        // Avoid leaving pending invitations that were never delivered.
        await supabase.from("team_invitations").delete().eq("id", invitation.id);
        throw mailError;
      }

      console.log(`✅ Team invitation sent to ${email} for team ${team.name}`);

      return createSuccessResponse(
        {
          invitationId: invitation.id,
          email: normalizedEmail,
          teamName: team.name,
          expiresAt: expiresAt.toISOString(),
          message: "Invitation sent successfully",
        },
        requestId,
      );
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
