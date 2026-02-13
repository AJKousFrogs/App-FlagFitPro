import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  cyclesData: [],
  cyclesError: null,
  playerCyclesData: [],
  upsertError: null,
}));

const supabaseMock = vi.hoisted(() => ({
  from: (table) => {
    if (table === "program_cycles") {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order: async () => ({
          data: dbState.cyclesData,
          error: dbState.cyclesError,
        }),
      };
    }

    if (table === "player_program_cycles") {
      return {
        select() {
          return this;
        },
        eq: async () => ({ data: dbState.playerCyclesData, error: null }),
        upsert() {
          return {
            select() {
              return {
                single: async () => ({
                  data: { id: "pc-1" },
                  error: dbState.upsertError,
                }),
              };
            },
          };
        },
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  },
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
      supabase: supabaseMock,
    }),
}));

describe("program-cycles validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    dbState.cyclesData = [];
    dbState.cyclesError = null;
    dbState.playerCyclesData = [];
    dbState.upsertError = null;
    const mod = await import("../../netlify/functions/program-cycles.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object POST payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/program-cycles",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid status values", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/program-cycles",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          cycleId: "123e4567-e89b-12d3-a456-426614174000",
          status: "paused",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when GET cycles query fails", async () => {
    dbState.cyclesError = { message: "sensitive db detail" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/program-cycles",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to fetch program cycles");
  });

  it("returns sanitized 500 when upsert fails", async () => {
    dbState.upsertError = { message: "constraint detail leak" };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/program-cycles",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          cycleId: "123e4567-e89b-12d3-a456-426614174000",
          status: "completed",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to update cycle status");
  });
});
