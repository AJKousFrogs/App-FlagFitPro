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
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";

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
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

@Component({
  selector: "app-register",
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
        FlagFit Pro · Get started free
      </span>
      <h2 class="auth-stage__title">
        Train smarter.<br>
        Win <span class="auth-stage__title-mark">Sundays.</span>
      </h2>
      <p class="auth-stage__lead">
        Build your athlete profile in 60 seconds. Free during beta.
        No credit card. Cancel anytime.
      </p>
      <div class="auth-stage__metrics">
        <div class="auth-stage__metric">
          <div class="auth-stage__metric-num">&minus;42<small>%</small></div>
          <div class="auth-stage__metric-lab">injuries</div>
        </div>
        <div class="auth-stage__metric">
          <div class="auth-stage__metric-num">3.4&times;</div>
          <div class="auth-stage__metric-lab">efficiency</div>
        </div>
        <div class="auth-stage__metric">
          <div class="auth-stage__metric-num">87<small>%</small></div>
          <div class="auth-stage__metric-lab">adherence</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- RIGHT — form -->
  <main class="auth-form-wrap">
    <div class="auth-form-v2">

      <header class="auth-form-v2__head">
        <h1 class="auth-form-v2__title">Get started.</h1>
        <p class="auth-form-v2__sub">Free during beta. No credit card.</p>
      </header>

      <form
        [formGroup]="registerForm"
        (ngSubmit)="onSubmit()"
        class="auth-form-v2__form"
        novalidate
      >

        <div class="auth-field">
          <app-form-input
            label="Full Name"
            formControlName="name"
            placeholder="AJ Kous"
            autocomplete="name"
            data-testid="name-input"
            styleClass="w-full"
          />
          @if (isFieldInvalid("name")) {
            <small id="name-error" class="auth-field__error" role="alert">{{ getFieldError("name") }}</small>
          }
        </div>

        <div class="auth-field">
          <app-form-input
            label="Email"
            formControlName="email"
            type="email"
            placeholder="you@team.com"
            autocomplete="email"
            data-testid="email-input"
            styleClass="w-full"
          />
          @if (isFieldInvalid("email")) {
            <small id="register-email-error" class="auth-field__error" role="alert">{{ getFieldError("email") }}</small>
          }
        </div>

        <div class="auth-field">
          <app-form-input
            label="Password"
            formControlName="password"
            type="password"
            placeholder="At least 8 characters"
            autocomplete="new-password"
            data-testid="password-input"
            styleClass="w-full"
          />
          @if (isFieldInvalid("password")) {
            <small id="register-password-error" class="auth-field__error" role="alert">{{ getFieldError("password") }}</small>
          }
          <small class="auth-field__hint">
            8+ chars · upper + lower + number + symbol (&commat; &#36; &#33; &#37; &#42; &#63; &amp;)
          </small>
        </div>

        <div class="auth-field">
          <app-form-input
            label="Confirm Password"
            formControlName="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            autocomplete="new-password"
            data-testid="confirm-password-input"
            styleClass="w-full"
          />
          @if (isFieldInvalid("confirmPassword")) {
            <small id="register-confirmPassword-error" class="auth-field__error" role="alert">{{ getFieldError("confirmPassword") }}</small>
          }
        </div>

        <label class="auth-check" for="ageVerification">
          <input
            id="ageVerification"
            type="checkbox"
            formControlName="ageVerification"
            class="auth-check__input"
            data-testid="age-checkbox"
          />
          <span class="auth-check__box" aria-hidden="true"></span>
          <span class="auth-check__label">
            I'm <strong>16 or older</strong>
          </span>
        </label>
        @if (isFieldInvalid("ageVerification")) {
          <small class="auth-field__error">You must be 16 or older to use this app.</small>
        }

        <label class="auth-check" for="termsAccepted">
          <input
            id="termsAccepted"
            type="checkbox"
            formControlName="termsAccepted"
            class="auth-check__input"
            data-testid="terms-checkbox"
          />
          <span class="auth-check__box" aria-hidden="true"></span>
          <span class="auth-check__label">
            I agree to the
            <a href="/terms" target="_blank" class="auth-link">Terms</a>
            and
            <a href="/privacy-policy" target="_blank" class="auth-link">Privacy Policy</a>
          </span>
        </label>
        @if (isFieldInvalid("termsAccepted")) {
          <small class="auth-field__error">You must accept the Terms and Privacy Policy.</small>
        }

        <app-button
          type="submit"
          iconLeft="pi-user-plus"
          [loading]="isLoading()"
          [disabled]="registerForm.invalid || isLoading()"
          [fullWidth]="true"
          testId="register-submit"
        >Create account</app-button>
      </form>

      <p class="auth-form-v2__footnote">
        Already have an account?
        <a [routerLink]="['/login']" class="auth-link auth-link--bold">Sign in</a>
      </p>
    </div>
  </main>
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

    if (fieldName === "password") {
      const control = this.registerForm.get("password");
      if (control?.errors && control.touched) {
        if (control.errors["required"]) return "Password is required";
        if (control.errors["minlength"]) return "Password must be at least 8 characters";
        if (control.errors["pattern"]) {
          return "Must include uppercase, lowercase, number, and special character (@ $ ! % * ? &)";
        }
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
      redirectTo: this.authFlowDataService.getEmailVerificationRedirectUrl(),
    };

    this.authService
      .register(registerData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.ACCOUNT_CREATED);
          // Check for returnUrl (e.g., from team invitation)
          const returnUrl = this.route.snapshot.queryParams["returnUrl"];
          // New users should go to onboarding first, then returnUrl
          if (returnUrl && !returnUrl.includes("onboarding")) {
            this.authFlowDataService.storePostOnboardingRedirect(returnUrl);
          }
          this.authFlowDataService.storePendingVerificationEmail(rawEmail);
          this.router.navigate(["/verify-email"]);
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
