import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { COUNTRY_OPTIONS } from "../../../core/constants";
import { GENDER_OPTIONS } from "../constants/onboarding-options";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-personal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    InputText,
    Select,
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
          <label for="onboarding-name"
            >Full Name <span class="required">*</span></label
          >
          <input
            id="onboarding-name"
            name="name"
            type="text"
            pInputText
            [value]="state.formData.name"
            (input)="onNameInput($event)"
            placeholder="Enter your full name"
            class="w-full"
            autocomplete="name"
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
          <label for="onboarding-gender">Gender</label>
          <p-select
            inputId="onboarding-gender"
            [options]="genderOptions"
            (onChange)="onGenderChange($event.value)"
            placeholder="Select gender"
            class="w-full"
            [attr.aria-label]="'Select gender'"
          ></p-select>
        </div>

        <div class="form-group">
          <label for="onboarding-country"
            >Country <span class="required">*</span></label
          >
          <p-select
            inputId="onboarding-country"
            [options]="countryOptions"
            (onChange)="onCountryChange($event.value)"
            placeholder="Select your country"
            [filter]="true"
            filterPlaceholder="Search countries..."
            class="w-full"
            [attr.aria-label]="'Select your country'"
          ></p-select>
        </div>

        <div class="form-group">
          <label for="onboarding-phone"
            >Phone Number <small>(optional)</small></label
          >
          <input
            id="onboarding-phone"
            name="phone"
            type="tel"
            pInputText
            [value]="state.formData.phone"
            (input)="onPhoneInput($event)"
            placeholder="+1 234 567 8900"
            class="w-full"
            autocomplete="tel"
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

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.state.formData.name = input?.value ?? "";
  }

  onDateOfBirthChange(value: Date | null): void {
    this.state.formData.dateOfBirth = value ?? null;
  }

  onDateOfBirthInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.onDateOfBirthChange(this.parseDateInputValue(input?.value ?? ""));
  }

  onGenderChange(value: string | null | undefined): void {
    this.state.formData.gender = value ?? null;
  }

  onCountryChange(value: string | null | undefined): void {
    this.state.formData.country = value ?? null;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.state.formData.phone = input?.value ?? "";
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
