import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { getSupabaseClient } from "./utils/auth-helper.js";
import { createSuccessResponse } from "./utils/error-handler.js";

// Netlify Function: Get Current User
// Returns current user information from Supabase JWT token

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "auth-me",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      // Get the user's full data from Supabase
      const authHeader =
        event.headers.authorization || event.headers.Authorization;
      const token =
        typeof authHeader === "string" && authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;
      const supabase = getSupabaseClient();

      let user = null;
      if (token) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error) {
          user = data?.user || null;
        }
      }

      // Return user data from Supabase
      const safeUser = {
        id: user?.id || userId,
        email: user?.email,
        role: user?.user_metadata?.role || "player",
        name: user?.user_metadata?.name || user?.email,
        email_verified: Boolean(user?.email_confirmed_at),
        created_at: user?.created_at,
        updated_at: user?.updated_at,
        user_metadata: user?.user_metadata,
      };

      return createSuccessResponse({ user: safeUser });
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
