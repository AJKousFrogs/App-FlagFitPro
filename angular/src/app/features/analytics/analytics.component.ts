import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChildren,
  inject,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { UIChart } from "primeng/chart"; // Still needed for @ViewChildren type
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TabPanel, Tabs } from "primeng/tabs";
import { Tooltip } from "primeng/tooltip";
import type { Chart } from "chart.js";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  COLORS,
  TIMEOUTS,
  UI_LIMITS,
} from "../../core/constants/app.constants";
import { AcwrService } from "../../core/services/acwr.service";
import { API_ENDPOINTS, ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import {
  PlayerGameStats,
  PlayerMultiSeasonStats,
  PlayerSeasonStats,
  PlayerStatisticsService,
} from "../../core/services/player-statistics.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { TrainingDataService } from "../../core/services/training-data.service";
import { AnalyticsDataService } from "./services/analytics-data.service";
import { FeatureFlagsService } from "../../core/services/feature-flags.service";
import { TeamPerformanceRankingService } from "../../core/services/team-performance-ranking.service";
import {
  TrainingStatsCalculationService,
  type TrainingStatsData,
} from "../../core/services/training-stats-calculation.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardHeaderComponent } from "../../shared/components/card-header/card-header.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  ENHANCED_BAR_CHART_OPTIONS,
  ENHANCED_DOUGHNUT_CHART_OPTIONS,
  ENHANCED_LINE_CHART_OPTIONS,
  ENHANCED_RADAR_CHART_OPTIONS,
  exportChartAsPNG,
  resetChartZoom,
  updateChartFontSizes,
} from "../../shared/config/enhanced-chart.config";
import { DATA_STATE_MESSAGES } from "../../shared/utils/privacy-ux-copy";
import { formatDate } from "../../shared/utils/date.utils";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { DataSourceBannerComponent } from "../../shared/components/data-source-banner/data-source-banner.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { DataState } from "../../core/services/data-source.service";

interface Metric {
  icon: string;
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative" | "neutral";
}

interface DevelopmentGoal {
  id: string;
  metricType: "speed" | "agility" | "strength" | "power" | "skill";
  metricName: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  startValue: number;
  deadline: Date;
  coachNote: string;
  status: "active" | "achieved" | "missed";
}

interface AnalyticsAcwrData {
  acwr: number | null;
  acuteLoad: number;
  chronicLoad: number;
  acuteDays: number;
  chronicDays: number;
  riskZone: string;
  message: string;
}

type AnalyticsChartType =
  | "performance"
  | "chemistry"
  | "distribution"
  | "position"
  | "speed";

@Component({
  selector: "app-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    RouterModule,
    Card,

    LazyChartComponent,
    Dialog,
    
    ProgressBar,
    TableModule,
    StatusTagComponent,
    Tooltip,
    Tabs,
    TabPanel,
    Select,
    MainLayoutComponent,
    PageHeaderComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    ButtonComponent,
    CardHeaderComponent,
    IconButtonComponent,
    AlertComponent,
    DataSourceBannerComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./analytics.component.html",

  styleUrl: "./analytics.component.scss",
  host: {
    "(window:resize)": "onWindowResize()",
  },
})
export class AnalyticsComponent implements AfterViewInit {
  // Angular 21: Use viewChildren() signal instead of @ViewChildren()
  chartRefs = viewChildren<UIChart>(UIChart);
  private readonly apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly playerStatsService = inject(PlayerStatisticsService);
  private readonly authService = inject(AuthService);
  private readonly trainingStatsService = inject(
    TrainingStatsCalculationService,
  );
  private readonly trainingDataService = inject(TrainingDataService);
  private readonly logger = inject(LoggerService);
  private readonly acwrService = inject(AcwrService);
  private readonly toastService = inject(ToastService);
  private readonly analyticsDataService = inject(AnalyticsDataService);
  private readonly teamRankingService = inject(TeamPerformanceRankingService);
  private readonly featureFlags = inject(FeatureFlagsService);

  // Next-gen preview
  nextGenEnabled = this.featureFlags.nextGenMetricsPreview;

  // Runtime guard signals - prevent white screen crashes
  isPageLoading = signal<boolean>(true);
  hasPageError = signal<boolean>(false);
  pageErrorMessage = signal<string>(
    "Something went wrong while loading analytics. Please try again.",
  );
  lastRefreshed = signal<Date | null>(null);

  // Centralized UX copy for data states
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  // Expose UI_LIMITS for template usage
  readonly UI_LIMITS = UI_LIMITS;

  // Team performance achievements (compare against teammates)
  readonly teamPerformanceAchievements = computed(() =>
    this.teamRankingService.achievements(),
  );
  readonly teamRankingBadgeCounts = computed(() => ({
    gold: this.teamRankingService.goldBadges().length,
    silver: this.teamRankingService.silverBadges().length,
    bronze: this.teamRankingService.bronzeBadges().length,
  }));

