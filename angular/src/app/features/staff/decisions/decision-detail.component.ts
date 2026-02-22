/**
 * Decision Detail View Component
 *
 * Displays full details of a single decision
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";

import { ButtonComponent } from "@shared/components/button/button.component";

import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
} from "primeng/accordion";
import { StatusTagComponent } from "@shared/components/status-tag/status-tag.component";
import {
  decisionStatusSeverityMap,
  getMappedStatusSeverity,
} from "@shared/utils/status.utils";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { CardShellComponent } from "@shared/components/card-shell/card-shell.component";
import { ConfidenceIndicatorComponent } from "@shared/components/confidence-indicator/confidence-indicator.component";
import { AppLoadingComponent } from "@shared/components/loading/loading.component";
import { ReviewDecisionDialogComponent } from "./review-decision-dialog.component";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
import { LoggerService } from "@core/services/logger.service";
import type {
  DecisionLedgerEntry,
  ReviewDecisionRequest,
} from "@core/models/decision-ledger.models";

@Component({
  selector: "app-decision-detail",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    StatusTagComponent,
    PageHeaderComponent,
    CardShellComponent,
    ConfidenceIndicatorComponent,
    ReviewDecisionDialogComponent,
    AppLoadingComponent,
  ],
  template: `
    <div class="decision-detail">
      <!-- Loading State -->
      @if (isLoading()) {
        <app-loading message="Loading decision details..." variant="inline" />
      }

      <!-- Error State -->
      @else if (error()) {
        <div class="error-state">
          <p>Error: {{ error() }}</p>
          <app-button (clicked)="goBack()">Go Back</app-button>
        </div>
      }

      <!-- Decision Content -->
      @else if (decision()) {
        <app-page-header
          [title]="decision()!.athleteName || 'Decision Details'"
          subtitle="{{ getDecisionTypeLabel(decision()!.decisionType) }}"
        >
          <app-button
            iconLeft="pi-arrow-left"
            variant="outlined"
            (clicked)="goBack()"
            >Back to Decisions</app-button
          >
          @if (canReview()) {
            <app-button iconLeft="pi-check" (clicked)="openReviewDialog()"
              >Review Decision</app-button
            >
          }
        </app-page-header>

        <div class="detail-grid">
          <!-- Decision Overview -->
          <app-card-shell title="Decision Overview" headerIcon="pi-info-circle">
            <div class="overview-content">
              <div class="overview-item">
                <label>Decision Type</label>
                <p>{{ getDecisionTypeLabel(decision()!.decisionType) }}</p>
              </div>

              <div class="overview-item">
                <label>Summary</label>
                <p>{{ decision()!.decisionSummary }}</p>
              </div>

              <div class="overview-item">
                <label>Category</label>
                <app-status-tag
                  [value]="decision()!.decisionCategory"
                  severity="info"
                  size="sm"
                />
              </div>

              <div class="overview-item">
                <label>Status</label>
                <app-status-tag
                  [value]="decision()!.status"
                  [severity]="getStatusSeverity(decision()!.status)"
                  size="sm"
                />
              </div>

              <div class="overview-item">
                <label>Priority</label>
                <app-status-tag
                  [value]="decision()!.reviewPriority"
                  [severity]="getPrioritySeverity(decision()!.reviewPriority)"
                  size="sm"
                />
              </div>
            </div>
          </app-card-shell>

          <!-- Decision Maker -->
          <app-card-shell title="Decision Maker" headerIcon="pi-user">
            <div class="maker-content">
              <div class="maker-info">
                <strong>{{ decision()!.madeBy.name }}</strong>
                <span class="role-badge">{{ decision()!.madeBy.role }}</span>
              </div>
              <div class="maker-date">
                Made on {{ formatDate(decision()!.createdAt) }}
              </div>
            </div>
          </app-card-shell>

          <!-- Confidence -->
          <app-card-shell title="Confidence" headerIcon="pi-chart-line">
            <app-confidence-indicator
              [score]="confidenceScore()"
              [missingInputs]="missingInputs()"
              [staleData]="staleData()"
            ></app-confidence-indicator>
          </app-card-shell>

          <!-- Review Information -->
          <app-card-shell title="Review Information" headerIcon="pi-calendar">
            <div class="review-content">
              <div class="review-item">
                <label>Review Trigger</label>
                <p>{{ decision()!.reviewTrigger }}</p>
              </div>

              <div class="review-item">
                <label>Review Date</label>
                <p>
                  {{ formatDate(decision()!.reviewDate) }}
                  @if (isOverdue()) {
                    <app-status-tag
                      severity="danger"
                      value="Overdue"
                      size="sm"
                    />
                  }
                </p>
              </div>

              @if (decision()!.intendedDuration) {
                <div class="review-item">
                  <label>Intended Duration</label>
                  <p>{{ decision()!.intendedDuration }}</p>
                </div>
              }

              @if (decision()!.reviewedAt) {
                <div class="review-item">
                  <label>Reviewed On</label>
                  <p>{{ formatDate(decision()!.reviewedAt!) }}</p>
                </div>
              }

              @if (decision()!.reviewedBy) {
                <div class="review-item">
                  <label>Reviewed By</label>
                  <p>{{ decision()!.reviewedBy!.name }}</p>
                </div>
              }

              @if (decision()!.reviewOutcome) {
                <div class="review-item">
                  <label>Review Outcome</label>
                  <app-status-tag
                    [value]="decision()!.reviewOutcome || ''"
                    severity="success"
                    size="sm"
                  />
                </div>
              }
            </div>
          </app-card-shell>

          <!-- Decision Basis (Expandable) -->
          <app-card-shell title="Decision Basis" headerIcon="pi-file-edit">
            <p-accordion>
              <p-accordion-panel value="0">
                <p-accordion-header>Data Points Used</p-accordion-header>
                <p-accordion-content>
                  <ul class="data-points-list">
                    @for (
                      point of decision()!.decisionBasis.dataPoints;
                      track point
                    ) {
                      <li>{{ point }}</li>
                    }
                  </ul>
                </p-accordion-content>
              </p-accordion-panel>

              <p-accordion-panel value="1">
                <p-accordion-header>Constraints Considered</p-accordion-header>
                <p-accordion-content>
                  <ul class="constraints-list">
                    @for (
                      constraint of decision()!.decisionBasis.constraints;
                      track constraint
                    ) {
                      <li>{{ constraint }}</li>
                    }
                  </ul>
                </p-accordion-content>
              </p-accordion-panel>

              <p-accordion-panel value="2">
                <p-accordion-header>Rationale</p-accordion-header>
                <p-accordion-content>
                  <p>{{ decision()!.decisionBasis.rationale }}</p>
                </p-accordion-content>
              </p-accordion-panel>

              <p-accordion-panel value="3">
                <p-accordion-header>Data Quality</p-accordion-header>
                <p-accordion-content>
                  <div class="data-quality">
                    <div class="quality-item">
                      <label>Completeness</label>
                      <p>
                        {{
                          (decision()!.decisionBasis.dataQuality.completeness ||
                            0) * 100
                        }}%
                      </p>
                    </div>
                    <div class="quality-item">
                      <label>Stale Days</label>
                      <p>
                        {{
                          decision()!.decisionBasis.dataQuality.staleDays || 0
                        }}
                      </p>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            </p-accordion>
          </app-card-shell>

          <!-- Outcome Tracking (If Reviewed) -->
          @if (decision()!.outcomeData) {
            <app-card-shell title="Outcome" headerIcon="pi-check-circle">
              <div class="outcome-content">
                <div class="outcome-item">
                  <label>Goal Achieved</label>
                  <app-status-tag
                    [value]="
                      decision()!.outcomeData!.goalAchieved ? 'Yes' : 'No'
                    "
                    [severity]="
                      decision()!.outcomeData!.goalAchieved
                        ? 'success'
                        : 'warning'
                    "
                    size="sm"
                  />
                </div>

                @if (
                  decision()!.outcomeData!.unintendedConsequences &&
                  decision()!.outcomeData!.unintendedConsequences.length > 0
                ) {
                  <div class="outcome-item">
                    <label>Unintended Consequences</label>
                    <ul>
                      @for (
                        consequence of decision()!.outcomeData!
                          .unintendedConsequences;
                        track consequence
                      ) {
                        <li>{{ consequence }}</li>
                      }
                    </ul>
                  </div>
                }

                @if (decision()!.outcomeData!.lessonsLearned) {
                  <div class="outcome-item">
                    <label>Lessons Learned</label>
                    <p>{{ decision()!.outcomeData!.lessonsLearned }}</p>
                  </div>
                }
              </div>
            </app-card-shell>
          }

          <!-- Related Decisions -->
          @if (relatedDecisions().length > 0) {
            <app-card-shell title="Related Decisions" headerIcon="pi-link">
              <div class="related-decisions">
                @for (related of relatedDecisions(); track related.id) {
                  <div class="related-decision">
                    <a [routerLink]="['/staff/decisions', related.id]">
                      {{ related.decisionSummary }}
                    </a>
                    <app-status-tag
                      [value]="related.relation"
                      severity="info"
                      size="sm"
                    />
                  </div>
                }
              </div>
            </app-card-shell>
          }
        </div>
      }

      <!-- Review Decision Dialog -->
      <app-review-decision-dialog
        [visible]="showReviewDialog()"
        [decision]="decision()"
        (visibleChange)="onDialogVisibleChange($event)"
        (reviewed)="onDecisionReviewed($event)"
      ></app-review-decision-dialog>
    </div>
  `,
  styles: [
    `
      .decision-detail {
        padding: var(--space-6);
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(calc(var(--size-200) * 2), 1fr)
        );
        gap: var(--space-4);
        margin-top: var(--space-6);
      }

      .overview-content,
      .maker-content,
      .review-content,
      .outcome-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .overview-item,
      .review-item,
      .outcome-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .overview-item label,
      .review-item label,
      .outcome-item label {
        font-size: var(--ds-font-size-sm);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-secondary);
      }

      .overview-item p,
      .review-item p {
        font-size: var(--ds-font-size-md);
        color: var(--color-text-primary);
        margin: 0;
      }

      .maker-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .role-badge {
        padding: var(--space-1) var(--space-2);
        background: var(--surface-secondary);
        border-radius: var(--radius-sm);
        font-size: var(--ds-font-size-xs);
      }

      .maker-date {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .data-points-list,
      .constraints-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .data-points-list li,
      .constraints-list li {
        padding: var(--space-2) 0;
        border-bottom: var(--border-1) solid var(--color-border-secondary);
      }

      .data-quality {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
      }

      .quality-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .quality-item label {
        font-size: var(--ds-font-size-sm);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-secondary);
      }

      .related-decisions {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .related-decision {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--radius-md);
      }

      .related-decision a {
        color: var(--color-brand-primary);
        text-decoration: none;
      }

      .related-decision a:hover {
        text-decoration: underline;
      }

      .error-state {
        padding: var(--space-8);
        text-align: center;
      }

      @media (max-width: 768px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DecisionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  decisionService = inject(DecisionLedgerService);
  private logger = inject(LoggerService);

  // State
  decision = signal<DecisionLedgerEntry | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  relatedDecisions = signal<
    Array<{
      id: string;
      title: string;
      category: string;
      outcome: string;
      decisionSummary: string;
      relation: string;
    }>
  >([]);
  showReviewDialog = signal(false);

  // Computed
  confidenceScore = computed(() => {
    const d = this.decision();
    if (!d) return 0.8;
    return d.decisionBasis.confidence || 0.8;
  });

  missingInputs = computed(() => {
    // DecisionBasis doesn't have missingInputs - return empty array
    return [] as string[];
  });

  staleData = computed(() => {
    // DecisionBasis doesn't have staleData - return empty array
    return [] as string[];
  });

  ngOnInit(): void {
    const decisionId = this.route.snapshot.paramMap.get("id");
    if (decisionId) {
      this.loadDecision(decisionId);
    } else {
      this.error.set("Decision ID not provided");
    }
  }

  async loadDecision(decisionId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const decision = await this.decisionService.getDecisionById(decisionId);
      this.decision.set(decision);

      // Load related decisions if available
      const related = (
        decision as DecisionLedgerEntry & {
          relatedDecisions?: DecisionLedgerEntry[];
        }
      ).relatedDecisions;
      if (related) {
        this.relatedDecisions.set(
          related.map((entry) => ({
            id: entry.id,
            title: entry.decisionSummary,
            category: entry.decisionCategory,
            outcome: entry.reviewOutcome ?? entry.status,
            decisionSummary: entry.decisionSummary,
            relation:
              (entry as { relation?: string }).relation ?? "related decision",
          })),
        );
      }
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Failed to load decision",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  canReview(): boolean {
    const d = this.decision();
    if (!d) return false;
    return d.status === "active" && new Date(d.reviewDate) <= new Date();
  }

  openReviewDialog(): void {
    this.showReviewDialog.set(true);
  }

  onDialogVisibleChange(visible: boolean): void {
    this.showReviewDialog.set(visible);
  }

  async onDecisionReviewed(request: ReviewDecisionRequest): Promise<void> {
    try {
      const decisionId = this.decision()?.id;
      if (!decisionId) return;

      await this.decisionService.reviewDecision(decisionId, request);
      this.showReviewDialog.set(false);
      await this.loadDecision(decisionId); // Reload decision
    } catch (error) {
      this.logger.error("Error reviewing decision", error);
    }
  }

  goBack(): void {
    this.router.navigate(["/staff/decisions"]);
  }

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

  getStatusSeverity = (status: string) =>
    getMappedStatusSeverity(status, decisionStatusSeverityMap, "info");

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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  isOverdue(): boolean {
    const d = this.decision();
    if (!d) return false;
    return new Date(d.reviewDate) < new Date();
  }
}
