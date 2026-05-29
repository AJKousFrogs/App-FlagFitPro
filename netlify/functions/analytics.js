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
import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as performanceDataHandler } from "./performance-data.js";
import { handler as performanceHeatmapHandler } from "./performance-heatmap.js";
import { handler as performanceMetricsHandler } from "./performance-metrics.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

const handleRequest = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // /analytics/* first — its sub-routes (e.g. /analytics/performance-trends) contain the
  // substring "performance" and must not be intercepted by the generic performance match below.
  if (path.includes("/analytics")) {
    return dispatch(analyticsCoreHandler, req, url);
  }
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

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};

export default handleRequest;
export const handler = toLambdaHandler(handleRequest);
