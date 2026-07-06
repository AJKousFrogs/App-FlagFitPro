/**
 * Real coverage for `netlify/functions/utils/error-handler.js`.
 *
 * The original `error-handler.test.js` next door is a contract-shape stub
 * (each test mocks the method and verifies it was called with what we just
 * passed it). This file exercises the actual exports against the actual
 * Response shape consumers depend on.
 *
 * Focus: the response builders that every Netlify function in the repo
 * routes through — `createSuccessResponse`, `createErrorResponse`, and the
 * `handle*Error` helpers. Each test asserts on the real return shape:
 * `{ statusCode, headers, body }` with a JSON-parsed body.
 */

import { describe, it, expect } from "vitest";
import {
  ErrorType,
  createSuccessResponse,
  createErrorResponse,
  handleAuthenticationError,
  handleAuthorizationError,
  handleValidationError,
  handleNotFoundError,
  handleMethodNotAllowedError,
  handleConflictError,
} from "../../netlify/functions/utils/error-handler.js";

function parse(response) {
  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body),
    headers: response.headers,
  };
}

describe("ErrorType enum", () => {
  it("is frozen", () => {
    expect(Object.isFrozen(ErrorType)).toBe(true);
  });

  it("exposes the expected canonical types", () => {
    // The enum drives the `code` field on every error response — these are
    // the API surface contract.
    expect(ErrorType.VALIDATION).toBeDefined();
    expect(ErrorType.AUTHENTICATION).toBeDefined();
    expect(ErrorType.AUTHORIZATION).toBeDefined();
    expect(ErrorType.NOT_FOUND).toBeDefined();
    expect(ErrorType.METHOD_NOT_ALLOWED).toBeDefined();
    expect(ErrorType.CONFLICT).toBeDefined();
    expect(ErrorType.UNKNOWN).toBeDefined();
  });
});

describe("createSuccessResponse", () => {
  it("returns 200 with `{ success: true, data }` by default", () => {
    const res = parse(createSuccessResponse({ id: "abc" }));
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ id: "abc" });
  });

  it("honors a numeric status code argument", () => {
    const res = parse(createSuccessResponse({ id: "abc" }, 201));
    expect(res.statusCode).toBe(201);
  });

  it("ignores a legacy string second arg (requestId), uses default 200", () => {
    // Backward-compat: older call sites passed a requestId string here.
    const res = parse(createSuccessResponse({ id: "abc" }, "req-legacy"));
    expect(res.statusCode).toBe(200);
  });

  it("includes `message` when provided", () => {
    const res = parse(createSuccessResponse({}, 200, "Created"));
    expect(res.body.message).toBe("Created");
  });

  it("emits no-cache headers when cacheTTL is 0", () => {
    const res = parse(createSuccessResponse({}));
    expect(res.headers["Cache-Control"]).toContain("no-cache");
    expect(res.headers["Cache-Control"]).toContain("no-store");
  });

  it("emits public cache headers when cacheTTL > 0", () => {
    const res = parse(createSuccessResponse({}, 200, null, 60));
    expect(res.headers["Cache-Control"]).toContain("public");
    expect(res.headers["Cache-Control"]).toContain("max-age=60");
    expect(res.headers["Cache-Control"]).toContain(
      "stale-while-revalidate=300",
    );
    expect(res.headers["CDN-Cache-Control"]).toContain("max-age=60");
  });
});

