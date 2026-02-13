import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  throwGetError: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { requestId: "req-test" }),
}));

vi.mock("https", () => ({
  default: {
    get: () => {
      if (state.throwGetError) {
        throw new Error("sensitive upstream details");
      }
      throw new Error("unexpected https request in test");
    },
  },
}));

vi.mock("http", () => ({
  default: {
    get: () => {
      throw new Error("unexpected http request in test");
    },
  },
}));

describe("sponsor-logo domain and error hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.throwGetError = false;
    const mod = await import("../../netlify/functions/sponsor-logo.js");
    handler = mod.handler;
  });

  it("returns 422 when url query parameter is missing", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/sponsor-logo",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("blocks lookalike domains that only contain an allowed domain substring", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/sponsor-logo",
        queryStringParameters: { url: "https://evil-laprimafit.com/logo.png" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns sanitized 500 when upstream fetch fails", async () => {
    state.throwGetError = true;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/sponsor-logo",
        queryStringParameters: { url: "https://laprimafit.com/logo.png" },
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to proxy sponsor logo");
    expect(body.error.details).toBeFalsy();
  });
});
