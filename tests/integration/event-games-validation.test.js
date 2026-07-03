import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  event: { id: "ev-1", team_id: "team-1" },
  existingGame: { id: "game-1", team_id: "team-1" },
  insertedRows: null,
  isStaff: true,
  isMember: true,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/team-scope.js", () => ({
  isStaffOfTeam: async () => state.isStaff,
  isActiveTeamMember: async () => state.isMember,
}));

function competitionEventsTable() {
  const q = {
    select: () => q,
    eq: () => q,
    maybeSingle: () => Promise.resolve({ data: state.event, error: null }),
  };
  return q;
}

function eventGamesTable() {
  const q = {
    select: () => q,
    eq: () => q,
    order: () => Promise.resolve({ data: [{ id: "g-1", competition_event_id: "ev-1", game_number: 1, team_id: "team-1" }], error: null }),
    maybeSingle: () => Promise.resolve({ data: state.existingGame, error: null }),
    insert: (rows) => {
      state.insertedRows = Array.isArray(rows) ? rows : [rows];
      return q;
    },
    update: (row) => {
      state.insertedRows = [{ ...state.existingGame, ...row }];
      return q;
    },
    delete: () => q,
    single: () =>
      Promise.resolve({
        data: { id: "g-new", ...(state.insertedRows?.[0] ?? {}) },
        error: null,
      }),
    then: (resolve) =>
      resolve({
        data: (state.insertedRows ?? []).map((r, i) => ({ id: `g-${i}`, ...r })),
        error: null,
      }),
  };
  return q;
}

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => (table === "competition_events" ? competitionEventsTable() : eventGamesTable()),
  },
}));

const req = (method, body, path = "/.netlify/functions/event-games") => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer t" },
  queryStringParameters: {},
  body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
});

describe("event-games validation", () => {
  let handler;
  beforeEach(async () => {
    vi.resetModules();
    state.isStaff = true;
    state.isMember = true;
    state.insertedRows = null;
    ({ handler } = await import("../../netlify/functions/event-games.js"));
  });

  it("GET without competitionEventId returns 400", async () => {
    const res = await handler(req("GET"), {});
    expect(res.statusCode).toBe(400);
  });

  it("GET lists games for an event the caller belongs to", async () => {
    const res = await handler(
      { ...req("GET"), queryStringParameters: { competitionEventId: "ev-1" } },
      {},
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.games).toHaveLength(1);
  });

  it("GET returns 403 for a non-team-member", async () => {
    state.isMember = false;
    const res = await handler(
      { ...req("GET"), queryStringParameters: { competitionEventId: "ev-1" } },
      {},
    );
    expect(res.statusCode).toBe(403);
  });

  it("returns 422 for malformed JSON on POST", async () => {
    const res = await handler(req("POST", "{"), {});
    expect(res.statusCode).toBe(422);
  });

  it("POST without competitionEventId returns 400", async () => {
    const res = await handler(req("POST", { gameNumber: 1, gameDate: "2026-07-04", kickoffTime: "11:00" }), {});
    expect(res.statusCode).toBe(400);
  });

  it("POST rejects a malformed kickoffTime", async () => {
    const res = await handler(
      req("POST", {
        competitionEventId: "ev-1",
        gameNumber: 1,
        gameDate: "2026-07-04",
        kickoffTime: "11am",
      }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("POST rejects when the caller isn't staff", async () => {
    state.isStaff = false;
    const res = await handler(
      req("POST", {
        competitionEventId: "ev-1",
        gameNumber: 1,
        gameDate: "2026-07-04",
        kickoffTime: "11:00",
      }),
      {},
    );
    expect(res.statusCode).toBe(403);
  });

  it("POST creates a game with a valid payload", async () => {
    const res = await handler(
      req("POST", {
        competitionEventId: "ev-1",
        gameNumber: 1,
        gameDate: "2026-07-04",
        kickoffTime: "11:00",
      }),
      {},
    );
    expect(res.statusCode).toBe(201);
  });

  it("POST /bulk replaces the day's game list from a kickoff-time array", async () => {
    const res = await handler(
      req(
        "POST",
        {
          competitionEventId: "ev-1",
          games: [
            { gameDate: "2026-07-04", kickoffTime: "11:00" },
            { gameDate: "2026-07-04", kickoffTime: "12:30" },
            { gameDate: "2026-07-04", kickoffTime: "15:30" },
            { gameDate: "2026-07-04", kickoffTime: "17:00" },
          ],
        },
        "/.netlify/functions/event-games/bulk",
      ),
      {},
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.games).toHaveLength(4);
  });

  it("POST /bulk rejects an empty games array", async () => {
    const res = await handler(
      req(
        "POST",
        { competitionEventId: "ev-1", games: [] },
        "/.netlify/functions/event-games/bulk",
      ),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("DELETE without an id returns 400", async () => {
    const res = await handler(req("DELETE"), {});
    expect(res.statusCode).toBe(400);
  });

  it("DELETE rejects when the caller isn't staff", async () => {
    state.isStaff = false;
    const res = await handler(req("DELETE", undefined, "/.netlify/functions/event-games/game-1"), {});
    expect(res.statusCode).toBe(403);
  });

  it("DELETE removes a game the caller staffs", async () => {
    const res = await handler(req("DELETE", undefined, "/.netlify/functions/event-games/game-1"), {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.deleted).toBe(true);
  });

  it("PATCH updates a game the caller staffs", async () => {
    const res = await handler(
      req("PATCH", { kickoffTime: "11:30" }, "/.netlify/functions/event-games/game-1"),
      {},
    );
    expect(res.statusCode).toBe(200);
  });
});
