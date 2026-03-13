import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";

const VALID_DIGEST_TYPES = new Set(["daily", "weekly", "monthly"]);
const COACH_ROLES = new Set([
  "owner",
  "admin",
  "head_coach",
  "coach",
  "assistant_coach",
  "offense_coordinator",
  "defense_coordinator",
]);
const BOOLEAN_PREFERENCE_FIELDS = new Set([
  "daily_digest_enabled",
  "weekly_digest_enabled",
  "email_enabled",
  "push_enabled",
  "in_app_enabled",
  "sms_enabled",
  "include_ai_summary",
  "include_session_stats",
  "include_injury_alerts",
  "include_acwr_warnings",
  "include_achievement_alerts",
  "include_team_overview",
  "include_high_risk_summary",
  "include_child_activity",
  "quiet_hours_enabled",
]);

const isValidTimeString = (value) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

const parseHistoryLimit = (value) => {
  if (value === undefined || value === null || value === "") {
    return 20;
  }
  if (!/^\d+$/.test(String(value))) {
    throw new Error("limit must be an integer between 1 and 200");
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
    throw new Error("limit must be an integer between 1 and 200");
  }
  return parsed;
};

const resolveDigestType = (value) => {
  const normalized = value || "weekly";
  if (!VALID_DIGEST_TYPES.has(normalized)) {
    throw new Error("digest type must be one of: daily, weekly, monthly");
  }
  return normalized;
};

const resolveDigestPeriod = (digestType, now = new Date()) => {
  const periodEnd = now;
  const periodStart = new Date(now);
  if (digestType === "daily") {
    periodStart.setHours(0, 0, 0, 0);
  } else if (digestType === "weekly") {
    periodStart.setDate(periodStart.getDate() - 7);
  } else {
    periodStart.setDate(periodStart.getDate() - 30);
  }
  return { periodStart, periodEnd };
};

const validatePreferenceUpdates = (updates) => {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("No valid preference fields provided");
  }

  for (const [field, value] of Object.entries(updates)) {
    if (BOOLEAN_PREFERENCE_FIELDS.has(field) && typeof value !== "boolean") {
      throw new Error(`${field} must be a boolean`);
    }
    if (field === "weekly_digest_day") {
      if (!Number.isInteger(value) || value < 0 || value > 6) {
        throw new Error("weekly_digest_day must be an integer between 0 and 6");
      }
    }
    if (
      ["daily_digest_time", "weekly_digest_time", "quiet_hours_start", "quiet_hours_end"].includes(
        field,
      )
    ) {
      if (!isValidTimeString(value)) {
        throw new Error(`${field} must be a valid HH:MM or HH:MM:SS time`);
      }
    }
    if (field === "timezone") {
      if (!value || typeof value !== "string" || !value.trim()) {
        throw new Error("timezone must be a non-empty string");
      }
    }
  }
};

const parseJsonObjectBody = (rawBody) => {
  let parsed;
  try {
    parsed = JSON.parse(rawBody || "{}");
  } catch {
    const error = new Error("Invalid JSON");
    error.code = "invalid_json";
    throw error;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be an object");
  }

  return parsed;
};

/**
 * Netlify Function: Notification Digest
 *
 * Phase 4: Scheduled digest generation and notification preferences
 *
 * Endpoints:
 * - GET /api/notification-digest/preview - Preview digest content
 * - POST /api/notification-digest/send - Trigger digest send (scheduled function)
 * - GET /api/notification-digest/preferences - Get user preferences
 * - PATCH /api/notification-digest/preferences - Update preferences
 * - GET /api/notification-digest/history - Get digest history
 *
 * This function is also designed to be triggered by scheduled events
 * for automated daily/weekly digest delivery.
 */

// =====================================================
// DIGEST CONTENT GENERATORS
// =====================================================

/**
 * Generate digest content for an athlete
 * @param {string} userId - User ID
 * @param {string} digestType - 'daily' or 'weekly'
 * @param {Date} periodStart - Start of period
 * @param {Date} periodEnd - End of period
 * @returns {Object} - Digest content
 */
