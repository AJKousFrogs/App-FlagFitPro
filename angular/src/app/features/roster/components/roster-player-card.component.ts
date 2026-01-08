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
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { ProgressBar } from "primeng/progressbar";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { SemanticMeaningRendererComponent } from "../../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import { RiskMeaning } from "../../../core/semantics/semantic-meaning.types";
import { Player } from "../roster.models";
import {
  PlayerMetricsService,
  PlayerWithMetrics,
} from "../services/player-metrics.service";
import {
  getJerseyColor,
  getPlayerStats,
  formatHeight,
  formatWeight,
  getCountryFlag,
} from "../roster-utils";

@Component({
  selector: "app-roster-player-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    TagModule,
    CheckboxModule,
    TooltipModule,
    ProgressBar,
    FormsModule,
    TitleCasePipe,
    DecimalPipe,
    IconButtonComponent,
    SemanticMeaningRendererComponent,
  ],
  template: `
    <p-card
      class="player-card"
      [class.selected]="isSelected()"
      [class.risk-high]="enrichedPlayer().riskLevel === 'high'"
      [class.risk-critical]="enrichedPlayer().riskLevel === 'critical'"
    >
      <!-- Selection Checkbox (Coach+ only) -->
      @if (canManage()) {
        <div class="card-checkbox">
          <p-checkbox
            [binary]="true"
            [ngModel]="isSelected()"
            (ngModelChange)="selectionChange.emit(player().id)"
          ></p-checkbox>
        </div>
      }

      <!-- Status & Risk Badge -->
      <div class="badge-row">
        <div class="status-badge" [class]="'status-' + player().status">
          {{ player().status | titlecase }}
        </div>
        @if (riskMeaning() && enrichedPlayer().riskLevel !== "low") {
          <app-semantic-meaning-renderer
            [meaning]="riskMeaning()!"
            [context]="{ container: 'card', priority: getRiskPriority(), dismissible: false }"
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
            <span class="country-flag" [attr.title]="player().country">{{ getCountryFlag(player().country) }}</span>
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
              [class]="getReadinessClass(enrichedPlayer().readiness)"
            >
              {{ enrichedPlayer().readiness }}%
            </span>
          </div>
          <p-progressBar
            [value]="enrichedPlayer().readiness"
            [showValue]="false"
            [style]="{ height: '6px' }"
            [styleClass]="
              'readiness-bar ' + getReadinessClass(enrichedPlayer().readiness)
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
              [class]="getACWRClass(enrichedPlayer().acwr)"
            >
              {{ enrichedPlayer().acwr | number: "1.2-2" }}
            </span>
          </div>
          <div class="acwr-indicator">
            <div class="acwr-zone safe"></div>
            <div
              class="acwr-marker"
              [style.left]="getACWRMarkerPosition(enrichedPlayer().acwr)"
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
          ariaLabel="eye"
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
              ariaLabel="sliders-h"
            />
          }

          <app-icon-button
            icon="pi-pencil"
            variant="text"
            (clicked)="edit.emit(player())"
            ariaLabel="pencil"
          />

          <app-icon-button
            icon="pi-tag"
            variant="text"
            (clicked)="changeStatus.emit(player())"
            ariaLabel="tag"
          />
        }

        @if (canDelete()) {
          <app-icon-button
            icon="pi-trash"
            variant="text"
            (clicked)="remove.emit(player())"
            ariaLabel="trash"
          />
        }
      </div>
    </p-card>
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
          type: sprintCapacity < 70 ? "warning" : "info",
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
          type: firstStep < 70 ? "warning" : "info",
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
    
    // Map PlayerRiskLevel to RiskMeaning severity
    const severityMap: Record<string, RiskMeaning["severity"]> = {
      low: "low",
      moderate: "moderate",
      high: "high",
      critical: "critical",
    };

    const severity = severityMap[player.riskLevel] || "moderate";

    // Determine source based on risk factors
    let source = "player-metrics";
    if (player.acwr > 1.5) {
      source = "acwr";
    } else if (player.readiness < 50) {
      source = "readiness";
    } else if (this.player().status === "injured" || this.player().status === "returning") {
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

  getRiskPriority(): "low" | "medium" | "high" | "critical" {
    const level = this.enrichedPlayer().riskLevel;
    if (level === "critical") return "critical";
    if (level === "high") return "high";
    if (level === "moderate") return "medium";
    return "low";
  }
}
