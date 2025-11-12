const { emailService } = require("../../src/email-service.js");

// Password reset endpoint
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { email, action = "request" } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    // Initialize email service if not already done
    if (!emailService.isInitialized) {
      const initialized = await emailService.initialize("smtp");
      if (!initialized) {
        console.error("Failed to initialize email service");
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "Email service unavailable",
            message:
              "Unable to send reset email at this time. Please try again later.",
          }),
        };
      }
    }

    if (action === "request") {
      // Send password reset email
      const resetUrl = `${process.env.URL || "http://localhost:4000"}/reset-password.html`;

      try {
        const result = await emailService.sendPasswordReset(email, resetUrl);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Password reset link sent to your email",
            messageId: result.messageId,
          }),
        };
      } catch (emailError) {
        console.error("Email sending failed:", emailError);

        // Return success to prevent email enumeration attacks
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message:
              "If this email exists in our system, you will receive a password reset link",
          }),
        };
      }
    } else if (action === "verify") {
      // Verify reset token
      const { token } = JSON.parse(event.body);

      if (!token) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Token is required" }),
        };
      }

      const verification = emailService.verifyResetToken(token);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(verification),
      };
    } else if (action === "reset") {
      // Reset password with token
      const { token, newPassword } = JSON.parse(event.body);

      if (!token || !newPassword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: "Token and new password are required",
          }),
        };
      }

      const verification = emailService.verifyResetToken(token);

      if (!verification.valid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: verification.error }),
        };
      }

      // Mark token as used
      emailService.useResetToken(token);

      // In a real app, you would update the password in the database here
      // For demo purposes, we'll just return success

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Password reset successful",
          email: verification.email,
        }),
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid action" }),
      };
    }
  } catch (error) {
    console.error("Password reset error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: "Something went wrong. Please try again later.",
      }),
    };
  }
};
