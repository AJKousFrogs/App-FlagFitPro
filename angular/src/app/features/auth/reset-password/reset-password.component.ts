import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";

import {
  NonNullableFormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { InputText } from "primeng/inputtext";

import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { AuthFlowDataService } from "../services/auth-flow-data.service";

@Component({
  selector: "app-reset-password",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    CardShellComponent,
    InputText,
  ],
  template: `
<div class="reset-password-page elite-auth-shell">
      <app-card-shell class="reset-password-card elite-auth-card elite-auth-card--reset">
        <div class="elite-auth-intro">
          <div class="reset-password-logo elite-auth-logo">
            <i class="pi pi-key"></i>
          </div>
          <span class="elite-auth-kicker">Account Recovery</span>
          <h1 class="reset-password-title elite-auth-title">Reset Password</h1>
          <p class="elite-auth-subtitle">
            Enter the email tied to your account and we’ll send you a secure
            reset link.
          </p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="elite-auth-form">
          <div class="form-field elite-auth-field">
            <label for="reset-email" class="p-label elite-auth-label required">Email</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              pInputText
              formControlName="email"
              placeholder="Enter your email"
              [class.ng-invalid]="isFieldInvalid('email')"
              autocomplete="email"
              aria-required="true"
              [attr.aria-invalid]="isFieldInvalid('email') ? 'true' : null"
              [attr.aria-describedby]="
                isFieldInvalid('email') ? 'reset-email-error' : null
              "
            />
            @if (isFieldInvalid("email")) {
              <small id="reset-email-error" class="form-error" role="alert">
                {{ getFieldError("email") }}
              </small>
            }
          </div>

          <app-button
            type="submit"
            iconLeft="pi-send"
            [loading]="isLoading()"
            [disabled]="resetForm.invalid"
            class="elite-auth-sticky-cta"
            [fullWidth]="true"
            >Send Reset Link</app-button
          >
        </form>

        <div class="reset-password-divider elite-auth-divider">
          <span>Or</span>
        </div>

        <a [routerLink]="['/login']" class="reset-password-login-link elite-auth-link elite-auth-link--centered"
          >Back to Sign In</a
        >
      </app-card-shell>
    </div>
  `,
  styleUrl: "./reset-password.component.scss",
})
export class ResetPasswordComponent {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authFlowDataService = inject(AuthFlowDataService);
  private logger = inject(LoggerService);

  resetForm: FormGroup;
  isLoading = signal(false);

  constructor() {
    this.resetForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.resetForm.get(fieldName);
    if (field?.hasError("required")) {
      return "Email is required";
    }
    if (field?.hasError("email")) {
      return "Please enter a valid email address";
    }
    return "";
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const email = this.resetForm.value.email;

    try {
      // Build the redirect URL for the update-password page
      const redirectTo = `${window.location.origin}/update-password`;

      const { error } = await this.authFlowDataService.resetPasswordForEmail({
        email,
        redirectTo,
      });

      if (error) {
        throw error;
      }

      this.toastService.success(
        "Password reset link sent! Check your email inbox.",
      );

      setTimeout(() => {
        this.router.navigate(["/login"]);
      }, 2000);
    } catch (error: unknown) {
      this.logger.error("Password reset error:", error);
      // Don't reveal if email exists or not for security
      this.toastService.success(
        "If an account exists with this email, you will receive a reset link.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
