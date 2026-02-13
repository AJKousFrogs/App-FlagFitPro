import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "coach-1",
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

    upsert(payload) {
      this.mode = "upsert";
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
      return Promise.resolve({ data: null, error: null });
    }

    single() {
      if (this.table === "officials" && this.mode === "insert") {
        return Promise.resolve({ data: { id: "off-1", ...this.payload }, error: null });
      }
      if (this.table === "game_officials" && this.mode === "insert") {
        return Promise.resolve({ data: { id: "asg-1", ...this.payload }, error: null });
      }
      if (this.table === "official_availability" && this.mode === "upsert") {
        return Promise.resolve({ data: { id: "avail-1", ...this.payload }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      if (this.table === "team_members") {
        return Promise.resolve({ data: [{ role: "coach" }], error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "game_officials" && this.mode === "select") {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
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
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (...args) => createSupabase().from(...args),
  },
}));

const buildEvent = (method, path, body) => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer test-token" },
  body: body ? JSON.stringify(body) : null,
  queryStringParameters: {},
});

describe("officials POST status codes", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/officials.js");
    handler = mod.handler;
  });

  it("returns 201 for creating an official", async () => {
    const response = await handler(
      buildEvent("POST", "/.netlify/functions/officials", {
        name: "Ref One",
        email: "ref@example.com",
      }),
      {},
    );

    expect(response.statusCode).toBe(201);
  });

  it("returns 201 for scheduling an official", async () => {
    const response = await handler(
      buildEvent("POST", "/.netlify/functions/officials/schedule", {
        game_id: "game-1",
        official_id: "off-1",
        role: "head_referee",
      }),
      {},
    );

    expect(response.statusCode).toBe(201);
  });

  it("returns 422 for invalid schedule role payload", async () => {
    const response = await handler(
      buildEvent("POST", "/.netlify/functions/officials/schedule", {
        game_id: "game-1",
        official_id: "off-1",
        role: "not_a_real_role",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 201 for setting official availability", async () => {
    const response = await handler(
      buildEvent("POST", "/.netlify/functions/officials/off-1/availability", {
        date: "2026-03-01",
        is_available: true,
      }),
      {},
    );

    expect(response.statusCode).toBe(201);
  });

  it("returns 400 for invalid JSON payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/officials/schedule",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/officials/schedule",
        headers: { authorization: "Bearer test-token" },
        body: "null",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when available endpoint is missing required date", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/officials/available",
        headers: { authorization: "Bearer test-token" },
        body: null,
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for non-boolean is_available in availability payload", async () => {
    const response = await handler(
      buildEvent("POST", "/.netlify/functions/officials/off-1/availability", {
        date: "2026-03-01",
        is_available: "yes",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
