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
import { PageErrorStateComponent } from "@shared/components/page-error-state/page-error-state.component";
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
    PageErrorStateComponent,
  ],
  templateUrl: "./decision-detail.component.html",
  styleUrl: "./decision-detail.component.scss",
})
export class DecisionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  decisionService = inject(DecisionLedgerService);
  private logger = inject(LoggerService);

  // State
  decision = signal<DecisionLedgerEntry | null>(null);
  currentDecisionId = signal("");
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
      this.currentDecisionId.set(decisionId);
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
