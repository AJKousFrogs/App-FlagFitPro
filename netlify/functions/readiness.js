/**
 * Readiness Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates four legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/calc-readiness, /api/readiness/calculate
 *   /api/compute-acwr, /api/readiness/acwr
 *   /api/load-management, /api/load-management/*
 *   /api/readiness-history, /api/readiness/history
 */

import { handler as calcReadinessHandler } from "./calc-readiness.js";
import { handler as computeAcwrHandler } from "./compute-acwr.js";
import { handler as loadManagementHandler } from "./load-management.js";
import { handler as readinessHistoryHandler } from "./readiness-history.js";

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

  if (path.includes("/calc-readiness") || path.includes("/readiness/calculate")) {
    return dispatch(calcReadinessHandler, req, url);
  }
  if (path.includes("/compute-acwr") || path.includes("/readiness/acwr")) {
    return dispatch(computeAcwrHandler, req, url);
  }
  if (path.includes("/load-management")) return dispatch(loadManagementHandler, req, url);
  if (path.includes("/readiness-history") || path.includes("/readiness/history")) {
    return dispatch(readinessHistoryHandler, req, url);
  }

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
