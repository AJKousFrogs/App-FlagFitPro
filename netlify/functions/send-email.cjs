// Netlify Function: Send Email
// Handles sending emails (verification, password reset, etc.)

const nodemailer = require("nodemailer");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

// Initialize email transporter
function getEmailTransporter() {
  // Try Gmail first
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Try generic SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

// Get from email address
function getFromEmail() {
  return (
    process.env.FROM_EMAIL ||
    process.env.SMTP_USER ||
    process.env.GMAIL_EMAIL ||
    "noreply@flagfitpro.com"
  );
}

// Get app URL
function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.URL ||
    "https://webflagfootballfrogs.netlify.app"
  );
}

// Email verification template
function getVerificationEmailTemplate(name, verificationUrl, role = "player") {
  const isCoach = role === "coach";
  const roleSpecificContent = isCoach
    ? `
            <p><strong>As a coach,</strong> you'll be able to:</p>
            <ul>
                <li>Create and manage teams</li>
                <li>Track player performance and analytics</li>
                <li>Create training sessions and programs</li>
                <li>Communicate with your team</li>
            </ul>
            <p>After verification, visit your coach dashboard to create your first team!</p>
    `
    : `
            <p><strong>As a player,</strong> you'll be able to:</p>
            <ul>
                <li>Track your performance and training progress</li>
                <li>Join teams and participate in tournaments</li>
                <li>Access training programs and drills</li>
                <li>Connect with teammates and coaches</li>
            </ul>
            <p>After verification, you can browse teams or wait for an invitation from your coach!</p>
    `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 40px; }
        .button { display: inline-block; background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
        .role-content { background: #e8f5e9; border-left: 4px solid #10c96b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        ul { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 FlagFit Pro</h1>
            <h2>Verify Your Email Address</h2>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for signing up for FlagFit Pro! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            
            <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <div class="role-content">
            ${roleSpecificContent}
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This verification link will expire in 24 hours</li>
                    <li>If you didn't create an account, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
            </p>
            
            <p>Once verified, you'll be able to access all features of FlagFit Pro!</p>
            
            <p>Best regards,<br>The FlagFit Pro Team</p>
        </div>
        <div class="footer">
            <p>© 2024 FlagFit Pro. All rights reserved.</p>
            <p>You're receiving this email because you signed up for FlagFit Pro.</p>
        </div>
    </div>
</body>
</html>`;
}

// Parental consent email template
function getParentalConsentEmailTemplate(guardianName, minorName, verificationUrl) {
  const appUrl = getAppUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parental Consent Required - FlagFit Pro</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 40px; }
        .button { display: inline-block; background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
        .info-box { background: #e8f5e9; border-left: 4px solid #10c96b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .consent-options { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        ul { margin: 10px 0; padding-left: 20px; }
        h3 { color: #333; margin-top: 25px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 FlagFit Pro</h1>
            <h2>Parental Consent Required</h2>
        </div>
        <div class="content">
            <p>Dear ${guardianName},</p>
            
            <p><strong>${minorName}</strong> has requested to use FlagFit Pro, a flag football training and performance tracking application. As they are under 18 years old, we require your consent before they can access certain features.</p>
            
            <div class="info-box">
                <h3 style="margin-top: 0;">📱 About FlagFit Pro</h3>
                <p>FlagFit Pro helps young athletes track their training progress, connect with teammates, and improve their flag football skills. The app is designed with safety and privacy as top priorities.</p>
            </div>
            
            <h3>🔒 What We're Asking Permission For:</h3>
            <div class="consent-options">
                <p>When you verify consent, you'll be able to choose which features to allow:</p>
                <ul>
                    <li><strong>Health Data:</strong> Track fitness metrics like heart rate, steps, and workout intensity</li>
                    <li><strong>Biometrics:</strong> Record physical measurements for performance tracking</li>
                    <li><strong>Location:</strong> Find nearby teams and track outdoor training routes</li>
                    <li><strong>Research:</strong> Optionally contribute anonymized data to sports science research</li>
                </ul>
                <p><em>You can enable or disable each feature individually.</em></p>
            </div>
            
            <h3>✅ To Give Consent:</h3>
            <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Review & Verify Consent</a>
            </p>
            
            <div class="warning">
                <strong>⚠️ Important Information:</strong>
                <ul>
                    <li>This verification link expires in 7 days</li>
                    <li>You can revoke consent at any time</li>
                    <li>If you did not expect this email, please ignore it</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${verificationUrl}
            </p>
            
            <p>Questions? Visit our <a href="${appUrl}/privacy-policy">Privacy Policy</a> or contact <a href="mailto:privacy@flagfitpro.com">privacy@flagfitpro.com</a></p>
            
            <p>Best regards,<br>The FlagFit Pro Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} FlagFit Pro. All rights reserved.</p>
            <p>This email was sent because ${minorName} requested parental consent to use FlagFit Pro.</p>
        </div>
    </div>
</body>
</html>`;
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "send-email",
    allowedMethods: ["POST"],
    rateLimitType: "AUTH", // Strict rate limiting for email sending
    requireAuth: false, // Email sending may be called during registration
    handler: async (event, _context, { userId: _userId }) => {
      const transporter = getEmailTransporter();
      if (!transporter) {
        return createErrorResponse(
          "Email service not configured. Please set up email credentials in environment variables.",
          503,
          "service_unavailable"
        );
      }

      const { type, to, name, verificationUrl, token, role, minorName } = JSON.parse(
        event.body || "{}",
      );

      if (!type || !to) {
        return createErrorResponse(
          "Email type and recipient (to) are required",
          400,
          "validation_error"
        );
      }

      const fromEmail = getFromEmail();
      let mailOptions;

      switch (type) {
        case "verification": {
          if (!verificationUrl && !token) {
            return createErrorResponse(
              "Verification URL or token is required",
              400,
              "validation_error"
            );
          }

          const url =
            verificationUrl || `${getAppUrl()}/verify-email.html?token=${token}`;
          const userRole = role || "player"; // Default to player if not provided
          mailOptions = {
            from: {
              name: "FlagFit Pro",
              address: fromEmail,
            },
            to,
            subject: "Verify Your FlagFit Pro Email Address",
            html: getVerificationEmailTemplate(name || "User", url, userRole),
            text: `Hi ${name || "User"},\n\nPlease verify your email address by clicking this link:\n${url}\n\nThis link expires in 24 hours.\n\nBest regards,\nThe FlagFit Pro Team`,
          };
          break;
        }

        case "parental_consent":
          if (!verificationUrl) {
            return createErrorResponse(
              "Verification URL is required for parental consent emails",
              400,
              "validation_error"
            );
          }
          mailOptions = {
            from: {
              name: "FlagFit Pro",
              address: fromEmail,
            },
            to,
            subject: `Parental Consent Required for ${minorName || "your child"} - FlagFit Pro`,
            html: getParentalConsentEmailTemplate(name || "Parent/Guardian", minorName || "your child", verificationUrl),
            text: `Dear ${name || "Parent/Guardian"},\n\n${minorName || "Your child"} has requested to use FlagFit Pro. As they are under 18, we require your consent.\n\nPlease verify consent by clicking this link:\n${verificationUrl}\n\nThis link expires in 7 days.\n\nBest regards,\nThe FlagFit Pro Team`,
          };
          break;

        default:
          return createErrorResponse(
            `Unsupported email type: ${type}`,
            400,
            "validation_error"
          );
      }

      const result = await transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully to ${to}:`, result.messageId);

      return createSuccessResponse(
        {
          messageId: result.messageId,
          to,
          type,
        },
        200,
        "Email sent successfully",
      );
    },
  });
};
