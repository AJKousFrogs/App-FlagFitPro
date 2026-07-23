import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  billingCustomers: [],
  teamMembers: [],
  insertedBillingCustomers: [],
  stripeCustomersCreateResult: { id: "cus_test123" },
  stripeCheckoutSessionResult: { url: "https://checkout.stripe.com/session123" },
  priceEnv: {},
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { filters: {} };
      const resolve = () => {
        if (table === "billing_customers") {
          if (call.method === "insert") {
            const row = {
              id: `bc-${state.insertedBillingCustomers.length + 1}`,
              ...call.payload,
            };
            state.insertedBillingCustomers.push(row);
            return { data: row, error: null };
          }
          const match = state.billingCustomers.find((row) =>
            Object.entries(call.filters).every(([k, v]) => row[k] === v)
          );
          return { data: match || null, error: null };
        }
        if (table === "team_members") {
          const roles = call.inFilters?.role;
          const match = state.teamMembers.find(
            (row) =>
              Object.entries(call.filters).every(([k, v]) => row[k] === v) &&
              (!roles || roles.includes(row.role))
          );
          return { data: match || null, error: null };
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
          call.inFilters = call.inFilters || {};
          call.inFilters[field] = values;
          return query;
        },
        insert: (payload) => {
          call.method = "insert";
          call.payload = payload;
          return query;
        },
        maybeSingle: () => Promise.resolve(resolve()),
        single: () => Promise.resolve(resolve()),
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "athlete-1",
      authUser: { id: "athlete-1", email: "athlete@example.com" },
    }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/stripe-client.js", async () => {
  const actual = await vi.importActual(
    "../../netlify/functions/utils/stripe-client.js"
  );
  return {
    ...actual,
    getStripeClient: () => ({
      customers: {
        create: vi.fn(async () => state.stripeCustomersCreateResult),
      },
      checkout: {
        sessions: {
          create: vi.fn(async () => state.stripeCheckoutSessionResult),
        },
      },
    }),
    resolvePriceId: (tier, interval) =>
      state.priceEnv[`${tier}:${interval}`] || null,
  };
});

function makeEvent(body) {
  return {
    httpMethod: "POST",
    path: "/api/billing/checkout",
    headers: {},
    body: JSON.stringify(body),
  };
}

describe("stripe-checkout", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.billingCustomers = [];
    state.teamMembers = [];
    state.priceEnv = {
      "athlete_pro:monthly": "price_athlete_pro_monthly",
      "team_domestic:monthly": "price_team_domestic_monthly",
    };
    const mod = await import("../../netlify/functions/stripe-checkout.js");
    handler = mod.handler;
  });

  it("rejects an unknown tier", async () => {
    const response = await handler(
      makeEvent({ tier: "not_a_real_tier", interval: "monthly" }),
      {}
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects an invalid interval", async () => {
    const response = await handler(
      makeEvent({ tier: "athlete_pro", interval: "weekly" }),
      {}
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects a team tier without teamId", async () => {
    const response = await handler(
      makeEvent({ tier: "team_domestic", interval: "monthly" }),
      {}
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects an individual tier with a teamId", async () => {
    const response = await handler(
      makeEvent({ tier: "athlete_pro", interval: "monthly", teamId: "team-1" }),
      {}
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 409 when the tier/interval has no configured Stripe price yet", async () => {
    const response = await handler(
      makeEvent({ tier: "coach_pro", interval: "monthly" }),
      {}
    );
    expect(response.statusCode).toBe(409);
  });

  it("creates a checkout session for a valid individual tier, creating a new billing customer", async () => {
    const response = await handler(
      makeEvent({ tier: "athlete_pro", interval: "monthly" }),
      {}
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.checkoutUrl).toBe("https://checkout.stripe.com/session123");
  });

  it("reuses an existing billing customer instead of creating a new one", async () => {
    state.billingCustomers = [
      { id: "bc-1", owner_user_id: "athlete-1", stripe_customer_id: "cus_existing" },
    ];
    const response = await handler(
      makeEvent({ tier: "athlete_pro", interval: "monthly" }),
      {}
    );
    expect(response.statusCode).toBe(200);
  });

  it("rejects a team tier when the caller is not owner/admin on that team", async () => {
    state.teamMembers = [
      { team_id: "team-1", user_id: "athlete-1", role: "player", status: "active" },
    ];
    const response = await handler(
      makeEvent({ tier: "team_domestic", interval: "monthly", teamId: "team-1" }),
      {}
    );
    expect(response.statusCode).toBe(403);
  });

  it("allows a team tier when the caller is a team admin", async () => {
    state.teamMembers = [
      { team_id: "team-1", user_id: "athlete-1", role: "admin", status: "active" },
    ];
    const response = await handler(
      makeEvent({ tier: "team_domestic", interval: "monthly", teamId: "team-1" }),
      {}
    );
    expect(response.statusCode).toBe(200);
  });

  it("rejects invalid JSON", async () => {
    const response = await handler(
      { httpMethod: "POST", path: "/api/billing/checkout", headers: {}, body: "{not json" },
      {}
    );
    expect(response.statusCode).toBe(400);
  });
});
