import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { Card } from "primeng/card";
import { InputText } from "primeng/inputtext";

import { Toast } from "primeng/toast";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";

@Component({
  selector: "app-reset-password",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    Card,
    ButtonComponent,
    InputText,
    Toast
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

          <app-button
            type="submit"
            iconLeft="pi-send"
            [loading]="isLoading()"
            [disabled]="resetForm.invalid"
            [fullWidth]="true"
            >Send Reset Link</app-button
          >
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
  styleUrl: "./reset-password.component.scss",
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
