import {
  Component,
  model,
  computed,
  signal,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { FormValidators, combineValidators, createSignalFormField } from '../../utils/form.utils';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Angular 21 Forms Example Component
 * Demonstrates both reactive forms and signal-based form patterns
 */
@Component({
  selector: 'app-signal-form-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
  ],
  template: `
    <p-card header="Angular 21 Forms Example">
      <div class="forms-container">
        <!-- Reactive Forms (Traditional) -->
        <div class="form-section">
          <h3>Reactive Forms (Traditional)</h3>
          <form [formGroup]="reactiveForm" (ngSubmit)="onReactiveSubmit()">
            <div class="p-field mb-3">
              <label for="reactive-name">Name</label>
              <input
                id="reactive-name"
                type="text"
                pInputText
                formControlName="name"
                [class.ng-invalid]="
                  reactiveForm.get('name')?.invalid &&
                  reactiveForm.get('name')?.touched
                "
              />
              @if (
                reactiveForm.get('name')?.invalid &&
                reactiveForm.get('name')?.touched
              ) {
                <small class="p-error">Name is required</small>
              }
            </div>

            <div class="p-field mb-3">
              <label for="reactive-email">Email</label>
              <input
                id="reactive-email"
                type="email"
                pInputText
                formControlName="email"
                [class.ng-invalid]="
                  reactiveForm.get('email')?.invalid &&
                  reactiveForm.get('email')?.touched
                "
              />
              @if (
                reactiveForm.get('email')?.invalid &&
                reactiveForm.get('email')?.touched
              ) {
                <small class="p-error">Valid email is required</small>
              }
            </div>

            <p-button
              type="submit"
              label="Submit Reactive Form"
              [disabled]="reactiveForm.invalid"
            />
          </form>
        </div>

        <!-- Signal-Based Form State (Angular 21 Pattern with model() API) -->
        <div class="form-section">
          <h3>Signal-Based Form State (model() API)</h3>
          <form (ngSubmit)="onSignalSubmit()" [attr.aria-label]="'Signal form example'">
            <div class="p-field mb-3">
              <label for="signal-name" [class.required]="true">
                Name
              </label>
              <input
                id="signal-name"
                type="text"
                pInputText
                [(ngModel)]="nameSignal"
                (blur)="nameField.touched.set(true)"
                [class.ng-invalid]="nameField.showError()"
                [attr.aria-invalid]="nameField.showError()"
                [attr.aria-describedby]="nameField.showError() ? 'signal-name-error' : null"
                [attr.aria-required]="true"
                placeholder="Enter your name"
                autocomplete="name"
              />
              @if (nameField.showError()) {
                <small 
                  id="signal-name-error" 
                  class="p-error" 
                  role="alert"
                  [attr.aria-live]="'polite'">
                  {{ nameField.error() }}
                </small>
              }
            </div>

            <div class="p-field mb-3">
              <label for="signal-email" [class.required]="true">
                Email
              </label>
              <input
                id="signal-email"
                type="email"
                pInputText
                [(ngModel)]="emailSignal"
                (blur)="emailField.touched.set(true)"
                [class.ng-invalid]="emailField.showError()"
                [attr.aria-invalid]="emailField.showError()"
                [attr.aria-describedby]="emailField.showError() ? 'signal-email-error' : null"
                [attr.aria-required]="true"
                placeholder="Enter your email"
                autocomplete="email"
              />
              @if (emailField.showError()) {
                <small 
                  id="signal-email-error" 
                  class="p-error" 
                  role="alert"
                  [attr.aria-live]="'polite'">
                  {{ emailField.error() }}
                </small>
              }
            </div>

            <p-button
              type="submit"
              label="Submit Signal Form"
              [disabled]="!isSignalFormValid()"
              [attr.aria-describedby]="!isSignalFormValid() ? 'signal-form-validation-info' : null"
            />
            @if (!isSignalFormValid()) {
              <div id="signal-form-validation-info" class="sr-only">
                Please fix the errors above before submitting
              </div>
            }
          </form>
        </div>
      </div>

      <!-- Form Status Display -->
      <div class="form-status">
        <h4>Form Status</h4>
        <div class="status-item">
          <strong>Reactive Form Valid:</strong>
          <span [class.valid]="reactiveForm.valid" [class.invalid]="!reactiveForm.valid">
            {{ reactiveForm.valid ? 'Yes' : 'No' }}
          </span>
        </div>
        <div class="status-item">
          <strong>Signal Form Valid:</strong>
          <span [class.valid]="isSignalFormValid()" [class.invalid]="!isSignalFormValid()">
            {{ isSignalFormValid() ? 'Yes' : 'No' }}
          </span>
        </div>
      </div>
    </p-card>
  `,
  styles: [
    `
      .forms-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }

      .form-section {
        padding: 1rem;
        border: 1px solid var(--p-border-color);
        border-radius: var(--p-border-radius);
      }

      .form-section h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: var(--p-text-color);
      }

      .form-status {
        margin-top: 2rem;
        padding: 1rem;
        background: var(--p-surface-ground);
        border-radius: var(--p-border-radius);
      }

      .form-status h4 {
        margin-top: 0;
        margin-bottom: 1rem;
      }

      .status-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--p-border-color);
      }

      .status-item:last-child {
        border-bottom: none;
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

      @media (max-width: 768px) {
        .forms-container {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SignalFormExampleComponent {
  private fb = inject(FormBuilder);
  private logger = inject(LoggerService);

  // Reactive Form (Traditional)
  reactiveForm: FormGroup;

  // Signal-Based Form State (Angular 21 Pattern with model() API)
  nameSignal = model<string>('');
  emailSignal = model<string>('');

  // Enhanced form fields with validation
  nameField = createSignalFormField(
    () => this.nameSignal(),
    FormValidators.required
  );

  emailField = createSignalFormField(
    () => this.emailSignal(),
    combineValidators(FormValidators.required, FormValidators.email)
  );

  // Computed validation
  isSignalFormValid = computed(() => {
    return !this.nameField.error() && !this.emailField.error();
  });

  constructor() {
    this.reactiveForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onReactiveSubmit(): void {
    if (this.reactiveForm.valid) {
      this.logger.debug('Reactive Form Submitted:', this.reactiveForm.value);
      // Handle submission
    } else {
      this.reactiveForm.markAllAsTouched();
      this.focusFirstInvalidReactiveField();
    }
  }

  onSignalSubmit(): void {
    // Mark all fields as touched
    this.nameField.touched.set(true);
    this.emailField.touched.set(true);

    if (this.isSignalFormValid()) {
      this.logger.debug('Signal Form Submitted:', {
        name: this.nameSignal(),
        email: this.emailSignal(),
      });
      // Handle submission
    } else {
      this.focusFirstInvalidSignalField();
    }
  }

  // Accessibility: Focus first invalid field
  private focusFirstInvalidReactiveField(): void {
    if (this.reactiveForm.get('name')?.invalid) {
      document.getElementById('reactive-name')?.focus();
    } else if (this.reactiveForm.get('email')?.invalid) {
      document.getElementById('reactive-email')?.focus();
    }
  }

  private focusFirstInvalidSignalField(): void {
    if (this.nameField.showError()) {
      document.getElementById('signal-name')?.focus();
    } else if (this.emailField.showError()) {
      document.getElementById('signal-email')?.focus();
    }
  }
}

