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
            />
            @if (isFieldInvalid("name")) {
              <small class="p-error">
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
            />
            @if (isFieldInvalid("email")) {
              <small class="p-error">
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
            />
            @if (isFieldInvalid("password")) {
              <small class="p-error">
                {{ getFieldError("password") }}
              </small>
            }
            <small class="p-text-secondary mt-2">
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
            />
            @if (isFieldInvalid("confirmPassword")) {
              <small class="p-error">
                {{ getFieldError("confirmPassword") }}
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
    `,
  ],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

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
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success("Account created successfully!");
            this.router.navigate(["/dashboard"]);
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
