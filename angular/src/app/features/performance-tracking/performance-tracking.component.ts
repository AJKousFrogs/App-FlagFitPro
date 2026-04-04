import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { DatePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ProgressBarComponent } from "../../shared/components/progress-bar/progress-bar.component";
import { TableComponent } from "../../shared/components/table/table.component";
import { InputNumberComponent } from "../../shared/components/input-number/input-number.component";
import { FormInputComponent } from "../../shared/components/form-input/form-input.component";
import { COLORS, UI_LIMITS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { ApiService } from "../../core/services/api.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";
import { FeatureFlagsService } from "../../core/services/feature-flags.service";
import { PerformanceTrackingDataService } from "./services/performance-tracking-data.service";
import { DataState } from "../../core/services/data-source.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  StatItem,
  StatsGridComponent,
} from "../../shared/components/stats-grid/stats-grid.component";
import { DataSourceBannerComponent } from "../../shared/components/data-source-banner/data-source-banner.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { SimpleChartData } from "../../core/models/chart.models";
import { DATA_STATE_MESSAGES } from "../../shared/utils/privacy-ux-copy";
import {
  TeamPerformanceRankingService,
  PerformanceAchievement,
} from "../../core/services/team-performance-ranking.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";

/**
 * Database record shape for performance_records table
 */
interface PerformanceRecord {
  id: string;
  user_id: string;
  sprint_10m: number | null;
  sprint_20m: number | null;
  dash_40: number | null;
  pro_agility: number | null;
  l_drill: number | null;
  reactive_agility: number | null;
  vertical_jump: number | null;
  broad_jump: number | null;
  rsi: number | null;
  bench_press: number | null;
  back_squat: number | null;
  deadlift: number | null;
  body_weight: number | null;
  notes: string | null;
  overall_score: number | null;
  recorded_at: string;
}

interface PerformanceMetric {
  name: string;
  value: string;
  trend: string;
  trendType: "up" | "down" | "neutral";
}

interface GapAnalysis {
  metric: string;
  current: number;
  target: number;
  gap: number;
  gapPercentage: number;
  priority: number;
  recommendations: string[];
}

interface PositionBenchmark {
  metric: string;
  current: number;
  elite: number;
  unit: string;
  percentOfElite: number;
  gapFromElite: string;
}

interface NewPerformanceForm {
  sprint10: number | null;
  sprint20: number | null;
  dash40: number | null;
  proAgility: number | null;
  lDrill: number | null;
  reactiveAgility: number | null;
  vertical: number | null;
  broad: number | null;
  rsi: number | null;
  bench: number | null;
  squat: number | null;
  deadlift: number | null;
  bodyWeight: number | null;
  notes: string;
}

const POSITION_BENCHMARKS: Record<
  string,
  Record<string, { elite: number; good: number; average: number }>
> = {
  WR: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 36, good: 32, average: 28 },
    relativeSquat: { elite: 2.0, good: 1.75, average: 1.5 },
  },
  QB: {
    sprint40: { elite: 4.6, good: 4.8, average: 5.0 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 34, good: 30, average: 26 },
    relativeSquat: { elite: 1.8, good: 1.6, average: 1.4 },
  },
  DB: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 35, good: 31, average: 27 },
    relativeSquat: { elite: 2.0, good: 1.75, average: 1.5 },
  },
  Rusher: {
    sprint40: { elite: 4.5, good: 4.7, average: 4.9 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 33, good: 29, average: 25 },
    relativeSquat: { elite: 2.2, good: 1.9, average: 1.6 },
  },
};

const TRAINING_RECOMMENDATIONS: Record<string, string[]> = {
  proAgility: [
    "Lateral change of direction drills (2x/week)",
    "Hip mobility work before training",
    "Deceleration/re-acceleration mechanics",
  ],
  sprint40: [
    "Sprint mechanics drills",
    "Acceleration work (10-20m)",
    "Hip flexor strength development",
  ],
  verticalJump: [
    "Plyometric training (box jumps, depth jumps)",
    "Hip flexor power development",
    "Reactive strength (RSI) training",
  ],
  relativeSquat: [
    "Progressive squat program (3x/week, 85% 1RM)",
    "Single-leg variations (split squats, lunges)",
    "Core stability work",
  ],
};

