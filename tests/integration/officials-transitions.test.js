import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "coach-1",
  assignment: {
    id: "asg-1",
    status: "completed",
    payment_amount: null,
    payment_status: "pending",
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
      if (this.mode !== "update") {
        this.mode = "select";
      }
      return this;
    }

    update(payload) {
      this.mode = "update";
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
      if (this.table === "game_officials" && this.mode === "select") {
        return Promise.resolve({ data: { ...state.assignment }, error: null });
      }
      if (this.table === "game_officials" && this.mode === "update") {
        const updated = { ...state.assignment, ...this.payload };
        state.assignment = updated;
        return Promise.resolve({ data: updated, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
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

const buildEvent = (payload) => ({
  httpMethod: "PUT",
  path: "/.netlify/functions/officials/assignments/asg-1",
  headers: { authorization: "Bearer test-token" },
  body: JSON.stringify(payload),
  queryStringParameters: {},
});

describe("officials status/payment transitions", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.currentUserId = "coach-1";
    state.assignment = {
      id: "asg-1",
      status: "completed",
      payment_amount: null,
      payment_status: "pending",
    };
    const mod = await import("../../netlify/functions/officials.js");
    handler = mod.handler;
  });

  it("rejects invalid terminal status transitions with 422", async () => {
    const response = await handler(buildEvent({ status: "scheduled" }), {});
    expect(response.statusCode).toBe(422);
  });

  it("rejects paid status without positive payment amount", async () => {
    state.assignment = {
      ...state.assignment,
      status: "confirmed",
      payment_amount: null,
      payment_status: "pending",
    };
    const response = await handler(buildEvent({ payment_status: "paid" }), {});
    expect(response.statusCode).toBe(422);
  });

  it("rejects empty assignment update payloads with 422", async () => {
    const response = await handler(buildEvent({}));
    expect(response.statusCode).toBe(422);
  });
});
