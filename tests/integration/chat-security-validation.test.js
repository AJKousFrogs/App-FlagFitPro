import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  allowChannelAccess: false,
  messagesErrorMessage: null,
}));

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = {};
    }
    select() {
      return this;
    }
    eq(field, value) {
      this.filters[field] = value;
      return this;
    }
    is() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    then(resolve, reject) {
      return Promise.resolve(this.runList()).then(resolve, reject);
    }
    single() {
      return Promise.resolve(this.run());
    }
    upsert() {
      return Promise.resolve({ error: null });
    }
    run() {
      if (this.table === "channels") {
        return {
          data: { id: this.filters.id, team_id: "team-1", channel_type: "direct_message" },
          error: null,
        };
      }
      if (this.table === "channel_members") {
        if (state.allowChannelAccess) {
          return { data: { id: "member-1", can_post: true }, error: null };
        }
        return { data: null, error: { code: "PGRST116" } };
      }
      return { data: null, error: null };
    }

    runList() {
      if (this.table === "chat_messages") {
        if (state.messagesErrorMessage) {
          return { data: null, error: { message: state.messagesErrorMessage } };
        }
        return { data: [], error: null };
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
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("chat security validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.allowChannelAccess = false;
    state.messagesErrorMessage = null;
    const mod = await import("../../netlify/functions/chat.js");
    handler = mod.handler;
  });

  it("blocks mark-read for channels the user cannot access", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/chat/channels/channel-2/read",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for malformed messages limit query", async () => {
    state.allowChannelAccess = true;

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/chat/channels/channel-2/messages",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "10rows" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 400 for invalid JSON payload on create channel", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/chat/channels",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON payload on create channel", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/chat/channels",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when messages query fails unexpectedly", async () => {
    state.allowChannelAccess = true;
    state.messagesErrorMessage = "sensitive query planner detail";

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/chat/channels/channel-2/messages",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: null,
      },
      {},
    );

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(body.error?.message).toBe("Internal server error");
    expect(body.error?.code).toBe("chat_error");
    expect(response.body).not.toContain("sensitive query planner detail");
  });
});
