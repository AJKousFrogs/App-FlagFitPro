/**
 * Programs Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Routes: /api/player-programs, /api/program-cycles, /api/micro-sessions, /api/decisions
 */

import { handler as playerProgramsHandler } from "./player-programs.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as programCyclesHandler } from "./program-cycles.js";
import { handler as microSessionsHandler } from "./micro-sessions.js";
import { handler as decisionsHandler } from "./decisions.js";

import { getCorsHeaders as cors } from "./utils/cors.js";

export default async (req) => {
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: cors(req) });}
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.includes("/player-programs")) {return dispatch(playerProgramsHandler, req, url);}
  if (path.includes("/program-cycles")) {return dispatch(programCyclesHandler, req, url);}
  if (path.includes("/micro-sessions")) {return dispatch(microSessionsHandler, req, url);}
  if (path.includes("/decisions")) {return dispatch(decisionsHandler, req, url);}
  return new Response(JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }), { status: 404, headers: cors(req) });
};
