import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  roleAuthorized: true,
  role: "coach",
  teamMembers: [{ team_id: "team-1" }],
  sessions: [{ id: "session-1", user_id: "athlete-1", team_id: "team-1" }],
  messages: [
    {
      id: "msg-1",
      role: "assistant",
      risk_level: "high",
      citations: [],
      metadata: { source: "fallback" },
    },
  ],
  recommendations: [{ id: "rec-1", status: "accepted", created_at: "2026-02-20" }],
  kb: [{ id: "kb-1", entry_type: "training_method" }],
};

class Query {
  constructor(table) {
    this.table = table;
  }
  select() {
    return this;
  }
  eq() {
    return this;
  }
  in() {
    return this;
  }
  gte() {
    return this;
  }
  then(resolve) {
    if (this.table === "team_members") {
      resolve({ data: state.teamMembers, error: null });
      return;
    }
    if (this.table === "ai_chat_sessions") {
      resolve({ data: state.sessions, error: null });
      return;
    }
    if (this.table === "ai_messages") {
      resolve({ data: state.messages, error: null });
      return;
    }
    if (this.table === "ai_recommendations") {
      resolve({ data: state.recommendations, error: null });
      return;
    }
    if (this.table === "knowledge_base_entries") {
      resolve({ data: state.kb, error: null });
      return;
    }
    resolve({ data: [], error: null });
  }
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  requireRole: async () => ({
    authorized: state.roleAuthorized,
    role: state.role,
  }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from(table) {
      return new Query(table);
    },
  },
}));

describe("ai-telemetry validation", () => {
  beforeEach(() => {
    state.roleAuthorized = true;
    state.role = "coach";
    state.teamMembers = [{ team_id: "team-1" }];
    state.sessions = [{ id: "session-1", user_id: "athlete-1", team_id: "team-1" }];
    state.messages = [
      {
        id: "msg-1",
        role: "assistant",
        risk_level: "high",
        citations: [],
        metadata: { source: "fallback" },
      },
    ];
    state.recommendations = [
      { id: "rec-1", status: "accepted", created_at: "2026-02-20" },
    ];
    state.kb = [{ id: "kb-1", entry_type: "training_method" }];
  });

  it("returns 403 when caller is not coach/admin", async () => {
    state.roleAuthorized = false;

    const { handler } = await import("../../netlify/functions/ai-telemetry.js");
    const response = await handler({ httpMethod: "GET", queryStringParameters: {} }, {});

    expect(response.statusCode).toBe(403);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("authorization_error");
  });

  it("returns 422 for invalid days query", async () => {
    const { handler } = await import("../../netlify/functions/ai-telemetry.js");
    const response = await handler(
      {
        httpMethod: "GET",
        queryStringParameters: { days: "abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns telemetry summary payload for authorized coach", async () => {
    const { handler } = await import("../../netlify/functions/ai-telemetry.js");
    const response = await handler(
      {
        httpMethod: "GET",
        queryStringParameters: { days: "30" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.sessions.total).toBe(1);
    expect(payload.data.messages.assistant).toBe(1);
    expect(payload.data.messages.risk.high).toBe(1);
    expect(payload.data.knowledge_base.total_entries).toBe(1);
  });
});
