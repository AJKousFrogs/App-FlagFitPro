import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";

/**
 * Netlify Function: Coach Inbox
 *
 * Phase 1: Real-time coach inbox workflow for AI coaching oversight
 *
 * Endpoints:
 * - GET /api/coach-inbox - List inbox items (with filters)
 * - GET /api/coach-inbox/stats - Get counts by inbox type
 * - PATCH /api/coach-inbox/:id - Update item (approve/override/note)
 * - POST /api/coach-inbox/:id/mark-viewed - Mark item as viewed
 *
 * Inbox Types:
 * - safety_alert: Tier 2/3 + ACWR danger + pain mentions (requires action)
 * - review_needed: Program requests, return-to-play questions
 * - win: Completed actions, streaks, positive habits
 */

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Verify user is a coach and get their team IDs
 * @param {string} userId - User ID
 * @returns {Object} - { isCoach: boolean, teamIds: string[] }
 */
async function verifyCoachAndGetTeams(userId) {
  const { data: coachTeams, error } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", userId)
    .in("role", ["coach", "assistant_coach"])
    .eq("status", "active");

  if (error) {
    console.error("[Coach Inbox] Error verifying coach status:", error);
    return { isCoach: false, teamIds: [] };
  }

  return {
    isCoach: coachTeams && coachTeams.length > 0,
    teamIds: (coachTeams || []).map((t) => t.team_id),
    roles: (coachTeams || []).reduce((acc, t) => {
      acc[t.team_id] = t.role;
      return acc;
    }, {}),
  };
}

/**
 * Get inbox statistics for a coach
 * @param {string} coachId - Coach user ID
 * @param {string[]} teamIds - Team IDs the coach belongs to
 * @returns {Object} - Stats by inbox type
 */
async function getInboxStats(coachId, teamIds) {
  const { data: items, error } = await supabaseAdmin
    .from("coach_inbox_items")
    .select("inbox_type, status, priority")
    .eq("coach_id", coachId)
    .in("team_id", teamIds);

  if (error) {
    console.error("[Coach Inbox] Error fetching stats:", error);
    return {
      safety_alerts: 0,
      review_needed: 0,
      wins: 0,
      total_pending: 0,
      critical_count: 0,
    };
  }

  const stats = {
    safety_alerts: items.filter(
      (i) => i.inbox_type === "safety_alert" && i.status === "pending",
    ).length,
    review_needed: items.filter(
      (i) => i.inbox_type === "review_needed" && i.status === "pending",
    ).length,
    wins: items.filter((i) => i.inbox_type === "win").length,
    total_pending: items.filter((i) => i.status === "pending").length,
    critical_count: items.filter(
      (i) => i.priority === "critical" && i.status === "pending",
    ).length,
  };

  return stats;
}

/**
 * List inbox items with filters
 * @param {string} coachId - Coach user ID
 * @param {string[]} teamIds - Team IDs
 * @param {Object} filters - Query filters
 * @returns {Array} - Inbox items with player info
 */
