import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "coach-1",
  lastUpdatePayload: null,
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
      if (this.mode !== "update" && this.mode !== "insert") {
        this.mode = "select";
      }
      return this;
    }

    in() {
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
      state.lastUpdatePayload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    limit() {
      return this;
    }

    order() {
      return this;
    }

    single() {
      if (this.table === "team_members") {
        return Promise.resolve({
          data: { role: "coach", team_id: "team-1" },
          error: null,
        });
      }
      if (this.table === "scouting_reports" && this.mode === "update") {
        return Promise.resolve({
          data: { id: "rep-1", team_id: "team-1", ...this.payload },
          error: null,
        });
      }
      if (this.table === "scouting_reports" && this.mode === "insert") {
        return Promise.resolve({
          data: { id: "rep-new", team_id: "team-1", ...this.payload },
          error: null,
        });
      }
      if (this.table === "scouting_reports" && this.mode === "select") {
        return Promise.resolve({
          data: {
            id: "rep-1",
            team_id: "team-1",
            opponent_name: "Rivals",
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
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

const event = ({ method, path, body }) => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer test-token" },
  queryStringParameters: {},
  body,
});

describe("scouting validation and update hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.lastUpdatePayload = null;
    ({ handler } = await import("../../netlify/functions/scouting.js"));
  });

  it("returns 400 invalid_json for invalid JSON body", async () => {
    const response = await handler(
      event({
        method: "POST",
        path: "/.netlify/functions/scouting/reports",
        body: "{invalid",
      }),
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      event({
        method: "POST",
        path: "/.netlify/functions/scouting/reports",
        body: "null",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("ignores forbidden update fields like team_id and created_by", async () => {
    const response = await handler(
      event({
        method: "PUT",
        path: "/.netlify/functions/scouting/reports/rep-1",
        body: JSON.stringify({
          opponent_name: "Updated Name",
          team_id: "team-999",
          created_by: "attacker",
          offensive_notes: "Updated notes",
        }),
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.lastUpdatePayload).toBeTruthy();
    expect(state.lastUpdatePayload.team_id).toBeUndefined();
    expect(state.lastUpdatePayload.created_by).toBeUndefined();
    expect(state.lastUpdatePayload.offensive_notes).toBe("Updated notes");
  });

  it("returns 422 for malformed reports limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/scouting/reports",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "50items" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when update payload has no allowed fields", async () => {
    const response = await handler(
      event({
        method: "PUT",
        path: "/.netlify/functions/scouting/reports/rep-1",
        body: JSON.stringify({
          team_id: "team-999",
          created_by: "attacker",
        }),
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
