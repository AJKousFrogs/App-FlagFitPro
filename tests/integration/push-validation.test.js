import { beforeEach, describe, expect, it, vi } from "vitest";

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = {};
    this.inFilters = {};
    this.limitValue = null;
  }

  select() {
    return this;
  }

  eq(field, value) {
    this.filters[field] = value;
    return this;
  }

  in(field, values) {
    this.inFilters[field] = values;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  order() {
    return Promise.resolve({ data: [], error: null });
  }

  update() {
    return this;
  }

  upsert() {
    return this;
  }

  single() {
    return Promise.resolve(this.runSingle());
  }

  runSingle() {
    if (this.table === "team_members") {
      if (this.filters.user_id === "sender-coach" && this.filters.status === "active") {
        return { data: { team_id: "team-1", role: "coach" }, error: null };
      }
      if (
        this.filters.user_id === "target-same-team" &&
        this.filters.status === "active" &&
        Array.isArray(this.inFilters.team_id) &&
        this.inFilters.team_id.includes("team-1")
      ) {
        return { data: { user_id: "target-same-team" }, error: null };
      }
      return { data: null, error: { code: "PGRST116" } };
    }

    if (this.table === "user_notification_tokens") {
      return { data: null, error: { code: "PGRST116" } };
    }

    if (this.table === "push_notification_preferences") {
      return { data: { user_id: this.filters.user_id || "user-1" }, error: null };
    }

    return { data: null, error: null };
  }

  then(resolve) {
    if (this.table === "team_members") {
      if (this.filters.user_id === "sender-coach" && this.filters.status === "active") {
        return Promise.resolve(
          resolve({
            data: [{ team_id: "team-1", role: "coach" }],
            error: null,
          }),
        );
      }

      return Promise.resolve(resolve({ data: [], error: null }));
    }

    if (this.table === "user_notification_tokens") {
      return Promise.resolve(resolve({ data: [], error: null }));
    }

    return Promise.resolve(resolve({ data: null, error: null }));
  }
}

const authState = { userId: "user-1" };

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from(table) {
      return new QueryBuilder(table);
    },
  },
}));

describe("push validation and authorization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "user-1";
    const mod = await import("../../netlify/functions/push.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/push/register",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for invalid register payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/push/register",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ device_type: "toaster" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid preferences payload", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/push/preferences",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ unexpected: true }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("blocks send-to-user when caller has no staff role", async () => {
    authState.userId = "sender-player";

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/push/send-to-user",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          targetUserId: "target-same-team",
          title: "Alert",
          body: "Message",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks send-to-user when target is outside sender team", async () => {
    authState.userId = "sender-coach";

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/push/send-to-user",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          targetUserId: "target-other-team",
          title: "Alert",
          body: "Message",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });
});
