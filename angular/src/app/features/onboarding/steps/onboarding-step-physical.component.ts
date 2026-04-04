import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-physical",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="ob-step">
      <div class="ob-hero-icon" aria-hidden="true">
        <i class="pi pi-heart"></i>
      </div>

      <h2 class="ob-heading">Physical profile</h2>
      <p class="ob-subtext">
        Used for load calculations and position benchmarks.
      </p>

      <!-- Unit segmented control -->
      <div
        class="ob-seg-ctrl"
        role="radiogroup"
        aria-label="Preferred measurement units"
      >
        <button
          type="button"
          role="radio"
          class="ob-seg-opt"
          [class.ob-seg-opt--active]="state.formData.unitSystem === 'metric'"
          [attr.aria-checked]="state.formData.unitSystem === 'metric'"
          data-cy="unit-metric"
          (click)="state.formData.unitSystem = 'metric'"
          (keydown.enter)="state.formData.unitSystem = 'metric'"
          (keydown.space)="state.formData.unitSystem = 'metric'; $event.preventDefault()"
        >
          <i class="pi pi-globe" aria-hidden="true"></i> Metric (cm / kg)
        </button>
        <button
          type="button"
          role="radio"
          class="ob-seg-opt"
          [class.ob-seg-opt--active]="state.formData.unitSystem === 'imperial'"
          [attr.aria-checked]="state.formData.unitSystem === 'imperial'"
          data-cy="unit-imperial"
          (click)="state.formData.unitSystem = 'imperial'"
          (keydown.enter)="state.formData.unitSystem = 'imperial'"
          (keydown.space)="state.formData.unitSystem = 'imperial'; $event.preventDefault()"
        >
          <i class="pi pi-flag" aria-hidden="true"></i> Imperial (ft / lbs)
        </button>
      </div>

      @if (state.formData.unitSystem === 'metric') {
        <div class="ob-input-row">
          <div class="ob-field">
            <label class="ob-label" for="ob-height-cm">
              Height (cm) <span class="req" aria-hidden="true">*</span>
            </label>
            <input
              id="ob-height-cm"
              type="number"
              class="ob-input"
              placeholder="e.g. 180"
              [value]="state.formData.heightCm ?? ''"
              (input)="onHeightCm($event)"
            />
          </div>
          <div class="ob-field">
            <label class="ob-label" for="ob-weight-kg">
              Weight (kg) <span class="req" aria-hidden="true">*</span>
            </label>
            <input
              id="ob-weight-kg"
              type="number"
              class="ob-input"
              placeholder="e.g. 75"
              [value]="state.formData.weightKg ?? ''"
              (input)="onWeightKg($event)"
            />
          </div>
        </div>
      } @else {
        <div class="ob-input-row">
          <div class="ob-field">
            <label class="ob-label" for="ob-height-ft">Height (ft)</label>
            <input
              id="ob-height-ft"
              type="number"
              class="ob-input"
              placeholder="5"
              [value]="state.formData.heightFt ?? ''"
              (input)="onHeightFt($event)"
            />
          </div>
          <div class="ob-field">
            <label class="ob-label" for="ob-height-in">Inches</label>
            <input
              id="ob-height-in"
              type="number"
              class="ob-input"
              placeholder="10"
              [value]="state.formData.heightIn ?? ''"
              (input)="onHeightIn($event)"
            />
          </div>
        </div>
        <div class="ob-field">
          <label class="ob-label" for="ob-weight-lbs">
            Weight (lbs) <span class="req" aria-hidden="true">*</span>
          </label>
          <input
            id="ob-weight-lbs"
            type="number"
            class="ob-input"
            placeholder="e.g. 165"
            [value]="state.formData.weightLbs ?? ''"
            (input)="onWeightLbs($event)"
          />
        </div>
      }

      <div class="ob-info-box">
        <i class="pi pi-info-circle" aria-hidden="true"></i>
        <span>
          Your measurements help personalise training loads and
          position-specific benchmarks. You can update them anytime.
        </span>
      </div>
    </div>
  `,
})
export class OnboardingStepPhysicalComponent {
  readonly state = inject(OnboardingStateService);

  onHeightCm(e: Event): void  { this.state.formData.heightCm  = this.num(e); }
  onWeightKg(e: Event): void  { this.state.formData.weightKg  = this.num(e); }
  onHeightFt(e: Event): void  { this.state.formData.heightFt  = this.num(e); }
  onHeightIn(e: Event): void  { this.state.formData.heightIn  = this.num(e); }
  onWeightLbs(e: Event): void { this.state.formData.weightLbs = this.num(e); }

  private num(e: Event): number | null {
    const raw = (e.target as HTMLInputElement).value;
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
