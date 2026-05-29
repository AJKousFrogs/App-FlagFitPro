/**
 * User Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates three legacy handlers into one native v2 function.
 *
 * Routes handled:
 *   /api/user/profile, /api/user-profile, /api/user-profile/*
 *   /api/user/context, /api/user-context, /api/user-context/*
 *   /api/privacy-settings, /api/privacy-settings/*
 */

import { handler as userProfileCoreHandler } from "./user-profile-core.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { toLambdaHandler } from "./utils/lambda-adapter.js";
import { handler as userContextHandler } from "./user-context.js";
import { handler as privacySettingsHandler } from "./privacy-settings.js";

import { getCorsHeaders as corsHeaders } from "./utils/cors.js";

const handleRequest = async (req) => {
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: corsHeaders(req) });}
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.includes("/privacy-settings")) {return dispatch(privacySettingsHandler, req, url);}
  if (path.includes("/user-context") || path.includes("/user/context")) {return dispatch(userContextHandler, req, url);}
  // user-profile and user/profile both handled by core handler
  return dispatch(userProfileCoreHandler, req, url);
};

export default handleRequest;
export const handler = toLambdaHandler(handleRequest);
