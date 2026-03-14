import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

/**
 * Netlify Function: Parent Dashboard
 *
 * Phase 3: API for parents to view and manage their linked youth athletes
 *
 * Endpoints:
 * - GET /api/parent-dashboard/children - List linked children
 * - GET /api/parent-dashboard/children/:id - Get child details and stats
 * - GET /api/parent-dashboard/children/:id/activity - Get child's AI activity feed
 * - GET /api/parent-dashboard/notifications - Get parent notifications
 * - PATCH /api/parent-dashboard/notifications/:id - Update notification status
 * - GET /api/parent-dashboard/approvals - Get pending approval requests
 * - PATCH /api/parent-dashboard/approvals/:id - Approve or deny request
 * - POST /api/parent-dashboard/link - Request link to child
 * - GET /api/parent-dashboard/settings/:childId - Get child's youth settings
 * - PATCH /api/parent-dashboard/settings/:childId - Update child's youth settings
 */

import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

const VALID_NOTIFICATION_STATUSES = new Set([
  "unread",
  "read",
  "actioned",
  "dismissed",
]);
const BOOLEAN_SETTING_FIELDS = new Set([
  "restrict_supplement_topics",
  "restrict_weight_training",
  "restrict_high_intensity",
  "restrict_nutrition_advice",
  "require_parent_approval_programs",
  "require_parent_approval_supplements",
  "use_simplified_language",
  "include_parent_cc",
]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ID_LENGTH = 200;

function parseBoundedInt(rawValue, fieldName, { min = 0, max = 200 } = {}) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }
  if (!/^\d+$/.test(String(rawValue))) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function parseOptionalDate(rawValue, fieldName) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new Error(`${fieldName} must be a valid date`);
  }
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }
  return rawValue;
}

function parseRequiredId(rawValue, fieldName) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  if (rawValue.trim().length > MAX_ID_LENGTH) {
    throw new Error(`${fieldName} is too long`);
  }
  return rawValue.trim();
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Verify user is a verified parent of the specified child
 * @param {string} parentId - Parent user ID
 * @param {string} childId - Child user ID (optional, for checking specific link)
 * @returns {Object} - { isParent: boolean, linkedChildren: string[] }
 */
async function verifyParentStatus(parentId, childId = null) {
  let query = supabaseAdmin
    .from("parent_guardian_links")
    .select(
      "youth_id, relationship, can_view_ai_chats, can_approve_recommendations",
    )
    .eq("parent_id", parentId)
    .eq("status", "verified");

  if (childId) {
    query = query.eq("youth_id", childId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Parent Dashboard] Error verifying parent status:", error);
    return { isParent: false, linkedChildren: [], links: [] };
  }

  return {
    isParent: data && data.length > 0,
    linkedChildren: (data || []).map((d) => d.youth_id),
    links: data || [],
  };
}

/**
 * Get list of linked children with basic info
 * @param {string} parentId - Parent user ID
 * @returns {Array} - Children list
 */
async function getLinkedChildren(parentId) {
  const { data, error } = await supabaseAdmin
    .from("parent_guardian_links")
    .select(
      `
      id,
      youth_id,
      relationship,
      can_view_ai_chats,
      can_approve_recommendations,
      created_at,
      youth:youth_id(
        id,
        email,
        first_name,
        last_name,
        birth_date,
        position
      )
    `,
    )
    .eq("parent_id", parentId)
    .eq("status", "verified");

  if (error) {
    console.error("[Parent Dashboard] Error fetching linked children:", error);
    throw error;
  }

  return (data || []).map((link) => ({
    linkId: link.id,
    relationship: link.relationship,
    canViewAiChats: link.can_view_ai_chats,
    canApprove: link.can_approve_recommendations,
    linkedAt: link.created_at,
    child: link.youth
      ? {
          id: link.youth.id,
          email: link.youth.email,
          name:
            `${link.youth.first_name || ""} ${link.youth.last_name || ""}`.trim() ||
            "Unknown",
          birthDate: link.youth.birth_date,
          position: link.youth.position,
        }
      : null,
  }));
}

