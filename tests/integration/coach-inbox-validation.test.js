import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  itemExists: false,
}));

function createFakeSupabase() {
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

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    in() {
      return this;
    }

    order() {
      return this;
    }

    range() {
      return this;
    }

    maybeSingle() {
      return Promise.resolve(this.run(true));
    }

    single() {
      return Promise.resolve(this.run(false));
    }

    then(resolve, reject) {
      return Promise.resolve(this.run(false)).then(resolve, reject);
    }

    run(isMaybeSingle) {
      if (this.table === "team_members" && this.mode === "select") {
        return {
          data: [{ team_id: "team-1", role: "coach" }],
          error: null,
        };
      }

      if (this.table === "coach_inbox_items" && this.mode === "update" && isMaybeSingle) {
        if (!mockCtx.itemExists) {
          return { data: null, error: null };
        }
        return { data: { id: "item-1", ...this.payload }, error: null };
      }

      if (this.table === "coach_inbox_items" && this.mode === "select") {
        return { data: [], error: null };
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
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createFakeSupabase(),
}));

describe("coach-inbox validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.itemExists = false;
    const mod = await import("../../netlify/functions/coach-inbox.js");
    handler = mod.handler;
  });

  it("returns 404 when mark-viewed targets a missing inbox item", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach-inbox/item-1/mark-viewed",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(404);
  });

  it("rejects invalid inbox_type filters with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach-inbox",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { inbox_type: "unknown" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects inconsistent approve action/status combination with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/coach-inbox/item-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ action: "approve", status: "viewed" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects empty patch payloads with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/coach-inbox/item-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({}),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid list pagination with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach-inbox",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "x", offset: "5" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
