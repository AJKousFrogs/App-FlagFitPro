/**
 * Account Deletion API
 *
 * Implements account deletion workflow as defined in PRIVACY_POLICY.md:
 * - POST: Request account deletion (30-day retention period)
 * - DELETE: Cancel pending deletion request
 * - GET: Get deletion request status
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

import { baseHandler } from "./utils/base-handler.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { getSupabaseClient, supabaseAdmin } from "./supabase-client.js";

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "account-deletion",
    allowedMethods: ["GET", "POST", "DELETE"],
    rateLimitType: "CREATE",
    requireAuth: true, // P0-006: Explicitly require authentication for account deletion
    handler: async (event, context, { userId, requestId }) => {
      const supabase = getSupabaseClient();

      // GET - Get deletion request status
      if (event.httpMethod === "GET") {
        const { data: request, error } = await supabase
          .from("account_deletion_requests")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          return createErrorResponse(
            "Failed to retrieve account deletion status",
            500,
            "database_error",
            requestId,
          );
        }

        if (!request) {
          return createSuccessResponse({
            hasPendingDeletion: false,
            request: null,
          });
        }

        return createSuccessResponse({
          hasPendingDeletion: request.status === "pending",
          request: {
            id: request.id,
            status: request.status,
            requestedAt: request.requested_at,
            scheduledHardDeleteAt: request.scheduled_hard_delete_at,
            softDeletedAt: request.soft_deleted_at,
            hardDeletedAt: request.hard_deleted_at,
            reason: request.reason,
            daysRemaining:
              request.status === "pending"
                ? Math.ceil(
                    (new Date(request.scheduled_hard_delete_at) - new Date()) /
                      (1000 * 60 * 60 * 24),
                  )
                : null,
          },
        });
      }

      // POST - Request account deletion
      if (event.httpMethod === "POST") {
        let body;
        try {
          body = JSON.parse(event.body || "{}");
        } catch {
          return createErrorResponse("Invalid JSON body", 400, "invalid_json");
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return createErrorResponse(
            "Request body must be an object",
            422,
            "validation_error",
          );
        }

        const { reason, confirmDelete } = body;
        if (reason !== undefined && reason !== null) {
          if (typeof reason !== "string" || reason.trim().length > 1000) {
            return createErrorResponse(
              "reason must be a string up to 1000 characters",
              422,
              "validation_error",
            );
          }
        }

        // Require explicit confirmation
        if (confirmDelete !== true) {
          return createErrorResponse(
            "Account deletion must be explicitly confirmed. Set confirmDelete: true in request body.",
            400,
            "confirmation_required",
          );
        }

        // Check for existing pending request
        const { data: existingRequest, error: existingRequestError } =
          await supabase
          .from("account_deletion_requests")
          .select("id, status")
          .eq("user_id", userId)
          .eq("status", "pending")
          .maybeSingle();
        if (existingRequestError) {
          return createErrorResponse(
            "Failed to verify existing deletion request",
            500,
            "database_error",
            requestId,
          );
        }

        if (existingRequest) {
          return createErrorResponse(
            "You already have a pending deletion request. Cancel it first if you want to submit a new one.",
            409,
            "request_exists",
          );
        }

        // Initiate deletion using the database function
        const { data: result, error } = await supabaseAdmin.rpc(
          "initiate_account_deletion",
          {
            p_user_id: userId,
            p_reason: reason || null,
          },
        );

        if (error) {
          return createErrorResponse(
            "Failed to initiate account deletion",
            500,
            "database_error",
            requestId,
          );
        }

        // DO NOT revoke sessions during grace period (GDPR Article 17)
        // User must be able to login to cancel deletion within 30 days
        // Sessions will be revoked automatically during hard deletion after 30 days
        //
        // Note: UI should check deletion_pending status and show warning banner

        return createSuccessResponse({
          success: true,
          requestId: result,
          message:
            "Account deletion initiated. Your data will be permanently deleted in 30 days. " +
            "You can cancel this request by logging back in within that period.",
          scheduledDeletionDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          gracePeriodDays: 30,
        });
      }

      // DELETE - Cancel pending deletion request
      if (event.httpMethod === "DELETE") {
        // Get the pending request
        const { data: pendingRequest, error: pendingRequestError } =
          await supabase
          .from("account_deletion_requests")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "pending")
          .maybeSingle();
        if (pendingRequestError) {
          return createErrorResponse(
            "Failed to retrieve pending deletion request",
            500,
            "database_error",
            requestId,
          );
        }

        if (!pendingRequest) {
          return createErrorResponse(
            "No pending deletion request found",
            404,
            "not_found",
          );
        }

        // Cancel the deletion
        const { data: success, error } = await supabaseAdmin.rpc(
          "cancel_account_deletion",
          {
            p_request_id: pendingRequest.id,
            p_user_id: userId,
          },
        );

        if (error) {
          return createErrorResponse(
            "Failed to cancel account deletion",
            500,
            "database_error",
            requestId,
          );
        }

        if (!success) {
          return createErrorResponse(
            "Could not cancel deletion request. It may have already been processed.",
            400,
            "cancellation_failed",
          );
        }

        return createSuccessResponse({
          success: true,
          message:
            "Account deletion cancelled. Your account has been reactivated.",
        });
      }
    },
  });
};
