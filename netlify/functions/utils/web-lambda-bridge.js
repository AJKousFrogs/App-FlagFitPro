/**
 * Web ⇄ Lambda bridge for the Netlify Functions v2 domain routers.
 *
 * Each domain router receives a native Web `Request` and dispatches to a Lambda-style
 * sub-handler (`(event, context) => { statusCode, headers, body }`). This module is the
 * single shared implementation of that adaptation — previously copy-pasted (verbatim and
 * in a compact one-line variant) into ~18 router files.
 *
 * (Companion to lambda-adapter.js, which does the reverse: wraps a Web handler so it can be
 * invoked Lambda-style — used to make the routers themselves testable.)
 */

export async function toLambdaEvent(req, url) {
  const headers = Object.fromEntries(req.headers);
  const method = req.method.toUpperCase();
  let body = null;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    body = await req.text();
  }
  return {
    httpMethod: method,
    path: url.pathname,
    headers,
    queryStringParameters:
      url.searchParams.size > 0 ? Object.fromEntries(url.searchParams) : {},
    multiValueQueryStringParameters: {},
    body: body || null,
    isBase64Encoded: false,
  };
}

export function fromLambdaResponse(lambdaResp) {
  if (!lambdaResp) {
    return new Response(
      JSON.stringify({ success: false, error: "Handler returned no response" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const body =
    typeof lambdaResp.body === "string"
      ? lambdaResp.body
      : JSON.stringify(lambdaResp.body ?? null);
  return new Response(body, {
    status: lambdaResp.statusCode ?? 200,
    headers: lambdaResp.headers ?? { "Content-Type": "application/json" },
  });
}

export async function dispatch(handler, req, url) {
  return fromLambdaResponse(await handler(await toLambdaEvent(req, url), {}));
}
