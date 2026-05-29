/**
 * Staff Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates three legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/staff/nutritionist, /api/staff-nutritionist, /api/staff-nutritionist/*
 *   /api/staff/physiotherapist, /api/staff-physiotherapist, /api/staff-physiotherapist/*
 *   /api/staff/psychology, /api/staff-psychology, /api/staff-psychology/*
 */

import { handler as staffNutritionistHandler } from "./staff-nutritionist.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as staffPhysiotherapistHandler } from "./staff-physiotherapist.js";
import { handler as staffPsychologyHandler } from "./staff-psychology.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/nutritionist")) {return dispatch(staffNutritionistHandler, req, url);}
  if (path.includes("/physiotherapist")) {return dispatch(staffPhysiotherapistHandler, req, url);}
  if (path.includes("/psychology") || path.includes("/psycholog")) {
    return dispatch(staffPsychologyHandler, req, url);
  }

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
