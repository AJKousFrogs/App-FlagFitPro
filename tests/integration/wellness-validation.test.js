import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  return {
    from() {
      return {
        insert() {
          return this;
        },
        select() {
          return this;
        },
        single() {
          return Promise.resolve({ data: { id: "checkin-1" }, error: null });
        },
      };
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/consent-guard.js", () => ({
  canCoachViewWellness: vi.fn().mockResolvedValue({ allowed: false }),
  filterWellnessDataForCoach: vi.fn((item) => item),
}));

vi.mock("../../netlify/functions/utils/safety-override.js", () => ({
  detectPainTrigger: vi.fn(),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: vi.fn().mockResolvedValue("player"),
}));

describe("wellness validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/wellness.js");
    handler = mod.handler;
  });

  it("returns 422 for invalid readiness range instead of 500", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/wellness/checkin",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ readiness: 11 }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed checkins limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/wellness/checkins",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "10days" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
