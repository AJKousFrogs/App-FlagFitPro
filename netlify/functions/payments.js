import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { checkEnvVars, supabaseAdmin } from "./utils/supabase-client.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { checkTeamMembership, getUserContext } from "./utils/auth-helper.js";

// Netlify Function: Payments API
// Handles payment tracking for players and coaches
// Note: This is for TRACKING ONLY - no actual payment processing

const parsePositiveAmount = (value, fieldName = "amount") => {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
      throw new Error(`${fieldName} must be a positive number`);
    }
    value = normalized;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return parsed;
};

const assertValidDate = (value, fieldName) => {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }
};

const assertActiveTeamMember = async (teamId, teamMemberId) => {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("id", teamMemberId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!member) {
    throw new Error("player_id must reference an active team member in this team");
  }
};

// Get player payment data (player view)
const getPlayerPayments = async (userId, queryParams) => {
  checkEnvVars();

  const { team_id } = queryParams;

  // Get user context to find player_id
  const userContext = await getUserContext(userId);
  if (!userContext?.player_id) {
    throw new Error("User is not a player");
  }

  const playerId = userContext.player_id;

  // Get team_id if not provided
  let finalTeamId = team_id;
  if (!finalTeamId && userContext.team_id) {
    finalTeamId = userContext.team_id;
  }

  if (!finalTeamId) {
    throw new Error("Team ID is required");
  }

  // Verify team membership
  const { authorized } = await checkTeamMembership(userId, finalTeamId);
  if (!authorized) {
    throw new Error("Not authorized to view payments for this team");
  }

  // Get all payments for this player
  const { data: payments, error: paymentsError } = await supabaseAdmin
    .from("player_payments")
    .select("*")
    .eq("player_id", playerId)
    .eq("team_id", finalTeamId)
    .order("created_at", { ascending: false });

  if (paymentsError) {
    throw paymentsError;
  }

  // Calculate summary
  const totalOwed =
    payments
      ?.filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

  const totalPaid =
    payments
      ?.filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

  // Get next payment due
  const pendingPayments = payments?.filter((p) => p.status === "pending") || [];
  const nextPayment = pendingPayments.sort(
    (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
  )[0];

  // Format fees for display
  const fees = pendingPayments.map((p) => ({
    id: p.id,
    name: p.description || `${p.payment_type} Payment`,
    description: p.description || "",
    amount: parseFloat(p.amount || 0),
    dueDate: p.due_date || null,
    status:
      p.status === "pending" && p.due_date && new Date(p.due_date) < new Date()
        ? "overdue"
        : p.status === "pending"
          ? "pending"
          : "paid",
    breakdown: [],
  }));

  // Format payment history
  const history = (payments || [])
    .filter((p) => p.status === "completed")
    .map((p) => ({
      id: p.id,
      date: p.paid_at || p.created_at,
      feeName: p.description || p.payment_type,
      amount: parseFloat(p.amount || 0),
      method: p.payment_method || "other",
      reference: p.reference_number || null,
      receiptUrl: p.receipt_url || null,
    }));

  // Payment instructions (placeholder - coaches can customize)
  const instructions = {
    methods: [
      {
        method: "venmo",
        label: "Venmo",
        instructions: "Send payment to your coach's Venmo account",
        details: null,
      },
      {
        method: "zelle",
        label: "Zelle",
        instructions: "Send payment via Zelle to your coach",
        details: null,
      },
      {
        method: "cash",
        label: "Cash",
        instructions: "Pay your coach directly with cash",
        details: null,
      },
    ],
    notes: "Contact your coach for specific payment details.",
  };

  return {
    summary: {
      totalOwed,
      totalPaid,
      nextPaymentDue: nextPayment?.due_date || null,
      nextPaymentAmount: nextPayment
        ? parseFloat(nextPayment.amount || 0)
        : null,
    },
    fees,
    history,
    instructions,
  };
};

// Get coach payment management data
const getCoachPayments = async (userId, queryParams) => {
  checkEnvVars();

  const { team_id } = queryParams;

  if (!team_id) {
    throw new Error("Team ID is required");
  }

  // Verify coach access
  const { authorized, role } = await checkTeamMembership(userId, team_id);
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches can manage payments");
  }

  // Get all payments for this team
  const { data: payments, error: paymentsError } = await supabaseAdmin
    .from("player_payments")
    .select(
      `
      *,
      team_members!player_payments_player_id_fkey (
        id,
        user_id,
        display_name
      )
    `,
    )
    .eq("team_id", team_id)
    .order("created_at", { ascending: false });

  if (paymentsError) {
    throw paymentsError;
  }

  // Get team members for balance calculation
  const { data: teamMembers, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select("id, display_name, user_id")
    .eq("team_id", team_id)
    .eq("status", "active");

  if (membersError) {
    throw membersError;
  }

  // Calculate fees (group by payment_type and due_date)
  const feesMap = new Map();
  payments?.forEach((p) => {
    const key = `${p.payment_type}_${p.due_date || "no_date"}`;
    if (!feesMap.has(key)) {
      feesMap.set(key, {
        id: p.id,
        name: p.description || `${p.payment_type} Fee`,
        type:
          p.payment_type === "membership_fee"
            ? "dues"
            : p.payment_type === "tournament_fee"
              ? "tournament"
              : p.payment_type === "equipment"
                ? "equipment"
                : "other",
        amount: parseFloat(p.amount || 0),
        guestFee: null,
        dueDate: p.due_date || null,
        description: p.description || "",
        collected: 0,
        total: 0,
        paidCount: 0,
        partialCount: 0,
        unpaidCount: 0,
        isOverdue: p.due_date && new Date(p.due_date) < new Date(),
        outstanding: [],
      });
    }
    const fee = feesMap.get(key);
    fee.total += parseFloat(p.amount || 0);
    if (p.status === "completed") {
      fee.collected += parseFloat(p.amount || 0);
      fee.paidCount++;
    } else if (p.status === "pending") {
      fee.unpaidCount++;
      fee.outstanding.push({
        playerId: p.player_id,
        playerName: p.team_members?.display_name || "Unknown",
        amount: parseFloat(p.amount || 0),
        note: null,
      });
    }
  });

  const fees = Array.from(feesMap.values());

  // Calculate player balances
  const balancesMap = new Map();
  teamMembers?.forEach((member) => {
    balancesMap.set(member.id, {
      id: member.id,
      playerId: member.id,
      playerName: member.display_name || "Unknown",
      balance: 0,
      status: "paid",
      lastPaymentDate: null,
      lastPaymentAmount: null,
    });
  });

  payments?.forEach((p) => {
    if (!balancesMap.has(p.player_id)) {
      return;
    }
    const balance = balancesMap.get(p.player_id);
    if (p.status === "pending") {
      balance.balance += parseFloat(p.amount || 0);
      balance.status =
        p.due_date && new Date(p.due_date) < new Date() ? "overdue" : "due";
    } else if (p.status === "completed" && p.paid_at) {
      const paidDate = new Date(p.paid_at);
      if (
        !balance.lastPaymentDate ||
        paidDate > new Date(balance.lastPaymentDate)
      ) {
        balance.lastPaymentDate = p.paid_at;
        balance.lastPaymentAmount = parseFloat(p.amount || 0);
      }
    }
  });

  const balances = Array.from(balancesMap.values());

  // Format payment history
  const paymentHistory = (payments || [])
    .filter((p) => p.status === "completed")
    .map((p) => ({
      id: p.id,
      date: p.paid_at || p.created_at,
      playerName: p.team_members?.display_name || "Unknown",
      feeName: p.description || p.payment_type,
      amount: parseFloat(p.amount || 0),
      method: p.payment_method || "other",
      reference: p.reference_number || null,
    }));

  return {
    fees,
    balances,
    payments: paymentHistory,
  };
};

// Create a new fee
const createFee = async (userId, body) => {
  checkEnvVars();

  const {
    team_id,
    name,
    type,
    amount,
    guestFee,
    dueDate,
    description,
    applyTo,
    playerIds,
  } = body;

  if (!team_id || !name || !amount || !dueDate) {
    throw new Error("Missing required fields: team_id, name, amount, dueDate");
  }
  const normalizedAmount = parsePositiveAmount(amount);
  assertValidDate(dueDate, "dueDate");

  // Verify coach access
  const { authorized, role } = await checkTeamMembership(userId, team_id);
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches can create fees");
  }

  // Map fee type
  const paymentTypeMap = {
    dues: "membership_fee",
    tournament: "tournament_fee",
    equipment: "equipment",
    other: "other",
  };
  const payment_type = paymentTypeMap[type] || "other";

  // Get team members to apply fee to
  let membersToApply = [];
  if (applyTo === "all") {
    const { data: members, error } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", team_id)
      .eq("status", "active");
    if (error) {
      throw error;
    }
    membersToApply = members || [];
  } else if (applyTo === "select" && playerIds?.length > 0) {
    const uniqueIds = [...new Set(playerIds)];
    const { data: members, error } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", team_id)
      .in("id", uniqueIds)
      .eq("status", "active");
    if (error) {
      throw error;
    }
    if (!members || members.length !== uniqueIds.length) {
      throw new Error("One or more selected players are not active team members");
    }
    membersToApply = members;
  } else {
    throw new Error("Invalid applyTo value or missing playerIds");
  }
  if (!membersToApply.length) {
    throw new Error("No active team members to apply fee");
  }

  // Create payment records for each member
  const paymentRecords = membersToApply.map((member) => ({
    player_id: member.id,
    team_id,
    payment_type,
    description: name,
    amount: normalizedAmount,
    status: "pending",
    due_date: dueDate,
    created_by: userId,
  }));

  const { data, error } = await supabaseAdmin
    .from("player_payments")
    .insert(paymentRecords)
    .select();

  if (error) {
    throw error;
  }

  return {
    success: true,
    feeId: data[0]?.id,
    recordsCreated: data.length,
  };
};

