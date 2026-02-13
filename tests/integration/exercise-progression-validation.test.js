import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  exercisesError: null,
}));

function buildSupabaseMock() {
  return {
    from: (table) => {
      if (table === "protocol_exercises") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "exercises") {
        return {
          select: () => ({
            in: async () => ({
              data: [{ id: "ex-1", name: "Push Up", default_sets: 3, default_reps: 10 }],
              error: mockState.exercisesError,
            }),
          }),
        };
      }

      return {
        select: () => ({
          in: async () => ({ data: [], error: null }),
        }),
      };
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      supabase: buildSupabaseMock(),
    }),
}));

describe("exercise-progression validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockState.exercisesError = null;
    const mod = await import("../../netlify/functions/exercise-progression.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object JSON payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/exercise-progression",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for out-of-range acwrValue", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/exercise-progression",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          exerciseIds: ["ex-1"],
          acwrValue: 99,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 500 when exercise definition query fails", async () => {
    mockState.exercisesError = { message: "db details leak" };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/exercise-progression",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          exerciseIds: ["ex-1"],
        }),
      },
      {},
    );

    const parsed = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(parsed.error?.message).toBe("Failed to fetch exercise definitions");
    expect(response.body).not.toContain("db details leak");
  });
});