/**
 * Get child's AI activity feed
 * @param {string} childId - Child user ID
 * @param {Object} options - Query options
 * @returns {Array} - Activity items
 */
async function getChildActivityFeed(childId, options = {}) {
  const { limit = 50, offset = 0, dateFrom, dateTo } = options;

  let query = supabaseAdmin
    .from("ai_messages")
    .select(
      `
      id,
      role,
      content,
      intent_type,
      risk_level,
      is_youth_interaction,
      youth_restrictions_applied,
      classification_confidence,
      coach_reviewed_at,
      coach_reviewed_by,
      created_at
    `,
    )
    .eq("user_id", childId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Parent Dashboard] Error fetching child activity:", error);
    throw error;
  }

  // Group messages into conversations
  const conversations = [];
  let currentConversation = null;

  for (const msg of data || []) {
    if (msg.role === "user") {
      // Start new conversation
      if (currentConversation) {
        conversations.push(currentConversation);
      }
      currentConversation = {
        id: msg.id,
        timestamp: msg.created_at,
        userQuery: msg.content,
        intent: msg.intent_type,
        riskLevel: msg.risk_level,
        restrictionsApplied: msg.youth_restrictions_applied || [],
        confidence: msg.classification_confidence,
        aiResponse: null,
        coachReviewed: false,
      };
    } else if (msg.role === "assistant" && currentConversation) {
      // Add response to current conversation
      currentConversation.aiResponse = msg.content;
      currentConversation.coachReviewed = !!msg.coach_reviewed_at;
    }
  }

  // Add last conversation
  if (currentConversation) {
    conversations.push(currentConversation);
  }

  return conversations;
}

/**
 * Get child's statistics
 * @param {string} childId - Child user ID
 * @returns {Object} - Stats summary
 */
async function getChildStats(childId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get AI interaction stats
  const { data: aiStats, error: aiError } = await supabaseAdmin
    .from("ai_messages")
    .select("role, risk_level, is_youth_interaction")
    .eq("user_id", childId)
    .eq("role", "user")
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get micro-session stats
  const { data: sessionStats, error: sessionError } = await supabaseAdmin
    .from("micro_sessions")
    .select("status")
    .eq("user_id", childId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get daily readiness average from daily_wellness_checkin
  const { data: readinessData, error: readinessError } = await supabaseAdmin
    .from("daily_wellness_checkin")
    .select("calculated_readiness, muscle_soreness")
    .eq("user_id", childId)
    .gte("checkin_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("checkin_date", { ascending: false })
    .limit(7);

  const stats = {
    last30Days: {
      totalQueries: 0,
      highRiskQueries: 0,
      mediumRiskQueries: 0,
      lowRiskQueries: 0,
    },
    sessions: {
      total: 0,
      completed: 0,
      skipped: 0,
      completionRate: 0,
    },
    readiness: {
      averageScore: null,
      recentPainLevels: [],
    },
  };

  if (aiStats && !aiError) {
    stats.last30Days.totalQueries = aiStats.length;
    stats.last30Days.highRiskQueries = aiStats.filter(
      (m) => m.risk_level === "high",
    ).length;
    stats.last30Days.mediumRiskQueries = aiStats.filter(
      (m) => m.risk_level === "medium",
    ).length;
    stats.last30Days.lowRiskQueries = aiStats.filter(
      (m) => m.risk_level === "low",
    ).length;
  }

  if (sessionStats && !sessionError) {
    stats.sessions.total = sessionStats.length;
    stats.sessions.completed = sessionStats.filter(
      (s) => s.status === "completed",
    ).length;
    stats.sessions.skipped = sessionStats.filter(
      (s) => s.status === "skipped",
    ).length;
    const completedOrSkipped =
      stats.sessions.completed + stats.sessions.skipped;
    stats.sessions.completionRate =
      completedOrSkipped > 0
        ? Math.round((stats.sessions.completed / completedOrSkipped) * 100)
        : 0;
  }

  if (readinessData && !readinessError && readinessData.length > 0) {
    const scores = readinessData
      .filter((r) => r.calculated_readiness !== null)
      .map((r) => parseFloat(r.calculated_readiness));
    stats.readiness.averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
        : null;
    // Map muscle_soreness to recentPainLevels for backwards compatibility
    stats.readiness.recentPainLevels = readinessData
      .slice(0, 7)
      .map((r) => r.muscle_soreness);
  }

  return stats;
}

/**
 * Get parent's notifications
 * @param {string} parentId - Parent user ID
 * @param {Object} options - Query options
 * @returns {Array} - Notifications
 */
async function getParentNotifications(parentId, options = {}) {
  const { status, limit = 50, offset = 0 } = options;

  let query = supabaseAdmin
    .from("parent_notifications")
    .select(
      `
      *,
      youth:youth_id(id, first_name, last_name)
    `,
    )
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Parent Dashboard] Error fetching notifications:", error);
    throw error;
  }

  return (data || []).map((n) => ({
    ...n,
    childName: n.youth
      ? `${n.youth.first_name || ""} ${n.youth.last_name || ""}`.trim()
      : "Unknown",
  }));
}

