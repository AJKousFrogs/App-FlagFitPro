/**
 * Session Log Form Component
 *
 * Form for logging actual session performance after completing main session:
 * - RPE slider (1-10)
 * - Actual duration input
 * - Session notes
 *
 * Submits to ACWR calculation and wellness tracking.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from "@angular/core";
import { InputNumber } from "primeng/inputnumber";
import { Slider } from "primeng/slider";
import { Tooltip } from "primeng/tooltip";
import { TextareaComponent } from "../../../../shared/components/textarea/textarea.component";
import { ButtonComponent } from "../../../../shared/components/button/button.component";

export interface SessionLogData {
  actualDurationMinutes: number;
  actualRpe: number;
  sessionNotes?: string;
}

@Component({
  selector: "app-session-log-form",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Slider,
    InputNumber,
    TextareaComponent,
    Tooltip,

    ButtonComponent,
  ],
  template: `
    <div class="session-log-form">
      <div class="form-header">
        <h4>Log Your Session</h4>
        <p>Record your actual performance for accurate ACWR tracking</p>
      </div>

      <div class="form-fields">
        <!-- RPE Slider -->
        <div class="form-field">
          <label for="rpe">
            Session RPE (Rate of Perceived Exertion)
            <i
              class="pi pi-info-circle info-icon"
              pTooltip="RPE (1-10 scale) measures how hard you felt the session was. This helps track training load for injury prevention. 1=Very Easy, 10=Maximal Effort"
              tooltipPosition="right"
              [showDelay]="300"
            ></i>
            <span class="rpe-description">{{
              getRpeDescription(rpeValue())
            }}</span>
          </label>
          <div class="rpe-slider-container">
            <span class="rpe-range-icon" aria-hidden="true"
              ><i class="pi pi-arrow-down"></i
            ></span>
            <p-slider
              [ngModel]="rpeValue()"
              [min]="1"
              [max]="10"
              [step]="1"
              class="rpe-slider"
              (ngModelChange)="onRpeChange($event)"
            ></p-slider>
            <span class="rpe-range-icon" aria-hidden="true"
              ><i class="pi pi-arrow-up"></i
            ></span>
          </div>
          <div class="rpe-value">{{ rpeValue() }}/10</div>
        </div>

        <!-- Duration Input -->
        <div class="form-field">
          <label for="duration">Actual Duration (minutes)</label>
          <div class="duration-input-row">
            <p-inputNumber
              [ngModel]="durationValue()"
              [min]="1"
              [max]="300"
              [showButtons]="true"
              suffix=" min"
              class="duration-input"
              (ngModelChange)="onDurationChange($event)"
            ></p-inputNumber>
            @if (expectedDuration()) {
              <span class="expected-duration">
                Expected: {{ expectedDuration() }} min
                @if (durationDiff() !== 0) {
                  <span [class]="durationDiff() > 0 ? 'over' : 'under'">
                    ({{ durationDiff() > 0 ? "+" : ""
                    }}{{ durationDiff() }} min)
                  </span>
                }
              </span>
            }
          </div>
        </div>

        <!-- Notes Textarea -->
        <div class="form-field">
          <app-textarea
            label="Session Notes (optional)"
            [value]="notesValue()"
            (valueChange)="notesValue.set($event)"
            [rows]="3"
            placeholder="How did you feel? Any issues or highlights?"
            styleClass="notes-textarea"
          ></app-textarea>
        </div>
      </div>

      <!-- Load Calculation Preview -->
      <div class="load-preview">
        <div class="load-item">
          <span class="load-label">Session Load</span>
          <span class="load-value">{{ calculatedLoad() }} AU</span>
        </div>
        <div class="load-formula">
          Duration × RPE = {{ durationValue() }} × {{ rpeValue() }} =
          {{ calculatedLoad() }}
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-actions">
        <app-button
          iconLeft="pi-check"
          [loading]="isSubmitting()"
          [disabled]="!isValid()"
          (clicked)="onSubmit()"
          >Log Session & Complete</app-button
        >
      </div>
    </div>
  `,
  styleUrl: "./session-log-form.component.scss",
})
export class SessionLogFormComponent {
  // Inputs
  expectedDuration = input<number>();
  protocolId = input.required<string>();

  // Outputs
  submit = output<SessionLogData>();

  // Form state
  rpeValue = signal(6);
  durationValue = signal(60);
  notesValue = signal("");
  isSubmitting = signal(false);

  // Computed
  calculatedLoad = () => this.durationValue() * this.rpeValue();

  durationDiff = () => {
    const expected = this.expectedDuration();
    if (!expected) return 0;
    return this.durationValue() - expected;
  };

  isValid = () => {
    return (
      this.rpeValue() >= 1 && this.rpeValue() <= 10 && this.durationValue() > 0
    );
  };

  // Methods
  getRpeDescription(rpe: number): string {
    const descriptions: Record<number, string> = {
      1: "Very Light",
      2: "Light",
      3: "Light",
      4: "Moderate",
      5: "Moderate",
      6: "Hard",
      7: "Hard",
      8: "Very Hard",
      9: "Very Hard",
      10: "Maximum",
    };
    return descriptions[rpe] || "";
  }

  onRpeChange(value: number | number[] | null | undefined): void {
    const val = Array.isArray(value) ? value[0] : value;
    if (typeof val === "number") {
      this.rpeValue.set(val);
    }
  }

  onDurationChange(value: number | null | string | undefined): void {
    const val = typeof value === "number" ? value : null;
    if (val !== null) {
      this.durationValue.set(val);
    }
  }

  onNotesInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.notesValue.set(input?.value ?? "");
  }

  onSubmit(): void {
    if (!this.isValid()) return;

    this.isSubmitting.set(true);

    const logData: SessionLogData = {
      actualDurationMinutes: this.durationValue(),
      actualRpe: this.rpeValue(),
      sessionNotes: this.notesValue() || undefined,
    };

    this.submit.emit(logData);
  }

  // Called by parent to reset submitting state
  resetSubmitting(): void {
    this.isSubmitting.set(false);
  }
}
