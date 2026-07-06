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
 *   /api/nutrition, /api/nutrition/*
 */

import { handler as wellnessLogsHandler } from "./wellness-logs.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as wellnessCheckinHandler } from "./wellness-checkin.js";
import { handler as sleepDataHandler } from "./sleep-data.js";
import { handler as hydrationHandler } from "./hydration.js";
import { handler as nutritionHandler } from "./nutrition.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

// ─── CORS ─────────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

const handleRequest = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Check-in: /api/wellness/checkin, /api/wellness-checkin — MUST match before generic /wellness/*
  if (
    path.includes("/wellness/checkin") ||
    path.includes("/wellness-checkin")
  ) {
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

  // Nutrition: /api/nutrition
  if (path.includes("/nutrition")) {
    return dispatch(nutritionHandler, req, url);
  }

  // General wellness: /api/wellness/*
  if (path.includes("/wellness")) {
    return dispatch(wellnessLogsHandler, req, url);
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

export default handleRequest;
export const handler = toLambdaHandler(handleRequest);
