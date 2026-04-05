/**
 * Deep redaction for structured logs — masks common PII and secrets before JSON output.
 */

const SENSITIVE_KEY_SUBSTRINGS = [
  "password",
  "passwd",
  "secret",
  "email",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "auth",
  "cookie",
  "ssn",
  "credit",
  "cvv",
  "pin",
  "bearer",
  "refresh_token",
  "access_token",
  "id_token",
  "anonkey",
  "anon_key",
  "service_role",
] as const;

const EMAIL_RE =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

const REDACTED = "[REDACTED]";

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_SUBSTRINGS.some((s) => lower.includes(s));
}

function maskEmailsInString(s: string): string {
  return s.replace(EMAIL_RE, REDACTED);
}

/**
 * Recursively redact secrets and mask email addresses in string leaf values.
 */
export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 12) {
    return "[MAX_DEPTH]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return maskEmailsInString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: maskEmailsInString(value.message),
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((v) => redactForLog(v, depth + 1));
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      if (isSensitiveKey(key)) {
        out[key] = REDACTED;
      } else {
        out[key] = redactForLog(obj[key], depth + 1);
      }
    }
    return out;
  }

  return String(value);
}
