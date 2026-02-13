/**
 * Session Analytics Component
 *
 * Phase 2: Completion analytics widget for micro-sessions
 *
 * Features:
 * - Weekly completion rate visualization
 * - Current and best streaks
 * - Session type breakdown
 * - Average follow-up ratings
 *
 * Usage:
 * <app-session-analytics></app-session-analytics>
 */

import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { ProgressBar } from "primeng/progressbar";
import { SkeletonLoaderComponent } from "../skeleton-loader/skeleton-loader.component";
import { Tooltip } from "primeng/tooltip";
import { EmptyStateComponent } from "../empty-state/empty-state.component";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";
import { COLORS } from "../../../core/constants/app.constants";
import { LazyChartComponent } from "../lazy-chart/lazy-chart.component";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";

interface WeeklyBreakdown {
  week_start: string;
  session_type: string;
  total_assigned: number;
  completed: number;
  skipped: number;
  pending: number;
  completion_rate: number;
  avg_duration_minutes: number;
  avg_follow_up_rating: number;
}

interface AnalyticsData {
  weekly_breakdown: WeeklyBreakdown[];
  totals: {
    total_assigned: number;
    total_completed: number;
    total_skipped: number;
    completion_rate: number;
  };
  streaks: {
    current: number;
    best: number;
  };
}

@Component({
  selector: "app-session-analytics",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Card,
    ProgressBar,
    SkeletonLoaderComponent,
    Tooltip,
    EmptyStateComponent,
    LazyChartComponent,
    StatusTagComponent,
  ],
  template: `
    <div class="session-analytics">
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card completion-rate">
          @if (loading()) {
            <app-skeleton-loader variant="block" width="100%" height="var(--size-80)" />
          } @else {
            <div class="stat-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-content stat-block--card">
              <span class="stat-block__value"
                >{{ analytics()?.totals?.completion_rate || 0 }}%</span
              >
              <span class="stat-block__label">Completion Rate</span>
            </div>
            <p-progressBar
              [value]="analytics()?.totals?.completion_rate || 0"
              [showValue]="false"
              class="completion-bar"
            ></p-progressBar>
          }
        </div>

        <div class="stat-card streak">
          @if (loading()) {
            <app-skeleton-loader variant="block" width="100%" height="var(--size-80)" />
          } @else {
            <div class="stat-icon fire">
              <i class="pi pi-bolt"></i>
            </div>
            <div class="stat-content stat-block--card">
              <span class="stat-block__value">{{
                analytics()?.streaks?.current || 0
              }}</span>
              <span class="stat-block__label">Current Streak</span>
            </div>
            <div class="streak-info">
              <span>Best: {{ analytics()?.streaks?.best || 0 }} days</span>
            </div>
          }
        </div>

        <div class="stat-card completed">
          @if (loading()) {
            <app-skeleton-loader variant="block" width="100%" height="var(--size-80)" />
          } @else {
            <div class="stat-icon success">
              <i class="pi pi-flag-fill"></i>
            </div>
            <div class="stat-content stat-block--card">
              <span class="stat-block__value">{{
                analytics()?.totals?.total_completed || 0
              }}</span>
              <span class="stat-block__label">Sessions Completed</span>
            </div>
            <div class="total-info">
              <span
                >of
                {{ analytics()?.totals?.total_assigned || 0 }} assigned</span
              >
            </div>
          }
        </div>
      </div>

      <!-- Weekly Chart -->
      @if (!loading() && chartData()) {
        <p-card class="chart-card">
          <ng-template #header>
            <div class="chart-header">
              <h3>Weekly Progress</h3>
              <app-status-tag
                value="Last 4 weeks"
                severity="secondary"
                size="sm"
              />
            </div>
          </ng-template>
          <div class="chart-container">
            <app-lazy-chart
              type="bar"
              [data]="chartData()"
              [options]="chartOptions"
              height="var(--size-200)"
            ></app-lazy-chart>
          </div>
        </p-card>
      }

      <!-- Session Type Breakdown -->
      @if (!loading() && sessionTypeStats().length > 0) {
        <div class="type-breakdown">
          <h4>By Session Type</h4>
          <div class="type-list">
            @for (type of sessionTypeStats(); track type.type) {
              <div class="type-item">
                <div class="type-info">
                  <span class="type-name">
                    <i [class]="getTypeIcon(type.type)"></i>
                    {{ formatTypeName(type.type) }}
                  </span>
                  <span class="type-count"
                    >{{ type.completed }}/{{ type.total }}</span
                  >
                </div>
                <p-progressBar
                  [value]="type.rate"
                  [showValue]="false"
                  class="type-bar"
                ></p-progressBar>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (
        !loading() &&
        (!analytics()?.totals?.total_assigned ||
          analytics()?.totals?.total_assigned === 0)
      ) {
        <app-empty-state
          icon="pi-chart-bar"
          heading="No Sessions Yet"
          description="Start micro-sessions from Merlin AI suggestions to track your progress here."
        />
      }
    </div>
  `,
  styleUrl: "./session-analytics.component.scss",
})
export class SessionAnalyticsComponent implements OnInit {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  loading = signal(true);
  analytics = signal<AnalyticsData | null>(null);

