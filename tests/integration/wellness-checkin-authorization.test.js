import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    select() {
      return this;
    }
    eq() {
      return this;
    }
    single() {
      return Promise.resolve({
        data: {
          sleep_quality: 7,
          sleep_hours: 8,
          energy_level: 7,
          muscle_soreness: 3,
          stress_level: 3,
          calculated_readiness: 75,
          checkin_date: "2026-02-13",
        },
        error: null,
      });
    }
  }
  return {
    from() {
      return new Query();
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

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: vi.fn().mockResolvedValue("player"),
}));

vi.mock("../../netlify/functions/utils/consent-guard.js", () => ({
  canCoachViewWellness: vi.fn().mockResolvedValue({ allowed: false }),
  filterWellnessDataForCoach: vi.fn((x) => x),
}));

vi.mock("../../netlify/functions/utils/safety-override.js", () => ({
  detectPainTrigger: vi.fn(),
}));

describe("wellness-checkin authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/wellness-checkin.js");
    handler = mod.handler;
  });

  it("blocks player from reading another athlete checkin via athleteId", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/wellness-checkin",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { athleteId: "user-2", date: "2026-02-13" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });
});
