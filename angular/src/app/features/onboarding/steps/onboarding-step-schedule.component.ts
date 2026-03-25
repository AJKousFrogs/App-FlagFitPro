import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Select, type SelectChangeEvent } from "primeng/select";
import {
  SCHEDULE_TYPES,
  PRACTICE_FREQUENCIES,
  WEEK_DAYS,
} from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-schedule",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Select],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-calendar step-icon"></i>
        <div>
          <h3>Your Schedule</h3>
          <p class="step-description">
            Help us recommend the best training times
          </p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group span-2">
          <label for="scheduleType"
            >Work Schedule Type <span class="required">*</span></label
          >
          <p-select
            inputId="scheduleType"
            [options]="scheduleTypes"
            (onChange)="onScheduleTypeSelect($event)"
            placeholder="Select your schedule type"
            class="w-full"
            [attr.aria-label]="'Select work schedule type'"
          ></p-select>
        </div>

        <div class="form-group span-2">
          <label for="practicesPerWeek"
            >Team Practices Per Week</label
          >
          <p-select
            inputId="practicesPerWeek"
            [options]="practiceFrequencies"
            (onChange)="onPracticesPerWeekSelect($event)"
            placeholder="How many team practices?"
            class="w-full"
            [attr.aria-label]="
              'Select number of team practices per week'
            "
          ></p-select>
        </div>

        <div class="form-group span-2">
          <label id="practice-days-label">Practice Days</label>
          <div
            class="days-grid"
            role="group"
            aria-labelledby="practice-days-label"
          >
            @for (day of weekDays; track day.value) {
              <button
                type="button"
                role="checkbox"
                class="day-chip"
                [class.selected]="
                  state.formData.practiceDays.includes(day.value)
                "
                [attr.aria-checked]="
                  state.formData.practiceDays.includes(day.value)
                "
                [attr.aria-label]="day.value"
                [attr.data-cy]="'day-' + day.value.toLowerCase()"
                (click)="state.togglePracticeDay(day.value)"
                (keydown.enter)="state.togglePracticeDay(day.value)"
                (keydown.space)="
                  state.togglePracticeDay(day.value);
                  $event.preventDefault()
                "
              >
                <span class="day-label">{{ day.label }}</span>
                @if (state.formData.practiceDays.includes(day.value)) {
                  <span class="day-check"><i class="pi pi-check"></i></span>
                }
              </button>
            }
          </div>
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

  onScheduleTypeSelect(event: SelectChangeEvent): void {
    this.state.formData.scheduleType =
      typeof event.value === "string" ? event.value : "";
  }

  onPracticesPerWeekSelect(event: SelectChangeEvent): void {
    this.state.formData.practicesPerWeek =
      typeof event.value === "number" ? event.value : 0;
  }
}