  metrics = signal<Metric[]>([]);
  developmentGoals = signal<DevelopmentGoal[]>([]);
  performanceChartData = signal<Record<string, unknown> | null>(null);
  chemistryChartData = signal<Record<string, unknown> | null>(null);
  distributionChartData = signal<Record<string, unknown> | null>(null);
  positionChartData = signal<Record<string, unknown> | null>(null);
  speedChartData = signal<Record<string, unknown> | null>(null);

  // Player statistics
  playerGameStats = signal<PlayerGameStats[]>([]);
  playerSeasonStats = signal<PlayerSeasonStats | null>(null);
  playerMultiSeasonStats = signal<PlayerMultiSeasonStats | null>(null);

  // Training statistics
  trainingStats = signal<TrainingStatsData | null>(null);
  acwrData = signal<AnalyticsAcwrData | null>(null);

  readonly analyticsMinimumRequired = 7;
  readonly analyticsDataPoints = computed(() => {
    const sessions = this.trainingStats()?.totalSessions ?? 0;
    const metricsCount = this.metrics().length;
    return Math.max(sessions, metricsCount);
  });
  readonly analyticsDataState = computed(() => {
    const points = this.analyticsDataPoints();
    if (points === 0) return DataState.NO_DATA;
    if (points < this.analyticsMinimumRequired) {
      return DataState.INSUFFICIENT_DATA;
    }
    return DataState.REAL_DATA;
  });

  // Gap Analysis data
  gapAnalysisData = signal<
    Array<{
      metric: string;
      current: number;
      benchmark: number;
      gap: number;
      unit: string;
    }>
  >([]);

  gapAnalysisSummary = signal<{
    achieved: number;
    close: number;
    needsWork: number;
    overallScore: number;
  }>({ achieved: 0, close: 0, needsWork: 0, overallScore: 0 });

  // Speed insights - loaded from real performance data, NOT hardcoded
  speedInsights = signal<{
    best40: string | null;
    best10: string | null;
    improvement: string | null;
  } | null>(null);

  selectedTimePeriod: string = "Last 7 Weeks";
  selectedMetric: string = "40-Yard & 10-Yard";

  timePeriods = ["Last 7 Weeks", "Last 30 Days", "Season Progress"];
  metricOptions = [
    "40-Yard & 10-Yard",
    "All Sprint Distances",
    "Agility Tests",
  ];

  // Share with Coach
  showShareDialog = signal(false);
  isSharing = signal(false);
  shareMessage = signal("");
  shareOptions = {
    includeCharts: true,
    includeGoals: true,
    includeStats: true,
    includeComments: true,
  };

  // Getters/setters for two-way binding in template
  get showShareDialogValue(): boolean {
    return this.showShareDialog();
  }
  set showShareDialogValue(value: boolean) {
    this.showShareDialog.set(value);
  }
  get shareMessageValue(): string {
    return this.shareMessage();
  }
  set shareMessageValue(value: string) {
    this.shareMessage.set(value);
  }

  onSelectedTimePeriodChange(value: string): void {
    this.selectedTimePeriod = value;
  }

  onSelectedMetricChange(value: string): void {
    this.selectedMetric = value;
  }

  onShareOptionChange(
    key: "includeCharts" | "includeGoals" | "includeStats" | "includeComments",
    value: boolean,
  ): void {
    this.shareOptions = {
      ...this.shareOptions,
      [key]: value,
    };
  }

  onShareMessageValueChange(value: string): void {
    this.shareMessageValue = value;
  }

  getInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  isChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  // Enhanced chart options with zoom, pan, custom tooltips
  readonly lineChartOptions = ENHANCED_LINE_CHART_OPTIONS;
  readonly BAR_CHART_OPTIONS = ENHANCED_BAR_CHART_OPTIONS;
  readonly radarChartOptions = ENHANCED_RADAR_CHART_OPTIONS;

  // Responsive doughnut chart options - legend position based on screen width
  get DOUGHNUT_CHART_OPTIONS() {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    return {
      ...ENHANCED_DOUGHNUT_CHART_OPTIONS,
      plugins: {
        ...ENHANCED_DOUGHNUT_CHART_OPTIONS.plugins,
        legend: {
          ...ENHANCED_DOUGHNUT_CHART_OPTIONS.plugins?.legend,
          position: isMobile ? "bottom" : ("right" as const),
        },
      },
    };
  }

