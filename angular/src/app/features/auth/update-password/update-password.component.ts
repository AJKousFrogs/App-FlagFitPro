import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import {
  AbstractControl,
  NonNullableFormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { Password } from "primeng/password";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { AuthFlowDataService } from "../services/auth-flow-data.service";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    AlertComponent,
    ButtonComponent,
    Password,
  ],
  template: `
<div class="auth-shell-v2">

  <!-- LEFT — brand stage -->
  <aside class="auth-stage" aria-hidden="true">
    <div class="auth-stage__inner">
      <span class="auth-stage__eyebrow">
        <span class="auth-stage__eyebrow-dot"></span>
        FlagFit Pro · Secure update
      </span>
      <h2 class="auth-stage__title">
        New password,<br>
        new <span class="auth-stage__title-mark">access.</span>
      </h2>
      <p class="auth-stage__lead">
        Pick something strong. We hash it server-side; we never see the plain text.
      </p>
    </div>
  </aside>

  <!-- RIGHT — form -->
  <main class="auth-form-wrap">
    <div class="auth-form-v2">

      <header class="auth-form-v2__head">
        <h1 class="auth-form-v2__title">Set a new password.</h1>
        <p class="auth-form-v2__sub">Min 8 chars, with upper, lower, number, symbol.</p>
      </header>

      @if (isValidRecoverySession()) {
        <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()" class="auth-form-v2__form" novalidate>
          <div class="auth-field">
            <label for="password" class="auth-field__label">New password</label>
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
              [attr.aria-describedby]="isFieldInvalid('password') ? 'password-error' : null"
            ></p-password>
            @if (isFieldInvalid("password")) {
              <small id="password-error" class="auth-field__error" role="alert">{{ getFieldError("password") }}</small>
            }
            <small class="auth-field__hint">
              8+ chars · upper + lower + number + symbol (&commat; &#36; &#33; &#37; &#42; &#63; &amp;)
            </small>
          </div>

          <div class="auth-field">
            <label for="confirmPassword" class="auth-field__label">Confirm password</label>
            <p-password
              id="confirmPassword"
              formControlName="confirmPassword"
              placeholder="Repeat new password"
              [toggleMask]="true"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
              [class.ng-invalid]="isFieldInvalid('confirmPassword')"
              ariaLabel="Confirm new password"
              [attr.aria-describedby]="isFieldInvalid('confirmPassword') ? 'confirmPassword-error' : null"
            ></p-password>
            @if (isFieldInvalid("confirmPassword")) {
              <small id="confirmPassword-error" class="auth-field__error" role="alert">{{ getFieldError("confirmPassword") }}</small>
            }
          </div>

          <app-button
            type="submit"
            iconLeft="pi-check"
            [loading]="isLoading()"
            [disabled]="passwordForm.invalid"
            [fullWidth]="true"
          >Update password</app-button>
        </form>
      } @else if (isCheckingSession()) {
        <div class="auth-checking">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <p>Verifying your reset link…</p>
        </div>
      } @else {
        <div class="auth-invalid">
          <app-alert
            variant="error"
            message="This password reset link is invalid or has expired."
          />
          <p class="auth-invalid__hint">Please request a new password reset link.</p>
          <a [routerLink]="['/reset-password']" class="auth-link auth-link--bold">
            Request new reset link
          </a>
        </div>
      }

      <p class="auth-form-v2__footnote">
        Got it sorted?
        <a [routerLink]="['/login']" class="auth-link auth-link--bold">Back to sign in</a>
      </p>
    </div>
  </main>
</div>
  `,
  styleUrl: "./update-password.component.scss",
})
export class UpdatePasswordComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authFlowDataService = inject(AuthFlowDataService);
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
      const hasRecoveryHash = this.hasRecoveryTokensInHash();
      if (hasRecoveryHash) {
        this.authFlowDataService.markPasswordRecoveryIntent();
      }

      // Supabase automatically handles the hash fragment and establishes a session
      // when the page loads with recovery tokens
      const { data, error } = await this.authFlowDataService.getSession();
      const session = data.session;
      const hasRecoveryIntent =
        this.authFlowDataService.hasActivePasswordRecoveryIntent();

      if (error) {
        this.logger.error("Error checking recovery session:", error);
        this.authFlowDataService.clearPasswordRecoveryIntent();
        this.isValidRecoverySession.set(false);
        return;
      }

      // Only allow sessions that came from a real recovery flow.
      if (session && (hasRecoveryHash || hasRecoveryIntent)) {
        this.isValidRecoverySession.set(true);
        if (hasRecoveryHash) {
          this.toastService.info(TOAST.INFO.ENTER_NEW_PASSWORD);
        }
        return;
      }

      if (!session && hasRecoveryHash) {
        // No session - check if URL has recovery tokens that haven't been processed
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { data: retryData } = await this.authFlowDataService.getSession();
        const retrySession = retryData.session;
        const hasRetryIntent =
          this.authFlowDataService.hasActivePasswordRecoveryIntent();

        if (retrySession && hasRetryIntent) {
          this.isValidRecoverySession.set(true);
          this.toastService.info(TOAST.INFO.ENTER_NEW_PASSWORD);
          return;
        }
      }

      this.authFlowDataService.clearPasswordRecoveryIntent();
      this.isValidRecoverySession.set(false);
    } catch (err) {
      this.logger.error("Error in recovery session check:", err);
      this.authFlowDataService.clearPasswordRecoveryIntent();
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
    const hasSpecial = /[@$!%*?&]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

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
        return "Password must contain uppercase, lowercase, number, and special character (@ $ ! % * ? &)";
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
      const { error } = await this.authFlowDataService.updateAuthUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      this.toastService.success(
        "Password updated successfully! Redirecting to login...",
      );

      this.authFlowDataService.clearPasswordRecoveryIntent();

      // Sign out and redirect to login
      await this.authFlowDataService.signOut();

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

  private hasRecoveryTokensInHash(): boolean {
    const hash = window.location.hash;
    return (
      hash.includes("access_token") &&
      (hash.includes("type=recovery") ||
        hash.includes("type=password_recovery"))
    );
  }
}
