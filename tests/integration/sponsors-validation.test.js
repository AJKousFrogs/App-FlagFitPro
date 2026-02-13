import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: [],
  throwDbError: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { requestId: "req-test", userId: null }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  db: {
    sponsors: {
      getActiveSponsors: async () => {
        if (state.throwDbError) {
          throw new Error("db connection details");
        }
        return state.rows;
      },
    },
  },
}));

describe("sponsors response hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.rows = [];
    state.throwDbError = false;
    const mod = await import("../../netlify/functions/sponsors.js");
    handler = mod.handler;
  });

  it("returns relative proxy URLs and ignores host header injection", async () => {
    state.rows = [
      {
        id: "s1",
        name: "Sponsor One",
        logo_url: "https://laprimafit.com/logo.png",
        website_url: "https://laprimafit.com",
        display_order: 1,
      },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/sponsors",
        headers: {
          host: "evil.example.com",
          "x-forwarded-proto": "http",
        },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.sponsors[0].logoUrl).toContain(
      "/.netlify/functions/sponsor-logo?url=",
    );
    expect(body.data.sponsors[0].logoUrl.startsWith("http")).toBe(false);
  });

  it("filters sponsors with missing or empty logo_url", async () => {
    state.rows = [
      { id: "s1", name: "Valid", logo_url: "https://laprimafit.com/logo.png" },
      { id: "s2", name: "Missing", logo_url: null },
      { id: "s3", name: "Empty", logo_url: "   " },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/sponsors",
      },
      {},
    );

    const body = JSON.parse(response.body);
    expect(body.data.sponsors).toHaveLength(1);
    expect(body.data.sponsors[0].id).toBe("s1");
  });

  it("returns an empty list when sponsor query fails", async () => {
    state.throwDbError = true;

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/sponsors",
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.sponsors).toEqual([]);
  });
});
