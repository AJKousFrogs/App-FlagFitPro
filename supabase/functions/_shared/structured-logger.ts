type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEY_FRAGMENTS = [
  "password",
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
] as const;

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._-]+\b/gi;
const REDACTED = "[REDACTED]";

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function maskString(value: string): string {
  return value.replace(EMAIL_RE, REDACTED).replace(BEARER_RE, REDACTED);
}

function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function redact(value: unknown, depth = 0): unknown {
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
    return redact(serializeError(value), depth + 1);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      output[key] = isSensitiveKey(key)
        ? REDACTED
        : redact(nestedValue, depth + 1);
    }
    return output;
  }

  return String(value);
}

function extractCorrelationId(headers?: Headers): string | null {
  return headers?.get("x-correlation-id") ?? headers?.get("x-request-id") ?? null;
}

export function createLogger(
  service: string,
  context: Record<string, unknown> = {},
) {
  const baseContext = { service, ...context };

  const write = (
    level: LogLevel,
    eventName: string,
    eventContext: Record<string, unknown> = {},
    error?: unknown,
  ) => {
    const payload: Record<string, unknown> = {
      ...baseContext,
      ...eventContext,
    };

    if (typeof error !== "undefined") {
      payload.error = serializeError(error);
    }

    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event_name: eventName,
      context: redact(payload),
    });

    switch (level) {
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
    }
  };

  return {
    child(childContext: Record<string, unknown> = {}) {
      return createLogger(service, { ...baseContext, ...childContext });
    },
    debug(eventName: string, eventContext: Record<string, unknown> = {}) {
      write("debug", eventName, eventContext);
    },
    info(eventName: string, eventContext: Record<string, unknown> = {}) {
      write("info", eventName, eventContext);
    },
    warn(
      eventName: string,
      eventContext: Record<string, unknown> = {},
      error?: unknown,
    ) {
      write("warn", eventName, eventContext, error);
    },
    error(
      eventName: string,
      error?: unknown,
      eventContext: Record<string, unknown> = {},
    ) {
      write("error", eventName, eventContext, error);
    },
  };
}

export function buildRequestContext(
  req: Request,
  context: Record<string, unknown> = {},
): Record<string, unknown> {
  const correlationId = extractCorrelationId(req.headers);

  return {
    correlation_id: correlationId ?? undefined,
    trace_id: correlationId ?? undefined,
    request_id: correlationId ?? undefined,
    http_method: req.method,
    ...context,
  };
}
