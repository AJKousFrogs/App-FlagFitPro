import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { BillingService } from "../core/services/billing.service";

/**
 * Full-screen paywall — shown once billingGuard finds the caller locked
 * (trial elapsed with no subscription, or a payment suspended past the
 * 14-day grace period). Deliberately OUTSIDE the app Shell (no bottom nav):
 * a locked account shouldn't present the rest of the app as if it were
 * reachable.
 */
@Component({
  selector: "app-paywall",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <main class="paywall-screen">
      <div class="paywall-card">
        <lucide-icon name="lock" class="paywall-icon" aria-hidden="true" />
        @if (status()?.tier === "suspended") {
          <h1>Payment needed</h1>
          <p class="muted">
            Your last payment didn't go through. Update your payment method
            to restore access — nothing about your training data was
            affected.
          </p>
        } @else {
          <h1>Your trial has ended</h1>
          <p class="muted">
            Your 7-day trial is over. Subscribe to keep using FlagFit Pro —
            your data is safe and waiting for you.
          </p>
        }
        <a class="btn primary block" routerLink="/billing">See plans</a>
        <a class="btn ghost block" routerLink="/settings">Manage billing</a>
      </div>
    </main>
  `,
  styles: [
    `
      .paywall-screen {
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--s-4);
      }
      .paywall-card {
        max-width: 360px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-3);
        text-align: center;
      }
      .paywall-icon {
        color: var(--accent);
        width: 40px;
        height: 40px;
      }
      .paywall-card h1 {
        font-family: var(--font-display);
        font-size: var(--fs-h2);
        margin: 0;
      }
      .paywall-card a.btn {
        width: 100%;
      }
    `,
  ],
})
export class PaywallComponent {
  private readonly billing = inject(BillingService);
  readonly status = this.billing.status;

  constructor() {
    if (!this.status()) {
      void this.billing.loadStatus();
    }
  }
}
