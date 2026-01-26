/**
 * Confidence Indicator Component
 *
 * Displays confidence score with visual indicators and warnings
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { StatusTagComponent } from "../status-tag/status-tag.component";

import { ButtonComponent } from "../button/button.component";

@Component({
  selector: "app-confidence-indicator",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, StatusTagComponent, ButtonComponent],
  template: `
    <div
      class="confidence-indicator"
      [class]="'confidence-' + confidenceClass()"
    >
      <div class="confidence-header">
        <div class="confidence-score">
          <span class="score-value"
            >{{ score() * 100 | number: "1.0-0" }}%</span
          >
          <span class="score-label">{{ confidenceLevel() }} Confidence</span>
        </div>
        <app-status-tag
          [value]="confidenceLevel()"
          [severity]="getSeverity()"
          size="sm"
        ></app-status-tag>
      </div>

      <div class="confidence-bar">
        <div
          class="confidence-fill"
          [style.width.%]="score() * 100"
          [class]="confidenceClass()"
        ></div>
      </div>

      <!-- Phase 2.2: Enhanced explanation and actions -->
      @if (showDetails()) {
        <div class="confidence-explanation">
          <!-- Impact explanation -->
          <div class="explanation-text">
            @if (score() >= 0.9) {
              <span
                >Your ACWR calculation is highly reliable based on complete
                data.</span
              >
            } @else if (score() >= 0.7) {
              <span
                >ACWR reliability is reduced due to missing data. Estimates may
                vary by ±10%.</span
              >
            } @else if (score() >= 0.5) {
              <span
                >ACWR reliability is low. Missing data means estimates may vary
                significantly (±15-20%).</span
              >
            } @else {
              <span
                >ACWR reliability is very low. Critical data is missing.
                Estimates are unreliable.</span
              >
            }
          </div>

          <!-- Missing inputs display -->
          @if (missingInputs().length > 0) {
            <div class="missing-inputs">
              <strong>Missing data:</strong>
              <ul class="missing-list">
                @for (input of missingInputs(); track input) {
                  <li>{{ getInputLabel(input) }}</li>
                }
              </ul>
            </div>
          }

          <!-- Actions to improve -->
          @if (score() < 0.9 && showActions()) {
            <div class="confidence-actions">
              <strong>Improve confidence:</strong>
              <div class="action-buttons">
                @if (missingInputs().includes("wellness")) {
                  <app-button
                    iconLeft="pi-heart"
                    variant="outlined"
                    size="sm"
                    [routerLink]="['/wellness']"
                    >Complete Wellness Check-in</app-button
                  >
                }
                @if (missingInputs().includes("training")) {
                  <app-button
                    iconLeft="pi-plus"
                    variant="outlined"
                    size="sm"
                    [routerLink]="['/training/log']"
                    >Log Training Session</app-button
                  >
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .confidence-indicator {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .confidence-score {
        display: flex;
        align-items: baseline;
        gap: var(--space-2);
      }

      .score-value {
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
      }

      .score-label {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .confidence-bar {
        width: 100%;
        height: 8px;
        background: var(--surface-ground);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }

      .confidence-fill {
        height: 100%;
        transition: width 0.3s ease;
        border-radius: var(--radius-sm);
      }

      .confidence-fill.confidence-high {
        background: var(--ds-primary-green);
      }

      .confidence-fill.confidence-moderate {
        background: var(--ds-primary-yellow);
      }

      .confidence-fill.confidence-low {
        background: var(--ds-primary-orange);
      }

      .confidence-fill.confidence-very-low {
        background: var(--ds-primary-red);
      }

      .confidence-warnings {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      /* Phase 2.2: Enhanced styling */
      .confidence-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .confidence-explanation {
        margin-top: var(--space-3);
        padding-top: var(--space-3);
        border-top: 1px solid var(--color-border-secondary);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .explanation-text {
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        line-height: var(--ds-line-height-body);
      }

      .missing-inputs {
        margin-top: var(--space-2);
      }

      .missing-inputs strong {
        font-size: var(--ds-font-size-md);
        color: var(--color-text-primary);
        display: block;
        margin-bottom: var(--space-1);
      }

      .missing-list {
        margin: var(--space-1) 0 0 var(--space-4);
        padding: 0;
        list-style: disc;
        color: var(--color-text-secondary);
        font-size: var(--ds-font-size-md);
      }

      .confidence-actions {
        margin-top: var(--space-2);
        padding-top: var(--space-2);
        border-top: 1px solid var(--color-border-secondary);
      }

      .confidence-actions strong {
        font-size: var(--ds-font-size-md);
        color: var(--color-text-primary);
        display: block;
        margin-bottom: var(--space-2);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      /* Visual degradation states */
      .confidence-indicator.confidence-moderate,
      .confidence-indicator.confidence-low,
      .confidence-indicator.confidence-very-low {
        padding: var(--space-3);
        border-radius: var(--radius-md);
      }

      .confidence-indicator.confidence-moderate {
        border-left: 3px solid var(--ds-primary-yellow);
      }

      .confidence-indicator.confidence-low {
        border-left: 3px solid var(--ds-primary-orange);
      }

      .confidence-indicator.confidence-very-low {
        border-left: 3px solid var(--ds-primary-red);
        background: var(--color-status-error-subtle);
      }
    `,
  ],
})
export class ConfidenceIndicatorComponent {
  // Inputs
  score = input.required<number>(); // 0.0 to 1.0
  missingInputs = input<string[]>([]);
  staleData = input<string[]>([]);
  showDetails = input<boolean>(true);
  showActions = input<boolean>(true);

  // Computed
  confidenceLevel = computed(() => {
    const s = this.score();
    if (s >= 0.9) return "High";
    if (s >= 0.7) return "Moderate";
    if (s >= 0.5) return "Low";
    return "Very Low";
  });

  confidenceClass = computed(() => {
    const s = this.score();
    if (s >= 0.9) return "high";
    if (s >= 0.7) return "moderate";
    if (s >= 0.5) return "low";
    return "very-low";
  });

  getSeverity():
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "primary" {
    const s = this.score();
    if (s >= 0.9) return "success";
    if (s >= 0.7) return "warning";
    if (s >= 0.5) return "warning";
    return "danger";
  }

  getInputLabel(input: string): string {
    const labels: Record<string, string> = {
      wellness: "Wellness check-ins",
      training: "Training sessions",
      rpe: "Session intensity (RPE)",
      duration: "Session duration",
      sleep: "Sleep data",
      soreness: "Muscle soreness",
      stress: "Stress levels",
      energy: "Energy levels",
    };
    return labels[input] || input;
  }
}
