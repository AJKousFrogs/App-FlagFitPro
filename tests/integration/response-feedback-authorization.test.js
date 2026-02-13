import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  messageOwnerId: "athlete-2",
  requesterTeams: [],
  athleteTeams: [{ team_id: "team-2" }],
  coachMembershipExists: false,
  messageMissing: false,
  feedbackQueryErrorMessage: null,
}));

function createSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = "select";
    }

    select() {
      return this;
    }

    insert() {
      this.mode = "insert";
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

    gte() {
      return this;
    }

    lte() {
      return this;
    }

    maybeSingle() {
      if (this.table === "team_members") {
        const teamId = this.filters.find((f) => f.field === "team_id")?.value;
        if (teamId) {
          return Promise.resolve({
            data: state.coachMembershipExists ? { team_id: teamId } : null,
            error: null,
          });
        }
      }
      return Promise.resolve({ data: null, error: null });
    }

    single() {
      if (this.table === "ai_messages") {
        if (state.messageMissing) {
          return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        }
        return Promise.resolve({
          data: {
            id: "msg-1",
            user_id: state.messageOwnerId,
            risk_level: "low",
            intent_type: "general",
            classification_confidence: 0.9,
            session_id: "sess-1",
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      if (this.table === "team_members") {
        const userId = this.filters.find((f) => f.field === "user_id")?.value;
        if (userId === "user-1") {
          return Promise.resolve({ data: state.requesterTeams, error: null }).then(
            resolve,
            reject,
          );
        }
        if (userId === state.messageOwnerId) {
          return Promise.resolve({ data: state.athleteTeams, error: null }).then(
            resolve,
            reject,
          );
        }
      }
      if (this.table === "ai_response_feedback") {
        if (state.feedbackQueryErrorMessage) {
          return Promise.resolve({
            data: null,
            error: { message: state.feedbackQueryErrorMessage },
          }).then(resolve, reject);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve, reject);
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
    rpc: async () => ({ data: null, error: null }),
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createSupabase(),
}));

describe("response-feedback authorization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.messageOwnerId = "athlete-2";
    state.requesterTeams = [];
    state.athleteTeams = [{ team_id: "team-2" }];
    state.coachMembershipExists = false;
    state.messageMissing = false;
    state.feedbackQueryErrorMessage = null;
    const mod = await import("../../netlify/functions/response-feedback.js");
    handler = mod.handler;
  });

  it("blocks athlete feedback submission for another user's message", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/response-feedback",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ messageId: "msg-1", wasHelpful: true }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks message feedback reads without owner/same-team coach access", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/response-feedback/message/msg-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks team stats access when requester is not coach in target team", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/response-feedback/stats",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { team_id: "team-99" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 404 for message feedback lookup when message does not exist", async () => {
    state.messageMissing = true;

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/response-feedback/message/missing-msg",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(404);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("not_found");
  });

  it("returns sanitized 500 when message feedback query fails unexpectedly", async () => {
    state.messageOwnerId = "user-1";
    state.feedbackQueryErrorMessage = "sensitive planner detail";

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/response-feedback/message/msg-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Failed to process feedback");
    expect(payload.error?.code).toBe("internal_error");
    expect(response.body).not.toContain("sensitive planner detail");
  });
});
