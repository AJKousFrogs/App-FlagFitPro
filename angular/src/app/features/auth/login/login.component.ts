import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  effect,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { CheckboxModule } from "primeng/checkbox";
import { MessageModule } from "primeng/message";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../core/services/auth.service";
import {
  getFormControlError,
  isFormControlInvalid,
  markFormGroupTouched,
} from "../../../shared/utils/form.utils";

@Component({
  selector: "app-login",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="login-page">
      <p-card class="login-card">
        <ng-template pTemplate="header">
          <div class="login-logo">
            <i class="pi pi-activity"></i>
          </div>
          <h1 class="login-title">Sign in to FlagFit Pro</h1>
        </ng-template>

        @if (isDemoMode()) {
          <div class="alert alert-info mb-4">
            <strong>Demo Mode:</strong> This login accepts any email and
            password for testing purposes.
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <input type="hidden" [value]="csrfToken()" />

          <div class="p-field mb-4">
            <label for="email" class="p-label required">Email</label>
            <input
              id="email"
              type="email"
              pInputText
              formControlName="email"
              placeholder="Enter your email"
              [class.ng-invalid]="emailError()"
              autocomplete="email"
            />
            @if (emailError()) {
              <small class="p-error">
                {{ emailError() }}
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
              placeholder="Enter your password"
              [class.ng-invalid]="passwordError()"
              autocomplete="current-password"
            />
            @if (passwordError()) {
              <small class="p-error">
                {{ passwordError() }}
              </small>
            }
          </div>

          <div class="login-form-options mb-4">
            <div class="flex align-items-center">
              <p-checkbox
                formControlName="remember"
                inputId="remember"
              ></p-checkbox>
              <label for="remember" class="ml-2">Remember me</label>
            </div>
            <a [routerLink]="['/reset-password']" class="text-primary"
              >Forgot your password?</a
            >
          </div>

          <p-button
            type="submit"
            label="Sign in"
            icon="pi pi-lock"
            [loading]="isLoading()"
            [disabled]="!isFormValid()"
            styleClass="w-full"
          >
          </p-button>
        </form>

        <div class="login-divider my-4">
          <span>Or</span>
        </div>

        <a [routerLink]="['/register']" class="login-create-link"
          >create a new account</a
        >
      </p-card>
    </div>
  `,
  styles: [
    `
      .login-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--space-6);
        background: var(--surface-secondary);
      }

      .login-card {
        width: 100%;
        max-width: 400px;
      }

      .login-logo {
        text-align: center;
        margin-bottom: var(--space-4);
        color: var(--color-brand-primary);
        font-size: 3rem;
      }

      .login-title {
        text-align: center;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
        margin-bottom: var(--space-6);
      }

      .login-form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .login-divider {
        text-align: center;
        position: relative;
        color: var(--text-secondary);
      }

      .login-divider::before,
      .login-divider::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 45%;
        height: 1px;
        background: var(--p-surface-200);
      }

      .login-divider::before {
        left: 0;
      }

      .login-divider::after {
        right: 0;
      }

      .login-create-link {
        display: block;
        text-align: center;
        color: var(--color-brand-primary);
        font-weight: 600;
        text-decoration: none;
      }

      .alert {
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
      }

      .alert-info {
        background: var(--p-primary-50);
        color: var(--p-primary-700);
      }

      .required::after {
        content: " *";
        color: var(--color-warning);
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm: FormGroup;
  isLoading = signal(false);
  csrfToken = signal("");
  isDemoMode = signal(false);
  submitted = signal(false);

  // Computed form state signals
  isFormValid = computed(() => this.loginForm.valid);
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

    // Check if demo mode
    if (typeof window !== "undefined") {
      const demoMode =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      this.isDemoMode.set(demoMode);

      if (demoMode) {
        this.loginForm.patchValue({
          email: "test@flagfitpro.com",
          password: "TestDemo123!",
        });
      }
    }

    // Generate CSRF token
    this.csrfToken.set(this.authService.generateCsrfToken());

    // Watch form validity changes
    effect(() => {
      if (this.loginForm.valid && this.submitted()) {
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

  isFieldInvalid(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return isFormControlInvalid(control as AbstractControl);
  }

  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    return getFormControlError(control as AbstractControl) || "";
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.loginForm.invalid) {
      markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.value;

    this.authService
      .login(credentials)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Login successful!",
            });
            this.router.navigate(["/dashboard"]);
          } else {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: response.error || "Invalid email or password",
            });
          }
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: error.message || "Login failed. Please try again.",
          });
          this.isLoading.set(false);
        },
      });
  }
}
