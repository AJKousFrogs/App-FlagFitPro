// Email Service for FlagFit Pro
// Supports multiple email providers and templates

import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.resetTokens = new Map(); // In production, store in database
  }

  // Initialize email service with preferred provider
  async initialize(provider = "smtp") {
    try {
      switch (provider) {
        case "gmail":
          await this.initializeGmail();
          break;
        case "sendgrid":
          await this.initializeSendGrid();
          break;
        case "mailgun":
          await this.initializeMailgun();
          break;
        case "smtp":
        default:
          await this.initializeSMTP();
          break;
      }

      this.isInitialized = true;
      console.log(`✅ Email service initialized with ${provider}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error);
      return false;
    }
  }

  // Gmail configuration
  async initializeGmail() {
    this.transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD, // App password, not regular password
      },
    });
  }

  // SendGrid configuration
  async initializeSendGrid() {
    this.transporter = nodemailer.createTransporter({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Mailgun configuration
  async initializeMailgun() {
    this.transporter = nodemailer.createTransporter({
      service: "Mailgun",
      auth: {
        user: process.env.MAILGUN_USERNAME,
        pass: process.env.MAILGUN_PASSWORD,
      },
    });
  }

  // Generic SMTP configuration
  async initializeSMTP() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Generate password reset token
  generateResetToken(email) {
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    this.resetTokens.set(token, {
      email,
      expiry,
      used: false,
    });

    // Clean up expired tokens
    setTimeout(
      () => {
        this.resetTokens.delete(token);
      },
      60 * 60 * 1000,
    );

    return token;
  }

  // Verify reset token
  verifyResetToken(token) {
    const tokenData = this.resetTokens.get(token);

    if (!tokenData) {
      return { valid: false, error: "Invalid token" };
    }

    if (tokenData.used) {
      return { valid: false, error: "Token already used" };
    }

    if (new Date() > tokenData.expiry) {
      this.resetTokens.delete(token);
      return { valid: false, error: "Token expired" };
    }

    return { valid: true, email: tokenData.email };
  }

  // Mark token as used
  useResetToken(token) {
    const tokenData = this.resetTokens.get(token);
    if (tokenData) {
      tokenData.used = true;
    }
  }

  // Send password reset email
  async sendPasswordReset(email, resetUrl) {
    if (!this.isInitialized) {
      throw new Error("Email service not initialized");
    }

    const token = this.generateResetToken(email);
    const fullResetUrl = `${resetUrl}?token=${token}`;

    const mailOptions = {
      from: {
        name: "FlagFit Pro",
        address:
          process.env.FROM_EMAIL ||
          process.env.SMTP_USER ||
          process.env.GMAIL_EMAIL,
      },
      to: email,
      subject: "Reset Your FlagFit Pro Password",
      html: this.getPasswordResetTemplate(email, fullResetUrl, token),
      text: this.getPasswordResetTextTemplate(email, fullResetUrl),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      return { success: true, messageId: result.messageId, token };
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    if (!this.isInitialized) {
      throw new Error("Email service not initialized");
    }

    const mailOptions = {
      from: {
        name: "FlagFit Pro",
        address:
          process.env.FROM_EMAIL ||
          process.env.SMTP_USER ||
          process.env.GMAIL_EMAIL,
      },
      to: email,
      subject: "Welcome to FlagFit Pro!",
      html: this.getWelcomeTemplate(name),
      text: this.getWelcomeTextTemplate(name),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
      throw error;
    }
  }

  // HTML template for password reset
  getPasswordResetTemplate(email, resetUrl, _token) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 40px; }
        .button { display: inline-block; background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 FlagFit Pro</h1>
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>We received a request to reset the password for your FlagFit Pro account associated with <strong>${email}</strong>.</p>
            
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                ${resetUrl}
            </p>
            
            <p>Need help? Contact our support team at support@flagfitpro.com</p>
            
            <p>Best regards,<br>The FlagFit Pro Team</p>
        </div>
        <div class="footer">
            <p>© 2024 FlagFit Pro. All rights reserved.</p>
            <p>You're receiving this email because you requested a password reset.</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Plain text template for password reset
  getPasswordResetTextTemplate(email, resetUrl) {
    return `
FlagFit Pro - Password Reset Request

Hi there,

We received a request to reset the password for your FlagFit Pro account associated with ${email}.

Click this link to reset your password:
${resetUrl}

⚠️ Security Notice:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

Need help? Contact our support team at support@flagfitpro.com

Best regards,
The FlagFit Pro Team

© 2024 FlagFit Pro. All rights reserved.
    `.trim();
  }

  // HTML template for welcome email
  getWelcomeTemplate(name) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FlagFit Pro!</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 40px; }
        .button { display: inline-block; background: linear-gradient(135deg, #10c96b 0%, #0ab85a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .feature { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10c96b; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 Welcome to FlagFit Pro!</h1>
            <h2>Your journey to peak performance starts now</h2>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to FlagFit Pro! We're excited to have you join our community of dedicated flag football athletes.</p>
            
            <div class="feature">
                <h3>🏃‍♂️ Performance Tracking</h3>
                <p>Monitor your speed, agility, and endurance with our comprehensive analytics dashboard.</p>
            </div>
            
            <div class="feature">
                <h3>🎯 Training Programs</h3>
                <p>Access personalized training programs designed by professional coaches.</p>
            </div>
            
            <div class="feature">
                <h3>📊 Progress Analytics</h3>
                <p>Track your improvement over time with detailed performance metrics and insights.</p>
            </div>
            
            <p style="text-align: center;">
                <a href="${process.env.APP_URL || "http://localhost:4000"}/dashboard.html" class="button">Get Started</a>
            </p>
            
            <p>If you have any questions, our support team is here to help at support@flagfitpro.com</p>
            
            <p>Let's elevate your game!</p>
            <p>The FlagFit Pro Team</p>
        </div>
        <div class="footer">
            <p>© 2024 FlagFit Pro. All rights reserved.</p>
            <p>Follow us on social media for training tips and updates!</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Plain text template for welcome email
  getWelcomeTextTemplate(name) {
    return `
Welcome to FlagFit Pro!

Hi ${name},

Welcome to FlagFit Pro! We're excited to have you join our community of dedicated flag football athletes.

🏃‍♂️ Performance Tracking
Monitor your speed, agility, and endurance with our comprehensive analytics dashboard.

🎯 Training Programs
Access personalized training programs designed by professional coaches.

📊 Progress Analytics
Track your improvement over time with detailed performance metrics and insights.

Get started: ${process.env.APP_URL || "http://localhost:4000"}/dashboard.html

If you have any questions, our support team is here to help at support@flagfitpro.com

Let's elevate your game!
The FlagFit Pro Team

© 2024 FlagFit Pro. All rights reserved.
    `.trim();
  }

  // Test email connectivity
  async testConnection() {
    if (!this.transporter) {
      throw new Error("Email service not initialized");
    }

    try {
      await this.transporter.verify();
      console.log("✅ Email service connection verified");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      return false;
    }
  }
}

// Create singleton instance
export const emailService = new EmailService();
export default EmailService;
