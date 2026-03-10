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
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../button/button.component";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { MissingDataStatus } from "../../../core/services/missing-data-detection.service";

@Component({
  selector: "app-missing-data-explanation",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardShellComponent,
    StatusTagComponent,
  ],
  template: `
    @if (missingStatus() && missingStatus()!.missing) {
      <app-card-shell
        class="missing-data-card"
        [class]="'severity-' + missingStatus()!.severity"
        [flush]="true"
      >
        <div class="missing-data-header">
          <div class="header-content">
            <i [class]="getIconClass()"></i>
            <div class="header-text">
              <h3>{{ getTitle() }}</h3>
              <p class="days-missing">
                {{ missingStatus()!.daysMissing }} day{{
                  missingStatus()!.daysMissing > 1 ? "s" : ""
                }}
                without wellness check-in
              </p>
            </div>
          </div>
          <app-status-tag
            [value]="getSeverityLabel()"
            [severity]="getSeverityTag()"
            size="sm"
          />
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
          @if (
            missingStatus()!.severity === "critical" ||
            missingStatus()!.daysMissing >= 3
          ) {
            <div class="escalation-section">
              <div class="escalation-badge">
                <i class="pi pi-bell"></i>
                <span
                  >Your coach has been notified due to continued missing
                  data.</span
                >
              </div>
            </div>
          }

          <!-- Action buttons -->
          <div class="action-section">
            <app-button iconLeft="pi-heart" [routerLink]="['/wellness']"
              >Complete Wellness Check-in</app-button
            >
            @if (showCoachLink()) {
              <app-button
                iconLeft="pi-info-circle"
                variant="outlined"
                [routerLink]="['/dashboard']"
                >View Missing Data Details</app-button
              >
            }
          </div>
        </div>
      </app-card-shell>
    }
  `,
  styleUrl: "./missing-data-explanation.component.scss",
})
export class MissingDataExplanationComponent {
  missingStatus = input<MissingDataStatus | null>(null);
  showCoachLink = input<boolean>(false);

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

  getSeverityTag():
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "contrast" {
    const severity = this.missingStatus()?.severity || "warning";
    return severity === "critical" ? "danger" : "warning";
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
