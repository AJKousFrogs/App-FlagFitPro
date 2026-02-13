import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "coach-1",
  duplicateOnInsert: false,
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
      if (this.mode !== "insert") {
        this.mode = "select";
      }
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    limit() {
      return this;
    }

    maybeSingle() {
      if (this.table === "team_members") {
        return Promise.resolve({ data: { role: "coach" }, error: null });
      }

      if (this.table === "game_officials" && this.mode === "select") {
        return Promise.resolve({ data: null, error: { code: "PGRST116" } });
      }

      return Promise.resolve({ data: null, error: null });
    }

    single() {
      if (this.table === "game_officials" && this.mode === "insert") {
        if (state.duplicateOnInsert) {
          return Promise.resolve({ data: null, error: { code: "23505" } });
        }
        return Promise.resolve({
          data: { id: "asg-1", ...this.payload },
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
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (...args) => createSupabase().from(...args),
  },
}));

const buildEvent = (payload) => ({
  httpMethod: "POST",
  path: "/.netlify/functions/officials/schedule",
  headers: { authorization: "Bearer test-token" },
  body: JSON.stringify(payload),
  queryStringParameters: {},
});

describe("officials scheduling conflicts", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.currentUserId = "coach-1";
    state.duplicateOnInsert = false;
    const mod = await import("../../netlify/functions/officials.js");
    handler = mod.handler;
  });

  it("returns 409 when insert hits unique-constraint duplicate", async () => {
    state.duplicateOnInsert = true;

    const response = await handler(
      buildEvent({
        game_id: "game-1",
        official_id: "off-1",
        role: "head_referee",
      }),
      {},
    );

    expect(response.statusCode).toBe(409);
  });
});
