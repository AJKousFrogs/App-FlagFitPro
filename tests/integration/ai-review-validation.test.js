import { beforeEach, describe, expect, it, vi } from "vitest";

let currentAuthUser = { role: "player", metadata: { role: "player" } };

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = {};
      this.payload = null;
    }
    select() {
      this.mode = "select";
      return this;
    }
    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }
    eq(field, value) {
      this.filters[field] = value;
      return this;
    }
    is() {
      return this;
    }
    not() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    insert() {
      this.mode = "insert";
      return this;
    }
    single() {
      return Promise.resolve(this.run());
    }
    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }
    run() {
      if (this.table === "ai_coach_interactions" && this.mode === "select") {
        return {
          data: { id: this.filters.id, user_id: "other-user" },
          error: null,
        };
      }
      if (this.table === "ai_coach_interactions" && this.mode === "update") {
        return {
          data: { id: this.filters.id, ...this.payload },
          error: null,
        };
      }
      if (this.table === "privacy_audit_log") {
        return { data: { id: "audit-1" }, error: null };
      }
      return { data: [], error: null };
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
      userId: "user-1",
      authUser: currentAuthUser,
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("ai-review validation and authorization", () => {
  let handler;

  beforeEach(async () => {
    currentAuthUser = { role: "player", metadata: { role: "player" } };
    vi.resetModules();
    const mod = await import("../../netlify/functions/ai-review.js");
    handler = mod.handler;
  });

  it("blocks flagging interactions owned by another user", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-review/flag",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          interactionId: "interaction-1",
          reason: "needs review",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("rejects invalid submit outcome with 422", async () => {
    currentAuthUser = { role: "reviewer", metadata: { role: "reviewer" } };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-review/submit",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          interactionId: "interaction-1",
          outcome: "invalid",
          reviewNotes: "note",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects malformed queue limit with 422", async () => {
    currentAuthUser = { role: "reviewer", metadata: { role: "reviewer" } };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/ai-review/queue",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "10items" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects malformed history limit with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/ai-review/history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "20rows" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
