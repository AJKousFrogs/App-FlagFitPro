/**
 * Games Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates five legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/games, /api/games/*
 *   /api/game-events, /api/game-events/*
 *   /api/tournaments, /api/tournaments/*
 *   /api/tournament-calendar, /api/tournament-calendar/*
 *   /api/fixtures, /api/fixtures/*
 */

import { handler as gamesCoreHandler } from "./games-core.js";
import { handler as gameEventsHandler } from "./game-events.js";
import { handler as tournamentsHandler } from "./tournaments.js";
import { handler as tournamentCalendarHandler } from "./tournament-calendar.js";
import { handler as fixturesHandler } from "./fixtures.js";

// ─── Adapters ────────────────────────────────────────────────────────────────

async function toLambdaEvent(req, url) {
  const headers = Object.fromEntries(req.headers);
  const method = req.method.toUpperCase();
  let body = null;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    body = await req.text();
  }
  return {
    httpMethod: method,
    path: url.pathname,
    headers,
    queryStringParameters: url.searchParams.size > 0
      ? Object.fromEntries(url.searchParams)
      : {},
    multiValueQueryStringParameters: {},
    body: body || null,
    isBase64Encoded: false,
  };
}

function fromLambdaResponse(lambdaResp) {
  if (!lambdaResp) {
    return new Response(
      JSON.stringify({ success: false, error: "Handler returned no response" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const body = typeof lambdaResp.body === "string"
    ? lambdaResp.body
    : JSON.stringify(lambdaResp.body ?? null);
  return new Response(body, {
    status: lambdaResp.statusCode ?? 200,
    headers: lambdaResp.headers ?? { "Content-Type": "application/json" },
  });
}

async function dispatch(handler, req, url) {
  const event = await toLambdaEvent(req, url);
  const result = await handler(event, {});
  return fromLambdaResponse(result);
}

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Correlation-Id",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

// ─── Main router ─────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // More-specific paths first to avoid prefix collision
  if (path.includes("/game-events")) {return dispatch(gameEventsHandler, req, url);}
  if (path.includes("/tournament-calendar")) {return dispatch(tournamentCalendarHandler, req, url);}
  if (path.includes("/tournaments")) {return dispatch(tournamentsHandler, req, url);}
  if (path.includes("/fixtures")) {return dispatch(fixturesHandler, req, url);}
  if (path.includes("/games")) {return dispatch(gamesCoreHandler, req, url);}

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
