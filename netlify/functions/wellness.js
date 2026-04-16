/**
 * Wellness Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates six legacy handlers into one native v2 function.
 * Each sub-module exports its Lambda-style `handler` as a named export;
 * this router adapts the native Web API Request/Response to that contract.
 *
 * Routes handled:
 *   /api/wellness/checkin, /api/wellness-checkin, /api/wellness-checkin/*
 *   /api/wellness/*           (general wellness data — logs, history, etc.)
 *   /api/sleep-data, /api/sleep-data/*
 *   /api/hydration, /api/hydration/*
 *   /api/cycle-tracking, /api/cycle-tracking/*
 *   /api/nutrition, /api/nutrition/*
 */

import { handler as wellnessLogsHandler } from "./wellness-logs.js";
import { handler as wellnessCheckinHandler } from "./wellness-checkin.js";
import { handler as sleepDataHandler } from "./sleep-data.js";
import { handler as hydrationHandler } from "./hydration.js";
import { handler as cycleTrackingHandler } from "./cycle-tracking.js";
import { handler as nutritionHandler } from "./nutrition.js";

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

// ─── CORS ─────────────────────────────────────────────────────────────────────

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

  // Check-in: /api/wellness/checkin, /api/wellness-checkin — MUST match before generic /wellness/*
  if (path.includes("/wellness/checkin") || path.includes("/wellness-checkin")) {
    return dispatch(wellnessCheckinHandler, req, url);
  }

  // Sleep data: /api/sleep-data
  if (path.includes("/sleep-data")) {
    return dispatch(sleepDataHandler, req, url);
  }

  // Hydration: /api/hydration
  if (path.includes("/hydration")) {
    return dispatch(hydrationHandler, req, url);
  }

  // Cycle tracking: /api/cycle-tracking
  if (path.includes("/cycle-tracking")) {
    return dispatch(cycleTrackingHandler, req, url);
  }

  // Nutrition: /api/nutrition
  if (path.includes("/nutrition")) {
    return dispatch(nutritionHandler, req, url);
  }

  // General wellness: /api/wellness/*
  if (path.includes("/wellness")) {
    return dispatch(wellnessLogsHandler, req, url);
  }

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
