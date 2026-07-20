import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rpcResult: { data: "part-1", error: null },
  rpcArgs: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from() {
      const q = {
        select: () => q,
        eq: () => q,
        order: () =>
          Promise.resolve({
            data: [{ competition_event_id: "ev-1" }],
            error: null,
          }),
      };
      return q;
    },
    rpc: (_name, args) => {
      state.rpcArgs = args;
      return Promise.resolve(state.rpcResult);
    },
  },
}));

const POST = (body) => ({
  httpMethod: "POST",
  path: "/.netlify/functions/event-participation",
  headers: { authorization: "Bearer t" },
  queryStringParameters: {},
  body: typeof body === "string" ? body : JSON.stringify(body),
});

describe("event-participation validation", () => {
  let handler;
  beforeEach(async () => {
    vi.resetModules();
    state.rpcResult = { data: "part-1", error: null };
    state.rpcArgs = null;
    ({ handler } =
      await import("../../netlify/functions/event-participation.js"));
  });

  it("GET returns the athlete's pending events", async () => {
    const res = await handler(
      { httpMethod: "GET", path: "/x", headers: {}, queryStringParameters: {} },
      {},
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.pending).toHaveLength(1);
  });

  it("returns 422 for malformed JSON", async () => {
    const res = await handler(POST("{"), {});
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error?.code).toBe("validation_error");
  });

  it("returns 422 for a non-object body", async () => {
    const res = await handler(POST("[]"), {});
    expect(res.statusCode).toBe(422);
  });

  it("returns 422 when competitionEventId is missing", async () => {
    const res = await handler(POST({ attended: true, gamesPlayed: 5 }), {});
    expect(res.statusCode).toBe(422);
  });

  it("returns 422 when attended is not a boolean", async () => {
    const res = await handler(
      POST({ competitionEventId: "ev-1", gamesPlayed: 5 }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("returns 422 for an out-of-range gamesPlayed", async () => {
    const res = await handler(
      POST({ competitionEventId: "ev-1", attended: true, gamesPlayed: 999 }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("returns 422 for an out-of-range avgRpe", async () => {
    const res = await handler(
      POST({
        competitionEventId: "ev-1",
        attended: true,
        gamesPlayed: 5,
        avgRpe: 12,
      }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("records participation and calls the RPC with mapped args", async () => {
    const res = await handler(
      POST({
        competitionEventId: "ev-1",
        attended: true,
        gamesPlayed: 5,
        avgRpe: 8,
      }),
      {},
    );
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.participationId).toBe("part-1");
    expect(state.rpcArgs).toMatchObject({
      p_user_id: "user-1",
      p_competition_event_id: "ev-1",
      p_attended: true,
      p_games_played: 5,
      p_avg_rpe: 8,
    });
  });

  it("forces games_played to 0 when not attended", async () => {
    await handler(
      POST({ competitionEventId: "ev-1", attended: false, gamesPlayed: 5 }),
      {},
    );
    expect(state.rpcArgs.p_games_played).toBe(0);
  });

  it("maps an RPC authorization error to 403", async () => {
    state.rpcResult = {
      data: null,
      error: {
        message: "Not authorized to record participation for this athlete",
      },
    };
    const res = await handler(
      POST({ competitionEventId: "ev-1", attended: true, gamesPlayed: 3 }),
      {},
    );
    expect(res.statusCode).toBe(403);
  });

  it("accepts a full tournament day of minutes (regression: 320 was 422'd by the old 0-100 cap)", async () => {
    const res = await handler(
      POST({
        competitionEventId: "ev-1",
        attended: true,
        gamesPlayed: 8,
        avgRpe: 8,
        totalMinutes: 320,
      }),
      {},
    );
    expect(res.statusCode).toBe(201);
    expect(state.rpcArgs.p_total_minutes).toBe(320);
  });

  it("still rejects minutes beyond a plausible tournament day", async () => {
    const res = await handler(
      POST({
        competitionEventId: "ev-1",
        attended: true,
        gamesPlayed: 8,
        totalMinutes: 601,
      }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("folds one/both-ways, players and surface context into the session note", async () => {
    await handler(
      POST({
        competitionEventId: "ev-1",
        attended: true,
        gamesPlayed: 3,
        avgRpe: 7,
        totalMinutes: 166,
        playedBothWays: false,
        playersPresent: 5,
        surface: "turf",
      }),
      {},
    );
    expect(state.rpcArgs.p_notes).toBe("one way · 5 players · turf");
  });
});
