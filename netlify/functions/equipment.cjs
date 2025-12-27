// Netlify Function: Equipment API
// Handles equipment/gear tracking and assignments

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const { checkTeamMembership } = require("./utils/auth-helper.cjs");

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

  if (error) throw error;
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

  const { team_id, item_type, name, description, size, color, quantity_total, condition, purchase_date, notes } = itemData;

  const { authorized, role } = await checkTeamMembership(userId, team_id);
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches and admins can add equipment");
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
      quantity_total,
      quantity_available: quantity_total, // Initially all available
      condition: condition || "new",
      purchase_date,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
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
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches and admins can update equipment");
  }

  const allowedFields = ["name", "description", "size", "color", "quantity_total", "condition", "purchase_date", "notes", "item_type"];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  // If quantity_total changed, adjust quantity_available
  if (filteredUpdates.quantity_total !== undefined) {
    const diff = filteredUpdates.quantity_total - item.quantity_total;
    filteredUpdates.quantity_available = Math.max(0, item.quantity_available + diff);
  }

  const { data, error } = await supabaseAdmin
    .from("equipment_items")
    .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
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
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches and admins can delete equipment");
  }

  const { error } = await supabaseAdmin
    .from("equipment_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
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
    .select(`
      *,
      users:player_id (id, name),
      equipment_items!inner (id, name, item_type, team_id)
    `)
    .eq("equipment_items.team_id", team_id)
    .order("assigned_at", { ascending: false });

  if (player_id) {
    query = query.eq("player_id", player_id);
  }

  if (active_only === "true") {
    query = query.is("returned_at", null);
  }

  const { data, error } = await query;

  if (error) throw error;

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
    .select(`
      *,
      equipment_items (id, name, item_type, size, color)
    `)
    .eq("player_id", playerId)
    .is("returned_at", null)
    .order("assigned_at", { ascending: false });

  if (error) throw error;

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
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches and admins can checkout equipment");
  }

  const checkoutQuantity = quantity || 1;

  if (item.quantity_available < checkoutQuantity) {
    throw new Error(`Not enough available. Only ${item.quantity_available} available.`);
  }

  // Create assignment
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

  if (assignmentError) throw assignmentError;

  // Update available quantity
  await supabaseAdmin
    .from("equipment_items")
    .update({ quantity_available: item.quantity_available - checkoutQuantity })
    .eq("id", equipment_id);

  return assignment;
};

// Bulk checkout equipment
const bulkCheckout = async (userId, bulkData) => {
  checkEnvVars();

  const { equipment_id, player_ids, quantity } = bulkData;

  const { data: item, error: itemError } = await supabaseAdmin
    .from("equipment_items")
    .select("*")
    .eq("id", equipment_id)
    .single();

  if (itemError || !item) {
    throw new Error("Equipment item not found");
  }

  const { authorized, role } = await checkTeamMembership(userId, item.team_id);
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches and admins can checkout equipment");
  }

  const checkoutQuantity = quantity || 1;
  const totalNeeded = checkoutQuantity * player_ids.length;

  if (item.quantity_available < totalNeeded) {
    throw new Error(`Not enough available. Need ${totalNeeded}, only ${item.quantity_available} available.`);
  }

  const assignments = player_ids.map((playerId) => ({
    equipment_id,
    player_id: playerId,
    quantity_assigned: checkoutQuantity,
    condition_at_assignment: item.condition,
  }));

  const { data, error } = await supabaseAdmin
    .from("equipment_assignments")
    .insert(assignments)
    .select();

  if (error) throw error;

  // Update available quantity
  await supabaseAdmin
    .from("equipment_items")
    .update({ quantity_available: item.quantity_available - totalNeeded })
    .eq("id", equipment_id);

  return data;
};

// Return equipment
const returnEquipment = async (userId, returnData) => {
  checkEnvVars();

  const { assignment_id, condition_at_return, notes } = returnData;

  // Get assignment
  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("equipment_assignments")
    .select(`
      *,
      equipment_items!inner (id, team_id, quantity_available, condition)
    `)
    .eq("id", assignment_id)
    .single();

  if (assignmentError || !assignment) {
    throw new Error("Assignment not found");
  }

  if (assignment.returned_at) {
    throw new Error("Equipment already returned");
  }

  const { authorized, role } = await checkTeamMembership(userId, assignment.equipment_items.team_id);
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches and admins can process returns");
  }

  // Update assignment
  const { data: updatedAssignment, error: updateError } = await supabaseAdmin
    .from("equipment_assignments")
    .update({
      returned_at: new Date().toISOString(),
      condition_at_return,
      notes: notes || assignment.notes,
    })
    .eq("id", assignment_id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Update equipment available quantity and condition
  const updateData = {
    quantity_available: assignment.equipment_items.quantity_available + assignment.quantity_assigned,
  };

  // If returned in worse condition, update equipment condition
  const conditionOrder = ["new", "good", "fair", "poor", "needs_replacement"];
  if (conditionOrder.indexOf(condition_at_return) > conditionOrder.indexOf(assignment.equipment_items.condition)) {
    updateData.condition = condition_at_return;
  }

  await supabaseAdmin
    .from("equipment_items")
    .update(updateData)
    .eq("id", assignment.equipment_id);

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

  if (error) throw error;

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
    .or("condition.eq.needs_replacement,condition.eq.poor,quantity_available.eq.0");

  if (error) throw error;
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
    .select(`
      *,
      users:player_id (name)
    `)
    .eq("equipment_id", equipmentId)
    .order("assigned_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((assignment) => ({
    ...assignment,
    player_name: assignment.users?.name,
  }));
};

// Main handler
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "equipment",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    handler: async (event, _context, { userId }) => {
      const path = event.path.replace(/^\/api\/equipment\/?/, "").replace(/^\/\.netlify\/functions\/equipment\/?/, "");
      const queryParams = event.queryStringParameters || {};

      let body = {};
      if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
        try {
          body = JSON.parse(event.body);
        } catch {
          return createErrorResponse("Invalid JSON", 400, "invalid_json");
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
          return createSuccessResponse(result, null, 201);
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
          return createSuccessResponse(result, null, 201);
        }

        if (event.httpMethod === "POST" && path === "checkout/bulk") {
          const result = await bulkCheckout(userId, body);
          return createSuccessResponse(result, null, 201);
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
        if (error.message.includes("authorized") || error.message.includes("permission")) {
          return createErrorResponse(error.message, 403, "forbidden");
        }
        if (error.message.includes("Not enough")) {
          return createErrorResponse(error.message, 400, "insufficient_quantity");
        }
        throw error;
      }
    },
  });
};
