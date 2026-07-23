import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { extractApiPayload } from "../utils/api-response-mapper";

export type BillingTier =
  | "athlete_pro"
  | "coach_pro"
  | "professional_freelancer"
  | "professional_plus"
  | "team_domestic"
  | "team_national";

export type BillingInterval = "monthly" | "annual";

export interface BillingSubscription {
  tier: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  seat_quantity: number | null;
}

export interface BillingStatus {
  tier: string;
  status: string;
  locked: boolean;
  trialDaysRemaining: number;
  appliedTiers: string[];
  subscription: BillingSubscription | null;
  hasIndividualBillingCustomer: boolean;
}

/**
 * Thin client for the billing endpoints (stripe-checkout.js/stripe-portal.js/
 * billing-status.js). Never computes tier/limit logic itself — that's
 * utils/entitlements.js's job on the backend (CLAUDE.md §4); this only
 * fetches/displays and redirects to Stripe-hosted pages for the actual
 * payment flow (Checkout, Billing Portal), same as the backend never builds
 * its own card-management UI.
 */
@Injectable({ providedIn: "root" })
export class BillingService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly status = signal<BillingStatus | null>(null);
  readonly loading = signal(false);

  async loadStatus(): Promise<BillingStatus | null> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.get<BillingStatus>("/api/billing/status"),
      );
      const data = extractApiPayload<BillingStatus>(res);
      this.status.set(data);
      return data;
    } catch (err) {
      this.logger.error("billing_status_load_failed", err);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Starts a Stripe Checkout session and returns its URL (caller navigates
   * the browser there — Stripe hosts the actual payment form).
   */
  async startCheckout(
    tier: BillingTier,
    interval: BillingInterval,
    teamId?: string,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const res = await firstValueFrom(
        this.api.post<{ checkoutUrl: string }>("/api/billing/checkout", {
          tier,
          interval,
          ...(teamId ? { teamId } : {}),
        }),
      );
      const url = extractApiPayload<{ checkoutUrl: string }>(res)?.checkoutUrl;
      if (url) {
        return { url, error: null };
      }
      return { url: null, error: res.error ?? "Couldn't start checkout." };
    } catch (err) {
      this.logger.error("billing_checkout_failed", err);
      return { url: null, error: "Couldn't start checkout — try again." };
    }
  }

  /**
   * Opens the Stripe Billing Portal (self-service cancel/update card/view
   * invoices) — omit teamId for the caller's own individual subscription.
   */
  async openPortal(
    teamId?: string,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const res = await firstValueFrom(
        this.api.post<{ portalUrl: string }>(
          "/api/billing/portal",
          teamId ? { teamId } : {},
        ),
      );
      const url = extractApiPayload<{ portalUrl: string }>(res)?.portalUrl;
      if (url) {
        return { url, error: null };
      }
      return { url: null, error: res.error ?? "Couldn't open billing portal." };
    } catch (err) {
      this.logger.error("billing_portal_failed", err);
      return { url: null, error: "Couldn't open billing portal — try again." };
    }
  }
}
