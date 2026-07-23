import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  subscriptions: [],
  billingCustomers: [],
  users: [],
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { filters: {}, inFilters: {} };
      const matches = (row) =>
        Object.entries(call.filters).every(([k, v]) => row[k] === v);

      const resolveList = () => {
        if (table === "subscriptions") {
          let rows = state.subscriptions;
          if (call.inFilters.status) {
            rows = rows.filter((r) => call.inFilters.status.includes(r.status));
          }
          if (call.notInStatus) {
            rows = rows.filter((r) => !call.notInStatus.includes(r.status));
          }
          if (call.filters.past_due_since_lte) {
            rows = rows.filter(
              (r) => r.past_due_since && r.past_due_since <= call.filters.past_due_since_lte
            );
          }
          return { data: rows, error: null };
        }
        return { data: [], error: null };
      };

      const resolveSingle = () => {
        if (table === "billing_customers") {
          return { data: state.billingCustomers.find(matches) || null, error: null };
        }
        return { data: null, error: null };
      };

      const resolveUpdate = () => {
        if (table === "users") {
          const target = state.users.find(matches);
          if (!target) {
            return { data: [], error: null };
          }
          Object.assign(target, call.payload);
          return { data: [{ id: target.id }], error: null };
        }
        return { data: null, error: null };
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
        not: (field, op, value) => {
          if (field === "past_due_since" && op === "is") {
            // .not("past_due_since", "is", null) -- already filtered by
            // requiring past_due_since to be non-null in the fixture data.
            return query;
          }
          if (field === "status" && op === "in") {
            const cleaned = value.replace(/[()]/g, "").split(",");
            call.notInStatus = cleaned;
          }
          return query;
        },
        lte: (field, value) => {
          call.filters[`${field}_lte`] = value;
          return query;
        },
        update: (payload) => {
          call.payload = payload;
          call.isUpdate = true;
          return query;
        },
        maybeSingle: () => Promise.resolve(resolveSingle()),
        then: (resolve_, reject) => {
          const result = call.isUpdate ? resolveUpdate() : resolveList();
          return Promise.resolve(result).then(resolve_, reject);
        },
      };

      // .update(...).eq(...).select(...) chains -- .select() after update
      // must still resolve via resolveUpdate, not resolveList.
      const originalSelect = query.select;
      query.select = () => {
        if (call.isUpdate) {
          return {
            then: (resolve_, reject) =>
              Promise.resolve(resolveUpdate()).then(resolve_, reject),
          };
        }
        return originalSelect();
      };

      return query;
    },
  };
}

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {}),
}));

function makeEvent(serviceRole = true) {
  return {
    httpMethod: "POST",
    path: "/api/billing/lapse-check",
    headers: serviceRole ? { "x-service-role": "true" } : {},
  };
}

describe("billing-lapse-check", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.subscriptions = [];
    state.billingCustomers = [];
    state.users = [];
    const mod = await import("../../netlify/functions/billing-lapse-check.js");
    handler = mod.handler;
  });

  it("rejects requests without the service-role header", async () => {
    const response = await handler(makeEvent(false), {});
    expect(response.statusCode).toBe(403);
  });

  it("suspends a user whose individual subscription has been past_due for 14+ days", async () => {
    const fifteenDaysAgo = new Date(
      Date.now() - 15 * 24 * 60 * 60 * 1000
    ).toISOString();
    state.subscriptions = [
      {
        id: "sub-row-1",
        billing_customer_id: "bc-1",
        status: "past_due",
        past_due_since: fifteenDaysAgo,
      },
    ];
    state.billingCustomers = [{ id: "bc-1", owner_user_id: "user-1" }];
    state.users = [{ id: "user-1", account_status: "active" }];

    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.suspended).toBe(1);
    expect(state.users[0].account_status).toBe("suspended");
  });

  it("does not suspend within the 14-day grace window", async () => {
    const fiveDaysAgo = new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000
    ).toISOString();
    state.subscriptions = [
      {
        id: "sub-row-1",
        billing_customer_id: "bc-1",
        status: "past_due",
        past_due_since: fiveDaysAgo,
      },
    ];
    state.billingCustomers = [{ id: "bc-1", owner_user_id: "user-1" }];
    state.users = [{ id: "user-1", account_status: "active" }];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.suspended).toBe(0);
    expect(state.users[0].account_status).toBe("active");
  });

  it("never overwrites a paused or deleted account", async () => {
    const fifteenDaysAgo = new Date(
      Date.now() - 15 * 24 * 60 * 60 * 1000
    ).toISOString();
    state.subscriptions = [
      {
        id: "sub-row-1",
        billing_customer_id: "bc-1",
        status: "past_due",
        past_due_since: fifteenDaysAgo,
      },
    ];
    state.billingCustomers = [{ id: "bc-1", owner_user_id: "user-1" }];
    state.users = [{ id: "user-1", account_status: "paused" }];

    await handler(makeEvent(), {});
    expect(state.users[0].account_status).toBe("paused");
  });

  it("reactivates a suspended user once their subscription recovers", async () => {
    state.subscriptions = [
      {
        id: "sub-row-1",
        billing_customer_id: "bc-1",
        status: "active",
        past_due_since: null,
      },
    ];
    state.billingCustomers = [{ id: "bc-1", owner_user_id: "user-1" }];
    state.users = [{ id: "user-1", account_status: "suspended" }];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.reactivated).toBe(1);
    expect(state.users[0].account_status).toBe("active");
  });

  it("skips team subscriptions (no owner_user_id) entirely", async () => {
    const fifteenDaysAgo = new Date(
      Date.now() - 15 * 24 * 60 * 60 * 1000
    ).toISOString();
    state.subscriptions = [
      {
        id: "sub-row-1",
        billing_customer_id: "bc-team",
        status: "past_due",
        past_due_since: fifteenDaysAgo,
      },
    ];
    state.billingCustomers = [{ id: "bc-team", owner_team_id: "team-1" }];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.suspended).toBe(0);
  });
});
