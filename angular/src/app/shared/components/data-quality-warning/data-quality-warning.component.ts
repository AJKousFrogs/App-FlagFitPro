/**
 * Data Quality Warning Component
 *
 * Displays warnings when calculations are based on incomplete or insufficient data.
 * This ensures athletes are aware when metrics may not be fully reliable.
 *
 * CRITICAL FOR INJURY PREVENTION: Athletes should know when ACWR, readiness,
 * or other metrics are calculated with incomplete data so they can make
 * informed training decisions.
 *
 * Usage:
 * <app-data-quality-warning
 *   [qualityLevel]="dataQuality().level"
 *   [confidence]="dataQuality().confidence"
 *   [issues]="dataQuality().issues"
 *   [recommendations]="dataQuality().recommendations"
 *   [metricName]="'ACWR'"
 * ></app-data-quality-warning>
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Message } from "primeng/message";
import { Tooltip } from "primeng/tooltip";
import { ButtonComponent } from "../button/button.component";

export type DataQualityLevel = "high" | "medium" | "low" | "insufficient";

@Component({
  selector: "app-data-quality-warning",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Message, Tooltip, ButtonComponent],
  template: `
    @if (shouldShow()) {
      <div
        class="data-quality-warning"
        [class]="'quality-' + qualityLevel()"
        role="alert"
        [attr.aria-label]="ariaLabel()"
      >
        <div class="warning-header">
          <i [class]="iconClass()"></i>
          <span class="warning-title">{{ title() }}</span>
          @if (confidence() !== null) {
            <span
              class="confidence-badge"
              [pTooltip]="'Data confidence: ' + confidence() + '%'"
            >
              {{ confidence() }}% confidence
            </span>
          }
        </div>

        @if (issues().length > 0 && showDetails()) {
          <div class="warning-details">
            <p class="warning-message">{{ mainMessage() }}</p>

            @if (recommendations().length > 0) {
              <div class="recommendations">
                <span class="rec-label">To improve accuracy:</span>
                <ul>
                  @for (rec of recommendations().slice(0, 2); track rec) {
                    <li>{{ rec }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        }

        @if (actionLabel() && actionRoute()) {
          <div class="warning-action">
            <app-button variant="text" size="sm" [routerLink]="actionRoute()">{{
              actionLabel()
            }}</app-button>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .data-quality-warning {
        padding: var(--ds-space-2) var(--ds-space-3);
        border-radius: var(--radius-md);
        margin-bottom: var(--ds-space-2);
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-1);
      }

      .quality-insufficient {
        background: rgba(var(--color-status-danger-rgb), 0.1);
        border-left: var(--space-1) solid var(--color-status-danger);
      }

      .quality-low {
        background: rgba(var(--color-status-warning-rgb), 0.1);
        border-left: var(--space-1) solid var(--color-status-warning);
      }

      .quality-medium {
        background: rgba(var(--color-status-info-rgb), 0.08);
        border-left: var(--space-1) solid var(--color-status-info);
      }

      .quality-high {
        display: none; /* Don't show warning for high quality data */
      }

      .warning-header {
        display: flex;
        align-items: center;
        gap: var(--ds-space-2);
      }

      .warning-header i {
        font-size: var(--ds-font-size-1-1rem);
      }

      .quality-insufficient .warning-header i {
        color: var(--color-status-danger);
      }

      .quality-low .warning-header i {
        color: var(--color-status-warning);
      }

      .quality-medium .warning-header i {
        color: var(--color-status-info);
      }

      .warning-title {
        font-weight: var(--ds-font-weight-semibold);
        font-size: var(--ds-font-size-0-9rem);
      }

      .confidence-badge {
        margin-left: auto;
        padding: calc(var(--ds-space-1) / 2) var(--ds-space-2);
        border-radius: var(--radius-full);
        font-size: var(--ds-font-size-xs);
        font-weight: var(--ds-font-weight-medium);
        background: var(--surface-secondary);
      }

      .warning-details {
        padding-left: calc(
          var(--ds-font-size-1-1rem) + var(--ds-space-2)
        );
      }

      .warning-message {
        margin: 0;
        font-size: var(--ds-font-size-0-85rem);
        color: var(--color-text-secondary);
      }

      .recommendations {
        margin-top: var(--ds-space-1);
        font-size: var(--ds-font-size-0-8rem);
      }

      .rec-label {
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-secondary);
      }

      .recommendations ul {
        margin: var(--ds-space-1) 0 0;
        padding-left: var(--ds-space-3);
      }

      .recommendations li {
        color: var(--color-text-secondary);
        margin-bottom: calc(var(--ds-space-1) / 2);
      }

      .warning-action {
        padding-left: calc(
          var(--ds-font-size-1-1rem) + var(--ds-space-2)
        );
      }
    `,
  ],
})
export class DataQualityWarningComponent {
  // Inputs
  qualityLevel = input<DataQualityLevel>("high");
  confidence = input<number | null>(null);
  issues = input<string[]>([]);
  recommendations = input<string[]>([]);
  metricName = input<string>("Metric");
  showDetails = input<boolean>(true);
  actionLabel = input<string | null>(null);
  actionRoute = input<string | null>(null);

  // Computed values
  shouldShow = computed(() => {
    const level = this.qualityLevel();
    return level === "insufficient" || level === "low" || level === "medium";
  });

  iconClass = computed(() => {
    const level = this.qualityLevel();
    switch (level) {
      case "insufficient":
        return "pi pi-exclamation-circle";
      case "low":
        return "pi pi-exclamation-triangle";
      case "medium":
        return "pi pi-info-circle";
      default:
        return "pi pi-check-circle";
    }
  });

  title = computed(() => {
    const level = this.qualityLevel();
    const metric = this.metricName();

    switch (level) {
      case "insufficient":
        return `Insufficient data for ${metric}`;
      case "low":
        return `Low confidence ${metric}`;
      case "medium":
        return `${metric} based on limited data`;
      default:
        return `${metric} data quality: Good`;
    }
  });

  mainMessage = computed(() => {
    const issues = this.issues();
    if (issues.length > 0) {
      return issues[0];
    }

    const level = this.qualityLevel();
    switch (level) {
      case "insufficient":
        return "Not enough training data to calculate this metric reliably.";
      case "low":
        return "This value may not be accurate due to sparse data.";
      case "medium":
        return "Continue logging sessions to improve accuracy.";
      default:
        return "";
    }
  });

  ariaLabel = computed(() => {
    const level = this.qualityLevel();
    const metric = this.metricName();
    const conf = this.confidence();

    return `${metric} data quality: ${level}${conf !== null ? `, ${conf}% confidence` : ""}`;
  });
}