async function generateAthleteDigest(
  userId,
  digestType,
  periodStart,
  periodEnd,
) {
  const content = {
    type: digestType,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    sections: [],
    summary: {},
  };

  // AI Interactions Summary
  const { data: aiMessages } = await supabaseAdmin
    .from("ai_messages")
    .select("role, intent_type, risk_level")
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString());

  if (aiMessages && aiMessages.length > 0) {
    const highRisk = aiMessages.filter((m) => m.risk_level === "high").length;
    content.sections.push({
      title: "AI Coach Activity",
      icon: "pi-comments",
      items: [
        `You asked ${aiMessages.length} question${aiMessages.length !== 1 ? "s" : ""} this ${digestType === "daily" ? "day" : "week"}`,
        highRisk > 0 ? `${highRisk} required extra safety guidance` : null,
      ].filter(Boolean),
    });
    content.summary.aiQuestions = aiMessages.length;
  }

  // Session Progress
  const { data: sessions } = await supabaseAdmin
    .from("micro_sessions")
    .select("status, actual_duration_minutes")
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString());

  if (sessions && sessions.length > 0) {
    const completed = sessions.filter((s) => s.status === "completed").length;
    const totalMinutes = sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0);

    content.sections.push({
      title: "Training Sessions",
      icon: "pi-play-circle",
      items: [
        `Completed ${completed} of ${sessions.length} sessions`,
        totalMinutes > 0
          ? `Total training time: ${totalMinutes} minutes`
          : null,
        completed === sessions.length ? "🎉 100% completion rate!" : null,
      ].filter(Boolean),
    });
    content.summary.sessionsCompleted = completed;
    content.summary.sessionsTotal = sessions.length;
  }

  // Streak Update - Note: streak columns don't exist in users table yet
  // TODO: Add current_streak, longest_streak columns to users table if streak feature is needed
  // For now, skip streak section as the data isn't available

  // Achievements
  const { data: achievements } = await supabaseAdmin
    .from("athlete_achievements")
    .select("achievement_name, points_awarded")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .gte("completed_at", periodStart.toISOString())
    .lte("completed_at", periodEnd.toISOString());

  if (achievements && achievements.length > 0) {
    content.sections.push({
      title: "New Achievements",
      icon: "pi-trophy",
      items: achievements.map(
        (a) => `🏆 ${a.achievement_name} (+${a.points_awarded} pts)`,
      ),
    });
    content.summary.newAchievements = achievements.length;
  }

  // Readiness Trend
  const { data: dailyStates } = await supabaseAdmin
    .from("daily_wellness_checkin")
    .select("calculated_readiness, muscle_soreness")
    .eq("user_id", userId)
    .gte("checkin_date", periodStart.toISOString().split("T")[0])
    .lte("checkin_date", periodEnd.toISOString().split("T")[0])
    .order("checkin_date", { ascending: true });

  if (dailyStates && dailyStates.length > 0) {
    const avgReadiness =
      dailyStates
        .filter((s) => s.calculated_readiness !== null)
        .reduce((sum, s) => sum + parseFloat(s.calculated_readiness), 0) /
      dailyStates.length;

    content.sections.push({
      title: "Wellness Check",
      icon: "pi-heart",
      items: [
        `Average readiness: ${Math.round(avgReadiness * 100)}%`,
        dailyStates.length === (digestType === "daily" ? 1 : 7)
          ? "Great job logging daily!"
          : `Logged ${dailyStates.length} day${dailyStates.length !== 1 ? "s" : ""}`,
      ],
    });
    content.summary.avgReadiness = Math.round(avgReadiness * 100);
  }

  // Pending Follow-ups
  const { data: followups } = await supabaseAdmin
    .from("ai_followups")
    .select("followup_prompt")
    .eq("user_id", userId)
    .eq("status", "pending")
    .lte("scheduled_for", periodEnd.toISOString())
    .limit(3);

  if (followups && followups.length > 0) {
    content.sections.push({
      title: "Check-ins Needed",
      icon: "pi-bell",
      items: followups.map((f) => f.followup_prompt),
      action: {
        label: "Open AI Coach",
        type: "link",
        url: "/ai-coach",
      },
    });
  }

  return content;
}

