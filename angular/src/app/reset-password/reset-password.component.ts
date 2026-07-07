import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";

import { FormInputComponent } from "../shared/components/form-input/form-input.component";
import { AuthFlowDataService } from "../core/services/auth-flow-data.service";
import { LoggerService } from "../core/services/logger.service";

/**
 * Reset-password — request a Supabase password-reset email. Rebuilt in the
 * current design system after the Phase-A demolition removed the original.
 */
@Component({
  selector: "app-reset-password",
  imports: [FormInputComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        max-width: 480px;
        margin: 0 auto;
        min-height: 100dvh;
      }
    `,
  ],
  template: `
    <main class="screen" style="padding-top:var(--s-5)">
      <h1>Reset password</h1>
      <p class="muted" style="margin-bottom:var(--s-3)">
        Enter your email and we'll send you a link to set a new password.
      </p>
      <form
        class="elite-auth-form card"
        (submit)="$event.preventDefault(); submit()"
      >
        <app-form-input
          label="Email"
          type="email"
          placeholder="you@example.com"
          [value]="email()"
          (valueChange)="email.set($event)"
        />
        @if (sent()) {
          <p class="note" style="color:var(--accent)">
            Check your inbox for a reset link.
          </p>
        }
        @if (error(); as e) {
          <p class="note" style="color:var(--danger)">{{ e }}</p>
        }
        <button
          type="submit"
          class="btn primary block"
          style="margin-top:var(--s-3)"
          [attr.aria-disabled]="busy()"
        >
          {{ busy() ? "Sending…" : "Send reset link" }}
        </button>
      </form>
      <a
        routerLink="/login"
        class="btn ghost block"
        style="margin-top:var(--s-3)"
        >Back to sign in</a
      >
    </main>
  `,
})
export class ResetPasswordComponent {
  private readonly authFlow = inject(AuthFlowDataService);
  private readonly logger = inject(LoggerService);

  readonly email = signal("");
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    const email = this.email().trim();
    if (this.busy() || !email) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const { error } = await this.authFlow.resetPasswordForEmail({
        email,
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error)
        this.error.set(error.message ?? "Couldn't send the reset link.");
      else this.sent.set(true);
    } catch (e) {
      this.logger.error("reset_password_failed", e);
      this.error.set("Couldn't send the reset link.");
    } finally {
      this.busy.set(false);
    }
  }
}
