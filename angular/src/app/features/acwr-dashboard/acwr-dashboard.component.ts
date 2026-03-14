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
 * - Remove PrimeNG overrides from component SCSS (migrate to design tokens where needed)
 * - Replace any remaining raw spacing values with tokens
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
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AcwrAlertsService } from "../../core/services/acwr-alerts.service";
import { AuthService } from "../../core/services/auth.service";
import { LoadMonitoringService } from "../../core/services/load-monitoring.service";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
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
import {
  getRiskSeverityFromAlert,
  getRiskSeverityFromZone,
} from "../../shared/utils/risk.utils";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AlertComponent, AlertVariant } from "../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AcwrDashboardDataService } from "./services/acwr-dashboard-data.service";
import { DataSourceBannerComponent } from "../../shared/components/data-source-banner/data-source-banner.component";
import { DataState } from "../../core/services/data-source.service";
import { LazyPdfService } from "../../core/services/lazy-pdf.service";

@Component({
  selector: "app-acwr-dashboard",
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
    MainLayoutComponent,
    DataSourceBannerComponent,
    AlertComponent,
    ButtonComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./acwr-dashboard.component.html",
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
  private readonly lazyPdf = inject(LazyPdfService);

  // Angular 21: viewChild signal for PDF export dashboard reference
  private readonly dashboardElement =
    viewChild<ElementRef>("dashboardContainer");

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

  readonly acwrMinimumRequired = 21;
  readonly acwrDataPoints = computed(
    () => this.dataQuality()?.daysWithData || 0,
  );
  readonly acwrDataState = computed(() => {
    const points = this.acwrDataPoints();
    if (points === 0) return DataState.NO_DATA;
    if (this.hasInsufficientData()) return DataState.INSUFFICIENT_DATA;
    return DataState.REAL_DATA;
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

    const severity = getRiskSeverityFromAlert(alert.severity, "moderate");
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

    const severity = getRiskSeverityFromZone(zone.level, "moderate");

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
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private acwrDashboardDataService = inject(AcwrDashboardDataService);

  public dismissTopAlert(): void {
    const alert = this.topAlert();
    if (alert) {
      this.alertsService.acknowledgeAlert(alert.id, "current-user");
    }
  }

  public getTopAlertVariant(
    severity: "critical" | "warning" | "info",
  ): AlertVariant {
    switch (severity) {
      case "critical":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  }

  public getTopAlertIcon(severity: "critical" | "warning" | "info"): string {
    switch (severity) {
      case "critical":
        return "pi-exclamation-triangle";
      case "warning":
        return "pi-exclamation-circle";
      default:
        return "pi-info-circle";
    }
  }

  public logSession(): void {
    // Route players to the single daily flow
    this.router.navigate(["/todays-practice"]);
  }

  public viewHistory(): void {
    // Navigate to training schedule to view history
    this.router.navigate(["/training"]);
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
      const { error } = await this.acwrDashboardDataService.saveReport({
        userId: user.id,
        reportData,
        acwrValue: acwrData.ratio,
        riskZone: acwrData.riskZone,
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

      const { sessions, error } =
        await this.acwrDashboardDataService.getTrendSessions({
          userId: user.id,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        });

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

      const { sessions } = await this.acwrDashboardDataService.getRecentSessions(
        {
          userId: user.id,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          limit: 10,
        },
      );

      if (sessions.length === 0) {
        this.acwrCauseAttribution.set([]);
        return;
      }

      // Calculate load for each session and identify high-load contributors
      const highLoadSessions = sessions
        .filter((s): s is typeof s & { id: string } => typeof s.id === "string")
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

      const dashboardRef = this.dashboardElement();
      const dashboard = dashboardRef?.nativeElement as HTMLElement;
      if (!dashboard) {
        this.toastService.error(TOAST.ERROR.DASHBOARD_NOT_FOUND);
        return;
      }

      await this.lazyPdf.exportElementToPDF(dashboard, {
        filename: `acwr-report-${new Date().toISOString().split("T")[0]}.pdf`,
        headerText: "ACWR Dashboard Report",
        subtitleText: `Generated: ${formatDate(new Date(), "P")}`,
        imageFormat: "png",
        imageMaxHeight: 250,
        scale: 2,
      });

      this.toastService.success(TOAST.SUCCESS.PDF_REPORT_DOWNLOADED);
    } catch (error) {
      this.logger.error("Error generating PDF:", error);
      this.toastService.error(
        "Failed to generate PDF. Make sure jspdf and html2canvas are installed.",
      );
    }
  }
}