/**
 * Generate digest content for a coach
 * @param {string} coachId - Coach user ID
 * @param {string} digestType - 'daily' or 'weekly'
 * @param {Date} periodStart - Start of period
 * @param {Date} periodEnd - End of period
 * @returns {Object} - Digest content
 */
async function generateCoachDigest(
  coachId,
  digestType,
  periodStart,
  periodEnd,
) {
  const content = {
    type: digestType,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    sections: [],
    summary: {},
  };

  // Get coach's teams
  const { data: teams } = await supabaseAdmin
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("user_id", coachId)
    .eq("status", "active")
    .in("role", [...COACH_ROLES]);

  if (!teams || teams.length === 0) {
    content.sections.push({
      title: "No Teams",
      icon: "pi-users",
      items: ["You're not currently assigned to any teams"],
    });
    return content;
  }

  const teamIds = teams.map((t) => t.team_id);

  // Get team members
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .in("team_id", teamIds)
    .eq("status", "active");

  const memberIds = [...new Set((members || []).map((m) => m.user_id))];

  // Team Overview
  const { count: activeAthletes } = await supabaseAdmin
    .from("ai_messages")
    .select("user_id", { count: "exact", head: true })
    .in("user_id", memberIds)
    .eq("role", "user")
    .gte("created_at", periodStart.toISOString());

  content.sections.push({
    title: "Team Overview",
    icon: "pi-users",
    items: [
      `${memberIds.length} athletes across ${teams.length} team${teams.length !== 1 ? "s" : ""}`,
      `${activeAthletes || 0} active with AI Coach this ${digestType === "daily" ? "day" : "week"}`,
    ],
  });

  // High-Risk Alerts
  const { data: highRiskMessages } = await supabaseAdmin
    .from("ai_messages")
    .select("user_id, content, created_at")
    .in("user_id", memberIds)
    .eq("role", "user")
    .eq("risk_level", "high")
    .is("coach_reviewed_at", null)
    .gte("created_at", periodStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  if (highRiskMessages && highRiskMessages.length > 0) {
    content.sections.push({
      title: "⚠️ Needs Review",
      icon: "pi-exclamation-triangle",
      items: [
        `${highRiskMessages.length} high-risk interaction${highRiskMessages.length !== 1 ? "s" : ""} awaiting review`,
      ],
      action: {
        label: "Review Now",
        type: "link",
        url: "/coach/inbox",
      },
      priority: "high",
    });
    content.summary.unreviewedHighRisk = highRiskMessages.length;
  }

  // Session Completion
  const { data: teamSessions } = await supabaseAdmin
    .from("micro_sessions")
    .select("status")
    .in("user_id", memberIds)
    .gte("created_at", periodStart.toISOString());

  if (teamSessions && teamSessions.length > 0) {
    const completed = teamSessions.filter(
      (s) => s.status === "completed",
    ).length;
    const rate = Math.round((completed / teamSessions.length) * 100);

    content.sections.push({
      title: "Session Completion",
      icon: "pi-chart-bar",
      items: [
        `${completed}/${teamSessions.length} sessions completed (${rate}%)`,
        rate >= 80
          ? "Great team engagement!"
          : rate >= 50
            ? "Room for improvement"
            : "Consider follow-up",
      ],
    });
    content.summary.teamCompletionRate = rate;
  }

  // Feedback Needed
  const { count: feedbackNeeded } = await supabaseAdmin
    .from("ai_messages")
    .select("*", { count: "exact", head: true })
    .in("user_id", memberIds)
    .eq("role", "assistant")
    .eq("feedback_received", false)
    .eq("risk_level", "medium")
    .gte("created_at", periodStart.toISOString());

  if (feedbackNeeded && feedbackNeeded > 0) {
    content.sections.push({
      title: "Classification Review",
      icon: "pi-check-square",
      items: [
        `${feedbackNeeded} medium-risk responses could use your feedback`,
        "Your reviews help improve AI accuracy",
      ],
      action: {
        label: "Review Classifications",
        type: "link",
        url: "/coach/analytics",
      },
    });
  }

  return content;
}

/**
 * Generate digest content for a parent
 * @param {string} parentId - Parent user ID
 * @param {string} digestType - 'daily' or 'weekly'
 * @param {Date} periodStart - Start of period
 * @param {Date} periodEnd - End of period
 * @returns {Object} - Digest content
 */
async function generateParentDigest(
  parentId,
  digestType,
  periodStart,
  periodEnd,
) {
  const content = {
    type: digestType,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    sections: [],
    children: [],
  };

  // Get linked children
  const { data: links } = await supabaseAdmin
    .from("parent_guardian_links")
    .select(
      `
      youth_id,
      youth:youth_id(id, first_name, last_name)
    `,
    )
    .eq("parent_id", parentId)
    .eq("status", "verified");

  if (!links || links.length === 0) {
    content.sections.push({
      title: "No Linked Athletes",
      icon: "pi-user",
      items: ["Link your athlete's account to receive activity updates"],
    });
    return content;
  }

  // Generate summary for each child
  for (const link of links) {
    const childId = link.youth_id;
    const childName = link.youth
      ? `${link.youth.first_name || ""} ${link.youth.last_name || ""}`.trim()
      : "Your athlete";

    const childSummary = {
      name: childName,
      id: childId,
      sections: [],
    };

    // AI Activity
    const { data: aiMessages } = await supabaseAdmin
      .from("ai_messages")
      .select("risk_level, youth_restrictions_applied")
      .eq("user_id", childId)
      .eq("role", "user")
      .gte("created_at", periodStart.toISOString());

    const highRisk = (aiMessages || []).filter(
      (m) => m.risk_level === "high",
    ).length;
    const restricted = (aiMessages || []).filter(
      (m) =>
        m.youth_restrictions_applied && m.youth_restrictions_applied.length > 0,
    ).length;

    if (aiMessages && aiMessages.length > 0) {
      childSummary.sections.push({
        title: "AI Coach Activity",
        items: [
          `${aiMessages.length} question${aiMessages.length !== 1 ? "s" : ""} asked`,
          highRisk > 0
            ? `⚠️ ${highRisk} high-safety topic${highRisk !== 1 ? "s" : ""}`
            : "All topics age-appropriate",
          restricted > 0
            ? `${restricted} had safety restrictions applied`
            : null,
        ].filter(Boolean),
      });
    }

    // Sessions
    const { data: sessions } = await supabaseAdmin
      .from("micro_sessions")
      .select("status")
      .eq("user_id", childId)
      .gte("created_at", periodStart.toISOString());

    if (sessions && sessions.length > 0) {
      const completed = sessions.filter((s) => s.status === "completed").length;
      childSummary.sections.push({
        title: "Training Sessions",
        items: [`Completed ${completed} of ${sessions.length} sessions`],
      });
    }

    content.children.push(childSummary);
  }

  // Pending Approvals
  const { data: approvals } = await supabaseAdmin
    .from("approval_requests")
    .select("title, youth_id")
    .eq("approver_id", parentId)
    .eq("status", "pending");

  if (approvals && approvals.length > 0) {
    content.sections.push({
      title: "Action Required",
      icon: "pi-exclamation-circle",
      items: [
        `${approvals.length} approval${approvals.length !== 1 ? "s" : ""} pending`,
      ],
      action: {
        label: "Review Approvals",
        type: "link",
        url: "/parent-dashboard",
      },
      priority: "high",
    });
  }

  // Unread Notifications
  const { count: unread } = await supabaseAdmin
    .from("parent_notifications")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", parentId)
    .eq("status", "unread");

  if (unread && unread > 0) {
    content.sections.push({
      title: "Notifications",
      icon: "pi-bell",
      items: [`${unread} unread notification${unread !== 1 ? "s" : ""}`],
    });
  }

  return content;
}

// =====================================================
// PREFERENCE MANAGEMENT
// =====================================================

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Object} - Preferences
 */
