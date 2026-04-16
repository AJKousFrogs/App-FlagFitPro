/**
 * Payments & Sponsors Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Routes: /api/payments, /api/sponsors, /api/sponsor-logo
 */

import { handler as paymentsHandler } from "./payments-core.js";
import { handler as sponsorsHandler } from "./sponsors.js";
import { handler as sponsorLogoHandler } from "./sponsor-logo.js";

async function toLambdaEvent(req, url) {
  const m = req.method.toUpperCase();
  return {
    httpMethod: m, path: url.pathname, headers: Object.fromEntries(req.headers),
    queryStringParameters: url.searchParams.size > 0 ? Object.fromEntries(url.searchParams) : {},
    multiValueQueryStringParameters: {},
    body: m !== "GET" && m !== "HEAD" && m !== "OPTIONS" ? await req.text() : null,
    isBase64Encoded: false,
  };
}
function fromLambdaResponse(r) {
  if (!r) return new Response(JSON.stringify({ success: false, error: "No response" }), { status: 500, headers: { "Content-Type": "application/json" } });
  return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? null), { status: r.statusCode ?? 200, headers: r.headers ?? { "Content-Type": "application/json" } });
}
async function dispatch(h, req, url) { return fromLambdaResponse(await h(await toLambdaEvent(req, url), {})); }
function cors(req) {
  return { "Access-Control-Allow-Origin": req.headers.get("origin") || "*", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Correlation-Id", "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Credentials": "true", "Content-Type": "application/json", Vary: "Origin" };
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.includes("/sponsor-logo")) return dispatch(sponsorLogoHandler, req, url);
  if (path.includes("/sponsors")) return dispatch(sponsorsHandler, req, url);
  if (path.includes("/payments")) return dispatch(paymentsHandler, req, url);
  return new Response(JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }), { status: 404, headers: cors(req) });
};
