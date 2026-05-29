/**
 * Health Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Routes: /api/health (health check), /api/recovery, /api/return-to-play
 */

import { handler as healthCheckHandler } from "./health-core.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as recoveryHandler } from "./recovery-core.js";
import { handler as returnToPlayHandler } from "./return-to-play.js";

import { getCorsHeaders as cors } from "./utils/cors.js";

export default async (req) => {
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: cors(req) });}
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.includes("/return-to-play")) {return dispatch(returnToPlayHandler, req, url);}
  if (path.includes("/recovery")) {return dispatch(recoveryHandler, req, url);}
  // Default: health check
  return dispatch(healthCheckHandler, req, url);
};