/**
 * Update notification status
 * @param {string} notificationId - Notification ID
 * @param {string} parentId - Parent user ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated notification
 */
async function updateNotification(notificationId, parentId, updates) {
  const { status, action_taken, action_notes } = updates;
  if (!VALID_NOTIFICATION_STATUSES.has(status)) {
    throw new Error("Invalid notification status");
  }

  const updateData = { status };
  if (status === "read") {
    updateData.read_at = new Date().toISOString();
  }
  if (status === "actioned") {
    updateData.actioned_at = new Date().toISOString();
    updateData.action_taken = action_taken;
    updateData.action_notes = action_notes;
  }

  const { data, error } = await supabaseAdmin
    .from("parent_notifications")
    .update(updateData)
    .eq("id", notificationId)
    .eq("parent_id", parentId)
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error("[Parent Dashboard] Error updating notification:", error);
    if (!data) {
      throw new Error("Notification not found");
    }
    throw error;
  }

  return data;
}

/**
 * Get pending approval requests
 * @param {string} parentId - Parent user ID
 * @returns {Array} - Pending approvals
 */
async function getPendingApprovals(parentId) {
  const { data, error } = await supabaseAdmin
    .from("approval_requests")
    .select(
      `
      *,
      youth:youth_id(id, first_name, last_name)
    `,
    )
    .eq("approver_id", parentId)
    .eq("approver_type", "parent")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[Parent Dashboard] Error fetching pending approvals:",
      error,
    );
    throw error;
  }

  return (data || []).map((a) => ({
    ...a,
    childName: a.youth
      ? `${a.youth.first_name || ""} ${a.youth.last_name || ""}`.trim()
      : "Unknown",
  }));
}

/**
 * Process approval decision
 * @param {string} approvalId - Approval request ID
 * @param {string} parentId - Parent user ID
 * @param {string} decision - 'approved' or 'denied'
 * @param {string} notes - Decision notes
 * @returns {Object} - Updated approval
 */
async function processApprovalDecision(
  approvalId,
  parentId,
  decision,
  notes = null,
) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("approval_requests")
    .select("id, status")
    .eq("id", approvalId)
    .eq("approver_id", parentId)
    .eq("approver_type", "parent")
    .maybeSingle();

  if (existingError) {
    console.error("[Parent Dashboard] Error loading approval request:", existingError);
    throw existingError;
  }
  if (!existing) {
    throw new Error("Approval request not found");
  }
  if (existing.status !== "pending") {
    throw new Error("Approval request has already been processed");
  }

  const { data, error } = await supabaseAdmin
    .from("approval_requests")
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decision_notes: notes,
    })
    .eq("id", approvalId)
    .eq("approver_id", parentId)
    .eq("approver_type", "parent")
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error("[Parent Dashboard] Error processing approval:", error);
    if (!data) {
      throw new Error("Approval request has already been processed");
    }
    throw error;
  }

  return data;
}

/**
 * Get youth settings for a child
 * @param {string} childId - Child user ID
 * @returns {Object} - Youth settings
 */
