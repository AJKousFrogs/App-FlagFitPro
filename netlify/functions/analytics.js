/**
 * Analytics Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates three legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/performance/data, /api/performance-data, /api/performance-data/*
 *   /api/performance/heatmap, /api/performance-heatmap, /api/performance-heatmap/*
 *   /api/performance/metrics, /api/performance-metrics, /api/performance-metrics/*
 *
 * The former /api/analytics/* routes (analytics-core.js) were removed
 * 2026-07-02: zero frontend callers, and its "real" data path computed
 * everything from a `training_sessions.score` column that doesn't exist in
 * the schema (always fell through to a hardcoded `|| 70`), on top of its
 * error-fallback paths fabricating entire chart series and named athletes.
 */

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
