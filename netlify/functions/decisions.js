import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { guardMerlinRequest } from "./utils/merlin-guard.js";

// Netlify Function: Decision Ledger API
// Handles decision accountability, review triggers, and confidence scoring
// Endpoint: /api/decisions

const parseBoundedInt = (value, fieldName, { min, max }) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
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

/**
 * Verify user is a staff member with decision-making access
 */
async function verifyStaffAccess(userId) {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("role, team_id, users:user_id(full_name)")
    .eq("user_id", userId)
    .in("role", [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "physiotherapist",
      "nutritionist",
      "psychologist",
      "strength_conditioning_coach",
    ])
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (!member) {
    return null;
  }

  return {
    role: member.role,
    teamId: member.team_id,
    name: member.users?.full_name || "Unknown",
  };
}

/**
 * Calculate review date from trigger string
 */
function calculateReviewDate(trigger, createdAt, context = {}) {
  const parts = trigger.split(":");
  const baseTrigger = parts[0];
  const createdAtDate = new Date(createdAt);

  // Time-based triggers: in_Xh, in_Xd, in_Xw
  const timeMatch = baseTrigger.match(/in_(\d+)([hdw])/);
  if (timeMatch) {
    const [, amount, unit] = timeMatch;
    const hours =
      unit === "h"
        ? parseInt(amount)
        : unit === "d"
          ? parseInt(amount) * 24
          : parseInt(amount) * 24 * 7;
    return new Date(createdAtDate.getTime() + hours * 60 * 60 * 1000);
  }

  // Event-based triggers
  if (baseTrigger === "after_next_session" && context.nextSessionDate) {
    return new Date(
      new Date(context.nextSessionDate).getTime() + 2 * 60 * 60 * 1000,
    ); // 2 hours after session
  }

  if (baseTrigger === "after_next_game" && context.nextGameDate) {
    return new Date(
      new Date(context.nextGameDate).getTime() + 24 * 60 * 60 * 1000,
    ); // 24 hours after game
  }

  // Session-based: after_X_sessions
  const sessionMatch = baseTrigger.match(/after_(\d+)_sessions/);
  if (sessionMatch) {
    // For now, estimate 3 days per session
    const sessions = parseInt(sessionMatch[1]);
    return new Date(
      createdAtDate.getTime() + sessions * 3 * 24 * 60 * 60 * 1000,
    );
  }

  // Conditional triggers (set initial check date)
  if (baseTrigger.startsWith("if_")) {
    return new Date(createdAtDate.getTime() + 24 * 60 * 60 * 1000); // Check daily
  }

  // Default: 7 days
  return new Date(createdAtDate.getTime() + 7 * 24 * 60 * 60 * 1000);
}

/**
 * Calculate review priority
 */
function calculateReviewPriority(
  decisionType,
  decisionCategory,
  reviewTrigger,
  confidence,
) {
  // Critical: Medical decisions, low confidence, short-term triggers
  if (
    decisionCategory === "medical" ||
    confidence < 0.6 ||
    reviewTrigger.includes("in_24h") ||
    reviewTrigger.includes("if_symptoms")
  ) {
    return "critical";
  }

  // High: Load adjustments, RTP progressions, short-term triggers
  if (
    decisionType.includes("load") ||
    decisionType.includes("rtp") ||
    reviewTrigger.includes("in_72h")
  ) {
    return "high";
  }

  // Normal: Most decisions
  if (reviewTrigger.includes("in_7d") || reviewTrigger.includes("after_next")) {
    return "normal";
  }

  // Low: Long-term program changes
  return "low";
}

/**
 * Get decisions with filters
 */
