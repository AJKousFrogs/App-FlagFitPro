import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { AuthFlowDataService } from "../core/services/auth-flow-data.service";
import { LoggerService } from "../core/services/logger.service";

/**
 * Verify-email — the authGuard's parking spot for a signed-in-but-unverified
 * account (the guard signs them out and lands them here). Shows the pending
 * address and a resend button. Top-level route, no app shell.
 */
@Component({
  selector: "app-verify-email",
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./verify-email.component.html",
  styles: [
    `
      :host {
        display: block;
        max-width: 480px;
        margin: 0 auto;
        min-height: 100dvh;
      }
      .brand {
        font-family: var(--font-display);
        font-weight: var(--fw-bold);
      }
    `,
  ],
})
export class VerifyEmailComponent {
  private readonly authFlow = inject(AuthFlowDataService);
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);

  readonly email = signal(
    this.route.snapshot.queryParamMap.get("email") ??
      this.authFlow.getPendingVerificationEmail() ??
      "",
  );
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  async resend(): Promise<void> {
    const email = this.email().trim();
    if (!email || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const { error } = await this.authFlow.resendVerificationEmail({
        email,
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        this.error.set(error.message ?? "Couldn't resend — try again shortly.");
      } else {
        this.sent.set(true);
      }
    } catch (err) {
      this.logger.error("resend_verification_failed", err);
      this.error.set("Couldn't resend — try again shortly.");
    } finally {
      this.busy.set(false);
    }
  }
}
