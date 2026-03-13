import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { db } from "./supabase-client.js";
import { createSuccessResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Sponsors
// Returns active sponsors with logos for display on login and other pages

const handler = async (event, context) => {
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
        if (dbError?.code) {
          console.error("Database error in sponsors function", { code: dbError.code });
        } else {
          console.error("Database error in sponsors function");
        }
        // Return empty array if database query fails (fallback to hardcoded logos)
        sponsors = [];
      }

      // Build proxy URL for logos to bypass COEP restrictions
      const getProxyUrl = (originalUrl) => {
        return `/.netlify/functions/sponsor-logo?url=${encodeURIComponent(originalUrl)}`;
      };

      const normalizedSponsors = Array.isArray(sponsors)
        ? sponsors.filter(
            (sponsor) =>
              sponsor &&
              typeof sponsor.logo_url === "string" &&
              sponsor.logo_url.trim().length > 0,
          )
        : [];

      // Return sponsors data with proxied logo URLs
      // If no sponsors found, return empty array (frontend will use fallback)
      return createSuccessResponse({
        sponsors:
          normalizedSponsors.length > 0
            ? normalizedSponsors.map((sponsor) => ({
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

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
