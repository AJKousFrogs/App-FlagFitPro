import { getSupabaseClient } from "./utils/auth-helper.js";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  getStripeClient,
  resolvePriceId,
  PRICE_ENV_VARS,
  SEAT_BASED_TIERS,
} from "./utils/stripe-client.js";
import { ageFromDob } from "./utils/age.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.stripe-checkout" });

/**
 * Create a Stripe Checkout Session
 * POST /api/billing/checkout
 * Body: { tier, interval: "monthly"|"annual", teamId? }
 *
 * Individual tiers (athlete_pro/coach_pro/professional_*) bill the caller.
 * Team tiers (team_domestic/team_national) require teamId and bill the team
 * (caller must be owner/admin on that team) -- the team is the Stripe
 * Customer, never an individual roster member's card.
 *
 * See docs/payments_billing_and_data_retention_proposal.md §1/§3.
 */

async function findOrCreateBillingCustomer(
  supabase,
  { ownerUserId, ownerTeamId, email, stripe }
) {
  const filterColumn = ownerTeamId ? "owner_team_id" : "owner_user_id";
  const filterValue = ownerTeamId || ownerUserId;

  const { data: existing } = await supabase
    .from("billing_customers")
    .select("id, stripe_customer_id")
    .eq(filterColumn, filterValue)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: ownerTeamId
      ? { owner_team_id: ownerTeamId }
      : { owner_user_id: ownerUserId },
  });

  const { data: created, error } = await supabase
    .from("billing_customers")
    .insert({
      stripe_customer_id: customer.id,
      owner_user_id: ownerUserId || null,
      owner_team_id: ownerTeamId || null,
    })
    .select("id, stripe_customer_id")
    .single();

  if (error) {
    throw new Error(`Failed to record billing customer: ${error.message}`);
  }
  return created;
}

// Minors + individual paid tiers (product decision, 2026-07-23, default from
// docs/payments_billing_and_data_retention_proposal.md §7 since never
// overridden): a minor never puts their own card on an individual
// subscription -- trial/free access only. Team billing is unaffected (the
// team, never an individual roster member, is the Stripe Customer).
async function isMinor(supabase, userId) {
  const { data } = await supabase
    .from("users")
    .select("date_of_birth, birth_date")
    .eq("id", userId)
    .maybeSingle();
  const dob = data?.date_of_birth ?? data?.birth_date;
  const age = ageFromDob(dob);
  return age !== null && age < 18;
}

async function verifyTeamBillingAuthority(supabase, userId, teamId) {
  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle();
  return Boolean(data);
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "stripe-checkout",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    bypassEntitlementLock: true, // this IS how a locked account un-locks itself
    handler: async (event, _context, { userId, authUser }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse("Invalid JSON body", 400);
      }

      const { tier, interval, teamId } = body;

      if (!Object.keys(PRICE_ENV_VARS).includes(tier)) {
        return handleValidationError(`Invalid tier: ${tier}`);
      }
      if (!["monthly", "annual"].includes(interval)) {
        return handleValidationError('interval must be "monthly" or "annual"');
      }

      const isTeamTier = SEAT_BASED_TIERS.has(tier);
      if (isTeamTier && !teamId) {
        return handleValidationError("teamId is required for team tiers");
      }
      if (!isTeamTier && teamId) {
        return handleValidationError(
          "teamId is only valid for team_domestic/team_national tiers"
        );
      }

      const supabase = getSupabaseClient();

      if (isTeamTier) {
        const authorized = await verifyTeamBillingAuthority(
          supabase,
          userId,
          teamId
        );
        if (!authorized) {
          return createErrorResponse(
            "Only a team owner/admin can purchase a Team Package",
            403
          );
        }
      } else if (await isMinor(supabase, userId)) {
        return createErrorResponse(
          "Individual paid tiers aren't available for accounts under 18 — a team's Team Package subscription still covers a minor athlete's full account",
          403,
          "minor_account"
        );
      }

      const priceId = resolvePriceId(tier, interval);
      if (!priceId) {
        return createErrorResponse(
          `${tier} (${interval}) is not yet available for purchase`,
          409
        );
      }

      let stripe;
      try {
        stripe = getStripeClient();
      } catch (err) {
        requestLogger.error("stripe_not_configured", { error: err.message });
        return createErrorResponse(
          "Billing is not yet available",
          503
        );
      }

      let billingCustomer;
      try {
        billingCustomer = await findOrCreateBillingCustomer(supabase, {
          ownerUserId: isTeamTier ? null : userId,
          ownerTeamId: isTeamTier ? teamId : null,
          email: authUser?.email,
          stripe,
        });
      } catch (err) {
        requestLogger.error("billing_customer_creation_failed", {
          error: err.message,
        });
        return createErrorResponse("Failed to set up billing", 500);
      }

      const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "";
      let session;
      try {
        const lineItem = { price: priceId, quantity: 1 };
        if (isTeamTier) {
          // Actual quantity is synced post-purchase via seat_sync_queue as
          // the roster changes; 1 at checkout time is just the starting seat.
          lineItem.quantity = 1;
        }
        session = await stripe.checkout.sessions.create({
          customer: billingCustomer.stripe_customer_id,
          mode: "subscription",
          line_items: [lineItem],
          success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/billing/cancelled`,
          metadata: { tier, interval, teamId: teamId || "" },
        });
      } catch (err) {
        requestLogger.error("checkout_session_creation_failed", {
          error: err.message,
        });
        return createErrorResponse("Failed to start checkout", 502);
      }

      return createSuccessResponse({ checkoutUrl: session.url });
    },
  });

export { handler };
