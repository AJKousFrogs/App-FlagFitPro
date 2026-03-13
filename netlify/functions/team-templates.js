import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";

/**
 * Netlify Function: Team Templates
 *
 * Phase 2: Reusable coaching templates ("Team Standard")
 *
 * Endpoints:
 * - GET /api/team-templates - List templates for coach's teams
 * - GET /api/team-templates/:id - Get single template detail
 * - POST /api/team-templates - Create a new template
 * - PATCH /api/team-templates/:id - Update a template
 * - DELETE /api/team-templates/:id - Deactivate a template
 * - POST /api/team-templates/:id/assign - Assign template to athlete(s)
 * - POST /api/team-templates/from-inbox - Create template from inbox item
 *
 * Template Types:
 * - micro_session: Workout/activity to assign to athletes
 * - response_override: Replace AI responses for specific intents
 * - checklist: Pre-game, post-game, or injury checklists
 */

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function createHttpError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

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
    .in("role", ["coach", "assistant_coach", "head_coach", "admin"])
    .or("is_active.eq.true,status.eq.active");

  if (error) {
    console.error("[Team Templates] Error verifying coach status:", error);
    return { isCoach: false, teamIds: [] };
  }

  return {
    isCoach: coachTeams && coachTeams.length > 0,
    teamIds: (coachTeams || []).map((t) => t.team_id),
  };
}

/**
 * Create a new team template
 * @param {Object} templateData - Template data
 * @param {string} userId - Creator user ID
 * @returns {Object} - Created template
 */
