/**
 * Entitlements — the single source of truth for "what does this subscription
 * tier unlock", mirroring the ACWR-engine rule (CLAUDE.md §4): one place
 * computes tier -> feature limits, everywhere else fetches/checks, never
 * re-implements its own copy of the pricing tiers.
 *
 * See docs/payments_billing_and_data_retention_proposal.md for the full design.
 *
 * A user's effective entitlement is the most-permissive union of:
 *  - their own individual subscription (Athlete Pro / Coach Pro / Professional
 *    Freelancer / Professional Plus), if active/trialing and not suspended
 *  - any team they actively belong to that has an active/trialing Team
 *    Package subscription (Domestic or National) — Team Package explicitly
 *    grants "all Coach Pro features for unlimited coaches" AND covers every
 *    athlete on the roster, so it contributes both the coach-side and
 *    athlete-side limits regardless of which role the user holds on that team.
 *
 * Suspension (14 days past-due, per T&C §7.5) downgrades limits to Free —
 * it never touches a single row of athlete data. See account-pause.js /
 * account-deletion.js for the data lifecycle itself; this module only
 * decides what's visible/enabled, not what's stored.
 */

import { supabaseAdmin } from "../supabase-client.js";

const PAST_DUE_GRACE_DAYS = 14;

const FREE_LIMITS = {
  historyDays: 30,
  maxTeams: 1,
  exportEnabled: false,
  wearableSyncEnabled: false,
  rosterManagementEnabled: false,
  maxAthletesPerRoster: 0,
  maxClients: 0,
};

const UNLIMITED = null; // convention: null limit = unlimited

const TIER_LIMITS = {
  athlete_pro: {
    historyDays: UNLIMITED,
    maxTeams: 5,
    exportEnabled: true,
    wearableSyncEnabled: true,
    rosterManagementEnabled: false,
    maxAthletesPerRoster: 0,
    maxClients: 0,
  },
  coach_pro: {
    historyDays: UNLIMITED,
    maxTeams: UNLIMITED,
    exportEnabled: true,
    wearableSyncEnabled: true,
    rosterManagementEnabled: true,
    maxAthletesPerRoster: 20,
    maxClients: 0,
  },
  professional_freelancer: {
    historyDays: UNLIMITED,
    maxTeams: UNLIMITED,
    exportEnabled: true,
    wearableSyncEnabled: true,
    rosterManagementEnabled: true,
    maxAthletesPerRoster: UNLIMITED,
    maxClients: 100,
  },
  professional_plus: {
    historyDays: UNLIMITED,
    maxTeams: UNLIMITED,
    exportEnabled: true,
    wearableSyncEnabled: true,
    rosterManagementEnabled: true,
    maxAthletesPerRoster: UNLIMITED,
    maxClients: UNLIMITED,
  },
  // Team Package grants the coach-side limits (roster management) plus the
  // athlete-side limits (history/export/wearable) to everyone on the roster —
  // deliberately the union of coach_pro and athlete_pro, not a distinct tier.
  team_domestic: {
    historyDays: UNLIMITED,
    maxTeams: UNLIMITED,
    exportEnabled: true,
    wearableSyncEnabled: true,
    rosterManagementEnabled: true,
    maxAthletesPerRoster: UNLIMITED,
    maxClients: 0,
  },
  team_national: {
    historyDays: UNLIMITED,
    maxTeams: UNLIMITED,
    exportEnabled: true,
    wearableSyncEnabled: true,
    rosterManagementEnabled: true,
    maxAthletesPerRoster: UNLIMITED,
    maxClients: 0,
  },
};

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

function mergeLimits(base, addition) {
  if (!addition) {
    return base;
  }
  const merged = { ...base };
  for (const [key, value] of Object.entries(addition)) {
    const current = merged[key];
    if (typeof value === "boolean") {
      merged[key] = current === true || value === true;
    } else if (value === UNLIMITED || current === UNLIMITED) {
      merged[key] = UNLIMITED;
    } else {
      merged[key] = Math.max(current, value);
    }
  }
  return merged;
}

function isPastDueSuspended(subscription) {
  if (!subscription.past_due_since) {
    return false;
  }
  const graceDeadline =
    new Date(subscription.past_due_since).getTime() +
    PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() >= graceDeadline;
}

/**
 * @param {string} userId
 * @param {{client?: object}} [opts]
 * @returns {Promise<{tier: string, status: string, limits: object, appliedTiers: string[]}>}
 */
export async function getEntitlement(userId, { client = supabaseAdmin } = {}) {
  if (!userId) {
    return { tier: "free", status: "free", limits: FREE_LIMITS, appliedTiers: [] };
  }

  // Two-step lookups (find the billing_customer row, then its subscription)
  // rather than a PostgREST embedded-resource filter -- simpler to reason
  // about and to unit-test than relying on !inner-join filter syntax.
  const relevantStatuses = [...ACTIVE_SUBSCRIPTION_STATUSES, "past_due", "unpaid"];

  const { data: ownCustomer } = await client
    .from("billing_customers")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  let individualSub = null;
  if (ownCustomer) {
    const { data } = await client
      .from("subscriptions")
      .select("tier, status, past_due_since")
      .eq("billing_customer_id", ownCustomer.id)
      .in("status", relevantStatuses)
      .maybeSingle();
    individualSub = data || null;
  }

  const { data: memberships } = await client
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active");

  const teamIds = (memberships || []).map((m) => m.team_id).filter(Boolean);

  let teamSub = null;
  if (teamIds.length > 0) {
    const { data: teamCustomers } = await client
      .from("billing_customers")
      .select("id")
      .in("owner_team_id", teamIds);
    const teamCustomerIds = (teamCustomers || []).map((c) => c.id);

    if (teamCustomerIds.length > 0) {
      const { data: teamSubs } = await client
        .from("subscriptions")
        .select("tier, status, past_due_since")
        .in("billing_customer_id", teamCustomerIds)
        .in("status", relevantStatuses);
      // A user on several teams could have several team subscriptions; take
      // the first non-suspended one deterministically (most-recently-created).
      teamSub =
        (teamSubs || [])
          .filter((s) => !isPastDueSuspended(s))
          .sort((a, b) => (a.tier < b.tier ? 1 : -1))[0] || null;
    }
  }

  let limits = FREE_LIMITS;
  const appliedTiers = [];
  let status = "free";
  let tier = "free";

  if (individualSub && !isPastDueSuspended(individualSub)) {
    limits = mergeLimits(limits, TIER_LIMITS[individualSub.tier]);
    appliedTiers.push(individualSub.tier);
    tier = individualSub.tier;
    status = individualSub.status;
  } else if (individualSub && isPastDueSuspended(individualSub)) {
    status = "suspended";
  }

  if (teamSub) {
    limits = mergeLimits(limits, TIER_LIMITS[teamSub.tier]);
    appliedTiers.push(teamSub.tier);
    if (tier === "free") {
      tier = teamSub.tier;
    }
    if (status === "free" || status === "suspended") {
      status = teamSub.status;
    }
  }

  return { tier, status, limits, appliedTiers };
}

/**
 * Convenience helper for read endpoints: returns an ISO date string to use
 * as a `.gte(dateColumn, cutoff)` filter, or null if the caller's
 * entitlement has unlimited history (no filter should be applied).
 */
export function historyCutoffISO(entitlement) {
  if (!entitlement || entitlement.limits.historyDays === UNLIMITED) {
    return null;
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - entitlement.limits.historyDays);
  return cutoff.toISOString();
}

export { FREE_LIMITS, TIER_LIMITS, PAST_DUE_GRACE_DAYS };
