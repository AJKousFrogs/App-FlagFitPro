import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";

import { Router, RouterModule, ActivatedRoute } from "@angular/router";
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
import { CheckboxModule } from "primeng/checkbox";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { LoggerService } from "../../../core/services/logger.service";
import {
  getFormControlError,
  isFormControlInvalid,
  markFormGroupTouched,
} from "../../../shared/utils/form.utils";

@Component({
  selector: "app-register",
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
    CheckboxModule,
  ],
  template: `
    <p-toast></p-toast>
    <div class="register-page">
      <p-card class="register-card">
        <ng-template pTemplate="header">
          <div class="register-logo">
            <i class="pi pi-activity"></i>
          </div>
          <h1 class="register-title">Create Your Account</h1>
        </ng-template>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="p-field mb-4">
            <label for="name" class="p-label">Full Name</label>
            <input
              id="name"
              type="text"
              pInputText
              formControlName="name"
              placeholder="Enter your full name"
              [class.ng-invalid]="isFieldInvalid('name')"
              [attr.aria-invalid]="isFieldInvalid('name') ? 'true' : null"
              [attr.aria-describedby]="isFieldInvalid('name') ? 'name-error' : null"
            />
            @if (isFieldInvalid("name")) {
              <small id="name-error" class="p-error" role="alert">
                {{ getFieldError("name") }}
              </small>
            }
          </div>

          <div class="p-field mb-4">
            <label for="email" class="p-label required">Email</label>
            <input
              id="email"
              type="email"
              pInputText
              formControlName="email"
              placeholder="Enter your email"
              [class.ng-invalid]="isFieldInvalid('email')"
              autocomplete="email"
              aria-required="true"
              [attr.aria-invalid]="isFieldInvalid('email') ? 'true' : null"
              [attr.aria-describedby]="isFieldInvalid('email') ? 'email-error' : null"
            />
            @if (isFieldInvalid("email")) {
              <small id="email-error" class="p-error" role="alert">
                {{ getFieldError("email") }}
              </small>
            }
          </div>

          <div class="p-field mb-4">
            <label for="password" class="p-label required">Password</label>
            <input
              id="password"
              type="password"
              pInputText
              formControlName="password"
              placeholder="Create a password"
              [class.ng-invalid]="isFieldInvalid('password')"
              autocomplete="new-password"
              aria-required="true"
              [attr.aria-invalid]="isFieldInvalid('password') ? 'true' : null"
              [attr.aria-describedby]="isFieldInvalid('password') ? 'password-error password-hint' : 'password-hint'"
            />
            @if (isFieldInvalid("password")) {
              <small id="password-error" class="p-error" role="alert">
                {{ getFieldError("password") }}
              </small>
            }
            <small id="password-hint" class="p-text-secondary mt-2">
              Password must be at least 8 characters and include uppercase,
              lowercase, number, and special character.
            </small>
          </div>

          <div class="p-field mb-4">
            <label for="confirmPassword" class="p-label required"
              >Confirm Password</label
            >
            <input
              id="confirmPassword"
              type="password"
              pInputText
              formControlName="confirmPassword"
              placeholder="Confirm your password"
              [class.ng-invalid]="isFieldInvalid('confirmPassword')"
              autocomplete="new-password"
              aria-required="true"
              [attr.aria-invalid]="isFieldInvalid('confirmPassword') ? 'true' : null"
              [attr.aria-describedby]="isFieldInvalid('confirmPassword') ? 'confirmPassword-error' : null"
            />
            @if (isFieldInvalid("confirmPassword")) {
              <small id="confirmPassword-error" class="p-error" role="alert">
                {{ getFieldError("confirmPassword") }}
              </small>
            }
          </div>

          <div class="p-field mb-4">
            <div class="age-verification">
              <p-checkbox
                formControlName="ageVerification"
                [binary]="true"
                inputId="ageVerification"
              ></p-checkbox>
              <label for="ageVerification" class="age-label">
                I confirm that I am <strong>16 years of age or older</strong>
              </label>
            </div>
            @if (isFieldInvalid("ageVerification")) {
              <small class="p-error">
                You must be 16 or older to use this app
              </small>
            }
          </div>

          <div class="p-field mb-4">
            <div class="terms-agreement">
              <p-checkbox
                formControlName="termsAccepted"
                [binary]="true"
                inputId="termsAccepted"
              ></p-checkbox>
              <label for="termsAccepted" class="terms-label">
                I agree to the <a href="/docs/terms" target="_blank">Terms of Service</a> 
                and <a href="/docs/privacy" target="_blank">Privacy Policy</a>
              </label>
            </div>
            @if (isFieldInvalid("termsAccepted")) {
              <small class="p-error">
                You must accept the Terms and Privacy Policy
              </small>
            }
          </div>

          <p-button
            type="submit"
            label="Create Account"
            icon="pi pi-user-plus"
            [loading]="isLoading()"
            [disabled]="registerForm.invalid"
            styleClass="w-full mb-4"
          >
          </p-button>
        </form>

        <div class="register-divider my-4">
          <span>Or</span>
        </div>

        <a [routerLink]="['/login']" class="register-login-link"
          >Already have an account? Sign in</a
        >
      </p-card>
    </div>
  `,
  styles: [
    `
      .register-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--space-6);
        background: var(--surface-secondary);
      }

      .register-card {
        width: 100%;
        max-width: 450px;
      }

      .register-logo {
        text-align: center;
        margin-bottom: var(--space-4);
        color: var(--color-brand-primary);
        font-size: 3rem;
      }

      .register-title {
        text-align: center;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
        margin-bottom: var(--space-6);
      }

      .register-divider {
        text-align: center;
        position: relative;
        color: var(--text-secondary);
      }

      .register-divider::before,
      .register-divider::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 45%;
        height: 1px;
        background: var(--p-surface-200);
      }

      .register-divider::before {
        left: 0;
      }

      .register-divider::after {
        right: 0;
      }

      .register-login-link {
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

      .age-verification,
      .terms-agreement {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .age-label,
      .terms-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        line-height: 1.5;
        cursor: pointer;
      }

      .age-label strong {
        color: var(--text-primary);
      }

      .terms-label a {
        color: var(--color-brand-primary);
        text-decoration: none;
        font-weight: 500;
      }

      .terms-label a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  registerForm: FormGroup;
  isLoading = signal(false);

  constructor() {
    this.registerForm = this.fb.group(
      {
        name: ["", [Validators.required]],
        email: ["", [Validators.required, Validators.email]],
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            ),
          ],
        ],
        confirmPassword: ["", [Validators.required]],
        ageVerification: [false, [Validators.requiredTrue]],
        termsAccepted: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return isFormControlInvalid(control!);
  }

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    return getFormControlError(control!) || "";
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      markFormGroupTouched(this.registerForm);
      return;
    }

    // Check password against leaked password database
    try {
      const password = this.registerForm.value.password;
      const supabaseUrl =
        (window as any)._env?.SUPABASE_URL ||
        (window as any)._env?.VITE_SUPABASE_URL;

      if (supabaseUrl) {
        // Get auth token if available
        let supabaseToken = null;
        try {
          const session = this.supabaseService.getSession();
          supabaseToken = session?.access_token || null;
        } catch (e) {
          // Token not available, continue without it
        }

        // Check password via Supabase Edge Function
        const functionUrl = `${supabaseUrl}/functions/v1/enable-leaked-password-protection`;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (supabaseToken) {
          headers["Authorization"] = `Bearer ${supabaseToken}`;
        }

        const response = await fetch(functionUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "check",
            password: password,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.leaked) {
            this.toastService.error(
              result.message ||
                "This password has been found in data breaches. Please choose a different password.",
              "Password Security"
            );
            return;
          }
        }
      }
    } catch (leakCheckError) {
      // Fail open - if leak check fails, continue with registration
      this.logger.warn(
        "Password leak check failed, continuing with registration:",
        leakCheckError,
      );
    }

    this.isLoading.set(true);
    const registerData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };

    this.authService
      .register(registerData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success("Account created successfully!");
            // Check for returnUrl (e.g., from team invitation)
            const returnUrl = this.route.snapshot.queryParams["returnUrl"];
            // New users should go to onboarding first, then returnUrl
            if (returnUrl && !returnUrl.includes("onboarding")) {
              // Store returnUrl for after onboarding
              sessionStorage.setItem("postOnboardingRedirect", returnUrl);
            }
            // Always send new users to onboarding first
            this.router.navigate(["/onboarding"]);
          } else {
            this.toastService.error(response.error || "Registration failed");
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.error(error.message || "Registration failed. Please try again.");
          this.isLoading.set(false);
        },
      });
  }
}
