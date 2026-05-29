/**
 * Social Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Routes: /api/chat, /api/community
 */

import { handler as chatHandler } from "./chat.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as communityHandler } from "./community.js";

import { getCorsHeaders as cors } from "./utils/cors.js";

export default async (req) => {
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: cors(req) });}
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.includes("/community")) {return dispatch(communityHandler, req, url);}
  if (path.includes("/chat")) {return dispatch(chatHandler, req, url);}
  return new Response(JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }), { status: 404, headers: cors(req) });
};
