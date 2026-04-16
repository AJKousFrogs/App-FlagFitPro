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
import { handler as exerciseProgressionHandler } from "./exercise-progression.js";
import { handler as isometricsHandler } from "./isometrics.js";
import { handler as plyometricsHandler } from "./plyometrics.js";
import { handler as qbThrowingHandler } from "./qb-throwing.js";

async function toLambdaEvent(req, url) {
  const headers = Object.fromEntries(req.headers);
  const method = req.method.toUpperCase();
  let body = null;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    body = await req.text();
  }
  return {
    httpMethod: method, path: url.pathname, headers,
    queryStringParameters: url.searchParams.size > 0 ? Object.fromEntries(url.searchParams) : {},
    multiValueQueryStringParameters: {}, body: body || null, isBase64Encoded: false,
  };
}

function fromLambdaResponse(r) {
  if (!r) return new Response(JSON.stringify({ success: false, error: "No response" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const body = typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? null);
  return new Response(body, { status: r.statusCode ?? 200, headers: r.headers ?? { "Content-Type": "application/json" } });
}

async function dispatch(handler, req, url) {
  return fromLambdaResponse(await handler(await toLambdaEvent(req, url), {}));
}

function corsHeaders(req) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Correlation-Id",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json", Vary: "Origin",
  };
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/exercise-progression")) return dispatch(exerciseProgressionHandler, req, url);
  if (path.includes("/isometrics")) return dispatch(isometricsHandler, req, url);
  if (path.includes("/plyometrics")) return dispatch(plyometricsHandler, req, url);
  if (path.includes("/qb-throwing")) return dispatch(qbThrowingHandler, req, url);
  if (path.includes("/exercises")) return dispatch(exercisesCoreHandler, req, url);

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
