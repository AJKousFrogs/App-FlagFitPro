import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
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
              [class.ng-invalid]="isFieldInvalid('name')">
            <small class="p-error" *ngIf="isFieldInvalid('name')">
              {{ getFieldError('name') }}
            </small>
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
              placeholder="Create a password"
              [class.ng-invalid]="isFieldInvalid('password')"
              autocomplete="new-password">
            <small class="p-error" *ngIf="isFieldInvalid('password')">
              {{ getFieldError('password') }}
            </small>
            <small class="p-text-secondary mt-2">
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </small>
          </div>

          <div class="p-field mb-4">
            <label for="confirmPassword" class="p-label required">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              pInputText
              formControlName="confirmPassword"
              placeholder="Confirm your password"
              [class.ng-invalid]="isFieldInvalid('confirmPassword')"
              autocomplete="new-password">
            <small class="p-error" *ngIf="isFieldInvalid('confirmPassword')">
              {{ getFieldError('confirmPassword') }}
            </small>
          </div>

          <p-button
            type="submit"
            label="Create Account"
            icon="pi pi-user-plus"
            [loading]="isLoading()"
            [disabled]="registerForm.invalid"
            styleClass="w-full mb-4">
          </p-button>
        </form>

        <div class="register-divider my-4">
          <span>Or</span>
        </div>

        <a [routerLink]="['/login']" class="register-login-link">Already have an account? Sign in</a>
      </p-card>
    </div>
  `,
  styles: [`
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
      content: '';
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
      content: ' *';
      color: var(--color-warning);
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  registerForm: FormGroup;
  isLoading = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    if (field?.hasError('pattern')) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    if (field?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const registerData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Account created successfully!'
          });
          this.router.navigate(['/dashboard']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.error || 'Registration failed'
          });
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Registration failed. Please try again.'
        });
        this.isLoading.set(false);
      }
    });
  }
}

