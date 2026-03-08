import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from "@angular/core";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { InputText } from "primeng/inputtext";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { AuthFlowDataService } from "../services/auth-flow-data.service";
import {
  getFormControlError,
  markFormGroupTouched,
} from "../../../shared/utils/form.utils";

type LoginForm = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
  remember: FormControl<boolean>;
}>;

@Component({
  selector: "app-login",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonComponent,
    CardShellComponent,
    InputText,
  ],
  template: `
<div class="login-page elite-auth-shell">
      <app-card-shell class="login-card elite-auth-card elite-auth-card--login">
        <div class="elite-auth-intro">
          <div class="login-logo elite-auth-logo">
            <i class="pi pi-activity"></i>
          </div>
          <span class="elite-auth-kicker">Welcome Back</span>
          <h1 class="login-title elite-auth-title">Sign in to FlagFit Pro</h1>
          <p class="elite-auth-subtitle">
            Access your training plan, readiness, and daily protocol from one
            place.
          </p>
        </div>

        @if (isDemoMode()) {
          <div class="alert alert--info elite-auth-note">
            <strong>Local Development:</strong> You're running on localhost.
            Sign in still requires a reachable auth backend and valid test
            credentials.
          </div>
        }

        <form
          [formGroup]="loginForm"
          (ngSubmit)="onSubmit()"
          class="elite-auth-form"
        >
          <input type="hidden" [value]="csrfToken()" />

          @if (submitError()) {
            <div
              class="form-error-summary form-error-summary--auth"
              role="alert"
              aria-live="polite"
            >
              <div class="form-error-summary__header">
                <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                <p class="form-error-summary__title">Unable to sign in</p>
              </div>
              <p class="form-error-summary__body">{{ submitError() }}</p>
            </div>
          }

          <div class="form-field elite-auth-field">
            <label for="email" class="form-label elite-auth-label required"
              >Email</label
            >
            <input
              id="email"
              type="email"
              pInputText
              formControlName="email"
              placeholder="Enter your email"
              data-testid="email-input"
              [class.ng-invalid]="emailError()"
              autocomplete="email"
              aria-required="true"
              [attr.aria-invalid]="emailError() ? 'true' : null"
              [attr.aria-describedby]="emailError() ? 'email-error' : null"
            />
            @if (emailError()) {
              <small id="email-error" class="form-error" role="alert">
                {{ emailError() }}
              </small>
            }
          </div>

          <div class="form-field elite-auth-field">
            <label for="password" class="form-label elite-auth-label required"
              >Password</label
            >
            <div class="password-field form-field__control">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                pInputText
                formControlName="password"
                placeholder="Enter your password"
                data-testid="password-input"
                [class.ng-invalid]="passwordError()"
                autocomplete="current-password"
                aria-required="true"
                [attr.aria-invalid]="passwordError() ? 'true' : null"
                [attr.aria-describedby]="
                  passwordError() ? 'password-error' : null
                "
              />
              <button
                type="button"
                class="form-field__toggle"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="
                  showPassword() ? 'Hide password' : 'Show password'
                "
              >
                <i
                  [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'"
                ></i>
              </button>
            </div>
            @if (passwordError()) {
              <small id="password-error" class="form-error" role="alert">
                {{ passwordError() }}
              </small>
            }
          </div>

          <div class="form-inline-split login-form-options">
            <label class="form-check" for="remember">
              <input
                type="checkbox"
                formControlName="remember"
                id="remember"
                class="form-check__input"
                [attr.aria-label]="'Remember me on this device'"
              />
              <span class="form-check__box" aria-hidden="true"></span>
              <span class="form-check__label">Remember me</span>
            </label>
            <a [routerLink]="['/reset-password']" class="forgot-link ui-inline-link">
              Forgot your password?
            </a>
          </div>

          <app-button
            type="submit"
            iconLeft="pi-lock"
            [loading]="isLoading()"
            [disabled]="!isFormValid() || isLoading()"
            [fullWidth]="true"
            class="elite-auth-sticky-cta"
            testId="login-submit"
            >Sign in</app-button
          >
        </form>

        <div class="login-divider elite-auth-divider">
          <span>New to FlagFit Pro?</span>
        </div>

        <a
          [routerLink]="['/register']"
          class="login-create-link elite-auth-link elite-auth-link--centered"
        >
          Create a new account
        </a>
      </app-card-shell>
    </div>
  `,
  styleUrl: "./login.component.scss",
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private authFlowDataService = inject(AuthFlowDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  loginForm: LoginForm;
  isLoading = signal(false);
  csrfToken = signal("");
  isDemoMode = signal(false);
  submitted = signal(false);
  showPassword = signal(false);
  submitError = signal<string | null>(null);

  // Track form validity as a signal (updated on statusChanges)
  formValid = signal(false);

  // Computed form state signals
  isFormValid = computed(() => this.formValid());
  emailError = computed(() => {
    const control = this.loginForm.get("email");
    return control && (this.submitted() || control.touched)
      ? getFormControlError(control)
      : null;
  });
  passwordError = computed(() => {
    const control = this.loginForm.get("password");
    return control && (this.submitted() || control.touched)
      ? getFormControlError(control)
      : null;
  });

  constructor() {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
      remember: [false],
    });

    // Track form status changes and update signal
    this.loginForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValid.set(this.loginForm.valid);
      });

    this.loginForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.submitError()) {
          this.submitError.set(null);
        }
      });

    // Don't auto-fill demo credentials - let user enter real credentials
    if (typeof window !== "undefined") {
      const demoMode =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      this.isDemoMode.set(demoMode);
      // Removed auto-fill of demo credentials
    }

    // Generate CSRF token
    this.csrfToken.set(this.authService.generateCsrfToken());

    // Watch form validity changes
    effect(() => {
      if (this.formValid() && this.submitted()) {
        // Form became valid after submission
        this.submitted.set(false);
      }
    });
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.checkAuth()) {
      this.router.navigate(["/dashboard"]);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    this.submitted.set(true);
    this.submitError.set(null);

    if (this.loginForm.invalid) {
      markFormGroupTouched(this.loginForm);
      this.submitError.set("Check the highlighted fields and try again.");
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.getRawValue();
    const normalizedCredentials = {
      ...credentials,
      email: credentials.email.trim().toLowerCase(),
    };

    this.authService
      .login(normalizedCredentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (response: { success?: boolean; error?: string }) => {
          if (response.success) {
            this.toastService.success(TOAST.SUCCESS.LOGIN_SUCCESS);
            this.submitError.set(null);
            // Check onboarding status before redirecting
            const user = this.authService.currentUser();
            if (user) {
              const { data: userData } =
                await this.authFlowDataService.getUserOnboardingStatus(user.id);

              const returnUrl = this.route.snapshot.queryParams["returnUrl"];

              // If onboarding not completed and no specific returnUrl, redirect to onboarding
              if (userData && !userData.onboarding_completed && !returnUrl) {
                this.router.navigate(["/onboarding"]);
              } else {
                this.router.navigateByUrl(returnUrl || "/dashboard");
              }
            } else {
              // Fallback to dashboard if user check fails
              const returnUrl = this.route.snapshot.queryParams["returnUrl"];
              this.router.navigateByUrl(returnUrl || "/dashboard");
            }
          } else {
            this.submitError.set(
              response.error ||
                "Your email or password was not accepted. Check your details and try again.",
            );
          }
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          this.submitError.set(
            getErrorMessage(
              error,
              "Login failed. Check your connection and try again.",
            ),
          );
          this.isLoading.set(false);
        },
      });
  }
}
