import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

const dbState = vi.hoisted(() => ({
  fixturesError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "team_members") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "fixtures") {
        return {
          select: () => ({
            or: () => ({
              gte: () => ({
                lte: () => ({
                  order: async () => ({
                    data: [],
                    error: dbState.fixturesError,
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    },
  },
}));

describe("fixtures validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    dbState.fixturesError = null;
    const mod = await import("../../netlify/functions/fixtures.js");
    handler = mod.handler;
  });

  it("returns 403 when player requests another athlete fixtures", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/fixtures",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { athleteId: "athlete-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for malformed days query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/fixtures",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 without leaking db details", async () => {
    dbState.fixturesError = { message: "db password leaked" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/fixtures",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    const parsed = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(parsed.error?.message).toBe("Failed to retrieve fixtures");
    expect(response.body).not.toContain("db password leaked");
  });
});
