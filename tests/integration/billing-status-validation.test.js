import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  users: [],
  billingCustomers: [],
  subscriptions: [],
  teamMembers: [],
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { filters: {}, inFilters: {} };
      const matches = (row) =>
        Object.entries(call.filters).every(([k, v]) => row[k] === v) &&
        Object.entries(call.inFilters).every(([k, vals]) =>
          vals.includes(row[k]),
        );

      const tableRows = () => {
        if (table === "users") return state.users;
        if (table === "billing_customers") return state.billingCustomers;
        if (table === "subscriptions") return state.subscriptions;
        if (table === "team_members") return state.teamMembers;
        return [];
      };

      const filtered = () => tableRows().filter(matches);

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
        maybeSingle: () =>
          Promise.resolve({ data: filtered()[0] || null, error: null }),
        then: (resolve, reject) =>
          Promise.resolve({ data: filtered(), error: null }).then(
            resolve,
            reject,
          ),
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

function makeEvent() {
  return { httpMethod: "GET", path: "/api/billing/status" };
}

describe("billing-status", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.users = [];
    state.billingCustomers = [];
    state.subscriptions = [];
    state.teamMembers = [];
    const mod = await import("../../netlify/functions/billing-status.js");
    handler = mod.handler;
  });

  it("reports an active trial with a countdown for a fresh user", async () => {
    state.users = [
      { id: "athlete-1", trial_started_at: new Date().toISOString() },
    ];

    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.tier).toBe("trial");
    expect(body.data.locked).toBe(false);
    expect(body.data.trialDaysRemaining).toBeGreaterThan(0);
    expect(body.data.subscription).toBeNull();
  });

  it("reports locked once the trial has elapsed with no subscription", async () => {
    state.users = [
      {
        id: "athlete-1",
        trial_started_at: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.tier).toBe("trial_expired");
    expect(body.data.locked).toBe(true);
  });

  it("includes the caller's own subscription detail when one exists", async () => {
    state.billingCustomers = [{ id: "bc-1", owner_user_id: "athlete-1" }];
    state.subscriptions = [
      {
        billing_customer_id: "bc-1",
        tier: "athlete_pro",
        status: "active",
        past_due_since: null,
        current_period_end: "2026-08-20T00:00:00.000Z",
        cancel_at_period_end: false,
        seat_quantity: null,
      },
    ];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.tier).toBe("athlete_pro");
    expect(body.data.locked).toBe(false);
    expect(body.data.subscription.current_period_end).toBe(
      "2026-08-20T00:00:00.000Z",
    );
    expect(body.data.hasIndividualBillingCustomer).toBe(true);
  });

  it("reports no individual subscription for a user covered only by a team package", async () => {
    state.billingCustomers = [{ id: "bc-team", owner_team_id: "team-1" }];
    state.subscriptions = [
      {
        billing_customer_id: "bc-team",
        tier: "team_domestic",
        status: "active",
        past_due_since: null,
      },
    ];
    state.teamMembers = [
      { user_id: "athlete-1", team_id: "team-1", status: "active" },
    ];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.tier).toBe("team_domestic");
    expect(body.data.subscription).toBeNull();
    expect(body.data.hasIndividualBillingCustomer).toBe(false);
  });
});
