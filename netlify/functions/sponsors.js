import { db } from "./supabase-client.js";
import { createSuccessResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Sponsors
// Returns active sponsors with logos for display on login and other pages

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "sponsors",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false, // Sponsors are public data for login page
    handler: async (event, _context, { userId: _userId }) => {
      // Get active sponsors from database
      let sponsors = [];
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
        const host =
          event.headers?.host ||
          event.headers?.Host ||
          "webflagfootballfrogs.netlify.app";
        const protocol =
          event.headers?.["x-forwarded-proto"] ||
          event.headers?.["X-Forwarded-Proto"] ||
          "https";
        const baseUrl = `${protocol}://${host}`;
        return `${baseUrl}/.netlify/functions/sponsor-logo?url=${encodeURIComponent(originalUrl)}`;
      };

      // Return sponsors data with proxied logo URLs
      // If no sponsors found, return empty array (frontend will use fallback)
      return createSuccessResponse({
        sponsors:
          sponsors.length > 0
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
    },
  });
};
