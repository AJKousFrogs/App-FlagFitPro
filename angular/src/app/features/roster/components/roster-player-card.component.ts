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

import { Checkbox } from "primeng/checkbox";
import { Tooltip } from "primeng/tooltip";
import { ProgressBar } from "primeng/progressbar";
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
    Checkbox,
    Tooltip,
    ProgressBar,
    TitleCasePipe,
    DecimalPipe,
    CardShellComponent,
    SemanticMeaningRendererComponent,
    IconButtonComponent,
    StatusTagComponent,
  ],
  template: `
    <app-card-shell
      class="player-card"
      [class.selected]="isSelected()"
      [class.risk-high]="enrichedPlayer().riskLevel === 'high'"
      [class.risk-critical]="enrichedPlayer().riskLevel === 'critical'"
      [tone]="cardTone()"
      [flush]="true"
    >
      <!-- Selection Checkbox (Coach+ only) -->
      @if (canManage()) {
        <div class="card-checkbox">
          <p-checkbox
            [binary]="true"
            variant="filled"
            [value]="isSelected()"
            (onChange)="onSelectionToggle($event.checked)"
          ></p-checkbox>
        </div>
      }

      <!-- Status & Risk Badge -->
      <div class="badge-row">
        <app-status-tag
          [value]="player().status | titlecase"
          [severity]="playerStatusSeverity()"
          size="sm"
        />
        @if (riskMeaning() && enrichedPlayer().riskLevel !== "low") {
          <app-semantic-meaning-renderer
            [meaning]="riskMeaning()!"
            [context]="{
              container: 'card',
              priority: getRiskPriority(),
              dismissible: false,
            }"
          ></app-semantic-meaning-renderer>
        }
      </div>

      <div class="player-header">
        <div
          class="player-jersey"
          [style.background]="getJerseyColor(player().position)"
        >
          {{ player().jersey }}
        </div>
        <div class="player-info">
          <h3 class="player-name">{{ player().name }}</h3>
          <div class="player-position">{{ player().position }}</div>
          <div class="player-meta">
            <span class="country-flag" [attr.title]="player().country">{{
              getCountryFlag(player().country)
            }}</span>
            <span>{{ player().country }}</span>
            <span class="separator">•</span>
            <span>Age {{ player().age }}</span>
          </div>
        </div>
      </div>

      <!-- Live Metrics Section -->
      <div class="metrics-section">
        <!-- Readiness -->
        <div
          class="metric-item"
          pTooltip="Today's readiness from wellness check-in"
        >
          <div class="metric-header">
            <span class="metric-label">Readiness</span>
            <span
              class="metric-value"
              [class]="getReadinessClass(enrichedPlayer().readiness ?? 0)"
            >
              @if (enrichedPlayer().readiness !== null) {
                {{ enrichedPlayer().readiness }}%
              } @else {
                --
              }
            </span>
          </div>
          <p-progressBar
            [value]="enrichedPlayer().readiness ?? 0"
            [showValue]="false"
            [class]="
              'readiness-bar ' +
              getReadinessClass(enrichedPlayer().readiness ?? 0)
            "
          ></p-progressBar>
        </div>

        <!-- ACWR -->
        <div
          class="metric-item"
          pTooltip="Acute:Chronic Workload Ratio - Safe range: 0.8-1.3"
        >
          <div class="metric-header">
            <span class="metric-label">ACWR</span>
            <span
              class="metric-value"
              [class]="getACWRClass(enrichedPlayer().acwr ?? 1.0)"
            >
              @if (enrichedPlayer().acwr !== null) {
                {{ enrichedPlayer().acwr | number: "1.2-2" }}
              } @else {
                --
              }
            </span>
          </div>
          <div class="acwr-indicator">
            <div class="acwr-zone safe"></div>
            <div
              class="acwr-marker"
              [style.left]="getACWRMarkerPosition(enrichedPlayer().acwr ?? 1.0)"
            ></div>
          </div>
        </div>

        <!-- Performance Score -->
        <div class="metric-item" pTooltip="Performance vs position benchmarks">
          <div class="metric-header">
            <span class="metric-label">Performance</span>
            <span
              class="metric-value"
              [class]="getPerformanceClass(enrichedPlayer().performanceScore)"
            >
              {{ enrichedPlayer().performanceScore }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Position-Specific Insight -->
      @if (positionInsight()) {
        <div class="position-insight" [class]="positionInsight()!.type">
          <i [class]="positionInsight()!.icon"></i>
          <span>{{ positionInsight()!.text }}</span>
        </div>
      }

      <div class="player-details">
        <div class="detail-item">
          <span class="detail-label">Height:</span>
          <span class="detail-value">{{ formatHeight(player().height) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Weight:</span>
          <span class="detail-value">{{ formatWeight(player().weight) }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions">
        <app-icon-button
          icon="pi-eye"
          variant="text"
          (clicked)="viewDetails.emit(player())"
          ariaLabel="View player details"
          tooltip="View details"
        />

        @if (canManage()) {
          @if (
            enrichedPlayer().riskLevel === "high" ||
            enrichedPlayer().riskLevel === "critical"
          ) {
            <app-icon-button
              icon="pi-sliders-h"
              variant="text"
              (clicked)="adjustLoad.emit(player())"
              ariaLabel="Adjust player training load"
              tooltip="Adjust load"
            />
          }

          <app-icon-button
            icon="pi-pencil"
            variant="text"
            (clicked)="edit.emit(player())"
            ariaLabel="Edit player"
            tooltip="Edit"
          />

          <app-icon-button
            icon="pi-tag"
            variant="text"
            (clicked)="changeStatus.emit(player())"
            ariaLabel="Change player status"
            tooltip="Change status"
          />
        }

        @if (canDelete()) {
          <app-icon-button
            icon="pi-trash"
            variant="text"
            (clicked)="remove.emit(player())"
            ariaLabel="Remove player from roster"
            tooltip="Remove"
          />
        }
      </div>
    </app-card-shell>
  `,
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
}
