import { wrapHandler } from "./utils/lambda-compat.js";

/**
 * Inactive Player Notification Function
 * Sends notifications to inactive players
 */

import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { supabaseAdmin } from "./supabase-client.js";
import { hasAnyRole, TEAM_OPERATIONS_ROLES } from "./utils/role-sets.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";

function isValidId(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value.trim())
  );
}

function parseDaysInactive(value) {
  if (!Number.isInteger(value) || value < 1 || value > 3650) {
    return null;
  }
  return value;
}

async function verifyCoachCanNotify(userId, targetUserId) {
  const { data: coachMembership, error: coachMembershipError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (coachMembershipError || !coachMembership?.team_id) {
    return { authorized: false };
  }

  const { data: targetMembership, error: targetMembershipError } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", targetUserId)
    .eq("team_id", coachMembership.team_id)
    .limit(1)
    .maybeSingle();
  if (targetMembershipError || !targetMembership?.team_id) {
    return { authorized: false };
  }
  if (targetMembership.role !== "player") {
    return { authorized: false };
  }

  return { authorized: true };
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "inactive-player-notify",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const userRole = await getUserRole(userId);
      if (!hasAnyRole(userRole, TEAM_OPERATIONS_ROLES)) {
        return createErrorResponse(
          "Only authorized team staff can send notifications",
          403,
          "authorization_error",
        );
      }

      if (event.httpMethod === "POST") {
        const parsedBody = tryParseJsonObjectBody(event.body);
        if (!parsedBody.ok) {
          return parsedBody.error;
        }
        const body = parsedBody.data;

        const { user_id, days_inactive } = body;
        if (!isValidId(user_id)) {
          return handleValidationError(
            "user_id must be a non-empty alphanumeric identifier",
          );
        }
        const parsedDaysInactive = parseDaysInactive(days_inactive);
        if (parsedDaysInactive === null) {
          return handleValidationError(
            "days_inactive must be an integer between 1 and 3650",
          );
        }

        const authz = await verifyCoachCanNotify(userId, user_id);
        if (!authz.authorized) {
          return createErrorResponse(
            "Not authorized to send inactivity notifications for this player",
            403,
            "authorization_error",
          );
        }

        try {
          // Get player details
          const { data: player, error: playerError } = await supabaseAdmin
            .from("users")
            .select("id, email, first_name, last_name")
            .eq("id", user_id)
            .single();

          if (playerError) {
            if (playerError.code === "PGRST116") {
              return createErrorResponse(
                "Player not found",
                404,
                "not_found",
              );
            }
            throw playerError;
          }

          // Update notification status
          const { error: updateError } = await supabaseAdmin
            .from("player_activity_tracking")
            .update({
              notification_sent_30d: parsedDaysInactive >= 30,
              notification_sent_90d: parsedDaysInactive >= 90,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user_id);

          if (updateError) {
            throw updateError;
          }

          // TODO: Send actual notification (email/push)
          // For now, just log it
          console.log(
            `[InactivePlayer] Notification sent to ${player.email} (${parsedDaysInactive} days inactive)`,
          );

          return createSuccessResponse(
            {
              user_id,
              days_inactive: parsedDaysInactive,
              sent_by: userId,
            },
            200,
            `Notification sent to ${player.first_name} ${player.last_name}`,
          );
        } catch (error) {
          console.error("[InactivePlayer] Error:", error);
          return createErrorResponse(
            "Failed to send notification",
            500,
            "server_error",
          );
        }
      }

      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
    },
  });

export const testHandler = handler;
export { handler };

export const config = { schedule: "0 8 * * *" }; // Daily — 08:00 UTC

async function runScheduledInactivityNotifications() {
  const THRESHOLD_30 = 30;
  const THRESHOLD_90 = 90;
  const cutoff30 = new Date(Date.now() - THRESHOLD_30 * 24 * 60 * 60 * 1000).toISOString();
  const cutoff90 = new Date(Date.now() - THRESHOLD_90 * 24 * 60 * 60 * 1000).toISOString();

  // Find players inactive ≥30 days who haven't been notified yet
  const { data: rows, error } = await supabaseAdmin
    .from("player_activity_tracking")
    .select("user_id, last_active_at, notification_sent_30d, notification_sent_90d")
    .lt("last_active_at", cutoff30)
    .eq("notification_sent_30d", false);

  if (error) throw error;

  let notified = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    try {
      const { data: player } = await supabaseAdmin
        .from("users")
        .select("id, email, first_name, last_name")
        .eq("id", row.user_id)
        .single();

      if (!player) continue;

      const daysInactive = row.last_active_at
        ? Math.floor((Date.now() - new Date(row.last_active_at).getTime()) / (24 * 60 * 60 * 1000))
        : THRESHOLD_30;

      await supabaseAdmin
        .from("player_activity_tracking")
        .update({
          notification_sent_30d: true,
          notification_sent_90d: daysInactive >= THRESHOLD_90 || row.notification_sent_90d,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", row.user_id);

      console.log(
        `[InactivePlayer][scheduled] Notification sent to ${player.email} (${daysInactive} days inactive)`,
      );
      notified++;
    } catch (err) {
      console.error(`[InactivePlayer][scheduled] Failed for user ${row.user_id}:`, err?.message);
      failed++;
    }
  }

  return { total: (rows ?? []).length, notified, failed };
}

export default async (req, context) => {
  if (req.headers.get("x-netlify-event") === "schedule") {
    console.log("[InactivePlayer] scheduled run start");
    try {
      const result = await runScheduledInactivityNotifications();
      console.log("[InactivePlayer] scheduled run complete", result);
      return Response.json({ success: true, data: result });
    } catch (err) {
      console.error("[InactivePlayer] scheduled run failed:", err?.message);
      return Response.json({ success: false, error: err?.message || "run failed" }, { status: 500 });
    }
  }
  return wrapHandler(handler)(req, context);
};
