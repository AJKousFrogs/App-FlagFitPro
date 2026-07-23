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
 * There is no permanent free tier (product decision, 2026-07-23): a user with
 * no paid access at all gets a 7-day "glimpse" trial of the FULL product
 * (TRIAL_LIMITS = every feature unlocked, same shape as the most permissive
 * paid tier) anchored on users.trial_started_at — deliberately NOT
 * users.created_at, since retroactively computing a trial window from
 * historical signup dates would instantly lock out every existing user (see
 * the trial_started_at migration). Once the trial elapses with no active
 * subscription, the account is LOCKED (paywall) until they subscribe — no
 * discounted "come back" offer, no partial free access (product decision).
 * This is a distinct concept from Stripe's own `subscription.status ===
 * "trialing"` (a vendor-side trial on a PAID plan, if one is ever
 * configured) — don't confuse the two.
 *
 * Suspension (14 days past-due, per T&C §7.5) also LOCKS the account —
 * it never touches a single row of athlete data, and the subscription itself
 * keeps billing through any voluntary account pause (product decision,
 * 2026-07-23: pausing account-pause.js's activity/ACWR-freeze is completely
 * orthogonal to billing). See account-pause.js / account-deletion.js for the
 * data lifecycle itself; this module only decides what's visible/enabled,
 * never what's stored.
 */

import { supabaseAdmin } from "../supabase-client.js";

const PAST_DUE_GRACE_DAYS = 14;
const TRIAL_DAYS = 7;

const UNLIMITED = null; // convention: null limit = unlimited

// The trial is a full "glimpse" of the product, not a permanently-limited
// freemium tier — unlocks everything, same shape as the most permissive paid
// tier, so a new signup sees the real app for the week rather than a
// crippled preview.
const TRIAL_LIMITS = {
  historyDays: UNLIMITED,
  maxTeams: UNLIMITED,
  exportEnabled: true,
  wearableSyncEnabled: true,
  rosterManagementEnabled: true,
  maxAthletesPerRoster: UNLIMITED,
  maxClients: UNLIMITED,
};

// Trial elapsed (or payment lapsed past grace) with no active paid access —
// the paywall floor. historyDays: 0 alone would not fully lock a caller down
// (see historyCutoffISO); callers MUST check the `locked` flag this module
// returns, not infer lockout from the limits shape alone.
const LOCKED_LIMITS = {
  historyDays: 0,
  maxTeams: 0,
  exportEnabled: false,
  wearableSyncEnabled: false,
  rosterManagementEnabled: false,
  maxAthletesPerRoster: 0,
  maxClients: 0,
};

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

/** Whole days left in the trial (>=1 while active today, 0 once elapsed). */
function trialDaysRemaining(trialStartedAt) {
  if (!trialStartedAt) {
    return 0;
  }
  const trialEnd =
    new Date(trialStartedAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = trialEnd - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

/**
 * @param {string} userId
 * @param {{client?: object}} [opts]
 * @returns {Promise<{tier: string, status: string, limits: object, appliedTiers: string[], locked: boolean, trialDaysRemaining: number}>}
 */
export async function getEntitlement(userId, { client = supabaseAdmin } = {}) {
  if (!userId) {
    return {
      tier: "trial_expired",
      status: "trial_expired",
      limits: LOCKED_LIMITS,
      appliedTiers: [],
      locked: true,
      trialDaysRemaining: 0,
    };
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

  const hasActivePaidAccess =
    (individualSub && !isPastDueSuspended(individualSub)) || Boolean(teamSub);

  if (hasActivePaidAccess) {
    let limits = LOCKED_LIMITS; // floor — paid tiers only ever merge upward
    const appliedTiers = [];
    let status = "locked";
    let tier = "trial_expired";

    if (individualSub && !isPastDueSuspended(individualSub)) {
      limits = mergeLimits(limits, TIER_LIMITS[individualSub.tier]);
      appliedTiers.push(individualSub.tier);
      tier = individualSub.tier;
      status = individualSub.status;
    }

    if (teamSub) {
      limits = mergeLimits(limits, TIER_LIMITS[teamSub.tier]);
      appliedTiers.push(teamSub.tier);
      if (tier === "trial_expired") {
        tier = teamSub.tier;
      }
      // Only fall back to the team's status if the individual side had
      // nothing more informative to say (e.g. an individual sub in its own
      // past_due grace period should stay visible even though team access
      // covers them regardless).
      if (status === "locked") {
        status = teamSub.status;
      }
    }

    return { tier, status, limits, appliedTiers, locked: false, trialDaysRemaining: 0 };
  }

  // No active paid access anywhere. A past-due individual subscription that
  // blew through the 14-day grace window locks the account outright — a
  // real subscription gone bad is a distinct, more serious state than
  // "never subscribed" and must never fall back to a fresh trial.
  if (individualSub && isPastDueSuspended(individualSub)) {
    return {
      tier: "suspended",
      status: "suspended",
      limits: LOCKED_LIMITS,
      appliedTiers: [],
      locked: true,
      trialDaysRemaining: 0,
    };
  }

  // Otherwise: on the 7-day onboarding trial, or past it with nothing to
  // fall back on (the paywall).
  const { data: userRow } = await client
    .from("users")
    .select("trial_started_at")
    .eq("id", userId)
    .maybeSingle();
  const daysLeft = trialDaysRemaining(userRow?.trial_started_at);

  if (daysLeft > 0) {
    return {
      tier: "trial",
      status: "trial",
      limits: TRIAL_LIMITS,
      appliedTiers: [],
      locked: false,
      trialDaysRemaining: daysLeft,
    };
  }

  return {
    tier: "trial_expired",
    status: "trial_expired",
    limits: LOCKED_LIMITS,
    appliedTiers: [],
    locked: true,
    trialDaysRemaining: 0,
  };
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

export { TRIAL_LIMITS, LOCKED_LIMITS, TIER_LIMITS, PAST_DUE_GRACE_DAYS, TRIAL_DAYS };