  // Chart configuration
  chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 16,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "var(--color-border-subtle)",
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  // Computed chart data
  chartData = computed(() => {
    const data = this.analytics();
    if (!data || !data.weekly_breakdown || data.weekly_breakdown.length === 0) {
      return null;
    }

    // Aggregate by week
    const weekMap = new Map<
      string,
      { completed: number; skipped: number; pending: number }
    >();

    for (const week of data.weekly_breakdown) {
      const existing = weekMap.get(week.week_start) || {
        completed: 0,
        skipped: 0,
        pending: 0,
      };
      weekMap.set(week.week_start, {
        completed: existing.completed + week.completed,
        skipped: existing.skipped + week.skipped,
        pending: existing.pending + week.pending,
      });
    }

    const weeks = Array.from(weekMap.keys()).sort().slice(-4);
    const labels = weeks.map((w) => this.formatWeekLabel(w));

    return {
      labels,
      datasets: [
        {
          label: "Completed",
          data: weeks.map((w) => weekMap.get(w)?.completed || 0),
          backgroundColor: COLORS.PRIMARY,
          borderRadius: 4,
        },
        {
          label: "Skipped",
          data: weeks.map((w) => weekMap.get(w)?.skipped || 0),
          backgroundColor: COLORS.AMBER,
          borderRadius: 4,
        },
      ],
    };
  });

  // Computed session type stats
  sessionTypeStats = computed(() => {
    const data = this.analytics();
    if (!data || !data.weekly_breakdown) return [];

    // Aggregate by session type
    const typeMap = new Map<string, { completed: number; total: number }>();

    for (const week of data.weekly_breakdown) {
      const existing = typeMap.get(week.session_type) || {
        completed: 0,
        total: 0,
      };
      typeMap.set(week.session_type, {
        completed: existing.completed + week.completed,
        total: existing.total + week.total_assigned,
      });
    }

    return Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      completed: stats.completed,
      total: stats.total,
      rate:
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));
  });

  ngOnInit(): void {
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.loading.set(true);

    try {
      const response = await firstValueFrom(
        this.apiService.get<AnalyticsData>(
          API_ENDPOINTS.microSessions.analytics,
          {
            weeks: 4,
          },
        ),
      );

      if (response?.success && response.data) {
        this.analytics.set(response.data);
      }
    } catch (error) {
      this.logger.error("Error loading session analytics:", error);
    } finally {
      this.loading.set(false);
    }
  }

  // Helper methods
  formatWeekLabel(weekStart: string): string {
    const date = new Date(weekStart);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  formatTypeName(type: string): string {
    const names: Record<string, string> = {
      recovery: "Recovery",
      technique: "Technique",
      mobility: "Mobility",
      mental: "Mental",
      strength: "Strength",
      warm_up: "Warm-up",
    };
    return names[type] || type;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      recovery: "pi pi-heart",
      technique: "pi pi-bullseye",
      mobility: "pi pi-sync",
      mental: "pi pi-eye",
      strength: "pi pi-bolt",
      warm_up: "pi pi-sun",
    };
    return icons[type] || "pi pi-circle";
  }
}
