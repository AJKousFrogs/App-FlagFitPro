/**
 * Payments & Sponsors Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Routes: /api/payments, /api/sponsors, /api/sponsor-logo
 */

import { handler as paymentsHandler } from "./payments-core.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as sponsorsHandler } from "./sponsors.js";
import { handler as sponsorLogoHandler } from "./sponsor-logo.js";

import { getCorsHeaders as cors } from "./utils/cors.js";

const handleRequest = async (req) => {
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: cors(req) });}
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.includes("/sponsor-logo")) {return dispatch(sponsorLogoHandler, req, url);}
  if (path.includes("/sponsors")) {return dispatch(sponsorsHandler, req, url);}
  if (path.includes("/payments")) {return dispatch(paymentsHandler, req, url);}
  return new Response(JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }), { status: 404, headers: cors(req) });
};

export default handleRequest;
export const handler = toLambdaHandler(handleRequest);
