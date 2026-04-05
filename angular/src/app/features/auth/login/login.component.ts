import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
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
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import {
  AuthService,
  AuthSessionResult,
} from "../../../core/services/auth.service";
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
    FormInputComponent,
  ],
  template: `
<div class="login-page elite-auth-shell">
      <app-card-shell class="login-card elite-auth-card elite-auth-card--login">
        <div class="elite-auth-intro">
          <div class="login-logo elite-auth-logo">
            <i class="pi pi-flag-fill"></i>
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
            <app-form-input
              label="Email"
              formControlName="email"
              type="email"
              autocomplete="email"
              placeholder="Enter your email"
              data-testid="email-input"
              styleClass="w-full"
            />
            @if (emailError()) {
              <small id="email-error" class="form-error" role="alert">
                {{ emailError() }}
              </small>
            }
          </div>

          <div class="form-field elite-auth-field">
            <app-form-input
              label="Password"
              formControlName="password"
              type="password"
              placeholder="Enter your password"
              data-testid="password-input"
              styleClass="w-full"
            />
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
export class LoginComponent implements OnInit {
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
      void this.redirectAuthenticatedUser();
    }
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
        next: (result) => {
          void this.handleSuccessfulLogin(result);
        },
        error: (error: Error) => {
          void this.handleLoginError(error);
        },
      });
  }

  private async handleSuccessfulLogin(result: AuthSessionResult): Promise<void> {
    try {
      if (!result.user.emailConfirmed) {
        await this.routeToEmailVerification(result.user.email);
        return;
      }

      this.toastService.success(TOAST.SUCCESS.LOGIN_SUCCESS);
      this.submitError.set(null);
      const destination = await this.authFlowDataService.resolvePostAuthRedirect(
        {
          returnUrl: this.route.snapshot.queryParams["returnUrl"] ?? null,
          allowReturnUrlBypassOnboarding: true,
        },
      );

      this.router.navigateByUrl(destination);
    } catch (error) {
      this.submitError.set(
        getErrorMessage(
          error,
          "Login succeeded, but we could not finish loading your profile.",
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private async handleLoginError(error: Error): Promise<void> {
    const message = getErrorMessage(
      error,
      "Login failed. Check your connection and try again.",
    );

    if (this.isEmailVerificationError(message)) {
      await this.routeToEmailVerification(
        this.loginForm.getRawValue().email.trim().toLowerCase(),
      );
      return;
    }

    this.submitError.set(message);
    this.isLoading.set(false);
  }

  private async redirectAuthenticatedUser(): Promise<void> {
    const currentUser = this.authService.getUser();
    if (!currentUser) {
      return;
    }

    if (currentUser.emailConfirmed === false) {
      await this.routeToEmailVerification(currentUser.email);
      return;
    }

    try {
      const destination = await this.authFlowDataService.resolvePostAuthRedirect(
        {
          returnUrl: this.route.snapshot.queryParams["returnUrl"] ?? null,
          allowReturnUrlBypassOnboarding: true,
        },
      );
      await this.router.navigateByUrl(destination);
    } catch {
      await this.router.navigate(["/dashboard"]);
    }
  }

  private async routeToEmailVerification(email: string): Promise<void> {
    this.authFlowDataService.storePendingVerificationEmail(email);
    try {
      await this.authFlowDataService.signOut();
    } catch {
      // Continue to the verification screen even if local sign-out cleanup fails.
    }
    this.submitError.set(null);
    this.toastService.info(
      "Please verify your email before signing in.",
      "Verify Your Email",
    );
    await this.router.navigate(["/verify-email"]);
    this.isLoading.set(false);
  }

  private isEmailVerificationError(message: string): boolean {
    return /verify your email|email (not )?confirmed/i.test(message);
  }
}
