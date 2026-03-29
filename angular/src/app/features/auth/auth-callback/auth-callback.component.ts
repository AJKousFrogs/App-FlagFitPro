import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import { ProgressSpinner } from "primeng/progressspinner";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { AuthFlowDataService } from "../services/auth-flow-data.service";

/**
 * Auth Callback Component
 *
 * Universal authentication callback handler for Supabase.
 * Handles all auth flows that redirect back to the app:
 *
 * 1. OAuth (Google, GitHub, etc.) - type=oauth
 * 2. Magic Link login - type=magiclink
 * 3. Email verification - type=signup
 * 4. Password recovery - type=recovery
 * 5. Email change - type=email_change
 *
 * Supabase redirects to this page with tokens in the URL hash:
 * /auth/callback#access_token=...&refresh_token=...&type=...
 */
@Component({
  selector: "app-auth-callback",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ButtonComponent,
    CardShellComponent,
    ProgressSpinner,
    PageErrorStateComponent,
  ],
  template: `
<div class="auth-callback-page">
      <app-card-shell class="auth-callback-card">
        @if (isProcessing()) {
          <div class="processing-state">
            <p-progressSpinner
              strokeWidth="4"
              class="auth-callback-spinner"
            ></p-progressSpinner>
            <h2>{{ processingMessage() }}</h2>
            <p class="processing-description">Please wait...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <app-page-error-state
              title="Authentication failed"
              [message]="error() || 'We could not complete authentication.'"
              [showRetry]="false"
              helpText="Try signing in again or return home."
            />
            <div class="error-actions">
              <app-button
                iconLeft="pi-refresh"
                routerLink="/login"
                [fullWidth]="true"
                >Try Again</app-button
              >
              <app-button
                iconLeft="pi-home"
                variant="outlined"
                routerLink="/"
                [fullWidth]="true"
                >Go Home</app-button
              >
            </div>
          </div>
        } @else if (success()) {
          <div class="success-state">
            <div class="success-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h2>{{ successMessage() }}</h2>
            <p class="success-description">Redirecting you now...</p>
          </div>
        }
      </app-card-shell>
    </div>
  `,
  styleUrl: "./auth-callback.component.scss",
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authFlowDataService = inject(AuthFlowDataService);
  private logger = inject(LoggerService);

  isProcessing = signal(true);
  success = signal(false);
  error = signal<string | undefined>(undefined);
  processingMessage = signal("Completing authentication...");
  successMessage = signal("Authentication successful!");

  ngOnInit(): void {
    this.handleAuthCallback();
  }

  /**
   * Handle the authentication callback from Supabase
   */
  private async handleAuthCallback(): Promise<void> {
    const hash = window.location.hash;

    if (!hash || hash.length < 2) {
      // No hash fragment - check if already authenticated
      const session = this.authFlowDataService.getCurrentSession();
      if (session) {
        this.success.set(true);
        this.successMessage.set("You are already signed in!");
        setTimeout(() => {
          void this.redirectAfterAuth();
        }, 1500);
      } else {
        this.error.set(
          "No authentication data found. Please try signing in again.",
        );
        this.isProcessing.set(false);
      }
      return;
    }

    // Parse the hash fragment
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const errorDescription = params.get("error_description");
    const errorCode = params.get("error");

    // Check for errors from Supabase
    if (errorDescription || errorCode) {
      this.error.set(
        decodeURIComponent(
          errorDescription || errorCode || "Authentication failed",
        ),
      );
      this.isProcessing.set(false);
      return;
    }

    // Set processing message based on type
    this.setProcessingMessage(type);

    // Process the authentication
    if (accessToken && refreshToken) {
      await this.processTokens(accessToken, refreshToken, type);
    } else {
      this.error.set("Invalid authentication response. Please try again.");
      this.isProcessing.set(false);
    }
  }

  /**
   * Set appropriate processing message based on auth type
   */
  private setProcessingMessage(type: string | null): void {
    switch (type) {
      case "signup":
        this.processingMessage.set("Verifying your email...");
        break;
      case "recovery":
        this.processingMessage.set("Validating password reset...");
        break;
      case "magiclink":
        this.processingMessage.set("Signing you in...");
        break;
      case "email_change":
        this.processingMessage.set("Confirming email change...");
        break;
      default:
        this.processingMessage.set("Completing authentication...");
    }
  }

  /**
   * Process the tokens from Supabase
   */
  private async processTokens(
    accessToken: string,
    refreshToken: string,
    type: string | null,
  ): Promise<void> {
    try {
      this.logger.debug("[Auth] Processing auth callback", { type });

      // Set the session using the tokens
      const { data, error } = await this.authFlowDataService.setSession({
        accessToken,
        refreshToken,
      });

      if (error) {
        this.logger.error("[Auth] Session establishment failed", {
          error,
          type,
        });
        throw error;
      }

      if (!data?.session?.user) {
        this.logger.error("[Auth] No session returned from setSession", {
          type,
        });
        throw new Error("Failed to establish session");
      }

      this.logger.info("[Auth] Session established successfully", {
        userId: data.session.user.id,
        email: data.session.user.email,
        type,
      });

      // Clear the hash from the URL
      window.history.replaceState(null, "", window.location.pathname);

      // Handle different auth types
      await this.handleAuthType(type, data.session.user);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Authentication failed. Please try again.",
      );
      this.logger.error("[Auth] Token processing error", { error, type });
      this.error.set(message);
      this.isProcessing.set(false);
    }
  }

  /**
   * Handle different authentication types and redirect appropriately
   */
  private async handleAuthType(
    type: string | null,
    _user: { email?: string; email_confirmed_at?: string | null },
  ): Promise<void> {
    this.isProcessing.set(false);
    this.success.set(true);

    switch (type) {
      case "signup":
        this.successMessage.set("Email verified successfully!");
        this.toastService.success(
          "Your email has been verified. Welcome!",
          "Email Verified",
        );
        // Notify other tabs (like onboarding) that email is verified
        this.broadcastEmailVerified();
        // Check if user needs onboarding
        this.authFlowDataService.clearPendingVerificationEmail();
        setTimeout(
          () =>
            this.redirectAfterAuth({
              fallbackRoute: "/onboarding",
            }),
          1500,
        );
        break;

      case "recovery":
        this.successMessage.set("Password reset verified!");
        this.toastService.success(
          "Please set your new password.",
          "Reset Verified",
        );
        this.authFlowDataService.markPasswordRecoveryIntent();
        // Redirect to update password page
        setTimeout(() => this.router.navigate(["/update-password"]), 1500);
        break;

      case "magiclink":
        this.logger.info("[Auth] Magic link login successful", {
          userId: _user?.email,
          timestamp: new Date().toISOString(),
        });
        this.successMessage.set("Signed in successfully!");
        this.toastService.success(TOAST.SUCCESS.LOGIN, "Signed In");
        setTimeout(() => this.redirectAfterAuth(), 1500);
        break;

      case "email_change":
        this.successMessage.set("Email updated successfully!");
        this.toastService.success(
          "Your email has been changed.",
          "Email Updated",
        );
        setTimeout(() => this.router.navigate(["/settings"]), 1500);
        break;

      default:
        // OAuth or unknown type
        this.successMessage.set("Signed in successfully!");
        this.toastService.success(TOAST.SUCCESS.WELCOME, "Signed In");
        setTimeout(() => this.redirectAfterAuth(), 1500);
    }
  }

  /**
   * Redirect user after successful authentication
   * Checks if onboarding is needed
   */
  private async redirectAfterAuth(options?: {
    fallbackRoute?: string;
  }): Promise<void> {
    try {
      const destination = await this.authFlowDataService.resolvePostAuthRedirect(
        {
          fallbackRoute: options?.fallbackRoute,
        },
      );
      this.router.navigateByUrl(destination);
    } catch (error) {
      this.logger.warn("[Auth] Falling back to dashboard after callback", {
        error,
      });
      this.router.navigate([options?.fallbackRoute ?? "/dashboard"]);
    }
  }

  /**
   * Broadcast email verification to other tabs
   * This allows the onboarding tab to detect verification and proceed
   */
  private broadcastEmailVerified(): void {
    try {
      // Use BroadcastChannel API to notify other tabs
      const channel = new BroadcastChannel("flagfit-auth");
      channel.postMessage({ type: "EMAIL_VERIFIED", timestamp: Date.now() });
      channel.close();
    } catch (_error) {
      this.logger.debug(
        "[Auth] BroadcastChannel not supported; local storage fallback disabled",
      );
    }
  }
}
