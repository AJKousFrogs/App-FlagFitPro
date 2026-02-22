/**
 * Safety Warnings Component
 *
 * CRITICAL SAFETY COMPONENT
 *
 * Displays training safety warnings to prevent athlete injury.
 * Shows warnings for:
 * - Training frequency limits
 * - Sleep debt
 * - Movement volume limits
 * - Recovery requirements
 * - Age-adjusted recommendations
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";

import { ButtonComponent } from "../button/button.component";

import { StatusTagComponent } from "../status-tag/status-tag.component";
import { RouterModule } from "@angular/router";
import {
  TrainingSafetyService,
  WarningSeverity,
} from "../../../core/services/training-safety.service";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-safety-warnings",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, StatusTagComponent, RouterModule, ButtonComponent],
  template: `
    @if (hasWarnings()) {
      <div class="safety-warnings-container">
        <div class="warnings-header">
          <div class="header-content">
            <i class="pi pi-shield header-icon"></i>
            <div>
              <h3 class="header-title">Training Safety Alerts</h3>
              <p class="header-subtitle">
                {{ warningCount() }} issue(s) detected that may affect your
                training
              </p>
            </div>
          </div>
          @if (hasCriticalWarnings()) {
            <app-status-tag value="CRITICAL" severity="danger" size="sm" />
          }
        </div>

        <div class="warnings-list">
          @for (warning of sortedWarnings(); track warning.id) {
            <div
              class="warning-item"
              [class.warning-critical]="warning.severity === 'critical'"
              [class.warning-danger]="warning.severity === 'danger'"
              [class.warning-warning]="warning.severity === 'warning'"
              [class.warning-info]="warning.severity === 'info'"
            >
              <div class="warning-icon">
                <i [class]="getWarningIcon(warning.severity)"></i>
              </div>
              <div class="warning-content">
                <div class="warning-header-row">
                  <h4 class="warning-title">{{ warning.title }}</h4>
                  <app-status-tag
                    [value]="getSeverityLabel(warning.severity)"
                    [severity]="getSeverityTagType(warning.severity)"
                    size="sm"
                  />
                </div>
                <p class="warning-message">{{ warning.message }}</p>
                @if (warning.recommendation) {
                  <p class="warning-recommendation">
                    <strong>Recommendation:</strong>
                    {{ warning.recommendation }}
                  </p>
                }
                @if (warning.metric && warning.currentValue !== undefined) {
                  <div class="warning-metric">
                    <span class="metric-label"
                      >{{ formatMetricLabel(warning.metric) }}:</span
                    >
                    <span
                      class="metric-value"
                      [class.over-threshold]="
                        warning.currentValue > (warning.threshold || 0)
                      "
                    >
                      {{ warning.currentValue }}
                    </span>
                    @if (warning.threshold) {
                      <span class="metric-threshold"
                        >/ {{ warning.threshold }}</span
                      >
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>

        @if (recommendations().length > 0) {
          <div class="recommendations-section">
            <h4 class="recommendations-title">
              <i class="pi pi-lightbulb"></i>
              Recommendations
            </h4>
            <ul class="recommendations-list">
              @for (rec of recommendations(); track rec) {
                <li>{{ rec }}</li>
              }
            </ul>
          </div>
        }

        <div class="warnings-actions">
          <app-button
            variant="outlined"
            iconLeft="pi-chart-bar"
            routerLink="/training/safety"
            >View Full Safety Report</app-button
          >
          @if (!hasAgeData()) {
            <app-button iconLeft="pi-user-edit" routerLink="/settings/profile"
              >Set Birth Date</app-button
            >
          }
        </div>
      </div>
    }
  `,
  styleUrl: "./safety-warnings.component.scss",
})
export class SafetyWarningsComponent implements OnInit {
  private safetyService = inject(TrainingSafetyService);
  private authService = inject(AuthService);

  // Expose service signals
  hasWarnings = computed(() => this.safetyService.warningCount() > 0);
  warningCount = this.safetyService.warningCount;
  hasCriticalWarnings = this.safetyService.hasCriticalWarnings;
  hasAgeData = this.safetyService.hasAgeData;

  // Local state
  private _recommendations = computed<string[]>(() => []);

  recommendations = this._recommendations;

  sortedWarnings = computed(() => {
    const warnings = this.safetyService.activeWarnings();
    // Sort by severity: critical > danger > warning > info
    const severityOrder: Record<WarningSeverity, number> = {
      critical: 0,
      danger: 1,
      warning: 2,
      info: 3,
    };
    return [...warnings].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );
  });

  ngOnInit(): void {
    this.loadSafetyData();
  }

  private async loadSafetyData(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    // Load athlete data
    await this.safetyService.loadAthleteAge(user.id);
    await this.safetyService.loadWeeklyMovements(user.id);

    // Perform initial safety check with a hypothetical medium session
    await this.safetyService.performSafetyCheck(
      { intensity: "medium", duration: 60 },
      user.id,
    );
  }

  getWarningIcon(severity: WarningSeverity): string {
    switch (severity) {
      case "critical":
        return "pi pi-exclamation-circle";
      case "danger":
        return "pi pi-exclamation-triangle";
      case "warning":
        return "pi pi-info-circle";
      case "info":
        return "pi pi-info";
      default:
        return "pi pi-info-circle";
    }
  }

  getSeverityLabel(severity: WarningSeverity): string {
    switch (severity) {
      case "critical":
        return "CRITICAL";
      case "danger":
        return "HIGH";
      case "warning":
        return "MEDIUM";
      case "info":
        return "LOW";
      default:
        return (severity as string).toUpperCase();
    }
  }

  getSeverityTagType(
    severity: WarningSeverity,
  ): "danger" | "warning" | "info" | "success" {
    switch (severity) {
      case "critical":
      case "danger":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  }

  formatMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      sessions_per_week: "Sessions this week",
      high_intensity_sessions: "High-intensity sessions",
      consecutive_days: "Consecutive training days",
      sprints_per_session: "Sprints planned",
      sprints_per_week: "Weekly sprints",
      cuts_per_session: "Cuts planned",
      cuts_per_week: "Weekly cuts",
      sleep_debt_hours: "Sleep debt",
    };
    return labels[metric] || metric.replace(/_/g, " ");
  }
}
