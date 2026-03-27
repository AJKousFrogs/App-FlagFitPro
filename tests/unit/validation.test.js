import { describe, expect, it } from "vitest";

import { validateRequestBody } from "../../netlify/functions/validation.js";

describe("validateRequestBody", () => {
  it("rejects malformed JSON bodies", () => {
    const result = validateRequestBody("{bad-json", "login");

    expect(result.valid).toBe(false);
    expect(result.response.statusCode).toBe(400);
    const payload = JSON.parse(result.response.body);
    expect(payload.errors).toContain("Invalid JSON in request body");
  });

  it("rejects non-object JSON bodies", () => {
    const result = validateRequestBody("null", "login");

    expect(result.valid).toBe(false);
    expect(result.response.statusCode).toBe(400);
    const payload = JSON.parse(result.response.body);
    expect(payload.errors).toContain("Request body must be an object");
  });

  it("sanitizes valid object payloads before schema validation", () => {
    const result = validateRequestBody(
      JSON.stringify({
        email: "athlete@example.com\u0000",
        password: "StrongPass1!",
      }),
      "login",
    );

    expect(result.valid).toBe(true);
    expect(result.data.email).toBe("athlete@example.com");
  });
});
