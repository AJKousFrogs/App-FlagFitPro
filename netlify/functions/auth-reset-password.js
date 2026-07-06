import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { validateRequestBody } from "./validation.js";
import { emailService } from "./utils/email-service.js";
import { supabaseAdmin } from "./supabase-client.js";

export const handler = async (event, context) =>
  baseHandler(event, context, {
    allowUnauthenticated: true,
    handler: async (evt, _ctx, _meta) => {
      const { valid, data } = validateRequestBody(evt.body);

      if (!valid) {
        return createErrorResponse(
          "Invalid request body",
          422,
          "validation_error",
        );
      }

      const { action, token, email, newPassword } = data;

      if (action === "verify") {
        const result = emailService.verifyResetToken(token);
        return createSuccessResponse({
          verified: result.valid,
          email: result.email,
        });
      }

      if (action === "reset") {
        const verifyResult = emailService.verifyResetToken(token);
        if (!verifyResult.valid) {
          return createErrorResponse(
            "Invalid or expired token",
            400,
            "invalid_token",
          );
        }
        emailService.useResetToken();
        await supabaseAdmin.auth.admin.updateUserById(verifyResult.email, {
          password: newPassword,
        });
        return createSuccessResponse({ reset: true });
      }

      if (action === "request") {
        if (!email) {
          return createErrorResponse(
            "Email is required for password reset request",
            422,
            "validation_error",
          );
        }
        if (!emailService.isInitialized) {
          await emailService.initialize();
        }
        await emailService.sendPasswordReset(email);
        return createSuccessResponse({ sent: true });
      }

      return createErrorResponse("Invalid action", 400, "invalid_action");
    },
  });
