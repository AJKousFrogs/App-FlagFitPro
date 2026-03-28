import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "player-1",
  memberships: [
    {
      user_id: "player-1",
      team_id: "team-1",
      role: "player",
      status: "active",
      updated_at: "2026-03-20T10:00:00.000Z",
    },
    {
      user_id: "coach-1",
      team_id: "team-1",
      role: "coach",
      status: "active",
      updated_at: "2026-03-20T10:00:00.000Z",
    },
    {
      user_id: "player-2",
      team_id: "team-1",
      role: "player",
      status: "active",
      updated_at: "2026-03-20T10:00:00.000Z",
    },
    {
      user_id: "player-3",
      team_id: "team-2",
      role: "player",
      status: "active",
      updated_at: "2026-03-20T10:00:00.000Z",
    },
  ],
  tournaments: [
    {
      id: "t-team",
      team_id: "team-1",
      name: "Team Open",
      visibility_scope: "team",
      created_by: "coach-1",
      player_id: null,
      start_date: "2026-03-10",
      end_date: "2026-03-11",
    },
    {
      id: "t-personal-owner",
      team_id: "team-1",
      name: "Personal Owner",
      visibility_scope: "personal",
      created_by: "player-1",
      player_id: "player-1",
      start_date: "2026-03-12",
      end_date: "2026-03-12",
    },
    {
      id: "t-personal-other",
      team_id: "team-1",
      name: "Personal Other",
      visibility_scope: "personal",
      created_by: "player-2",
      player_id: "player-2",
      start_date: "2026-03-13",
      end_date: "2026-03-13",
    },
    {
      id: "t-other-team",
      team_id: "team-2",
      name: "Other Team Open",
      visibility_scope: "team",
      created_by: "player-3",
      player_id: null,
      start_date: "2026-03-14",
      end_date: "2026-03-14",
    },
  ],
}));

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    filters.every((filter) => {
      const value = row[filter.field];

      switch (filter.operator) {
        case "eq":
          return value === filter.value;
        case "in":
          return filter.value.includes(value);
        case "gte":
          return value >= filter.value;
        case "lte":
          return value <= filter.value;
        case "gt":
          return value > filter.value;
        case "lt":
          return value < filter.value;
        default:
          return true;
      }
    }),
  );
}

function createSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
      this.limitCount = null;
      this.orderField = null;
      this.orderAscending = true;
    }

    select() {
      if (
        this.mode !== "insert" &&
        this.mode !== "update" &&
        this.mode !== "delete"
      ) {
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
      this.filters.push({ operator: "eq", field, value });
      return this;
    }

    in(field, value) {
      this.filters.push({ operator: "in", field, value });
      return this;
    }

    gte(field, value) {
      this.filters.push({ operator: "gte", field, value });
      return this;
    }

    lte(field, value) {
      this.filters.push({ operator: "lte", field, value });
      return this;
    }

    gt(field, value) {
      this.filters.push({ operator: "gt", field, value });
      return this;
    }

    lt(field, value) {
      this.filters.push({ operator: "lt", field, value });
      return this;
    }

    order(field, options = {}) {
      this.orderField = field;
      this.orderAscending = options.ascending !== false;
      return this;
    }

    limit(count) {
      this.limitCount = count;
      return this;
    }

    getRows() {
      if (this.table === "team_members") {
        let rows = applyFilters(state.memberships, this.filters);
        if (this.orderField) {
          rows = [...rows].sort((left, right) => {
            const leftValue = left[this.orderField];
            const rightValue = right[this.orderField];
            if (leftValue === rightValue) {
              return 0;
            }
            return this.orderAscending
              ? leftValue > rightValue
                ? 1
                : -1
              : leftValue < rightValue
                ? 1
                : -1;
          });
        }
        if (typeof this.limitCount === "number") {
          rows = rows.slice(0, this.limitCount);
        }
        return rows;
      }

      if (this.table === "tournaments") {
        let rows = applyFilters(state.tournaments, this.filters);
        if (this.orderField) {
          rows = [...rows].sort((left, right) => {
            const leftValue = left[this.orderField];
            const rightValue = right[this.orderField];
            if (leftValue === rightValue) {
              return 0;
            }
            return this.orderAscending
              ? leftValue > rightValue
                ? 1
                : -1
              : leftValue < rightValue
                ? 1
                : -1;
          });
        }
        return rows;
      }

      return [];
    }

    maybeSingle() {
      if (this.mode === "select") {
        const rows = this.getRows();
        return Promise.resolve({ data: rows[0] || null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    single() {
      if (this.table === "tournaments" && this.mode === "select") {
        const rows = this.getRows();
        const tournament = rows[0];
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
        const id = this.filters.find((filter) => filter.field === "id")?.value;
        const idx = state.tournaments.findIndex((tournament) => tournament.id === id);
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
        return Promise.resolve({ data: [...this.getRows()], error: null }).then(
          resolve,
          reject,
        );
      }

      if (this.table === "team_members" && this.mode === "select") {
        return Promise.resolve({ data: [...this.getRows()], error: null }).then(
          resolve,
          reject,
        );
      }

      if (this.table === "tournaments" && this.mode === "delete") {
        const id = this.filters.find((filter) => filter.field === "id")?.value;
        state.tournaments = state.tournaments.filter(
          (tournament) => tournament.id !== id,
        );
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
  baseHandler: async (event, context, options) => {
    if (options.requireAuth && !state.currentUserId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: {
            code: "authentication_error",
            message: "Authentication required",
          },
        }),
      };
    }

    return options.handler(event, context, {
      userId: options.requireAuth ? state.currentUserId : null,
      requestId: "req-test",
    });
  },
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
    state.memberships = [
      {
        user_id: "player-1",
        team_id: "team-1",
        role: "player",
        status: "active",
        updated_at: "2026-03-20T10:00:00.000Z",
      },
      {
        user_id: "coach-1",
        team_id: "team-1",
        role: "coach",
        status: "active",
        updated_at: "2026-03-20T10:00:00.000Z",
      },
      {
        user_id: "player-2",
        team_id: "team-1",
        role: "player",
        status: "active",
        updated_at: "2026-03-20T10:00:00.000Z",
      },
      {
        user_id: "player-3",
        team_id: "team-2",
        role: "player",
        status: "active",
        updated_at: "2026-03-20T10:00:00.000Z",
      },
    ];
    state.tournaments = [
      {
        id: "t-team",
        team_id: "team-1",
        name: "Team Open",
        visibility_scope: "team",
        created_by: "coach-1",
        player_id: null,
        start_date: "2026-03-10",
        end_date: "2026-03-11",
      },
      {
        id: "t-personal-owner",
        team_id: "team-1",
        name: "Personal Owner",
        visibility_scope: "personal",
        created_by: "player-1",
        player_id: "player-1",
        start_date: "2026-03-12",
        end_date: "2026-03-12",
      },
      {
        id: "t-personal-other",
        team_id: "team-1",
        name: "Personal Other",
        visibility_scope: "personal",
        created_by: "player-2",
        player_id: "player-2",
        start_date: "2026-03-13",
        end_date: "2026-03-13",
      },
      {
        id: "t-other-team",
        team_id: "team-2",
        name: "Other Team Open",
        visibility_scope: "team",
        created_by: "player-3",
        player_id: null,
        start_date: "2026-03-14",
        end_date: "2026-03-14",
      },
    ];
    const { handler: importedHandler } = await import(
      "../../netlify/functions/tournaments.js"
    );
    handler = importedHandler;
  });

  it("requires authentication for tournament listing", async () => {
    state.currentUserId = null;
    const response = await handler(event({ method: "GET" }), {});
    expect(response.statusCode).toBe(401);
  });

  it("scopes player tournament listing to their team and personal tournaments", async () => {
    const response = await handler(event({ method: "GET" }), {});
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.tournaments.map((tournament) => tournament.id)).toEqual([
      "t-team",
      "t-personal-owner",
    ]);
  });

  it("allows coaches to see personal tournaments for their team", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(event({ method: "GET" }), {});
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.tournaments.map((tournament) => tournament.id)).toEqual([
      "t-team",
      "t-personal-owner",
      "t-personal-other",
    ]);
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

  it("returns 201 for tournament creation and assigns the creator team", async () => {
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
    const payload = JSON.parse(response.body);
    expect(payload.data.tournament.team_id).toBe("team-1");
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

  it("rejects personal tournament assignment to a player outside the team", async () => {
    state.currentUserId = "coach-1";
    const response = await handler(
      event({
        method: "POST",
        body: {
          name: "Bad Assignment Tournament",
          start_date: "2026-04-03",
          visibility_scope: "personal",
          player_id: "player-3",
        },
      }),
      {},
    );
    expect(response.statusCode).toBe(422);
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
