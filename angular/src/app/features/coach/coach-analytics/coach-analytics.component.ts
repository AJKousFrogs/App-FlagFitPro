/**
 * Coach Analytics Dashboard Component
 *
 * Phase 4: Comprehensive analytics dashboard for coaches
 *
 * Features:
 * - Overview metrics (athletes, interactions, completion rate)
 * - Classification accuracy breakdown
 * - Risk level distribution charts
 * - Intent distribution charts
 * - Trends over time
 * - Team leaderboard
 * - Feedback statistics
 */

import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import type { ChartOptions } from "chart.js";
import { Divider } from "primeng/divider";
import { ProgressBar } from "primeng/progressbar";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { Skeleton } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { COLORS } from "../../../core/constants/app.constants";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { getInitials } from "../../../shared/utils/format.utils";

interface OverviewMetrics {
  totalAthletes: number;
  activeAthletesLast7Days: number;
  totalAiInteractions: number;
  interactionsLast7Days: number;
  sessionCompletionRate: number;
  feedbackAccuracyRate: number | null;
  reviewedMessages: number;
}

interface ClassificationBreakdown {
  total: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  topIntents: { intent: string; count: number }[];
  youthInteractions: number;
  youthPercentage: number;
  avgConfidence: number | null;
}

interface TrendData {
  period: string;
  startDate: string;
  endDate: string;
  daily: {
    date: string;
    queries: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    sessionsCreated: number;
    sessionsCompleted: number;
  }[];
  summary: {
    totalQueries: number;
    avgQueriesPerDay: number;
    highRiskTotal: number;
    sessionsCompleted: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  completedSessions: number;
  totalSessions: number;
  completionRate: number;
  totalMinutes: number;
  lastCompleted: string | null;
}

interface TeamOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-coach-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    CardShellComponent,
    LazyChartComponent,
    Divider,
    ProgressBar,
    SelectComponent,
    Skeleton,
    TableModule,
    StatusTagComponent,
    MainLayoutComponent,
    IconButtonComponent,
    PageHeaderComponent,
  ],
  templateUrl: "./coach-analytics.component.html",
  styleUrl: "./coach-analytics.component.scss",
})
export class CoachAnalyticsComponent {
  loading = signal(false);
  overview = signal<OverviewMetrics | null>(null);
  classification = signal<ClassificationBreakdown | null>(null);
  trends = signal<TrendData | null>(null);
  leaderboard = signal<LeaderboardEntry[]>([]);
  feedbackStats = signal<{
    positive: number;
    negative: number;
    neutral: number;
    athleteFeedback?: {
      helpful?: number;
      notHelpful?: number;
      helpfulRate?: number;
    };
    coachFeedback?: {
      appropriate?: number;
      tooStrict?: number;
      tooLenient?: number;
      wrongIntent?: number;
      accuracyRate?: number;
    };
  } | null>(null);

  teamOptions: TeamOption[] = [
    { label: "All Athletes", value: "all" },
    { label: "Youth Elite", value: "youth" },
    { label: "Adult Competition", value: "adult" },
  ];
  selectedTeam = "all";

  timeRangeOptions: TeamOption[] = [
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
  ];
  selectedTimeRange = "30d";

  trendChartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
    }[];
  } | null = null;
  lineChartOptions: ChartOptions<"line"> | null = null;

  constructor() {
    this.initChartOptions();
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading.set(true);
    // Real data would come from this.apiService.get(API_ENDPOINTS.analytics.summary)
    setTimeout(() => {
      this.overview.set({
        totalAthletes: 0,
        activeAthletesLast7Days: 0,
        totalAiInteractions: 0,
        interactionsLast7Days: 0,
        sessionCompletionRate: 0,
        feedbackAccuracyRate: null,
        reviewedMessages: 0,
      });

      this.classification.set({
        total: 0,
        riskDistribution: { high: 0, medium: 0, low: 0 },
        topIntents: [],
        youthInteractions: 0,
        youthPercentage: 0,
        avgConfidence: null,
      });

      this.trends.set(null);
      this.leaderboard.set([]);
      this.feedbackStats.set(null);

      this.updateCharts();
      this.loading.set(false);
    }, 500);
  }

  onTeamChange(value: string | null | undefined): void {
    this.selectedTeam = value ?? "all";
    this.loadAnalytics();
  }

  onTimeRangeChange(value: string | null | undefined): void {
    this.selectedTimeRange = value ?? "30d";
    this.loadAnalytics();
  }

  private initChartOptions(): void {
    this.lineChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { display: true },
        y: { display: true, beginAtZero: true },
      },
    };
  }

  private updateCharts(): void {
    this.trendChartData = {
      labels: ["W1", "W2", "W3", "W4"],
      datasets: [
        {
          label: "Queries",
          data: [65, 82, 74, 95],
          borderColor: COLORS.CYAN,
          tension: 0.4,
          fill: true,
          backgroundColor: `${COLORS.CYAN}1a`,
        },
      ],
    };
  }

  getCompletionSeverity(
    rate: number,
  ): "success" | "info" | "warning" | "danger" {
    if (rate >= 90) return "success";
    if (rate >= 70) return "info";
    if (rate >= 50) return "warning";
    return "danger";
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitials(name: string): string {
    return getInitials(name);
  }
}