@Component({
  selector: "app-performance-tracking",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppDialogComponent,
    ButtonComponent,
    LazyChartComponent,
    TableComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    InputNumberComponent,
    FormInputComponent,
    ProgressBarComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    RouterModule,
    StatusTagComponent,
    DataSourceBannerComponent,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./performance-tracking.component.html",

  styleUrl: "./performance-tracking.component.scss",
})
export class PerformanceTrackingComponent {
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly performanceTrackingDataService = inject(
    PerformanceTrackingDataService,
  );
  private readonly logger = inject(LoggerService);
  private readonly teamRankingService = inject(TeamPerformanceRankingService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly featureFlags = inject(FeatureFlagsService);

  // Next-gen preview
  readonly nextGenEnabled = this.featureFlags.nextGenMetricsPreview;

  // Runtime guard signals - prevent white screen crashes
  readonly isPageLoading = signal<boolean>(true);
  readonly hasPageError = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>(
    "Something went wrong while loading performance data. Please try again.",
  );
  readonly lastRefreshed = signal<Date | null>(null);

  readonly performanceMinimumRequired = 1;
  readonly performanceDataPoints = computed(
    () => this.performanceHistory().length,
  );
  readonly performanceDataState = computed(() => {
    const points = this.performanceDataPoints();
    if (points === 0) return DataState.NO_DATA;
    if (points < this.performanceMinimumRequired) {
      return DataState.INSUFFICIENT_DATA;
    }
    return DataState.REAL_DATA;
  });

  // Centralized UX copy for data states
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  readonly metrics = signal<PerformanceMetric[]>([]);
  readonly performanceStats = signal<StatItem[]>([]);
  // Chart data - uses Chart.js format
  readonly performanceChartData = signal<SimpleChartData | null>(null);
  readonly speedChartData = signal<SimpleChartData | null>(null);
  readonly performanceHistory = signal<Record<string, unknown>[]>([]);
  readonly positionBenchmarks = signal<PositionBenchmark[]>([]);
  readonly gapAnalysis = signal<GapAnalysis[]>([]);
  readonly selectedPosition = signal<string>("WR");

  // Store the latest record for benchmark calculations
  private latestRecord = signal<PerformanceRecord | null>(null);

  // Computed: check if we have any real data
  readonly hasData = computed(() => this.performanceHistory().length > 0);

  // Team ranking signals - compare against teammates
  readonly teamRankings = computed(() => this.teamRankingService.rankings());
  readonly performanceAchievements = computed(() =>
    this.teamRankingService.achievements(),
  );
  readonly hasTeam = computed(() => this.teamMembershipService.hasTeam());

  // Badge counts
  readonly goldBadgeCount = computed(
    () => this.teamRankings()?.totalGoldBadges || 0,
  );
  readonly silverBadgeCount = computed(
    () => this.teamRankings()?.totalSilverBadges || 0,
  );
  readonly bronzeBadgeCount = computed(
    () => this.teamRankings()?.totalBronzeBadges || 0,
  );

  // Position selector
  selectedPositionValue = "WR";
  positionOptions = [
    { label: "Wide Receiver (WR)", value: "WR" },
    { label: "Quarterback (QB)", value: "QB" },
    { label: "Defensive Back (DB)", value: "DB" },
    { label: "Rusher", value: "Rusher" },
  ];

  // Dialog state
  showLogDialog = false;
  readonly isSaving = signal(false);
  newPerformance: NewPerformanceForm = {
    sprint10: null as number | null,
    sprint20: null as number | null,
    dash40: null as number | null,
    proAgility: null as number | null,
    lDrill: null as number | null,
    reactiveAgility: null as number | null,
    vertical: null as number | null,
    broad: null as number | null,
    rsi: null as number | null,
    bench: null as number | null,
    squat: null as number | null,
    deadlift: null as number | null,
    bodyWeight: null as number | null,
    notes: "",
  };

  readonly chartOptions = DEFAULT_CHART_OPTIONS;

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.initializePage();
  }

