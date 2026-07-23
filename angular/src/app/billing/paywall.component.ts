import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { BillingService } from "../core/services/billing.service";

/**
 * Dedicated "come subscribe" screen — reached from the Shell's persistent
 * frozen banner or Settings, NOT force-navigated to (product decision,
 * 2026-07-23: a locked account can still get in and browse; only writes are
 * refused, each with its own flash prompt — see FreezeSignalService). Kept
 * outside the app Shell (no bottom nav) purely so it reads as a distinct
 * "make a decision" moment, not because the rest of the app is unreachable.
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
