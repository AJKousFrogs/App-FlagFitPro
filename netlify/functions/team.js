/**
 * Team Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates six legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/team-calendar, /api/team-calendar/*
 *   /api/team-invite, /api/team-invite/*
 *   /api/team-templates, /api/team-templates/*
 *   /api/season-archive, /api/season-archive/*
 *   /api/season-reports, /api/season-reports/*
 *   /api/attendance, /api/attendance/*
 */

import { handler as teamCalendarHandler } from "./team-calendar.js";
import { handler as teamInviteHandler } from "./team-invite.js";
import { handler as teamTemplatesHandler } from "./team-templates.js";
import { handler as seasonArchiveHandler } from "./season-archive.js";
import { handler as seasonReportsHandler } from "./season-reports.js";
import { handler as attendanceHandler } from "./attendance.js";

async function toLambdaEvent(req, url) {
  const headers = Object.fromEntries(req.headers);
  const method = req.method.toUpperCase();
  let body = null;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {body = await req.text();}
  return {
    httpMethod: method, path: url.pathname, headers,
    queryStringParameters: url.searchParams.size > 0 ? Object.fromEntries(url.searchParams) : {},
    multiValueQueryStringParameters: {}, body: body || null, isBase64Encoded: false,
  };
}

function fromLambdaResponse(r) {
  if (!r) {return new Response(JSON.stringify({ success: false, error: "No response" }), { status: 500, headers: { "Content-Type": "application/json" } });}
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
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: corsHeaders(req) });}
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/team-calendar")) {return dispatch(teamCalendarHandler, req, url);}
  if (path.includes("/team-invite")) {return dispatch(teamInviteHandler, req, url);}
  if (path.includes("/team-templates")) {return dispatch(teamTemplatesHandler, req, url);}
  if (path.includes("/season-archive")) {return dispatch(seasonArchiveHandler, req, url);}
  if (path.includes("/season-reports")) {return dispatch(seasonReportsHandler, req, url);}
  if (path.includes("/attendance")) {return dispatch(attendanceHandler, req, url);}

  return new Response(
    JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }),
    { status: 404, headers: corsHeaders(req) },
  );
};
