import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  invitationStatus: "pending",
  insertedTeamMembers: 0,
}));

function createSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
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

    update() {
      this.mode = "update";
      return this;
    }

    eq() {
      return this;
    }

    single() {
      if (this.table === "users") {
        return Promise.resolve({
          data: { email: "athlete@example.com" },
          error: null,
        });
      }

      if (this.table === "team_invitations") {
        return Promise.resolve({
          data: {
            id: "inv-1",
            token: "tok-1",
            team_id: "team-1",
            email: "athlete@example.com",
            role: "player",
            position: "WR",
            jersey_number: 11,
            status: state.invitationStatus,
            expires_at: "2099-01-01T00:00:00.000Z",
            teams: {
              id: "team-1",
              name: "Sharks",
            },
          },
          error: null,
        });
      }

      if (this.table === "team_members" && this.mode === "select") {
        return Promise.resolve({
          data: null,
          error: { code: "PGRST116" },
        });
      }

      if (this.table === "team_members" && this.mode === "insert") {
        state.insertedTeamMembers += 1;
        return Promise.resolve({
          data: { id: "tm-1", ...this.payload },
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
    auth: {
      getUser: async () => ({ data: { user: { email: "athlete@example.com" } } }),
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

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => createSupabase(),
}));

describe("invitation status guards", () => {
  beforeEach(() => {
    vi.resetModules();
    state.invitationStatus = "pending";
    state.insertedTeamMembers = 0;
  });

  it("returns 409 when validating a cancelled invitation", async () => {
    state.invitationStatus = "cancelled";
    const { handler } = await import("../../netlify/functions/validate-invitation.js");

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/validate-invitation",
        queryStringParameters: { token: "tok-1" },
      },
      {},
    );

    expect(response.statusCode).toBe(409);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("invitation_inactive");
  });

  it("returns 409 when accepting a cancelled invitation and does not create membership", async () => {
    state.invitationStatus = "cancelled";
    const { handler } = await import("../../netlify/functions/accept-invitation.js");

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/accept-invitation",
        headers: { authorization: "Bearer token" },
        body: JSON.stringify({ token: "tok-1" }),
      },
      {},
    );

    expect(response.statusCode).toBe(409);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("invitation_inactive");
    expect(state.insertedTeamMembers).toBe(0);
  });
});
