import { describe, it, expect } from "vitest";
import { createSupabaseMock } from "../helpers/supabase-mock.js";
import {
  getEntitlement,
  historyCutoffISO,
  FREE_LIMITS,
} from "../../netlify/functions/utils/entitlements.js";

describe("entitlements", () => {
  it("defaults to free for a user with no subscription and no paid team", async () => {
    const client = createSupabaseMock({
      billing_customers: [],
      subscriptions: [],
      team_members: [],
    });

    const entitlement = await getEntitlement("user-1", { client });
    expect(entitlement.tier).toBe("free");
    expect(entitlement.status).toBe("free");
    expect(entitlement.limits).toEqual(FREE_LIMITS);
  });

  it("returns null for missing userId (treated as free, no query)", async () => {
    const entitlement = await getEntitlement(null, {
      client: createSupabaseMock({}),
    });
    expect(entitlement.tier).toBe("free");
  });

  it("grants athlete_pro limits for an active individual subscription", async () => {
    const client = createSupabaseMock({
      billing_customers: [{ id: "bc-1", owner_user_id: "user-1" }],
      subscriptions: [
        { billing_customer_id: "bc-1", tier: "athlete_pro", status: "active", past_due_since: null },
      ],
      team_members: [],
    });

    const entitlement = await getEntitlement("user-1", { client });
    expect(entitlement.tier).toBe("athlete_pro");
    expect(entitlement.status).toBe("active");
    expect(entitlement.limits.historyDays).toBeNull(); // unlimited
    expect(entitlement.limits.exportEnabled).toBe(true);
    expect(entitlement.limits.rosterManagementEnabled).toBe(false);
  });

  it("downgrades to free (suspended) 14+ days past due, without touching data", async () => {
    const fifteenDaysAgo = new Date(
      Date.now() - 15 * 24 * 60 * 60 * 1000
    ).toISOString();
    const client = createSupabaseMock({
      billing_customers: [{ id: "bc-1", owner_user_id: "user-1" }],
      subscriptions: [
        {
          billing_customer_id: "bc-1",
          tier: "athlete_pro",
          status: "past_due",
          past_due_since: fifteenDaysAgo,
        },
      ],
      team_members: [],
    });

    const entitlement = await getEntitlement("user-1", { client });
    expect(entitlement.status).toBe("suspended");
    expect(entitlement.limits).toEqual(FREE_LIMITS);
  });

  it("stays on the paid tier within the 14-day grace window (not yet suspended)", async () => {
    const fiveDaysAgo = new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000
    ).toISOString();
    const client = createSupabaseMock({
      billing_customers: [{ id: "bc-1", owner_user_id: "user-1" }],
      subscriptions: [
        {
          billing_customer_id: "bc-1",
          tier: "athlete_pro",
          status: "past_due",
          past_due_since: fiveDaysAgo,
        },
      ],
      team_members: [],
    });

    const entitlement = await getEntitlement("user-1", { client });
    expect(entitlement.status).not.toBe("suspended");
    expect(entitlement.limits.exportEnabled).toBe(true);
  });

  it("grants team_domestic limits (roster management) via team membership alone", async () => {
    const client = createSupabaseMock({
      billing_customers: [{ id: "bc-team", owner_team_id: "team-1" }],
      subscriptions: [
        {
          billing_customer_id: "bc-team",
          tier: "team_domestic",
          status: "active",
          past_due_since: null,
        },
      ],
      team_members: [{ user_id: "coach-1", team_id: "team-1", status: "active" }],
    });

    const entitlement = await getEntitlement("coach-1", { client });
    expect(entitlement.tier).toBe("team_domestic");
    expect(entitlement.limits.rosterManagementEnabled).toBe(true);
    expect(entitlement.limits.exportEnabled).toBe(true); // team package also covers athlete-side limits
  });

  it("unions an individual subscription with a team subscription (most-permissive wins)", async () => {
    const client = createSupabaseMock({
      billing_customers: [
        { id: "bc-user", owner_user_id: "user-1" },
        { id: "bc-team", owner_team_id: "team-1" },
      ],
      subscriptions: [
        { billing_customer_id: "bc-user", tier: "athlete_pro", status: "active", past_due_since: null },
        { billing_customer_id: "bc-team", tier: "team_domestic", status: "active", past_due_since: null },
      ],
      team_members: [{ user_id: "user-1", team_id: "team-1", status: "active" }],
    });

    const entitlement = await getEntitlement("user-1", { client });
    expect(entitlement.appliedTiers).toEqual(
      expect.arrayContaining(["athlete_pro", "team_domestic"])
    );
    expect(entitlement.limits.rosterManagementEnabled).toBe(true);
  });

  it("ignores an inactive team membership's subscription", async () => {
    const client = createSupabaseMock({
      billing_customers: [{ id: "bc-team", owner_team_id: "team-1" }],
      subscriptions: [
        { billing_customer_id: "bc-team", tier: "team_domestic", status: "active", past_due_since: null },
      ],
      team_members: [{ user_id: "user-1", team_id: "team-1", status: "inactive" }],
    });

    const entitlement = await getEntitlement("user-1", { client });
    expect(entitlement.tier).toBe("free");
  });
});

describe("historyCutoffISO", () => {
  it("returns null (no filter) for unlimited history", () => {
    expect(
      historyCutoffISO({ limits: { historyDays: null } })
    ).toBeNull();
  });

  it("returns a cutoff date ~N days ago for a limited tier", () => {
    const cutoff = historyCutoffISO({ limits: { historyDays: 30 } });
    const daysAgo = (Date.now() - new Date(cutoff).getTime()) / (24 * 60 * 60 * 1000);
    expect(daysAgo).toBeGreaterThan(29.9);
    expect(daysAgo).toBeLessThan(30.1);
  });
});
