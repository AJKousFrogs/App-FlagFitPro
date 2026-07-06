/**
 * Training Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates nine legacy handlers into one native v2 function.
 * Each sub-module exports its Lambda-style `handler` as a named export;
 * this router adapts the native Web API Request/Response to that contract.
 *
 * Routes handled:
 *   /api/training/sessions, /api/training-sessions, /api/training-sessions/:id
 *   /api/training/complete
 *   /api/training/suggestions
 *   /api/training-metrics
 *   /api/training-plan, /api/training-plan/*
 *   /api/training/stats, /api/training-stats-enhanced, /training-stats*
 *   /api/training-programs, /api/training-programs/*
 *   /api/smart-training, /api/smart-training/*
 *   /api/daily-training, /api/daily-training/*
 */

import { handler as trainingSessionsHandler } from "./training-sessions.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as trainingCompleteHandler } from "./training-complete.js";
import { handler as trainingSuggestionsHandler } from "./training-suggestions.js";
import { handler as trainingMetricsHandler } from "./training-metrics.js";
import { handler as trainingStatsHandler } from "./training-stats-enhanced.js";
import { handler as trainingPlanHandler } from "./training-plan.js";
import { handler as trainingProgramsHandler } from "./training-programs.js";
import { handler as smartTrainingHandler } from "./smart-training-recommendations.js";
import { handler as dailyTrainingHandler } from "./daily-training.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

/**
 * Convert a native Fetch API Request into a Lambda-style event object.
 * The underlying sub-handlers use baseHandler which expects the Lambda format.
 */
/**
 * Convert a Lambda-style response object to a native Fetch API Response.
 */
/**
 * Dispatch a request to a Lambda-style handler using the adapter pair above.
 */
// ─── CORS ─────────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Sessions: /api/training/sessions, /api/training-sessions, /api/training-sessions/:id
  if (
    path.includes("/training/sessions") ||
    path.includes("/training-sessions")
  ) {
    return dispatch(trainingSessionsHandler, req, url);
  }

  // Complete: /api/training/complete
  if (path.includes("/training/complete")) {
    return dispatch(trainingCompleteHandler, req, url);
  }

  // Suggestions: /api/training/suggestions
  if (path.includes("/training/suggestions")) {
    return dispatch(trainingSuggestionsHandler, req, url);
  }

  // Stats (all aliases): /api/training/stats, /api/training-stats-enhanced, /training-stats*
  if (path.includes("/training-stats") || path.includes("/training/stats")) {
    return dispatch(trainingStatsHandler, req, url);
  }

  // Metrics: /api/training-metrics
  if (path.includes("/training-metrics")) {
    return dispatch(trainingMetricsHandler, req, url);
  }

  // Programs: /api/training-programs, /api/training-programs/*
  if (path.includes("/training-programs")) {
    return dispatch(trainingProgramsHandler, req, url);
  }

  // Plan: /api/training-plan, /api/training-plan/*
  if (path.includes("/training-plan")) {
    return dispatch(trainingPlanHandler, req, url);
  }

  // Smart training: /api/smart-training, /api/smart-training/*
  if (path.includes("/smart-training")) {
    return dispatch(smartTrainingHandler, req, url);
  }

  // Daily training: /api/daily-training, /api/daily-training/*
  if (path.includes("/daily-training")) {
    return dispatch(dailyTrainingHandler, req, url);
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
