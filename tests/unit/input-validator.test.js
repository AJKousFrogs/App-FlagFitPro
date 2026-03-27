import { describe, expect, it } from "vitest";

import {
  parseJsonObjectBody,
  tryParseJsonObjectBody,
} from "../../netlify/functions/utils/input-validator.js";

describe("input-validator body parsing", () => {
  it("throws on non-object JSON bodies", () => {
    expect(() => parseJsonObjectBody("[]")).toThrow(
      "Request body must be an object",
    );
  });

  it("returns a validation response for malformed JSON", () => {
    const result = tryParseJsonObjectBody("{bad json");

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error.statusCode).toBe(422);

    const body = JSON.parse(result.error.body);
    expect(body.error).toMatchObject({
      code: "validation_error",
      message: "Invalid JSON in request body",
    });
  });

  it("parses valid object bodies", () => {
    const result = tryParseJsonObjectBody(JSON.stringify({ cycleId: "pc-1" }));

    expect(result).toEqual({
      ok: true,
      data: { cycleId: "pc-1" },
      error: null,
    });
  });
});
