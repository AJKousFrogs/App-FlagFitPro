"use strict";

const SENSITIVE_KEY_FRAGMENTS = [
  "password",
  "passwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "api_key",
  "apikey",
  "email",
  "bearer",
  "refresh_token",
  "access_token",
  "id_token",
  "service_role",
];

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._-]+\b/gi;
const REDACTED = "[REDACTED]";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isSensitiveKey(key) {
  const normalized = String(key).toLowerCase();
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function maskString(value) {
  return value.replace(EMAIL_RE, REDACTED).replace(BEARER_RE, REDACTED);
}

function serializeError(error) {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(typeof error.code !== "undefined" ? { code: error.code } : {}),
    ...(typeof error.details !== "undefined" ? { details: error.details } : {}),
    ...(typeof error.hint !== "undefined" ? { hint: error.hint } : {}),
  };
}

function redact(value, depth = 0, seen = new WeakSet()) {
  if (depth > 12) {
    return "[MAX_DEPTH]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return maskString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return redact(serializeError(value), depth + 1, seen);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, depth + 1, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[CIRCULAR]";
    }
    seen.add(value);

    const output = {};
    const source = isPlainObject(value) ? value : Object.assign({}, value);
    for (const [key, nestedValue] of Object.entries(source)) {
      output[key] = isSensitiveKey(key)
        ? REDACTED
        : redact(nestedValue, depth + 1, seen);
    }
    return output;
  }

  return String(value);
}

function readHeader(source, key) {
  if (!source) {
    return null;
  }

  if (typeof source.get === "function") {
    return source.get(key) ?? source.get(key.toLowerCase()) ?? source.get(key.toUpperCase()) ?? null;
  }

  return source[key] ?? source[key.toLowerCase()] ?? source[key.toUpperCase()] ?? null;
}

function extractCorrelationId(source) {
  return (
    readHeader(source, "x-correlation-id") ||
    readHeader(source, "x-request-id") ||
    null
  );
}

function buildRequestLogContext(event, extraContext = {}) {
  const correlationId = extractCorrelationId(event?.headers);

  return {
    correlation_id: correlationId ?? undefined,
    trace_id: correlationId ?? undefined,
    request_id: correlationId ?? undefined,
    http_method: event?.httpMethod,
    path: event?.path,
    ...extraContext,
  };
}

function writeStructuredEntry(entry) {
  const line = JSON.stringify(entry);
  switch (entry.level) {
    case "debug":
      console.debug(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
    default:
      console.info(line);
      break;
  }
}

function createLogger({ service, context = {} } = {}) {
  const baseContext = {
    service,
    ...context,
  };

  const log = (level, eventName, eventContext = {}, error = undefined) => {
    const payload = {
      ...baseContext,
      ...(eventContext || {}),
    };

    if (typeof error !== "undefined") {
      payload.error = serializeError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    writeStructuredEntry({
      timestamp: new Date().toISOString(),
      level,
      event_name: eventName,
      context: redact(payload),
    });
  };

  return {
    child(childContext = {}) {
      return createLogger({
        service,
        context: {
          ...baseContext,
          ...childContext,
        },
      });
    },
    debug(eventName, eventContext = {}) {
      log("debug", eventName, eventContext);
    },
    info(eventName, eventContext = {}) {
      log("info", eventName, eventContext);
    },
    warn(eventName, eventContext = {}, error = undefined) {
      log("warn", eventName, eventContext, error);
    },
    error(eventName, error = undefined, eventContext = {}) {
      log("error", eventName, eventContext, error);
    },
  };
}

export {
  buildRequestLogContext,
  createLogger,
  extractCorrelationId,
  redact,
  serializeError,
};
