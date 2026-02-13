import { emailService } from "./utils/email-service.js";
import { validateRequestBody } from "./validation.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Password reset endpoint
export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "auth-reset-password",
    allowedMethods: ["POST"],
    rateLimitType: "AUTH",
    requireAuth: false, // Password reset doesn't require prior auth
    handler: async (event, _context, { requestId }) => {
      // Validate request body
      const validation = validateRequestBody(event.body, "resetPassword");
      if (!validation.valid) {
        return validation.response;
      }

      const { email, action = "request", token, newPassword } = validation.data;

      if (action === "request") {
        if (!email) {
          return createErrorResponse(
            "Email is required",
            400,
            "validation_error",
            requestId,
          );
        }

        // Initialize email service only for email-delivery flow.
        if (!emailService.isInitialized) {
          const initialized = await emailService.initialize("smtp");
          if (!initialized) {
            console.error("Failed to initialize email service");
            return createErrorResponse(
              "Unable to send reset email at this time. Please try again later.",
              503,
              "service_unavailable",
              requestId,
            );
          }
        }

        // Send password reset email
        const resetUrl = `${process.env.URL || "http://localhost:8888"}/reset-password`;

        try {
          const result = await emailService.sendPasswordReset(email, resetUrl);

          return createSuccessResponse(
            {
              message: "Password reset link sent to your email",
              messageId: result.messageId,
            },
            requestId,
          );
        } catch (emailError) {
          console.error("Email sending failed:", emailError);

          // Return success to prevent email enumeration attacks
          return createSuccessResponse(
            {
              message:
                "If this email exists in our system, you will receive a password reset link",
            },
            requestId,
          );
        }
      } else if (action === "verify") {
        if (!token) {
          return createErrorResponse(
            "Token is required",
            400,
            "validation_error",
            requestId,
          );
        }

        const verification = emailService.verifyResetToken(token);
        return createSuccessResponse(verification, requestId);
      } else if (action === "reset") {
        if (!token || !newPassword) {
          return createErrorResponse(
            "Token and new password are required",
            400,
            "validation_error",
            requestId,
          );
        }

        const verification = emailService.verifyResetToken(token);

        if (!verification.valid) {
          return createErrorResponse(
            verification.error,
            400,
            "invalid_token",
            requestId,
          );
        }

        // Mark token as used
        emailService.useResetToken(token);

        // In a real app, you would update the password in the database here
        return createSuccessResponse(
          {
            message: "Password reset successful",
            email: verification.email,
          },
          requestId,
        );
      } else {
        return createErrorResponse(
          "Invalid action",
          400,
          "invalid_action",
          requestId,
        );
      }
    },
  });
};