  /**
   * Initialize page with error handling
   */
  private initializePage(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);
    this.loadPerformanceData();
  }

  /**
   * Retry loading the page
   */
  retryLoad(): void {
    this.initializePage();
  }

  /**
   * Load real performance data from database
   * NO MOCK DATA - shows empty states when no data exists
   */
  async loadPerformanceData(): Promise<void> {
    try {
      const user = this.performanceTrackingDataService.getCurrentUser();
      if (!user) {
        // Not logged in - show empty state
        this.setEmptyState();
        this.lastRefreshed.set(new Date());
        this.isPageLoading.set(false);
        return;
      }

      // Fetch performance records from Supabase
      const { records, error } =
        await this.performanceTrackingDataService.fetchPerformanceRecords(
          user.id,
        );

      if (error) {
        this.logger.error(
          "[PerformanceTracking] Error fetching records:",
          error,
        );
        this.setEmptyState();
        this.lastRefreshed.set(new Date());
        this.isPageLoading.set(false);
        return;
      }

      if (records.length === 0) {
        // No data yet - show empty states (not mock data)
        this.logger.info(
          "[PerformanceTracking] No performance records found - showing empty state",
        );
        this.setEmptyState();
        this.lastRefreshed.set(new Date());
        this.isPageLoading.set(false);
        return;
      }

      // Process real data
      this.processPerformanceRecords(records as PerformanceRecord[]);

      // Load team rankings (compare against teammates)
      await this.teamRankingService.loadTeamRankings();

      this.lastRefreshed.set(new Date());
      this.isPageLoading.set(false);
      this.hasPageError.set(false);
    } catch (error) {
      this.logger.error("[PerformanceTracking] Unexpected error:", error);
      this.setEmptyState();
      this.lastRefreshed.set(new Date());
      this.isPageLoading.set(false);
    }
  }

  /**
   * Set empty state - NO mock data
   */
  private setEmptyState(): void {
    this.performanceStats.set([]);
    this.performanceChartData.set(null);
    this.speedChartData.set(null);
    this.performanceHistory.set([]);
    this.positionBenchmarks.set([]);
    this.gapAnalysis.set([]);
    this.latestRecord.set(null);
  }

  /**
   * Process real performance records from database
   */
  private processPerformanceRecords(records: PerformanceRecord[]): void {
    // Store latest record for benchmark calculations
    this.latestRecord.set(records[0]);

    // Build performance history for table
    const history = records.map((record) => ({
      date: new Date(record.recorded_at).toLocaleDateString(),
      sprint10: record.sprint_10m ? `${record.sprint_10m}s` : "-",
      sprint20: record.sprint_20m ? `${record.sprint_20m}s` : "-",
      dash40: record.dash_40 ? `${record.dash_40}s` : "-",
      proAgility: record.pro_agility ? `${record.pro_agility}s` : "-",
      vertical: record.vertical_jump ? `${record.vertical_jump}"` : "-",
      broad: record.broad_jump ? `${record.broad_jump}"` : "-",
      squat: record.back_squat ? `${record.back_squat}lb` : "-",
      deadlift: record.deadlift ? `${record.deadlift}lb` : "-",
      score: record.overall_score || 0,
    }));
    this.performanceHistory.set(history);

    // Build stats grid from latest record
    this.buildStatsFromLatestRecord(records[0], records[1] || null);

    // Build speed chart (10-yard, 20-yard, 40-yard - NOT 100-yard)
    this.buildSpeedChart(records[0]);

    // Build performance over time chart
    this.buildPerformanceChart(records);

    // Update position benchmarks with real data
    this.updatePositionBenchmarks();
  }

  /**
   * Build stats grid from latest performance record
   */
  private buildStatsFromLatestRecord(
    latest: PerformanceRecord,
    previous: PerformanceRecord | null,
  ): void {
    const stats: StatItem[] = [];

    // 40-Yard Dash
    if (latest.dash_40) {
      const trend = previous?.dash_40
        ? `${(previous.dash_40 - latest.dash_40).toFixed(2)}s`
        : "First test";
      const trendType = previous?.dash_40
        ? latest.dash_40 < previous.dash_40
          ? "positive"
          : latest.dash_40 > previous.dash_40
            ? "negative"
            : "neutral"
        : "neutral";
      stats.push({
        label: "40-Yard Dash",
        value: `${latest.dash_40}s`,
        icon: "pi-bolt",
        color: "var(--ds-primary-green)",
        trend,
        trendType: trendType as "positive" | "negative" | "neutral",
      });
    }

    // Vertical Jump
    if (latest.vertical_jump) {
      const trend = previous?.vertical_jump
        ? `${latest.vertical_jump - previous.vertical_jump > 0 ? "+" : ""}${(latest.vertical_jump - previous.vertical_jump).toFixed(0)}"`
        : "First test";
      const trendType = previous?.vertical_jump
        ? latest.vertical_jump > previous.vertical_jump
          ? "positive"
          : latest.vertical_jump < previous.vertical_jump
            ? "negative"
            : "neutral"
        : "neutral";
      stats.push({
        label: "Vertical Jump",
        value: `${latest.vertical_jump}"`,
        icon: "pi-arrow-up",
        color: COLORS.PRIMARY_LIGHT,
        trend,
        trendType: trendType as "positive" | "negative" | "neutral",
      });
    }

    // Broad Jump
    if (latest.broad_jump) {
      const feet = Math.floor(latest.broad_jump / 12);
      const inches = latest.broad_jump % 12;
      const trend = previous?.broad_jump
        ? `${latest.broad_jump - previous.broad_jump > 0 ? "+" : ""}${(latest.broad_jump - previous.broad_jump).toFixed(0)}"`
        : "First test";
      const trendType = previous?.broad_jump
        ? latest.broad_jump > previous.broad_jump
          ? "positive"
          : latest.broad_jump < previous.broad_jump
            ? "negative"
            : "neutral"
        : "neutral";
      stats.push({
        label: "Broad Jump",
        value: `${feet}'${inches}"`,
        icon: "pi-arrow-right",
        color: COLORS.WARNING,
        trend,
        trendType: trendType as "positive" | "negative" | "neutral",
      });
    }

    // Bench Press
    if (latest.bench_press) {
      const trend = previous?.bench_press
        ? `${latest.bench_press - previous.bench_press > 0 ? "+" : ""}${latest.bench_press - previous.bench_press} lbs`
        : "First test";
      const trendType = previous?.bench_press
        ? latest.bench_press > previous.bench_press
          ? "positive"
          : latest.bench_press < previous.bench_press
            ? "negative"
            : "neutral"
        : "neutral";
      stats.push({
        label: "Bench Press",
        value: `${latest.bench_press} lbs`,
        icon: "pi-heart-fill",
        color: COLORS.ERROR,
        trend,
        trendType: trendType as "positive" | "negative" | "neutral",
      });
    }

    this.performanceStats.set(stats);
  }

  /**
   * Build speed chart with 10-yard, 20-yard, 40-yard times
   * FIXED: Removed incorrect 100-yard metric
   */
  private buildSpeedChart(latest: PerformanceRecord): void {
    const labels: string[] = [];
    const data: number[] = [];

    // Only include metrics that have data
    if (latest.sprint_10m) {
      labels.push("10-Yard");
      data.push(latest.sprint_10m);
    }
    if (latest.sprint_20m) {
      labels.push("20-Yard");
      data.push(latest.sprint_20m);
    }
    if (latest.dash_40) {
      labels.push("40-Yard");
      data.push(latest.dash_40);
    }

    if (data.length > 0) {
      this.speedChartData.set({
        labels,
        datasets: [
          {
            label: "Speed (seconds)",
            data,
            backgroundColor: COLORS.PRIMARY_LIGHT,
          },
        ],
      });
    } else {
      this.speedChartData.set(null);
    }
  }

  /**
   * Build performance over time chart from historical records
   */
  private buildPerformanceChart(records: PerformanceRecord[]): void {
    if (records.length < 2) {
      // Need at least 2 records for a trend chart
      this.performanceChartData.set(null);
      return;
    }

    // Take last 6 records, reversed for chronological order
    const chartRecords = records.slice(0, 6).reverse();

    const labels = chartRecords.map((r) =>
      new Date(r.recorded_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    );

    const scores = chartRecords.map((r) => r.overall_score || 0);

    this.performanceChartData.set({
      labels,
      datasets: [
        {
          label: "Overall Performance Score",
          data: scores,
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "var(--ds-primary-green-subtle)",
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }

  onPositionChange(event: { value: string }): void {
    this.selectedPosition.set(event.value);
    this.updatePositionBenchmarks();
  }

  onPositionSelectionChange(value: string | null | undefined): void {
    const nextValue = value ?? "WR";
    this.selectedPositionValue = nextValue;
    this.onPositionChange({ value: nextValue });
  }

  /**
   * Update position benchmarks using REAL data from latest record
   * NO mock data - if no data exists, shows empty state
   */
  private updatePositionBenchmarks(): void {
    const position = this.selectedPosition();
    const benchmarks = POSITION_BENCHMARKS[position];
    const latest = this.latestRecord();

    if (!benchmarks || !latest) {
      // No benchmarks or no data - show empty state
      this.positionBenchmarks.set([]);
      this.gapAnalysis.set([]);
      return;
    }

    // Use REAL values from latest record, not mock data
    const positionBenchmarksList: PositionBenchmark[] = [];

    // 40-Yard Dash
    if (latest.dash_40) {
      positionBenchmarksList.push({
        metric: "40-Yard Dash",
        current: latest.dash_40,
        elite: benchmarks.sprint40.elite,
        unit: "s",
        percentOfElite: Math.min(
          100,
          (benchmarks.sprint40.elite / latest.dash_40) * 100,
        ),
        gapFromElite: `${(latest.dash_40 - benchmarks.sprint40.elite).toFixed(2)}s`,
      });
    }

    // Pro Agility
    if (latest.pro_agility) {
      positionBenchmarksList.push({
        metric: "Pro Agility",
        current: latest.pro_agility,
        elite: benchmarks.proAgility.elite,
        unit: "s",
        percentOfElite: Math.min(
          100,
          (benchmarks.proAgility.elite / latest.pro_agility) * 100,
        ),
        gapFromElite: `${(latest.pro_agility - benchmarks.proAgility.elite).toFixed(2)}s`,
      });
    }

    // Vertical Jump
    if (latest.vertical_jump) {
      positionBenchmarksList.push({
        metric: "Vertical Jump",
        current: latest.vertical_jump,
        elite: benchmarks.verticalJump.elite,
        unit: '"',
        percentOfElite: Math.min(
          100,
          (latest.vertical_jump / benchmarks.verticalJump.elite) * 100,
        ),
        gapFromElite: `${(benchmarks.verticalJump.elite - latest.vertical_jump).toFixed(0)}"`,
      });
    }

    // Relative Squat (requires body weight and squat)
    if (latest.back_squat && latest.body_weight && latest.body_weight > 0) {
      const relativeSquat = latest.back_squat / latest.body_weight;
      positionBenchmarksList.push({
        metric: "Relative Squat (× BW)",
        current: Number(relativeSquat.toFixed(2)),
        elite: benchmarks.relativeSquat.elite,
        unit: "×",
        percentOfElite: Math.min(
          100,
          (relativeSquat / benchmarks.relativeSquat.elite) * 100,
        ),
        gapFromElite: `${(benchmarks.relativeSquat.elite - relativeSquat).toFixed(2)}×`,
      });
    }

    this.positionBenchmarks.set(positionBenchmarksList);

    // Calculate gap analysis from real benchmarks
    const gaps: GapAnalysis[] = positionBenchmarksList
      .map((b, index) => {
        const gapPercentage = 100 - b.percentOfElite;
        const metricKeys = [
          "sprint40",
          "proAgility",
          "verticalJump",
          "relativeSquat",
        ];
        const metricKey = metricKeys[index] || "";
        return {
          metric: b.metric,
          current: b.current,
          target: b.elite,
          gap: Math.abs(b.current - b.elite),
          gapPercentage,
          priority: index + 1,
          recommendations: TRAINING_RECOMMENDATIONS[metricKey] || [],
        };
      })
      .filter((g) => g.gapPercentage > 0)
      .sort((a, b) => b.gapPercentage - a.gapPercentage)
      .slice(0, UI_LIMITS.TOP_PRIORITIES_COUNT);

    this.gapAnalysis.set(gaps);
  }

  readonly openLogDialogHandler = (): void => this.openLogDialog();

  openLogDialog(): void {
    // Reset form and open dialog
    this.newPerformance = {
      sprint10: null,
      sprint20: null,
      dash40: null,
      proAgility: null,
      lDrill: null,
      reactiveAgility: null,
      vertical: null,
      broad: null,
      rsi: null,
      bench: null,
      squat: null,
      deadlift: null,
      bodyWeight: null,
      notes: "",
    };
    this.showLogDialog = true;
  }

  updatePerformanceMetric(
    field: Exclude<keyof NewPerformanceForm, "notes">,
    value: number | null | undefined,
  ): void {
    this.newPerformance = { ...this.newPerformance, [field]: value ?? null };
  }

  updatePerformanceNotes(value: string | null | undefined): void {
    this.newPerformance = { ...this.newPerformance, notes: value ?? "" };
  }

  async savePerformance(): Promise<void> {
    // Validate at least one metric is entered
    const hasAnyMetric =
      this.newPerformance.sprint10 ||
      this.newPerformance.sprint20 ||
      this.newPerformance.dash40 ||
      this.newPerformance.proAgility ||
      this.newPerformance.lDrill ||
      this.newPerformance.reactiveAgility ||
      this.newPerformance.vertical ||
      this.newPerformance.broad ||
      this.newPerformance.rsi ||
      this.newPerformance.bench ||
      this.newPerformance.squat ||
      this.newPerformance.deadlift;

    if (!hasAnyMetric) {
      this.toastService.warn(TOAST.WARN.ENTER_PERFORMANCE_METRIC);
      return;
    }

    this.isSaving.set(true);

    try {
      const user = this.performanceTrackingDataService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.LOGIN_TO_SAVE_PERFORMANCE);
        return;
      }

      // Calculate overall score (simple average based on benchmarks)
      const score = this.calculateScore();

      // Save to Supabase with extended fields
      const { error } =
        await this.performanceTrackingDataService.createPerformanceRecord({
          userId: user.id,
          score,
          payload: {
            sprint_10m: this.newPerformance.sprint10,
            sprint_20m: this.newPerformance.sprint20,
            dash_40: this.newPerformance.dash40,
            pro_agility: this.newPerformance.proAgility,
            l_drill: this.newPerformance.lDrill,
            reactive_agility: this.newPerformance.reactiveAgility,
            vertical_jump: this.newPerformance.vertical,
            broad_jump: this.newPerformance.broad,
            rsi: this.newPerformance.rsi,
            bench_press: this.newPerformance.bench,
            back_squat: this.newPerformance.squat,
            deadlift: this.newPerformance.deadlift,
            body_weight: this.newPerformance.bodyWeight,
            notes: this.newPerformance.notes,
          },
        });

      if (error) {
        throw new Error(error.message);
      }

      // Reload all data from database to ensure consistency
      await this.loadPerformanceData();

      this.toastService.success(TOAST.SUCCESS.PERFORMANCE_LOGGED);
      this.showLogDialog = false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save performance";
      this.toastService.error(message);
    } finally {
      this.isSaving.set(false);
    }
  }

  private calculateScore(): number {
    // Simple scoring based on typical flag football benchmarks
    let totalPoints = 0;
    let metrics = 0;

    if (this.newPerformance.dash40) {
      // 4.4s = 100, 5.0s = 60
      const dashScore = Math.max(
        0,
        Math.min(100, 100 - ((this.newPerformance.dash40 - 4.4) / 0.6) * 40),
      );
      totalPoints += dashScore;
      metrics++;
    }

    if (this.newPerformance.vertical) {
      // 40" = 100, 28" = 60
      const vertScore = Math.max(
        0,
        Math.min(100, 60 + ((this.newPerformance.vertical - 28) / 12) * 40),
      );
      totalPoints += vertScore;
      metrics++;
    }

    if (this.newPerformance.broad) {
      // 130" = 100, 100" = 60
      const broadScore = Math.max(
        0,
        Math.min(100, 60 + ((this.newPerformance.broad - 100) / 30) * 40),
      );
      totalPoints += broadScore;
      metrics++;
    }

    if (this.newPerformance.bench) {
      // 250 = 100, 150 = 60
      const benchScore = Math.max(
        0,
        Math.min(100, 60 + ((this.newPerformance.bench - 150) / 100) * 40),
      );
      totalPoints += benchScore;
      metrics++;
    }

    return metrics > 0 ? Math.round(totalPoints / metrics) : 0;
  }

  getTrendSeverity(trendType: string): string {
    const severities: Record<string, string> = {
      up: "success",
      down: "danger",
      neutral: "info",
    };
    return severities[trendType] || "info";
  }

  getScoreSeverity(score: number): "success" | "info" | "warning" | "danger" {
    if (score >= 90) return "success";
    if (score >= 80) return "info";
    if (score >= 70) return "warning";
    return "danger";
  }

  trackByMetricName(index: number, metric: PerformanceMetric): string {
    return metric.name;
  }

  // ============================================================================
  // TEAM RANKING HELPER METHODS
  // ============================================================================

  /**
   * Get icon for achievement badge based on metric
   */
  getAchievementIcon(metric: string): string {
    const iconMap: Record<string, string> = {
      dash_40: "pi-bolt",
      sprint_10m: "pi-bolt",
      sprint_20m: "pi-bolt",
      pro_agility: "pi-sync",
      vertical_jump: "pi-arrow-up",
      broad_jump: "pi-arrows-h",
      bench_press: "pi-heart-fill",
      back_squat: "pi-chart-bar",
      deadlift: "pi-chart-bar",
    };
    return iconMap[metric] || "pi-trophy";
  }

  /**
   * Get description for achievement badge
   */
  getRankDescription(achievement: PerformanceAchievement): string {
    const rankText =
      achievement.rank === 1
        ? "Team Leader"
        : achievement.rank === 2
          ? "2nd on Team"
          : "3rd on Team";
    return `${rankText} - ${achievement.valueFormatted}`;
  }

  /**
   * Format rank number (1st, 2nd, 3rd, etc.)
   */
  formatRank(rank: number): string {
    return this.teamRankingService.formatRank(rank);
  }

  /**
   * Get emoji for rank
   */
  getRankEmoji(rank: number): string {
    return this.teamRankingService.getRankEmoji(rank);
  }

  /**
   * Get unit for metric display
   */
  getMetricUnit(metric: string): string {
    const unitMap: Record<string, string> = {
      vertical_jump: '"',
      broad_jump: '"',
      bench_press: " lbs",
      back_squat: " lbs",
      deadlift: " lbs",
    };
    return unitMap[metric] || "";
  }
}
