import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyRateLimit } from "../../netlify/functions/utils/rate-limiter.js";

describe("applyRateLimit", () => {
  let originalNetlifyDev;

  beforeEach(() => {
    originalNetlifyDev = process.env.NETLIFY_DEV;
    process.env.NETLIFY_DEV = "true";
  });

  afterEach(() => {
    if (originalNetlifyDev === undefined) {
      delete process.env.NETLIFY_DEV;
    } else {
      process.env.NETLIFY_DEV = originalNetlifyDev;
    }
  });

  it("returns a structured 429 response with dynamic CORS headers", () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 100) + 100}`;
    const event = {
      headers: {
        origin: "http://localhost:8888",
        "x-forwarded-for": ip,
      },
    };

    let response = null;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = applyRateLimit(event, "AUTH", "user-a");
    }

    expect(response?.statusCode).toBe(429);
    expect(response?.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:8888",
    );
    expect(response?.headers["Retry-After"]).toBeDefined();

    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      success: false,
      error: {
        code: "rate_limit_exceeded",
        message: expect.stringContaining("Too many requests"),
      },
      retryAfter: expect.any(Number),
    });
  });

  it("tracks separate rate limit buckets per authenticated user", () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 100) + 1}`;
    const event = {
      headers: {
        origin: "http://localhost:4200",
        "x-forwarded-for": ip,
      },
    };

    for (let attempt = 0; attempt < 6; attempt += 1) {
      applyRateLimit(event, "AUTH", "user-a");
    }

    const otherUserResponse = applyRateLimit(event, "AUTH", "user-b");
    expect(otherUserResponse).toBeNull();
  });
});
