import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for the trial/paywall history floor (utils/
// entitlements.js) wired into the training-sessions GET path. The floor
// must apply even when the caller explicitly requests an earlier startDate
// -- otherwise a locked-out user could just ask for 2020-01-01 and bypass
// the paywall entirely.

const state = vi.hoisted(() => ({
  billingCustomers: [],
  subscriptions: [],
  teamMembers: [],
  users: [],
  capturedGteValue: null,
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { filters: {}, inFilters: {} };

      const matches = (row) =>
        Object.entries(call.filters).every(([k, v]) => row[k] === v) &&
        Object.entries(call.inFilters).every(([k, vals]) => vals.includes(row[k]));

      const resolveSingle = () => {
        if (table === "billing_customers") {
          return { data: state.billingCustomers.find(matches) || null, error: null };
        }
        if (table === "subscriptions") {
          return { data: state.subscriptions.find(matches) || null, error: null };
        }
        if (table === "users") {
          return { data: state.users.find(matches) || null, error: null };
        }
        return { data: null, error: null };
      };

      const resolveList = () => {
        if (table === "team_members") {
          return { data: state.teamMembers, error: null };
        }
        if (table === "subscriptions") {
          return { data: state.subscriptions.filter(matches), error: null };
        }
        if (table === "training_sessions") {
          return { data: [], error: null };
        }
        return { data: [], error: null };
      };

      const query = {
        select: () => query,
        eq: (field, value) => {
          call.filters[field] = value;
          return query;
        },
        in: (field, values) => {
          call.inFilters[field] = values;
          return query;
        },
        order: () => query,
        limit: () => query,
        lte: () => query,
        gte: (field, value) => {
          if (table === "training_sessions" && field === "session_date") {
            state.capturedGteValue = value;
          }
          return query;
        },
        maybeSingle: () => Promise.resolve(resolveSingle()),
        then: (resolve_, reject) =>
          Promise.resolve(resolveList()).then(resolve_, reject),
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "athlete-1",
      supabase: createFakeSupabase(),
    }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  requireAuthorization: async () => ({ success: true }),
  getUserRole: async () => "player",
  logViolation: async () => {},
}));

function makeGetEvent(queryStringParameters) {
  return {
    httpMethod: "GET",
    path: "/.netlify/functions/training-sessions",
    headers: { authorization: "Bearer test-token" },
    queryStringParameters,
  };
}

describe("training-sessions GET — trial/paywall history floor", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.billingCustomers = [];
    state.subscriptions = [];
    state.teamMembers = [];
    state.users = [];
    state.capturedGteValue = null;
    const mod = await import("../../netlify/functions/training-sessions.js");
    handler = mod.handler;
  });

  it("does not clamp history during the active 7-day trial (full glimpse, no floor)", async () => {
    state.users = [
      { id: "athlete-1", trial_started_at: new Date().toISOString() },
    ];

    await handler(makeGetEvent({ startDate: "2020-01-01" }), {});
    expect(state.capturedGteValue).toBe("2020-01-01");
  });

  it("hard-blocks the request (402) once the trial has expired with no subscription", async () => {
    state.users = [
      {
        id: "athlete-1",
        trial_started_at: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ];

    const response = await handler(
      makeGetEvent({ startDate: "2020-01-01" }),
      {},
    );

    // The query still runs (param validation must surface its own 422
    // regardless of billing state — see training-sessions.js), but the
    // response is rejected rather than handing back the result.
    expect(response.statusCode).toBe(402);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe("subscription_required");
  });

  it("does not clamp history at all for an active Athlete Pro subscriber", async () => {
    state.billingCustomers = [{ id: "bc-1", owner_user_id: "athlete-1" }];
    state.subscriptions = [
      {
        billing_customer_id: "bc-1",
        tier: "athlete_pro",
        status: "active",
        past_due_since: null,
      },
    ];

    await handler(makeGetEvent({ startDate: "2020-01-01" }), {});
    expect(state.capturedGteValue).toBe("2020-01-01");
  });
});
