import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: {
    id: "session-1",
    user_id: "user-1",
    duration_minutes: 45,
    intensity_level: 6,
    rpe: 6,
    notes: "Existing note",
    workout_type: "speed",
  },
  sponsorRewardsInsertErrorMessage: null,
}));

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
    }

    select() {
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    maybeSingle() {
      if (this.table === "workout_logs") {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }

    single() {
      if (this.table === "training_sessions" && this.mode === "select") {
        const id = this.filters.find((f) => f.field === "id")?.value;
        const userId = this.filters.find((f) => f.field === "user_id")?.value;
        if (id !== state.session.id || userId !== state.session.user_id) {
          return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        }
        return Promise.resolve({ data: { ...state.session }, error: null });
      }
      if (this.table === "training_sessions" && this.mode === "update") {
        state.session = { ...state.session, ...this.payload };
        return Promise.resolve({ data: { ...state.session }, error: null });
      }
      if (this.table === "sponsor_rewards" && this.mode === "select") {
        return Promise.resolve({ data: null, error: { code: "PGRST116" } });
      }
      return Promise.resolve({ data: { id: "row-1" }, error: null });
    }

    then(resolve, reject) {
      if (this.table === "sponsor_rewards" && this.mode === "insert") {
        if (state.sponsorRewardsInsertErrorMessage) {
          throw new Error(state.sponsorRewardsInsertErrorMessage);
        }
        return Promise.resolve({ data: [{ id: "reward-1" }], error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "notifications" && this.mode === "insert") {
        return Promise.resolve({ data: [{ id: "notif-1" }], error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "workout_logs" && this.mode === "insert") {
        return Promise.resolve({ data: [{ id: "log-1" }], error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "sponsor_rewards" && this.mode === "update") {
        return Promise.resolve({ data: [{ id: "reward-1" }], error: null }).then(
          resolve,
          reject,
        );
      }
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
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/utils/merlin-guard.js", () => ({
  guardMerlinRequest: () => null,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("training-complete validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.session = {
      id: "session-1",
      user_id: "user-1",
      duration_minutes: 45,
      intensity_level: 6,
      rpe: 6,
      notes: "Existing note",
      workout_type: "speed",
    };
    state.sponsorRewardsInsertErrorMessage = null;
    const mod = await import("../../netlify/functions/training-complete.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-complete",
        headers: { authorization: "Bearer token" },
        body: "{",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-complete",
        headers: { authorization: "Bearer token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed duration values", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-complete",
        headers: { authorization: "Bearer token" },
        body: JSON.stringify({
          sessionId: "session-1",
          duration: "45min",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when workload cannot be computed from sparse inputs", async () => {
    state.session = {
      ...state.session,
      duration_minutes: null,
      intensity_level: null,
      rpe: null,
    };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-complete",
        headers: { authorization: "Bearer token" },
        body: JSON.stringify({
          sessionId: "session-1",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("does not leak sponsor reward internals when points award fails", async () => {
    state.sponsorRewardsInsertErrorMessage = "sensitive rewards write detail";

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-complete",
        headers: { authorization: "Bearer token" },
        body: JSON.stringify({
          sessionId: "session-1",
          duration: 30,
          intensity: 5,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toContain("sensitive rewards write detail");
  });
});
