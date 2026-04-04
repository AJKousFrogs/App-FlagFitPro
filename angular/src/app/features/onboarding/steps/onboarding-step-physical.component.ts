import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-physical",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormInputComponent],
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
            <app-form-input
              label="Height (cm) *"
              [value]="state.formData.heightCm?.toString() ?? ''"
              (valueChange)="onHeightCmInput($event)"
              placeholder="e.g. 180"
              styleClass="w-full"
            />
          </div>
          <div class="form-group">
            <app-form-input
              label="Weight (kg) *"
              [value]="state.formData.weightKg?.toString() ?? ''"
              (valueChange)="onWeightKgInput($event)"
              placeholder="e.g. 75"
              styleClass="w-full"
            />
          </div>
        </div>
      } @else {
        <div class="form-grid imperial-grid">
          <div class="form-group">
            <app-form-input
              label="Height (ft)"
              [value]="state.formData.heightFt?.toString() ?? ''"
              (valueChange)="onHeightFtInput($event)"
              placeholder="5"
              styleClass="w-full"
            />
          </div>
          <div class="form-group">
            <app-form-input
              label="Inches"
              [value]="state.formData.heightIn?.toString() ?? ''"
              (valueChange)="onHeightInInput($event)"
              placeholder="10"
              styleClass="w-full"
            />
          </div>
          <div class="form-group">
            <app-form-input
              label="Weight (lbs) *"
              [value]="state.formData.weightLbs?.toString() ?? ''"
              (valueChange)="onWeightLbsInput($event)"
              placeholder="e.g. 165"
              styleClass="w-full"
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

  onHeightCmInput(raw: string): void {
    this.state.formData.heightCm = this.parseNumberString(raw);
  }

  onWeightKgInput(raw: string): void {
    this.state.formData.weightKg = this.parseNumberString(raw);
  }

  onHeightFtInput(raw: string): void {
    this.state.formData.heightFt = this.parseNumberString(raw);
  }

  onHeightInInput(raw: string): void {
    this.state.formData.heightIn = this.parseNumberString(raw);
  }

  onWeightLbsInput(raw: string): void {
    this.state.formData.weightLbs = this.parseNumberString(raw);
  }

  private parseNumberString(raw: string): number | null {
    if (raw === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
