import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  billingCustomers: [],
  subscriptions: [],
  teamMembers: [],
  upsertedSubscriptions: [],
  upsertedInvoices: [],
  updatedSubscriptions: [],
  insertedNotifications: [],
  constructEventResult: null,
  constructEventShouldThrow: false,
  subscriptionsRetrieveResult: null,
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { filters: {} };
      const resolve = () => {
        if (table === "billing_customers") {
          const match = state.billingCustomers.find((row) =>
            Object.entries(call.filters).every(([k, v]) => row[k] === v)
          );
          return { data: match || null, error: null };
        }
        if (table === "subscriptions") {
          if (call.method === "upsert") {
            state.upsertedSubscriptions.push(call.payload);
            return { data: null, error: null };
          }
          if (call.method === "update") {
            state.updatedSubscriptions.push({ filters: { ...call.filters }, payload: call.payload });
            return { data: null, error: null };
          }
          const match = state.subscriptions.find((row) =>
            Object.entries(call.filters).every(([k, v]) => row[k] === v)
          );
          return { data: match || null, error: null };
        }
        if (table === "invoices") {
          if (call.method === "upsert") {
            state.upsertedInvoices.push(call.payload);
            return { data: null, error: null };
          }
        }
        if (table === "team_members") {
          const roles = call.inFilters?.role;
          const rows = state.teamMembers.filter(
            (row) =>
              Object.entries(call.filters).every(([k, v]) => row[k] === v) &&
              (!roles || roles.includes(row.role))
          );
          return { data: rows, error: null };
        }
        if (table === "notifications") {
          if (call.method === "insert") {
            state.insertedNotifications.push(...call.payload);
            return { data: null, error: null };
          }
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
        update: (payload) => {
          call.method = "update";
          call.payload = payload;
          return query;
        },
        upsert: (payload) => {
          call.method = "upsert";
          call.payload = payload;
          return query;
        },
        insert: (payload) => {
          call.method = "insert";
          call.payload = Array.isArray(payload) ? payload : [payload];
          return query;
        },
        maybeSingle: () => Promise.resolve(resolve()),
        then: (resolve_, reject) => Promise.resolve(resolve()).then(resolve_, reject),
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/utils/stripe-client.js", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: (body, sig, secret) => {
        if (state.constructEventShouldThrow) {
          throw new Error("signature mismatch");
        }
        return state.constructEventResult;
      },
    },
    subscriptions: {
      retrieve: async () => state.subscriptionsRetrieveResult,
    },
  }),
}));

// supabaseAdmin is imported from supabase-client.js but stripe-webhook.js
// uses it directly -- swap in our fake per-test via module re-import.
let fakeSupabaseInstance;
vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return fakeSupabaseInstance;
  },
}));

function makeEvent(body, headers = { "stripe-signature": "sig_test" }) {
  return {
    httpMethod: "POST",
    path: "/api/billing/webhook",
    headers,
    body: JSON.stringify(body),
  };
}

