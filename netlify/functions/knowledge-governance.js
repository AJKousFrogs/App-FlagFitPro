import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

const ALLOWED_ENTRY_TYPES = new Set([
  "training_method",
  "injury",
  "recovery_method",
  "nutrition",
  "supplement",
  "psychology",
]);

const ALLOWED_EVIDENCE = new Set(["strong", "moderate", "limited"]);
const ALLOWED_CONSENSUS = new Set(["high", "moderate", "low"]);
const REVIEW_ACTIONS = new Set(["approve", "reject"]);

function normalizeText(value) {
  return String(value || "").trim();
}

function parseRequestBody(rawBody, requestId) {
  try {
    return { body: parseJsonObjectBody(rawBody) };
  } catch (error) {
    const isObjectError = error.message === "Request body must be an object";
    return {
      error: createErrorResponse(
        isObjectError ? error.message : "Invalid JSON in request body",
        isObjectError ? 422 : 400,
        isObjectError ? "validation_error" : "invalid_json",
        requestId,
      ),
    };
  }
}

function parsePositiveInt(value, fallback, min, max) {
  const raw = value ?? fallback;
  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

function getMetaRole(authUser) {
  const meta = authUser?.user_metadata || {};
  return (meta.staff_role || meta.role || "").toString().trim().toLowerCase();
}

async function getEffectiveRole(context) {
  const dbRole = ((await getUserRole(context.userId)) || "").toLowerCase();
  const metaRole = getMetaRole(context.authUser);
  return {
    dbRole,
    metaRole,
    effectiveRole: metaRole || dbRole || "player",
  };
}

function isNutritionistReviewer(roles) {
  return roles.metaRole === "nutritionist" || roles.dbRole === "nutritionist";
}

function getQualityIssues(entry) {
  const issues = [];
  const answer = normalizeText(entry?.answer);
  const summary = normalizeText(entry?.summary);
  const entryType = normalizeText(entry?.entry_type).toLowerCase();

  if (answer.length < 80) {
    issues.push("Answer must be at least 80 characters for approval");
  }
  if (summary.length < 30) {
    issues.push("Summary must be at least 30 characters for approval");
  }

  if (entryType === "nutrition" || entryType === "supplement") {
    const answerLc = answer.toLowerCase();
    const hasDoseSignal = /\b(\d+\s?(mg|g|mcg|iu)|dose|dosing|serving|daily|per day)\b/.test(answerLc);
    const hasSafetySignal =
      /\b(side effect|contraindication|safety|warning|avoid|risk|interaction|upper limit)\b/.test(
        answerLc,
      );
    if (!hasDoseSignal) {
      issues.push("Nutrition/supplement entries must include dosing guidance");
    }
    if (!hasSafetySignal) {
      issues.push("Nutrition/supplement entries must include safety considerations");
    }
  }

  return issues;
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "knowledge-governance",
    allowedMethods: ["GET", "POST", "PATCH"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _ctx, requestContext) => {
      const requestId = requestContext.requestId;
      const path = event.path.replace("/.netlify/functions/knowledge-governance", "") || "/";
      const pathParts = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
      const roles = await getEffectiveRole(requestContext);

      if (event.httpMethod === "GET") {
        if (pathParts[0] === "audit" && pathParts[1]) {
          const entryId = pathParts[1];

          const { data: targetEntry, error: targetEntryError } = await supabaseAdmin
            .from("knowledge_base_entries")
            .select("id, merlin_submitted_by")
            .eq("id", entryId)
            .single();

          if (targetEntryError || !targetEntry) {
            return createErrorResponse(
              "Knowledge entry not found",
              404,
              "not_found",
              requestId,
            );
          }

          if (
            targetEntry.merlin_submitted_by !== requestContext.userId &&
            !isNutritionistReviewer(roles)
          ) {
            return createErrorResponse(
              "Not allowed to read this audit timeline",
              403,
              "authorization_error",
              requestId,
            );
          }

          const { data, error } = await supabaseAdmin
            .from("knowledge_review_audit")
            .select(
              "id, action, reviewed_by_role, notes, quality_gate_override, quality_issues, created_at",
            )
            .eq("entry_id", entryId)
            .order("created_at", { ascending: false });

          if (error) {
            return createErrorResponse(
              "Failed to fetch audit timeline",
              500,
              "database_error",
              requestId,
            );
          }

          return createSuccessResponse(
            { entry_id: entryId, events: data || [], total: (data || []).length },
            requestId,
          );
        }

        if (pathParts[0] === "my") {
          const limit = parsePositiveInt(event.queryStringParameters?.limit, 100, 1, 200);
          const { data, error } = await supabaseAdmin
            .from("knowledge_base_entries")
            .select(
              "id, entry_type, topic, question, summary, evidence_strength, consensus_level, merlin_approval_status, merlin_approval_notes, merlin_submitted_at, merlin_approved_at, updated_at",
            )
            .eq("merlin_submitted_by", requestContext.userId)
            .order("merlin_submitted_at", { ascending: false, nullsFirst: false })
            .limit(limit);

          if (error) {
            return createErrorResponse(
              "Failed to fetch your submissions",
              500,
              "database_error",
              requestId,
            );
          }

          return createSuccessResponse({ entries: data || [], total: (data || []).length }, requestId);
        }

        if (pathParts[0] !== "pending") {
          return createErrorResponse("Not found", 404, "not_found", requestId);
        }
        if (!isNutritionistReviewer(roles)) {
          return createErrorResponse(
            "Only nutritionists can review pending knowledge entries",
            403,
            "authorization_error",
            requestId,
          );
        }

        const limit = parsePositiveInt(event.queryStringParameters?.limit, 50, 1, 200);
        const { data, error } = await supabaseAdmin
          .from("knowledge_base_entries")
          .select(
            "id, entry_type, topic, question, answer, summary, evidence_strength, consensus_level, merlin_submitted_by, merlin_submitted_by_role, merlin_submitted_at, merlin_approval_status",
          )
          .eq("merlin_approval_status", "pending")
          .order("merlin_submitted_at", { ascending: true, nullsFirst: false })
          .limit(limit);

        if (error) {
          return createErrorResponse(
            "Failed to fetch pending entries",
            500,
            "database_error",
            requestId,
          );
        }

        return createSuccessResponse({ entries: data || [], total: (data || []).length }, requestId);
      }

      if (event.httpMethod === "POST" && pathParts[0] !== "review") {
        const { body, error } = parseRequestBody(event.body, requestId);
        if (error) {
          return error;
        }
        const topic = normalizeText(body.topic).toLowerCase();
        const question = normalizeText(body.question);
        const answer = normalizeText(body.answer);
        const summary = normalizeText(body.summary);
        const entryType = normalizeText(body.entry_type || "nutrition").toLowerCase();
        const evidenceStrength = normalizeText(body.evidence_strength || "limited").toLowerCase();
        const consensusLevel = normalizeText(body.consensus_level || "low").toLowerCase();

        if (!topic || !question || !answer) {
          return createErrorResponse(
            "topic, question, and answer are required",
            422,
            "validation_error",
            requestId,
          );
        }
        if (answer.length < 30) {
          return createErrorResponse(
            "answer must be at least 30 characters",
            422,
            "validation_error",
            requestId,
          );
        }
        if (summary && summary.length < 20) {
          return createErrorResponse(
            "summary must be at least 20 characters when provided",
            422,
            "validation_error",
            requestId,
          );
        }
        if (!ALLOWED_ENTRY_TYPES.has(entryType)) {
          return createErrorResponse("Invalid entry_type", 422, "validation_error", requestId);
        }
        if (!ALLOWED_EVIDENCE.has(evidenceStrength)) {
          return createErrorResponse(
            "Invalid evidence_strength",
            422,
            "validation_error",
            requestId,
          );
        }
        if (!ALLOWED_CONSENSUS.has(consensusLevel)) {
          return createErrorResponse(
            "Invalid consensus_level",
            422,
            "validation_error",
            requestId,
          );
        }

        const payload = {
          entry_type: entryType,
          topic,
          question,
          answer,
          summary: summary || answer.slice(0, 240),
          evidence_strength: evidenceStrength,
          consensus_level: consensusLevel,
          is_merlin_approved: false,
          merlin_approval_status: "pending",
          merlin_submitted_by: requestContext.userId,
          merlin_submitted_by_role: roles.effectiveRole,
          merlin_submitted_at: new Date().toISOString(),
        };

        const { data: insertData, error: insertError } = await supabaseAdmin
          .from("knowledge_base_entries")
          .insert(payload)
          .select("id, topic, merlin_approval_status, is_merlin_approved")
          .single();

        if (insertError) {
          return createErrorResponse(
            "Failed to submit knowledge entry",
            500,
            "database_error",
            requestId,
          );
        }

        return createSuccessResponse(
          {
            message: "Knowledge entry submitted for nutritionist review",
            entry: insertData,
          },
          requestId,
        );
      }

      if (
        (event.httpMethod === "POST" || event.httpMethod === "PATCH") &&
        pathParts[0] === "review" &&
        pathParts[1]
      ) {
        if (!isNutritionistReviewer(roles)) {
          return createErrorResponse(
            "Only nutritionists can approve or reject knowledge entries",
            403,
            "authorization_error",
            requestId,
          );
        }

        const entryId = pathParts[1];
        const { body, error } = parseRequestBody(event.body, requestId);
        if (error) {
          return error;
        }
        const action = normalizeText(body.action).toLowerCase();
        const notes = normalizeText(body.notes) || null;
        const overrideQualityGate = Boolean(body.override_quality_gate);
        if (!REVIEW_ACTIONS.has(action)) {
          return createErrorResponse(
            "action must be 'approve' or 'reject'",
            422,
            "validation_error",
            requestId,
          );
        }

        const { data: existingEntry, error: existingEntryError } = await supabaseAdmin
          .from("knowledge_base_entries")
          .select("id, entry_type, answer, summary, merlin_approval_status")
          .eq("id", entryId)
          .single();

        if (existingEntryError || !existingEntry) {
          return createErrorResponse(
            "Knowledge entry not found",
            404,
            "not_found",
            requestId,
          );
        }

        if (action === "approve") {
          const qualityIssues = getQualityIssues(existingEntry);
          if (qualityIssues.length > 0 && !overrideQualityGate) {
            return createErrorResponse(
              "Quality gate failed. Provide stronger evidence details before approval.",
              422,
              "quality_gate_failed",
              {
                requestId,
                quality_issues: qualityIssues,
              },
            );
          }
          if (qualityIssues.length > 0 && overrideQualityGate && (!notes || notes.length < 15)) {
            return createErrorResponse(
              "Override approval requires review notes with at least 15 characters",
              422,
              "validation_error",
              requestId,
            );
          }
        }

        const approvalUpdate =
          action === "approve"
            ? {
              is_merlin_approved: true,
              merlin_approval_status: "approved",
              merlin_approved_at: new Date().toISOString(),
              merlin_approved_by: requestContext.userId,
              merlin_approved_by_role: roles.effectiveRole,
              merlin_approval_notes: notes,
            }
            : {
              is_merlin_approved: false,
              merlin_approval_status: "rejected",
              merlin_approved_at: null,
              merlin_approved_by: requestContext.userId,
              merlin_approved_by_role: roles.effectiveRole,
              merlin_approval_notes: notes,
            };

        const { data: reviewData, error: reviewError } = await supabaseAdmin
          .from("knowledge_base_entries")
          .update(approvalUpdate)
          .eq("id", entryId)
          .select("id, topic, merlin_approval_status, is_merlin_approved, merlin_approved_by_role")
          .single();

        if (reviewError || !reviewData) {
          return createErrorResponse(
            "Failed to review knowledge entry",
            500,
            "database_error",
            requestId,
          );
        }

        const { error: auditError } = await supabaseAdmin
          .from("knowledge_review_audit")
          .insert({
          entry_id: reviewData.id,
          reviewed_by: requestContext.userId,
          reviewed_by_role: roles.effectiveRole,
          action,
          notes,
          quality_gate_override: action === "approve" ? overrideQualityGate : false,
          quality_issues: action === "approve" ? getQualityIssues(existingEntry) : [],
        });
        if (auditError) {
          console.error("[knowledge-governance] Failed to write review audit", auditError);
        }

        return createSuccessResponse(
          { message: `Entry ${action}d`, entry: reviewData },
          requestId,
        );
      }

      return createErrorResponse("Not found", 404, "not_found", requestId);
    },
  });

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
