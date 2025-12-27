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

import { Component, OnInit, inject, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { RouterModule } from "@angular/router";
import {
  TrainingSafetyService,
  SafetyWarning,
  WarningSeverity,
} from "../../../core/services/training-safety.service";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-safety-warnings",
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, RouterModule],
  template: `
    @if (hasWarnings()) {
      <div class="safety-warnings-container">
        <div class="warnings-header">
          <div class="header-content">
            <i class="pi pi-shield header-icon"></i>
            <div>
              <h3 class="header-title">Training Safety Alerts</h3>
              <p class="header-subtitle">
                {{ warningCount() }} issue(s) detected that may affect your training
              </p>
            </div>
          </div>
          @if (hasCriticalWarnings()) {
            <p-tag
              value="CRITICAL"
              severity="danger"
              [rounded]="true"
              styleClass="critical-tag"
            ></p-tag>
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
                  <p-tag
                    [value]="getSeverityLabel(warning.severity)"
                    [severity]="getSeverityTagType(warning.severity)"
                    [rounded]="true"
                  ></p-tag>
                </div>
                <p class="warning-message">{{ warning.message }}</p>
                @if (warning.recommendation) {
                  <p class="warning-recommendation">
                    <strong>Recommendation:</strong> {{ warning.recommendation }}
                  </p>
                }
                @if (warning.metric && warning.currentValue !== undefined) {
                  <div class="warning-metric">
                    <span class="metric-label">{{ formatMetricLabel(warning.metric) }}:</span>
                    <span class="metric-value" [class.over-threshold]="warning.currentValue > (warning.threshold || 0)">
                      {{ warning.currentValue }}
                    </span>
                    @if (warning.threshold) {
                      <span class="metric-threshold">/ {{ warning.threshold }}</span>
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
          <p-button
            label="View Full Safety Report"
            icon="pi pi-chart-bar"
            [outlined]="true"
            routerLink="/training/safety"
          ></p-button>
          @if (!hasAgeData()) {
            <p-button
              label="Set Birth Date"
              icon="pi pi-user-edit"
              routerLink="/settings/profile"
            ></p-button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .safety-warnings-container {
        background: var(--surface-primary);
        border-radius: var(--radius-lg);
        border: 2px solid var(--p-orange-200);
        padding: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .warnings-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-3);
        border-bottom: 1px solid var(--p-surface-200);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .header-icon {
        font-size: var(--icon-3xl);
        color: var(--p-orange-500);
      }

      .header-title {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin: 0 0 var(--space-1) 0;
      }

      .header-subtitle {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .critical-tag {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }

      .warnings-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .warning-item {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--radius-md);
        border-left: 4px solid;
      }

      .warning-critical {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        border-left-color: #c62828;
      }

      .warning-danger {
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        border-left-color: #e65100;
      }

      .warning-warning {
        background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
        border-left-color: #f9a825;
      }

      .warning-info {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-left-color: #1565c0;
      }

      .warning-icon {
        font-size: var(--icon-xl);
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .warning-critical .warning-icon {
        color: #c62828;
      }

      .warning-danger .warning-icon {
        color: #e65100;
      }

      .warning-warning .warning-icon {
        color: #f9a825;
      }

      .warning-info .warning-icon {
        color: #1565c0;
      }

      .warning-content {
        flex: 1;
      }

      .warning-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .warning-title {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin: 0;
      }

      .warning-message {
        font-size: var(--font-body-sm);
        color: var(--text-primary);
        margin: 0 0 var(--space-2) 0;
        line-height: 1.5;
      }

      .warning-recommendation {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin: 0;
        padding: var(--space-2);
        background: rgba(255, 255, 255, 0.5);
        border-radius: var(--radius-sm);
      }

      .warning-metric {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-2);
        font-size: var(--font-body-sm);
      }

      .metric-label {
        color: var(--text-secondary);
      }

      .metric-value {
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
      }

      .metric-value.over-threshold {
        color: #c62828;
      }

      .metric-threshold {
        color: var(--text-secondary);
      }

      .recommendations-section {
        margin-top: var(--space-4);
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--radius-md);
      }

      .recommendations-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin: 0 0 var(--space-3) 0;
      }

      .recommendations-title i {
        color: var(--p-yellow-600);
      }

      .recommendations-list {
        margin: 0;
        padding-left: var(--space-5);
      }

      .recommendations-list li {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
        line-height: 1.5;
      }

      .recommendations-list li:last-child {
        margin-bottom: 0;
      }

      .warnings-actions {
        display: flex;
        gap: var(--space-3);
        margin-top: var(--space-4);
        padding-top: var(--space-3);
        border-top: 1px solid var(--p-surface-200);
      }

      @media (max-width: 768px) {
        .warnings-header {
          flex-direction: column;
          gap: var(--space-3);
        }

        .warning-header-row {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-2);
        }

        .warnings-actions {
          flex-direction: column;
        }
      }
    `,
  ],
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
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
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
      user.id
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
    severity: WarningSeverity
  ): "danger" | "warn" | "info" | "success" {
    switch (severity) {
      case "critical":
      case "danger":
        return "danger";
      case "warning":
        return "warn";
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
