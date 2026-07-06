/**
 * Knowledge Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Routes: /api/knowledge/search, /api/knowledge/governance, /api/knowledge-search, /api/knowledge-governance
 */

import { handler as knowledgeSearchHandler } from "./knowledge-search.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as knowledgeGovernanceHandler } from "./knowledge-governance.js";

import { getCorsHeaders as cors } from "./utils/cors.js";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req) });
  }
  const url = new URL(req.url);
  const path = url.pathname;
  if (
    path.includes("/knowledge/governance") ||
    path.includes("/knowledge-governance")
  ) {
    return dispatch(knowledgeGovernanceHandler, req, url);
  }
  return dispatch(knowledgeSearchHandler, req, url);
};
