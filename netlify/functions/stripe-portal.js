import { getSupabaseClient } from "./utils/auth-helper.js";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getStripeClient } from "./utils/stripe-client.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.stripe-portal" });

/**
 * Create a Stripe Billing Portal session (self-service cancel/update
 * card/view invoices) so we never have to build our own card-management UI.
 * POST /api/billing/portal
 * Body: { teamId? } -- omit for the caller's own individual subscription.
 */

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "stripe-portal",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      let body = {};
      try {
        if (event.body) {
          body = JSON.parse(event.body);
        }
      } catch {
        return createErrorResponse("Invalid JSON body", 400);
      }

      const { teamId } = body;
      const supabase = getSupabaseClient();

      if (teamId) {
        const { data: membership } = await supabase
          .from("team_members")
          .select("role")
          .eq("team_id", teamId)
          .eq("user_id", userId)
          .eq("status", "active")
          .in("role", ["owner", "admin"])
          .maybeSingle();

        if (!membership) {
          return createErrorResponse(
            "Only a team owner/admin can manage this team's billing",
            403
          );
        }
      }

      const filterColumn = teamId ? "owner_team_id" : "owner_user_id";
      const filterValue = teamId || userId;

      const { data: billingCustomer } = await supabase
        .from("billing_customers")
        .select("stripe_customer_id")
        .eq(filterColumn, filterValue)
        .maybeSingle();

      if (!billingCustomer) {
        return handleValidationError(
          "No billing account exists yet -- subscribe first"
        );
      }

      let stripe;
      try {
        stripe = getStripeClient();
      } catch (err) {
        requestLogger.error("stripe_not_configured", { error: err.message });
        return createErrorResponse("Billing is not yet available", 503);
      }

      const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "";
      let session;
      try {
        session = await stripe.billingPortal.sessions.create({
          customer: billingCustomer.stripe_customer_id,
          return_url: `${baseUrl}/settings/billing`,
        });
      } catch (err) {
        requestLogger.error("portal_session_creation_failed", {
          error: err.message,
        });
        return createErrorResponse("Failed to open billing portal", 502);
      }

      return createSuccessResponse({ portalUrl: session.url });
    },
  });

export { handler };
