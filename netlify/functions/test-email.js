import nodemailer from "nodemailer";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";

// Test email endpoint
export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "test-email",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: false,
    handler: async (evt) => {
      try {
        let bodyData = {};
        try {
          bodyData = JSON.parse(evt.body);
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        const { email, provider: _provider = "smtp" } = bodyData;

        if (!email) {
          return handleValidationError("email is required");
        }

    // Test email configuration
    let transporter;
    let providerName = "Unknown";

    try {
      if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
        transporter = nodemailer.createTransporter({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });
        providerName = "Gmail";
      } else if (process.env.SENDGRID_API_KEY) {
        transporter = nodemailer.createTransporter({
          service: "SendGrid",
          auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY,
          },
        });
        providerName = "SendGrid";
      } else if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        providerName = "SMTP";
          } else {
            return {
              statusCode: 200,
              body: JSON.stringify({
                configured: false,
                message:
                  "No email service configured. Please check your environment variables.",
                instructions:
                  "Add GMAIL_EMAIL + GMAIL_APP_PASSWORD or SENDGRID_API_KEY or SMTP credentials to .env file",
              }),
            };
          }

          // Test connection
          await transporter.verify();

      // Send test email
      const mailOptions = {
        from: {
          name: "FlagFit Pro",
          address:
            process.env.FROM_EMAIL ||
            process.env.GMAIL_EMAIL ||
            process.env.SMTP_USER,
        },
        to: email,
        subject: "🏈 FlagFit Pro - Email Service Test",
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #10c96b; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #10c96b; margin: 0;">🏈 FlagFit Pro</h1>
              <h2 style="color: #333; margin: 10px 0;">Email Service Test Successful!</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>✅ Email Provider:</strong> ${providerName}</p>
              <p><strong>📧 Test Email:</strong> ${email}</p>
              <p><strong>⏰ Sent At:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>If you're seeing this email, your email service is working correctly!</p>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>🚀 What's Next:</strong></p>
              <ul>
                <li>Password reset emails will work automatically</li>
                <li>Welcome emails will be sent to new users</li>
                <li>All email templates are professionally designed</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || "http://localhost:8888"}" 
                 style="background: #10c96b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Back to FlagFit Pro
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="text-align: center; color: #666; font-size: 14px;">
              © 2024 FlagFit Pro. Email service powered by ${providerName}.
            </p>
          </div>
        `,
        text: `
FlagFit Pro - Email Service Test Successful!

✅ Email Provider: ${providerName}
📧 Test Email: ${email}
⏰ Sent At: ${new Date().toLocaleString()}

If you're seeing this email, your email service is working correctly!

🚀 What's Next:
- Password reset emails will work automatically
- Welcome emails will be sent to new users
- All email templates are professionally designed

Back to FlagFit Pro: ${process.env.APP_URL || "http://localhost:8888"}

© 2024 FlagFit Pro. Email service powered by ${providerName}.
        `.trim(),
      };

          const result = await transporter.sendMail(mailOptions);

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              configured: true,
              provider: providerName,
              message: `Test email sent successfully via ${providerName}!`,
              messageId: result.messageId,
              testEmail: email,
            }),
          };
        } catch (emailError) {
          console.error("Email service error:", emailError);

          return {
            statusCode: 200,
            body: JSON.stringify({
              configured: false,
              error: emailError.message,
              message: "Email service configuration issue",
              troubleshooting: {
                gmail: "Check GMAIL_EMAIL and GMAIL_APP_PASSWORD",
                sendgrid: "Check SENDGRID_API_KEY",
                smtp: "Check SMTP_HOST, SMTP_USER, SMTP_PASS",
              },
            }),
          };
        }
      } catch (error) {
        console.error("Test email error:", error);

        return createErrorResponse("Internal server error", 500, "server_error", {
          details: error.message,
        });
      }
    },
  });
