import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { COUNTRY_OPTIONS } from "../../../core/constants";
import { GENDER_OPTIONS } from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-personal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectComponent],
  template: `
    <div class="ob-step">
      <div class="ob-hero-icon" aria-hidden="true">
        <i class="pi pi-user"></i>
      </div>

      <h2 class="ob-heading">What's your name?</h2>
      <p class="ob-subtext">We'll use this for your profile and team roster.</p>

      <!-- Name -->
      <div class="ob-field">
        <label class="ob-label" for="ob-name">
          Full Name <span class="req" aria-hidden="true">*</span>
        </label>
        <input
          id="ob-name"
          type="text"
          class="ob-input"
          placeholder="First and last name"
          autocomplete="name"
          [value]="state.formData.name"
          (input)="state.formData.name = $any($event.target).value"
        />
      </div>

      <!-- DOB + Gender row -->
      <div class="ob-input-row">
        <div class="ob-field">
          <label class="ob-label" for="ob-dob">
            Date of Birth <span class="req" aria-hidden="true">*</span>
          </label>
          <input
            id="ob-dob"
            type="date"
            class="ob-input"
            [value]="getDateInputValue()"
            [max]="getMaxDateValue()"
            [min]="getMinDateValue()"
            (input)="onDateInput($event)"
          />
          @if (state.calculatedAge()) {
            <span class="ob-field-hint">
              {{ state.calculatedAge() }} yrs · {{ state.getAgeGroup() }}
            </span>
          }
        </div>

        <div class="ob-field">
          <label class="ob-label" for="ob-gender">Gender</label>
          <app-select
            inputId="ob-gender"
            label=""
            [options]="genderOptions"
            (change)="onGenderSelect($event)"
            placeholder="Select"
            styleClass="ob-select-wrap"
          />
        </div>
      </div>

      <!-- Country + Phone row -->
      <div class="ob-input-row">
        <div class="ob-field">
          <label class="ob-label" for="ob-country">
            Country <span class="req" aria-hidden="true">*</span>
          </label>
          <app-select
            inputId="ob-country"
            label=""
            [options]="countryOptions"
            (change)="onCountrySelect($event)"
            placeholder="Select country"
            [filter]="true"
            styleClass="ob-select-wrap"
          />
        </div>

        <div class="ob-field">
          <label class="ob-label" for="ob-phone">Phone (optional)</label>
          <input
            id="ob-phone"
            type="tel"
            class="ob-input"
            placeholder="+1 234 567 8900"
            autocomplete="tel"
            [value]="state.formData.phone"
            (input)="state.formData.phone = $any($event.target).value"
          />
        </div>
      </div>

      <!-- Email verification -->
      @if (isEmailVerified()) {
        <div class="ob-email-alert ob-email-alert--success">
          <div class="ob-email-alert-title">
            <i class="pi pi-check-circle"></i> Email verified
          </div>
          You're good to continue.
        </div>
      } @else {
        <div class="ob-email-alert">
          <div class="ob-email-alert-title">
            <i class="pi pi-envelope"></i> Verify your email to continue
          </div>
          Check your inbox for a verification link.
          <div class="ob-email-actions">
            <button
              class="ob-email-btn"
              type="button"
              [disabled]="isResendingVerification()"
              (click)="resendVerification.emit()"
            >
              <i class="pi pi-refresh"></i>
              {{ isResendingVerification() ? 'Sending…' : 'Resend email' }}
            </button>
            <button
              class="ob-email-btn"
              type="button"
              (click)="refreshVerification.emit()"
            >
              <i class="pi pi-sync"></i>
              I've verified
            </button>
          </div>
        </div>
      }
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

  onGenderSelect(value: string | null | undefined): void {
    this.state.formData.gender = typeof value === "string" ? value : null;
  }

  onCountrySelect(value: string | null | undefined): void {
    this.state.formData.country = typeof value === "string" ? value : null;
  }

  onDateInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const parsed = this.parseDateValue(input?.value ?? "");
    if (parsed === null) { this.state.formData.dateOfBirth = null; return; }
    const min = this.minDate();
    const max = this.maxDate();
    if (parsed < min || parsed > max) return;
    this.state.formData.dateOfBirth = parsed;
  }

  getDateInputValue(): string {
    return this.formatDateValue(this.state.formData.dateOfBirth);
  }

  getMinDateValue(): string { return this.formatDateValue(this.minDate()); }
  getMaxDateValue(): string { return this.formatDateValue(this.maxDate()); }

  private formatDateValue(value: Date | null | undefined): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private parseDateValue(value: string): Date | null {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
