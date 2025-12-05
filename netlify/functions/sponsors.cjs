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
  logFunctionCall("sponsors", event);

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
    let sponsors;
    try {
      sponsors = await db.sponsors.getActiveSponsors();
    } catch (dbError) {
      console.error("Database error in sponsors function:", dbError);
      // Return empty array if database query fails (fallback to hardcoded logos)
      sponsors = [];
    }

    // Build proxy URL for logos to bypass COEP restrictions
    const getProxyUrl = (originalUrl) => {
      // Get base URL from event headers or use default
      const host = event.headers?.host || event.headers?.Host || "webflagfootballfrogs.netlify.app";
      const protocol = event.headers?.["x-forwarded-proto"] || event.headers?.["X-Forwarded-Proto"] || "https";
      const baseUrl = `${protocol}://${host}`;
      return `${baseUrl}/.netlify/functions/sponsor-logo?url=${encodeURIComponent(originalUrl)}`;
    };

    // Return sponsors data with proxied logo URLs
    // If no sponsors found, return empty array (frontend will use fallback)
    return createSuccessResponse({
      sponsors: sponsors.length > 0 
        ? sponsors.map((sponsor) => ({
            id: sponsor.id,
            name: sponsor.name,
            logoUrl: getProxyUrl(sponsor.logo_url),
            originalLogoUrl: sponsor.logo_url, // Keep original for reference
            websiteUrl: sponsor.website_url || null,
            displayOrder: sponsor.display_order || 0,
          }))
        : [],
    });
  } catch (error) {
    console.error("Error in sponsors function:", error);
    console.error("Error stack:", error.stack);
    // Return empty array instead of error to allow fallback logos to work
    return createSuccessResponse({
      sponsors: [],
    });
  }
};

