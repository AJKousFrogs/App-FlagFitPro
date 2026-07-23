import { inject } from "@angular/core";
import { CanActivateChildFn } from "@angular/router";
import { BillingService } from "../services/billing.service";

/**
 * canActivateChild on the app Shell -- NEVER blocks navigation (product
 * decision, 2026-07-23: a locked account "can still get in", not get
 * redirected out). Its only job is to make sure BillingService.status() is
 * populated once per session so the Shell's persistent frozen banner and
 * FreezeSignalService have real data as soon as the app loads, rather than
 * only after the first refused write. Freezing itself happens per-action:
 * every write the backend refuses (402 subscription_required) is caught by
 * ApiService and reflected through FreezeSignalService -- see api.service.ts.
 */
export const billingGuard: CanActivateChildFn = async () => {
  const billing = inject(BillingService);

  if (!billing.status()) {
    await billing.loadStatus();
  }

  return true;
};
