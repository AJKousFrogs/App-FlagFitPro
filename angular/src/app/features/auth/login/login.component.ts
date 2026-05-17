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
import { HomeRouteService } from "../../../core/services/home-route.service";
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
<div class="auth-shell-v2">

  <!-- LEFT — brand stage (visible on desktop, top section on mobile) -->
  <aside class="auth-stage" aria-hidden="true">
    <div class="auth-stage__inner">
      <span class="auth-stage__eyebrow">
        <span class="auth-stage__eyebrow-dot"></span>
        FlagFit Pro · Performance platform
      </span>
      <h2 class="auth-stage__title">
        Train smarter.<br>
        Win <span class="auth-stage__title-mark">Sundays.</span>
      </h2>
      <p class="auth-stage__lead">
        Real-time readiness, ACWR injury monitoring, playbook quiz, premium analytics
        — for serious flag football programs.
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
        <h1 class="auth-form-v2__title">Welcome back.</h1>
        <p class="auth-form-v2__sub">Sign in to pick up where you left off.</p>
      </header>

      @if (isDemoMode()) {
        <div class="auth-note" role="note">
          <strong>Local environment.</strong> Real auth backend — use valid credentials.
        </div>
      }

      <form
        [formGroup]="loginForm"
        (ngSubmit)="onSubmit()"
        class="auth-form-v2__form"
        novalidate
      >
        <input type="hidden" [value]="csrfToken()" />

        @if (submitError()) {
          <div class="auth-form-v2__error" role="alert" aria-live="polite">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            <div>
              <strong>Unable to sign in</strong>
              <p>{{ submitError() }}</p>
            </div>
          </div>
        }

        <div class="auth-field">
          <app-form-input
            label="Email"
            formControlName="email"
            type="email"
            autocomplete="email"
            placeholder="you@team.com"
            data-testid="email-input"
            styleClass="w-full"
          />
          @if (emailError()) {
            <small id="email-error" class="auth-field__error" role="alert">
              {{ emailError() }}
            </small>
          }
        </div>

        <div class="auth-field">
          <app-form-input
            label="Password"
            formControlName="password"
            type="password"
            placeholder="At least 8 characters"
            data-testid="password-input"
            styleClass="w-full"
          />
          @if (passwordError()) {
            <small id="password-error" class="auth-field__error" role="alert">
              {{ passwordError() }}
            </small>
          }
        </div>

        <div class="auth-form-v2__row">
          <label class="auth-check" for="remember">
            <input
              type="checkbox"
              formControlName="remember"
              id="remember"
              class="auth-check__input"
            />
            <span class="auth-check__box" aria-hidden="true"></span>
            <span class="auth-check__label">Remember me</span>
          </label>
          <a [routerLink]="['/reset-password']" class="auth-link">
            Forgot password?
          </a>
        </div>

        <app-button
          type="submit"
          iconLeft="pi-lock"
          [loading]="isLoading()"
          [disabled]="!formValid() || isLoading()"
          [fullWidth]="true"
          testId="login-submit"
        >Sign in</app-button>
      </form>

      <p class="auth-form-v2__footnote">
        New here?
        <a [routerLink]="['/register']" class="auth-link auth-link--bold">Create an account</a>
      </p>
    </div>
  </main>
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
  private homeRouteService = inject(HomeRouteService);
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
      await this.router.navigateByUrl(this.homeRouteService.getHomeRoute());
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
