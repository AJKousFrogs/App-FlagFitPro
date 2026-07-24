import { supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getEntitlement } from "./utils/entitlements.js";

/**
 * Billing Status
 * GET /api/billing/status
 *
 * The one read endpoint the frontend needs to render billing/trial state:
 * current tier, trial countdown, locked (paywall) flag, and the caller's own
 * individual subscription detail (renewal date, cancel-at-period-end) for
 * the Settings > Billing tab. Never re-derives tier/limit logic itself --
 * delegates entirely to utils/entitlements.js (CLAUDE.md §4).
 */

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "billing-status",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (_evt, _ctx, { userId }) => {
      const entitlement = await getEntitlement(userId, { client: supabaseAdmin });

      const { data: billingCustomer } = await supabaseAdmin
        .from("billing_customers")
        .select("id")
        .eq("owner_user_id", userId)
        .maybeSingle();

      let subscription = null;
      if (billingCustomer) {
        const { data } = await supabaseAdmin
          .from("subscriptions")
          .select(
            "tier, status, current_period_end, cancel_at_period_end, seat_quantity",
          )
          .eq("billing_customer_id", billingCustomer.id)
          .order("current_period_end", { ascending: false })
          .limit(1)
          .maybeSingle();
        subscription = data || null;
      }

      return createSuccessResponse({
        tier: entitlement.tier,
        status: entitlement.status,
        locked: entitlement.locked,
        trialDaysRemaining: entitlement.trialDaysRemaining,
        appliedTiers: entitlement.appliedTiers,
        limits: entitlement.limits,
        subscription,
        hasIndividualBillingCustomer: Boolean(billingCustomer),
      });
    },
  });

export const testHandler = handler;
export { handler };