async function getNotificationPreferences(userId) {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[Notification Digest] Error fetching preferences:", error);
    throw error;
  }

  // Return defaults if no preferences exist
  if (!data) {
    return {
      user_id: userId,
      daily_digest_enabled: false,
      daily_digest_time: "08:00:00",
      weekly_digest_enabled: true,
      weekly_digest_day: 1,
      weekly_digest_time: "09:00:00",
      email_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      include_ai_summary: true,
      include_session_stats: true,
      include_achievement_alerts: true,
      timezone: "America/New_York",
      _isDefault: true,
    };
  }

  return data;
}

/**
 * Update user notification preferences
 * @param {string} userId - User ID
 * @param {Object} updates - Preference updates
 * @returns {Object} - Updated preferences
 */
async function updateNotificationPreferences(userId, updates) {
  // Check if preferences exist
  const existing = await getNotificationPreferences(userId);

  const data = {
    user_id: userId,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing._isDefault) {
    // Create new
    data.created_at = new Date().toISOString();
    const { data: created, error } = await supabaseAdmin
      .from("notification_preferences")
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = created;
  } else {
    // Update existing
    const { data: updated, error } = await supabaseAdmin
      .from("notification_preferences")
      .update(data)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = updated;
  }

  return result;
}

/**
 * Get digest history for user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Array} - Digest history
 */
