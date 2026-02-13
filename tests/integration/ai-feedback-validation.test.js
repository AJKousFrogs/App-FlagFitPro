import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  messageOwned: true,
}));

function createSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
    }
    select() {
      return this;
    }
    eq() {
      return this;
    }
    maybeSingle() {
      if (this.table === "ai_messages") {
        return Promise.resolve({
          data: state.messageOwned ? { id: "msg-1", user_id: "user-1" } : null,
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }
    single() {
      if (this.table === "ai_feedback" && this.mode === "insert") {
        return Promise.resolve({
          data: { id: "fb-1" },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { code: "PGRST116" } });
    }
    insert() {
      this.mode = "insert";
      return this;
    }
    update() {
      this.mode = "update";
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
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
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createSupabase(),
}));

describe("ai-feedback validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    state.messageOwned = true;
  });

  it("returns 422 for non-object JSON payload", async () => {
    const { handler } = await import("../../netlify/functions/ai-feedback.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-feedback",
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for invalid message_id type", async () => {
    const { handler } = await import("../../netlify/functions/ai-feedback.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-feedback",
        body: JSON.stringify({ message_id: 123, feedback_type: "helpful" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 403 when feedback target message is not owned by caller", async () => {
    state.messageOwned = false;
    const { handler } = await import("../../netlify/functions/ai-feedback.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-feedback",
        body: JSON.stringify({ message_id: "msg-1", feedback_type: "helpful" }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("authorization_error");
  });
});
