/**
 * Roster Player Card Component (Phase 1 Enhanced)
 *
 * Displays a single player card with:
 * - Live performance metrics (Readiness, ACWR, Performance Score)
 * - Position-specific insights (QB arm care, WR sprint capacity, etc.)
 * - Risk level indicators
 * - Quick actions for coaches
 */
import {
  Component,
  input,
  output,
  computed,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { TitleCasePipe, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { type CheckboxChangeEvent } from "primeng/checkbox";
import { CheckboxComponent } from "../../../shared/components/checkbox/checkbox.component";
import { Tooltip } from "primeng/tooltip";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { SemanticMeaningRendererComponent } from "../../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import {
  StatusTagComponent,
  StatusTagSeverity,
} from "../../../shared/components/status-tag/status-tag.component";
import { RiskMeaning } from "../../../core/semantics/semantic-meaning.types";
import { getRiskSeverityFromLevel } from "../../../shared/utils/risk.utils";
import { Player } from "../roster.models";
import {
  PlayerMetricsService,
  PlayerWithMetrics,
} from "../services/player-metrics.service";
import { getCountryFlag } from "../../../core/constants";
import {
  getJerseyColor,
  getPlayerStats,
  formatHeight,
  formatWeight,
} from "../roster-utils";
import { TRAINING } from "../../../core/constants/app.constants";

@Component({
  selector: "app-roster-player-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CheckboxComponent,
    Tooltip,
    ProgressBarComponent,
    TitleCasePipe,
    DecimalPipe,
    CardShellComponent,
    SemanticMeaningRendererComponent,
    IconButtonComponent,
    StatusTagComponent,
  ],
  templateUrl: "./roster-player-card.component.html",
  styleUrl: "./roster-player-card.component.scss",
})
export class RosterPlayerCardComponent {
  private readonly metricsService = inject(PlayerMetricsService);

  // Inputs
  player = input.required<Player>();
  isSelected = input<boolean>(false);
  canManage = input<boolean>(false);
  canDelete = input<boolean>(false);

  // Outputs
  viewDetails = output<Player>();
  edit = output<Player>();
  changeStatus = output<Player>();
  remove = output<Player>();
  selectionChange = output<string>();
  adjustLoad = output<Player>();

  // Expose utility functions
  getJerseyColor = getJerseyColor;
  formatHeight = formatHeight;
  formatWeight = formatWeight;
  getCountryFlag = getCountryFlag;

  // Computed: Enriched player with live metrics
  enrichedPlayer = computed<PlayerWithMetrics>(() => {
    return this.metricsService.enrichPlayer(this.player());
  });

  // Computed: Position-specific insight
  positionInsight = computed<{
    text: string;
    icon: string;
    type: string;
  } | null>(() => {
    const p = this.enrichedPlayer();
    const position = p.position;

    // QB-specific
    if (position === "QB") {
      const qbStatus = this.metricsService.getQBStatus(p);
      if (qbStatus) {
        const percentage = Math.round(
          (qbStatus.throwsThisWeek / qbStatus.weeklyLimit) * 100,
        );
        return {
          text: `Arm Care: ${qbStatus.armCareStatus} � Throws: ${qbStatus.throwsThisWeek}/${qbStatus.weeklyLimit}`,
          icon: "pi pi-bolt",
          type: percentage > 80 ? "warning" : "info",
        };
      }
    }

    // WR/DB-specific
    if (position === "WR" || position === "DB") {
      const sprintCapacity = p.positionMetrics?.sprintCapacity;
      if (sprintCapacity !== undefined) {
        return {
          text: `Sprint Capacity: ${sprintCapacity}%`,
          icon: "pi pi-forward",
          type:
            sprintCapacity < TRAINING.SPRINT_CAPACITY_WARNING
              ? "warning"
              : "info",
        };
      }
    }

    // Rusher-specific
    if (position === "Rusher") {
      const firstStep = p.positionMetrics?.firstStepExplosion;
      if (firstStep !== undefined) {
        return {
          text: `First-Step Explosion: ${firstStep}%`,
          icon: "pi pi-bolt",
          type:
            firstStep < TRAINING.SPRINT_CAPACITY_WARNING ? "warning" : "info",
        };
      }
    }

    return null;
  });

  get playerStats() {
    return getPlayerStats(this.player());
  }

  // Helper methods for styling
  getReadinessClass(readiness: number): string {
    if (readiness >= 75) return "readiness-high";
    if (readiness >= 55) return "readiness-medium";
    return "readiness-low";
  }

  getACWRClass(acwr: number): string {
    if (acwr >= 0.8 && acwr <= 1.3) return "acwr-safe";
    if (acwr > 1.3 && acwr <= 1.5) return "acwr-elevated";
    if (acwr > 1.5) return "acwr-danger";
    if (acwr < 0.8) return "acwr-low";
    return "acwr-safe";
  }

  getACWRMarkerPosition(acwr: number): string {
    // Map ACWR 0-2 to 0-100%
    const percentage = Math.min(Math.max(acwr / 2, 0), 1) * 100;
    return `${percentage}%`;
  }

  getPerformanceClass(score: number): string {
    if (score >= 80) return "perf-excellent";
    if (score >= 60) return "perf-good";
    if (score >= 40) return "perf-average";
    return "perf-poor";
  }

  getRiskTooltip(): string {
    const assessment = this.metricsService.getRiskAssessment(this.player());
    return assessment.factors.join("\n");
  }

  // Semantic Meaning: Risk
  riskMeaning = computed<RiskMeaning | null>(() => {
    const player = this.enrichedPlayer();
    if (player.riskLevel === "low") {
      return null; // Don't show risk badge for low risk
    }

    const assessment = this.metricsService.getRiskAssessment(this.player());

    const severity = getRiskSeverityFromLevel(player.riskLevel, "moderate");

    // Determine source based on risk factors
    let source = "player-metrics";
    if (player.acwr !== null && player.acwr > 1.5) {
      source = "acwr";
    } else if (player.readiness !== null && player.readiness < 50) {
      source = "readiness";
    } else if (
      this.player().status === "injured" ||
      this.player().status === "returning"
    ) {
      source = "injury-status";
    }

    return {
      type: "risk",
      severity,
      source,
      affectedEntity: `player-${this.player().id}`,
      message: assessment.factors.join("; ") || `${severity} risk detected`,
      recommendation: assessment.recommendations.join("; ") || undefined,
    };
  });

  cardTone = computed<"default" | "warning" | "danger">(() => {
    if (this.enrichedPlayer().riskLevel === "critical") {
      return "danger";
    }
    if (this.enrichedPlayer().riskLevel === "high") {
      return "warning";
    }
    return "default";
  });

  playerStatusSeverity = computed<StatusTagSeverity>(() => {
    switch (this.player().status) {
      case "active":
        return "success";
      case "limited":
        return "warning";
      case "returning":
        return "info";
      case "injured":
        return "danger";
      case "inactive":
      default:
        return "secondary";
    }
  });

  getRiskPriority(): "low" | "medium" | "high" | "critical" {
    const level = this.enrichedPlayer().riskLevel;
    if (level === "critical") return "critical";
    if (level === "high") return "high";
    if (level === "moderate") return "medium";
    return "low";
  }

  onSelectionToggle(_checked: boolean | undefined): void {
    this.selectionChange.emit(this.player().id);
  }

  onSelectionToggleChange(event: CheckboxChangeEvent): void {
    this.onSelectionToggle(event.checked);
  }
}
