import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";

import { FormInputComponent } from "../shared/components/form-input/form-input.component";
import { AuthFlowDataService } from "../core/services/auth-flow-data.service";
import { LoggerService } from "../core/services/logger.service";

/**
 * Update-password — set a new password after following a Supabase recovery link.
 * Rebuilt in the current design system. Without an active recovery session the
 * page shows the invalid/expired state.
 */
@Component({
  selector: "app-update-password",
  standalone: true,
  imports: [FormInputComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; max-width: 480px; margin: 0 auto; min-height: 100dvh; }`],
  template: `
    <main class="screen" style="padding-top:var(--s-5)">
      <h1>Set new password</h1>
      @if (!hasRecovery()) {
        <p class="note" style="color:var(--danger)">
          This password reset link is invalid or has expired.
        </p>
        <a routerLink="/reset-password" class="btn primary block" style="margin-top:var(--s-3)">
          Request new reset link
        </a>
      } @else {
        <form class="elite-auth-form card" (submit)="$event.preventDefault(); submit()">
          <app-form-input
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            [value]="password()"
            (valueChange)="password.set($event)"
          />
          @if (done()) { <p class="note" style="color:var(--accent)">Password updated. Redirecting…</p> }
          @if (error(); as e) { <p class="note" style="color:var(--danger)">{{ e }}</p> }
          <button type="submit" class="btn primary block" style="margin-top:var(--s-3)"
                  [attr.aria-disabled]="busy()">
            {{ busy() ? "Updating…" : "Update password" }}
          </button>
        </form>
      }
    </main>
  `,
})
export class UpdatePasswordComponent {
  private readonly authFlow = inject(AuthFlowDataService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  readonly hasRecovery = signal(false);
  readonly password = signal("");
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // A recovery session exists only when arriving via a valid Supabase recovery
    // link (the PASSWORD_RECOVERY event sets the intent). Absent that, the link
    // is invalid/expired.
    this.hasRecovery.set(this.authFlow.hasActivePasswordRecoveryIntent());
  }

  async submit(): Promise<void> {
    const password = this.password();
    if (this.busy()) return;
    if (password.length < 8) {
      this.error.set("Password must be at least 8 characters.");
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const result = (await this.authFlow.updateAuthUser({ password })) as
        | { error?: { message?: string } | null }
        | null;
      const err = result?.error;
      if (err) {
        this.error.set(err.message ?? "Couldn't update your password.");
      } else {
        this.authFlow.clearPasswordRecoveryIntent();
        this.done.set(true);
        await this.router.navigateByUrl("/today");
      }
    } catch (e) {
      this.logger.error("update_password_failed", e);
      this.error.set("Couldn't update your password.");
    } finally {
      this.busy.set(false);
    }
  }
}
