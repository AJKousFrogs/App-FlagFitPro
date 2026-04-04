import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { COUNTRY_OPTIONS } from "../../../core/constants";
import { GENDER_OPTIONS } from "../constants/onboarding-options";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-personal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormInputComponent,
    SelectComponent,
    AlertComponent,
    ButtonComponent,
  ],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-user step-icon"></i>
        <div>
          <h3>Personal Information</h3>
          <p class="step-description">Let's start with the basics</p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group span-2">
          <app-form-input
            label="Full Name *"
            [value]="state.formData.name"
            (valueChange)="state.formData.name = $event"
            placeholder="Enter your full name"
            styleClass="w-full"
          />
        </div>

        <div class="form-group">
          <label for="onboarding-dob"
            >Date of Birth <span class="required">*</span></label
          >
          <input
            id="onboarding-dob"
            type="date"
            [value]="getDateOfBirthInputValue()"
            [max]="getMaxDateInputValue()"
            [min]="getMinDateInputValue()"
            (input)="onDateOfBirthInput($event)"
            class="w-full"
          />
          @if (state.calculatedAge()) {
            <small class="age-hint"
              >Age: {{ state.calculatedAge() }} years ({{
                state.getAgeGroup()
              }})</small
            >
          }
        </div>

        <div class="form-group">
          <app-select
            label="Gender"
            [options]="genderOptions"
            (change)="onGenderSelect($event)"
            placeholder="Select gender"
            styleClass="w-full"
          />
        </div>

        <div class="form-group">
          <app-select
            label="Country *"
            [options]="countryOptions"
            (change)="onCountrySelect($event)"
            placeholder="Select your country"
            [filter]="true"
            styleClass="w-full"
          />
        </div>

        <div class="form-group">
          <app-form-input
            label="Phone Number (optional)"
            [value]="state.formData.phone"
            (valueChange)="state.formData.phone = $event"
            placeholder="+1 234 567 8900"
            styleClass="w-full"
          />
        </div>

        <!-- Email Verification Status -->
        <div class="form-group span-2">
          @if (isEmailVerified()) {
            <app-alert
              variant="success"
              density="compact"
              title="Email verified"
              message="You can proceed to the next step."
            />
          } @else {
            <app-alert
              variant="warning"
              density="compact"
              title="Email verification required"
              message="Please verify your email to continue. Check your inbox for a verification link."
            >
              <div class="form-inline-split">
                <app-button
                  variant="outlined"
                  size="sm"
                  iconLeft="pi-refresh"
                  [loading]="isResendingVerification()"
                  (clicked)="resendVerification.emit()"
                  >Resend Email</app-button
                >
                <app-button
                  variant="text"
                  size="sm"
                  iconLeft="pi-sync"
                  (clicked)="refreshVerification.emit()"
                  >I've Verified</app-button
                >
              </div>
            </app-alert>
          }
        </div>
      </div>
    </div>
  `,
})
export class OnboardingStepPersonalComponent {
  readonly state = inject(OnboardingStateService);

  readonly maxDate = input.required<Date>();
  readonly minDate = input.required<Date>();
  readonly isEmailVerified = input.required<boolean>();
  readonly isResendingVerification = input.required<boolean>();

  readonly resendVerification = output<void>();
  readonly refreshVerification = output<void>();

  readonly genderOptions = GENDER_OPTIONS;
  readonly countryOptions = COUNTRY_OPTIONS;

  onDateOfBirthChange(value: Date | null): void {
    this.state.formData.dateOfBirth = value ?? null;
  }

  onDateOfBirthInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const parsed = this.parseDateInputValue(input?.value ?? "");
    if (parsed === null) {
      this.onDateOfBirthChange(null);
      return;
    }
    const min = this.minDate();
    const max = this.maxDate();
    if (parsed < min || parsed > max) {
      return;
    }
    this.onDateOfBirthChange(parsed);
  }

  onGenderSelect(value: string | null | undefined): void {
    this.state.formData.gender = typeof value === "string" ? value : null;
  }

  onCountrySelect(value: string | null | undefined): void {
    this.state.formData.country = typeof value === "string" ? value : null;
  }

  getDateOfBirthInputValue(): string {
    return this.formatDateInputValue(this.state.formData.dateOfBirth);
  }

  getMinDateInputValue(): string {
    return this.formatDateInputValue(this.minDate());
  }

  getMaxDateInputValue(): string {
    return this.formatDateInputValue(this.maxDate());
  }

  private formatDateInputValue(value: Date | null | undefined): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  private parseDateInputValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
