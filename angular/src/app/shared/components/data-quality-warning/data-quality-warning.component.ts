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
import { Tooltip } from "primeng/tooltip";
import { AlertComponent, AlertVariant } from "../alert/alert.component";
import { ButtonComponent } from "../button/button.component";

export type DataQualityLevel = "high" | "medium" | "low" | "insufficient";

@Component({
  selector: "app-data-quality-warning",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip, AlertComponent, ButtonComponent],
  template: `
    @if (shouldShow()) {
      <app-alert
        [variant]="alertVariant()"
        [icon]="alertIcon()"
        [title]="title()"
        [message]="mainMessage()"
        [styleClass]="'data-quality-warning'"
        density="compact"
      >
        @if (hasSupplementalContent()) {
          <div class="data-quality-warning__content" [attr.aria-label]="ariaLabel()">
            @if (confidence() !== null) {
              <div class="data-quality-warning__meta">
                <span
                  class="data-quality-warning__confidence"
                  [pTooltip]="'Data confidence: ' + confidence() + '%'"
                >
                  {{ confidence() }}% confidence
                </span>
              </div>
            }

            @if (showDetails() && recommendations().length > 0) {
              <div class="data-quality-warning__recommendations">
                <span class="data-quality-warning__label">To improve accuracy:</span>
                <ul>
                  @for (rec of recommendations().slice(0, 2); track rec) {
                    <li>{{ rec }}</li>
                  }
                </ul>
              </div>
            }

            @if (actionLabel() && actionRoute()) {
              <div class="data-quality-warning__action">
                <app-button variant="text" size="sm" [routerLink]="actionRoute()">{{
                  actionLabel()
                }}</app-button>
              </div>
            }
          </div>
        }
      </app-alert>
    }
  `,
  styleUrl: "./data-quality-warning.component.scss",
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

  alertVariant = computed<AlertVariant>(() => {
    const level = this.qualityLevel();
    switch (level) {
      case "insufficient":
        return "error";
      case "low":
        return "warning";
      case "medium":
        return "info";
      default:
        return "success";
    }
  });

  alertIcon = computed(() => {
    const level = this.qualityLevel();
    switch (level) {
      case "insufficient":
        return "pi-exclamation-circle";
      case "low":
        return "pi-exclamation-triangle";
      case "medium":
        return "pi-info-circle";
      default:
        return "pi-check-circle";
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

  hasSupplementalContent = computed(
    () =>
      this.confidence() !== null ||
      (this.showDetails() && this.recommendations().length > 0) ||
      (!!this.actionLabel() && !!this.actionRoute()),
  );

  ariaLabel = computed(() => {
    const level = this.qualityLevel();
    const metric = this.metricName();
    const conf = this.confidence();

    return `${metric} data quality: ${level}${conf !== null ? `, ${conf}% confidence` : ""}`;
  });
}
