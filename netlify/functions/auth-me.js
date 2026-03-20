import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { getSupabaseClient } from "./utils/auth-helper.js";
import { createSuccessResponse } from "./utils/error-handler.js";

// Netlify Function: Get Current User
// Returns current user information from Supabase JWT token

function decodeJwtPayload(token) {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) {
      return null;
    }
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "auth-me",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    skipEnvCheck: true,
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
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (!error) {
            user = data?.user || null;
          }
        } catch (_authError) {
          // Degrade to JWT payload decoding if Supabase auth lookup is unavailable.
        }
      }

      const decoded = token ? decodeJwtPayload(token) : null;

      // Return user data from Supabase
      const safeUser = {
        id: user?.id || userId || decoded?.sub || null,
        email: user?.email || decoded?.email || null,
        role: user?.user_metadata?.role || decoded?.user_metadata?.role || "player",
        name:
          user?.user_metadata?.name ||
          decoded?.user_metadata?.name ||
          user?.email ||
          decoded?.email ||
          null,
        email_verified: Boolean(user?.email_confirmed_at || decoded?.email_confirmed_at),
        created_at: user?.created_at || null,
        updated_at: user?.updated_at || null,
        user_metadata: user?.user_metadata || decoded?.user_metadata || null,
      };

      return createSuccessResponse({ user: safeUser });
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
