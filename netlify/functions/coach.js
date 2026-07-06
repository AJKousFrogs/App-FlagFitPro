/**
 * Coach Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates five legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/coach/*             (coach profile, settings, roster management)
 *   /api/coach-activity, /api/coach-activity/*
 *   /api/coach-analytics, /api/coach-analytics/*
 *   /api/coach-alerts, /api/coach-alerts/*
 *   /api/coach-inbox, /api/coach-inbox/*
 */

import { handler as coachCoreHandler } from "./coach-core.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as coachActivityHandler } from "./coach-activity.js";
import { handler as coachAnalyticsHandler } from "./coach-analytics.js";
import { handler as coachAlertsHandler } from "./coach-alerts.js";
import { handler as coachInboxHandler } from "./coach-inbox.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

const handleRequest = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/coach-activity")) {
    return dispatch(coachActivityHandler, req, url);
  }
  if (path.includes("/coach-analytics")) {
    return dispatch(coachAnalyticsHandler, req, url);
  }
  if (path.includes("/coach-alerts")) {
    return dispatch(coachAlertsHandler, req, url);
  }
  if (path.includes("/coach-inbox")) {
    return dispatch(coachInboxHandler, req, url);
  }
  if (path.includes("/coach")) {
    return dispatch(coachCoreHandler, req, url);
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
