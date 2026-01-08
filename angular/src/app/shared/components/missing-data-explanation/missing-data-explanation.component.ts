/**
 * Missing Data Explanation Component
 * 
 * Phase 2.2 - Data Literacy
 * Explains why missing wellness data matters, shows impact, and provides clear actions
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  inject,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { MissingDataStatus } from "../../../core/services/missing-data-detection.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-missing-data-explanation",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TagModule,
    ButtonModule,
    CardModule,
  ],
  template: `
    @if (missingStatus() && missingStatus()!.missing) {
      <p-card styleClass="missing-data-card" [class]="'severity-' + missingStatus()!.severity">
        <div class="missing-data-header">
          <div class="header-content">
            <i [class]="getIconClass()"></i>
            <div class="header-text">
              <h3>{{ getTitle() }}</h3>
              <p class="days-missing">
                {{ missingStatus()!.daysMissing }} day{{ missingStatus()!.daysMissing > 1 ? 's' : '' }} without wellness check-in
              </p>
            </div>
          </div>
          <p-tag
            [value]="getSeverityLabel()"
            [severity]="getSeverityTag()"
            styleClass="severity-badge"
          ></p-tag>
        </div>

        <div class="missing-data-content">
          <!-- Why it matters -->
          <div class="explanation-section">
            <strong>Why this matters:</strong>
            <p>{{ getWhyItMatters() }}</p>
          </div>

          <!-- Impact on ACWR -->
          <div class="impact-section">
            <strong>Impact on your ACWR:</strong>
            <ul class="impact-list">
              @for (impact of getImpactList(); track impact) {
                <li>{{ impact }}</li>
              }
            </ul>
          </div>

          <!-- Escalation visibility -->
          @if (missingStatus()!.severity === "critical" || missingStatus()!.daysMissing >= 3) {
            <div class="escalation-section">
              <div class="escalation-badge">
                <i class="pi pi-bell"></i>
                <span>Your coach has been notified due to continued missing data.</span>
              </div>
            </div>
          }

          <!-- Action buttons -->
          <div class="action-section">
            <p-button
              label="Complete Wellness Check-in"
              icon="pi pi-heart"
              [routerLink]="['/wellness']"
              styleClass="p-button-primary"
            ></p-button>
            @if (showCoachLink()) {
              <p-button
                label="View Missing Data Details"
                icon="pi pi-info-circle"
                [routerLink]="['/dashboard']"
                variant="outlined"
                styleClass="p-button-outlined"
              ></p-button>
            }
          </div>
        </div>
      </p-card>
    }
  `,
  styles: [
    `
      .missing-data-card {
        margin-bottom: var(--space-4);
        border-left: 4px solid;
      }

      .missing-data-card.severity-warning {
        border-left-color: var(--color-status-warning);
        background: var(--color-status-warning-subtle);
      }

      .missing-data-card.severity-critical {
        border-left-color: var(--color-status-error);
        background: var(--color-status-error-subtle);
      }

      .missing-data-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-4);
      }

      .header-content {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
        flex: 1;
      }

      .header-content i {
        font-size: var(--font-size-h2);
        color: var(--color-status-warning);
      }

      .severity-critical .header-content i {
        color: var(--color-status-error);
      }

      .header-text h3 {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .days-missing {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
      }

      .severity-badge {
        font-size: var(--font-size-h4);
      }

      .missing-data-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .explanation-section,
      .impact-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .explanation-section strong,
      .impact-section strong {
        font-size: var(--font-size-body);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-semibold);
      }

      .explanation-section p {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
        line-height: 1.6;
      }

      .impact-list {
        margin: var(--space-1) 0 0 var(--space-4);
        padding: 0;
        list-style: disc;
        color: var(--color-text-secondary);
        font-size: var(--font-size-body);
      }

      .impact-list li {
        margin-bottom: var(--space-1);
      }

      .escalation-section {
        margin-top: var(--space-2);
      }

      .escalation-badge {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: rgba(255, 255, 255, 0.5);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border-primary);
      }

      .escalation-badge i {
        font-size: var(--font-size-h3);
        color: var(--color-status-info);
      }

      .escalation-badge span {
        font-size: var(--font-size-body);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
      }

      .action-section {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-2);
        flex-wrap: wrap;
      }
    `,
  ],
})
export class MissingDataExplanationComponent {
  missingStatus = input<MissingDataStatus | null>(null);
  showCoachLink = input<boolean>(false);

  private logger = inject(LoggerService);

  getTitle(): string {
    const days = this.missingStatus()?.daysMissing || 0;
    if (days >= 7) {
      return "Critical: Missing Wellness Data";
    } else if (days >= 3) {
      return "Warning: Missing Wellness Data";
    }
    return "Missing Wellness Data";
  }

  getIconClass(): string {
    const severity = this.missingStatus()?.severity || "warning";
    if (severity === "critical") {
      return "pi pi-exclamation-triangle";
    }
    return "pi pi-exclamation-circle";
  }

  getSeverityLabel(): string {
    const severity = this.missingStatus()?.severity || "warning";
    if (severity === "critical") {
      return "Critical";
    }
    return "Warning";
  }

  getSeverityTag(): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
    const severity = this.missingStatus()?.severity || "warning";
    return severity === "critical" ? "danger" : "warn";
  }

  getWhyItMatters(): string {
    const days = this.missingStatus()?.daysMissing || 0;
    if (days >= 7) {
      return "Wellness data helps us understand your readiness to train and prevent injury. Without it, ACWR calculations become unreliable and injury risk increases.";
    } else if (days >= 3) {
      return "Wellness check-ins help track your recovery and readiness. Missing data reduces the accuracy of your ACWR calculation and injury risk assessment.";
    }
    return "Regular wellness check-ins help maintain accurate ACWR calculations and injury prevention.";
  }

  getImpactList(): string[] {
    const days = this.missingStatus()?.daysMissing || 0;
    const impacts: string[] = [];

    if (days >= 3) {
      impacts.push("ACWR confidence reduced (missing recovery context)");
    }
    if (days >= 5) {
      impacts.push("Injury risk assessment less reliable");
    }
    if (days >= 7) {
      impacts.push("AI recommendations become conservative");
      impacts.push("Coach visibility limited");
    }

    impacts.push("Training load recommendations may be less accurate");

    return impacts;
  }
}

