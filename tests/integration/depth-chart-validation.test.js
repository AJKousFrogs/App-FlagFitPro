import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  role: "coach",
  state: {
    invalidTeamPlayers: [],
  },
}));

function createFakeSupabase(state) {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
    }

    select() {
      if (this.mode !== "insert" && this.mode !== "update") {
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

    single() {
      return Promise.resolve(this.run(false));
    }

    maybeSingle() {
      return Promise.resolve(this.run(true));
    }

    then(resolve, reject) {
      return Promise.resolve(this.run(false)).then(resolve, reject);
    }

    run(isMaybeSingle) {
      if (this.table === "depth_chart_entries" && this.mode === "select") {
        return {
          data: {
            id: "entry-1",
            template_id: "template-1",
            player_id: "user-1",
            depth_order: 1,
            position_name: "Quarterback",
            depth_chart_templates: { team_id: "team-1" },
          },
          error: null,
        };
      }

      if (this.table === "depth_chart_entries" && this.mode === "update") {
        return { data: { id: "entry-1", ...this.payload }, error: null };
      }

      if (this.table === "team_members" && this.mode === "select" && isMaybeSingle) {
        const userFilter = this.filters.find((f) => f.field === "user_id");
        if (state.invalidTeamPlayers.includes(userFilter?.value)) {
          return { data: null, error: null };
        }
        return { data: { id: "member-1" }, error: null };
      }

      if (this.table === "depth_chart_templates" && this.mode === "insert") {
        return { data: { id: "template-1" }, error: null };
      }

      return { data: null, error: null };
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (...args) => createFakeSupabase(mockCtx.state).from(...args),
  },
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  checkTeamMembership: async () => ({
    authorized: true,
    role: mockCtx.role,
    teamId: "team-1",
  }),
}));

const buildEvent = (path, method, payload = null, queryStringParameters = {}) => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer test-token" },
  body: payload ? JSON.stringify(payload) : null,
  queryStringParameters,
});

const buildRawEvent = (
  path,
  method,
  rawBody,
  queryStringParameters = {},
) => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer test-token" },
  body: rawBody,
  queryStringParameters,
});

describe("depth-chart validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.role = "coach";
    mockCtx.state = {
      invalidTeamPlayers: [],
    };
    const mod = await import("../../netlify/functions/depth-chart.js");
    handler = mod.handler;
  });

  it("rejects assigning non-team players to depth chart entries", async () => {
    mockCtx.state.invalidTeamPlayers = ["user-2"];

    const response = await handler(
      buildEvent("/api/depth-chart/entries/entry-1", "PUT", {
        player_id: "user-2",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid chart_type on template creation", async () => {
    const response = await handler(
      buildEvent("/api/depth-chart/templates", "POST", {
        team_id: "team-1",
        name: "Bad Chart",
        chart_type: "invalid_type",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object JSON payloads for mutations", async () => {
    const response = await handler(
      buildRawEvent("/api/depth-chart/templates", "POST", "null"),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects malformed history limit query with 422", async () => {
    const response = await handler(
      buildEvent(
        "/api/depth-chart/templates/template-1/history",
        "GET",
        null,
        { limit: "10items" },
      ),
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
