import { describe, it, expect } from "vitest";
import { mapKnownHandlerError } from "../../netlify/functions/utils/handler-errors.js";

/**
 * 2026-07-08 reuse audit R3: mapKnownHandlerError consolidates the invalid_json
 * (400) + parseBoundedInt/object-body (422) catch chain that was byte-identical
 * across coach-inbox / coach-analytics (migrated) and a handful of other
 * handlers (adopting incrementally). These lock in that the mapping preserves
 * the exact status/code the inline blocks produced, and returns null for
 * anything else so the caller's own 500 path still runs.
 */
describe("mapKnownHandlerError (reuse audit R3)", () => {
  const REQ = "req-123";

  it("invalid_json → 400 with the invalid_json code + requestId", () => {
    const res = mapKnownHandlerError({ code: "invalid_json" }, REQ);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("invalid_json");
    expect(body.error.message).toBe("Invalid JSON in request body");
  });

  it("'must be an integer between' message → 422 validation_error, message passed through", () => {
    const res = mapKnownHandlerError(
      new Error("weeks must be an integer between 1 and 52"),
      REQ,
    );
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("validation_error");
    expect(body.error.message).toBe(
      "weeks must be an integer between 1 and 52",
    );
  });

  it("'Request body must be an object' → 422 validation_error", () => {
    const res = mapKnownHandlerError(
      new Error("Request body must be an object"),
      REQ,
    );
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe("validation_error");
  });

  it("an unrelated error → null (caller falls through to its own 500)", () => {
    expect(mapKnownHandlerError(new Error("some db failure"), REQ)).toBeNull();
    expect(mapKnownHandlerError({ code: "other" }, REQ)).toBeNull();
    expect(mapKnownHandlerError(undefined, REQ)).toBeNull();
  });
});
