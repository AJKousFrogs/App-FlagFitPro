import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  trainingProgramResponse: {
    data: null,
    error: { code: "PGRST116" },
  },
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    from(table) {
      if (table === "training_programs") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          single: async () => dbState.trainingProgramResponse,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

describe("player-programs validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    dbState.trainingProgramResponse = {
      data: null,
      error: { code: "PGRST116" },
    };
    ({ handler } = await import("../../netlify/functions/player-programs.js"));
  });

  it("returns 422 for non-object POST payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-programs",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid program_id on POST", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-programs",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ program_id: "not-a-uuid" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid assignment id in PUT path", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/player-programs/not-a-uuid",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ status: "paused" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("accepts seeded program ids and proceeds past format validation", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-programs",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          program_id: "11111111-1111-1111-1111-111111111111",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(404);
  });
});
