import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import { BillingService, type BillingTier } from "../core/services/billing.service";
import { TeamMembershipService } from "../core/services/team-membership.service";
import { LoggerService } from "../core/services/logger.service";

interface TierDisplay {
  key: BillingTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isTeamTier: boolean;
  seatNote?: string;
}

/**
 * Pricing / subscribe page. Prices are the real figures from
 * docs/legal/BUSINESS_PLAN_SUBSCRIPTIONS.md §2.1 — not placeholders.
 * "Subscribe" starts a Stripe Checkout Session (POST /api/billing/checkout)
 * and navigates the browser to Stripe's own hosted payment page; this
 * component never collects card details itself.
 *
 * Team tiers bill the caller's CURRENT team (TeamMembershipService — this
 * app's UX model is single-current-team, so a multi-team picker isn't
 * built here) and require the caller to be that team's owner/admin,
 * matching stripe-checkout.js's own authority check.
 */
@Component({
  selector: "app-pricing",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: "./pricing.component.html",
  styleUrl: "./pricing.component.scss",
})
export class PricingComponent {
  private readonly billing = inject(BillingService);
  private readonly teamMembership = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  readonly status = this.billing.status;
  readonly loadingStatus = this.billing.loading;
  readonly interval = signal<"monthly" | "annual">("annual");
  readonly startingCheckout = signal<BillingTier | null>(null);
  readonly checkoutError = signal<string | null>(null);

  readonly canManageCurrentTeamBilling = computed(() => {
    const role = this.teamMembership.role();
    return role === "owner" || role === "admin";
  });
  readonly currentTeamId = this.teamMembership.teamId;

  readonly tiers: TierDisplay[] = [
    {
      key: "athlete_pro",
      name: "Athlete Pro",
      tagline: "Full training history, ACWR dashboard, wearable sync",
      monthlyPrice: 14.99,
      annualPrice: 149.99,
      isTeamTier: false,
      features: [
        "Unlimited training history",
        "Personalized ACWR dashboard",
        "Injury protocol tracking",
        "Wearable sync (Garmin/Oura/WHOOP/Apple Health)",
        "Export training data (PDF, CSV)",
      ],
    },
    {
      key: "coach_pro",
      name: "Coach Pro",
      tagline: "Roster management, RTP workflow, team analytics",
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      isTeamTier: false,
      features: [
        "Everything in Athlete Pro",
        "Athlete roster management (up to 20)",
        "RTP clearance workflow",
        "Bulk load programming",
        "Team analytics & custom alerts",
      ],
    },
    {
      key: "professional_freelancer",
      name: "Professional Freelancer",
      tagline: "For physios, nutritionists, psychologists, S&C coaches",
      monthlyPrice: 49.99,
      annualPrice: 499.99,
      isTeamTier: false,
      features: [
        "Everything in Coach Pro",
        "Unlimited clients (up to 100)",
        "Specialized assessment tools",
        "Client management & invoicing",
        "Basic API access",
      ],
    },
    {
      key: "professional_plus",
      name: "Professional Plus",
      tagline: "Unlimited clients, clinic management, dedicated support",
      monthlyPrice: 99.99,
      annualPrice: 999.99,
      isTeamTier: false,
      features: [
        "Everything in Professional Freelancer",
        "Unlimited clients",
        "Advanced analytics",
        "Clinic management (multiple staff)",
        "Dedicated account manager",
      ],
    },
    {
      key: "team_domestic",
      name: "Team Package (Domestic)",
      tagline: "Every athlete and coach on your roster, one subscription",
      monthlyPrice: 100,
      annualPrice: 1080, // 100 × 12 × 0.9 (10% annual discount)
      isTeamTier: true,
      seatNote: "Covers up to 12 people — +€4.99/mo per person above that",
      features: [
        "All Coach Pro features for unlimited coaches",
        "Every athlete's own Athlete Pro features",
        "Team analytics & injury dashboard",
        "Season planning & practice tools",
        "Dedicated support",
      ],
    },
    {
      key: "team_national",
      name: "Team Package (National)",
      tagline: "National federations, academy programs, elite clubs",
      monthlyPrice: 250,
      annualPrice: 2550, // 250 × 12 × 0.85 (15% annual discount)
      isTeamTier: true,
      seatNote: "Covers up to 20 people — +€4.99/mo per person above that",
      features: [
        "Everything in Team Package (Domestic)",
        "Unlimited athletes and staff",
        "Advanced analytics & predictive models",
        "Bulk wearable license management",
        "Dedicated account manager",
      ],
    },
  ];

  constructor() {
    void this.billing.loadStatus();
  }

  priceFor(tier: TierDisplay): number {
    return this.interval() === "monthly" ? tier.monthlyPrice : tier.annualPrice;
  }

  isCurrentTier(tier: TierDisplay): boolean {
    return this.status()?.appliedTiers.includes(tier.key) ?? false;
  }

  async subscribe(tier: TierDisplay): Promise<void> {
    if (this.startingCheckout()) return;
    this.checkoutError.set(null);

    let teamId: string | undefined;
    if (tier.isTeamTier) {
      if (!this.canManageCurrentTeamBilling() || !this.currentTeamId()) {
        this.checkoutError.set(
          "Only your team's owner/admin can purchase a Team Package.",
        );
        return;
      }
      teamId = this.currentTeamId() ?? undefined;
    }

    this.startingCheckout.set(tier.key);
    try {
      const { url, error } = await this.billing.startCheckout(
        tier.key,
        this.interval(),
        teamId,
      );
      if (url) {
        window.location.href = url;
        return;
      }
      this.checkoutError.set(error ?? "Couldn't start checkout — try again.");
    } catch (err) {
      this.logger.error("pricing_checkout_failed", err);
      this.checkoutError.set("Couldn't start checkout — try again.");
    } finally {
      this.startingCheckout.set(null);
    }
  }
}
