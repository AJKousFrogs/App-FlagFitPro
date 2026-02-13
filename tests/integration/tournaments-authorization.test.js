import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "player-1",
  roleByUser: {
    "player-1": "player",
    "coach-1": "coach",
  },
  tournaments: [
    {
      id: "t-team",
      name: "Team Open",
      visibility_scope: "team",
      created_by: "coach-1",
      player_id: null,
      start_date: "2026-03-10",
      end_date: "2026-03-11",
    },
    {
      id: "t-personal-owner",
      name: "Personal Owner",
      visibility_scope: "personal",
      created_by: "player-1",
      player_id: "player-1",
      start_date: "2026-03-12",
      end_date: "2026-03-12",
    },
    {
      id: "t-personal-other",
      name: "Personal Other",
      visibility_scope: "personal",
      created_by: "player-2",
      player_id: "player-2",
      start_date: "2026-03-13",
      end_date: "2026-03-13",
    },
  ],
}));

function createSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
    }

    select() {
      if (this.mode !== "insert" && this.mode !== "update" && this.mode !== "delete") {
        this.mode = "select";
      }
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    delete() {
      this.mode = "delete";
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    gte() {
      return this;
    }

    lte() {
      return this;
    }

    gt() {
      return this;
    }

    lt() {
      return this;
    }

    order() {
      return this;
    }

    maybeSingle() {
      if (this.table === "team_members") {
        const userId = this.filters.find((f) => f.field === "user_id")?.value;
        const role = state.roleByUser[userId];
        return Promise.resolve({ data: role ? { role } : null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    single() {
      if (this.table === "tournaments" && this.mode === "select") {
        const id = this.filters.find((f) => f.field === "id")?.value;
        const tournament = state.tournaments.find((t) => t.id === id);
        if (!tournament) {
          return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        }
        return Promise.resolve({ data: { ...tournament }, error: null });
      }

      if (this.table === "tournaments" && this.mode === "insert") {
        const inserted = { id: "t-new", ...this.payload };
        state.tournaments.push(inserted);
        return Promise.resolve({ data: inserted, error: null });
      }

      if (this.table === "tournaments" && this.mode === "update") {
        const id = this.filters.find((f) => f.field === "id")?.value;
        const idx = state.tournaments.findIndex((t) => t.id === id);
        if (idx === -1) {
          return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        }
        state.tournaments[idx] = { ...state.tournaments[idx], ...this.payload };
        return Promise.resolve({ data: state.tournaments[idx], error: null });
      }

      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      if (this.table === "tournaments" && this.mode === "select") {
        return Promise.resolve({ data: [...state.tournaments], error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "tournaments" && this.mode === "delete") {
        const id = this.filters.find((f) => f.field === "id")?.value;
        state.tournaments = state.tournaments.filter((t) => t.id !== id);
        return Promise.resolve({ error: null }).then(resolve, reject);
      }
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: options.requireAuth ? state.currentUserId : null,
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (...args) => createSupabase().from(...args),
  },
}));

const event = ({ method, qs = {}, body = null } = {}) => ({
  httpMethod: method,
  path: "/.netlify/functions/tournaments",
  headers: { authorization: "Bearer test-token" },
  queryStringParameters: qs,
  body: body ? JSON.stringify(body) : null,
});

describe("tournaments authorization and visibility", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.currentUserId = "player-1";
    state.tournaments = [
      {
        id: "t-team",
        name: "Team Open",
        visibility_scope: "team",
        created_by: "coach-1",
        player_id: null,
        start_date: "2026-03-10",
        end_date: "2026-03-11",
      },
      {
        id: "t-personal-owner",
        name: "Personal Owner",
        visibility_scope: "personal",
        created_by: "player-1",
        player_id: "player-1",
        start_date: "2026-03-12",
        end_date: "2026-03-12",
      },
      {
        id: "t-personal-other",
        name: "Personal Other",
        visibility_scope: "personal",
        created_by: "player-2",
        player_id: "player-2",
        start_date: "2026-03-13",
        end_date: "2026-03-13",
      },
    ];
    const mod = await import("../../netlify/functions/tournaments.js");
    handler = mod.handler;
  });

  it("hides personal tournaments from unauthenticated list GET", async () => {
    const response = await handler(event({ method: "GET" }), {});
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.tournaments.map((t) => t.id)).toEqual(["t-team"]);
  });

  it("blocks player-owner updates to team tournaments", async () => {
    const response = await handler(
      event({
        method: "PUT",
        qs: { id: "t-team" },
        body: { name: "Renamed By Player" },
      }),
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("blocks player-owner deletes of team tournaments", async () => {
    state.tournaments[0] = {
      ...state.tournaments[0],
      player_id: "player-1",
    };
    const response = await handler(
      event({
        method: "DELETE",
        qs: { id: "t-team" },
      }),
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("returns 201 for tournament creation", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(
      event({
        method: "POST",
        body: {
          name: "Created Tournament",
          start_date: "2026-04-01",
        },
      }),
      {},
    );
    expect(response.statusCode).toBe(201);
  });

  it("accepts startDate camelCase on tournament creation", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(
      event({
        method: "POST",
        body: {
          name: "Camel Case Tournament",
          startDate: "2026-04-02",
        },
      }),
      {},
    );
    expect(response.statusCode).toBe(201);
  });

  it("rejects invalid visibility scope values with validation error", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(
      event({
        method: "POST",
        body: {
          name: "Bad Scope Tournament",
          start_date: "2026-04-03",
          visibility_scope: "global",
        },
      }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid year query param with 422", async () => {
    const response = await handler(
      event({
        method: "GET",
        qs: { year: "20xx" },
      }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid status query param with 422", async () => {
    const response = await handler(
      event({
        method: "GET",
        qs: { status: "paused" },
      }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects update when end_date is before start_date with 422", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(
      event({
        method: "PUT",
        qs: { id: "t-team" },
        body: {
          start_date: "2026-04-10",
          end_date: "2026-04-01",
        },
      }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid calendar dates on create with 422", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(
      event({
        method: "POST",
        body: {
          name: "Bad Date Tournament",
          start_date: "2026-02-30",
        },
      }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object JSON payloads on create with 422", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/tournaments",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "null",
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });
});
