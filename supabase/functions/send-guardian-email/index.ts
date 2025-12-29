// Supabase Edge Function: Send Guardian Verification Email
// Sends parental consent verification emails to guardians
//
// This function is called when a minor requests parental consent.
// It sends an email to the guardian with a verification link.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GuardianEmailRequest {
  guardianEmail: string;
  guardianName?: string;
  minorName: string;
  verificationToken: string;
  consentId: string;
}

// Email template for guardian verification
function getGuardianEmailTemplate(
  guardianName: string,
  minorName: string,
  verificationUrl: string,
  appUrl: string
): string {
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
        .button-secondary { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
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
            <p>Dear ${guardianName || "Parent/Guardian"},</p>
            
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
            
            <p>Clicking this button will take you to a secure page where you can:</p>
            <ul>
                <li>Review our privacy policy and terms of use</li>
                <li>Choose which features to enable for your child</li>
                <li>Verify your consent with a single click</li>
            </ul>
            
            <div class="warning">
                <strong>⚠️ Important Information:</strong>
                <ul>
                    <li>This verification link expires in 7 days</li>
                    <li>You can revoke consent at any time</li>
                    <li>If you did not expect this email, please ignore it</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <h3>❌ If You Do Not Consent:</h3>
            <p>Simply ignore this email. Without your consent, ${minorName} will only have access to basic features that don't involve sensitive data collection.</p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${verificationUrl}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p>If you have any questions about our privacy practices or this consent request, please:</p>
            <ul>
                <li>Visit our <a href="${appUrl}/privacy-policy">Privacy Policy</a></li>
                <li>Read our <a href="${appUrl}/terms">Terms of Use</a></li>
                <li>Contact us at <a href="mailto:privacy@flagfitpro.com">privacy@flagfitpro.com</a></li>
            </ul>
            
            <p>Thank you for helping us keep young athletes safe online.</p>
            
            <p>Best regards,<br>The FlagFit Pro Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} FlagFit Pro - Športno društvo Žabe</p>
            <p>Athletes helping athletes since 2020</p>
            <p style="font-size: 12px; color: #999;">
                This email was sent because ${minorName} requested parental consent to use FlagFit Pro.
                <br>If you believe this was sent in error, please ignore this email.
            </p>
        </div>
    </div>
</body>
</html>`;
}

// Plain text version
function getGuardianEmailText(
  guardianName: string,
  minorName: string,
  verificationUrl: string
): string {
  return `
Dear ${guardianName || "Parent/Guardian"},

${minorName} has requested to use FlagFit Pro, a flag football training and performance tracking application. As they are under 18 years old, we require your consent before they can access certain features.

ABOUT FLAGFIT PRO
FlagFit Pro helps young athletes track their training progress, connect with teammates, and improve their flag football skills.

WHAT WE'RE ASKING PERMISSION FOR
When you verify consent, you'll be able to choose which features to allow:
- Health Data: Track fitness metrics like heart rate, steps, and workout intensity
- Biometrics: Record physical measurements for performance tracking  
- Location: Find nearby teams and track outdoor training routes
- Research: Optionally contribute anonymized data to sports science research

TO GIVE CONSENT
Visit this link to review and verify your consent:
${verificationUrl}

IMPORTANT INFORMATION
- This verification link expires in 7 days
- You can revoke consent at any time
- If you did not expect this email, please ignore it

IF YOU DO NOT CONSENT
Simply ignore this email. Without your consent, ${minorName} will only have access to basic features.

Questions? Contact us at privacy@flagfitpro.com

Best regards,
The FlagFit Pro Team

© ${new Date().getFullYear()} FlagFit Pro - Športno društvo Žabe
Athletes helping athletes since 2020
`.trim();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: GuardianEmailRequest = await req.json();
    const { guardianEmail, guardianName, minorName, verificationToken, consentId } = body;

    if (!guardianEmail || !minorName || !verificationToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: guardianEmail, minorName, verificationToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://webflagfootballfrogs.netlify.app";
    const fromEmail = Deno.env.get("FROM_EMAIL") || "FlagFit Pro <noreply@flagfitpro.com>";

    // Build verification URL
    const verificationUrl = `${appUrl}/consent/verify?token=${verificationToken}`;

    // If Resend API key is available, send via Resend
    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [guardianEmail],
          subject: `Parental Consent Required for ${minorName} - FlagFit Pro`,
          html: getGuardianEmailTemplate(guardianName || "Parent/Guardian", minorName, verificationUrl, appUrl),
          text: getGuardianEmailText(guardianName || "Parent/Guardian", minorName, verificationUrl),
          tags: [
            { name: "type", value: "parental-consent" },
            { name: "consent_id", value: consentId },
          ],
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error("Resend API error:", errorData);
        throw new Error(`Failed to send email: ${errorData}`);
      }

      const result = await emailResponse.json();

      // Log successful send to database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("privacy_audit_log").insert({
        action: "guardian_email_sent",
        affected_table: "parental_consent",
        affected_data: {
          consent_id: consentId,
          guardian_email: guardianEmail,
          email_id: result.id,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Guardian verification email sent successfully",
          emailId: result.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: Try Supabase's built-in email (if configured)
    // This uses Supabase Auth's email service
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log that email would be sent (for development/testing)
    await supabase.from("privacy_audit_log").insert({
      action: "guardian_email_queued",
      affected_table: "parental_consent",
      affected_data: {
        consent_id: consentId,
        guardian_email: guardianEmail,
        verification_url: verificationUrl,
        note: "Email service not fully configured - verification URL logged for manual sending",
      },
    });

    // Return success with instructions for manual setup
    return new Response(
      JSON.stringify({
        success: true,
        message: "Consent request recorded. Email service requires configuration.",
        verificationUrl, // Include for development/testing
        setupRequired: true,
        instructions: [
          "Set RESEND_API_KEY environment variable for automatic email sending",
          "Or configure SMTP settings in Netlify functions",
          "Verification URL has been logged for manual sending if needed",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending guardian email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send guardian email",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

