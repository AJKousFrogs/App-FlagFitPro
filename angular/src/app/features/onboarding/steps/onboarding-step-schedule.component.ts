import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import {
  SCHEDULE_TYPES,
  PRACTICE_FREQUENCIES,
  WEEK_DAYS,
} from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";
import { SelectComponent } from "../../../shared/components/select/select.component";

@Component({
  selector: "app-onboarding-step-schedule",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectComponent],
  template: `
    <div class="ob-step">
      <div class="ob-hero-icon" aria-hidden="true">
        <i class="pi pi-calendar"></i>
      </div>

      <h2 class="ob-heading">Training schedule</h2>
      <p class="ob-subtext">
        We use your work schedule for reminders, and your team practice days to
        line up your training plan on the days you actually practice.
      </p>

      <!-- Work schedule -->
      <div class="ob-field">
        <label class="ob-label">
          Work Schedule <span class="req" aria-hidden="true">*</span>
        </label>
        <app-select
          label=""
          [options]="scheduleTypes"
          (change)="onScheduleTypeSelect($event)"
          placeholder="Select your schedule type"
          styleClass="ob-select-wrap"
        />
      </div>

      <!-- Practices per week -->
      <div class="ob-field">
        <label class="ob-label" id="ob-freq-label">Team practices per week</label>
        <div
          class="ob-freq-grid"
          role="group"
          aria-labelledby="ob-freq-label"
        >
          @for (freq of practiceFrequencies; track freq.value) {
            <button
              type="button"
              class="ob-freq-btn"
              [class.ob-freq-more]="freq.value === 4"
              [attr.aria-pressed]="state.formData.practicesPerWeek === freq.value"
              [attr.aria-label]="freq.value + ' practice' + (freq.value === 1 ? '' : 's') + ' per week'"
              [attr.data-cy]="'freq-' + freq.value"
              (click)="state.formData.practicesPerWeek = freq.value"
            >{{ freq.value === 4 ? '4+' : freq.value }}</button>
          }
        </div>
      </div>

      <!-- Practice days -->
      <div class="ob-field">
        <label class="ob-label" id="ob-days-label"
          >Team practice days (flag football)</label
        >
        <div
          class="ob-chips"
          role="group"
          aria-labelledby="ob-days-label"
          style="margin-top: var(--space-2);"
        >
          @for (day of weekDays; track day.value) {
            <button
              type="button"
              role="checkbox"
              class="ob-chip"
              [attr.aria-checked]="state.formData.practiceDays.includes(day.value)"
              [attr.aria-label]="day.value"
              [attr.data-cy]="'day-' + day.value.toLowerCase()"
              (click)="state.togglePracticeDay(day.value)"
              (keydown.enter)="state.togglePracticeDay(day.value)"
              (keydown.space)="state.togglePracticeDay(day.value); $event.preventDefault()"
            >
              {{ day.label }}
              @if (state.formData.practiceDays.includes(day.value)) {
                <i class="pi pi-check" aria-hidden="true" style="font-size:0.6rem"></i>
              }
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class OnboardingStepScheduleComponent {
  readonly state = inject(OnboardingStateService);
  readonly scheduleTypes = SCHEDULE_TYPES;
  readonly practiceFrequencies = PRACTICE_FREQUENCIES;
  readonly weekDays = WEEK_DAYS;

  onScheduleTypeSelect(value: string | null | undefined): void {
    this.state.formData.scheduleType = typeof value === "string" ? value : "";
  }
}
