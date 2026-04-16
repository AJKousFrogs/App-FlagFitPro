/**
 * Analytics Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates four legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/analytics, /api/analytics/*
 *   /api/performance/data, /api/performance-data, /api/performance-data/*
 *   /api/performance/heatmap, /api/performance-heatmap, /api/performance-heatmap/*
 *   /api/performance/metrics, /api/performance-metrics, /api/performance-metrics/*
 */

import { handler as analyticsCoreHandler } from "./analytics-core.js";
import { handler as performanceDataHandler } from "./performance-data.js";
import { handler as performanceHeatmapHandler } from "./performance-heatmap.js";
import { handler as performanceMetricsHandler } from "./performance-metrics.js";

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

  // performance/* sub-routes — match heatmap before metrics to avoid prefix overlap
  if (path.includes("/performance/heatmap") || path.includes("/performance-heatmap")) {
    return dispatch(performanceHeatmapHandler, req, url);
  }
  if (path.includes("/performance/metrics") || path.includes("/performance-metrics")) {
    return dispatch(performanceMetricsHandler, req, url);
  }
  if (path.includes("/performance/data") || path.includes("/performance-data") || path.includes("/performance")) {
    return dispatch(performanceDataHandler, req, url);
  }
  if (path.includes("/analytics")) {
    return dispatch(analyticsCoreHandler, req, url);
  }

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
