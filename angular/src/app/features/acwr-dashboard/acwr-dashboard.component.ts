/**
 * ACWR Dashboard Component
 *
 * ⭐ CANONICAL PAGE — Design System Exemplar (Pending Cleanup)
 * ============================================================
 * This page is marked as canonical but requires cleanup before freeze.
 *
 * RULES:
 * - Future refactors copy FROM this page, never INTO it
 * - Changes require design system curator approval
 * - Must be cleaned to full compliance before canonical freeze
 *
 * See docs/CANONICAL_PAGES.md for full documentation.
 *
 * CLEANUP REQUIRED:
 * - Remove `!important` declarations (33 instances)
 * - Remove PrimeNG overrides from component SCSS
 * - Replace raw spacing values with tokens
 *
 * Displays real-time Acute:Chronic Workload Ratio with:
 * - Color-coded risk zones
 * - Load trend charts
 * - Training recommendations
 * - Alert notifications
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AcwrAlertsService } from "../../core/services/acwr-alerts.service";
import { AuthService } from "../../core/services/auth.service";
import { LoadMonitoringService } from "../../core/services/load-monitoring.service";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { METRIC_INSUFFICIENT_DATA } from "../../shared/utils/privacy-ux-copy";
import { UI_LIMITS } from "../../core/constants";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { DataConfidenceService } from "../../core/services/data-confidence.service";
import { ConfidenceIndicatorComponent } from "../../shared/components/confidence-indicator/confidence-indicator.component";
import {
  OwnershipTransitionService,
  OwnershipTransition,
} from "../../core/services/ownership-transition.service";
import { OwnershipTransitionBadgeComponent } from "../../shared/components/ownership-transition-badge/ownership-transition-badge.component";
import { SemanticMeaningRendererComponent } from "../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import { RiskMeaning } from "../../core/semantics/semantic-meaning.types";
import { formatDate } from "../../shared/utils/date.utils";

@Component({
  selector: "app-acwr-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,

    LazyChartComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    ConfidenceIndicatorComponent,
    OwnershipTransitionBadgeComponent,
    SemanticMeaningRendererComponent,
  ],
  template: `
    <!-- Loading State -->
    <app-loading
      [visible]="isPageLoading()"
      variant="skeleton"
      message="Loading ACWR data..."
    ></app-loading>

    <!-- Error State -->
    @if (hasPageError()) {
      <app-page-error-state
        title="Unable to load ACWR dashboard"
        [message]="pageErrorMessage()"
        (retry)="retryLoad()"
      ></app-page-error-state>
    }

    <!-- Content -->
    @else {
      <div class="acwr-dashboard">
        <!-- Header -->
        <div class="dashboard-header">
          <h1>
            <i class="icon-activity"></i>
            Load Monitoring & Injury Prevention
          </h1>
          <p class="subtitle">Acute:Chronic Workload Ratio (ACWR) Analysis</p>
        </div>

        <!-- Alert Banner - Phase 3: Semantic Meaning Renderer -->
        @if (alertRiskMeaning()) {
          <app-semantic-meaning-renderer
            [meaning]="alertRiskMeaning()!"
            [context]="{
              container: 'banner',
              priority:
                alertRiskMeaning()!.severity === 'critical'
                  ? 'critical'
                  : 'high',
              dismissible: true,
            }"
          ></app-semantic-meaning-renderer>
        }

        <!-- Alert Banner - Phase 2.1 Enhanced with 5-Question Contract (Fallback for non-risk alerts) -->
        @if (alerts().length > 0 && topAlert() && !alertRiskMeaning()) {
          <div class="alert-banner" [class]="'alert-' + topAlert()!.severity">
            <div class="alert-icon">
              @if (topAlert()!.severity === "critical") {
                🚨
              } @else if (topAlert()!.severity === "warning") {
                ⚠️
              } @else {
                ℹ️
              }
            </div>
            <div class="alert-content">
              <h3>{{ topAlert()!.message }}</h3>
              <p>{{ topAlert()!.recommendation }}</p>

              <!-- Phase 2.1: 5-Question Contract Display -->
              <div class="alert-contract">
                <!-- 1. What changed - Show trend -->
                @if (acwrTrend().length > 1) {
                  <div class="contract-section">
                    <strong>What changed:</strong>
                    <span class="trend-display">
                      ACWR rose from {{ acwrTrend()[0] | number: "1.2-2" }}
                      @for (value of acwrTrend().slice(1); track $index) {
                        → {{ value | number: "1.2-2" }}
                      }
                      over {{ acwrTrend().length - 1 }} day(s)
                    </span>
                  </div>
                }

                <!-- 2. Why it changed - Cause attribution -->
                @if (acwrCauseAttribution().length > 0) {
                  <div class="contract-section">
                    <strong>Why it changed:</strong>
                    <ul class="cause-list">
                      @for (
                        cause of acwrCauseAttribution();
                        track cause.sessionId
                      ) {
                        <li>
                          {{ cause.sessionType }} session on
                          {{ cause.date | date: "MMM d" }} (Load:
                          {{ cause.load | number: "1.0-0" }} AU)
                        </li>
                      }
                    </ul>
                  </div>
                } @else {
                  <div class="contract-section">
                    <strong>Why it changed:</strong>
                    <span
                      >Recent high-intensity training sessions increased your
                      acute load.</span
                    >
                  </div>
                }

                <!-- 3. What this means -->
                <div class="contract-section">
                  <strong>What this means:</strong>
                  <span>{{ riskZone().description }}</span>
                </div>

                <!-- 4. Who is responsible now - Ownership transition -->
                @if (ownershipTransition()) {
                  <div class="contract-section">
                    <strong>Who is responsible now:</strong>
                    <app-ownership-transition-badge
                      [transition]="ownershipTransition()!"
                      [showDetails]="true"
                    ></app-ownership-transition-badge>
                  </div>
                }

                <!-- 5. What happens next -->
                <div class="contract-section">
                  <strong>What happens next:</strong>
                  @if (ownershipTransition()?.toRole === "coach") {
                    <span
                      >Coach is reviewing — no action needed now. You'll be
                      notified when your plan is adjusted.</span
                    >
                  } @else {
                    <span>{{ riskZone().recommendation }}</span>
                    <div class="action-buttons">
                      <button class="action-btn" (click)="logSession()">
                        Modify Today's Session
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
            <button class="alert-dismiss" (click)="dismissTopAlert()">✕</button>
          </div>
        }

        <!-- Main ACWR Display -->
        <div class="acwr-main-card">
          @if (hasInsufficientData()) {
            <!-- Empty State for New Athletes - Using Centralized UX Copy -->
            <div class="acwr-empty-state">
              <div class="empty-icon">
                <i [class]="'pi ' + insufficientDataMessage.icon"></i>
              </div>
              <h3>{{ insufficientDataMessage.title }}</h3>
              <p>{{ insufficientDataMessage.reason }}</p>

              <div class="data-progress">
                <div class="progress-item">
                  <span class="progress-label">Days with data</span>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="
                        ((dataQuality().daysWithData || 0) / 21) * 100
                      "
                    ></div>
                  </div>
                  <span class="progress-value"
                    >{{ dataQuality().daysWithData || 0 }} / 21</span
                  >
                </div>
                <div class="progress-item">
                  <span class="progress-label">Sessions logged</span>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="
                        ((dataQuality().sessionsInChronicWindow || 0) / 10) *
                        100
                      "
                    ></div>
                  </div>
                  <span class="progress-value"
                    >{{ dataQuality().sessionsInChronicWindow || 0 }} / 10</span
                  >
                </div>
              </div>

              <p class="empty-tip">
                💡 <strong>Olympic Tip:</strong> Consistent training logging
                helps prevent overtraining injuries during your LA28
                preparation.
              </p>

              <a
                [routerLink]="insufficientDataMessage.helpLink"
                class="action-btn primary"
              >
                <i class="icon-plus"></i>
                {{ insufficientDataMessage.actionLabel }}
              </a>
            </div>
          } @else {
            <!-- Full ACWR Display -->
            <div class="acwr-ratio-display">
              <div class="ratio-circle" [style.border-color]="riskZone().color">
                <div class="ratio-value">
                  {{ acwrRatio() | number: "1.2-2" }}
                  @if (acwrConfidenceRange()) {
                    <span class="confidence-range">
                      (est.
                      {{ acwrConfidenceRange()!.min | number: "1.2-2" }}-{{
                        acwrConfidenceRange()!.max | number: "1.2-2"
                      }})
                    </span>
                  }
                </div>
                <div class="ratio-label">
                  ACWR
                  @if (acwrConfidenceRange()) {
                    <span class="confidence-percentage">
                      Confidence:
                      {{
                        acwrConfidenceRange()!.confidence * 100
                          | number: "1.0-0"
                      }}%
                    </span>
                  }
                </div>
                <!-- Phase 2.2: Prominent Data Confidence Indicator -->
                <div class="confidence-wrapper">
                  <app-confidence-indicator
                    [score]="acwrConfidence().score"
                    [missingInputs]="acwrConfidence().missingInputs"
                    [showDetails]="true"
                    [showActions]="true"
                  ></app-confidence-indicator>
                </div>
              </div>

              <!-- Risk Zone Indicator - Phase 3: Semantic Meaning Renderer -->
              @if (riskZoneMeaning()) {
                <app-semantic-meaning-renderer
                  [meaning]="riskZoneMeaning()!"
                  [context]="{
                    container: 'inline',
                    priority:
                      riskZoneMeaning()!.severity === 'critical'
                        ? 'critical'
                        : 'high',
                    dismissible: false,
                  }"
                ></app-semantic-meaning-renderer>
              } @else {
                <!-- Non-risk zone display (sweet spot, under-training) -->
                <div
                  class="risk-zone-indicator"
                  [style.background-color]="riskZone().color"
                >
                  <div class="risk-icon">
                    @if (riskZone().level === "sweet-spot") {
                      ✓
                    } @else {
                      ●
                    }
                  </div>
                  <div class="risk-label">{{ riskZone().label }}</div>
                  <div class="risk-description">
                    {{ riskZone().description }}
                  </div>
                </div>
              }
            </div>

            <!-- Load Breakdown -->
            <div class="load-breakdown">
              <div class="load-metric">
                <div class="metric-label">Acute Load (7-day)</div>
                <div class="metric-value">
                  {{ acuteLoad() | number: "1.0-0" }} AU
                </div>
                <div class="metric-description">Current fatigue level</div>
              </div>

              <div class="load-divider">÷</div>

              <div class="load-metric">
                <div class="metric-label">Chronic Load (28-day)</div>
                <div class="metric-value">
                  {{ chronicLoad() | number: "1.0-0" }} AU
                </div>
                <div class="metric-description">Training fitness base</div>
              </div>
            </div>
          }
        </div>

        <!-- Risk Zones Guide -->
        <div class="risk-zones-guide">
          <h3>Understanding Risk Zones</h3>
          <div class="zones-grid">
            <div class="zone-card zone-under">
              <div class="zone-header">
                <span class="zone-dot zone-dot--under"></span>
                <span class="zone-range">&lt; 0.80</span>
              </div>
              <div class="zone-label">Under-Training</div>
              <p>
                Player lacks conditioning. Gradually increase load by 5-10%.
              </p>
            </div>

            <div class="zone-card zone-sweet">
              <div class="zone-header">
                <span class="zone-dot zone-dot--sweet"></span>
                <span class="zone-range">0.80 - 1.30</span>
              </div>
              <div class="zone-label">Sweet Spot</div>
              <p>
                Optimal workload. Lowest injury risk. Maintain current load.
              </p>
            </div>

            <div class="zone-card zone-elevated">
              <div class="zone-header">
                <span class="zone-dot zone-dot--elevated"></span>
                <span class="zone-range">1.30 - 1.50</span>
              </div>
              <div class="zone-label">Elevated Risk</div>
              <p>
                Caution needed. Reduce high-intensity work, monitor closely.
              </p>
            </div>

            <div class="zone-card zone-danger">
              <div class="zone-header">
                <span class="zone-dot zone-dot--danger"></span>
                <span class="zone-range">&gt; 1.50</span>
              </div>
              <div class="zone-label">Danger Zone</div>
              <p>Highest injury risk. Reduce load 20-30%, skip sprints.</p>
            </div>
          </div>
        </div>

        <!-- Weekly Progression Check -->
        <div class="weekly-progression">
          <h3>Weekly Load Progression</h3>
          <div
            class="progression-card"
            [class.unsafe]="!weeklyProgression().isSafe"
          >
            <div class="progression-stats">
              <div class="stat">
                <div class="stat-label">Current Week</div>
                <div class="stat-value">
                  {{ weeklyProgression().currentWeek | number: "1.0-0" }} AU
                </div>
              </div>
              <div class="stat">
                <div class="stat-label">Previous Week</div>
                <div class="stat-value">
                  {{ weeklyProgression().previousWeek | number: "1.0-0" }} AU
                </div>
              </div>
              <div class="stat">
                <div class="stat-label">Change</div>
                <div
                  class="stat-value"
                  [class.positive]="weeklyProgression().changePercent > 0"
                >
                  {{ weeklyProgression().changePercent > 0 ? "+" : ""
                  }}{{ weeklyProgression().changePercent | number: "1.1-1" }}%
                </div>
              </div>
            </div>

            @if (weeklyProgression().warning) {
              <div class="progression-warning">
                <i class="icon-alert"></i>
                {{ weeklyProgression().warning }}
              </div>
            } @else {
              <div class="progression-safe">
                <i class="icon-check"></i>
                Weekly progression is within safe limits (&lt;10%)
              </div>
            }
          </div>
        </div>

        <!-- ACWR Trend Chart -->
        @if (trendChartData()) {
          <div class="trend-chart-section">
            <h3>ACWR Trend (Last 28 Days)</h3>
            <div class="chart-container">
              <app-lazy-chart
                type="line"
                [data]="trendChartData()"
                [options]="trendChartOptions"
              ></app-lazy-chart>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-dot sweet-spot"></span>
                <span>Sweet Spot (0.8-1.3)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot danger"></span>
                <span>Danger Zone (&gt;1.5)</span>
              </div>
            </div>
          </div>
        }

        <!-- Training Recommendations -->
        <div class="recommendations-section">
          <h3>Training Recommendations</h3>
          <div class="recommendation-card" [class]="'rec-' + riskZone().level">
            <div class="rec-icon">💡</div>
            <div class="rec-content">
              <h4>{{ riskZone().label }} Guidance</h4>
              <p>{{ riskZone().recommendation }}</p>

              @if (trainingMods().shouldModify) {
                <div class="modifications">
                  <strong>Recommended Modifications:</strong>
                  <ul>
                    @for (mod of trainingMods().modifications; track mod) {
                      <li>{{ mod }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn primary" (click)="logSession()">
            <i class="icon-plus"></i>
            Log Training Session
          </button>
          <button class="action-btn" (click)="viewHistory()">
            <i class="icon-chart"></i>
            View Load History
          </button>
          <button class="action-btn" (click)="downloadReport()">
            <i class="icon-download"></i>
            Export JSON
          </button>
          <button class="action-btn" (click)="exportPDF()">
            <i class="icon-file-pdf"></i>
            Export PDF
          </button>
        </div>

        <!-- Last Updated -->
        <div class="dashboard-footer">
          <small> Last updated: {{ lastUpdated() | date: "short" }} </small>
        </div>
      </div>
    }
    <!-- End of @else for content -->
  `,
  styleUrl: "./acwr-dashboard.component.scss",
})
export class AcwrDashboardComponent implements OnInit {
  // Inject services using Angular's inject() function
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly loadService = inject(LoadMonitoringService);
  private readonly alertsService = inject(AcwrAlertsService);
  private readonly confidenceService = inject(DataConfidenceService);
  private readonly ownershipTransitionService = inject(
    OwnershipTransitionService,
  );
  private logger = inject(LoggerService);

  // Runtime guard signals - prevent white screen crashes
  isPageLoading = signal<boolean>(false);
  hasPageError = signal<boolean>(false);
  pageErrorMessage = signal<string>(
    "Something went wrong while loading ACWR data. Please try again.",
  );

  // Reactive signals from services
  public readonly acwrRatio = this.trainingService.acwrRatio;
  public readonly riskZone = this.trainingService.acwrRiskZone;
  public readonly acuteLoad = this.trainingService.acuteLoad;
  public readonly chronicLoad = this.trainingService.chronicLoad;
  public readonly weeklyProgression = this.trainingService.weeklyProgression;

  public readonly alerts = computed(() => this.alertsService.getActiveAlerts());
  public readonly topAlert = computed(() => {
    const alerts = this.alerts();
    return alerts.length > 0 ? alerts[0] : undefined;
  });

  public readonly trainingMods = computed(() =>
    this.trainingService.getTrainingModification(),
  );

  public readonly lastUpdated = computed(
    () => this.trainingService.acwrData().lastUpdated,
  );

  // Data quality signal from service
  public readonly dataQuality = computed(
    () => this.trainingService.acwrData().dataQuality,
  );
  public readonly hasInsufficientData = computed(() => {
    const quality = this.dataQuality();
    return quality?.level === "insufficient" || quality?.level === "low";
  });

  // ACWR confidence calculation
  public readonly acwrConfidence = computed(() => {
    const quality = this.dataQuality();
    const trainingDays = quality?.daysWithData || 0;
    return this.confidenceService.calculateACWRConfidence(trainingDays, 21);
  });

  // ACWR confidence range calculation
  public readonly acwrConfidenceRange = computed(() => {
    const ratio = this.acwrRatio();
    const confidence = this.acwrConfidence();

    if (!ratio || ratio === null || confidence.score >= 0.9) {
      // High confidence - no range needed
      return null;
    }

    // Calculate range based on confidence score
    // Lower confidence = wider range
    // Formula: range = ±(1 - confidence) * 0.15 * ratio
    // This gives approximately ±15% at 0% confidence, ±7.5% at 50% confidence, ±1.5% at 90% confidence
    const uncertaintyFactor = (1 - confidence.score) * 0.15;
    const range = ratio * uncertaintyFactor;

    const minEstimate = Math.max(0, ratio - range);
    const maxEstimate = ratio + range;

    return {
      min: minEstimate,
      max: maxEstimate,
      confidence: confidence.score,
    };
  });

  // Centralized UX copy for insufficient data state
  public readonly insufficientDataMessage = METRIC_INSUFFICIENT_DATA.acwr;

  // Trend chart data
  trendChartData = signal<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
      pointRadius?: number;
      pointHoverRadius?: number;
      borderDash?: number[];
    }[];
  } | null>(null);

  // Phase 2.1 - ACWR Trend for 5-Question Contract
  acwrTrend = computed(() => {
    const chartData = this.trendChartData();
    if (!chartData || chartData.datasets.length === 0) {
      const current = this.acwrRatio();
      return current ? [current] : [];
    }
    // Get last 5 data points to show trend
    const data = chartData.datasets[0].data;
    return data.slice(-5).filter((v) => v > 0);
  });

  // Phase 2.1 - Cause Attribution (loaded from sessions)
  acwrCauseAttribution = signal<
    Array<{
      sessionId: string;
      date: Date;
      sessionType: string;
      load: number;
    }>
  >([]);

  // Phase 2.1 - Ownership Transition
  ownershipTransition = signal<OwnershipTransition | null>(null);

  // Phase 3 - Semantic Meaning: Risk from Alert Banner
  public readonly alertRiskMeaning = computed<RiskMeaning | null>(() => {
    const alert = this.topAlert();
    if (!alert || alert.severity === "info") {
      return null;
    }

    // Map alert severity to risk severity
    const severityMap: Record<string, RiskMeaning["severity"]> = {
      warning: "moderate",
      critical: "critical",
    };

    const severity = severityMap[alert.severity] || "moderate";
    const zone = this.riskZone();

    return {
      type: "risk",
      severity,
      source: "acwr",
      affectedEntity: "acwr-dashboard",
      message: alert.message,
      recommendation: alert.recommendation || zone.recommendation,
    };
  });

  // Phase 3 - Semantic Meaning: Risk from Risk Zone Indicator
  public readonly riskZoneMeaning = computed<RiskMeaning | null>(() => {
    const zone = this.riskZone();

    // Only show risk meaning for elevated-risk and danger-zone
    // Sweet spot and under-training are not risks (they're status indicators)
    if (
      zone.level === "sweet-spot" ||
      zone.level === "under-training" ||
      zone.level === "no-data"
    ) {
      return null;
    }

    // Map zone level to risk severity
    const severityMap: Record<string, RiskMeaning["severity"]> = {
      "elevated-risk": "high",
      "danger-zone": "critical",
    };

    const severity = severityMap[zone.level] || "moderate";

    return {
      type: "risk",
      severity,
      source: "acwr",
      affectedEntity: "acwr-ratio",
      message: zone.description,
      recommendation: zone.recommendation,
    };
  });

  // Chart options for trend visualization
  trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 2,
        ticks: {
          stepSize: 0.25,
        },
        title: {
          display: true,
          text: "ACWR",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
    },
    elements: {
      line: {
        tension: 0.3,
      },
    },
  };

  ngOnInit(): void {
    this.initializeDashboard();
    this.loadTrendData();
    this.loadOwnershipTransition();
    this.loadCauseAttribution();
  }

  /**
   * Initialize dashboard with error handling
   */
  private initializeDashboard(): void {
    try {
      // Request notification permission for alerts
      this.alertsService.requestNotificationPermission();

      // Real training data is loaded automatically by AcwrService
      // when user authenticates (via effect in constructor)
      this.logger.info(
        "[ACWR Dashboard] Initialized - waiting for real training data",
      );
    } catch (error) {
      this.logger.error("[ACWR Dashboard] Init error:", error);
      this.hasPageError.set(true);
      this.pageErrorMessage.set(
        "Failed to initialize ACWR dashboard. Please try again.",
      );
    }
  }

  /**
   * Retry loading the dashboard
   */
  retryLoad(): void {
    this.hasPageError.set(false);
    this.initializeDashboard();
  }

  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  public dismissTopAlert(): void {
    const alert = this.topAlert();
    if (alert) {
      this.alertsService.acknowledgeAlert(alert.id, "current-user");
    }
  }

  public logSession(): void {
    // Navigate to smart training form for logging a new session
    this.router.navigate(["/training/smart-form"]);
  }

  public viewHistory(): void {
    // Navigate to training schedule to view history
    this.router.navigate(["/training/schedule"]);
  }

  public async downloadReport(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.toastService.error(TOAST.ERROR.LOGIN_TO_DOWNLOAD_REPORTS);
        return;
      }

      this.toastService.info(TOAST.INFO.ACWR_REPORT_GENERATING);

      // Get current ACWR data from the training service
      const acwrData = {
        ratio: this.acwrRatio(),
        riskZone: this.riskZone(),
        acute: this.acuteLoad(),
        chronic: this.chronicLoad(),
        weeklyProgression: this.weeklyProgression(),
      };
      const alerts = this.alerts();

      // Build report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        userId: user.id,
        acwr: {
          current: acwrData.ratio,
          riskZone: acwrData.riskZone.label,
          acuteLoad: acwrData.acute,
          chronicLoad: acwrData.chronic,
          weeklyProgression: acwrData.weeklyProgression,
        },
        alerts: alerts.map((a) => ({
          message: a.message,
          severity: a.severity,
          recommendation: a.recommendation,
        })),
        recommendations: this.getRecommendationsForRiskZone(
          acwrData.riskZone.label,
        ),
      };

      // Save report to Supabase
      const { error } = await this.supabaseService.client
        .from("acwr_reports")
        .insert({
          user_id: user.id,
          report_data: reportData,
          acwr_value: acwrData.ratio,
          risk_zone: acwrData.riskZone,
        });

      if (error) {
        // If table doesn't exist, just download locally
        this.logger.debug(
          "ACWR reports table not available, generating local report",
        );
      }

      // Generate and download JSON report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acwr-report-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.toastService.success(TOAST.SUCCESS.ACWR_REPORT_DOWNLOADED);
    } catch (error) {
      this.logger.error("Error generating ACWR report:", error);
      this.toastService.error(TOAST.ERROR.REPORT_FAILED);
    }
  }

  private getRecommendationsForRiskZone(riskZoneLabel: string): string[] {
    switch (riskZoneLabel) {
      case "Danger Zone (High)":
      case "danger-high":
        return [
          "Immediately reduce training load by 30-40%",
          "Focus on recovery activities (sleep, nutrition, hydration)",
          "Consider active recovery sessions only",
          "Monitor for signs of overtraining or injury",
        ];
      case "Warning (High)":
      case "warning-high":
        return [
          "Reduce training intensity by 15-20%",
          "Add an extra rest day this week",
          "Prioritize sleep and nutrition",
          "Monitor fatigue levels closely",
        ];
      case "Optimal Zone":
      case "optimal":
        return [
          "Maintain current training load",
          "Continue balanced progression",
          "Keep monitoring ACWR trends",
        ];
      case "Warning (Low)":
      case "warning-low":
        return [
          "Gradually increase training load by 10-15%",
          "Add one additional session this week",
          "Focus on building chronic fitness base",
        ];
      case "Danger Zone (Low)":
      case "danger-low":
        return [
          "Significant increase in training needed",
          "Build up gradually over 2-3 weeks",
          "Focus on aerobic base development",
          "Consider adding more volume before intensity",
        ];
      default:
        return ["Continue monitoring your training load"];
    }
  }

  /**
   * Load historical ACWR trend data for the chart
   */
  private async loadTrendData(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Get last 28 days of training sessions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const { data: sessions, error } = await this.supabaseService.client
        .from("training_sessions")
        .select("session_date, duration_minutes, rpe, status")
        .eq("user_id", user.id)
        .gte("session_date", startDate.toISOString().split("T")[0])
        .lte("session_date", endDate.toISOString().split("T")[0])
        .eq("status", "completed")
        .order("session_date", { ascending: true });

      if (error) {
        this.logger.warn("Could not load trend data:", toLogContext(error));
        return;
      }

      // Generate daily ACWR values
      const _dailyData: {
        date: string;
        acwr: number;
        acute: number;
        chronic: number;
      }[] = [];
      const labels: string[] = [];
      const acwrValues: number[] = [];

      // Calculate rolling ACWR for each day
      for (let i = 0; i < 28; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Calculate acute (7-day) and chronic (28-day) loads up to this date
        const acuteStart = new Date(currentDate);
        acuteStart.setDate(currentDate.getDate() - 7);

        const chronicStart = new Date(currentDate);
        chronicStart.setDate(currentDate.getDate() - 28);

        const acuteLoad = (sessions || [])
          .filter((s) => {
            const sDate = new Date(s.session_date);
            return sDate >= acuteStart && sDate <= currentDate;
          })
          .reduce(
            (sum, s) => sum + (s.duration_minutes || 0) * (s.rpe || 5),
            0,
          );

        const chronicLoad =
          (sessions || [])
            .filter((s) => {
              const sDate = new Date(s.session_date);
              return sDate >= chronicStart && sDate <= currentDate;
            })
            .reduce(
              (sum, s) => sum + (s.duration_minutes || 0) * (s.rpe || 5),
              0,
            ) / 4; // Average over 4 weeks

        const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

        labels.push(
          currentDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        );
        acwrValues.push(Number(acwr.toFixed(2)));
      }

      // Set chart data
      this.trendChartData.set({
        labels,
        datasets: [
          {
            label: "ACWR",
            data: acwrValues,
            borderColor: "var(--ds-primary-green)",
            backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.1)",
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: "Sweet Spot Upper (1.3)",
            data: new Array(28).fill(1.3),
            borderColor: "var(--color-status-warning)",
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
          {
            label: "Sweet Spot Lower (0.8)",
            data: new Array(28).fill(0.8),
            borderColor: "var(--color-status-warning)",
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
          {
            label: "Danger Zone (1.5)",
            data: new Array(28).fill(1.5),
            borderColor: "var(--color-status-error)",
            borderDash: [2, 2],
            pointRadius: 0,
            fill: false,
          },
        ],
      });
    } catch (error) {
      this.logger.error("Error loading trend data:", error);
    }
  }

  /**
   * Phase 2.1 - Load ownership transition for ACWR alerts
   */
  private async loadOwnershipTransition(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const currentACWR = this.acwrRatio();
      if (!currentACWR || currentACWR <= 1.3) {
        return; // No transition needed for low ACWR
      }

      // Get recent ownership transitions for ACWR alerts
      const transitions =
        await this.ownershipTransitionService.getPlayerTransitions(user.id, 10);

      // Filter for ACWR-related transitions
      const acwrTransitions = transitions.filter(
        (t) => t.trigger === "acwr_critical" || t.trigger === "acwr_elevated",
      );

      if (acwrTransitions.length > 0) {
        // Get the most recent one
        this.ownershipTransition.set(acwrTransitions[0]);
      }
    } catch (error) {
      this.logger.error(
        "[ACWR Dashboard] Error loading ownership transition:",
        error,
      );
    }
  }

  /**
   * Phase 2.1 - Enhanced cause attribution from recent sessions
   */
  private async loadCauseAttribution(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const currentACWR = this.acwrRatio();
      if (!currentACWR || currentACWR <= 1.3) {
        this.acwrCauseAttribution.set([]);
        return;
      }

      // Get recent high-load sessions (last 7 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data: sessions } = await this.supabaseService.client
        .from("training_sessions")
        .select("id, session_date, duration_minutes, rpe, session_type")
        .eq("user_id", user.id)
        .gte("session_date", startDate.toISOString().split("T")[0])
        .lte("session_date", endDate.toISOString().split("T")[0])
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(10);

      if (!sessions || sessions.length === 0) {
        this.acwrCauseAttribution.set([]);
        return;
      }

      // Calculate load for each session and identify high-load contributors
      const highLoadSessions = sessions
        .map((s) => ({
          sessionId: s.id,
          date: new Date(s.session_date),
          sessionType: s.session_type || "Training",
          load: (s.duration_minutes || 60) * (s.rpe || 5),
        }))
        .filter((s) => s.load > 300) // High load threshold
        .sort((a, b) => b.load - a.load)
        .slice(0, UI_LIMITS.RECOMMENDATIONS_PREVIEW); // Top contributors

      this.acwrCauseAttribution.set(highLoadSessions);
    } catch (error) {
      this.logger.error(
        "[ACWR Dashboard] Error loading cause attribution:",
        error,
      );
      this.acwrCauseAttribution.set([]);
    }
  }

  /**
   * Export ACWR dashboard as PDF
   */
  async exportPDF(): Promise<void> {
    try {
      this.toastService.info(TOAST.INFO.PDF_REPORT_GENERATING);

      // Dynamically import jspdf and html2canvas
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const dashboard = document.querySelector(
        ".acwr-dashboard",
      ) as HTMLElement;
      if (!dashboard) {
        this.toastService.error(TOAST.ERROR.DASHBOARD_NOT_FOUND);
        return;
      }

      // Create canvas from dashboard
      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(20);
      pdf.text("ACWR Dashboard Report", 105, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Generated: ${formatDate(new Date(), "P")}`, 105, 22, {
        align: "center",
      });

      // Add dashboard image
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 30, imgWidth, Math.min(imgHeight, 250));

      // Save PDF
      pdf.save(`acwr-report-${new Date().toISOString().split("T")[0]}.pdf`);

      this.toastService.success(TOAST.SUCCESS.PDF_REPORT_DOWNLOADED);
    } catch (error) {
      this.logger.error("Error generating PDF:", error);
      this.toastService.error(
        "Failed to generate PDF. Make sure jspdf and html2canvas are installed.",
      );
    }
  }
}
