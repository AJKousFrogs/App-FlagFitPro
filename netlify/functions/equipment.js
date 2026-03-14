import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse, ErrorType } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { checkTeamMembership } from "./utils/auth-helper.js";
import { hasAnyRole, TEAM_OPERATIONS_ROLES } from "./utils/role-sets.js";

// Netlify Function: Equipment API
// Handles equipment/gear tracking and assignments

const MAX_RETRY_ATTEMPTS = 3;

const parsePositiveQuantity = (value, fieldName) => {
  if (value === undefined || value === null) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
};

const updateAvailableQuantityWithRetry = async (
  equipmentId,
  delta,
  conditionAtReturn = null,
) => {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const { data: item, error: fetchError } = await supabaseAdmin
      .from("equipment_items")
      .select("id, quantity_available, condition")
      .eq("id", equipmentId)
      .single();

    if (fetchError || !item) {
      throw new Error("Equipment item not found");
    }

    const nextQuantity = item.quantity_available + delta;
    if (nextQuantity < 0) {
      throw new Error("Not enough available equipment");
    }

    const updatePayload = { quantity_available: nextQuantity };
    if (conditionAtReturn) {
      const conditionOrder = ["new", "good", "fair", "poor", "needs_replacement"];
      if (
        conditionOrder.indexOf(conditionAtReturn) >
        conditionOrder.indexOf(item.condition)
      ) {
        updatePayload.condition = conditionAtReturn;
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("equipment_items")
      .update(updatePayload)
      .eq("id", equipmentId)
      .eq("quantity_available", item.quantity_available)
      .select("id")
      .maybeSingle();

    if (!updateError && updated) {
      return;
    }
  }

  throw new Error("Equipment inventory update conflict. Please retry.");
};

// Get all equipment items for a team
const getTeamEquipment = async (userId, queryParams) => {
  checkEnvVars();

  const { team_id, item_type, condition, available_only } = queryParams;

  const { authorized } = await checkTeamMembership(userId, team_id);
  if (!authorized) {
    throw new Error("Not authorized to view this team's equipment");
  }

  let query = supabaseAdmin
    .from("equipment_items")
    .select("*")
    .eq("team_id", team_id)
    .order("item_type")
    .order("name");

  if (item_type) {
    query = query.eq("item_type", item_type);
  }

  if (condition) {
    query = query.eq("condition", condition);
  }

  if (available_only === "true") {
    query = query.gt("quantity_available", 0);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data || [];
};

// Get a single equipment item
const getEquipmentItem = async (userId, itemId) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("equipment_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error || !data) {
    throw new Error("Equipment item not found");
  }

  const { authorized } = await checkTeamMembership(userId, data.team_id);
  if (!authorized) {
    throw new Error("Not authorized to view this equipment");
  }

  return data;
};

// Create a new equipment item
const createEquipmentItem = async (userId, itemData) => {
  checkEnvVars();

  const {
    team_id,
    item_type,
    name,
    description,
    size,
    color,
    quantity_total,
    condition,
    purchase_date,
    notes,
  } = itemData;

  const { authorized, role } = await checkTeamMembership(userId, team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can add equipment");
  }

  const parsedTotal = Number.parseInt(quantity_total, 10);
  if (!Number.isInteger(parsedTotal) || parsedTotal <= 0) {
    throw new Error("quantity_total must be a positive integer");
  }

  const { data, error } = await supabaseAdmin
    .from("equipment_items")
    .insert({
      team_id,
      item_type,
      name,
      description,
      size,
      color,
      quantity_total: parsedTotal,
      quantity_available: parsedTotal, // Initially all available
      condition: condition || "new",
      purchase_date,
      notes,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Update an equipment item
const updateEquipmentItem = async (userId, itemId, updates) => {
  checkEnvVars();

  const { data: item, error: fetchError } = await supabaseAdmin
    .from("equipment_items")
    .select("team_id, quantity_total, quantity_available")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    throw new Error("Equipment item not found");
  }

  const { authorized, role } = await checkTeamMembership(userId, item.team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can update equipment");
  }

  const allowedFields = [
    "name",
    "description",
    "size",
    "color",
    "quantity_total",
    "condition",
    "purchase_date",
    "notes",
    "item_type",
  ];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  // If quantity_total changed, adjust quantity_available
  if (filteredUpdates.quantity_total !== undefined) {
    const parsedTotal = Number.parseInt(filteredUpdates.quantity_total, 10);
    if (!Number.isInteger(parsedTotal) || parsedTotal <= 0) {
      throw new Error("quantity_total must be a positive integer");
    }

    const assignedQuantity = item.quantity_total - item.quantity_available;
    if (parsedTotal < assignedQuantity) {
      throw new Error(
        `quantity_total cannot be less than assigned quantity (${assignedQuantity})`,
      );
    }

    filteredUpdates.quantity_total = parsedTotal;
    const diff = filteredUpdates.quantity_total - item.quantity_total;
    filteredUpdates.quantity_available = Math.max(
      0,
      item.quantity_available + diff,
    );
  }

  const { data, error } = await supabaseAdmin
    .from("equipment_items")
    .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Delete an equipment item
const deleteEquipmentItem = async (userId, itemId) => {
  checkEnvVars();

  const { data: item, error: fetchError } = await supabaseAdmin
    .from("equipment_items")
    .select("team_id")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    throw new Error("Equipment item not found");
  }

  const { authorized, role } = await checkTeamMembership(userId, item.team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can delete equipment");
  }

  const { error } = await supabaseAdmin
    .from("equipment_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw error;
  }
  return { success: true };
};

// Get all assignments for a team
const getTeamAssignments = async (userId, queryParams) => {
  checkEnvVars();

  const { team_id, player_id, active_only } = queryParams;

  const { authorized } = await checkTeamMembership(userId, team_id);
  if (!authorized) {
    throw new Error("Not authorized to view assignments");
  }

  let query = supabaseAdmin
    .from("equipment_assignments")
    .select(
      `
      *,
      users:player_id (id, name),
      equipment_items!inner (id, name, item_type, team_id)
    `,
    )
    .eq("equipment_items.team_id", team_id)
    .order("assigned_at", { ascending: false });

  if (player_id) {
    query = query.eq("player_id", player_id);
  }

  if (active_only === "true") {
    query = query.is("returned_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((assignment) => ({
    ...assignment,
    player_name: assignment.users?.name,
    equipment_name: assignment.equipment_items?.name,
    equipment_type: assignment.equipment_items?.item_type,
  }));
};

// Get player's equipment
const getPlayerEquipment = async (userId, playerId) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("equipment_assignments")
    .select(
      `
      *,
      equipment_items (id, name, item_type, size, color)
    `,
    )
    .eq("player_id", playerId)
    .is("returned_at", null)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((assignment) => ({
    ...assignment,
    equipment_name: assignment.equipment_items?.name,
    equipment_type: assignment.equipment_items?.item_type,
  }));
};

// Checkout equipment to a player
const checkoutEquipment = async (userId, checkoutData) => {
  checkEnvVars();

  const { player_id, equipment_id, quantity, notes } = checkoutData;
  if (!player_id || !equipment_id) {
    throw new Error("player_id and equipment_id are required");
  }

  // Get equipment item
  const { data: item, error: itemError } = await supabaseAdmin
    .from("equipment_items")
    .select("*")
    .eq("id", equipment_id)
    .single();

  if (itemError || !item) {
    throw new Error("Equipment item not found");
  }

  const { authorized, role } = await checkTeamMembership(userId, item.team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can checkout equipment");
  }

  const checkoutQuantity = parsePositiveQuantity(quantity, "quantity");

  if (item.quantity_available < checkoutQuantity) {
    throw new Error(
      `Not enough available. Only ${item.quantity_available} available.`,
    );
  }

  await updateAvailableQuantityWithRetry(equipment_id, -checkoutQuantity);

  try {
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("equipment_assignments")
      .insert({
        equipment_id,
        player_id,
        quantity_assigned: checkoutQuantity,
        condition_at_assignment: item.condition,
        notes,
      })
      .select()
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    return assignment;
  } catch (insertError) {
    await updateAvailableQuantityWithRetry(equipment_id, checkoutQuantity);
    throw insertError;
  }
};

// Bulk checkout equipment
const bulkCheckout = async (userId, bulkData) => {
  checkEnvVars();

  const { equipment_id, player_ids, quantity } = bulkData;
  if (!equipment_id || !Array.isArray(player_ids) || player_ids.length === 0) {
    throw new Error("equipment_id and non-empty player_ids are required");
  }

  const { data: item, error: itemError } = await supabaseAdmin
    .from("equipment_items")
    .select("*")
    .eq("id", equipment_id)
    .single();

  if (itemError || !item) {
    throw new Error("Equipment item not found");
  }

  const { authorized, role } = await checkTeamMembership(userId, item.team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can checkout equipment");
  }

  const checkoutQuantity = parsePositiveQuantity(quantity, "quantity");
  const uniquePlayerIds = [...new Set(player_ids)];
  const totalNeeded = checkoutQuantity * uniquePlayerIds.length;

  if (item.quantity_available < totalNeeded) {
    throw new Error(
      `Not enough available. Need ${totalNeeded}, only ${item.quantity_available} available.`,
    );
  }

  const assignments = uniquePlayerIds.map((playerId) => ({
    equipment_id,
    player_id: playerId,
    quantity_assigned: checkoutQuantity,
    condition_at_assignment: item.condition,
  }));

  await updateAvailableQuantityWithRetry(equipment_id, -totalNeeded);

  try {
    const { data, error } = await supabaseAdmin
      .from("equipment_assignments")
      .insert(assignments)
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (insertError) {
    await updateAvailableQuantityWithRetry(equipment_id, totalNeeded);
    throw insertError;
  }
};

// Return equipment
const returnEquipment = async (userId, returnData) => {
  checkEnvVars();

  const { assignment_id, condition_at_return, notes } = returnData;

  // Get assignment
  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("equipment_assignments")
    .select(
      `
      *,
      equipment_items!inner (id, team_id, quantity_available, condition)
    `,
    )
    .eq("id", assignment_id)
    .single();

  if (assignmentError || !assignment) {
    throw new Error("Assignment not found");
  }

  if (assignment.returned_at) {
    throw new Error("Equipment already returned");
  }

  const { authorized, role } = await checkTeamMembership(
    userId,
    assignment.equipment_items.team_id,
  );
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can process returns");
  }

  // Update assignment (conditional to prevent double-return race)
  const { data: updatedAssignment, error: updateError } = await supabaseAdmin
    .from("equipment_assignments")
    .update({
      returned_at: new Date().toISOString(),
      condition_at_return,
      notes: notes || assignment.notes,
    })
    .eq("id", assignment_id)
    .is("returned_at", null)
    .select()
    .maybeSingle();

  if (updateError || !updatedAssignment) {
    if (!updatedAssignment) {
      throw new Error("Equipment already returned");
    }
    throw updateError;
  }

  await updateAvailableQuantityWithRetry(
    assignment.equipment_id,
    assignment.quantity_assigned,
    condition_at_return,
  );

  return updatedAssignment;
};

// Get equipment summary
const getEquipmentSummary = async (userId, teamId) => {
  checkEnvVars();

  const { authorized } = await checkTeamMembership(userId, teamId);
  if (!authorized) {
    throw new Error("Not authorized");
  }

  const { data: items, error } = await supabaseAdmin
    .from("equipment_items")
    .select("*")
    .eq("team_id", teamId);

  if (error) {
    throw error;
  }

  const summary = {
    total_items: items.length,
    total_quantity: 0,
    assigned_quantity: 0,
    available_quantity: 0,
    items_needing_replacement: 0,
    by_type: {},
  };

  for (const item of items) {
    summary.total_quantity += item.quantity_total;
    summary.available_quantity += item.quantity_available;
    summary.assigned_quantity += item.quantity_total - item.quantity_available;

    if (item.condition === "needs_replacement" || item.condition === "poor") {
      summary.items_needing_replacement++;
    }

    if (!summary.by_type[item.item_type]) {
      summary.by_type[item.item_type] = { total: 0, available: 0 };
    }
    summary.by_type[item.item_type].total += item.quantity_total;
    summary.by_type[item.item_type].available += item.quantity_available;
  }

  return summary;
};

// Get equipment alerts
const getEquipmentAlerts = async (userId, teamId) => {
  checkEnvVars();

  const { authorized } = await checkTeamMembership(userId, teamId);
  if (!authorized) {
    throw new Error("Not authorized");
  }

  const { data, error } = await supabaseAdmin
    .from("equipment_items")
    .select("*")
    .eq("team_id", teamId)
    .or(
      "condition.eq.needs_replacement,condition.eq.poor,quantity_available.eq.0",
    );

  if (error) {
    throw error;
  }
  return data || [];
};

// Get equipment history
const getEquipmentHistory = async (userId, equipmentId) => {
  checkEnvVars();

  const { data: item, error: itemError } = await supabaseAdmin
    .from("equipment_items")
    .select("team_id")
    .eq("id", equipmentId)
    .single();

  if (itemError || !item) {
    throw new Error("Equipment not found");
  }

  const { authorized } = await checkTeamMembership(userId, item.team_id);
  if (!authorized) {
    throw new Error("Not authorized");
  }

  const { data, error } = await supabaseAdmin
    .from("equipment_assignments")
    .select(
      `
      *,
      users:player_id (name)
    `,
    )
    .eq("equipment_id", equipmentId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((assignment) => ({
    ...assignment,
    player_name: assignment.users?.name,
  }));
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "equipment",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    requireAuth: true, // SECURITY: Explicit auth for equipment management
    handler: async (event, _context, { userId }) => {
      const path = event.path
        .replace(/^\/api\/equipment\/?/, "")
        .replace(/^\/\.netlify\/functions\/equipment\/?/, "");
      const queryParams = event.queryStringParameters || {};

      let body = {};
      if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
        try {
          body = parseJsonObjectBody(event.body);
        } catch (error) {
          if (
            error?.code === "INVALID_JSON_BODY" &&
            error?.message === "Invalid JSON in request body"
          ) {
            return createErrorResponse("Invalid JSON", 400, ErrorType.VALIDATION);
          }
          return createErrorResponse("Invalid JSON", 400, ErrorType.VALIDATION);
        }
      }

      try {
        // Items endpoints
        if (event.httpMethod === "GET" && path === "items") {
          const result = await getTeamEquipment(userId, queryParams);
          return createSuccessResponse(result);
        }

        if (event.httpMethod === "POST" && path === "items") {
          const result = await createEquipmentItem(userId, body);
          return createSuccessResponse(result, 201);
        }

        const itemMatch = path.match(/^items\/([^/]+)$/);
        if (itemMatch) {
          const itemId = itemMatch[1];

          if (event.httpMethod === "GET") {
            const result = await getEquipmentItem(userId, itemId);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "PUT") {
            const result = await updateEquipmentItem(userId, itemId, body);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "DELETE") {
            const result = await deleteEquipmentItem(userId, itemId);
            return createSuccessResponse(result);
          }
        }

        // Item history
        const historyMatch = path.match(/^items\/([^/]+)\/history$/);
        if (historyMatch && event.httpMethod === "GET") {
          const result = await getEquipmentHistory(userId, historyMatch[1]);
          return createSuccessResponse(result);
        }

        // Assignments endpoints
        if (event.httpMethod === "GET" && path === "assignments") {
          const result = await getTeamAssignments(userId, queryParams);
          return createSuccessResponse(result);
        }

        const playerMatch = path.match(/^player\/([^/]+)\/assignments$/);
        if (playerMatch && event.httpMethod === "GET") {
          const result = await getPlayerEquipment(userId, playerMatch[1]);
          return createSuccessResponse(result);
        }

        // Checkout endpoints
        if (event.httpMethod === "POST" && path === "checkout") {
          const result = await checkoutEquipment(userId, body);
          return createSuccessResponse(result, 201);
        }

        if (event.httpMethod === "POST" && path === "checkout/bulk") {
          const result = await bulkCheckout(userId, body);
          return createSuccessResponse(result, 201);
        }

        // Return endpoint
        if (event.httpMethod === "POST" && path === "return") {
          const result = await returnEquipment(userId, body);
          return createSuccessResponse(result);
        }

        // Summary endpoint
        const summaryMatch = path.match(/^summary\/([^/]+)$/);
        if (summaryMatch && event.httpMethod === "GET") {
          const result = await getEquipmentSummary(userId, summaryMatch[1]);
          return createSuccessResponse(result);
        }

        // Alerts endpoint
        const alertsMatch = path.match(/^alerts\/([^/]+)$/);
        if (alertsMatch && event.httpMethod === "GET") {
          const result = await getEquipmentAlerts(userId, alertsMatch[1]);
          return createSuccessResponse(result);
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
        if (error.message.includes("Not enough")) {
          return createErrorResponse(
            error.message,
            400,
            "insufficient_quantity",
          );
        }
        if (error.message.includes("already returned")) {
          return createErrorResponse(error.message, 409, "conflict");
        }
        if (
          error.message.includes("required") ||
          error.message.includes("positive integer") ||
          error.message.includes("cannot be less")
        ) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        if (error.message.includes("update conflict")) {
          return createErrorResponse(error.message, 409, "conflict");
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
