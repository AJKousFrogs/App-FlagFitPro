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
import { Card } from "primeng/card";

import { InputText } from "primeng/inputtext";

import { ButtonComponent } from "../../../shared/components/button/button.component";
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
    Card,
    ButtonComponent,
    InputText,

  ],
  template: `
<div class="login-page">
      <p-card class="login-card">
        <ng-template #header>
          <div class="login-logo">
            <i class="pi pi-activity"></i>
          </div>
          <h1 class="login-title">Sign in to FlagFit Pro</h1>
        </ng-template>

        @if (isDemoMode()) {
          <div class="alert alert-info">
            <strong>Demo Mode:</strong> This login accepts any email and
            password for testing purposes.
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <input type="hidden" [value]="csrfToken()" />

          <div class="form-field">
            <label for="email" class="form-label required">Email</label>
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
              <small id="email-error" class="p-error" role="alert">
                {{ emailError() }}
              </small>
            }
          </div>

          <div class="form-field">
            <label for="password" class="form-label required">Password</label>
            <div class="password-input-wrapper">
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
                class="password-toggle-btn"
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
              <small id="password-error" class="p-error" role="alert">
                {{ passwordError() }}
              </small>
            }
          </div>

          <div class="login-form-options">
            <label class="checkbox-wrapper" for="remember">
              <input
                type="checkbox"
                formControlName="remember"
                id="remember"
                [attr.aria-label]="'Remember me on this device'"
              />
              <span class="checkmark" aria-hidden="true"></span>
              <span class="checkbox-label">Remember me</span>
            </label>
            <a [routerLink]="['/reset-password']" class="forgot-link">
              Forgot your password?
            </a>
          </div>

          <app-button
            type="submit"
            iconLeft="pi-lock"
            [loading]="isLoading()"
            [disabled]="!isFormValid()"
            [fullWidth]="true"
            testId="login-submit"
            >Sign in</app-button
          >
        </form>

        <div class="login-divider">
          <span>Or</span>
        </div>

        <a [routerLink]="['/register']" class="login-create-link">
          create a new account
        </a>
      </p-card>
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
    this.submitted.set(true);

    if (this.loginForm.invalid) {
      markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.getRawValue();

    this.authService
      .login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (response: { success?: boolean; error?: string }) => {
          if (response.success) {
            this.toastService.success(TOAST.SUCCESS.LOGIN_SUCCESS);
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
            this.toastService.error(
              response.error || "Invalid email or password",
            );
          }
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          this.toastService.error(
            getErrorMessage(error, "Login failed. Please try again."),
          );
          this.isLoading.set(false);
        },
      });
  }
}
