/**
 * Data Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Routes: /api/data-export, /api/data-import, /api/import/fetch-url, /api/import/process
 */

import { handler as dataExportHandler } from "./data-export.js";
import { dispatch } from "./utils/web-lambda-bridge.js";
import { handler as dataImportHandler } from "./data-import.js";
import { handler as importOpenDataHandler } from "./import-open-data.js";
import { handler as importProcessHandler } from "./import-process.js";

import { getCorsHeaders as cors } from "./utils/cors.js";

export default async (req) => {
  if (req.method === "OPTIONS") {return new Response(null, { status: 204, headers: cors(req) });}
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.includes("/import/fetch-url") || path.includes("/import-open-data")) {return dispatch(importOpenDataHandler, req, url);}
  if (path.includes("/import/process") || path.includes("/import-process")) {return dispatch(importProcessHandler, req, url);}
  if (path.includes("/data-export")) {return dispatch(dataExportHandler, req, url);}
  if (path.includes("/data-import")) {return dispatch(dataImportHandler, req, url);}
  return new Response(JSON.stringify({ success: false, error: `Not found: ${req.method} ${path}`, code: "not_found" }), { status: 404, headers: cors(req) });
};
