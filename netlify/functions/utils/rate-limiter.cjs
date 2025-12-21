const RATE_LIMITS = {
  DEFAULT: { maxRequests: 100, windowMs: 60000 },
  AUTH: { maxRequests: 10, windowMs: 60000 },
  CREATE: { maxRequests: 30, windowMs: 60000 },
  READ: { maxRequests: 200, windowMs: 60000 },
};
const rateLimitStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetAt) rateLimitStore.delete(key);
  }
}, 300000);
function checkRateLimit(identifier, options = RATE_LIMITS.DEFAULT) {
  const now = Date.now();
  const key = "ratelimit:" + identifier;
  const { maxRequests, windowMs } = options;
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  const limitData = rateLimitStore.get(key);
  if (now > limitData.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (limitData.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((limitData.resetAt - now) / 1000) };
  }
  limitData.count++;
  return { allowed: true, remaining: maxRequests - limitData.count };
}
function applyRateLimit(event, limitType = "DEFAULT") {
  const ip = (event.headers && event.headers["x-forwarded-for"]) || (event.headers && event.headers["X-Forwarded-For"]) || "unknown";
  const limit = RATE_LIMITS[limitType] || RATE_LIMITS.DEFAULT;
  const result = checkRateLimit(ip, limit);
  if (!result.allowed) {
    return { statusCode: 429, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json", "Retry-After": String(result.retryAfter) }, body: JSON.stringify({ success: false, error: "Rate limit exceeded", retryAfter: result.retryAfter }) };
  }
  return null;
}
function getRateLimitType(method, path) {
  if (path.includes("/auth") || path.includes("/login")) return "AUTH";
  if (method === "POST" || method === "PUT" || method === "DELETE") return "CREATE";
  if (method === "GET") return "READ";
  return "DEFAULT";
}
module.exports = { checkRateLimit, applyRateLimit, getRateLimitType, RATE_LIMITS };
