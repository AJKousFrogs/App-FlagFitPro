/**
 * Roster Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates five legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/roster, /api/roster/*
 *   /api/player-stats, /api/player-stats/*
 *   /api/player-settings, /api/player-settings/*
 */

import { handler as rosterCoreHandler } from "./roster-core.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as playerStatsHandler } from "./player-stats.js";
import { handler as playerSettingsHandler } from "./player-settings.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/player-stats")) {return dispatch(playerStatsHandler, req, url);}
  if (path.includes("/player-settings")) {return dispatch(playerSettingsHandler, req, url);}
  if (path.includes("/roster")) {return dispatch(rosterCoreHandler, req, url);}

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
