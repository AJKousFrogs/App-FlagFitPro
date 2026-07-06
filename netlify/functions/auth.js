/**
 * Auth Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/auth/login, /api/auth-login
 *   /api/auth/me, /api/auth-me
 *   /api/account/deletion, /api/account-deletion
 *   /api/account/pause, /api/account-pause
 */

import { handler as authLoginHandler } from "./auth-login.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as authMeHandler } from "./auth-me.js";
import { handler as accountDeletionHandler } from "./account-deletion.js";
import { handler as accountPauseHandler } from "./account-pause.js";
import { handler as acceptInvitationHandler } from "./accept-invitation.js";
import { handler as validateInvitationHandler } from "./validate-invitation.js";
import { handler as parentalConsentHandler } from "./parental-consent.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (
    path.includes("/accept-invitation") ||
    path.includes("/auth/accept-invitation")
  ) {
    return dispatch(acceptInvitationHandler, req, url);
  }
  if (
    path.includes("/validate-invitation") ||
    path.includes("/auth/validate-invitation")
  ) {
    return dispatch(validateInvitationHandler, req, url);
  }
  if (
    path.includes("/parental-consent") ||
    path.includes("/auth/parental-consent")
  ) {
    return dispatch(parentalConsentHandler, req, url);
  }
  if (
    path.includes("/auth/reset-password") ||
    path.includes("/auth-reset-password")
  ) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Use Supabase Auth resetPasswordForEmail instead",
        code: "gone",
      }),
      {
        status: 410,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      },
    );
  }
  if (path.includes("/auth/login") || path.includes("/auth-login")) {
    return dispatch(authLoginHandler, req, url);
  }
  if (path.includes("/auth/me") || path.includes("/auth-me")) {
    return dispatch(authMeHandler, req, url);
  }
  // Match both /account/delete and /account/deletion (a redirect exists for each);
  // "deletion" contains "delete", so the shorter token covers both.
  if (path.includes("/account/delete") || path.includes("/account-deletion")) {
    return dispatch(accountDeletionHandler, req, url);
  }
  if (path.includes("/account/pause") || path.includes("/account-pause")) {
    return dispatch(accountPauseHandler, req, url);
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: `Not found: ${req.method} ${path}`,
      code: "not_found",
    }),
    { status: 404, headers: corsHeaders(req) },
  );
};
