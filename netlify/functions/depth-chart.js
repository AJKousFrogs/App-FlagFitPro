import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse, ErrorType } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { checkTeamMembership } from "./utils/auth-helper.js";
import { hasAnyRole, ROSTER_MANAGEMENT_ROLES } from "./utils/role-sets.js";

// Netlify Function: Depth Chart API
// Handles depth chart management for team rosters

// Standard flag football positions
const FLAG_FOOTBALL_POSITIONS = {
  offense: [
    { name: "Quarterback", abbreviation: "QB" },
    { name: "Center", abbreviation: "C" },
    { name: "Wide Receiver 1", abbreviation: "WR1" },
    { name: "Wide Receiver 2", abbreviation: "WR2" },
    { name: "Wide Receiver 3", abbreviation: "WR3" },
    { name: "Running Back", abbreviation: "RB" },
  ],
  defense: [
    { name: "Rusher", abbreviation: "R" },
    { name: "Safety", abbreviation: "S" },
    { name: "Cornerback 1", abbreviation: "CB1" },
    { name: "Cornerback 2", abbreviation: "CB2" },
    { name: "Linebacker", abbreviation: "LB" },
  ],
  special_teams: [
    { name: "Punt Returner", abbreviation: "PR" },
    { name: "Kick Returner", abbreviation: "KR" },
  ],
};

const VALID_CHART_TYPES = new Set(["offense", "defense", "special_teams"]);

const parseBoundedInt = (value, fieldName, { min, max }) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }

  return parsed;
};

const parseJsonObjectBody = (rawBody) => {
  if (rawBody === undefined || rawBody === null || rawBody === "") {
    return {};
  }

  const parsed = JSON.parse(rawBody);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Request body must be an object");
  }

  return parsed;
};

const assertActiveTeamPlayer = async (teamId, playerId) => {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", playerId)
    .eq("role", "player")
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!member) {
    throw new Error("player_id must reference an active player in this team");
  }
};

// Get all depth chart templates for a team
const getTeamDepthCharts = async (userId, teamId) => {
  checkEnvVars();

  const { authorized } = await checkTeamMembership(userId, teamId);
  if (!authorized) {
    throw new Error("Not authorized to view this team's depth charts");
  }

  const { data, error } = await supabaseAdmin
    .from("depth_chart_templates")
    .select("*")
    .eq("team_id", teamId)
    .order("chart_type");

  if (error) {
    throw error;
  }
  return data || [];
};