async function getYouthSettings(childId) {
  const { data, error } = await supabaseAdmin
    .from("youth_athlete_settings")
    .select("*")
    .eq("user_id", childId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[Parent Dashboard] Error fetching youth settings:", error);
    throw error;
  }

  return data || null;
}

/**
 * Update youth settings for a child
 * @param {string} childId - Child user ID
 * @param {string} parentId - Parent user ID (for audit)
 * @param {Object} updates - Settings to update
 * @returns {Object} - Updated settings
 */
async function updateYouthSettings(childId, parentId, updates) {
  // Get existing settings or create new
  const existing = await getYouthSettings(childId);

  const settingsData = {
    user_id: childId,
    ...updates,
    set_by: parentId,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("youth_athlete_settings")
      .update(settingsData)
      .eq("user_id", childId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = data;
  } else {
    settingsData.created_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("youth_athlete_settings")
      .insert(settingsData)
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = data;
  }

  return result;
}

// =====================================================
// MAIN HANDLER
// =====================================================

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "parent-dashboard",
    allowedMethods: ["GET", "POST", "PATCH"],
rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const { path } = event;
      const method = event.httpMethod;

      // Parse path
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?parent-dashboard\/?/, "")
        .split("/")
        .filter(Boolean);
      const resource = pathParts[0] || "";
      const resourceId = pathParts[1] || null;
      const subResource = pathParts[2] || null;

      try {
        // GET /api/parent-dashboard/children - List linked children
        if (method === "GET" && resource === "children" && !resourceId) {
          const children = await getLinkedChildren(userId);
          return createSuccessResponse(
            { children, total: children.length },
            requestId,
          );
        }

        // GET /api/parent-dashboard/children/:id - Get child details
        if (
          method === "GET" &&
          resource === "children" &&
          resourceId &&
          !subResource
        ) {
          // Verify parent has access to this child
          const { isParent } = await verifyParentStatus(userId, resourceId);
          if (!isParent) {
            return createErrorResponse(
              "Not authorized to view this child",
              403,
              "not_authorized",
              requestId,
            );
          }

          const stats = await getChildStats(resourceId);
          const settings = await getYouthSettings(resourceId);

          return createSuccessResponse(
            {
              childId: resourceId,
              stats,
              settings,
            },
            requestId,
          );
        }

        // GET /api/parent-dashboard/children/:id/activity - Get child's activity
        if (
          method === "GET" &&
          resource === "children" &&
          resourceId &&
          subResource === "activity"
        ) {
          const options = event.queryStringParameters || {};
          const parsedLimit = parseBoundedInt(options.limit, "limit", {
            min: 1,
            max: 200,
          });
          const parsedOffset = parseBoundedInt(options.offset, "offset", {
            min: 0,
            max: 10000,
          });
          const dateFrom = parseOptionalDate(options.date_from, "date_from");
          const dateTo = parseOptionalDate(options.date_to, "date_to");
          if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
            return createErrorResponse(
              "date_from must be on or before date_to",
              422,
              "validation_error",
              requestId,
            );
          }

          // Verify parent has access and can view AI chats
          const { isParent, links } = await verifyParentStatus(
            userId,
            resourceId,
          );
          if (!isParent) {
            return createErrorResponse(
              "Not authorized to view this child",
              403,
              "not_authorized",
              requestId,
            );
          }

          const link = links[0];
          if (!link.can_view_ai_chats) {
            return createErrorResponse(
              "AI chat viewing not enabled for this link",
              403,
              "permission_denied",
              requestId,
            );
          }

          const activity = await getChildActivityFeed(resourceId, {
            limit: parsedLimit ?? 50,
            offset: parsedOffset ?? 0,
            dateFrom,
            dateTo,
          });

          return createSuccessResponse(
            { activity, total: activity.length },
            requestId,
          );
        }

        // GET /api/parent-dashboard/notifications - Get notifications
        if (method === "GET" && resource === "notifications" && !resourceId) {
          const options = event.queryStringParameters || {};
          const parsedLimit = parseBoundedInt(options.limit, "limit", {
            min: 1,
            max: 200,
          });
          const parsedOffset = parseBoundedInt(options.offset, "offset", {
            min: 0,
            max: 10000,
          });
          if (
            options.status !== undefined &&
            !VALID_NOTIFICATION_STATUSES.has(options.status)
          ) {
            return createErrorResponse(
              "Invalid notification status",
              422,
              "validation_error",
              requestId,
            );
          }
          const notifications = await getParentNotifications(userId, {
            status: options.status,
            limit: parsedLimit ?? 50,
            offset: parsedOffset ?? 0,
          });

          // Also get unread count
          const { count: unreadCount } = await supabaseAdmin
            .from("parent_notifications")
            .select("*", { count: "exact", head: true })
            .eq("parent_id", userId)
            .eq("status", "unread");

          return createSuccessResponse(
            {
              notifications,
              total: notifications.length,
              unread_count: unreadCount || 0,
            },
            requestId,
          );
        }

        // PATCH /api/parent-dashboard/notifications/:id - Update notification
        if (method === "PATCH" && resource === "notifications" && resourceId) {
          const body = parseJsonObjectBody(event.body);

          const notification = await updateNotification(
            resourceId,
            userId,
            body,
          );
          return createSuccessResponse(notification, requestId);
        }

        // GET /api/parent-dashboard/approvals - Get pending approvals
        if (method === "GET" && resource === "approvals" && !resourceId) {
          const approvals = await getPendingApprovals(userId);
          return createSuccessResponse(
            { approvals, total: approvals.length },
            requestId,
          );
        }

        // PATCH /api/parent-dashboard/approvals/:id - Process approval
        if (method === "PATCH" && resource === "approvals" && resourceId) {
          const body = parseJsonObjectBody(event.body);

          if (
            !body.decision ||
            !["approved", "denied"].includes(body.decision)
          ) {
            return createErrorResponse(
              "Decision must be 'approved' or 'denied'",
              422,
              "validation_error",
              requestId,
            );
          }

          const approval = await processApprovalDecision(
            resourceId,
            userId,
            body.decision,
            body.notes,
          );
          return createSuccessResponse(approval, requestId);
        }

        // GET /api/parent-dashboard/settings/:childId - Get child's settings
        if (method === "GET" && resource === "settings" && resourceId) {
          const { isParent } = await verifyParentStatus(userId, resourceId);
          if (!isParent) {
            return createErrorResponse(
              "Not authorized",
              403,
              "not_authorized",
              requestId,
            );
          }

          const settings = await getYouthSettings(resourceId);
          return createSuccessResponse(
            settings || { user_id: resourceId, defaults: true },
            requestId,
          );
        }

        // PATCH /api/parent-dashboard/settings/:childId - Update child's settings
        if (method === "PATCH" && resource === "settings" && resourceId) {
          const { isParent } = await verifyParentStatus(userId, resourceId);
          if (!isParent) {
            return createErrorResponse(
              "Not authorized",
              403,
              "not_authorized",
              requestId,
            );
          }

          const body = parseJsonObjectBody(event.body);

          // Only allow updating specific fields
          const allowedFields = [
            "restrict_supplement_topics",
            "restrict_weight_training",
            "restrict_high_intensity",
            "restrict_nutrition_advice",
            "require_parent_approval_programs",
            "require_parent_approval_supplements",
            "use_simplified_language",
            "include_parent_cc",
            "max_session_duration_minutes",
          ];

          const updates = {};
          for (const field of allowedFields) {
            if (body[field] !== undefined) {
              if (
                BOOLEAN_SETTING_FIELDS.has(field) &&
                typeof body[field] !== "boolean"
              ) {
                return createErrorResponse(
                  `${field} must be a boolean`,
                  422,
                  "validation_error",
                  requestId,
                );
              }
              if (
                field === "max_session_duration_minutes" &&
                (!Number.isInteger(body[field]) || body[field] <= 0)
              ) {
                return createErrorResponse(
                  "max_session_duration_minutes must be a positive integer",
                  422,
                  "validation_error",
                  requestId,
                );
              }
              updates[field] = body[field];
            }
          }
          if (Object.keys(updates).length === 0) {
            return createErrorResponse(
              "No valid settings fields provided",
              422,
              "validation_error",
              requestId,
            );
          }

          const settings = await updateYouthSettings(
            resourceId,
            userId,
            updates,
          );
          return createSuccessResponse(settings, requestId);
        }

        // POST /api/parent-dashboard/link - Request link to child
        if (method === "POST" && resource === "link") {
          const body = parseJsonObjectBody(event.body);

          if (
            body.youth_email !== undefined &&
            (typeof body.youth_email !== "string" || !EMAIL_REGEX.test(body.youth_email))
          ) {
            return createErrorResponse(
              "youth_email must be a valid email address",
              422,
              "validation_error",
              requestId,
            );
          }

          if (
            body.relationship !== undefined &&
            (typeof body.relationship !== "string" ||
              body.relationship.trim().length === 0 ||
              body.relationship.trim().length > 50)
          ) {
            return createErrorResponse(
              "relationship must be a non-empty string up to 50 characters",
              422,
              "validation_error",
              requestId,
            );
          }

          if (!body.youth_email && !body.youth_id) {
            return createErrorResponse(
              "youth_email or youth_id is required",
              422,
              "validation_error",
              requestId,
            );
          }

          // Find youth by email or ID
          let youthId = body.youth_id;
          if (youthId !== undefined) {
            try {
              youthId = parseRequiredId(youthId, "youth_id");
            } catch (validationError) {
              return createErrorResponse(
                validationError.message,
                422,
                "validation_error",
                requestId,
              );
            }
          }
          if (!youthId && body.youth_email) {
            const { data: user } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("email", body.youth_email)
              .single();

            if (!user) {
              return createErrorResponse(
                "Youth account not found",
                404,
                "not_found",
                requestId,
              );
            }
            youthId = user.id;
          }
          if (youthId === userId) {
            return createErrorResponse(
              "Cannot create a parent link to your own account",
              422,
              "validation_error",
              requestId,
            );
          }
          if (body.youth_id) {
            const { data: youth, error: youthError } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("id", youthId)
              .maybeSingle();
            if (youthError) {
              throw youthError;
            }
            if (!youth) {
              return createErrorResponse(
                "Youth account not found",
                404,
                "not_found",
                requestId,
              );
            }
          }

          // Check for existing link
          const { data: existingLink, error: existingLinkError } = await supabaseAdmin
            .from("parent_guardian_links")
            .select("id, status")
            .eq("parent_id", userId)
            .eq("youth_id", youthId)
            .maybeSingle();
          if (existingLinkError) {
            throw existingLinkError;
          }

          if (existingLink) {
            return createErrorResponse(
              `Link already exists with status: ${existingLink.status}`,
              409,
              "link_exists",
              requestId,
            );
          }

          // Create pending link
          const { data: newLink, error } = await supabaseAdmin
            .from("parent_guardian_links")
            .insert({
              parent_id: userId,
              youth_id: youthId,
              relationship: body.relationship || "parent",
              status: "pending",
            })
            .select()
            .single();

          if (error) {
            console.error("[Parent Dashboard] Error creating link:", error);
            throw error;
          }

          return createSuccessResponse(
            {
              link: newLink,
              message: "Link request created. Awaiting verification.",
            },
            requestId,
          );
        }

        // Method not allowed
        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
          requestId,
        );
      } catch (error) {
        if (error.message === "Request body must be an object") {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        if (
          error.code === "invalid_json" ||
          error.code === "INVALID_JSON_BODY" ||
          error.message === "Invalid JSON in request body"
        ) {
          return createErrorResponse(
            "Invalid JSON",
            400,
            "invalid_json",
            requestId,
          );
        }
        if (
          error.message?.includes("Invalid notification status") ||
          error.message?.includes("must be a boolean") ||
          error.message?.includes("positive integer") ||
          error.message?.includes("must be an integer between")
        ) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        if (error.message?.includes("already been processed")) {
          return createErrorResponse(
            error.message,
            409,
            "already_processed",
            requestId,
          );
        }
        if (error.message?.includes("not found")) {
          return createErrorResponse(
            error.message,
            404,
            "not_found",
            requestId,
          );
        }
        console.error("[Parent Dashboard] Error:", error);
        return createErrorResponse(
          error.message || "Failed to process request",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
