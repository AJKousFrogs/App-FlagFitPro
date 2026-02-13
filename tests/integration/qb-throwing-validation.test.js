import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  existingLookupError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    rpc: async () => ({ data: [], error: null }),
    from: (table) => {
      if (table !== "qb_throwing_sessions") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select() {
          return {
            eq() {
              return this;
            },
            gte() {
              return this;
            },
            order() {
              return this;
            },
            limit: async () => ({ data: [], error: null }),
            single: async () => ({
              data: null,
              error: dbState.existingLookupError,
            }),
          };
        },
        insert() {
          return {
            select() {
              return {
                single: async () => ({ data: { id: "session-1" }, error: null }),
              };
            },
          };
        },
        update() {
          return {
            eq() {
              return this;
            },
            select() {
              return {
                single: async () => ({ data: { id: "session-1" }, error: null }),
              };
            },
          };
        },
      };
    },
  },
}));

describe("qb-throwing validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    dbState.existingLookupError = null;
    const mod = await import("../../netlify/functions/qb-throwing.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object JSON payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/qb-throwing",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when segmented throws exceed totalThrows", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/qb-throwing",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          sessionType: "practice",
          totalThrows: 50,
          shortThrows: 25,
          mediumThrows: 20,
          longThrows: 10,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when existing-session lookup fails", async () => {
    dbState.existingLookupError = { code: "XX001", message: "db details leak" };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/qb-throwing",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          sessionType: "practice",
          totalThrows: 120,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Internal server error");
    expect(body.error.details).toBeFalsy();
  });
});
