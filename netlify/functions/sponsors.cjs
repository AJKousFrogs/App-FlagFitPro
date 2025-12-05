// Netlify Function: Sponsors
// Returns active sponsors with logos for display on login and other pages

const { db, checkEnvVars } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  handleServerError,
  handleDatabaseError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall("sponsors", event.httpMethod, event.path);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Check environment variables
    checkEnvVars();

    // Get active sponsors from database
    const sponsors = await db.sponsors.getActiveSponsors();

    // Build proxy URL for logos to bypass COEP restrictions
    const getProxyUrl = (originalUrl) => {
      // Get base URL from event headers or use default
      const host = event.headers?.host || event.headers?.Host || "webflagfootballfrogs.netlify.app";
      const protocol = event.headers?.["x-forwarded-proto"] || event.headers?.["X-Forwarded-Proto"] || "https";
      const baseUrl = `${protocol}://${host}`;
      return `${baseUrl}/.netlify/functions/sponsor-logo?url=${encodeURIComponent(originalUrl)}`;
    };

    // Return sponsors data with proxied logo URLs
    return createSuccessResponse({
      sponsors: sponsors.map((sponsor) => ({
        id: sponsor.id,
        name: sponsor.name,
        logoUrl: getProxyUrl(sponsor.logo_url),
        originalLogoUrl: sponsor.logo_url, // Keep original for reference
        websiteUrl: sponsor.website_url || null,
        displayOrder: sponsor.display_order || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return handleDatabaseError(error, "Failed to fetch sponsors");
  }
};

