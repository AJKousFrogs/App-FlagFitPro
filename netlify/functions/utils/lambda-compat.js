/**
 * lambda-compat.js — Native Netlify v2 wrapper for Lambda-style handlers
 *
 * Converts the Netlify v2 Web API (Request/Response) ↔ the legacy Lambda
 * event/response format expected by handlers written for v1.
 *
 * Replaces the heavier `runtime-v2-adapter.js`. Drop-in compatible:
 *   import { wrapHandler } from "./utils/lambda-compat.js";
 *   export default wrapHandler(myLegacyHandler);
 */

function buildQueryParams(url) {
  const single = {};
  const multi = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (!(key in single)) {
      single[key] = value;
      multi[key] = [value];
    } else {
      multi[key].push(value);
    }
  }
  return {
    queryStringParameters: Object.keys(single).length ? single : null,
    multiValueQueryStringParameters: Object.keys(multi).length ? multi : null,
  };
}

function normalizeBody(result) {
  if (result?.isBase64Encoded && typeof result.body === "string") {
    return Buffer.from(result.body, "base64");
  }
  if (typeof result?.body === "string") {return result.body;}
  if (result?.body === null || result?.body === undefined) {return "";}
  return JSON.stringify(result.body);
}

function toWebResponse(result) {
  if (result instanceof Response) {return result;}
  const headers = new Headers(result?.headers || {});
  for (const [k, vals] of Object.entries(result?.multiValueHeaders || {})) {
    if (Array.isArray(vals)) {vals.forEach((v) => headers.append(k, v));}
  }
  return new Response(normalizeBody(result), {
    status: Number(result?.statusCode) || 200,
    headers,
  });
}

/**
 * Wrap a Lambda-style `(event, context) => LambdaResponse` handler
 * so it works as a native Netlify v2 `(Request, Context) => Response` function.
 */
export function wrapHandler(handler) {
  return async (req, context) => {
    try {
      const url = new URL(req.url);
      const method = req.method || "GET";
      const hasBody = method !== "GET" && method !== "HEAD";
      const { queryStringParameters, multiValueQueryStringParameters } = buildQueryParams(url);
      const event = {
        httpMethod: method,
        path: url.pathname,
        rawUrl: req.url,
        headers: Object.fromEntries(req.headers),
        multiValueHeaders: null,
        queryStringParameters,
        multiValueQueryStringParameters,
        body: hasBody ? (await req.text()) || null : null,
        isBase64Encoded: false,
      };
      const result = await handler(event, context ?? {});
      return toWebResponse(result);
    } catch (err) {
      console.error("[lambda-compat] unhandled error", err?.message ?? err);
      return Response.json(
        { success: false, error: err?.message || "Internal server error", code: "server_error" },
        { status: 500 },
      );
    }
  };
}
