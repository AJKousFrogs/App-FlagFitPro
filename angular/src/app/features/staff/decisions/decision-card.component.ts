/**
 * Decision Card Component
 *
 * Displays a single decision in card format
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import type { DecisionLedgerEntry } from "@core/models/decision-ledger.models";
import { CardShellComponent } from "@shared/components/card-shell/card-shell.component";
import { ConfidenceIndicatorComponent } from "@shared/components/confidence-indicator/confidence-indicator.component";
import { formatDate, getTimeAgo } from "@shared/utils/date.utils";
import { ButtonComponent } from "@shared/components/button/button.component";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

@Component({
  selector: "app-decision-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    StatusTagComponent,
    CardShellComponent,
    ConfidenceIndicatorComponent,
  ],
  template: `
    <app-card-shell
      [title]="decision().athleteName || 'Unknown Athlete'"
      headerIcon="pi-file-edit"
      [class.decision-card--critical]="decision().reviewPriority === 'critical'"
      [class.decision-card--low-confidence]="confidenceScore() < 0.7"
    >
      <ng-container header-actions>
        <app-status-tag
          [value]="decision().reviewPriority"
          [severity]="getPrioritySeverity(decision().reviewPriority)"
          size="sm"
        />
      </ng-container>

      <div class="decision-card__content">
        <!-- Decision Summary -->
        <div class="decision-card__summary">
          <h4>{{ getDecisionTypeLabel(decision().decisionType) }}</h4>
          <p>{{ decision().decisionSummary }}</p>
        </div>

        <!-- Decision Maker -->
        <div class="decision-card__maker">
          <i class="pi pi-user"></i>
          <span>
            {{ decision().madeBy.name }}
            <span class="role-badge">{{ decision().madeBy.role }}</span>
          </span>
          <span class="time-ago">{{
            formatTimeAgo(decision().createdAt)
          }}</span>
        </div>

        <!-- Confidence Indicator -->
        <div class="decision-card__confidence">
          <app-confidence-indicator
            [score]="confidenceScore()"
            [missingInputs]="missingInputs()"
            [staleData]="staleData()"
          ></app-confidence-indicator>
        </div>

        <!-- Review Date -->
        <div class="decision-card__review">
          <i class="pi pi-calendar"></i>
          <span>
            Review due: {{ formatReviewDate(decision().reviewDate) }}
            @if (isOverdue(decision().reviewDate)) {
              <app-status-tag severity="danger" value="Overdue" size="sm" />
            }
          </span>
        </div>

        <!-- Actions -->
        <div class="decision-card__actions">
          <app-button
            iconLeft="pi-eye"
            variant="outlined"
            size="sm"
            [routerLink]="['/staff/decisions', decision().id]"
            >View Details</app-button
          >
          @if (canReview()) {
            <app-button
              iconLeft="pi-check"
              size="sm"
              (clicked)="review.emit(decision())"
              >Review Now</app-button
            >
          }
        </div>
      </div>
    </app-card-shell>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .decision-card__content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .decision-card__summary h4 {
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-2) 0;
      }

      .decision-card__summary p {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }

      .decision-card__maker {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .decision-card__maker i {
        color: var(--color-brand-primary);
      }

      .role-badge {
        padding: var(--space-1) var(--space-2);
        background: var(--surface-secondary);
        border-radius: var(--radius-sm);
        font-size: var(--ds-font-size-xs);
        margin-left: var(--space-1);
      }

      .time-ago {
        margin-left: auto;
        color: var(--color-text-tertiary);
      }

      .decision-card__confidence {
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--radius-md);
      }

      .decision-card__review {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .decision-card__review i {
        color: var(--color-brand-primary);
      }

      .decision-card__actions {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-2);
      }

      :host.decision-card--critical {
        border-left: 4px solid var(--ds-primary-red);
      }

      :host.decision-card--low-confidence {
        border-left: 4px solid var(--ds-primary-orange);
      }
    `,
  ],
})
export class DecisionCardComponent {
  // Inputs
  decision = input.required<DecisionLedgerEntry>();
  canReview = input<boolean>(false);

  // Outputs
  review = output<DecisionLedgerEntry>();

  // Computed
  confidenceScore = computed(() => {
    const basis = this.decision().decisionBasis;
    return basis.confidence || 0.8;
  });

  missingInputs = computed(() => {
    // DecisionBasis doesn't have missingInputs - return empty array
    return [] as string[];
  });

  staleData = computed(() => {
    // DecisionBasis doesn't have staleData - return empty array
    return [] as string[];
  });

  // Helpers
  getDecisionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      load_adjustment: "Load Adjustment",
      rtp_clearance: "RTP Clearance",
      rtp_progression: "RTP Progression",
      nutrition_change: "Nutrition Change",
      hydration_adjustment: "Hydration Adjustment",
      mental_protocol: "Mental Protocol",
      tactical_modification: "Tactical Modification",
      recovery_intervention: "Recovery Intervention",
      medical_constraint: "Medical Constraint",
      supplement_change: "Supplement Change",
      training_program_assignment: "Training Program Assignment",
      session_modification: "Session Modification",
      readiness_override: "Readiness Override",
      acwr_override: "ACWR Override",
      other: "Other Decision",
    };
    return labels[type] || type;
  }

  getPrioritySeverity(
    priority: "critical" | "high" | "normal" | "low",
  ): "danger" | "warning" | "info" | "success" {
    const severityMap = {
      critical: "danger" as const,
      high: "warning" as const,
      normal: "info" as const,
      low: "success" as const,
    };
    return severityMap[priority];
  }

  formatTimeAgo = getTimeAgo;

  formatReviewDate(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return formatDate(date, "P");
  }

  isOverdue(date: Date): boolean {
    return new Date(date) < new Date();
  }
}
