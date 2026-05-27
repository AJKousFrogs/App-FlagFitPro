/**
 * Shared CORS helper for Netlify Functions v2 router files.
 *
 * Uses an origin allowlist so that `Access-Control-Allow-Credentials: true`
 * is only combined with explicitly-trusted origins — never with a blindly
 * reflected `Origin` header.
 */

const ALLOWED_ORIGINS = [
  process.env.ALLOWED_ORIGIN,
  process.env.URL,              // Netlify injects the deploy URL automatically
  process.env.DEPLOY_PRIME_URL, // Netlify injects branch deploy URLs automatically
  "https://flagfit-pro.netlify.app",
  "https://flagfitpro.com",
  "http://localhost:4200",
  "http://localhost:8888",
].filter(Boolean);

/**
 * Build safe CORS headers for a Netlify Functions v2 Request.
 *
 * @param {Request} req — native Fetch API Request (has `req.headers.get`)
 * @returns {Record<string, string>}
 */
function getCorsHeaders(req) {
  const requestOrigin = req.headers.get("origin");
  const origin =
    requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0] || "";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Request-Id, X-Correlation-Id",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    ...(requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
      ? { "Access-Control-Allow-Credentials": "true" }
      : {}),
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

export { ALLOWED_ORIGINS, getCorsHeaders };