async function createTemplate(templateData, userId) {
  const {
    team_id,
    name,
    description,
    category,
    template_type,
    content,
    position_filter = ["ALL"],
    applies_to_youth = true,
    applies_to_adults = true,
    is_default = false,
  } = templateData;

  const { data, error } = await supabaseAdmin
    .from("team_templates")
    .insert({
      team_id,
      created_by: userId,
      name,
      description,
      category,
      template_type,
      content,
      position_filter,
      applies_to_youth,
      applies_to_adults,
      is_default,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[Team Templates] Error creating template:", error);
    throw error;
  }

  return data;
}

/**
 * Create a template from a coach inbox item
 * @param {string} inboxItemId - Inbox item ID
 * @param {Object} templateOverrides - Additional template properties
 * @param {string} userId - Creator user ID
 * @returns {Object} - Created template
 */
async function createTemplateFromInbox(
  inboxItemId,
  templateOverrides,
  userId,
  allowedTeamIds,
) {
  // Get the inbox item
  const { data: inboxItem, error: inboxError } = await supabaseAdmin
    .from("coach_inbox_items")
    .select("*")
    .eq("id", inboxItemId)
    .single();

  if (inboxError || !inboxItem) {
    throw new Error("Inbox item not found");
  }
  if (!allowedTeamIds.includes(inboxItem.team_id)) {
    throw createHttpError(
      "Not authorized to create a template for this team",
      403,
      "not_authorized",
    );
  }

  // Get the source message if it's an AI message
  let _sourceContent = null;
  if (inboxItem.source_type === "ai_message") {
    const { data: message } = await supabaseAdmin
      .from("ai_messages")
      .select("content, metadata")
      .eq("id", inboxItem.source_id)
      .single();
    _sourceContent = message;
  }

  // Build template content based on type
  const templateContent = {
    source_inbox_item_id: inboxItemId,
    original_intent: inboxItem.intent_type,
    original_risk_level: inboxItem.risk_level,
    ...templateOverrides.content,
  };

  // If it's a micro_session template, structure it properly
  if (templateOverrides.template_type === "micro_session") {
    templateContent.title =
      templateOverrides.name || `${inboxItem.title} - Team Protocol`;
    templateContent.description =
      templateOverrides.description || inboxItem.summary;
    templateContent.session_type = templateOverrides.category || "recovery";
    templateContent.estimated_duration_minutes =
      templateOverrides.content?.estimated_duration_minutes || 10;
    templateContent.equipment_needed =
      templateOverrides.content?.equipment_needed || [];
    templateContent.steps = templateOverrides.content?.steps || [];
    templateContent.coaching_cues =
      templateOverrides.content?.coaching_cues || [];
    templateContent.safety_notes =
      templateOverrides.content?.safety_notes || null;
  }

  // Create the template
  const template = await createTemplate(
    {
      team_id: inboxItem.team_id,
      name: templateOverrides.name || `Team Standard: ${inboxItem.title}`,
      description:
        templateOverrides.description ||
        `Created from inbox item on ${new Date().toLocaleDateString()}`,
      category: templateOverrides.category || "recovery",
      template_type: templateOverrides.template_type || "micro_session",
      content: templateContent,
      position_filter: templateOverrides.position_filter || ["ALL"],
      applies_to_youth: templateOverrides.applies_to_youth ?? true,
      applies_to_adults: templateOverrides.applies_to_adults ?? true,
      is_default: templateOverrides.is_default ?? false,
    },
    userId,
  );

  // Update the inbox item to mark as saved_template
  await supabaseAdmin
    .from("coach_inbox_items")
    .update({
      status: "saved_template",
      coach_action: "save_template",
      actioned_at: new Date().toISOString(),
    })
    .eq("id", inboxItemId);

  return template;
}

/**
 * List templates for a coach's teams
 * @param {string[]} teamIds - Team IDs
 * @param {Object} filters - Query filters
 * @returns {Array} - Templates
 */
async function listTemplates(teamIds, filters = {}) {
  const {
    team_id,
    category,
    template_type,
    is_active = true,
    limit = 50,
  } = filters;

  let query = supabaseAdmin
    .from("team_templates")
    .select(
      `
      *,
      team:team_id(id, name),
      creator:created_by(id, first_name, last_name)
    `,
    )
    .in("team_id", teamIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (team_id) {
    query = query.eq("team_id", team_id);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (template_type) {
    query = query.eq("template_type", template_type);
  }
  if (is_active !== undefined) {
    query = query.eq("is_active", is_active);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Team Templates] Error listing templates:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single template by ID
 * @param {string} templateId - Template ID
 * @param {string[]} teamIds - Allowed team IDs
 * @returns {Object|null} - Template or null
 */
async function getTemplateById(templateId, teamIds) {
  const { data, error } = await supabaseAdmin
    .from("team_templates")
    .select(
      `
      *,
      team:team_id(id, name),
      creator:created_by(id, first_name, last_name)
    `,
    )
    .eq("id", templateId)
    .in("team_id", teamIds)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[Team Templates] Error fetching template:", error);
    throw error;
  }

  return data;
}

/**
 * Update a template
 * @param {string} templateId - Template ID
 * @param {string[]} teamIds - Allowed team IDs
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated template
 */
async function updateTemplate(templateId, teamIds, updates) {
  const {
    name,
    description,
    category,
    content,
    position_filter,
    applies_to_youth,
    applies_to_adults,
    is_active,
    is_default,
  } = updates;

  const updateData = {};
  if (name !== undefined) {
    updateData.name = name;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (category !== undefined) {
    updateData.category = category;
  }
  if (content !== undefined) {
    updateData.content = content;
  }
  if (position_filter !== undefined) {
    updateData.position_filter = position_filter;
  }
  if (applies_to_youth !== undefined) {
    updateData.applies_to_youth = applies_to_youth;
  }
  if (applies_to_adults !== undefined) {
    updateData.applies_to_adults = applies_to_adults;
  }
  if (is_active !== undefined) {
    updateData.is_active = is_active;
  }
  if (is_default !== undefined) {
    updateData.is_default = is_default;
  }

  const { data, error } = await supabaseAdmin
    .from("team_templates")
    .update(updateData)
    .eq("id", templateId)
    .in("team_id", teamIds)
    .select()
    .single();

  if (error) {
    console.error("[Team Templates] Error updating template:", error);
    throw error;
  }

  return data;
}

/**
 * Assign a template to athlete(s)
 * Creates micro-sessions or appropriate records for each athlete
 * @param {string} templateId - Template ID
 * @param {string[]} athleteIds - Athlete user IDs to assign to
 * @param {string} assignedBy - Coach user ID
 * @param {string} reason - Assignment reason
 * @param {string|null} sourceInboxItemId - Optional source inbox item
 * @returns {Object} - Assignment results
 */
async function assignTemplate(
  templateId,
  athleteIds,
  assignedBy,
  allowedTeamIds,
  reason = null,
  sourceInboxItemId = null,
) {
  // Get the template
  const { data: template, error: templateError } = await supabaseAdmin
    .from("team_templates")
    .select("id, team_id, template_type, content, name, description, category, position_filter")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    throw new Error("Template not found");
  }
  if (!allowedTeamIds.includes(template.team_id)) {
    throw createHttpError(
      "Not authorized to assign this template",
      403,
      "not_authorized",
    );
  }

  const { data: athleteMemberships, error: athleteMembershipsError } =
    await supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("team_id", template.team_id)
      .in("user_id", athleteIds)
      .or("is_active.eq.true,status.eq.active");
  if (athleteMembershipsError) {
    throw athleteMembershipsError;
  }
  const eligibleAthleteIds = new Set((athleteMemberships || []).map((a) => a.user_id));

  const results = {
    assigned: [],
    failed: [],
  };

  for (const athleteId of athleteIds) {
    try {
      if (!eligibleAthleteIds.has(athleteId)) {
        throw new Error("Athlete is not an active member of template team");
      }

      let microSessionId = null;

      // If it's a micro_session template, create a micro-session for the athlete
      if (template.template_type === "micro_session") {
        const { data: microSession, error: msError } = await supabaseAdmin
          .from("micro_sessions")
          .insert({
            user_id: athleteId,
            title: template.content.title || template.name,
            description: template.content.description || template.description,
            session_type: template.content.session_type || template.category,
            estimated_duration_minutes:
              template.content.estimated_duration_minutes || 10,
            equipment_needed: template.content.equipment_needed || [],
            source_type: "team_template",
            source_id: templateId,
            position_relevance: template.position_filter,
            intensity_level: template.content.intensity_level || "low",
            steps: template.content.steps || [],
            coaching_cues: template.content.coaching_cues || [],
            safety_notes: template.content.safety_notes,
            follow_up_prompt:
              template.content.follow_up_prompt ||
              "How do you feel after completing this? (0-10)",
            assigned_date: new Date().toISOString().split("T")[0],
            status: "pending",
          })
          .select()
          .single();

        if (msError) {
          throw msError;
        }
        microSessionId = microSession.id;
      }

      // Create assignment record
      const { data: assignment, error: assignError } = await supabaseAdmin
        .from("template_assignments")
        .insert({
          template_id: templateId,
          user_id: athleteId,
          assigned_by: assignedBy,
          reason,
          source_inbox_item_id: sourceInboxItemId,
          micro_session_id: microSessionId,
          status: "assigned",
        })
        .select()
        .single();

      if (assignError) {
        throw assignError;
      }

      results.assigned.push({
        athlete_id: athleteId,
        assignment_id: assignment.id,
        micro_session_id: microSessionId,
      });
    } catch (error) {
      console.error(
        `[Team Templates] Error assigning to athlete ${athleteId}:`,
        error,
      );
      results.failed.push({
        athlete_id: athleteId,
        error: "Assignment failed",
      });
    }
  }

  return results;
}

// =====================================================
// MAIN HANDLER
// =====================================================

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET"
    ? "READ"
    : event.httpMethod === "DELETE"
      ? "DELETE"
      : "UPDATE";
  return baseHandler(event, context, {
    functionName: "team-templates",
    allowedMethods: ["GET", "POST", "PATCH", "DELETE"],
rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const { path } = event;
      const method = event.httpMethod;

      // Verify user is a coach
      const { isCoach, teamIds } = await verifyCoachAndGetTeams(userId);

      if (!isCoach) {
        return createErrorResponse(
          "Not authorized. You must be a coach or assistant coach to manage templates.",
          403,
          "not_coach",
          requestId,
        );
      }

      // Parse path
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?team-templates\/?/, "")
        .split("/")
        .filter(Boolean);
      const subPath = pathParts[0] || "";
      const templateId =
        pathParts[0] && subPath !== "from-inbox" ? pathParts[0] : null;
      const action = pathParts[1] || null;

      try {
        // POST /api/team-templates/from-inbox - Create from inbox item
        if (method === "POST" && subPath === "from-inbox") {
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

          if (!body.inbox_item_id) {
            return createErrorResponse(
              "inbox_item_id is required",
              400,
              "validation_error",
              requestId,
            );
          }

          const template = await createTemplateFromInbox(
            body.inbox_item_id,
            body,
            userId,
            teamIds,
          );

          return createSuccessResponse(template, requestId);
        }

        // POST /api/team-templates/:id/assign - Assign template to athletes
        if (method === "POST" && templateId && action === "assign") {
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

          if (
            !body.athlete_ids ||
            !Array.isArray(body.athlete_ids) ||
            body.athlete_ids.length === 0
          ) {
            return createErrorResponse(
              "athlete_ids array is required",
              400,
              "validation_error",
              requestId,
            );
          }

          const results = await assignTemplate(
            templateId,
            body.athlete_ids,
            userId,
            teamIds,
            body.reason,
            body.source_inbox_item_id,
          );

          return createSuccessResponse(results, requestId);
        }

        // GET /api/team-templates/:id - Single template detail
        if (method === "GET" && templateId) {
          const template = await getTemplateById(templateId, teamIds);
          if (!template) {
            return createErrorResponse(
              "Template not found",
              404,
              "not_found",
              requestId,
            );
          }
          return createSuccessResponse(template, requestId);
        }

        // GET /api/team-templates - List templates
        if (method === "GET") {
          const filters = event.queryStringParameters || {};
          const templates = await listTemplates(teamIds, filters);
          return createSuccessResponse(
            {
              templates,
              total: templates.length,
            },
            requestId,
          );
        }

        // POST /api/team-templates - Create new template
        if (method === "POST" && !templateId) {
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

          // Validate required fields
          if (
            !body.team_id ||
            !body.name ||
            !body.template_type ||
            !body.content
          ) {
            return createErrorResponse(
              "team_id, name, template_type, and content are required",
              400,
              "validation_error",
              requestId,
            );
          }

          // Verify coach has access to the team
          if (!teamIds.includes(body.team_id)) {
            return createErrorResponse(
              "You are not a coach for this team",
              403,
              "not_authorized",
              requestId,
            );
          }

          const template = await createTemplate(body, userId);
          return createSuccessResponse(template, requestId);
        }

        // PATCH /api/team-templates/:id - Update template
        if (method === "PATCH" && templateId) {
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

          const template = await updateTemplate(templateId, teamIds, body);
          return createSuccessResponse(template, requestId);
        }

        // DELETE /api/team-templates/:id - Deactivate template
        if (method === "DELETE" && templateId) {
          const template = await updateTemplate(templateId, teamIds, {
            is_active: false,
          });
          return createSuccessResponse(
            { deactivated: true, template },
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
        console.error("[Team Templates] Error:", error);
        if (error?.statusCode) {
          return createErrorResponse(
            error.message,
            error.statusCode,
            error.code || "request_error",
            requestId,
          );
        }
        return createErrorResponse(
          "Failed to process team template request",
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
