import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  listError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: null, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "training_programs") {
        return {
          select() {
            return this;
          },
          order: async () => ({ data: [], error: dbState.listError }),
          eq() {
            return this;
          },
          single: async () => ({ data: null, error: { code: "PGRST116" } }),
        };
      }
      if (table === "training_weeks") {
        return {
          select() {
            return this;
          },
          in() {
            return this;
          },
          order: async () => ({ data: [], error: null }),
          eq() {
            return this;
          },
          lte() {
            return this;
          },
          gte() {
            return this;
          },
          single: async () => ({ data: null, error: { code: "PGRST116" } }),
        };
      }
      if (table === "training_session_templates") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return this;
          },
        };
      }
      if (table === "movement_patterns" || table === "warmup_protocols") {
        return {
          select() {
            return this;
          },
          eq: async () => ({ data: [], error: null }),
        };
      }
      if (table === "training_phases" || table === "session_exercises") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order: async () => ({ data: [], error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

describe("training-programs validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    dbState.listError = null;
    const mod = await import("../../netlify/functions/training-programs.js");
    handler = mod.testHandler;
  });

  it("returns 422 for invalid program id format", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-programs",
        queryStringParameters: { id: "not-a-uuid" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("accepts seeded program ids and proceeds past format validation", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-programs",
        queryStringParameters: { id: "11111111-1111-1111-1111-111111111111" },
      },
      {},
    );

    expect(response.statusCode).toBe(404);
  });

  it("returns 422 for invalid current-week date format", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-programs/current-week",
        queryStringParameters: {
          programId: "123e4567-e89b-12d3-a456-426614174000",
          date: "not-a-date",
        },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when program list query fails", async () => {
    dbState.listError = { message: "sensitive db detail" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-programs",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to fetch training programs");
    expect(body.error.details).toBeFalsy();
  });
});
