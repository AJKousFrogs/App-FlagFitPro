import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  NonNullableFormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { HttpBackend, HttpClient, HttpHeaders } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { InputText } from "primeng/inputtext";

import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { AuthFlowDataService } from "../services/auth-flow-data.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import {
  getFormControlError,
  isFormControlInvalid,
  markFormGroupTouched,
} from "../../../shared/utils/form.utils";

@Component({
  selector: "app-register",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    Card,
    ButtonComponent,
    InputText,

    Checkbox,
  ],
  template: `
<div class="register-page elite-auth-shell">
      <p-card class="register-card elite-auth-card elite-auth-card--register">
        <ng-template #header>
          <div class="register-logo elite-auth-logo">
            <i class="pi pi-activity"></i>
          </div>
          <h1 class="register-title elite-auth-title">Create Your Account</h1>
        </ng-template>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="p-field mb-4 elite-auth-field">
            <label for="register-name" class="p-label elite-auth-label">Full Name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              pInputText
              formControlName="name"
              placeholder="Enter your full name"
              autocomplete="name"
              maxlength="80"
              data-testid="name-input"
              [class.ng-invalid]="isFieldInvalid('name')"
              [attr.aria-invalid]="isFieldInvalid('name') ? 'true' : null"
              [attr.aria-describedby]="
                isFieldInvalid('name') ? 'name-error' : null
              "
            />
            @if (isFieldInvalid("name")) {
              <small id="name-error" class="p-error" role="alert">
                {{ getFieldError("name") }}
              </small>
            }
          </div>

          <div class="p-field mb-4 elite-auth-field">
            <label for="register-email" class="p-label elite-auth-label required">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              pInputText
              formControlName="email"
              placeholder="Enter your email"
              data-testid="email-input"
              [class.ng-invalid]="isFieldInvalid('email')"
              autocomplete="email"
              aria-required="true"
              [attr.aria-invalid]="isFieldInvalid('email') ? 'true' : null"
              [attr.aria-describedby]="
                isFieldInvalid('email') ? 'register-email-error' : null
              "
            />
            @if (isFieldInvalid("email")) {
              <small id="register-email-error" class="p-error" role="alert">
                {{ getFieldError("email") }}
              </small>
            }
          </div>

          <div class="p-field mb-4 elite-auth-field">
            <label for="register-password" class="p-label elite-auth-label required"
              >Password</label
            >
            <input
              id="register-password"
              name="password"
              type="password"
              pInputText
              formControlName="password"
              placeholder="Create a password"
              data-testid="password-input"
              [class.ng-invalid]="isFieldInvalid('password')"
              autocomplete="new-password"
              aria-required="true"
              [attr.aria-invalid]="isFieldInvalid('password') ? 'true' : null"
              [attr.aria-describedby]="
                isFieldInvalid('password')
                  ? 'register-password-error register-password-hint'
                  : 'register-password-hint'
              "
            />
            @if (isFieldInvalid("password")) {
              <small id="register-password-error" class="p-error" role="alert">
                {{ getFieldError("password") }}
              </small>
            }
            <small id="register-password-hint" class="p-text-secondary mt-2">
              Password must be at least 8 characters and include uppercase,
              lowercase, number, and special character.
            </small>
          </div>

          <div class="p-field mb-4 elite-auth-field">
            <label for="register-confirmPassword" class="p-label elite-auth-label required"
              >Confirm Password</label
            >
            <input
              id="register-confirmPassword"
              name="confirmPassword"
              type="password"
              pInputText
              formControlName="confirmPassword"
              placeholder="Confirm your password"
              data-testid="confirm-password-input"
              [class.ng-invalid]="isFieldInvalid('confirmPassword')"
              autocomplete="new-password"
              aria-required="true"
              [attr.aria-invalid]="
                isFieldInvalid('confirmPassword') ? 'true' : null
              "
              [attr.aria-describedby]="
                isFieldInvalid('confirmPassword')
                  ? 'register-confirmPassword-error'
                  : null
              "
            />
            @if (isFieldInvalid("confirmPassword")) {
              <small
                id="register-confirmPassword-error"
                class="p-error"
                role="alert"
              >
                {{ getFieldError("confirmPassword") }}
              </small>
            }
          </div>

          <div class="p-field mb-4">
            <div class="age-verification">
              <p-checkbox
                formControlName="ageVerification"
                [binary]="true"
                variant="filled"
                inputId="ageVerification"
                data-testid="age-checkbox"
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
                variant="filled"
                inputId="termsAccepted"
                data-testid="terms-checkbox"
              ></p-checkbox>
              <label for="termsAccepted" class="terms-label">
                I agree to the
                <a href="/terms" target="_blank">Terms of Service</a> and
                <a href="/privacy-policy" target="_blank">Privacy Policy</a>
              </label>
            </div>
            @if (isFieldInvalid("termsAccepted")) {
              <small class="p-error">
                You must accept the Terms and Privacy Policy
              </small>
            }
          </div>

          <app-button
            type="submit"
            iconLeft="pi-user-plus"
            [loading]="isLoading()"
            [disabled]="registerForm.invalid || isLoading()"
            [fullWidth]="true"
            class="elite-auth-sticky-cta"
            testId="register-submit"
            >Create Account</app-button
          >
        </form>

        <div class="register-divider my-4 elite-auth-divider">
          <span>Or</span>
        </div>

        <a [routerLink]="['/login']" class="register-login-link elite-auth-link elite-auth-link--centered"
          >Already have an account? Sign in</a
        >
      </p-card>
    </div>
  `,
  styleUrl: "./register.component.scss",
})
export class RegisterComponent {
  private readonly http = new HttpClient(inject(HttpBackend));
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private authFlowDataService = inject(AuthFlowDataService);
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
        name: ["", [Validators.required, Validators.maxLength(80)]],
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

  passwordMatchValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const password = control.get("password")?.value;
    const confirmPassword = control.get("confirmPassword")?.value;
    return password !== confirmPassword ? { passwordMismatch: true } : null;
  };

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return control ? isFormControlInvalid(control) : false;
  }

  getFieldError(fieldName: string): string {
    if (
      fieldName === "confirmPassword" &&
      this.registerForm.hasError("passwordMismatch")
    ) {
      const confirmControl = this.registerForm.get("confirmPassword");
      if (confirmControl && (confirmControl.touched || confirmControl.dirty)) {
        return "Passwords do not match";
      }
    }

    const control = this.registerForm.get(fieldName);
    return control ? getFormControlError(control) || "" : "";
  }

  async onSubmit(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    if (this.registerForm.invalid) {
      markFormGroupTouched(this.registerForm);
      return;
    }

    // Check password against leaked password database
    try {
      const password = this.registerForm.value.password;
      const supabaseUrl =
        (
          window as {
            _env?: { SUPABASE_URL?: string; VITE_SUPABASE_URL?: string };
          }
        )._env?.SUPABASE_URL ||
        (
          window as {
            _env?: { SUPABASE_URL?: string; VITE_SUPABASE_URL?: string };
          }
        )._env?.VITE_SUPABASE_URL;

      if (supabaseUrl) {
        // Get auth token if available
        let supabaseToken = null;
        try {
          const session = this.authFlowDataService.getCurrentSession();
          supabaseToken = session?.access_token || null;
        } catch (_e) {
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

        const result = await firstValueFrom(
          this.http.post<{ leaked?: boolean; message?: string }>(
            functionUrl,
            {
              action: "check",
              password: password,
            },
            { headers: new HttpHeaders(headers) },
          ),
        );

        if (result?.leaked) {
          this.toastService.error(
            result.message ||
              "This password has been found in data breaches. Please choose a different password.",
            "Password Security",
          );
          return;
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
    const rawName = String(this.registerForm.value.name || "").trim();
    const rawEmail = String(this.registerForm.value.email || "")
      .trim()
      .toLowerCase();
    const registerData = {
      name: rawName,
      email: rawEmail,
      password: this.registerForm.value.password,
    };

    this.authService
      .register(registerData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(TOAST.SUCCESS.ACCOUNT_CREATED);
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
            this.toastService.error(
              response.error || TOAST.ERROR.REGISTRATION_FAILED,
            );
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.error(
            getErrorMessage(error, "Registration failed. Please try again."),
          );
          this.isLoading.set(false);
        },
      });
  }
}
