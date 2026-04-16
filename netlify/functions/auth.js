/**
 * Auth Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates five legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/auth/login, /api/auth-login
 *   /api/auth/me, /api/auth-me
 *   /api/auth/reset-password, /api/auth-reset-password
 *   /api/account/deletion, /api/account-deletion
 *   /api/account/pause, /api/account-pause
 */

import { handler as authLoginHandler } from "./auth-login.js";
import { handler as authMeHandler } from "./auth-me.js";
import { handler as authResetPasswordHandler } from "./auth-reset-password.js";
import { handler as accountDeletionHandler } from "./account-deletion.js";
import { handler as accountPauseHandler } from "./account-pause.js";
import { handler as acceptInvitationHandler } from "./accept-invitation.js";
import { handler as validateInvitationHandler } from "./validate-invitation.js";
import { handler as parentalConsentHandler } from "./parental-consent.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

async function toLambdaEvent(req, url) {
  const headers = Object.fromEntries(req.headers);
  const method = req.method.toUpperCase();
  let body = null;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    body = await req.text();
  }
  return {
    httpMethod: method,
    path: url.pathname,
    headers,
    queryStringParameters: url.searchParams.size > 0
      ? Object.fromEntries(url.searchParams)
      : {},
    multiValueQueryStringParameters: {},
    body: body || null,
    isBase64Encoded: false,
  };
}

function fromLambdaResponse(lambdaResp) {
  if (!lambdaResp) {
    return new Response(
      JSON.stringify({ success: false, error: "Handler returned no response" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const body = typeof lambdaResp.body === "string"
    ? lambdaResp.body
    : JSON.stringify(lambdaResp.body ?? null);
  return new Response(body, {
    status: lambdaResp.statusCode ?? 200,
    headers: lambdaResp.headers ?? { "Content-Type": "application/json" },
  });
}

async function dispatch(handler, req, url) {
  const event = await toLambdaEvent(req, url);
  const result = await handler(event, {});
  return fromLambdaResponse(result);
}

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Correlation-Id",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

// ─── Main router ─────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/accept-invitation") || path.includes("/auth/accept-invitation")) {
    return dispatch(acceptInvitationHandler, req, url);
  }
  if (path.includes("/validate-invitation") || path.includes("/auth/validate-invitation")) {
    return dispatch(validateInvitationHandler, req, url);
  }
  if (path.includes("/parental-consent") || path.includes("/auth/parental-consent")) {
    return dispatch(parentalConsentHandler, req, url);
  }
  if (path.includes("/auth/reset-password") || path.includes("/auth-reset-password")) {
    return dispatch(authResetPasswordHandler, req, url);
  }
  if (path.includes("/auth/login") || path.includes("/auth-login")) {
    return dispatch(authLoginHandler, req, url);
  }
  if (path.includes("/auth/me") || path.includes("/auth-me")) {
    return dispatch(authMeHandler, req, url);
  }
  if (path.includes("/account/deletion") || path.includes("/account-deletion")) {
    return dispatch(accountDeletionHandler, req, url);
  }
  if (path.includes("/account/pause") || path.includes("/account-pause")) {
    return dispatch(accountPauseHandler, req, url);
  }

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
