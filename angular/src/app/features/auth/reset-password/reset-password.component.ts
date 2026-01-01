import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ToastModule } from "primeng/toast";
import { ToastService } from "../../../core/services/toast.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-reset-password",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ToastModule,
  ],
  template: `
    <p-toast></p-toast>
    <div class="reset-password-page">
      <p-card class="reset-password-card">
        <ng-template pTemplate="header">
          <div class="reset-password-logo">
            <i class="pi pi-key"></i>
          </div>
          <h1 class="reset-password-title">Reset Password</h1>
        </ng-template>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
          <div class="p-field mb-4">
            <label for="reset-email" class="p-label required">Email</label>
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
              <small id="reset-email-error" class="p-error" role="alert">
                {{ getFieldError("email") }}
              </small>
            }
          </div>

          <p-button
            type="submit"
            label="Send Reset Link"
            icon="pi pi-send"
            [rounded]="true"
            [loading]="isLoading()"
            [disabled]="resetForm.invalid"
            styleClass="w-full mb-4"
          >
          </p-button>
        </form>

        <div class="reset-password-divider my-4">
          <span>Or</span>
        </div>

        <a [routerLink]="['/login']" class="reset-password-login-link"
          >Back to Sign In</a
        >
      </p-card>
    </div>
  `,
  styles: [
    `
      .reset-password-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--space-6);
        background: var(--surface-secondary);
      }

      .reset-password-card {
        width: 100%;
        max-width: 400px;
      }

      .reset-password-logo {
        text-align: center;
        margin-bottom: var(--space-4);
        color: var(--color-brand-primary);
        font-size: 3rem;
      }

      .reset-password-title {
        text-align: center;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
        margin-bottom: var(--space-6);
      }

      .reset-password-divider {
        text-align: center;
        position: relative;
        color: var(--text-secondary);
      }

      .reset-password-divider::before,
      .reset-password-divider::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 45%;
        height: 1px;
        background: var(--p-surface-200);
      }

      .reset-password-divider::before {
        left: 0;
      }

      .reset-password-divider::after {
        right: 0;
      }

      .reset-password-login-link {
        display: block;
        text-align: center;
        color: var(--color-brand-primary);
        font-weight: 600;
        text-decoration: none;
      }

      .required::after {
        content: " *";
        color: var(--color-warning);
      }
    `,
  ],
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);
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

      const { error } =
        await this.supabaseService.client.auth.resetPasswordForEmail(email, {
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
