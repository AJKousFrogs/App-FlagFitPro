/**
 * Exercises Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Dispatches the LIVE exercise-domain routes to their handlers. The legacy
 * browse endpoints (exercises-core / isometrics / plyometrics) and the standalone
 * exercisedb endpoint were retired 2026-07-12: the daily-protocol engine reads the
 * canonical `exercises` table directly via EXERCISE_CATEGORY_ALIASES, and the
 * frontend never called them. See docs/ground-truth/backend-consolidation-plan.md.
 *
 * Routes handled:
 *   /api/exercise-progression, /api/exercise-progression/*
 *   /api/qb-throwing, /api/qb-throwing/*
 */

import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as exerciseProgressionHandler } from "./exercise-progression.js";
import { handler as qbThrowingHandler } from "./qb-throwing.js";

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

const handleRequest = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/exercise-progression")) {
    return dispatch(exerciseProgressionHandler, req, url);
  }
  if (path.includes("/qb-throwing")) {
    return dispatch(qbThrowingHandler, req, url);
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
