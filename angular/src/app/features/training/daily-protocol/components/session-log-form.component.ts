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

import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { Slider } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';

export interface SessionLogData {
  actualDurationMinutes: number;
  actualRpe: number;
  sessionNotes?: string;
}

@Component({
  selector: 'app-session-log-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Slider,
    InputNumberModule,
    Textarea,
  
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
            <span class="rpe-description">{{ getRpeDescription(rpeValue()) }}</span>
          </label>
          <div class="rpe-slider-container">
            <span class="rpe-emoji">😌</span>
            <p-slider
              [(ngModel)]="rpeValue"
              [min]="1"
              [max]="10"
              [step]="1"
              styleClass="rpe-slider"
              (onChange)="onRpeChange($event)"
            ></p-slider>
            <span class="rpe-emoji">🔥</span>
          </div>
          <div class="rpe-value">{{ rpeValue() }}/10</div>
        </div>

        <!-- Duration Input -->
        <div class="form-field">
          <label for="duration">Actual Duration (minutes)</label>
          <div class="duration-input-row">
            <p-inputNumber
              [(ngModel)]="durationValue"
              [min]="1"
              [max]="300"
              [showButtons]="true"
              suffix=" min"
              styleClass="duration-input"
              (onInput)="onDurationChange($event)"
            ></p-inputNumber>
            @if (expectedDuration()) {
              <span class="expected-duration">
                Expected: {{ expectedDuration() }} min
                @if (durationDiff() !== 0) {
                  <span [class]="durationDiff() > 0 ? 'over' : 'under'">
                    ({{ durationDiff() > 0 ? '+' : '' }}{{ durationDiff() }} min)
                  </span>
                }
              </span>
            }
          </div>
        </div>

        <!-- Notes Textarea -->
        <div class="form-field">
          <label for="notes">Session Notes (optional)</label>
          <textarea
            pTextarea
            [(ngModel)]="notesValue"
            [rows]="3"
            placeholder="How did you feel? Any issues or highlights?"
            class="notes-textarea"
          ></textarea>
        </div>
      </div>

      <!-- Load Calculation Preview -->
      <div class="load-preview">
        <div class="load-item">
          <span class="load-label">Session Load</span>
          <span class="load-value">{{ calculatedLoad() }} AU</span>
        </div>
        <div class="load-formula">
          Duration × RPE = {{ durationValue() }} × {{ rpeValue() }} = {{ calculatedLoad() }}
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-actions">
        <app-button iconLeft="pi-check" [loading]="isSubmitting()" [disabled]="!isValid()" (clicked)="onSubmit()">Log Session & Complete</app-button>
      </div>
    </div>
  `,
  styleUrl: './session-log-form.component.scss',
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
  notesValue = signal('');
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
      this.rpeValue() >= 1 &&
      this.rpeValue() <= 10 &&
      this.durationValue() > 0
    );
  };

  // Methods
  getRpeDescription(rpe: number): string {
    const descriptions: Record<number, string> = {
      1: 'Very Light',
      2: 'Light',
      3: 'Light',
      4: 'Moderate',
      5: 'Moderate',
      6: 'Hard',
      7: 'Hard',
      8: 'Very Hard',
      9: 'Very Hard',
      10: 'Maximum',
    };
    return descriptions[rpe] || '';
  }

  onRpeChange(event: { value?: number | number[] }): void {
    const val = Array.isArray(event.value) ? event.value[0] : event.value;
    if (val !== undefined) {
      this.rpeValue.set(val);
    }
  }

  onDurationChange(event: { value: number | null | string }): void {
    const val = typeof event.value === 'number' ? event.value : null;
    if (val !== null) {
      this.durationValue.set(val);
    }
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