// Record a payment
const recordPayment = async (userId, body) => {
  checkEnvVars();

  const { team_id, player_id, amount, method, date, reference, payment_id } = body;

  if (!team_id) {
    throw new Error("Missing required field: team_id");
  }

  // Verify coach access
  const { authorized, role } = await checkTeamMembership(userId, team_id);
  if (!authorized || !["coach", "admin"].includes(role)) {
    throw new Error("Only coaches can record payments");
  }

  // If payment_id provided, update that specific payment
  if (payment_id) {
    const paidAt = date || new Date().toISOString();
    assertValidDate(paidAt, "date");

    const { data, error } = await supabaseAdmin
      .from("player_payments")
      .update({
        status: "completed",
        payment_method: method || "other",
        paid_at: paidAt,
        reference_number: reference || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment_id)
      .eq("team_id", team_id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (error || !data) {
      if (!data) {
        throw new Error("Payment not found or already completed");
      }
      throw error;
    }
    return { success: true, payment: data };
  }

  if (!player_id || !amount) {
    throw new Error("Missing required fields: player_id, amount");
  }
  await assertActiveTeamMember(team_id, player_id);
  const normalizedAmount = parsePositiveAmount(amount);
  const paidAt = date || new Date().toISOString();
  assertValidDate(paidAt, "date");

  // Otherwise, create a new payment record
  const { data, error } = await supabaseAdmin
    .from("player_payments")
    .insert({
      player_id,
      team_id,
      payment_type: "other",
      description: "Payment recorded",
      amount: normalizedAmount,
      payment_method: method || "other",
      status: "completed",
      paid_at: paidAt,
      reference_number: reference || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return { success: true, payment: data };
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "payments",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "CREATE",
    requireAuth: true, // P0-002: Explicitly require authentication for financial data
    handler: async (event, context, { userId }) => {
      const path = event.path.replace("/.netlify/functions/payments", "");
      const method = event.httpMethod;
      const queryParams = event.queryStringParameters || {};
      let body = {};
      if (event.body) {
        try {
          body = JSON.parse(event.body);
        } catch {
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
          );
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return createErrorResponse(
            "Request body must be an object",
            422,
            "validation_error",
          );
        }
      }

      try {
        // Route: GET /api/payments (player view)
        if (method === "GET" && path === "" && !queryParams.coach) {
          const data = await getPlayerPayments(userId, queryParams);
          return createSuccessResponse(data);
        }

        // Route: GET /api/coach/payments (coach view)
        if (
          method === "GET" &&
          (path.includes("/coach/payments") || queryParams.coach === "true")
        ) {
          const data = await getCoachPayments(userId, queryParams);
          return createSuccessResponse(data);
        }

        // Route: POST /api/coach/payments/fees (create fee)
        if (
          method === "POST" &&
          (path.includes("/fees") || body.action === "create_fee")
        ) {
          const result = await createFee(userId, body);
          return createSuccessResponse(result);
        }

        // Route: POST /api/coach/payments/record (record payment)
        if (
          method === "POST" &&
          (path.includes("/record") || body.action === "record_payment")
        ) {
          const result = await recordPayment(userId, body);
          return createSuccessResponse(result);
        }

        return createErrorResponse("Invalid endpoint", 404);
      } catch (error) {
        console.error("Payments API error:", error);
        if (
          error.message?.includes("Only coaches") ||
          error.message?.includes("Not authorized")
        ) {
          return createErrorResponse(error.message, 403, "authorization_error");
        }
        if (
          error.message?.includes("Missing required") ||
          error.message?.includes("must be") ||
          error.message?.includes("Invalid") ||
          error.message?.includes("already completed") ||
          error.message?.includes("active team members") ||
          error.message?.includes("selected players")
        ) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        if (error.message?.includes("not found")) {
          return createErrorResponse(error.message, 404, "not_found");
        }
        return createErrorResponse(
          "Internal server error",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export default createRuntimeV2Handler(handler);
