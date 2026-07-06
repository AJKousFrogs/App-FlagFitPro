/**
 * Exercises Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates five legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/exercises, /api/exercises/*
 *   /api/exercise-progression, /api/exercise-progression/*
 *   /api/isometrics, /api/isometrics/*
 *   /api/plyometrics, /api/plyometrics/*
 *   /api/qb-throwing, /api/qb-throwing/*
 */

import { handler as exercisesCoreHandler } from "./exercises-core.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as exerciseProgressionHandler } from "./exercise-progression.js";
import { handler as isometricsHandler } from "./isometrics.js";
import { handler as plyometricsHandler } from "./plyometrics.js";
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
  if (path.includes("/isometrics")) {
    return dispatch(isometricsHandler, req, url);
  }
  if (path.includes("/plyometrics")) {
    return dispatch(plyometricsHandler, req, url);
  }
  if (path.includes("/qb-throwing")) {
    return dispatch(qbThrowingHandler, req, url);
  }
  if (path.includes("/exercises")) {
    return dispatch(exercisesCoreHandler, req, url);
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
