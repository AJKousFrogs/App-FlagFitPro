import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { OnboardingStateService } from "../services/onboarding-state.service";
import { INJURY_AREAS, INJURY_HISTORY_OPTIONS } from "../constants/onboarding-options";
import type { InjuryEntry } from "../models/onboarding.model";

const SEVERITY_OPTIONS = [
  { label: "Minor",    value: "minor" },
  { label: "Moderate", value: "moderate" },
  { label: "Severe",   value: "severe" },
];

@Component({
  selector: "app-onboarding-step-health",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectComponent],
  template: `
    <div class="ob-step">
      <div class="ob-hero-icon" aria-hidden="true">
        <i class="pi pi-shield"></i>
      </div>

      <h2 class="ob-heading">Health &amp; injuries</h2>
      <p class="ob-subtext">
        Helps us avoid recommending exercises that could aggravate existing issues.
      </p>

      <!-- Current injuries -->
      <div class="ob-field">
        <label class="ob-label">Current pain areas</label>
        <p class="ob-field-hint">Leave blank if you have none.</p>

        <div class="ob-add-row" style="margin-top:var(--space-2)">
          <div style="flex:1">
            <app-select
              label=""
              [options]="injuryAreas"
              (change)="onInjuryAreaSelect($event)"
              placeholder="Area"
              styleClass="ob-select-wrap"
            />
          </div>
          <div style="width:140px">
            <app-select
              label=""
              [options]="severityOptions"
              (change)="onSeveritySelect($event)"
              placeholder="Severity"
              styleClass="ob-select-wrap"
            />
          </div>
          <button
            class="ob-add-btn"
            type="button"
            aria-label="Add injury"
            [disabled]="!newInjury().area"
            (click)="addInjury()"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
          </button>
        </div>

        @if (state.formData.currentInjuries.length > 0) {
          <div class="ob-injury-chips" role="list">
            @for (injury of state.formData.currentInjuries; track $index) {
              <div
                class="ob-injury-chip"
                [class]="'ob-injury-chip--' + injury.severity"
                role="listitem"
              >
                <span>{{ injury.area }} · {{ injury.severity }}</span>
                <i
                  class="pi pi-times"
                  aria-label="Remove"
                  role="button"
                  tabindex="0"
                  (click)="removeInjury($index)"
                  (keydown.enter)="removeInjury($index)"
                ></i>
              </div>
            }
          </div>
        }
      </div>

      <!-- Injury history -->
      <div class="ob-field">
        <label class="ob-label" id="ob-hist-label">Injury history</label>
        <p class="ob-field-hint">Select any significant past injuries.</p>
        <div
          class="ob-card-grid ob-card-grid--3col"
          role="group"
          aria-labelledby="ob-hist-label"
          style="margin-top:var(--space-2)"
        >
          @for (injury of injuryHistoryOptions; track injury.value) {
            <button
              type="button"
              role="checkbox"
              class="ob-card"
              [attr.aria-checked]="state.formData.injuryHistory.includes(injury.value)"
              [attr.data-cy]="'injury-' + injury.value"
              (click)="state.toggleInjuryHistory(injury.value)"
              (keydown.enter)="state.toggleInjuryHistory(injury.value)"
              (keydown.space)="state.toggleInjuryHistory(injury.value); $event.preventDefault()"
            >
              <i [class]="injury.icon" class="ob-card__icon" aria-hidden="true"></i>
              <span class="ob-card__label">{{ injury.label }}</span>
              <span class="ob-card__check" aria-hidden="true">
                <i class="pi pi-check"></i>
              </span>
            </button>
          }
        </div>
      </div>

      <!-- Medical notes -->
      <div class="ob-field">
        <label class="ob-label" for="ob-medical-notes">
          Additional notes (optional)
        </label>
        <textarea
          id="ob-medical-notes"
          class="ob-textarea"
          placeholder="Any other conditions, allergies, or notes…"
          [value]="state.formData.medicalNotes"
          (input)="state.formData.medicalNotes = $any($event.target).value"
        ></textarea>
      </div>
    </div>
  `,
})
export class OnboardingStepHealthComponent {
  readonly state = inject(OnboardingStateService);
  readonly injuryAreas = INJURY_AREAS;
  readonly injuryHistoryOptions = INJURY_HISTORY_OPTIONS;
  readonly severityOptions = SEVERITY_OPTIONS;

  newInjury = signal<InjuryEntry>({ area: "", severity: "minor", notes: "" });

  addInjury(): void {
    const ni = this.newInjury();
    if (ni.area) {
      this.state.formData.currentInjuries.push({ ...ni });
      this.newInjury.set({ area: "", severity: "minor", notes: "" });
    }
  }

  removeInjury(index: number): void {
    this.state.formData.currentInjuries.splice(index, 1);
  }

  onInjuryAreaSelect(value: string | null | undefined): void {
    this.newInjury.update((inj) => ({
      ...inj,
      area: typeof value === "string" ? value : "",
    }));
  }

  onSeveritySelect(value: string | null | undefined): void {
    const severity =
      value === "moderate" || value === "severe" ? value : "minor";
    this.newInjury.update((inj) => ({ ...inj, severity }));
  }
}
