import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { PAST_DUE_GRACE_DAYS } from "./utils/entitlements.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.billing-lapse-check" });

/**
 * Billing Lapse Check
 * POST /api/billing/lapse-check (internal/service-role, same convention as
 * alert-evaluate-rules.js -- polled periodically, not cron-wired in this
 * environment yet)
 *
 * Flips users.account_status between 'active' and 'suspended' for
 * INDIVIDUAL subscriptions once the T&C §7.5 14-day grace window has
 * elapsed. This is a secondary, display/reporting-facing signal --
 * feature gating itself is already fully enforced live by
 * utils/entitlements.js regardless of whether this has run recently.
 *
 * Team (Domestic/National) subscriptions don't map to a single user's
 * account_status -- their lapse is reflected purely through entitlements.js
 * reading the subscription's own past_due_since, not through this function.
 *
 * Never touches 'paused' or 'deleted' accounts -- those are higher-priority,
 * orthogonal states (see account-pause.js / account-deletion.js) that this
 * must not clobber.
 */

async function suspendLapsedAccounts(supabase, requestLogger) {
  const graceDeadline = new Date(
    Date.now() - PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: lapsedSubs, error: lapsedError } = await supabase
    .from("subscriptions")
    .select("id, billing_customer_id, past_due_since, status")
    .in("status", ["past_due", "unpaid"])
    .not("past_due_since", "is", null)
    .lte("past_due_since", graceDeadline);

  if (lapsedError) {
    requestLogger.error("lapsed_subscriptions_fetch_failed", {
      error: lapsedError.code,
    });
    return { suspended: 0, reactivated: 0 };
  }

  let suspended = 0;
  for (const sub of lapsedSubs || []) {
    const { data: billingCustomer } = await supabase
      .from("billing_customers")
      .select("owner_user_id")
      .eq("id", sub.billing_customer_id)
      .maybeSingle();

    if (!billingCustomer?.owner_user_id) {
      continue; // team subscription, or unknown -- nothing to flip here
    }

    const { error } = await supabase
      .from("users")
      .update({ account_status: "suspended" })
      .eq("id", billingCustomer.owner_user_id)
      .eq("account_status", "active"); // never overwrite paused/deleted

    if (error) {
      requestLogger.warn("account_suspend_failed", { error: error.code });
    } else {
      suspended++;
    }
  }

  // Reactivate: any user currently 'suspended' whose individual subscription
  // has recovered (no longer past_due/unpaid) goes back to 'active'.
  const { data: recoveredSubs } = await supabase
    .from("subscriptions")
    .select("billing_customer_id")
    .not("status", "in", "(past_due,unpaid)");

  let reactivated = 0;
  for (const sub of recoveredSubs || []) {
    const { data: billingCustomer } = await supabase
      .from("billing_customers")
      .select("owner_user_id")
      .eq("id", sub.billing_customer_id)
      .maybeSingle();

    if (!billingCustomer?.owner_user_id) {
      continue;
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update({ account_status: "active" })
      .eq("id", billingCustomer.owner_user_id)
      .eq("account_status", "suspended")
      .select("id");

    if (!error && updated?.length) {
      reactivated += updated.length;
    }
  }

  return { suspended, reactivated };
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "billing-lapse-check",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      if (event.headers["x-service-role"] !== "true") {
        return createErrorResponse(
          "Only service-role can run the billing lapse check",
          403
        );
      }

      const result = await suspendLapsedAccounts(supabaseAdmin, requestLogger);
      return createSuccessResponse(result);
    },
  });

export { handler };
