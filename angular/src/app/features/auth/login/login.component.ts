import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    MessageModule,
    ToastModule
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

        <div class="alert alert-info mb-4" *ngIf="isDemoMode">
          <strong>Demo Mode:</strong> This login accepts any email and password for testing purposes.
        </div>

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
              [class.ng-invalid]="isFieldInvalid('email')"
              autocomplete="email">
            <small class="p-error" *ngIf="isFieldInvalid('email')">
              {{ getFieldError('email') }}
            </small>
          </div>

          <div class="p-field mb-4">
            <label for="password" class="p-label required">Password</label>
            <input
              id="password"
              type="password"
              pInputText
              formControlName="password"
              placeholder="Enter your password"
              [class.ng-invalid]="isFieldInvalid('password')"
              autocomplete="current-password">
            <small class="p-error" *ngIf="isFieldInvalid('password')">
              {{ getFieldError('password') }}
            </small>
          </div>

          <div class="login-form-options mb-4">
            <div class="flex align-items-center">
              <p-checkbox formControlName="remember" inputId="remember"></p-checkbox>
              <label for="remember" class="ml-2">Remember me</label>
            </div>
            <a [routerLink]="['/reset-password']" class="text-primary">Forgot your password?</a>
          </div>

          <p-button
            type="submit"
            label="Sign in"
            icon="pi pi-lock"
            [loading]="isLoading()"
            [disabled]="loginForm.invalid"
            styleClass="w-full">
          </p-button>
        </form>

        <div class="login-divider my-4">
          <span>Or</span>
        </div>

        <a [routerLink]="['/register']" class="login-create-link">create a new account</a>
      </p-card>
    </div>
  `,
  styles: [`
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
      content: '';
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
      content: ' *';
      color: var(--color-warning);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm: FormGroup;
  isLoading = signal(false);
  csrfToken = signal('');
  isDemoMode = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false]
    });

    // Check if demo mode
    if (typeof window !== 'undefined') {
      this.isDemoMode = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
      
      if (this.isDemoMode) {
        this.loginForm.patchValue({
          email: 'test@flagfitpro.com',
          password: 'TestDemo123!'
        });
      }
    }

    // Generate CSRF token
    this.csrfToken.set(this.authService.generateCsrfToken());
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.checkAuth()) {
      this.router.navigate(['/dashboard']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Login successful!'
          });
          this.router.navigate(['/dashboard']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.error || 'Invalid email or password'
          });
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Login failed. Please try again.'
        });
        this.isLoading.set(false);
      }
    });
  }
}