describe("createErrorResponse", () => {
  it("returns the requested status and serializes the message", () => {
    const res = parse(
      createErrorResponse("Something broke", 500, ErrorType.UNKNOWN),
    );
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe("Something broke");
    expect(res.body.error.code).toBe(ErrorType.UNKNOWN);
    expect(res.body.errorType).toBe(ErrorType.UNKNOWN);
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("auto-promotes 400+VALIDATION to 422 (REST convention: unprocessable entity)", () => {
    const res = parse(
      createErrorResponse("Bad input", 400, ErrorType.VALIDATION),
    );
    expect(res.statusCode).toBe(422);
  });

  it("unwraps Error instances into a string message", () => {
    const res = parse(
      createErrorResponse(new Error("boom"), 500, ErrorType.UNKNOWN),
    );
    expect(res.body.error.message).toBe("boom");
  });

  it("supports legacy positional call shape `(statusCode, message)`", () => {
    // Older code did `createErrorResponse(500, "msg", ErrorType.X)`.
    // The function detects the swapped types and recovers.
    const res = parse(
      createErrorResponse(500, "Legacy message", ErrorType.UNKNOWN),
    );
    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe("Legacy message");
  });

  it("attaches a string requestId from the legacy fourth arg", () => {
    const res = parse(
      createErrorResponse("err", 500, ErrorType.UNKNOWN, "req-legacy-123"),
    );
    expect(res.body.requestId).toBe("req-legacy-123");
  });

  it("extracts `requestId` from an additionalData object onto the body root", () => {
    const res = parse(
      createErrorResponse("err", 500, ErrorType.UNKNOWN, {
        requestId: "req-abc",
        extra: "stays-on-body",
      }),
    );
    expect(res.body.requestId).toBe("req-abc");
    expect(res.body.extra).toBe("stays-on-body");
  });

  it("hoists `details` into error.details and removes it from the body root", () => {
    const res = parse(
      createErrorResponse("err", 500, ErrorType.UNKNOWN, {
        details: ["field 'a' is required"],
      }),
    );
    expect(res.body.error.details).toEqual(["field 'a' is required"]);
    expect(res.body.details).toBeUndefined();
  });
});

describe("handleValidationError", () => {
  it("wraps a string error into a 422 with a single-item detail array", () => {
    const res = parse(handleValidationError("email is required"));
    expect(res.statusCode).toBe(422);
    expect(res.body.error.code).toBe(ErrorType.VALIDATION);
    expect(res.body.error.message).toBe("email is required");
    expect(res.body.error.details).toEqual(["email is required"]);
  });

  it("joins an array of errors into a single message and preserves the detail list", () => {
    const res = parse(
      handleValidationError(["email is required", "name too short"]),
    );
    expect(res.statusCode).toBe(422);
    expect(res.body.error.message).toBe("email is required, name too short");
    expect(res.body.error.details).toEqual([
      "email is required",
      "name too short",
    ]);
  });
});

describe("handle*Error helpers", () => {
  it("handleAuthenticationError → 401 with default message", () => {
    const res = parse(handleAuthenticationError());
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe(ErrorType.AUTHENTICATION);
    expect(res.body.error.message).toBe("Authentication required");
  });

  it("handleAuthorizationError → 403", () => {
    const res = parse(handleAuthorizationError());
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe(ErrorType.AUTHORIZATION);
  });

  it("handleNotFoundError defaults to 'Resource not found'", () => {
    const res = parse(handleNotFoundError());
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe("Resource not found");
    expect(res.body.error.code).toBe(ErrorType.NOT_FOUND);
  });

  it("handleNotFoundError uses the resource name in the message", () => {
    const res = parse(handleNotFoundError("Athlete"));
    expect(res.body.error.message).toBe("Athlete not found");
  });

  it("handleMethodNotAllowedError → 405 with allowed list in body", () => {
    const res = parse(handleMethodNotAllowedError("PATCH", ["GET", "POST"]));
    expect(res.statusCode).toBe(405);
    expect(res.body.error.message).toContain("PATCH method not allowed");
    expect(res.body.error.message).toContain("GET, POST");
    expect(res.body.allowedMethods).toEqual(["GET", "POST"]);
  });

  it("handleConflictError → 409", () => {
    const res = parse(handleConflictError("Email already registered"));
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe(ErrorType.CONFLICT);
    expect(res.body.error.message).toBe("Email already registered");
  });
});