async function listInboxItems(coachId, teamIds, filters = {}) {
  const { inbox_type, status, priority, limit = 50, offset = 0 } = filters;

  let query = supabaseAdmin
    .from("coach_inbox_items")
    .select(
      `
      id,
      coach_id,
      team_id,
      player_id,
      inbox_type,
      priority,
      source_type,
      source_id,
      title,
      summary,
      risk_level,
      acwr_value,
      acwr_zone,
      intent_type,
      athlete_context,
      status,
      coach_action,
      coach_notes,
      override_reason,
      override_alternative,
      viewed_at,
      actioned_at,
      created_at,
      is_new
    `,
    )
    .eq("coach_id", coachId)
    .in("team_id", teamIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (inbox_type) {
    query = query.eq("inbox_type", inbox_type);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (priority) {
    query = query.eq("priority", priority);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("[Coach Inbox] Error listing items:", error);
    throw error;
  }

  if (!items || items.length === 0) {
    return [];
  }

  // Fetch player info for all items
  const playerIds = [...new Set(items.map((i) => i.player_id))];
  const { data: players } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, position, email")
    .in("id", playerIds);

  const playerMap = new Map(
    (players || []).map((p) => [
      p.id,
      {
        id: p.id,
        name:
          `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
          p.email?.split("@")[0] ||
          "Unknown",
        position: p.position,
      },
    ]),
  );

  // Enrich items with player info
  return items.map((item) => ({
    ...item,
    player: playerMap.get(item.player_id) || {
      id: item.player_id,
      name: "Unknown",
      position: null,
    },
  }));
}

/**
 * Update an inbox item
 * @param {string} itemId - Inbox item ID
 * @param {string} coachId - Coach user ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated item
 */
async function updateInboxItem(itemId, coachId, updates) {
  const { action, status, notes, override_reason, override_alternative } =
    updates;

  const updateData = {
    is_new: false,
    actioned_at: new Date().toISOString(),
  };

  if (status) {
    updateData.status = status;
  }
  if (action) {
    updateData.coach_action = action;
  }
  if (notes !== undefined) {
    updateData.coach_notes = notes;
  }
  if (override_reason !== undefined) {
    updateData.override_reason = override_reason;
  }
  if (override_alternative !== undefined) {
    updateData.override_alternative = override_alternative;
  }
  if (status === "viewed" && !updateData.viewed_at) {
    updateData.viewed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("coach_inbox_items")
    .update(updateData)
    .eq("id", itemId)
    .eq("coach_id", coachId)
    .select()
    .single();

  if (error) {
    console.error("[Coach Inbox] Error updating item:", error);
    throw error;
  }

  // If overriding, update the source message with coach review stamp
  if (action === "override" && data.source_type === "ai_message") {
    await supabaseAdmin
      .from("ai_messages")
      .update({
        coach_reviewed_at: new Date().toISOString(),
        coach_reviewed_by: coachId,
      })
      .eq("id", data.source_id);

    console.log(
      `[Coach Inbox] Stamped ai_message ${data.source_id} as reviewed by coach`,
    );
  }

  // If approving, also stamp the message
  if (action === "approve" && data.source_type === "ai_message") {
    await supabaseAdmin
      .from("ai_messages")
      .update({
        coach_reviewed_at: new Date().toISOString(),
        coach_reviewed_by: coachId,
      })
      .eq("id", data.source_id);
  }

  return data;
}

/**
 * Mark an inbox item as viewed
 * @param {string} itemId - Inbox item ID
 * @param {string} coachId - Coach user ID
 * @returns {Object} - Updated item
 */
async function markItemViewed(itemId, coachId) {
  const { data, error } = await supabaseAdmin
    .from("coach_inbox_items")
    .update({
      viewed_at: new Date().toISOString(),
      is_new: false,
    })
    .eq("id", itemId)
    .eq("coach_id", coachId)
    .select()
    .single();

  if (error) {
    console.error("[Coach Inbox] Error marking item viewed:", error);
    throw error;
  }

  return data;
}

/**
 * Get a single inbox item with full details
 * @param {string} itemId - Inbox item ID
 * @param {string} coachId - Coach user ID
 * @returns {Object} - Full item details including source message
 */
async function getInboxItemDetail(itemId, coachId) {
  const { data: item, error } = await supabaseAdmin
    .from("coach_inbox_items")
    .select("*")
    .eq("id", itemId)
    .eq("coach_id", coachId)
    .single();

  if (error || !item) {
    return null;
  }

  // Get player info
  const { data: player } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, position, email, birth_date")
    .eq("id", item.player_id)
    .single();

  // Get source message if applicable
  let sourceMessage = null;
  if (item.source_type === "ai_message") {
    const { data: message } = await supabaseAdmin
      .from("ai_messages")
      .select("*")
      .eq("id", item.source_id)
      .single();
    sourceMessage = message;
  }

  // Get team info
  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, name")
    .eq("id", item.team_id)
    .single();

  return {
    ...item,
    player: player
      ? {
          id: player.id,
          name:
            `${player.first_name || ""} ${player.last_name || ""}`.trim() ||
            player.email?.split("@")[0],
          position: player.position,
          birth_date: player.birth_date,
        }
      : null,
    team: team || null,
    source_message: sourceMessage,
  };
}

// =====================================================
// MAIN HANDLER
// =====================================================

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "coach-inbox",
    allowedMethods: ["GET", "PATCH", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const { path } = event;
      const method = event.httpMethod;

      // Verify user is a coach
      const { isCoach, teamIds } = await verifyCoachAndGetTeams(userId);

      if (!isCoach) {
        return createErrorResponse(
          "Not authorized. You must be a coach or assistant coach to access the inbox.",
          403,
          "not_coach",
          requestId,
        );
      }

      // Parse path to determine endpoint
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?coach-inbox\/?/, "")
        .split("/")
        .filter(Boolean);
      const subPath = pathParts[0] || "";
      const itemId =
        pathParts[0] && pathParts[0] !== "stats" ? pathParts[0] : null;
      const action = pathParts[1] || null;

      try {
        // GET /api/coach-inbox/stats - Get inbox statistics
        if (method === "GET" && subPath === "stats") {
          const stats = await getInboxStats(userId, teamIds);
          return createSuccessResponse(stats, requestId);
        }

        // GET /api/coach-inbox/:id - Get single item detail
        if (method === "GET" && itemId && itemId !== "stats") {
          const item = await getInboxItemDetail(itemId, userId);
          if (!item) {
            return createErrorResponse(
              "Inbox item not found",
              404,
              "not_found",
              requestId,
            );
          }
          return createSuccessResponse(item, requestId);
        }

        // GET /api/coach-inbox - List inbox items
        if (method === "GET") {
          const filters = event.queryStringParameters || {};
          const items = await listInboxItems(userId, teamIds, filters);
          return createSuccessResponse(
            {
              items,
              total: items.length,
              filters,
            },
            requestId,
          );
        }

        // POST /api/coach-inbox/:id/mark-viewed - Mark item as viewed
        if (method === "POST" && itemId && action === "mark-viewed") {
          const item = await markItemViewed(itemId, userId);
          return createSuccessResponse(item, requestId);
        }

        // PATCH /api/coach-inbox/:id - Update inbox item
        if (method === "PATCH" && itemId) {
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

          // Validate action if provided
          const validActions = [
            "approve",
            "add_note",
            "override",
            "save_template",
          ];
          if (body.action && !validActions.includes(body.action)) {
            return createErrorResponse(
              `Invalid action. Must be one of: ${validActions.join(", ")}`,
              400,
              "invalid_action",
              requestId,
            );
          }

          // Validate status if provided
          const validStatuses = [
            "pending",
            "viewed",
            "approved",
            "overridden",
            "noted",
            "saved_template",
          ];
          if (body.status && !validStatuses.includes(body.status)) {
            return createErrorResponse(
              `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
              400,
              "invalid_status",
              requestId,
            );
          }

          // Override requires reason
          if (body.action === "override" && !body.override_reason) {
            return createErrorResponse(
              "Override action requires override_reason",
              400,
              "missing_override_reason",
              requestId,
            );
          }

          const updatedItem = await updateInboxItem(itemId, userId, body);
          return createSuccessResponse(updatedItem, requestId);
        }

        // Method not allowed for this path
        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
          requestId,
        );
      } catch (error) {
        console.error("[Coach Inbox] Error:", error);
        return createErrorResponse(
          "Failed to process request",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};
