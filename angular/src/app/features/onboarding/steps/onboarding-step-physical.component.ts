import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { InputText } from "primeng/inputtext";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-physical",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputText],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-heart step-icon"></i>
        <div>
          <h3>Physical Measurements</h3>
          <p class="step-description">
            Used for load calculations and benchmarks
          </p>
        </div>
      </div>

      <div class="form-group">
        <label id="unit-system-label">Preferred Units</label>
        <div
          class="unit-toggle"
          role="radiogroup"
          aria-labelledby="unit-system-label"
        >
          <button
            type="button"
            role="radio"
            class="unit-option"
            [class.selected]="state.formData.unitSystem === 'metric'"
            [attr.aria-checked]="state.formData.unitSystem === 'metric'"
            data-cy="unit-metric"
            (click)="state.formData.unitSystem = 'metric'"
            (keydown.enter)="state.formData.unitSystem = 'metric'"
            (keydown.space)="
              state.formData.unitSystem = 'metric';
              $event.preventDefault()
            "
          >
            <span class="unit-radio">
              @if (state.formData.unitSystem === 'metric') {
                <i class="pi pi-check"></i>
              }
            </span>
            <span class="unit-content">
              <i class="pi pi-globe"></i>
              <span>Metric</span>
              <small>cm / kg</small>
            </span>
          </button>
          <button
            type="button"
            role="radio"
            class="unit-option"
            [class.selected]="state.formData.unitSystem === 'imperial'"
            [attr.aria-checked]="state.formData.unitSystem === 'imperial'"
            data-cy="unit-imperial"
            (click)="state.formData.unitSystem = 'imperial'"
            (keydown.enter)="state.formData.unitSystem = 'imperial'"
            (keydown.space)="
              state.formData.unitSystem = 'imperial';
              $event.preventDefault()
            "
          >
            <span class="unit-radio">
              @if (state.formData.unitSystem === 'imperial') {
                <i class="pi pi-check"></i>
              }
            </span>
            <span class="unit-content">
              <i class="pi pi-flag"></i>
              <span>Imperial</span>
              <small>ft-in / lbs</small>
            </span>
          </button>
        </div>
      </div>

      @if (state.formData.unitSystem === 'metric') {
        <div class="form-grid">
          <div class="form-group">
            <label for="onboarding-height"
              >Height (cm) <span class="required">*</span></label
            >
            <input
              id="onboarding-height"
              name="height"
              type="number"
              pInputText
              [(ngModel)]="state.formData.heightCm"
              placeholder="e.g. 180"
              min="100"
              max="250"
              class="w-full"
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label for="onboarding-weight"
              >Weight (kg) <span class="required">*</span></label
            >
            <input
              id="onboarding-weight"
              name="weight"
              type="number"
              pInputText
              [(ngModel)]="state.formData.weightKg"
              placeholder="e.g. 75"
              min="30"
              max="200"
              class="w-full"
              autocomplete="off"
            />
          </div>
        </div>
      } @else {
        <div class="form-grid imperial-grid">
          <div class="form-group">
            <label for="onboarding-heightFt">Height (ft)</label>
            <input
              id="onboarding-heightFt"
              name="heightFt"
              type="number"
              pInputText
              [(ngModel)]="state.formData.heightFt"
              placeholder="5"
              min="3"
              max="8"
              class="w-full"
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label for="onboarding-heightIn">Inches</label>
            <input
              id="onboarding-heightIn"
              name="heightIn"
              type="number"
              pInputText
              [(ngModel)]="state.formData.heightIn"
              placeholder="10"
              min="0"
              max="11"
              class="w-full"
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label for="onboarding-weightLbs"
              >Weight (lbs) <span class="required">*</span></label
            >
            <input
              id="onboarding-weightLbs"
              name="weightLbs"
              type="number"
              pInputText
              [(ngModel)]="state.formData.weightLbs"
              placeholder="e.g. 165"
              min="66"
              max="440"
              class="w-full"
              autocomplete="off"
            />
          </div>
        </div>
      }

      <div class="info-box">
        <i class="pi pi-info-circle"></i>
        <span
          >Your measurements help us calculate appropriate training
          loads and provide position-specific benchmarks.</span
        >
      </div>
    </div>
  `,
})
export class OnboardingStepPhysicalComponent {
  readonly state = inject(OnboardingStateService);
}
