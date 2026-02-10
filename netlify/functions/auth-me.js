import { baseHandler } from "./utils/base-handler.js";
import { getSupabaseClient } from "./utils/auth-helper.js";
import { createSuccessResponse } from "./utils/error-handler.js";

// Netlify Function: Get Current User
// Returns current user information from Supabase JWT token

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "auth-me",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      // Get the user's full data from Supabase
      const authHeader =
        event.headers.authorization || event.headers.Authorization;
      const token = authHeader.substring(7);
      const supabase = getSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      // Return user data from Supabase
      const safeUser = {
        id: user?.id || userId,
        email: user?.email,
        role: user?.user_metadata?.role || "player",
        name: user?.user_metadata?.name || user?.email,
        email_verified: user?.email_confirmed_at !== null,
        created_at: user?.created_at,
        updated_at: user?.updated_at,
        user_metadata: user?.user_metadata,
      };

      return createSuccessResponse({ user: safeUser });
    },
  });
};
