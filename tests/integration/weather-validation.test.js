import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1" }),
}));

describe("weather validation and safety fallback", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.OPENWEATHER_API_KEY;
    global.fetch = vi.fn();
    const mod = await import("../../netlify/functions/weather.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed lat query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/weather",
        queryStringParameters: { lat: "40north", lon: "-74.00" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when only one coordinate is provided", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/weather",
        queryStringParameters: { lat: "40.7128" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns conservative safety fallback when weather providers fail", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/weather",
        queryStringParameters: { city: "Miami" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);

    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.suitable).toBe(false);
    expect(payload.data.suitability).toBe("poor");
    expect(payload.data.safetyWarning).toBe(true);
    expect(payload.data.description).toMatch(/temporarily unavailable/i);
  });
});
