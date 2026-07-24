import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getStripeClient } from "./utils/stripe-client.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.stripe-webhook" });

/**
 * Stripe Webhook Receiver
 * POST /api/billing/webhook (no auth -- verified by Stripe's own signature)
 *
 * Handles: checkout.session.completed, customer.subscription.updated/deleted,
 * invoice.paid, invoice.payment_failed. Idempotent -- Stripe redelivers
 * events, so every write here is an upsert keyed on the Stripe object id,
 * never a plain insert.
 *
 * See docs/payments_billing_and_data_retention_proposal.md §1.
 */

function tierFromMetadata(subscriptionOrSession) {
  return subscriptionOrSession?.metadata?.tier || null;
}

async function upsertSubscriptionFromStripeObject(
  supabase,
  stripeSubscription,
  requestLogger
) {
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id, owner_user_id, owner_team_id")
    .eq("stripe_customer_id", stripeSubscription.customer)
    .maybeSingle();

  if (!billingCustomer) {
    requestLogger.warn("subscription_event_unknown_customer", {
      stripeCustomerId: stripeSubscription.customer,
    });
    return;
  }

  const tier = tierFromMetadata(stripeSubscription);
  if (!tier) {
    requestLogger.warn("subscription_event_missing_tier_metadata", {
      stripeSubscriptionId: stripeSubscription.id,
    });
    return;
  }

  const status = stripeSubscription.status;
  const isPastDue = status === "past_due" || status === "unpaid";

  // Preserve past_due_since across redeliveries -- only set it the moment
  // status FIRST becomes past_due/unpaid, never bump it forward on every
  // retry webhook (that would keep resetting the 14-day grace clock).
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, past_due_since, status")
    .eq("stripe_subscription_id", stripeSubscription.id)
    .maybeSingle();

  let pastDueSince = null;
  if (isPastDue) {
    pastDueSince = existing?.past_due_since || new Date().toISOString();
  }

  const row = {
    billing_customer_id: billingCustomer.id,
    stripe_subscription_id: stripeSubscription.id,
    tier,
    status,
    seat_quantity: stripeSubscription.items?.data?.[0]?.quantity ?? null,
    current_period_start: stripeSubscription.current_period_start
      ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: Boolean(stripeSubscription.cancel_at_period_end),
    past_due_since: pastDueSince,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });

  if (error) {
    requestLogger.error("subscription_upsert_failed", { error: error.message });
  }

  // Notify only the moment past_due_since is newly set -- not on every
  // retry redelivery, and never on renewal of an already-known past_due row.
  const isNewlyPastDue = isPastDue && !existing?.past_due_since;
  if (isNewlyPastDue) {
    await notifyPaymentPastDue(supabase, billingCustomer, requestLogger);
  }
}

async function notifyPaymentPastDue(supabase, billingCustomer, requestLogger) {
  let recipientUserIds = [];
  if (billingCustomer.owner_user_id) {
    recipientUserIds = [billingCustomer.owner_user_id];
  } else if (billingCustomer.owner_team_id) {
    const { data: admins } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", billingCustomer.owner_team_id)
      .eq("status", "active")
      .in("role", ["owner", "admin"]);
    recipientUserIds = (admins || []).map((a) => a.user_id);
  }

  if (recipientUserIds.length === 0) {
    return;
  }

  const rows = recipientUserIds.map((userId) => ({
    user_id: userId,
    notification_type: "billing_past_due",
    category: "billing",
    title: "Payment failed",
    message:
      "We couldn't process your last payment. Update your payment method within 14 days to keep your subscription features -- your data is never affected.",
    priority: "high",
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) {
    requestLogger.warn("past_due_notification_failed", { error: error.message });
  }
}

async function upsertInvoiceFromStripeObject(supabase, stripeInvoice, requestLogger) {
  const stripeSubscriptionId =
    typeof stripeInvoice.subscription === "string"
      ? stripeInvoice.subscription
      : stripeInvoice.subscription?.id;

  if (!stripeSubscriptionId) {
    return; // one-off invoice, not subscription-linked -- nothing to attach it to yet
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (!subscription) {
    requestLogger.warn("invoice_event_unknown_subscription", {
      stripeSubscriptionId,
    });
    return;
  }

  const row = {
    subscription_id: subscription.id,
    stripe_invoice_id: stripeInvoice.id,
    amount_due_cents: stripeInvoice.amount_due,
    currency: stripeInvoice.currency,
    status: stripeInvoice.status,
    hosted_invoice_url: stripeInvoice.hosted_invoice_url || null,
    paid_at: stripeInvoice.status_transitions?.paid_at
      ? new Date(stripeInvoice.status_transitions.paid_at * 1000).toISOString()
      : null,
  };

  const { error } = await supabase
    .from("invoices")
    .upsert(row, { onConflict: "stripe_invoice_id" });

  if (error) {
    requestLogger.error("invoice_upsert_failed", { error: error.message });
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "stripe-webhook",
    allowedMethods: ["POST"],
    rateLimitType: "DEFAULT",
    requireAuth: false,
    handler: async (event) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      let stripe;
      try {
        stripe = getStripeClient();
      } catch (err) {
        requestLogger.error("stripe_not_configured", { error: err.message });
        return createErrorResponse("Billing is not yet available", 503);
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        requestLogger.error("stripe_webhook_secret_missing", {});
        return createErrorResponse("Billing is not yet available", 503);
      }

      const signature =
        event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
      if (!signature) {
        return createErrorResponse("Missing Stripe-Signature header", 400);
      }

      let stripeEvent;
      try {
        stripeEvent = stripe.webhooks.constructEvent(
          event.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        requestLogger.warn("stripe_signature_verification_failed", {
          error: err.message,
        });
        return createErrorResponse("Invalid signature", 400);
      }

      const supabase = supabaseAdmin;

      switch (stripeEvent.type) {
        case "checkout.session.completed": {
          const session = stripeEvent.data.object;
          if (session.mode === "subscription" && session.subscription) {
            const stripeSubscription = await stripe.subscriptions.retrieve(
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id
            );
            // Checkout Session metadata carries the tier; subscription
            // objects created via Checkout don't automatically inherit it.
            if (!stripeSubscription.metadata?.tier && session.metadata?.tier) {
              stripeSubscription.metadata = {
                ...stripeSubscription.metadata,
                tier: session.metadata.tier,
              };
            }
            await upsertSubscriptionFromStripeObject(
              supabase,
              stripeSubscription,
              requestLogger
            );
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.created": {
          await upsertSubscriptionFromStripeObject(
            supabase,
            stripeEvent.data.object,
            requestLogger
          );
          break;
        }
        case "customer.subscription.deleted": {
          const stripeSubscription = stripeEvent.data.object;
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", stripeSubscription.id);
          if (error) {
            requestLogger.error("subscription_cancel_update_failed", {
              error: error.message,
            });
          }
          break;
        }
        case "invoice.paid":
        case "invoice.payment_failed": {
          await upsertInvoiceFromStripeObject(
            supabase,
            stripeEvent.data.object,
            requestLogger
          );
          break;
        }
        default:
          // Unhandled event types are expected -- Stripe sends many event
          // types we don't act on. Not an error.
          break;
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ received: true }),
      };
    },
  });

export { handler };
