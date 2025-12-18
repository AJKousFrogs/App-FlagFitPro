/**
 * Angular 21 Signal-Based Form Component
 * 
 * Demonstrates Angular 21's model() API for signal-based forms
 * Enhanced with accessibility features and improved DX
 */

import { Component, model, computed, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { FormValidators, combineValidators, createSignalFormField } from '../../utils/form.utils';

@Component({
  selector: 'app-signal-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
  ],
  template: `
    <p-card header="Angular 21 Signal Form (model() API)">
      <form (ngSubmit)="onSubmit()" [attr.aria-label]="'User registration form'">
        <!-- Name Field -->
        <div class="p-field mb-3">
          <label for="name" [class.required]="true">
            Name
          </label>
          <input
            id="name"
            type="text"
            pInputText
            [(ngModel)]="name"
            (blur)="nameField.touched.set(true)"
            [class.ng-invalid]="nameField.showError()"
            [attr.aria-invalid]="nameField.showError()"
            [attr.aria-describedby]="nameField.showError() ? 'name-error' : 'name-hint'"
            [attr.aria-required]="true"
            placeholder="Enter your name"
            autocomplete="name"
          />
          @if (nameField.showError()) {
            <small 
              id="name-error" 
              class="p-error" 
              role="alert"
              [attr.aria-live]="'polite'">
              {{ nameField.error() }}
            </small>
          } @else {
            <small id="name-hint" class="p-text-secondary">
              Enter your full name
            </small>
          }
        </div>

        <!-- Email Field -->
        <div class="p-field mb-3">
          <label for="email" [class.required]="true">
            Email
          </label>
          <input
            id="email"
            type="email"
            pInputText
            [(ngModel)]="email"
            (blur)="emailField.touched.set(true)"
            [class.ng-invalid]="emailField.showError()"
            [attr.aria-invalid]="emailField.showError()"
            [attr.aria-describedby]="emailField.showError() ? 'email-error' : 'email-hint'"
            [attr.aria-required]="true"
            placeholder="Enter your email"
            autocomplete="email"
          />
          @if (emailField.showError()) {
            <small 
              id="email-error" 
              class="p-error" 
              role="alert"
              [attr.aria-live]="'polite'">
              {{ emailField.error() }}
            </small>
          } @else {
            <small id="email-hint" class="p-text-secondary">
              We'll never share your email
            </small>
          }
        </div>

        <!-- Password Field -->
        <div class="p-field mb-3">
          <label for="password" [class.required]="true">
            Password
          </label>
          <input
            id="password"
            type="password"
            pInputText
            [(ngModel)]="password"
            (blur)="passwordField.touched.set(true)"
            [class.ng-invalid]="passwordField.showError()"
            [attr.aria-invalid]="passwordField.showError()"
            [attr.aria-describedby]="passwordField.showError() ? 'password-error' : 'password-hint'"
            [attr.aria-required]="true"
            placeholder="Enter your password"
            autocomplete="new-password"
          />
          @if (passwordField.showError()) {
            <small 
              id="password-error" 
              class="p-error" 
              role="alert"
              [attr.aria-live]="'polite'">
              {{ passwordField.error() }}
            </small>
          } @else {
            <small id="password-hint" class="p-text-secondary">
              Minimum 8 characters
            </small>
          }
        </div>

        <!-- Form Status -->
        <div 
          class="form-status mb-3" 
          role="status" 
          [attr.aria-live]="'polite'"
          [attr.aria-atomic]="true">
          <strong>Form Valid:</strong>
          <span [class.valid]="isFormValid()" [class.invalid]="!isFormValid()">
            {{ isFormValid() ? 'Yes' : 'No' }}
          </span>
        </div>

        <!-- Submit Button -->
        <p-button
          type="submit"
          label="Submit"
          [disabled]="!isFormValid()"
          [attr.aria-describedby]="!isFormValid() ? 'form-validation-info' : null"
        />
        @if (!isFormValid()) {
          <div id="form-validation-info" class="sr-only">
            Please fix the errors above before submitting
          </div>
        }
      </form>
    </p-card>
  `,
  styles: [`
    .form-status {
      padding: 0.5rem;
      background: var(--p-surface-50);
      border-radius: var(--p-border-radius);
    }

    .valid {
      color: var(--p-success-color);
      font-weight: 600;
    }

    .invalid {
      color: var(--p-error-color);
      font-weight: 600;
    }

    label.required::after {
      content: " *";
      color: var(--p-error-color);
      margin-left: 0.25rem;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    input:focus-visible {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 2px;
    }

    input[aria-invalid="true"] {
      border-color: var(--p-error-color);
    }
  `],
})
export class SignalFormComponent {
  // Form fields using Angular 21 model() API for two-way binding
  name = model<string>('');
  email = model<string>('');
  password = model<string>('');

  // Form submission event
  formSubmit = output<{ name: string; email: string; password: string }>();

  // Enhanced form fields with validation and accessibility
  nameField = createSignalFormField(
    () => this.name(),
    combineValidators(FormValidators.required)
  );

  emailField = createSignalFormField(
    () => this.email(),
    combineValidators(FormValidators.required, FormValidators.email)
  );

  passwordField = createSignalFormField(
    () => this.password(),
    combineValidators(FormValidators.required, FormValidators.minLength(8))
  );

  // Form validity (computed signal)
  isFormValid = computed(() => {
    return (
      !this.nameField.error() &&
      !this.emailField.error() &&
      !this.passwordField.error()
    );
  });

  // Form submission handler
  onSubmit(): void {
    // Mark all fields as touched for validation display
    this.nameField.touched.set(true);
    this.emailField.touched.set(true);
    this.passwordField.touched.set(true);

    if (this.isFormValid()) {
      const formData = {
        name: this.name(),
        email: this.email(),
        password: this.password(),
      };
      
      this.formSubmit.emit(formData);
      console.log('Form submitted:', formData);
    } else {
      // Focus first invalid field for accessibility
      this.focusFirstInvalidField();
    }
  }

  // Accessibility: Focus first invalid field
  private focusFirstInvalidField(): void {
    if (this.nameField.showError()) {
      document.getElementById('name')?.focus();
    } else if (this.emailField.showError()) {
      document.getElementById('email')?.focus();
    } else if (this.passwordField.showError()) {
      document.getElementById('password')?.focus();
    }
  }
}

