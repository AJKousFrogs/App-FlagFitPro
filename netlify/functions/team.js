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
 *   /api/attendance, /api/attendance/*
 */

import { handler as teamCalendarHandler } from "./team-calendar.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as teamInviteHandler } from "./team-invite.js";
import { handler as teamTemplatesHandler } from "./team-templates.js";
import { handler as seasonArchiveHandler } from "./season-archive.js";
import { handler as attendanceHandler } from "./attendance.js";

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/team-calendar")) {
    return dispatch(teamCalendarHandler, req, url);
  }
  if (path.includes("/team-invite")) {
    return dispatch(teamInviteHandler, req, url);
  }
  if (path.includes("/team-templates")) {
    return dispatch(teamTemplatesHandler, req, url);
  }
  if (path.includes("/season-archive")) {
    return dispatch(seasonArchiveHandler, req, url);
  }
  if (path.includes("/attendance")) {
    return dispatch(attendanceHandler, req, url);
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