  // Chart instances map for export/zoom functionality
  private chartInstances = new Map<string, Chart>();

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.initializePage();
  }

  ngAfterViewInit(): void {
    // Store chart instances for export/zoom functionality
    // Use setTimeout to ensure PrimeNG charts are fully initialized
    setTimeout(() => {
      // Guard: ensure chartRefs signal exists and is callable
      // This prevents errors in test environments where component may be destroyed
      if (!this.chartRefs || typeof this.chartRefs !== "function") {
        return;
      }
      this.chartRefs().forEach((chartRef, index) => {
        // Defensive guard: ensure chart ref and internal Chart.js instance exist
        // This prevents "t.clear is not a function" errors
        const chartInstance = this.extractChartFromRef(chartRef);
        if (chartInstance) {
          // Map chart instances by type
          const chartTypes = [
            "performance",
            "chemistry",
            "distribution",
            "position",
            "speed",
          ];
          if (chartTypes[index]) {
            this.chartInstances.set(chartTypes[index], chartInstance);
          }
        }
      });
    }, TIMEOUTS.UI_TRANSITION_DELAY);
  }

  onWindowResize(): void {
    this.chartInstances.forEach((chart) => {
      if (typeof chart.update === "function") {
        updateChartFontSizes(chart);
      }
    });
  }

  /**
   * Initialize page with error handling
   */
  private initializePage(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);
    this.lastRefreshed.set(new Date());

    try {
      this.loadAnalyticsData();
      this.loadPlayerStatistics();
      this.loadTrainingStatistics();
      this.loadDevelopmentGoals();
      this.loadGapAnalysis();
      this.loadSpeedInsightsFromRealData();
      this.loadTeamRankings();

      // Set loading to false after initial data load starts
      setTimeout(
        () => this.isPageLoading.set(false),
        TIMEOUTS.UI_TRANSITION_DELAY,
      );
    } catch (error) {
      this.isPageLoading.set(false);
      this.hasPageError.set(true);
      this.logger.error("[Analytics] Init error:", error);
      this.pageErrorMessage.set(
        "Failed to initialize analytics. Please try again.",
      );
    }
  }

  /**
   * Retry loading the page
   */
  retryLoad(): void {
    this.initializePage();
  }

  loadTrainingStatistics(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) return;

    // Load comprehensive training stats
    this.trainingStatsService.getTrainingStats().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (stats) => {
        this.trainingStats.set(stats);
        this.lastRefreshed.set(new Date());

        // Update metrics with training data
        const currentMetrics = this.metrics();
        const updatedMetrics = currentMetrics.map((metric) => {
          if (metric.label === "Training Sessions") {
            return {
              ...metric,
              value: stats.totalSessions.toString(),
              trend: `+${(stats as { sessionsThisWeek?: number }).sessionsThisWeek || 0} this week`,
              trendType:
                ((stats as { sessionsThisWeek?: number }).sessionsThisWeek ||
                  0) > 0
                  ? ("positive" as const)
                  : ("neutral" as const),
            };
          }
          return metric;
        });
        this.metrics.set(updatedMetrics);

        // Update distribution chart with real data
        if (stats.sessionsByType) {
          const labels = Object.keys(stats.sessionsByType);
          const values = labels.map((key) => stats.sessionsByType[key].count);
          this.distributionChartData.set({
            labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [
              {
                data: values,
                backgroundColor: COLORS.CHART.slice(
                  0,
                  UI_LIMITS.CHART_COLORS_COUNT,
                ),
                borderWidth: 0,
                hoverOffset: 10,
              },
            ],
          });
        }
      },
      error: (error) => {
        this.logger.error("Error loading training statistics:", error);
      },
    });

    // Load ACWR data from canonical AcwrService (single source of truth)
    const acwrData = this.acwrService.acwrData();
    if (acwrData.ratio > 0) {
      this.acwrData.set({
        acwr: acwrData.ratio,
        acuteLoad: acwrData.acute,
        chronicLoad: acwrData.chronic,
        acuteDays: 7,
        chronicDays: 28,
        riskZone: acwrData.riskZone.level,
        message: acwrData.riskZone.description,
      });
    }
  }

  loadPlayerStatistics(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) return;

    // Load all games for current player
    this.playerStatsService.getPlayerAllGames(currentUser.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (games) => {
        this.playerGameStats.set(games);
      },
      error: (error) => {
        this.logger.error("Error loading player game stats:", error);
      },
    });

    // Load current season stats
    const currentSeason = new Date().getFullYear().toString();
    this.playerStatsService
      .getPlayerSeasonStats(currentUser.id, currentSeason)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (stats) => {
          this.playerSeasonStats.set(stats);
        },
        error: (error) => {
          this.logger.error("Error loading season stats:", error);
        },
      });

    // Load multi-season stats
    this.playerStatsService
      .getPlayerMultiSeasonStats(currentUser.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (stats) => {
          this.playerMultiSeasonStats.set(stats);
        },
        error: (error) => {
          this.logger.error("Error loading multi-season stats:", error);
        },
      });
  }

  gamesMissed(): number {
    return this.playerGameStats().filter((g) => !g.present).length;
  }

  attendanceRate(): number {
    const total = this.playerGameStats().length;
    if (total === 0) return 0;
    const played = this.playerGameStats().filter((g) => g.present).length;
    return Math.round((played / total) * 100);
  }

  loadAnalyticsData(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) {
      this.loadFallbackData();
      return;
    }

    // Load analytics summary for metrics
    this.apiService
      .get(API_ENDPOINTS.analytics.summary, { userId: currentUser.id })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          if (
            response.success &&
            (response.data as { metrics?: Metric[] })?.metrics
          ) {
            this.metrics.set((response.data as { metrics: Metric[] }).metrics);
          } else {
            this.loadFallbackMetrics();
          }
        },
        error: () => {
          this.loadFallbackMetrics();
        },
      });

    // Load performance trends
    this.apiService
      .get(API_ENDPOINTS.analytics.performanceTrends, {
        userId: currentUser.id,
        weeks: 7,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.performanceChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  label: "Performance Score",
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  borderColor: "var(--ds-primary-green)",
                  backgroundColor: "var(--ds-primary-green-subtle)",
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                },
              ],
            });
          } else {
            this.loadFallbackPerformanceChart();
          }
        },
        error: () => {
          this.loadFallbackPerformanceChart();
        },
      });

    // Load team chemistry
    this.apiService
      .get(API_ENDPOINTS.analytics.teamChemistry, { userId: currentUser.id })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.chemistryChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  label: "Team Chemistry",
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  borderColor: "var(--ds-primary-green)",
                  backgroundColor: "var(--p-highlight-background)", // Using rgba for specific opacity
                  borderWidth: 2,
                },
              ],
            });
          } else {
            this.loadFallbackChemistryChart();
          }
        },
        error: () => {
          this.loadFallbackChemistryChart();
        },
      });

    // Load training distribution
    this.apiService
      .get(API_ENDPOINTS.analytics.trainingDistribution, {
        userId: currentUser.id,
        period: "30days",
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.distributionChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  backgroundColor: COLORS.CHART.slice(
                    0,
                    UI_LIMITS.CHART_COLORS_COUNT,
                  ),
                },
              ],
            });
          } else {
            this.loadFallbackDistributionChart();
          }
        },
        error: () => {
          this.loadFallbackDistributionChart();
        },
      });

    // Load position performance
    this.apiService
      .get(API_ENDPOINTS.analytics.positionPerformance, {
        userId: currentUser.id,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.positionChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  label: "Performance",
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  backgroundColor: "var(--ds-primary-green)",
                },
              ],
            });
          } else {
            this.loadFallbackPositionChart();
          }
        },
        error: () => {
          this.loadFallbackPositionChart();
        },
      });

    // Load speed development
    this.apiService
      .get(API_ENDPOINTS.analytics.speedDevelopment, {
        userId: currentUser.id,
        weeks: 7,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const speedData = response.data as {
              labels: string[];
              datasets: Array<{
                label: string;
                data: number[];
                borderColor?: string;
                backgroundColor?: string;
                tension?: number;
              }>;
            };
            // Guard against undefined datasets
            if (
              speedData.labels &&
              speedData.datasets &&
              Array.isArray(speedData.datasets)
            ) {
              this.speedChartData.set({
                labels: speedData.labels,
                datasets: speedData.datasets.map((ds) => ({
                  ...ds,
                  borderColor: ds.label.includes("40")
                    ? "var(--ds-primary-green)"
                    : COLORS.PRIMARY_LIGHT,
                  backgroundColor: ds.label.includes("40")
                    ? "var(--ds-primary-green-subtle)"
                    : "var(--p-highlight-background)",
                })),
              });
            } else {
              this.loadFallbackSpeedChart();
            }
          } else {
            this.loadFallbackSpeedChart();
          }
        },
        error: () => {
          this.loadFallbackSpeedChart();
        },
      });
  }

  loadFallbackData(): void {
    this.loadEmptyMetrics();
    // Set charts to null to show empty states
    this.clearAllChartData();
  }

  loadEmptyMetrics(): void {
    this.metrics.set([
      {
        icon: "pi-chart-line",
        value: "N/A",
        label: "Training Load",
        trend: "ACWR focus",
        trendType: "neutral" as const,
      },
      {
        icon: "pi-users",
        value: "N/A",
        label: "Team Rank",
        trend: "Join a team",
        trendType: "neutral" as const,
      },
      {
        icon: "pi-bolt",
        value: "N/A",
        label: "Top Speed",
        trend: "Record test",
        trendType: "neutral" as const,
      },
      {
        icon: "pi-calendar",
        value: "0",
        label: "Training Sessions",
        trend: "Start today",
        trendType: "positive" as const,
      },
    ]);
  }

  loadFallbackMetrics(): void {
    this.loadEmptyMetrics();
  }

  loadFallbackPerformanceChart(): void {
    this.setChartData("performance", null);
  }

  loadFallbackChemistryChart(): void {
    this.setChartData("chemistry", null);
  }

  loadFallbackDistributionChart(): void {
    this.setChartData("distribution", null);
  }

  loadFallbackPositionChart(): void {
    this.setChartData("position", null);
  }

  loadFallbackSpeedChart(): void {
    this.setChartData("speed", null);
  }

  trackByMetricLabel(index: number, metric: Metric): string {
    return metric.label;
  }

  private extractChartFromRef(chartRef: UIChart): Chart | null {
    const candidate = (chartRef as { chart?: unknown }).chart;
    if (candidate && typeof (candidate as Chart).update === "function") {
      return candidate as Chart;
    }
    return null;
  }

  // Chart action methods
  private getChartInstance(chartType: string): Chart | null {
    const chart = this.chartInstances.get(chartType);
    if (!chart) {
      this.logger.error(`Chart instance not found: ${chartType}`);
      return null;
    }
    return chart;
  }

  exportChart(chartType: string): void {
    const chartInstance = this.getChartInstance(chartType);
    if (!chartInstance) return;

    try {
      exportChartAsPNG(chartInstance, `${chartType}-analytics`);
      this.logger.info(`Chart exported: ${chartType}`);
    } catch (error) {
      this.logger.error(`Export failed: ${chartType}`, error);
    }
  }

  resetChartZoom(chartType: string): void {
    const chartInstance = this.getChartInstance(chartType);
    if (!chartInstance) return;

    try {
      resetChartZoom(chartInstance);
      this.logger.info(`Zoom reset: ${chartType}`);
    } catch (error) {
      this.logger.error(`Reset failed: ${chartType}`, error);
    }
  }

  customizeChart(chartType: string): void {
    this.logger.info(`Customizing ${chartType} chart`);

    // Chart interaction instructions
    const instructions = `Chart Interactions Available:

🔍 Zoom:
  • Scroll with mouse wheel to zoom in/out
  • Pinch on touch devices

↔️ Pan:
  • Hold Shift + drag to pan left/right

Legend: Click legend items to show/hide datasets

Details: Click on data points to view details

Export: Click "Export" button to download as PNG

Reset: Click "Reset Zoom" to restore original view

Tip: Hover over data points to see trend information!`;

    this.toastService.info(instructions, "Chart Interactions");
  }

  viewChartDetails(chartType: string): void {
    this.logger.info(`Viewing details for ${chartType}`);
    // Navigate to enhanced analytics with the specific chart focus
    window.location.href = `/analytics/enhanced?focus=${chartType}`;
  }

  showImprovementTips(area: string): void {
    const tips: Record<string, string> = {
      chemistry:
        "Focus on team communication drills, trust-building exercises, and collaborative training sessions.",
      performance:
        "Track your progress consistently, set incremental goals, and ensure adequate recovery.",
      speed:
        "Incorporate interval training, plyometrics, and proper warm-up routines.",
    };
    this.toastService.info(
      tips[area] || "Continue consistent training and track your progress.",
      "Improvement Tips",
    );
  }

  filterTrainingData(): void {
    this.logger.info("Opening training data filter");
    // For now, show available filter options
    this.toastService.info(
      "Filter options: Last 7 days, Last 30 days, Last 90 days, Season. Use the dropdown selectors to filter data.",
      "Training Data Filters",
    );
  }

  showBenchmarks(): void {
    this.logger.info("Showing position benchmarks");
    this.toastService.info(
      "Position Benchmarks:\n\nQB: 4.5s 40-yard, 85% completion rate\nWR: 4.4s 40-yard, 90% catch rate\nRB: 4.6s 40-yard, 5+ YPC\nDB: 4.5s 40-yard, 3+ flag pulls/game",
      "Position Benchmarks",
    );
  }

  showOptimizationTips(): void {
    this.logger.info("Showing optimization tips");
    this.toastService.info(
      "Optimization Tips:\n\n1. Focus on your weakest metrics\n2. Increase training frequency gradually\n3. Track rest and recovery\n4. Review game film weekly\n5. Work with position-specific drills",
      "Optimization Tips",
    );
  }

  private getChartDataForExport(chartType: string): unknown {
    if (!this.isAnalyticsChartType(chartType)) {
      return { error: "Unknown chart type" };
    }
    return this.getChartData(chartType);
  }

  private clearAllChartData(): void {
    this.setChartData("performance", null);
    this.setChartData("chemistry", null);
    this.setChartData("distribution", null);
    this.setChartData("position", null);
    this.setChartData("speed", null);
  }

  private setChartData(
    chartType: AnalyticsChartType,
    value: Record<string, unknown> | null,
  ): void {
    switch (chartType) {
      case "performance":
        this.performanceChartData.set(value);
        return;
      case "chemistry":
        this.chemistryChartData.set(value);
        return;
      case "distribution":
        this.distributionChartData.set(value);
        return;
      case "position":
        this.positionChartData.set(value);
        return;
      case "speed":
        this.speedChartData.set(value);
        return;
      default:
        return;
    }
  }

  private getChartData(chartType: AnalyticsChartType): Record<string, unknown> | null {
    switch (chartType) {
      case "performance":
        return this.performanceChartData();
      case "chemistry":
        return this.chemistryChartData();
      case "distribution":
        return this.distributionChartData();
      case "position":
        return this.positionChartData();
      case "speed":
        return this.speedChartData();
      default:
        return null;
    }
  }

  private isAnalyticsChartType(chartType: string): chartType is AnalyticsChartType {
    return (
      chartType === "performance" ||
      chartType === "chemistry" ||
      chartType === "distribution" ||
      chartType === "position" ||
      chartType === "speed"
    );
  }

  /**
   * Get icon class for goal metric type
   */
  getGoalIcon(metricType: DevelopmentGoal["metricType"]): string {
    const icons: Record<string, string> = {
      speed: "pi pi-bolt",
      agility: "pi pi-arrows-alt",
      strength: "pi pi-heart-fill",
      power: "pi pi-lightning",
      skill: "pi pi-star",
    };
    return icons[metricType] || "pi pi-bullseye";
  }

  /**
   * Calculate goal progress percentage
   */
  calculateGoalProgress(goal: DevelopmentGoal): number {
    const startValue = goal.startValue || goal.currentValue * 1.1;
    const improvement = startValue - goal.currentValue;
    const totalNeeded = startValue - goal.targetValue;
    if (totalNeeded === 0) return 100;
    return Math.min(
      100,
      Math.max(0, Math.round((improvement / totalNeeded) * 100)),
    );
  }

  /**
   * Get days remaining until goal deadline
   */
  getDaysRemaining(deadline: Date): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Load development goals from API
   */
  private loadDevelopmentGoals(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) return;

    this.apiService
      .get(API_ENDPOINTS.analytics.summary, {
        type: "goals",
        userId: currentUser.id,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          const data = response.data as
            | {
                goals?: {
                  id: string;
                  title: string;
                  progress: number;
                  deadline: string;
                }[];
              }
            | undefined;
          if (response.success && Array.isArray(data?.goals)) {
            const goals = data.goals.map((g) => ({
              ...g,
              deadline: new Date(g.deadline),
            }));
            this.developmentGoals.set(goals as unknown as DevelopmentGoal[]);
          } else {
            // Set empty array if no goals
            this.developmentGoals.set([]);
          }
        },
        error: () => {
          // Fallback to empty goals
          this.developmentGoals.set([]);
        },
      });
  }

  // ============================================================================
  // SHARE WITH COACH
  // ============================================================================

  /**
   * Share analytics report with coach
   */
  async shareWithCoach(): Promise<void> {
    this.isSharing.set(true);

    try {
      const currentUser = this.authService.getUser();
      if (!currentUser?.id) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      const reportData = this.buildShareReportData(currentUser);

      // Send to coach via API
      this.apiService
        .post(API_ENDPOINTS.analytics.summary, {
          action: "share_with_coach",
          ...reportData,
        })
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (_response) => {
            this.isSharing.set(false);
            this.showShareDialog.set(false);
            this.shareMessage.set("");
            this.toastService.success("Analytics report sent to your coach!");
          },
          error: (error) => {
            this.isSharing.set(false);
            this.logger.error("Error sharing with coach:", error);
            // UX AUDIT FIX: Show actual error instead of false success
            this.toastService.error(TOAST.ERROR.ANALYTICS_SHARE_FAILED);
          },
        });
    } catch (error) {
      this.isSharing.set(false);
      this.logger.error("Error sharing analytics:", error);
      this.toastService.error(TOAST.ERROR.ANALYTICS_SHARE_FAILED);
    }
  }

  private buildShareReportData(currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
  }): Record<string, unknown> {
    return {
      playerId: currentUser.id,
      playerName: currentUser.name || currentUser.email,
      reportDate: new Date().toISOString(),
      message: this.shareMessage(),
      includedSections: {
        charts: this.shareOptions.includeCharts,
        goals: this.shareOptions.includeGoals,
        stats: this.shareOptions.includeStats,
        comments: this.shareOptions.includeComments,
      },
      metrics: this.shareOptions.includeCharts ? this.metrics() : [],
      goals: this.shareOptions.includeGoals ? this.developmentGoals() : [],
      seasonStats: this.shareOptions.includeStats ? this.playerSeasonStats() : null,
      acwr: this.acwrData(),
    };
  }

  /**
   * Export analytics as PDF
   */
  exportAnalyticsPDF(): void {
    this.logger.info("Exporting analytics as PDF");

    try {
      const currentUser = this.authService.getUser();
      const playerName = currentUser?.name || currentUser?.email || "Player";
      const dateStr = new Date().toISOString().split("T")[0];

      // Build PDF content as HTML (for print-to-PDF)
      const content = this.generatePDFContent(playerName, dateStr);

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        this.toastService.error(TOAST.ERROR.ALLOW_POPUPS_FOR_PDF);
        return;
      }

      printWindow.document.write(content);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, TIMEOUTS.UI_TRANSITION_DELAY);
      };

      this.toastService.success(
        "PDF export ready! Use your browser's print dialog to save.",
      );
    } catch (error) {
      this.logger.error("Error exporting PDF:", error);
      this.toastService.error(TOAST.ERROR.PDF_EXPORT_FAILED);
    }
  }

  /**
   * Load gap analysis data comparing player metrics to Olympic benchmarks
   */
  private loadGapAnalysis(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) {
      this.gapAnalysisData.set([]);
      return;
    }

    // Load from API or use fallback data
    this.apiService
      .get(API_ENDPOINTS.analytics.summary, {
        type: "gap_analysis",
        userId: currentUser.id,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          const data = response.data as
            | { gaps?: { area: string; current: number; target: number }[] }
            | undefined;
          if (response.success && Array.isArray(data?.gaps)) {
            // Map API response to expected format
            const mappedGaps = data.gaps.map((g) => ({
              metric: g.area,
              current: g.current,
              benchmark: g.target,
              unit: "",
            }));
            this.processGapAnalysisData(mappedGaps);
          } else {
            // Use sample data for demonstration
            this.loadSampleGapAnalysis();
          }
        },
        error: () => {
          this.loadSampleGapAnalysis();
        },
      });
  }

  /**
   * Show empty state when no gap analysis data is available
   * @description Previously loaded sample/mock data which could mislead athletes
   * about their actual performance. Now shows empty state to encourage real data entry.
   */
  private loadSampleGapAnalysis(): void {
    // NO-OP: Mock data removed to ensure calculation integrity
    // Athletes should see their real performance data only
    // Empty state encourages them to complete fitness tests
    this.gapAnalysisData.set([]);
    this.gapAnalysisSummary.set({
      achieved: 0,
      close: 0,
      needsWork: 0,
      overallScore: 0,
    });
    this.logger.info(
      "[Analytics] Gap analysis showing empty state - no mock data",
    );
  }

  /**
   * Load speed insights from real performance records
   * NO MOCK DATA - shows null when no data exists
   */
  private async loadSpeedInsightsFromRealData(): Promise<void> {
    const user = this.analyticsDataService.getCurrentUser();
    if (!user) {
      this.speedInsights.set(null);
      this.speedChartData.set(null);
      return;
    }

    try {
      const { records, error } =
        await this.analyticsDataService.getPerformanceRecords(user.id);

      if (error || !records || records.length === 0) {
        this.logger.info(
          "[Analytics] No performance records found for speed insights",
        );
        this.speedInsights.set(null);
        this.speedChartData.set(null);
        return;
      }

      // Calculate best times from real data
      const dash40Times = records
        .map((r) => r.dash_40)
        .filter((t): t is number => t !== null && t > 0);
      const sprint10Times = records
        .map((r) => r.sprint_10m)
        .filter((t): t is number => t !== null && t > 0);

      const best40 = dash40Times.length > 0 ? Math.min(...dash40Times) : null;
      const best10 =
        sprint10Times.length > 0 ? Math.min(...sprint10Times) : null;

      // Calculate improvement (first vs best for 40-yard)
      let improvement: string | null = null;
      if (dash40Times.length >= 2) {
        // Get the oldest (first) and best 40-yard times
        const oldest40 = records
          .filter((r) => r.dash_40 !== null && r.dash_40 > 0)
          .slice(-1)[0]?.dash_40;
        if (oldest40 && best40) {
          const diff = oldest40 - best40;
          improvement =
            diff > 0
              ? `-${diff.toFixed(2)}s`
              : `+${Math.abs(diff).toFixed(2)}s`;
        }
      }

      this.speedInsights.set({
        best40: best40 ? `${best40.toFixed(2)}s` : null,
        best10: best10 ? `${best10.toFixed(2)}s` : null,
        improvement,
      });

      // Build speed chart from real data
      if (records.length >= 2) {
        const chartRecords = records.slice(0, 7).reverse();
        const labels = chartRecords.map((r) => {
          if (!r.recorded_at) return "Unknown";
          return new Date(r.recorded_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        });

        const datasets = [];

        // 40-yard dataset
        const dash40Data = chartRecords.map((r) => r.dash_40 || null);
        if (dash40Data.some((v) => v !== null)) {
          datasets.push({
            label: "40-Yard Dash",
            data: dash40Data,
            borderColor: "var(--ds-primary-green)",
            backgroundColor: "var(--ds-primary-green-subtle)",
            tension: 0.4,
          });
        }

        // 10-yard dataset
        const sprint10Data = chartRecords.map((r) => r.sprint_10m || null);
        if (sprint10Data.some((v) => v !== null)) {
          datasets.push({
            label: "10-Yard Sprint",
            data: sprint10Data,
            borderColor: "rgba(var(--primitive-primary-500-rgb), 0.6)",
            backgroundColor: "var(--p-highlight-background)",
            tension: 0.4,
          });
        }

        if (datasets.length > 0) {
          this.speedChartData.set({ labels, datasets });
        } else {
          this.speedChartData.set(null);
        }
      } else {
        this.speedChartData.set(null);
      }

      this.logger.info("[Analytics] Speed insights loaded from real data");
    } catch (error) {
      this.logger.error("[Analytics] Error loading speed insights:", error);
      this.speedInsights.set(null);
      this.speedChartData.set(null);
    }
  }

  /**
   * Process gap analysis data and calculate summary
   */
  private processGapAnalysisData(
    data: Array<{
      metric: string;
      current: number;
      benchmark: number;
      unit: string;
    }>,
  ): void {
    const processedData = data.map((item) => {
      // For time-based metrics (lower is better), invert the gap
      const isTimeBased = item.unit === "s";
      const gap = isTimeBased
        ? item.benchmark - item.current // Positive means faster than benchmark
        : item.current - item.benchmark; // Positive means higher than benchmark

      return {
        ...item,
        gap: Number(gap.toFixed(2)),
      };
    });

    this.gapAnalysisData.set(processedData);

    // Calculate summary
    let achieved = 0;
    let close = 0;
    let needsWork = 0;

    processedData.forEach((item) => {
      if (item.gap >= 0) {
        achieved++;
      } else if (item.gap > -10) {
        close++;
      } else {
        needsWork++;
      }
    });

    // Calculate overall score as percentage of benchmarks met or exceeded
    const totalMetrics = processedData.length;
    const overallScore =
      totalMetrics > 0
        ? Math.round(((achieved + close * 0.5) / totalMetrics) * 100)
        : 0;

    this.gapAnalysisSummary.set({
      achieved,
      close,
      needsWork,
      overallScore,
    });
  }

  /**
   * Generate PDF-ready HTML content
   */
  private generatePDFContent(playerName: string, dateStr: string): string {
    const metrics = this.metrics();
    const goals = this.developmentGoals();
    const acwr = this.acwrData();
    const seasonStats = this.playerSeasonStats();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FlagFit Pro Analytics - ${playerName}</title>
        <style>
          body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; /* Poppins when available, else system fallback */
            padding: var(--space-10);
            max-width: var(--dialog-max-width-2xl);
            margin: 0 auto;
            color: var(--color-text-primary);
          }
          .header {
            text-align: center;
            margin-bottom: var(--space-10);
            padding-bottom: var(--space-5);
            border-bottom: var(--border-2) solid var(--color-brand-primary);
          }
          .header h1 {
            color: var(--color-brand-primary);
            margin: 0;
            font-size: var(--ds-font-size-1-75rem);
          }
          .header p {
            color: var(--color-text-secondary);
            margin: calc(var(--space-5) / 2) 0 0;
          }
          .section {
            margin-bottom: var(--space-8);
          }
          .section h2 {
            color: var(--color-text-primary);
            font-size: var(--ds-font-size-lg);
            border-bottom: var(--border-1) solid var(--color-border-secondary);
            padding-bottom: var(--space-2);
            margin-bottom: var(--space-4);
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-4);
          }
          .metric-card {
            background: var(--surface-secondary);
            padding: var(--space-4);
            border-radius: var(--radius-lg);
            text-align: center;
          }
          .metric-value {
            font-size: var(--ds-font-size-2xl);
            font-weight: var(--ds-font-weight-bold);
            color: var(--ds-primary-green);
          }
          .metric-label {
            color: var(--color-text-secondary);
            font-size: var(--ds-font-size-sm);
          }
          .goal-item {
            background: var(--surface-secondary);
            padding: var(--space-3);
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-2);
          }
          .goal-name {
            font-weight: var(--ds-font-weight-bold);
            color: var(--color-text-primary);
          }
          .goal-progress {
            color: var(--color-text-secondary);
            font-size: var(--ds-font-size-sm);
          }
          .stats-table {
            width: 100%;
            border-collapse: collapse;
          }
          .stats-table th, .stats-table td {
            padding: var(--space-2) var(--space-3);
            text-align: left;
            border-bottom: var(--border-1) solid var(--color-border-secondary);
          }
          .stats-table th {
            background: var(--surface-secondary);
            font-weight: var(--ds-font-weight-semibold);
          }
          .footer {
            margin-top: var(--space-10);
            padding-top: var(--space-5);
            border-top: var(--border-1) solid var(--color-border-secondary);
            text-align: center;
            color: var(--color-text-muted);
            font-size: var(--ds-font-size-xs);
          }
          @media print {
            body { padding: var(--space-5); }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FlagFit Pro Analytics Report</h1>
          <p>${playerName} • ${dateStr}</p>
        </div>

        <div class="section">
          <h2>Key Metrics</h2>
          <div class="metrics-grid">
            ${metrics
              .map(
                (m) => `
              <div class="metric-card">
                <div class="metric-value">${m.value}</div>
                <div class="metric-label">${m.label}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>

        ${
          acwr
            ? `
          <div class="section">
            <h2>Training Load (ACWR)</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${acwr.acwr}</div>
                <div class="metric-label">Current ACWR</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${acwr.riskZone || "N/A"}</div>
                <div class="metric-label">Risk Zone</div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        ${
          goals.length > 0
            ? `
          <div class="section">
            <h2>Development Goals</h2>
            ${goals
              .map(
                (g) => `
              <div class="goal-item">
                <div class="goal-name">${g.metricName}</div>
                <div class="goal-progress">
                  Target: ${g.targetValue}${g.targetUnit} • 
                  Current: ${g.currentValue}${g.targetUnit} •
                  Progress: ${this.calculateGoalProgress(g)}%
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          seasonStats
            ? `
          <div class="section">
            <h2>Season Statistics</h2>
            <table class="stats-table">
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Games Played</td><td>${seasonStats.gamesPlayed}</td></tr>
              <tr><td>Attendance Rate</td><td>${seasonStats.attendanceRate?.toFixed(1)}%</td></tr>
              <tr><td>Passing Yards</td><td>${seasonStats.totalPassingYards}</td></tr>
              <tr><td>Completion %</td><td>${seasonStats.completionPercentage?.toFixed(1)}%</td></tr>
              <tr><td>Rushing Yards</td><td>${seasonStats.totalRushingYards}</td></tr>
              <tr><td>Flag Pulls</td><td>${seasonStats.totalFlagPulls}</td></tr>
            </table>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Generated by FlagFit Pro • ${formatDate(new Date(), "PPp")}</p>
          <p>This report is confidential and intended for coaching purposes only.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Load team rankings for comparison badges
   */
  private loadTeamRankings(): void {
    this.teamRankingService.loadTeamRankings();
  }

  /**
   * Get emoji for rank display
   */
  getRankEmoji(rank: number): string {
    return this.teamRankingService.getRankEmoji(rank);
  }
}
