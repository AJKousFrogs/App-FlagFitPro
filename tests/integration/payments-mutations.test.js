import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  selectedMembers: [{ id: "m1" }],
  paymentUpdateResult: null,
  throwMembershipError: false,
}));

function createFakeSupabase(state) {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = "select";
    }

    select(_columns) {
      this.mode = "select";
      return this;
    }

    insert(_payload) {
      this.mode = "insert";
      return this;
    }

    update(_payload) {
      this.mode = "update";
      return this;
    }

    eq(field, value) {
      this.filters.push({ op: "eq", field, value });
      return this;
    }

    in(field, values) {
      this.filters.push({ op: "in", field, values });
      return this;
    }

    single() {
      if (this.table === "player_payments" && this.mode === "update") {
        if (!state.paymentUpdateResult) {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: state.paymentUpdateResult, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    maybeSingle() {
      if (this.table === "player_payments" && this.mode === "update") {
        return Promise.resolve({ data: state.paymentUpdateResult, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      if (this.table === "team_members" && this.mode === "select") {
        return Promise.resolve({ data: state.selectedMembers, error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "player_payments" && this.mode === "insert") {
        return Promise.resolve({ data: [{ id: "pay-1" }], error: null }).then(
          resolve,
          reject,
        );
      }
      return Promise.resolve({ data: null, error: null }).then(resolve, reject);
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (...args) => createFakeSupabase(mockState).from(...args),
  },
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  checkTeamMembership: async () => {
    if (mockState.throwMembershipError) {
      throw new Error("sensitive auth service detail");
    }
    return {
      authorized: true,
      role: "coach",
      teamId: "team-1",
    };
  },
  getUserContext: async () => ({
    user_id: "coach-1",
    player_id: "coach-1",
    team_id: "team-1",
  }),
}));

const buildEvent = (payload) => ({
  httpMethod: "POST",
  path: "/api/payments",
  headers: { authorization: "Bearer test-token" },
  body: JSON.stringify(payload),
  queryStringParameters: {},
});

describe("payments mutations validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockState.selectedMembers = [{ id: "m1" }];
    mockState.paymentUpdateResult = null;
    mockState.throwMembershipError = false;
    const mod = await import("../../netlify/functions/payments.js");
    handler = mod.handler;
  });

  it("rejects non-positive fee amount with 422", async () => {
    const response = await handler(
      buildEvent({
        action: "create_fee",
        team_id: "team-1",
        name: "Monthly Fee",
        amount: -5,
        dueDate: "2026-03-01",
        applyTo: "all",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("rejects selected player list containing non-team members with 422", async () => {
    mockState.selectedMembers = [{ id: "m1" }]; // but request asks for two IDs

    const response = await handler(
      buildEvent({
        action: "create_fee",
        team_id: "team-1",
        name: "Tournament Fee",
        amount: 35,
        dueDate: "2026-03-01",
        applyTo: "select",
        playerIds: ["m1", "m2"],
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects fee creation when applyTo all resolves to no active members", async () => {
    mockState.selectedMembers = [];

    const response = await handler(
      buildEvent({
        action: "create_fee",
        team_id: "team-1",
        name: "Team Fee",
        amount: 20,
        dueDate: "2026-03-01",
        applyTo: "all",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects payment_id update when payment is already completed/not pending", async () => {
    mockState.paymentUpdateResult = null;

    const response = await handler(
      buildEvent({
        action: "record_payment",
        team_id: "team-1",
        payment_id: "pay-2",
        date: "2026-03-01T00:00:00.000Z",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object JSON payloads with 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/api/payments",
        headers: { authorization: "Bearer test-token" },
        body: "null",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects malformed amount strings with 422", async () => {
    const response = await handler(
      buildEvent({
        action: "create_fee",
        team_id: "team-1",
        name: "Monthly Fee",
        amount: "10usd",
        dueDate: "2026-03-01",
        applyTo: "all",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 for unexpected internal failures", async () => {
    mockState.throwMembershipError = true;
    const response = await handler(
      buildEvent({
        action: "record_payment",
        team_id: "team-1",
        payment_id: "pay-2",
        date: "2026-03-01T00:00:00.000Z",
      }),
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Internal server error");
    expect(JSON.stringify(payload)).not.toContain("sensitive auth service detail");
  });
});
