import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { supabaseAdmin } from "./supabase-client.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.admin-credentials" });

// Netlify Function: Admin Credential Review API
// Lets an owner/admin list self-reported credential_verifications and
// approve/reject them. All actions take the credential id via query string
// (GET) or request body (POST) rather than a path segment — deliberately,
// so this function has exactly one route and needs no path-based dispatch.

const ADMIN_ROLES = ["owner", "admin"];

// Role -> profile table, used to flip credentials_verified on approval.
// manager_profiles has no credentials_verified column (managers don't file
// credentials — see staff-profile.js's manager-profile route).
const ROLE_PROFILE_TABLE = {
  physiotherapist: "physiotherapist_profiles",
  nutritionist: "nutritionist_profiles",
  psychologist: "psychologist_profiles",
  strength_conditioning_coach: "strength_coach_profiles",
  coach: "coach_profiles",
  offense_coordinator: "coach_profiles",
  defense_coordinator: "coach_profiles",
  assistant_coach: "coach_profiles",
  head_coach: "coach_profiles",
};

async function listCredentials(status) {
  let query = supabaseAdmin
    .from("credential_verifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const userIds = [...new Set((data || []).map((c) => c.user_id))];
  const namesById = new Map();
  const rolesById = new Map();

  if (userIds.length > 0) {
    const [{ data: users }, { data: members }] = await Promise.all([
      supabaseAdmin.from("users").select("id, full_name").in("id", userIds),
      supabaseAdmin
        .from("team_members")
        .select("user_id, role")
        .in("user_id", userIds)
        .eq("status", "active"),
    ]);
    for (const u of users || []) {
      namesById.set(u.id, u.full_name || "Unknown");
    }
    for (const m of members || []) {
      rolesById.set(m.user_id, m.role);
    }
  }

  const credentials = (data || []).map((c) => ({
    ...c,
    user_name: namesById.get(c.user_id) || "Unknown",
    user_role: rolesById.get(c.user_id) || null,
  }));

  return createSuccessResponse({ credentials, count: credentials.length });
}

async function getSignedDocumentUrl(documentPath) {
  if (!documentPath) {
    return null;
  }
  const { data, error } = await supabaseAdmin.storage
    .from("credential-documents")
    .createSignedUrl(documentPath, 600); // 10 minutes

  if (error) {
    logger.warn("signed_url_failed", {}, error);
    return null;
  }
  return data?.signedUrl || null;
}

async function verifyCredential(adminUserId, id) {
  const { data: credential, error: fetchError } = await supabaseAdmin
    .from("credential_verifications")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }
  if (!credential) {
    return createErrorResponse(
      "Credential not found",
      404,
      ErrorType.NOT_FOUND,
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("credential_verifications")
    .update({
      status: "verified",
      verified_by: adminUserId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    throw updateError;
  }

  const { data: member } = await supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", credential.user_id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const table = member?.role ? ROLE_PROFILE_TABLE[member.role] : null;
  if (table) {
    await supabaseAdmin
      .from(table)
      .update({
        credentials_verified: true,
        verification_completed_at: new Date().toISOString(),
      })
      .eq("user_id", credential.user_id);
  }

  return createSuccessResponse({ id, status: "verified" });
}

async function rejectCredential(adminUserId, id, reason) {
  const { data: credential, error: fetchError } = await supabaseAdmin
    .from("credential_verifications")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }
  if (!credential) {
    return createErrorResponse(
      "Credential not found",
      404,
      ErrorType.NOT_FOUND,
    );
  }

  const { error } = await supabaseAdmin
    .from("credential_verifications")
    .update({
      status: "rejected",
      verified_by: adminUserId,
      rejected_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return createSuccessResponse({ id, status: "rejected" });
}

async function handleRequest(event, _context, { userId }) {
  const role = await getUserRole(userId);
  if (!ADMIN_ROLES.includes(role)) {
    return createErrorResponse(
      "Access denied. Admin role required.",
      403,
      ErrorType.AUTHORIZATION,
    );
  }

  if (event.httpMethod === "GET") {
    const documentUrlFor = event.queryStringParameters?.documentUrlFor;
    if (documentUrlFor) {
      const { data: credential } = await supabaseAdmin
        .from("credential_verifications")
        .select("document_url")
        .eq("id", documentUrlFor)
        .maybeSingle();
      const signedUrl = await getSignedDocumentUrl(credential?.document_url);
      return createSuccessResponse({ signedUrl });
    }
    return listCredentials(event.queryStringParameters?.status);
  }

  const parsedBody = tryParseJsonObjectBody(event.body);
  if (!parsedBody.ok) {
    return parsedBody.error;
  }
  const { id, action, reason } = parsedBody.data;

  if (!id || typeof id !== "string") {
    return createErrorResponse(
      "Missing required field: id",
      422,
      ErrorType.VALIDATION,
    );
  }

  if (action === "verify") {
    return verifyCredential(userId, id);
  }
  if (action === "reject") {
    return rejectCredential(userId, id, reason);
  }

  return createErrorResponse(
    "action must be 'verify' or 'reject'",
    422,
    ErrorType.VALIDATION,
  );
}

const handler = async (event, context) => {
  if (event.httpMethod === "GET") {
    return baseHandler(event, context, {
      functionName: "admin-credentials",
      allowedMethods: ["GET"],
      rateLimitType: "READ",
      requireAuth: true,
      handler: handleRequest,
    });
  }

  return baseHandler(event, context, {
    functionName: "admin-credentials",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: handleRequest,
  });
};

export { handler };
