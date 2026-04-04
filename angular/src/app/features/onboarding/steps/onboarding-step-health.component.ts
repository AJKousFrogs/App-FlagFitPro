import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { OnboardingStateService } from "../services/onboarding-state.service";
import { INJURY_AREAS, INJURY_HISTORY_OPTIONS } from "../constants/onboarding-options";
import type { InjuryEntry } from "../models/onboarding.model";

const SEVERITY_OPTIONS = [
  { label: "Minor", value: "minor" },
  { label: "Moderate", value: "moderate" },
  { label: "Severe", value: "severe" },
];

@Component({
  selector: "app-onboarding-step-health",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextareaComponent, SelectComponent, IconButtonComponent],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-shield step-icon"></i>
        <div>
          <h3>Health & Injury History</h3>
          <p class="step-description">Helps us avoid recommending harmful exercises</p>
        </div>
      </div>

      <div class="form-group">
        <label>Current Injuries or Pain Areas</label>
        <p class="field-hint">Add any areas where you're currently experiencing pain or recovering from injury</p>
        <div class="injury-input-row">
          <app-select [options]="injuryAreas" (change)="onInjuryAreaSelect($event)" placeholder="Select area" styleClass="injury-area-select" />
          <app-select [options]="severityOptions" (change)="onInjurySeveritySelect($event)" placeholder="Severity" styleClass="injury-severity-select" />
          <app-icon-button icon="pi-plus" [disabled]="!newInjury().area" (clicked)="addCurrentInjury()" ariaLabel="Add injury" tooltip="Add" />
        </div>
        @if (state.formData.currentInjuries.length > 0) {
          <div class="injury-list">
            @for (injury of state.formData.currentInjuries; track $index) {
              <div class="injury-chip" [class]="'severity-' + injury.severity">
                <span>{{ injury.area }} ({{ injury.severity }})</span>
                <i class="pi pi-times" (click)="removeCurrentInjury($index)"></i>
              </div>
            }
          </div>
        }
      </div>

      <div class="form-group">
        <label id="injury-history-label">Injury History</label>
        <p class="field-hint">Select any significant past injuries (select all that apply)</p>
        <div class="checkbox-grid" role="group" aria-labelledby="injury-history-label">
          @for (injury of injuryHistoryOptions; track injury.value) {
            <button type="button" role="checkbox" class="checkbox-card"
              [class.selected]="state.formData.injuryHistory.includes(injury.value)"
              [class.none-selected]="injury.value === 'none'"
              [attr.aria-checked]="state.formData.injuryHistory.includes(injury.value)"
              [attr.data-cy]="'injury-' + injury.value"
              (click)="state.toggleInjuryHistory(injury.value)"
              (keydown.enter)="state.toggleInjuryHistory(injury.value)"
              (keydown.space)="state.toggleInjuryHistory(injury.value); $event.preventDefault()">
              <span class="checkbox-indicator">
                @if (state.formData.injuryHistory.includes(injury.value)) { <i class="pi pi-check"></i> }
              </span>
              <i [class]="injury.icon" class="checkbox-icon"></i>
              <span class="checkbox-label">{{ injury.label }}</span>
            </button>
          }
        </div>
      </div>

      <div class="form-group">
        <app-textarea
          label="Additional Medical Notes (optional)"
          [value]="state.formData.medicalNotes"
          (valueChange)="state.formData.medicalNotes = $event"
          placeholder="Any other health conditions, allergies, or notes..."
          [rows]="3"
          styleClass="w-full"
        />
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

  addCurrentInjury(): void {
    const ni = this.newInjury();
    if (ni.area) {
      this.state.formData.currentInjuries.push({ ...ni });
      this.newInjury.set({ area: "", severity: "minor", notes: "" });
    }
  }

  removeCurrentInjury(index: number): void {
    this.state.formData.currentInjuries.splice(index, 1);
  }

  onInjuryAreaSelect(value: string | null | undefined): void {
    this.newInjury.update((injury) => ({
      ...injury,
      area: typeof value === "string" ? value : "",
    }));
  }

  onInjurySeveritySelect(value: string | null | undefined): void {
    const severity =
      value === "moderate" || value === "severe" ? value : "minor";
    this.newInjury.update((injury) => ({ ...injury, severity }));
  }
}