async function getDigestHistory(userId, options = {}) {
  const { limit = 20, digestType } = options;

  let query = supabaseAdmin
    .from("digest_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (digestType) {
    query = query.eq("digest_type", digestType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Notification Digest] Error fetching history:", error);
    throw error;
  }

  return data || [];
}

/**
 * Record sent digest
 * @param {string} userId - User ID
 * @param {string} digestType - 'daily' or 'weekly'
 * @param {Date} periodStart - Start of period
 * @param {Date} periodEnd - End of period
 * @param {Object} content - Digest content
 * @param {string} deliveryChannel - Delivery method
 */
async function recordDigestSent(
  userId,
  digestType,
  periodStart,
  periodEnd,
  content,
  deliveryChannel,
) {
  const payload = {
    user_id: userId,
    digest_type: digestType,
    period_start: periodStart.toISOString().split("T")[0],
    period_end: periodEnd.toISOString().split("T")[0],
    content_summary: content,
    items_included: content.sections?.length || 0,
    delivery_channel: deliveryChannel,
    delivered_at: new Date().toISOString(),
    delivery_status: "delivered",
  };

  const { error } = await supabaseAdmin.from("digest_history").insert(payload);
  if (error) {
    if (error.code === "23505") {
      return { duplicate: true };
    }
    throw error;
  }
  return { duplicate: false };
}

/**
 * Determine user role for digest type
 * @param {string} userId - User ID
 * @returns {string} - 'athlete', 'coach', or 'parent'
 */
async function getUserRole(userId) {
  // Check if coach
  const { data: coachRole } = await supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", [...COACH_ROLES])
    .limit(1)
    .maybeSingle();

  if (coachRole) {
    return "coach";
  }

  // Check if parent
  const { data: parentRole } = await supabaseAdmin
    .from("parent_guardian_links")
    .select("id")
    .eq("parent_id", userId)
    .eq("status", "verified")
    .limit(1)
    .single();

  if (parentRole) {
    return "parent";
  }

  return "athlete";
}

// =====================================================
// MAIN HANDLER
// =====================================================

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "notification-digest",
    allowedMethods: ["GET", "POST", "PATCH"],
rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const { path } = event;
      const method = event.httpMethod;
      const params = event.queryStringParameters || {};

      // Parse path
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?notification-digest\/?/, "")
        .split("/")
        .filter(Boolean);
      const resource = pathParts[0] || "";

      try {
        // GET /api/notification-digest/preview - Preview digest
        if (method === "GET" && resource === "preview") {
          const digestType = resolveDigestType(params.type);
          const { periodStart, periodEnd } = resolveDigestPeriod(digestType);

          const role = await getUserRole(userId);
          let content;

          if (role === "coach") {
            content = await generateCoachDigest(
              userId,
              digestType,
              periodStart,
              periodEnd,
            );
          } else if (role === "parent") {
            content = await generateParentDigest(
              userId,
              digestType,
              periodStart,
              periodEnd,
            );
          } else {
            content = await generateAthleteDigest(
              userId,
              digestType,
              periodStart,
              periodEnd,
            );
          }

          return createSuccessResponse(
            {
              role,
              digestType,
              content,
            },
            requestId,
          );
        }

        // GET /api/notification-digest/preferences - Get preferences
        if (method === "GET" && resource === "preferences") {
          const preferences = await getNotificationPreferences(userId);
          return createSuccessResponse(preferences, requestId);
        }

        // PATCH /api/notification-digest/preferences - Update preferences
        if (method === "PATCH" && resource === "preferences") {
          const body = parseJsonObjectBody(event.body);

          // Whitelist allowed fields
          const allowedFields = [
            "daily_digest_enabled",
            "daily_digest_time",
            "weekly_digest_enabled",
            "weekly_digest_day",
            "weekly_digest_time",
            "email_enabled",
            "push_enabled",
            "in_app_enabled",
            "sms_enabled",
            "include_ai_summary",
            "include_session_stats",
            "include_injury_alerts",
            "include_acwr_warnings",
            "include_achievement_alerts",
            "include_team_overview",
            "include_high_risk_summary",
            "include_child_activity",
            "quiet_hours_enabled",
            "quiet_hours_start",
            "quiet_hours_end",
            "timezone",
          ];

          const updates = {};
          for (const field of allowedFields) {
            if (body[field] !== undefined) {
              updates[field] = body[field];
            }
          }
          validatePreferenceUpdates(updates);

          const preferences = await updateNotificationPreferences(
            userId,
            updates,
          );
          return createSuccessResponse(preferences, requestId);
        }

        // GET /api/notification-digest/history - Get history
        if (method === "GET" && resource === "history") {
          const digestType = params.type ? resolveDigestType(params.type) : undefined;
          const history = await getDigestHistory(userId, {
            limit: parseHistoryLimit(params.limit),
            digestType,
          });
          return createSuccessResponse({ history }, requestId);
        }

        // POST /api/notification-digest/send - Send digest (for scheduled trigger)
        if (method === "POST" && resource === "send") {
          // This endpoint would typically be called by a scheduler
          // For now, it generates and records a digest for the user

          const body = parseJsonObjectBody(event.body);

          const digestType = resolveDigestType(body.digestType);
          const { periodStart, periodEnd } = resolveDigestPeriod(digestType);

          const role = await getUserRole(userId);
          let content;

          if (role === "coach") {
            content = await generateCoachDigest(
              userId,
              digestType,
              periodStart,
              periodEnd,
            );
          } else if (role === "parent") {
            content = await generateParentDigest(
              userId,
              digestType,
              periodStart,
              periodEnd,
            );
          } else {
            content = await generateAthleteDigest(
              userId,
              digestType,
              periodStart,
              periodEnd,
            );
          }

          // Record the digest
          const recordResult = await recordDigestSent(
            userId,
            digestType,
            periodStart,
            periodEnd,
            content,
            "in_app",
          );

          return createSuccessResponse(
            {
              message: recordResult.duplicate
                ? "Digest already recorded for this period and channel"
                : "Digest generated and recorded",
              digestType,
              role,
              content,
              duplicate: recordResult.duplicate,
            },
            requestId,
          );
        }

        return createErrorResponse("Endpoint not found", 404, "not_found", requestId);
      } catch (error) {
        if (error.code === "invalid_json") {
          return createErrorResponse("Invalid JSON", 400, "invalid_json", requestId);
        }
        if (
          error.message?.includes("digest type must be") ||
          error.message?.includes("must be a boolean") ||
          error.message?.includes("must be an integer between 0 and 6") ||
          error.message?.includes("must be a valid HH:MM") ||
          error.message?.includes("timezone must be a non-empty string") ||
          error.message?.includes("No valid preference fields provided") ||
          error.message?.includes("Request body must be an object") ||
          error.message?.includes("limit must be an integer between 1 and 200")
        ) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        console.error("[Notification Digest] Error:", error);
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
