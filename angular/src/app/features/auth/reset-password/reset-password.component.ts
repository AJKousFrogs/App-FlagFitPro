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
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";

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
    FormInputComponent,
  ],
  template: `
<div class="auth-shell-v2">

  <!-- LEFT — brand stage -->
  <aside class="auth-stage" aria-hidden="true">
    <div class="auth-stage__inner">
      <span class="auth-stage__eyebrow">
        <span class="auth-stage__eyebrow-dot"></span>
        FlagFit Pro · Account recovery
      </span>
      <h2 class="auth-stage__title">
        Locked out?<br>
        We've <span class="auth-stage__title-mark">got you.</span>
      </h2>
      <p class="auth-stage__lead">
        Enter the email tied to your account. We'll send a secure reset link in seconds.
      </p>
    </div>
  </aside>

  <!-- RIGHT — form -->
  <main class="auth-form-wrap">
    <div class="auth-form-v2">

      <header class="auth-form-v2__head">
        <h1 class="auth-form-v2__title">Reset your password.</h1>
        <p class="auth-form-v2__sub">We'll send a secure link to your inbox.</p>
      </header>

      <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form-v2__form" novalidate>
        <div class="auth-field">
          <app-form-input
            label="Email"
            formControlName="email"
            type="email"
            autocomplete="email"
            placeholder="you@team.com"
            styleClass="w-full"
          />
          @if (isFieldInvalid("email")) {
            <small id="reset-email-error" class="auth-field__error" role="alert">
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
        >Send reset link</app-button>
      </form>

      <p class="auth-form-v2__footnote">
        Remembered it?
        <a [routerLink]="['/login']" class="auth-link auth-link--bold">Back to sign in</a>
      </p>
    </div>
  </main>
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
