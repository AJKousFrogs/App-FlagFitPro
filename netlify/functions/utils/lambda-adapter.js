/**
 * Adapt a Netlify Functions v2 native handler — `(Request) => Response` — into a
 * Lambda-style `(event, context) => { statusCode, headers, body }` handler.
 *
 * The v2 domain routers (wellness.js, analytics.js, coach.js, …) export `default`
 * as a native Web handler. This wrapper lets them ALSO be invoked with the classic
 * Lambda event shape — used by the integration test-suite and any remaining
 * Lambda-style callers — without duplicating each router's path-dispatch logic.
 */
export function toLambdaHandler(webHandler) {
  return async (event = {}, context = {}) => {
    const method = (event.httpMethod || "GET").toUpperCase();

    const params = event.queryStringParameters || {};
    const qs =
      params && Object.keys(params).length
        ? `?${new URLSearchParams(params).toString()}`
        : "";
    const url = `https://local.test${event.path || "/"}${qs}`;

    const init = { method, headers: event.headers || {} };
    if (!["GET", "HEAD", "OPTIONS"].includes(method) && event.body != null) {
      init.body = event.body;
    }

    const res = await webHandler(new Request(url, init), context);

    const headers = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { statusCode: res.status, headers, body: await res.text() };
  };
}
