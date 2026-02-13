import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "player-1",
  roleByUser: {
    "player-1": "player",
    "coach-1": "coach",
  },
  events: [
    {
      id: "evt-1",
      name: "Local Cup",
      created_by: "player-1",
      is_national_team_event: false,
      start_date: "2026-04-01",
      end_date: "2026-04-02",
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
      if (this.table === "tournament_calendar" && this.mode === "select") {
        const id = this.filters.find((f) => f.field === "id")?.value;
        const found = state.events.find((e) => e.id === id);
        if (!found) {
          return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        }
        return Promise.resolve({ data: found, error: null });
      }
      if (this.table === "tournament_calendar" && this.mode === "insert") {
        const inserted = { id: "evt-new", ...this.payload };
        state.events.push(inserted);
        return Promise.resolve({ data: inserted, error: null });
      }
      if (this.table === "tournament_calendar" && this.mode === "update") {
        const id = this.filters.find((f) => f.field === "id")?.value;
        const idx = state.events.findIndex((e) => e.id === id);
        if (idx === -1) {
          return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        }
        state.events[idx] = { ...state.events[idx], ...this.payload };
        return Promise.resolve({ data: state.events[idx], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      if (this.table === "tournament_calendar" && this.mode === "select") {
        return Promise.resolve({ data: [...state.events], error: null }).then(
          resolve,
          reject,
        );
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
    options.handler(event, context, { userId: state.currentUserId }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (...args) => createSupabase().from(...args),
  },
}));

const event = ({ path = "/.netlify/functions/tournament-calendar", body = null, method = "POST" } = {}) => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer test-token" },
  body: body ? JSON.stringify(body) : null,
  queryStringParameters: {},
});

describe("tournament-calendar authorization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.currentUserId = "player-1";
    state.events = [
      {
        id: "evt-1",
        name: "Local Cup",
        created_by: "player-1",
        is_national_team_event: false,
        start_date: "2026-04-01",
        end_date: "2026-04-02",
      },
    ];
    const mod = await import("../../netlify/functions/tournament-calendar.js");
    handler = mod.handler;
  });

  it("blocks players from creating national team events", async () => {
    const response = await handler(
      event({
        body: {
          name: "National Event",
          startDate: "2026-05-01",
          endDate: "2026-05-02",
          isNationalTeamEvent: true,
        },
      }),
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks players from toggling national team event status on update", async () => {
    const response = await handler(
      event({
        body: {
          id: "evt-1",
          name: "Local Cup Updated",
          startDate: "2026-04-01",
          endDate: "2026-04-02",
          isNationalTeamEvent: true,
        },
      }),
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("allows coaches to create national team events", async () => {
    state.currentUserId = "coach-1";

    const response = await handler(
      event({
        body: {
          name: "Coach National Event",
          startDate: "2026-06-01",
          endDate: "2026-06-03",
          isNationalTeamEvent: true,
        },
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
  });

  it("returns 404 when deleting a non-existent tournament", async () => {
    state.currentUserId = "coach-1";

    const response = await handler(
      event({
        path: "/.netlify/functions/tournament-calendar/delete",
        body: {
          id: "evt-missing",
        },
      }),
      {},
    );

    expect(response.statusCode).toBe(404);
  });
});
