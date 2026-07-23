import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  billingCustomers: [],
  teamMembers: [],
  portalSessionResult: { url: "https://billing.stripe.com/session/portal_1" },
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
        maybeSingle: () => Promise.resolve(resolve()),
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/stripe-client.js", () => ({
  getStripeClient: () => ({
    billingPortal: {
      sessions: {
        create: vi.fn(async () => state.portalSessionResult),
      },
    },
  }),
}));

function makeEvent(body = {}) {
  return {
    httpMethod: "POST",
    path: "/api/billing/portal",
    headers: {},
    body: JSON.stringify(body),
  };
}

describe("stripe-portal", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.billingCustomers = [];
    state.teamMembers = [];
    const mod = await import("../../netlify/functions/stripe-portal.js");
    handler = mod.handler;
  });

  it("returns a validation error when no billing account exists yet", async () => {
    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(422);
  });

  it("returns a portal URL for the caller's own subscription", async () => {
    state.billingCustomers = [
      { owner_user_id: "athlete-1", stripe_customer_id: "cus_1" },
    ];
    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.portalUrl).toBe(
      "https://billing.stripe.com/session/portal_1"
    );
  });

  it("rejects a team portal request from a non-admin", async () => {
    state.teamMembers = [
      { team_id: "team-1", user_id: "athlete-1", role: "player", status: "active" },
    ];
    const response = await handler(makeEvent({ teamId: "team-1" }), {});
    expect(response.statusCode).toBe(403);
  });

  it("allows a team owner to manage the team's billing portal", async () => {
    state.teamMembers = [
      { team_id: "team-1", user_id: "athlete-1", role: "owner", status: "active" },
    ];
    state.billingCustomers = [
      { owner_team_id: "team-1", stripe_customer_id: "cus_team" },
    ];
    const response = await handler(makeEvent({ teamId: "team-1" }), {});
    expect(response.statusCode).toBe(200);
  });

  it("rejects invalid JSON", async () => {
    const response = await handler(
      { httpMethod: "POST", path: "/api/billing/portal", headers: {}, body: "{bad" },
      {}
    );
    expect(response.statusCode).toBe(400);
  });
});
