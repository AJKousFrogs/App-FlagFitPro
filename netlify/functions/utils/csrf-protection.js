// CSRF Protection Middleware for Netlify Functions
// Validates Origin and Referer headers to prevent Cross-Site Request Forgery

/**
 * Get allowed origins based on environment
 * @returns {string[]} Array of allowed origins
 */
function getAllowedOrigins() {
  const origins = [
    "http://localhost:3000",
    "http://localhost:4200",
    "http://localhost:8888",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4200",
    "http://127.0.0.1:8888",
  ];

  // Add production URL if available
  if (process.env.URL) {
    origins.push(process.env.URL);
  }

  // Add deploy URL if available (Netlify deploy previews)
  if (process.env.DEPLOY_URL) {
    origins.push(process.env.DEPLOY_URL);
  }

  return origins;
}

/**
 * Extract origin from URL
 * @param {string} url - Full URL
 * @returns {string|null} Origin or null
 */
function extractOrigin(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (_e) {
    return null;
  }
}

/**
 * Validate CSRF protection headers
 * @param {Object} event - Netlify function event
 * @returns {Object|null} Error response if invalid, null if valid
 */
function validateCSRF(event) {
  const method = event.httpMethod;

  // Only validate state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return null; // GET, HEAD, OPTIONS are safe
  }

  const allowedOrigins = getAllowedOrigins();
  const origin = event.headers["origin"] || event.headers["Origin"];
  const referer = event.headers["referer"] || event.headers["Referer"];

  // Check Origin header (preferred)
  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      console.warn(
        `[CSRF] Blocked request from unauthorized origin: ${origin}`,
      );
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Forbidden",
          message: "CSRF validation failed: Invalid origin",
        }),
      };
    }
    return null; // Valid origin
  }

  // Fallback to Referer header check
  if (referer) {
    const refererOrigin = extractOrigin(referer);
    if (!refererOrigin || !allowedOrigins.includes(refererOrigin)) {
      console.warn(
        `[CSRF] Blocked request with unauthorized referer: ${referer}`,
      );
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Forbidden",
          message: "CSRF validation failed: Invalid referer",
        }),
      };
    }
    return null; // Valid referer
  }

  // No Origin or Referer header - potentially suspicious
  // For APIs using custom headers (like Authorization), this is less critical
  // but we should still log it
  console.warn("[CSRF] Request missing both Origin and Referer headers");

  // For authenticated endpoints with JWT, we can be more lenient
  // since the Authorization header provides protection
  const authHeader =
    event.headers["authorization"] || event.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Has JWT token - allow (JWT itself provides CSRF protection)
    return null;
  }

  // No Origin, Referer, or Authorization - block
  return {
    statusCode: 403,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success: false,
      error: "Forbidden",
      message: "CSRF validation failed: Missing security headers",
    }),
  };
}

/**
 * Apply CSRF protection to a Netlify function
 * @param {Object} event - Netlify function event
 * @returns {Object|null} Error response if CSRF check fails, null if valid
 */
function applyCSRFProtection(event) {
  return validateCSRF(event);
}

export default {
  validateCSRF,
  applyCSRFProtection,
  getAllowedOrigins,
};