describe("stripe-webhook", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    state.billingCustomers = [];
    state.subscriptions = [];
    state.teamMembers = [];
    state.upsertedSubscriptions = [];
    state.upsertedInvoices = [];
    state.updatedSubscriptions = [];
    state.insertedNotifications = [];
    state.constructEventShouldThrow = false;
    fakeSupabaseInstance = createFakeSupabase();
    const mod = await import("../../netlify/functions/stripe-webhook.js");
    handler = mod.handler;
  });

  it("returns 400 when the Stripe-Signature header is missing", async () => {
    const response = await handler(makeEvent({}, {}), {});
    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    state.constructEventShouldThrow = true;
    const response = await handler(makeEvent({}), {});
    expect(response.statusCode).toBe(400);
  });

  it("upserts a subscription on customer.subscription.updated", async () => {
    state.billingCustomers = [{ id: "bc-1", stripe_customer_id: "cus_1" }];
    state.constructEventResult = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          metadata: { tier: "athlete_pro" },
          items: { data: [{ quantity: 1 }] },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          cancel_at_period_end: false,
        },
      },
    };

    const response = await handler(makeEvent({}), {});
    expect(response.statusCode).toBe(200);
    expect(state.upsertedSubscriptions).toHaveLength(1);
    expect(state.upsertedSubscriptions[0].tier).toBe("athlete_pro");
    expect(state.upsertedSubscriptions[0].past_due_since).toBeNull();
  });

  it("sets past_due_since the first time a subscription becomes past_due", async () => {
    state.billingCustomers = [{ id: "bc-1", stripe_customer_id: "cus_1" }];
    state.subscriptions = [
      { stripe_subscription_id: "sub_1", past_due_since: null, status: "active" },
    ];
    state.constructEventResult = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "past_due",
          metadata: { tier: "athlete_pro" },
          items: { data: [{ quantity: 1 }] },
        },
      },
    };

    const response = await handler(makeEvent({}), {});
    expect(response.statusCode).toBe(200);
    expect(state.upsertedSubscriptions[0].past_due_since).not.toBeNull();
  });

  it("notifies the individual owner the first time their subscription becomes past_due", async () => {
    state.billingCustomers = [
      { id: "bc-1", stripe_customer_id: "cus_1", owner_user_id: "user-1", owner_team_id: null },
    ];
    state.subscriptions = [
      { stripe_subscription_id: "sub_1", past_due_since: null, status: "active" },
    ];
    state.constructEventResult = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "past_due",
          metadata: { tier: "athlete_pro" },
          items: { data: [{ quantity: 1 }] },
        },
      },
    };

    await handler(makeEvent({}), {});
    expect(state.insertedNotifications).toHaveLength(1);
    expect(state.insertedNotifications[0].user_id).toBe("user-1");
    expect(state.insertedNotifications[0].notification_type).toBe(
      "billing_past_due"
    );
  });

  it("notifies every team owner/admin when a team subscription becomes past_due", async () => {
    state.billingCustomers = [
      { id: "bc-team", stripe_customer_id: "cus_team", owner_user_id: null, owner_team_id: "team-1" },
    ];
    state.teamMembers = [
      { team_id: "team-1", user_id: "owner-1", role: "owner", status: "active" },
      { team_id: "team-1", user_id: "admin-1", role: "admin", status: "active" },
      { team_id: "team-1", user_id: "coach-1", role: "coach", status: "active" },
    ];
    state.subscriptions = [
      { stripe_subscription_id: "sub_team", past_due_since: null, status: "active" },
    ];
    state.constructEventResult = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_team",
          customer: "cus_team",
          status: "past_due",
          metadata: { tier: "team_domestic" },
          items: { data: [{ quantity: 12 }] },
        },
      },
    };

    await handler(makeEvent({}), {});
    const recipientIds = state.insertedNotifications.map((n) => n.user_id);
    expect(recipientIds).toEqual(expect.arrayContaining(["owner-1", "admin-1"]));
    expect(recipientIds).not.toContain("coach-1");
  });

  it("does not re-notify on a redelivered webhook for an already-past_due subscription", async () => {
    state.billingCustomers = [
      { id: "bc-1", stripe_customer_id: "cus_1", owner_user_id: "user-1", owner_team_id: null },
    ];
    state.subscriptions = [
      {
        stripe_subscription_id: "sub_1",
        past_due_since: "2026-07-01T00:00:00.000Z",
        status: "past_due",
      },
    ];
    state.constructEventResult = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "past_due",
          metadata: { tier: "athlete_pro" },
          items: { data: [{ quantity: 1 }] },
        },
      },
    };

    await handler(makeEvent({}), {});
    expect(state.insertedNotifications).toHaveLength(0);
  });

  it("preserves the original past_due_since across redelivered webhooks", async () => {
    state.billingCustomers = [{ id: "bc-1", stripe_customer_id: "cus_1" }];
    state.subscriptions = [
      {
        stripe_subscription_id: "sub_1",
        past_due_since: "2026-07-01T00:00:00.000Z",
        status: "past_due",
      },
    ];
    state.constructEventResult = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "past_due",
          metadata: { tier: "athlete_pro" },
          items: { data: [{ quantity: 1 }] },
        },
      },
    };

    await handler(makeEvent({}), {});
    expect(state.upsertedSubscriptions[0].past_due_since).toBe(
      "2026-07-01T00:00:00.000Z"
    );
  });

  it("marks a subscription canceled on customer.subscription.deleted", async () => {
    state.constructEventResult = {
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1" } },
    };

    const response = await handler(makeEvent({}), {});
    expect(response.statusCode).toBe(200);
    expect(state.updatedSubscriptions[0].payload.status).toBe("canceled");
    expect(state.updatedSubscriptions[0].filters.stripe_subscription_id).toBe(
      "sub_1"
    );
  });

  it("upserts an invoice on invoice.payment_failed", async () => {
    state.subscriptions = [{ id: "sub-row-1", stripe_subscription_id: "sub_1" }];
    state.constructEventResult = {
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_1",
          subscription: "sub_1",
          amount_due: 1499,
          currency: "eur",
          status: "open",
          hosted_invoice_url: "https://invoice.stripe.com/1",
          status_transitions: {},
        },
      },
    };

    const response = await handler(makeEvent({}), {});
    expect(response.statusCode).toBe(200);
    expect(state.upsertedInvoices[0].status).toBe("open");
  });

  it("ignores unhandled event types without error", async () => {
    state.constructEventResult = { type: "customer.updated", data: { object: {} } };
    const response = await handler(makeEvent({}), {});
    expect(response.statusCode).toBe(200);
  });
});