// Get a depth chart with all entries
const getDepthChartWithEntries = async (userId, templateId) => {
  checkEnvVars();

  const { data: template, error: templateError } = await supabaseAdmin
    .from("depth_chart_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    throw new Error("Depth chart not found");
  }

  const { authorized } = await checkTeamMembership(userId, template.team_id);
  if (!authorized) {
    throw new Error("Not authorized to view this depth chart");
  }

  const { data: entries, error: entriesError } = await supabaseAdmin
    .from("depth_chart_entries")
    .select(
      `
      *,
      users:player_id (
        id,
        full_name,
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("template_id", templateId)
    .order("position_name")
    .order("depth_order");

  if (entriesError) {
    throw entriesError;
  }

  // Transform entries to include player info
  const transformedEntries = (entries || []).map((entry) => ({
    ...entry,
    player_name:
      entry.users?.full_name ||
      [entry.users?.first_name, entry.users?.last_name].filter(Boolean).join(" ") ||
      entry.users?.email ||
      "Unknown player",
    player_number: null, // Would need to join with roster table
  }));

  return {
    ...template,
    entries: transformedEntries,
  };
};

// Create a new depth chart template
const createDepthChart = async (userId, chartData) => {
  checkEnvVars();

  const { team_id, name, chart_type, positions } = chartData;
  if (!team_id || !name || !chart_type) {
    throw new Error("team_id, name, and chart_type are required");
  }
  if (!VALID_CHART_TYPES.has(chart_type)) {
    throw new Error("Invalid chart_type");
  }
  if (positions !== undefined && !Array.isArray(positions)) {
    throw new Error("positions must be an array when provided");
  }

  const { authorized, role } = await checkTeamMembership(userId, team_id);
  if (!authorized || !hasAnyRole(role, ROSTER_MANAGEMENT_ROLES)) {
    throw new Error("Only authorized team coaches can create depth charts");
  }

  // Create the template
  const { data: template, error: templateError } = await supabaseAdmin
    .from("depth_chart_templates")
    .insert({
      team_id,
      name,
      chart_type,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (templateError) {
    throw templateError;
  }

  // Create default positions if provided or use standard positions
  const positionsToCreate =
    positions || FLAG_FOOTBALL_POSITIONS[chart_type] || [];

  if (positionsToCreate.length > 0) {
    const entries = positionsToCreate.map((pos) => ({
      template_id: template.id,
      position_name: pos.name || pos.position_name,
      position_abbreviation: pos.abbreviation || pos.position_abbreviation,
      depth_order: 1,
      updated_by: userId,
    }));
    const { error: insertError } = await supabaseAdmin
      .from("depth_chart_entries")
      .insert(entries);
    if (insertError) {
      throw insertError;
    }
  }

  return template;
};

// Update a depth chart template
const updateDepthChart = async (userId, templateId, updates) => {
  checkEnvVars();

  const { data: template, error: fetchError } = await supabaseAdmin
    .from("depth_chart_templates")
    .select("team_id")
    .eq("id", templateId)
    .single();

  if (fetchError || !template) {
    throw new Error("Depth chart not found");
  }

  const { authorized, role } = await checkTeamMembership(
    userId,
    template.team_id,
  );
  if (!authorized || !hasAnyRole(role, ROSTER_MANAGEMENT_ROLES)) {
    throw new Error("Only authorized team coaches can update depth charts");
  }

  const allowedFields = ["name", "is_active"];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const { data, error } = await supabaseAdmin
    .from("depth_chart_templates")
    .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Delete a depth chart template
const deleteDepthChart = async (userId, templateId) => {
  checkEnvVars();

  const { data: template, error: fetchError } = await supabaseAdmin
    .from("depth_chart_templates")
    .select("team_id")
    .eq("id", templateId)
    .single();

  if (fetchError || !template) {
    throw new Error("Depth chart not found");
  }

  const { authorized, role } = await checkTeamMembership(
    userId,
    template.team_id,
  );
  if (!authorized || !hasAnyRole(role, ROSTER_MANAGEMENT_ROLES)) {
    throw new Error("Only authorized team coaches can delete depth charts");
  }

  const { error } = await supabaseAdmin
    .from("depth_chart_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    throw error;
  }
  return { success: true };
};

// Update a depth chart entry
const updateEntry = async (userId, entryId, updates) => {
  checkEnvVars();

  // Get entry and template to verify access
  const { data: entry, error: entryError } = await supabaseAdmin
    .from("depth_chart_entries")
    .select(
      `
      *,
      depth_chart_templates!inner (team_id)
    `,
    )
    .eq("id", entryId)
    .single();

  if (entryError || !entry) {
    throw new Error("Depth chart entry not found");
  }

  const { authorized, role } = await checkTeamMembership(
    userId,
    entry.depth_chart_templates.team_id,
  );
  if (!authorized || !hasAnyRole(role, ROSTER_MANAGEMENT_ROLES)) {
    throw new Error("Only authorized team coaches can update depth charts");
  }
  if (
    updates.player_id !== undefined &&
    updates.player_id !== null &&
    updates.player_id !== ""
  ) {
    await assertActiveTeamPlayer(
      entry.depth_chart_templates.team_id,
      updates.player_id,
    );
  }

  // Record history if player is changing
  if (
    updates.player_id !== undefined &&
    updates.player_id !== entry.player_id
  ) {
    await supabaseAdmin.from("depth_chart_history").insert({
      template_id: entry.template_id,
      position_name: entry.position_name,
      old_player_id: entry.player_id,
      new_player_id: updates.player_id,
      old_depth_order: entry.depth_order,
      new_depth_order: updates.depth_order || entry.depth_order,
      change_reason: updates.change_reason,
      changed_by: userId,
    });
  }

  const allowedFields = ["player_id", "depth_order", "notes"];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const { data, error } = await supabaseAdmin
    .from("depth_chart_entries")
    .update({
      ...filteredUpdates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Swap two positions
const swapPositions = async (userId, swapData) => {
  checkEnvVars();

  const { entry_id_1, entry_id_2, change_reason } = swapData;

  // Get both entries
  const { data: entries, error: entriesError } = await supabaseAdmin
    .from("depth_chart_entries")
    .select(
      `
      *,
      depth_chart_templates!inner (team_id)
    `,
    )
    .in("id", [entry_id_1, entry_id_2]);

  if (entriesError || !entries || entries.length !== 2) {
    throw new Error("One or both entries not found");
  }

  const [entry1, entry2] = entries;

  // Verify same template
  if (entry1.template_id !== entry2.template_id) {
    throw new Error("Cannot swap positions from different depth charts");
  }

  const { authorized, role } = await checkTeamMembership(
    userId,
    entry1.depth_chart_templates.team_id,
  );
  if (!authorized || !hasAnyRole(role, ROSTER_MANAGEMENT_ROLES)) {
    throw new Error("Only authorized team coaches can modify depth charts");
  }

  // Record history for both
  const historyRecords = [
    {
      template_id: entry1.template_id,
      position_name: entry1.position_name,
      old_player_id: entry1.player_id,
      new_player_id: entry2.player_id,
      change_reason,
      changed_by: userId,
    },
    {
      template_id: entry2.template_id,
      position_name: entry2.position_name,
      old_player_id: entry2.player_id,
      new_player_id: entry1.player_id,
      change_reason,
      changed_by: userId,
    },
  ];

  await supabaseAdmin.from("depth_chart_history").insert(historyRecords);

  // Swap player_ids
  await supabaseAdmin
    .from("depth_chart_entries")
    .update({ player_id: entry2.player_id, updated_by: userId })
    .eq("id", entry_id_1);

  await supabaseAdmin
    .from("depth_chart_entries")
    .update({ player_id: entry1.player_id, updated_by: userId })
    .eq("id", entry_id_2);

  return { success: true };
};

// Add a new position to a depth chart
const addPosition = async (userId, positionData) => {
  checkEnvVars();

  const { template_id, position_name, position_abbreviation, depth_order } =
    positionData;
  if (!template_id || !position_name || !position_abbreviation) {
    throw new Error(
      "template_id, position_name, and position_abbreviation are required",
    );
  }
  if (
    depth_order !== undefined &&
    (!Number.isInteger(depth_order) || depth_order <= 0)
  ) {
    throw new Error("depth_order must be a positive integer");
  }

  const { data: template, error: templateError } = await supabaseAdmin
    .from("depth_chart_templates")
    .select("team_id")
    .eq("id", template_id)
    .single();

  if (templateError || !template) {
    throw new Error("Depth chart not found");
  }

  const { authorized, role } = await checkTeamMembership(
    userId,
    template.team_id,
  );
  if (!authorized || !hasAnyRole(role, ROSTER_MANAGEMENT_ROLES)) {
    throw new Error("Only authorized team coaches can add positions");
  }

  const { data, error } = await supabaseAdmin
    .from("depth_chart_entries")
    .insert({
      template_id,
      position_name,
      position_abbreviation,
      depth_order: depth_order || 1,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Get depth chart history
const getDepthChartHistory = async (userId, templateId, queryParams) => {
  checkEnvVars();
  const parsedLimit = parseBoundedInt(queryParams.limit, "limit", {
    min: 1,
    max: 200,
  });

  const { data: template, error: templateError } = await supabaseAdmin
    .from("depth_chart_templates")
    .select("team_id")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    throw new Error("Depth chart not found");
  }

  const { authorized } = await checkTeamMembership(userId, template.team_id);
  if (!authorized) {
    throw new Error("Not authorized to view this depth chart");
  }

  let query = supabaseAdmin
    .from("depth_chart_history")
    .select(
      `
      *,
      old_player:old_player_id (name),
      new_player:new_player_id (name),
      changed_by_user:changed_by (name)
    `,
    )
    .eq("template_id", templateId)
    .order("changed_at", { ascending: false });

  if (parsedLimit !== null) {
    query = query.limit(parsedLimit);
  }

  if (queryParams.start_date) {
    query = query.gte("changed_at", queryParams.start_date);
  }

  if (queryParams.end_date) {
    query = query.lte("changed_at", queryParams.end_date);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((record) => ({
    ...record,
    old_player_name: record.old_player?.name,
    new_player_name: record.new_player?.name,
  }));
};

// Get unassigned players
const getUnassignedPlayers = async (userId, templateId, teamId) => {
  checkEnvVars();

  const { authorized } = await checkTeamMembership(userId, teamId);
  if (!authorized) {
    throw new Error("Not authorized");
  }

  // Get all team members
  const { data: teamMembers, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select(
      `
      user_id,
      users:user_id (
        id,
        name
      )
    `,
    )
    .eq("team_id", teamId)
    .eq("role", "player")
    .eq("status", "active");

  if (membersError) {
    throw membersError;
  }

  // Get assigned players in this depth chart
  const { data: entries, error: entriesError } = await supabaseAdmin
    .from("depth_chart_entries")
    .select("player_id")
    .eq("template_id", templateId)
    .not("player_id", "is", null);

  if (entriesError) {
    throw entriesError;
  }

  const assignedPlayerIds = new Set((entries || []).map((e) => e.player_id));

  // Filter to unassigned
  return (teamMembers || [])
    .filter((m) => !assignedPlayerIds.has(m.user_id))
    .map((m) => ({
      id: m.user_id,
      name: m.users?.name,
    }));
};

// Initialize default depth charts for a team
const initializeTeamDepthCharts = async (userId, teamId) => {
  checkEnvVars();

  const { authorized, role } = await checkTeamMembership(userId, teamId);
  if (!authorized || !hasAnyRole(role, ROSTER_MANAGEMENT_ROLES)) {
    throw new Error("Only authorized team coaches can initialize depth charts");
  }

  const chartTypes = ["offense", "defense", "special_teams"];
  const createdCharts = [];

  for (const chartType of chartTypes) {
    const { data: template, error: templateError } = await supabaseAdmin
      .from("depth_chart_templates")
      .insert({
        team_id: teamId,
        name: `${chartType.charAt(0).toUpperCase() + chartType.slice(1).replace("_", " ")} Depth Chart`,
        chart_type: chartType,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (templateError) {
      throw templateError;
    }

    const positions = FLAG_FOOTBALL_POSITIONS[chartType] || [];
    if (positions.length > 0) {
      const entries = positions.map((pos) => ({
        template_id: template.id,
        position_name: pos.name,
        position_abbreviation: pos.abbreviation,
        depth_order: 1,
        updated_by: userId,
      }));

      await supabaseAdmin.from("depth_chart_entries").insert(entries);
    }

    createdCharts.push(template);
  }

  return createdCharts;
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "depth-chart",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    requireAuth: true, // SECURITY: Explicit auth for depth chart management
    handler: async (event, _context, { userId }) => {
      const path = event.path
        .replace(/^\/api\/depth-chart\/?/, "")
        .replace(/^\/\.netlify\/functions\/depth-chart\/?/, "");
      const queryParams = event.queryStringParameters || {};

      let body = {};
      if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
        try {
          body = parseJsonObjectBody(event.body);
        } catch (error) {
          if (error instanceof SyntaxError) {
            return createErrorResponse(
              "Invalid JSON",
              400,
              ErrorType.VALIDATION,
            );
          }
          return createErrorResponse(
            error.message,
            422,
            ErrorType.VALIDATION,
          );
        }
      }

      try {
        // Templates endpoints
        if (event.httpMethod === "GET" && path === "templates") {
          const result = await getTeamDepthCharts(userId, queryParams.team_id);
          return createSuccessResponse(result);
        }

        if (event.httpMethod === "POST" && path === "templates") {
          const result = await createDepthChart(userId, body);
          return createSuccessResponse(result, 201);
        }

        const templateMatch = path.match(/^templates\/([^/]+)$/);
        if (templateMatch) {
          const templateId = templateMatch[1];

          if (event.httpMethod === "GET") {
            const result = await getDepthChartWithEntries(userId, templateId);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "PUT") {
            const result = await updateDepthChart(userId, templateId, body);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "DELETE") {
            const result = await deleteDepthChart(userId, templateId);
            return createSuccessResponse(result);
          }
        }

        // History endpoint
        const historyMatch = path.match(/^templates\/([^/]+)\/history$/);
        if (historyMatch && event.httpMethod === "GET") {
          const result = await getDepthChartHistory(
            userId,
            historyMatch[1],
            queryParams,
          );
          return createSuccessResponse(result);
        }

        // Unassigned players endpoint
        const unassignedMatch = path.match(/^templates\/([^/]+)\/unassigned$/);
        if (unassignedMatch && event.httpMethod === "GET") {
          const result = await getUnassignedPlayers(
            userId,
            unassignedMatch[1],
            queryParams.team_id,
          );
          return createSuccessResponse(result);
        }

        // Entries endpoints
        if (event.httpMethod === "POST" && path === "entries") {
          const result = await addPosition(userId, body);
          return createSuccessResponse(result, 201);
        }

        const entryMatch = path.match(/^entries\/([^/]+)$/);
        if (entryMatch && event.httpMethod === "PUT") {
          const result = await updateEntry(userId, entryMatch[1], body);
          return createSuccessResponse(result);
        }

        if (event.httpMethod === "POST" && path === "entries/swap") {
          const result = await swapPositions(userId, body);
          return createSuccessResponse(result);
        }

        // Initialize endpoint
        if (event.httpMethod === "POST" && path === "initialize") {
          const result = await initializeTeamDepthCharts(userId, body.team_id);
          return createSuccessResponse(result, 201);
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        if (error.message.includes("not found")) {
          return createErrorResponse(error.message, 404, "not_found");
        }
        if (
          error.message.includes("authorized") ||
          error.message.includes("permission")
        ) {
          return createErrorResponse(error.message, 403, "forbidden");
        }
        if (
          error.message.includes("required") ||
          error.message.includes("Invalid") ||
          error.message.includes("must be") ||
          error.message.includes("active player")
        ) {
          return createErrorResponse(error.message, 422, ErrorType.VALIDATION);
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
