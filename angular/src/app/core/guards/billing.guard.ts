import { inject } from "@angular/core";
import { CanActivateChildFn, Router } from "@angular/router";
import { BillingService } from "../services/billing.service";

// Paths a locked (trial-expired/suspended) caller must still be able to
// reach — otherwise they could never get to the screens that let them
// subscribe in the first place.
const EXEMPT_PREFIXES = ["/settings", "/billing", "/paywall"];

/**
 * canActivateChild on the app Shell — unlike canActivate on the Shell route
 * itself (which only fires once, on first entry), canActivateChild re-runs
 * for every child navigation within the already-loaded Shell, which is what
 * a paywall actually needs: blocking in-app navigation, not just the first
 * page load.
 *
 * Billing status is fetched once per session and reused (BillingService.
 * status is a plain signal, not re-checked on every navigation) — cheap,
 * and a full page reload (e.g. returning from Stripe Checkout) naturally
 * re-fetches fresh state anyway.
 */
export const billingGuard: CanActivateChildFn = async (_childRoute, state) => {
  if (EXEMPT_PREFIXES.some((p) => state.url.startsWith(p))) {
    return true;
  }

  const billing = inject(BillingService);
  const router = inject(Router);

  const status = billing.status() ?? (await billing.loadStatus());

  if (status?.locked) {
    return router.createUrlTree(["/paywall"]);
  }

  return true;
};