async function getDecisions(userId, filters = {}) {
  const staff = await verifyStaffAccess(userId);
  if (!staff) {
    throw new Error("Unauthorized: Staff access required");
  }

  let query = supabaseAdmin
    .from("decision_ledger")
    .select(
      `
      *,
      athlete:athlete_id(id, full_name, avatar_url),
      team:team_id(id, name)
    `,
    )
    .eq("team_id", staff.teamId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.athleteId) {
    query = query.eq("athlete_id", filters.athleteId);
  }

  if (filters.decisionType) {
    query = query.eq("decision_type", filters.decisionType);
  }

  if (filters.decisionCategory) {
    query = query.eq("decision_category", filters.decisionCategory);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.madeBy) {
    query = query.eq("made_by", filters.madeBy);
  }

  if (filters.reviewPriority) {
    query = query.eq("review_priority", filters.reviewPriority);
  }

  if (filters.dueForReview) {
    query = query
      .eq("status", "active")
      .lte("review_date", new Date().toISOString());
  }

  if (filters.overdue) {
    query = query
      .eq("status", "active")
      .lt("review_date", new Date().toISOString());
  }

  if (filters.lowConfidence) {
    query = query.lt("decision_basis->>confidence", "0.7");
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  // Pagination
  const limit = parseBoundedInt(filters.limit, "limit", { min: 1, max: 200 }) ?? 50;
  const offset =
    parseBoundedInt(filters.offset, "offset", { min: 0, max: 1000000 }) ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get decision statistics
 */
async function getDecisionStats(userId) {
  const staff = await verifyStaffAccess(userId);
  if (!staff) {
    throw new Error("Unauthorized: Staff access required");
  }

  const { data: allDecisions, error } = await supabaseAdmin
    .from("decision_ledger")
    .select("status, decision_category, review_priority, decision_basis")
    .eq("team_id", staff.teamId);

  if (error) {
    throw error;
  }

  const stats = {
    total: allDecisions?.length || 0,
    active: 0,
    dueForReview: 0,
    overdue: 0,
    lowConfidence: 0,
    byCategory: {},
    byPriority: {},
  };

  const now = new Date();

  for (const decision of allDecisions || []) {
    // Count by status
    if (decision.status === "active") {
      stats.active++;
    }

    // Count due for review
    if (decision.status === "active" && new Date(decision.review_date) <= now) {
      stats.dueForReview++;
    }

    // Count overdue
    if (decision.status === "active" && new Date(decision.review_date) < now) {
      stats.overdue++;
    }

    // Count low confidence
    const confidence =
      decision.decision_basis?.confidence || decision.decision_basis?.overall;
    if (confidence && confidence < 0.7) {
      stats.lowConfidence++;
    }

    // Count by category
    const category = decision.decision_category;
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    // Count by priority
    const priority = decision.review_priority;
    stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
  }

  return stats;
}

/**
 * Get a single decision by ID
 */
async function getDecisionById(decisionId, userId) {
  const staff = await verifyStaffAccess(userId);
  if (!staff) {
    throw new Error("Unauthorized: Staff access required");
  }

  const { data: decision, error } = await supabaseAdmin
    .from("decision_ledger")
    .select(
      `
      *,
      athlete:athlete_id(id, full_name, avatar_url),
      team:team_id(id, name),
      maker:made_by(id, full_name),
      reviewer:reviewed_by(id, full_name)
    `,
    )
    .eq("id", decisionId)
    .eq("team_id", staff.teamId)
    .single();

  if (error) {
    throw error;
  }

  if (!decision) {
    throw new Error("Decision not found");
  }

  // Get related decisions (superseded/superseding)
  const relatedDecisions = [];
  if (decision.superseded_by) {
    const { data: superseding } = await supabaseAdmin
      .from("decision_ledger")
      .select("id, decision_summary, status, created_at")
      .eq("id", decision.superseded_by)
      .single();
    if (superseding) {
      relatedDecisions.push({ ...superseding, relation: "superseding" });
    }
  }

  if (decision.supersedes && decision.supersedes.length > 0) {
    const { data: superseded } = await supabaseAdmin
      .from("decision_ledger")
      .select("id, decision_summary, status, created_at")
      .in("id", decision.supersedes);
    if (superseded) {
      relatedDecisions.push(
        ...superseded.map((d) => ({ ...d, relation: "superseded" })),
      );
    }
  }

  return {
    ...decision,
    relatedDecisions,
  };
}

/**
 * Create a new decision
 */
async function createDecision(userId, decisionData) {
  const staff = await verifyStaffAccess(userId);
  if (!staff) {
    throw new Error("Unauthorized: Staff access required");
  }

  if (
    !decisionData.athleteId ||
    !decisionData.decisionType ||
    !decisionData.decisionSummary ||
    !decisionData.decisionCategory ||
    !decisionData.reviewTrigger
  ) {
    throw new Error(
      "athleteId, decisionType, decisionSummary, decisionCategory, and reviewTrigger are required",
    );
  }

  // Calculate review date
  const reviewDate = calculateReviewDate(
    decisionData.reviewTrigger,
    new Date().toISOString(),
    {
      nextSessionDate: decisionData.nextSessionDate,
      nextGameDate: decisionData.nextGameDate,
    },
  );

  // Calculate review priority
  const confidence =
    decisionData.decisionBasis?.confidence ||
    decisionData.decisionBasis?.overall ||
    0.8;
  const reviewPriority = calculateReviewPriority(
    decisionData.decisionType,
    decisionData.decisionCategory,
    decisionData.reviewTrigger,
    confidence,
  );

  // Prepare decision basis JSONB
  const decisionBasis = {
    data_points: decisionData.decisionBasis?.dataPoints || [],
    constraints: decisionData.decisionBasis?.constraints || [],
    rationale: decisionData.decisionBasis?.rationale || "",
    confidence,
    data_quality: decisionData.decisionBasis?.dataQuality || {
      completeness: 1.0,
      stale_days: 0,
    },
  };

  const { data: decision, error } = await supabaseAdmin
    .from("decision_ledger")
    .insert({
      athlete_id: decisionData.athleteId,
      team_id: staff.teamId,
      decision_type: decisionData.decisionType,
      decision_summary: decisionData.decisionSummary,
      decision_category: decisionData.decisionCategory,
      made_by: userId,
      made_by_role: staff.role,
      made_by_name: staff.name,
      decision_basis: decisionBasis,
      intended_duration: decisionData.intendedDuration,
      review_trigger: decisionData.reviewTrigger,
      review_date: reviewDate.toISOString(),
      review_priority: reviewPriority,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return decision;
}

/**
 * Review a decision
 */
async function reviewDecision(decisionId, userId, reviewData) {
  const staff = await verifyStaffAccess(userId);
  if (!staff) {
    throw new Error("Unauthorized: Staff access required");
  }

  const validOutcomes = new Set([
    "maintained",
    "reversed",
    "extended",
    "modified",
  ]);
  if (!validOutcomes.has(reviewData.reviewOutcome)) {
    throw new Error(
      "reviewOutcome must be one of: maintained, reversed, extended, modified",
    );
  }

  // Get the decision
  const { data: decision, error: fetchError } = await supabaseAdmin
    .from("decision_ledger")
    .select("*")
    .eq("id", decisionId)
    .eq("team_id", staff.teamId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (!decision) {
    throw new Error("Decision not found");
  }

  // Prepare update data
  const updateData = {
    reviewed_at: new Date().toISOString(),
    reviewed_by: userId,
    review_outcome: reviewData.reviewOutcome,
    review_notes: reviewData.reviewNotes || null,
    updated_at: new Date().toISOString(),
  };

  // Handle outcome data
  if (reviewData.outcomeData) {
    updateData.outcome_data = {
      athlete_state_before: reviewData.outcomeData.athleteStateBefore || {},
      athlete_state_after: reviewData.outcomeData.athleteStateAfter || {},
      goal_achieved: reviewData.outcomeData.goalAchieved || false,
      unintended_consequences:
        reviewData.outcomeData.unintendedConsequences || [],
      lessons_learned: reviewData.outcomeData.lessonsLearned || null,
    };
  }

  // Handle different review outcomes
  if (reviewData.reviewOutcome === "maintained") {
    updateData.status = "reviewed";
  } else if (reviewData.reviewOutcome === "reversed") {
    updateData.status = "cancelled";
  } else if (reviewData.reviewOutcome === "extended") {
    // Calculate new review date
    const newReviewDate = reviewData.newReviewDate
      ? new Date(reviewData.newReviewDate)
      : calculateReviewDate(
          reviewData.newReviewTrigger || decision.review_trigger,
          new Date().toISOString(),
        );
    updateData.review_date = newReviewDate.toISOString();
    updateData.review_trigger =
      reviewData.newReviewTrigger || decision.review_trigger;
    updateData.status = "active"; // Keep active with new review date
  } else if (reviewData.reviewOutcome === "modified") {
    // Create new decision that supersedes this one
    const newDecision = {
      ...decision,
      supersedes: [decisionId],
      status: "active",
    };
    delete newDecision.id;
    delete newDecision.created_at;
    delete newDecision.updated_at;

    // Update old decision
    updateData.status = "superseded";
    updateData.superseded_by = null; // Will be set after new decision is created

    const { data: createdDecision, error: createError } = await supabaseAdmin
      .from("decision_ledger")
      .insert(newDecision)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    updateData.superseded_by = createdDecision.id;
  }

  const { data: updatedDecision, error: updateError } = await supabaseAdmin
    .from("decision_ledger")
    .update(updateData)
    .eq("id", decisionId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedDecision;
}

/**
 * Get review reminders
 */
async function getReviewReminders(userId) {
  const staff = await verifyStaffAccess(userId);
  if (!staff) {
    throw new Error("Unauthorized: Staff access required");
  }

  const now = new Date().toISOString();

  // Get decisions due for review
  const { data: dueDecisions, error } = await supabaseAdmin
    .from("decision_ledger")
    .select(
      `
      id,
      decision_summary,
      review_date,
      review_priority,
      athlete:athlete_id(full_name),
      made_by_role,
      made_by_name
    `,
    )
    .eq("team_id", staff.teamId)
    .eq("status", "active")
    .lte("review_date", now)
    .order("review_date", { ascending: true });

  if (error) {
    throw error;
  }

  return dueDecisions || [];
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(event, _context, { userId }) {
  const path =
    event.path
      .replace("/.netlify/functions/decisions", "")
      .replace(/^\/api\/decisions\/?/, "")
      .replace(/^\//, "") || "";

  let body = {};
  if (event.body && event.httpMethod === "POST") {
    try {
      body = parseJsonObjectBody(event.body);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return createErrorResponse("Invalid JSON body", 400, "invalid_json");
      }
      return createErrorResponse(error.message, 422, "validation_error");
    }
  }

  const queryParams = event.queryStringParameters || {};

  try {
    // GET /api/decisions - List decisions with filters
    if (event.httpMethod === "GET" && path === "") {
      const decisions = await getDecisions(userId, queryParams);
      return createSuccessResponse(decisions);
    }

    // GET /api/decisions/stats - Get decision statistics
    if (event.httpMethod === "GET" && path === "stats") {
      const stats = await getDecisionStats(userId);
      return createSuccessResponse(stats);
    }

    // GET /api/decisions/reminders - Get review reminders
    if (event.httpMethod === "GET" && path === "reminders") {
      const reminders = await getReviewReminders(userId);
      return createSuccessResponse(reminders);
    }

    // GET /api/decisions/:id - Get single decision
    if (event.httpMethod === "GET" && path.match(/^[a-f0-9-]{36}$/)) {
      const decisionId = path;
      const decision = await getDecisionById(decisionId, userId);
      return createSuccessResponse(decision);
    }

    // POST /api/decisions - Create decision
    if (event.httpMethod === "POST" && path === "") {
      const decision = await createDecision(userId, body);
      return createSuccessResponse(decision, true, 201);
    }

    // POST /api/decisions/:id/review - Review decision
    if (event.httpMethod === "POST" && path.match(/^[a-f0-9-]{36}\/review$/)) {
      const decisionId = path.split("/")[0];
      const reviewedDecision = await reviewDecision(decisionId, userId, body);
      return createSuccessResponse(reviewedDecision);
    }

    return createErrorResponse("Endpoint not found", 404, "not_found");
  } catch (error) {
    console.error("[Decisions API] Error:", error);
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse(error.message, 403, "authorization_error");
    }
    if (error.message?.includes("not found")) {
      return createErrorResponse(error.message, 404, "not_found");
    }
    if (
      error.message?.includes("required") ||
      error.message?.includes("Invalid") ||
      error.message?.includes("must be")
    ) {
      return createErrorResponse(error.message, 422, "validation_error");
    }
    return createErrorResponse(
      "Internal server error",
      500,
      "server_error",
    );
  }
}

export const handler = async (event, context) => {
  // Apply Merlin guard for mutation endpoints
  if (event.httpMethod !== "GET" && event.httpMethod !== "OPTIONS") {
    const req = {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
      body: event.body,
      user: context.user || {},
    };
    const blocked = guardMerlinRequest(req);
    if (blocked && blocked.statusCode === 403) {
      return blocked;
    }
  }

  // Determine rate limit type based on HTTP method
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "CREATE";

  return baseHandler(event, context, {
    functionName: "decisions",
    allowedMethods: ["GET", "POST"],
    rateLimitType,
    requireAuth: true,
    handler: handleRequest,
  });
};
