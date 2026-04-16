/**
 * User Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates three legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/user/profile, /api/user-profile, /api/user-profile/*
 *   /api/user/context, /api/user-context, /api/user-context/*
 *   /api/privacy-settings, /api/privacy-settings/*
 */

import { handler as userProfileCoreHandler } from "./user-profile-core.js";
import { handler as userContextHandler } from "./user-context.js";
import { handler as privacySettingsHandler } from "./privacy-settings.js";

async function toLambdaEvent(req, url) {
  const headers = Object.fromEntries(req.headers);
  const method = req.method.toUpperCase();
  let body = null;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") body = await req.text();
  return {
    httpMethod: method, path: url.pathname, headers,
    queryStringParameters: url.searchParams.size > 0 ? Object.fromEntries(url.searchParams) : {},
    multiValueQueryStringParameters: {}, body: body || null, isBase64Encoded: false,
  };
}

function fromLambdaResponse(r) {
  if (!r) return new Response(JSON.stringify({ success: false, error: "No response" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const body = typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? null);
  return new Response(body, { status: r.statusCode ?? 200, headers: r.headers ?? { "Content-Type": "application/json" } });
}

async function dispatch(handler, req, url) {
  return fromLambdaResponse(await handler(await toLambdaEvent(req, url), {}));
}

function corsHeaders(req) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Correlation-Id",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json", Vary: "Origin",
  };
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/privacy-settings")) return dispatch(privacySettingsHandler, req, url);
  if (path.includes("/user-context") || path.includes("/user/context")) return dispatch(userContextHandler, req, url);
  // user-profile and user/profile both handled by core handler
  return dispatch(userProfileCoreHandler, req, url);
};
