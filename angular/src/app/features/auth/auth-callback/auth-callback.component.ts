import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { MessageModule } from "primeng/message";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CardModule,
    ButtonComponent,
    MessageModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  template: `
    <p-toast></p-toast>
    <div class="auth-callback-page">
      <p-card class="auth-callback-card">
        @if (isProcessing()) {
          <div class="processing-state">
            <p-progressSpinner
              strokeWidth="4"
              [style]="{ width: '50px', height: '50px' }"
            ></p-progressSpinner>
            <h2>{{ processingMessage() }}</h2>
            <p class="processing-description">Please wait...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <div class="error-icon">
              <i class="pi pi-times-circle"></i>
            </div>
            <h2>Authentication Failed</h2>
            <p-message severity="error" [text]="error()"></p-message>
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
      </p-card>
    </div>
  `,
  styleUrl: "./auth-callback.component.scss",
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);

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
      const session = this.supabaseService.getSession();
      if (session) {
        this.success.set(true);
        this.successMessage.set("You are already signed in!");
        setTimeout(() => this.router.navigate(["/dashboard"]), 1500);
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
      // Set the session using the tokens
      const { data, error } = await this.supabaseService.client.auth.setSession(
        {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      );

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("Failed to establish session");
      }

      // Clear the hash from the URL
      window.history.replaceState(null, "", window.location.pathname);

      // Handle different auth types
      await this.handleAuthType(type, data.session.user);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.";
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
        // Check if user needs onboarding
        setTimeout(() => this.redirectAfterAuth(), 1500);
        break;

      case "recovery":
        this.successMessage.set("Password reset verified!");
        this.toastService.success(
          "Please set your new password.",
          "Reset Verified",
        );
        // Redirect to update password page
        setTimeout(() => this.router.navigate(["/update-password"]), 1500);
        break;

      case "magiclink":
        this.successMessage.set("Signed in successfully!");
        this.toastService.success("Welcome back!", "Signed In");
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
        this.toastService.success("Welcome!", "Signed In");
        setTimeout(() => this.redirectAfterAuth(), 1500);
    }
  }

  /**
   * Redirect user after successful authentication
   * Checks if onboarding is needed
   */
  private async redirectAfterAuth(): Promise<void> {
    const user = this.supabaseService.getCurrentUser();

    if (user) {
      // Check if user has completed onboarding
      const { data: userData } = await this.supabaseService.client
        .from("users")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (userData && !userData.onboarding_completed) {
        this.router.navigate(["/onboarding"]);
      } else {
        this.router.navigate(["/dashboard"]);
      }
    } else {
      this.router.navigate(["/dashboard"]);
    }
  }
}
