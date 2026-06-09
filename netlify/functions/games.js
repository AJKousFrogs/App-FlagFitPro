/**
 * Games Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates five legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/games, /api/games/*
 *   /api/game-events, /api/game-events/*
 */

import { handler as gamesCoreHandler } from "./games-core.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as gameEventsHandler } from "./game-events.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

// ─── Main router ─────────────────────────────────────────────────────────────

const handleRequest = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // More-specific paths first to avoid prefix collision
  if (path.includes("/game-events")) {return dispatch(gameEventsHandler, req, url);}
  if (path.includes("/games")) {return dispatch(gamesCoreHandler, req, url);}

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};

export default handleRequest;
export const handler = toLambdaHandler(handleRequest);
