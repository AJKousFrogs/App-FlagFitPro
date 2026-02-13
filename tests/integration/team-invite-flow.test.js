import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "coach-1",
  existingInvitation: null,
  inviterRole: "coach",
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async () => ({}),
    }),
  },
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

    in() {
      return this;
    }

    single() {
      if (this.table === "teams") {
        return Promise.resolve({
          data: { id: "team-1", name: "Sharks", coach_id: "coach-1" },
          error: null,
        });
      }
      if (this.table === "users") {
        return Promise.resolve({
          data: { full_name: "Coach One", email: "coach@example.com" },
          error: null,
        });
      }
      if (this.table === "team_invitations" && this.mode === "insert") {
        return Promise.resolve({
          data: { id: "inv-1", ...this.payload },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }

    maybeSingle() {
      if (this.table === "team_invitations" && this.mode === "select") {
        return Promise.resolve({ data: state.existingInvitation, error: null });
      }
      if (this.table === "team_members" && this.mode === "select") {
        return Promise.resolve({
          data: state.inviterRole ? { role: state.inviterRole, status: "active" } : null,
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
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
      userId: state.currentUserId,
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => createSupabase(),
}));

const buildEvent = (payload) => ({
  httpMethod: "POST",
  path: "/.netlify/functions/team-invite",
  headers: { authorization: "Bearer test-token" },
  body: JSON.stringify(payload),
  queryStringParameters: {},
});

describe("team-invite flow", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.currentUserId = "coach-1";
    state.existingInvitation = null;
    state.inviterRole = "coach";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    const mod = await import("../../netlify/functions/team-invite.js");
    handler = mod.handler;
  });

  it("creates invitation when no pending invite exists", async () => {
    const response = await handler(
      buildEvent({
        teamId: "team-1",
        email: "newplayer@example.com",
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.invitationId).toBe("inv-1");
  });

  it("returns existing pending invitation for retry-safe idempotency", async () => {
    state.existingInvitation = { id: "inv-existing", status: "pending" };

    const response = await handler(
      buildEvent({
        teamId: "team-1",
        email: "newplayer@example.com",
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.invitationId).toBe("inv-existing");
  });

  it("rejects invalid invite role with 422", async () => {
    const response = await handler(
      buildEvent({
        teamId: "team-1",
        email: "newplayer@example.com",
        role: "admin",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object payload with 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/team-invite",
        headers: { authorization: "Bearer test-token" },
        body: "[]",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
