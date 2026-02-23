function buildHeadersObject(headers) {
  const out = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function buildQueryParams(url) {
  const single = {};
  const multi = {};

  for (const [key, value] of url.searchParams.entries()) {
    if (!(key in single)) {
      single[key] = value;
      multi[key] = [value];
      continue;
    }
    multi[key].push(value);
  }

  return {
    queryStringParameters: Object.keys(single).length ? single : null,
    multiValueQueryStringParameters: Object.keys(multi).length ? multi : null,
  };
}

async function buildLegacyEvent(request) {
  const url = new URL(request.url);
  const method = request.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  const rawBody = hasBody ? await request.text() : "";
  const { queryStringParameters, multiValueQueryStringParameters } =
    buildQueryParams(url);

  return {
    httpMethod: method,
    path: url.pathname,
    rawUrl: request.url,
    headers: buildHeadersObject(request.headers),
    multiValueHeaders: null,
    queryStringParameters,
    multiValueQueryStringParameters,
    body: rawBody || null,
    isBase64Encoded: false,
  };
}

function buildLegacyContext(context) {
  return {
    ...context,
    clientContext: context?.clientContext || null,
    identity: context?.identity || null,
  };
}

function normalizeLambdaBody(result) {
  if (result?.isBase64Encoded && typeof result.body === "string") {
    return Buffer.from(result.body, "base64");
  }
  if (typeof result?.body === "string") {
    return result.body;
  }
  if (result?.body == null) {
    return "";
  }
  return JSON.stringify(result.body);
}

function lambdaResponseToWebResponse(result) {
  if (result instanceof Response) {
    return result;
  }

  const headers = new Headers(result?.headers || {});
  const multiValueHeaders = result?.multiValueHeaders || {};
  for (const [key, values] of Object.entries(multiValueHeaders)) {
    if (!Array.isArray(values)) continue;
    for (const value of values) headers.append(key, value);
  }

  const status = Number(result?.statusCode) || 200;
  return new Response(normalizeLambdaBody(result), { status, headers });
}

export function createRuntimeV2Handler(legacyHandler) {
  return async (request, context) => {
    const event = await buildLegacyEvent(request);
    const legacyContext = buildLegacyContext(context);
    const result = await legacyHandler(event, legacyContext);
    return lambdaResponseToWebResponse(result);
  };
}
