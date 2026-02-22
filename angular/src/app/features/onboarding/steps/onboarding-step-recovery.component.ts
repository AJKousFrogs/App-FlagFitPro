import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  MOBILITY_TIME_OPTIONS,
  FOAM_ROLLING_OPTIONS,
  REST_DAY_OPTIONS,
} from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-recovery",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-refresh step-icon"></i>
        <div>
          <h3>Mobility & Recovery</h3>
          <p class="step-description">
            Set up your daily recovery routine
          </p>
        </div>
      </div>

      <div class="form-group">
        <label id="morning-mobility-label"
          >Morning Mobility
          <small>(10 min wake-up routine)</small></label
        >
        <div
          class="preference-options compact"
          role="radiogroup"
          aria-labelledby="morning-mobility-label"
        >
          @for (option of mobilityTimeOptions; track option.value) {
            <button
              type="button"
              role="radio"
              class="preference-card"
              [class.selected]="
                state.formData.morningMobility === option.value
              "
              [attr.aria-checked]="
                state.formData.morningMobility === option.value
              "
              [attr.data-cy]="'morning-mobility-' + option.value"
              (click)="state.formData.morningMobility = option.value"
              (keydown.enter)="
                state.formData.morningMobility = option.value
              "
              (keydown.space)="
                state.formData.morningMobility = option.value;
                $event.preventDefault()
              "
            >
              <span class="preference-radio">
                @if (state.formData.morningMobility === option.value) {
                  <i class="pi pi-check"></i>
                }
              </span>
              <i [class]="option.icon" class="preference-icon"></i>
              <span class="preference-label">{{ option.label }}</span>
            </button>
          }
        </div>
      </div>

      <div class="form-group">
        <label id="evening-mobility-label"
          >Evening Mobility <small>(15 min before bed)</small></label
        >
        <div
          class="preference-options compact"
          role="radiogroup"
          aria-labelledby="evening-mobility-label"
        >
          @for (option of mobilityTimeOptions; track option.value) {
            <button
              type="button"
              role="radio"
              class="preference-card"
              [class.selected]="
                state.formData.eveningMobility === option.value
              "
              [attr.aria-checked]="
                state.formData.eveningMobility === option.value
              "
              [attr.data-cy]="'evening-mobility-' + option.value"
              (click)="state.formData.eveningMobility = option.value"
              (keydown.enter)="
                state.formData.eveningMobility = option.value
              "
              (keydown.space)="
                state.formData.eveningMobility = option.value;
                $event.preventDefault()
              "
            >
              <span class="preference-radio">
                @if (state.formData.eveningMobility === option.value) {
                  <i class="pi pi-check"></i>
                }
              </span>
              <i [class]="option.icon" class="preference-icon"></i>
              <span class="preference-label">{{ option.label }}</span>
            </button>
          }
        </div>
      </div>

      <div class="form-group">
        <label id="foam-rolling-label">Foam Rolling Preference</label>
        <div
          class="preference-options compact"
          role="radiogroup"
          aria-labelledby="foam-rolling-label"
        >
          @for (option of foamRollingOptions; track option.value) {
            <button
              type="button"
              role="radio"
              class="preference-card"
              [class.selected]="
                state.formData.foamRollingTime === option.value
              "
              [attr.aria-checked]="
                state.formData.foamRollingTime === option.value
              "
              [attr.data-cy]="'foam-rolling-' + option.value"
              (click)="state.formData.foamRollingTime = option.value"
              (keydown.enter)="
                state.formData.foamRollingTime = option.value
              "
              (keydown.space)="
                state.formData.foamRollingTime = option.value;
                $event.preventDefault()
              "
            >
              <span class="preference-radio">
                @if (state.formData.foamRollingTime === option.value) {
                  <i class="pi pi-check"></i>
                }
              </span>
              <i [class]="option.icon" class="preference-icon"></i>
              <span class="preference-label">{{ option.label }}</span>
            </button>
          }
        </div>
      </div>

      <div class="form-group">
        <label id="rest-day-label">Rest Day Recovery</label>
        <div
          class="preference-options"
          role="radiogroup"
          aria-labelledby="rest-day-label"
        >
          @for (option of restDayOptions; track option.value) {
            <button
              type="button"
              role="radio"
              class="preference-card with-description"
              [class.selected]="
                state.formData.restDayPreference === option.value
              "
              [attr.aria-checked]="
                state.formData.restDayPreference === option.value
              "
              [attr.data-cy]="'rest-day-' + option.value"
              (click)="state.formData.restDayPreference = option.value"
              (keydown.enter)="state.formData.restDayPreference = option.value"
              (keydown.space)="
                state.formData.restDayPreference = option.value;
                $event.preventDefault()
              "
            >
              <span class="preference-radio">
                @if (state.formData.restDayPreference === option.value) {
                  <i class="pi pi-check"></i>
                }
              </span>
              <div class="preference-content">
                <i [class]="option.icon" class="preference-icon"></i>
                <span class="preference-label">{{ option.label }}</span>
                <span class="preference-desc">{{ option.description }}</span>
              </div>
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class OnboardingStepRecoveryComponent {
  readonly state = inject(OnboardingStateService);
  readonly mobilityTimeOptions = MOBILITY_TIME_OPTIONS;
  readonly foamRollingOptions = FOAM_ROLLING_OPTIONS;
  readonly restDayOptions = REST_DAY_OPTIONS;
}
