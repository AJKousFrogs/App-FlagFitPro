import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { ToastService } from "../../../core/services/toast.service";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { AuthFlowDataService } from "../services/auth-flow-data.service";

/**
 * Verify Email Component
 *
 * Handles email verification callback from Supabase.
 * When users click the verification link in their email, Supabase redirects
 * them here with tokens in the URL hash fragment.
 *
 * Flow:
 * 1. User clicks verification link in email
 * 2. Supabase redirects to /verify-email#access_token=...&type=signup
 * 3. This component detects the tokens and verifies the session
 * 4. User is redirected to dashboard on success
 */
@Component({
  selector: "app-verify-email",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ButtonComponent,
    AlertComponent,
    PageErrorStateComponent,
  ],

  template: `
<div class="auth-shell-v2">

  <!-- LEFT — brand stage -->
  <aside class="auth-stage" aria-hidden="true">
    <div class="auth-stage__inner">
      <span class="auth-stage__eyebrow">
        <span class="auth-stage__eyebrow-dot"></span>
        FlagFit Pro · Email verification
      </span>
      <h2 class="auth-stage__title">
        One click<br>
        from <span class="auth-stage__title-mark">in.</span>
      </h2>
      <p class="auth-stage__lead">
        Confirm your email and we'll drop you into onboarding to finish your athlete profile.
      </p>
    </div>
  </aside>

  <!-- RIGHT — verification state -->
  <main class="auth-form-wrap">
    <div class="auth-form-v2">

      <header class="auth-form-v2__head">
        <h1 class="auth-form-v2__title">Verify your email.</h1>
        <p class="auth-form-v2__sub">We sent you a link. Click it to continue.</p>
      </header>

      @if (isVerifying()) {
        <div class="auth-checking">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <p>Verifying your email address…</p>
        </div>
      } @else if (isVerified()) {
        <div class="auth-success">
          <app-alert
            variant="success"
            message="Email verified successfully!"
          />
          @if (showManualContinue()) {
            <p class="auth-success__msg">Your email is already verified. Continue when ready.</p>
            <app-button
              iconLeft="pi-arrow-right"
              (clicked)="continueToApp()"
              [fullWidth]="true"
            >Continue to app</app-button>
          } @else {
            <p class="auth-success__msg">
              Email verified. Next: onboarding, so we can finish your athlete profile.
            </p>
            <app-button
              iconLeft="pi-arrow-right"
              routerLink="/onboarding"
              [fullWidth]="true"
            >Continue to onboarding</app-button>
          }
        </div>
      } @else if (verificationError()) {
        <div class="auth-error">
          <app-page-error-state
            title="Unable to verify email"
            [message]="verificationError() || 'We could not verify this email link.'"
            [showRetry]="false"
            helpText="Request a new verification email or return to sign in."
          />
          <app-button
            iconLeft="pi-send"
            variant="outlined"
            (clicked)="resendVerification()"
            [loading]="isResending()"
            [fullWidth]="true"
          >Resend verification email</app-button>
        </div>
      } @else {
        <div class="auth-pending">
          <div class="auth-pending__icon" aria-hidden="true">
            <i class="pi pi-envelope"></i>
          </div>
          <p class="auth-pending__msg">
            We've sent a verification link to your inbox. Click it to verify your account before onboarding.
          </p>
          <app-button
            iconLeft="pi-send"
            variant="outlined"
            (clicked)="resendVerification()"
            [loading]="isResending()"
            [fullWidth]="true"
          >Resend verification email</app-button>
        </div>
      }

      <p class="auth-form-v2__footnote">
        Wrong account?
        <a [routerLink]="['/login']" class="auth-link auth-link--bold">Back to sign in</a>
      </p>
    </div>
  </main>
</div>
  `,
  styleUrl: "./verify-email.component.scss",
})
export class VerifyEmailComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authFlowDataService = inject(AuthFlowDataService);
  private homeRouteService = inject(HomeRouteService);

  isVerifying = signal(false);
  isVerified = signal(false);
  verificationError = signal<string | undefined>(undefined);
  isResending = signal(false);
  showManualContinue = signal(false);
  private userEmail = signal<string | null>(null);

  ngOnInit(): void {
    // Check for hash fragment from Supabase email verification
    // Supabase sends: /verify-email#access_token=...&type=signup&...
    this.handleSupabaseCallback();
  }

  /**
   * Handle Supabase email verification callback
   * Supabase redirects with tokens in the URL hash fragment
   */
  private async handleSupabaseCallback(): Promise<void> {
    const hash = window.location.hash;

    if (!hash || hash.length < 2) {
      // No hash fragment — user navigated here manually (not from email link).
      // Check if they're already authenticated and show a manual continue button
      // instead of auto-redirecting, so the user retains control.
      const session = this.authFlowDataService.getCurrentSession();
      if (session?.user?.email_confirmed_at) {
        this.isVerified.set(true);
        this.showManualContinue.set(true);
      }
      return;
    }

    // Parse the hash fragment
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const errorDescription = params.get("error_description");

    // Check for errors
    if (errorDescription) {
      this.verificationError.set(decodeURIComponent(errorDescription));
      return;
    }

    // Check if this is a signup/email verification callback
    if (type === "signup" || type === "email_change" || type === "magiclink") {
      if (accessToken && refreshToken) {
        await this.verifyWithTokens(accessToken, refreshToken);
      } else {
        this.verificationError.set(
          "Invalid verification link. Please request a new one.",
        );
      }
    }
  }

  /**
   * Verify the email using the tokens from Supabase
   */
  private async verifyWithTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    this.isVerifying.set(true);
    this.verificationError.set(undefined);

    try {
      // Set the session using the tokens from the URL
      const { data, error } = await this.authFlowDataService.setSession({
        accessToken,
        refreshToken,
      });

      if (error) {
        throw error;
      }

      if (data?.session?.user) {
        // Store the email for potential resend
        this.userEmail.set(data.session.user.email ?? null);

        // Check if email is now confirmed
        if (data.session.user.email_confirmed_at) {
          this.isVerified.set(true);
          this.toastService.success(
            "Your email has been verified successfully!",
            "Email Verified",
          );

          // Clear the hash from the URL
          window.history.replaceState(null, "", window.location.pathname);

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            this.authFlowDataService.clearPendingVerificationEmail();
            void this.redirectAfterVerification(true);
          }, 2000);
        } else {
          // Email not confirmed yet (shouldn't happen normally)
          this.verificationError.set(
            "Email verification pending. Please try again.",
          );
        }
      } else {
        this.verificationError.set(
          "Verification failed. The link may have expired.",
        );
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Verification failed. Please try again.",
      );
      this.verificationError.set(message);
    } finally {
      this.isVerifying.set(false);
    }
  }

  /**
   * Manual navigation: user was already verified, let them navigate themselves
   */
  async continueToApp(): Promise<void> {
    await this.redirectAfterVerification(false);
  }

  /**
   * Resend verification email
   */
  async resendVerification(): Promise<void> {
    this.isResending.set(true);

    try {
      // Get email from current user or stored email
      const email =
        this.userEmail() ||
        this.authFlowDataService.getPendingVerificationEmail() ||
        this.authFlowDataService.getCurrentUser()?.email ||
        null;

      if (!email) {
        this.toastService.error(
          "No email address found. Please try logging in again.",
        );
        this.router.navigate(["/login"]);
        return;
      }

      // Resend verification email using Supabase
      const { error } = await this.authFlowDataService.resendVerificationEmail({
        email,
        redirectTo: this.authFlowDataService.getEmailVerificationRedirectUrl(),
      });

      if (error) {
        throw error;
      }

      this.toastService.success(
        "Verification email has been sent. Please check your inbox.",
        "Email Sent",
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to send verification email. Please try again.",
      );
      this.toastService.error(message);
    } finally {
      this.isResending.set(false);
    }
  }

  private async redirectAfterVerification(
    preferOnboarding: boolean,
  ): Promise<void> {
    try {
      const destination = await this.authFlowDataService.resolvePostAuthRedirect(
        {
          fallbackRoute: preferOnboarding
            ? "/onboarding"
            : this.homeRouteService.getHomeRoute(),
        },
      );
      this.router.navigateByUrl(destination);
    } catch {
      this.router.navigateByUrl(
        preferOnboarding ? "/onboarding" : this.homeRouteService.getHomeRoute(),
      );
    }
  }
}
