import { wrapHandler } from "./utils/lambda-compat.js";
import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

async function toggleAiChatBookmark(messageId, userId, bookmarked) {
  const { data: message, error: fetchError } = await supabaseAdmin
    .from("ai_messages")
    .select("id, user_id, metadata")
    .eq("id", messageId)
    .single();

  if (fetchError || !message) {
    throw new Error("Message not found");
  }

  if (message.user_id !== userId) {
    throw new Error("Not authorized to update this message");
  }

  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? { ...message.metadata }
      : {};

  metadata.bookmarked = bookmarked;

  const { error: updateError } = await supabaseAdmin
    .from("ai_messages")
    .update({ metadata })
    .eq("id", messageId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error("Failed to update bookmark state");
  }

  return { messageId, bookmarked };
}

const handlerImpl = async (event, context) =>
  baseHandler(event, context, {
    functionName: "ai-chat-bookmark",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      let body;
      try {
        body = parseJsonObjectBody(event.body);
      } catch (_error) {
        return createErrorResponse(
          "Request body must be a JSON object",
          422,
          "validation_error",
          requestId,
        );
      }

      const { messageId, bookmarked } = body || {};
      if (typeof messageId !== "string" || messageId.trim().length === 0) {
        return createErrorResponse(
          "messageId is required",
          422,
          "validation_error",
          requestId,
        );
      }

      if (typeof bookmarked !== "boolean") {
        return createErrorResponse(
          "bookmarked must be boolean",
          422,
          "validation_error",
          requestId,
        );
      }

      try {
        const result = await toggleAiChatBookmark(
          messageId.trim(),
          userId,
          bookmarked,
        );
        return createSuccessResponse(result, requestId);
      } catch (error) {
        const message =
          error?.message === "Message not found" ||
          error?.message === "Not authorized to update this message"
            ? error.message
            : "Failed to update bookmark";
        const statusCode =
          message === "Message not found"
            ? 404
            : message === "Not authorized to update this message"
              ? 403
              : 500;

        return createErrorResponse(
          message,
          statusCode,
          statusCode === 500 ? "server_error" : "validation_error",
          requestId,
        );
      }
    },
  });

export const handler = handlerImpl;
export default wrapHandler(handlerImpl);
