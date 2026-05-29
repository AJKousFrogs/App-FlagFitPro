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
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as computeAcwrHandler } from "./compute-acwr.js";
import { handler as loadManagementHandler } from "./load-management.js";
import { handler as readinessHistoryHandler } from "./readiness-history.js";

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

export default async (req) => {
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: corsHeaders(req) });}
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/calc-readiness") || path.includes("/readiness/calculate")) {
    return dispatch(calcReadinessHandler, req, url);
  }
  if (path.includes("/compute-acwr") || path.includes("/readiness/acwr")) {
    return dispatch(computeAcwrHandler, req, url);
  }
  if (path.includes("/load-management")) {return dispatch(loadManagementHandler, req, url);}
  if (path.includes("/readiness-history") || path.includes("/readiness/history")) {
    return dispatch(readinessHistoryHandler, req, url);
  }

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
