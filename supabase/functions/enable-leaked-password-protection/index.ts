// Supabase Edge Function: Enable Leaked Password Protection
// This function provides an application-level password breach check using the
// Have I Been Pwned API. It is intentionally public so signup can validate a
// password before the user has a session.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildRequestContext,
  createLogger,
} from "../_shared/structured-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  password?: string;
  action?: "check" | "enable" | "status";
}

const logger = createLogger("supabase.enable-leaked-password-protection");

/**
 * Check if a password has been leaked using Have I Been Pwned API
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 */
async function checkPasswordLeaked(
  password: string,
  requestLogger = logger,
): Promise<boolean> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    // Get first 5 characters (prefix) and remaining characters (suffix)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Query Have I Been Pwned API (k-anonymity model)
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "User-Agent": "FlagFit-Pro-Password-Checker",
        },
      },
    );

    if (!response.ok) {
      requestLogger.error("hibp_api_request_failed", undefined, {
        status_code: response.status,
      });
      // Fail open - if API is down, allow password (but log the error)
      return false;
    }

    const text = await response.text();
    const lines = text.split("\n");

    // Check if our suffix appears in the results
    for (const line of lines) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix === suffix) {
        const leakCount = parseInt(count.trim(), 10);
        requestLogger.info("password_breach_detected", {
          breach_count: leakCount,
        });
        return true; // Password has been leaked
      }
    }

    return false; // Password not found in breaches
  } catch (error) {
    requestLogger.error("password_breach_check_failed", error);
    // Fail open - if there's an error, allow password (but log it)
    return false;
  }
}

serve(async (req) => {
  const requestLogger = logger.child(buildRequestContext(req));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { password, action = "check" } = body;

    // Handle different actions
    switch (action) {
      case "check":
        if (!password) {
          return new Response(
            JSON.stringify({ error: "Password is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const isLeaked = await checkPasswordLeaked(password, requestLogger);
        return new Response(
          JSON.stringify({
            leaked: isLeaked,
            message: isLeaked
              ? "This password has been found in data breaches. Please choose a different password."
              : "Password is safe to use.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );

      case "status":
        return new Response(
          JSON.stringify({
            enabled: true,
            message:
              "Application-level leaked password protection is active.",
            provider: "Have I Been Pwned API",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );

      case "enable":
        return new Response(
          JSON.stringify({
            enabled: true,
            message:
              "Application-level leaked password protection is already active. Use 'check' to validate passwords.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );

      default:
        return new Response(
          JSON.stringify({
            error: "Invalid action. Use 'check', 'enable', or 'status'",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    requestLogger.error("leaked_password_protection_handler_failed", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
