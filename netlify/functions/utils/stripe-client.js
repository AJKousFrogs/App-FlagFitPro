import Stripe from "stripe";

/**
 * Lazy Stripe client — constructing this module must never throw just
 * because STRIPE_SECRET_KEY isn't set yet (this environment has no real
 * Stripe account connected). The friendly error only surfaces when an
 * endpoint actually tries to call Stripe, not at import time.
 */
let cachedClient = null;

function getStripeClient() {
  if (cachedClient) {
    return cachedClient;
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured — billing endpoints are wired but no Stripe account is connected yet. See docs/payments_billing_and_data_retention_proposal.md."
    );
  }
  // No explicit apiVersion pin -- defaults to the version bundled with the
  // installed `stripe` package. Pin one explicitly once a real Stripe account
  // exists and this has been tested against it.
  cachedClient = new Stripe(secretKey);
  return cachedClient;
}

// Server-side allowlist of tier -> Stripe Price ID, read from env vars so no
// price ID is ever accepted from client input. A tier/interval combination
// with no configured env var is simply unavailable for checkout (not a
// missing-price bug — it means that price hasn't been created in Stripe yet).
const PRICE_ENV_VARS = {
  athlete_pro: { monthly: "STRIPE_PRICE_ATHLETE_PRO_MONTHLY", annual: "STRIPE_PRICE_ATHLETE_PRO_ANNUAL" },
  coach_pro: { monthly: "STRIPE_PRICE_COACH_PRO_MONTHLY", annual: "STRIPE_PRICE_COACH_PRO_ANNUAL" },
  professional_freelancer: {
    monthly: "STRIPE_PRICE_PROFESSIONAL_FREELANCER_MONTHLY",
    annual: "STRIPE_PRICE_PROFESSIONAL_FREELANCER_ANNUAL",
  },
  professional_plus: {
    monthly: "STRIPE_PRICE_PROFESSIONAL_PLUS_MONTHLY",
    annual: "STRIPE_PRICE_PROFESSIONAL_PLUS_ANNUAL",
  },
  team_domestic: { monthly: "STRIPE_PRICE_TEAM_DOMESTIC_MONTHLY", annual: "STRIPE_PRICE_TEAM_DOMESTIC_ANNUAL" },
  team_national: { monthly: "STRIPE_PRICE_TEAM_NATIONAL_MONTHLY", annual: "STRIPE_PRICE_TEAM_NATIONAL_ANNUAL" },
};

const SEAT_BASED_TIERS = new Set(["team_domestic", "team_national"]);

function resolvePriceId(tier, interval) {
  const envVarName = PRICE_ENV_VARS[tier]?.[interval];
  if (!envVarName) {
    return null;
  }
  return process.env[envVarName] || null;
}

export {
  getStripeClient,
  resolvePriceId,
  PRICE_ENV_VARS,
  SEAT_BASED_TIERS,
};
