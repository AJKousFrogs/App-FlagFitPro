import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "player",
  queries: [],
  calls: [],
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("pg", () => ({
  Pool: class {
    async query(sql, params) {
      state.calls.push({ sql, params });
      if (state.queries.length === 0) {
        return { rows: [] };
      }
      const next = state.queries.shift();
      if (next instanceof Error) {
        throw next;
      }
      return next;
    }
  },
}));

describe("user-profile authorization and error hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "player";
    state.queries = [];
    state.calls = [];
    const mod = await import("../../netlify/functions/user-profile.js");
    handler = mod.handler;
  });

  it("returns 403 for cross-user access when caller is not admin", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/user-profile",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { userId: "user-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
    expect(state.calls.length).toBe(0);
  });

  it("allows admin to access another user's profile", async () => {
    state.role = "admin";
    state.queries = [
      {
        rows: [
          {
            id: "user-2",
            height_cm: 180,
            weight_kg: 80,
            position: "QB",
            birth_date: "2000-01-01",
            role: "athlete",
            experience_level: "advanced",
          },
        ],
      },
      { rows: [] },
      {
        rows: [{ session_count: "0", avg_duration: null, avg_intensity: null, session_types: [] }],
      },
      { rows: [] },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/user-profile",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { userId: "user-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.calls[0].params[0]).toBe("user-2");
  });

  it("returns sanitized 500 when database query fails", async () => {
    state.queries = [new Error("sensitive connection details")];
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/user-profile",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to retrieve user profile");
    expect(body.error.details).toBeFalsy();
  });
});
