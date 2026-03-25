import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import { ToastService } from "../../../core/services/toast.service";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
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
    CardShellComponent,
    PageErrorStateComponent,
  ],

  template: `
<div class="verify-email-page">
      <app-card-shell class="verify-email-card">
        <div class="verify-email-intro">
          <div class="verify-email-logo">
            <i class="pi pi-envelope"></i>
          </div>
          <h1 class="verify-email-title">Verify Your Email</h1>
        </div>

        @if (isVerifying()) {
          <div class="verifying-state">
            <app-alert
              variant="info"
              message="Verifying your email address..."
              styleClass="status-message"
            />
          </div>
        } @else if (isVerified()) {
          <div class="verified-state">
            <app-alert
              variant="success"
              message="Email verified successfully!"
              styleClass="status-message status-message--success"
            />
            <p class="verified-message">
              Your email has been verified. We’ll take you straight into
              onboarding so you can finish setting up your profile.
            </p>
            <app-button
              iconLeft="pi-arrow-right"
              routerLink="/onboarding"
              [fullWidth]="true"
              >Continue to Onboarding</app-button
            >
          </div>
        } @else if (verificationError()) {
          <div class="error-state">
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
              >Resend Verification Email</app-button
            >
            <a [routerLink]="['/login']" class="back-to-login-link mt-4"
              >Back to Sign In</a
            >
          </div>
        } @else {
          <div class="pending-state">
            <app-alert
              variant="warning"
              message="Please check your email"
              styleClass="status-message"
            />
            <p class="pending-message">
              We've sent a verification link to your email address. Please click
              the link to verify your account before starting onboarding.
            </p>
            <app-button
              iconLeft="pi-send"
              variant="outlined"
              (clicked)="resendVerification()"
              [loading]="isResending()"
              [fullWidth]="true"
              >Resend Verification Email</app-button
            >
            <a [routerLink]="['/login']" class="back-to-login-link mt-4"
              >Back to Sign In</a
            >
          </div>
        }
      </app-card-shell>
    </div>
  `,
  styleUrl: "./verify-email.component.scss",
})
export class VerifyEmailComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authFlowDataService = inject(AuthFlowDataService);

  isVerifying = signal(false);
  isVerified = signal(false);
  verificationError = signal<string | undefined>(undefined);
  isResending = signal(false);
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
      // No hash fragment - user landed here directly
      // Check if they're already authenticated
      const session = this.authFlowDataService.getCurrentSession();
      if (session?.user?.email_confirmed_at) {
        this.isVerified.set(true);
        setTimeout(() => {
          void this.redirectAfterVerification(false);
        }, 2000);
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
          fallbackRoute: preferOnboarding ? "/onboarding" : "/dashboard",
        },
      );
      this.router.navigateByUrl(destination);
    } catch {
      this.router.navigate([preferOnboarding ? "/onboarding" : "/dashboard"]);
    }
  }
}
