import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { Message } from "primeng/message";
import { PasswordModule } from "primeng/password";
import { ToastModule } from "primeng/toast";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { ButtonComponent } from "../../../shared/components/button/button.component";

/**
 * Update Password Component
 *
 * This component handles the password reset callback flow.
 * When a user clicks the "Reset Password" link in their email,
 * Supabase redirects them to this page with recovery tokens.
 * The user can then enter their new password.
 */
@Component({
  selector: "app-update-password",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonComponent,
    InputTextModule,
    PasswordModule,
    Message,
    ToastModule,
  ],
  template: `
    <p-toast></p-toast>
    <div class="update-password-page">
      <p-card class="update-password-card">
        <ng-template pTemplate="header">
          <div class="update-password-logo">
            <i class="pi pi-lock"></i>
          </div>
          <h1 class="update-password-title">Set New Password</h1>
          <p class="update-password-subtitle">Enter your new password below</p>
        </ng-template>

        @if (isValidRecoverySession()) {
          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
            <div class="p-field mb-4">
              <label for="password" class="p-label required"
                >New Password</label
              >
              <p-password
                id="password"
                formControlName="password"
                placeholder="Enter new password"
                [toggleMask]="true"
                [feedback]="true"
                styleClass="w-full"
                inputStyleClass="w-full"
                [class.ng-invalid]="isFieldInvalid('password')"
                ariaLabel="New password"
                [attr.aria-describedby]="
                  isFieldInvalid('password') ? 'password-error' : null
                "
              ></p-password>
              @if (isFieldInvalid("password")) {
                <small id="password-error" class="p-error" role="alert">
                  {{ getFieldError("password") }}
                </small>
              }
            </div>

            <div class="p-field mb-4">
              <label for="confirmPassword" class="p-label required"
                >Confirm Password</label
              >
              <p-password
                id="confirmPassword"
                formControlName="confirmPassword"
                placeholder="Confirm new password"
                [toggleMask]="true"
                [feedback]="false"
                styleClass="w-full"
                inputStyleClass="w-full"
                [class.ng-invalid]="isFieldInvalid('confirmPassword')"
                ariaLabel="Confirm new password"
                [attr.aria-describedby]="
                  isFieldInvalid('confirmPassword')
                    ? 'confirmPassword-error'
                    : null
                "
              ></p-password>
              @if (isFieldInvalid("confirmPassword")) {
                <small id="confirmPassword-error" class="p-error" role="alert">
                  {{ getFieldError("confirmPassword") }}
                </small>
              }
            </div>

            <app-button
              type="submit"
              iconLeft="pi-check"
              [loading]="isLoading()"
              [disabled]="passwordForm.invalid"
              [fullWidth]="true"
              >Update Password</app-button
            >
          </form>
        } @else if (isCheckingSession()) {
          <div class="checking-session">
            <i class="pi pi-spin pi-spinner icon-2xl"></i>
            <p>Verifying your reset link...</p>
          </div>
        } @else {
          <div class="invalid-session">
            <p-message severity="error" styleClass="status-message">
              This password reset link is invalid or has expired.
            </p-message>
            <p class="mb-4 mt-4">Please request a new password reset link.</p>
            <a [routerLink]="['/reset-password']" class="update-password-link">
              Request New Reset Link
            </a>
          </div>
        }

        <div class="update-password-divider my-4">
          <span>Or</span>
        </div>

        <a [routerLink]="['/login']" class="update-password-login-link">
          Back to Sign In
        </a>
      </p-card>
    </div>
  `,
  styleUrl: "./update-password.component.scss",
})
export class UpdatePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  passwordForm: FormGroup;
  isLoading = signal(false);
  isCheckingSession = signal(true);
  isValidRecoverySession = signal(false);

  constructor() {
    this.passwordForm = this.fb.group(
      {
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordStrengthValidator,
          ],
        ],
        confirmPassword: ["", [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );
  }

  async ngOnInit(): Promise<void> {
    // Check if we have a valid recovery session from the URL hash
    await this.checkRecoverySession();
  }

  private async checkRecoverySession(): Promise<void> {
    this.isCheckingSession.set(true);

    try {
      // Supabase automatically handles the hash fragment and establishes a session
      // when the page loads with recovery tokens
      const {
        data: { session },
        error,
      } = await this.supabaseService.client.auth.getSession();

      if (error) {
        this.logger.error("Error checking recovery session:", error);
        this.isValidRecoverySession.set(false);
        return;
      }

      // Check if we have a session (Supabase creates one from recovery tokens)
      if (session) {
        // Additional check: see if URL contains recovery type
        const hash = window.location.hash;
        const isRecoveryFlow =
          hash.includes("type=recovery") ||
          hash.includes("type=password_recovery");

        // If we have a session, we can proceed (either from recovery or existing session)
        this.isValidRecoverySession.set(true);

        if (isRecoveryFlow) {
          this.toastService.info(TOAST.INFO.ENTER_NEW_PASSWORD);
        }
      } else {
        // No session - check if URL has recovery tokens that haven't been processed
        const hash = window.location.hash;
        if (hash.includes("access_token") && hash.includes("type=recovery")) {
          // Tokens present but session not established - might need to wait
          // Try getting session again after a short delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const {
            data: { session: retrySession },
          } = await this.supabaseService.client.auth.getSession();

          this.isValidRecoverySession.set(!!retrySession);
        } else {
          this.isValidRecoverySession.set(false);
        }
      }
    } catch (err) {
      this.logger.error("Error in recovery session check:", err);
      this.isValidRecoverySession.set(false);
    } finally {
      this.isCheckingSession.set(false);
    }
  }

  // Custom validator for password strength
  private passwordStrengthValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric;

    return valid ? null : { passwordStrength: true };
  }

  // Validator to check if passwords match
  private passwordMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const password = group.get("password")?.value;
    const confirmPassword = group.get("confirmPassword")?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      group.get("confirmPassword")?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);

    if (fieldName === "password") {
      if (field?.hasError("required")) {
        return "Password is required";
      }
      if (field?.hasError("minlength")) {
        return "Password must be at least 8 characters";
      }
      if (field?.hasError("passwordStrength")) {
        return "Password must contain uppercase, lowercase, and a number";
      }
    }

    if (fieldName === "confirmPassword") {
      if (field?.hasError("required")) {
        return "Please confirm your password";
      }
      if (field?.hasError("passwordMismatch")) {
        return "Passwords do not match";
      }
    }

    return "";
  }

  async onSubmit(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const newPassword = this.passwordForm.value.password;

    try {
      const { error } = await this.supabaseService.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      this.toastService.success(
        "Password updated successfully! Redirecting to login...",
      );

      // Sign out and redirect to login
      await this.supabaseService.signOut();

      setTimeout(() => {
        this.router.navigate(["/login"]);
      }, 2000);
    } catch (error: unknown) {
      this.logger.error("Password update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update password";
      this.toastService.error(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }
}
