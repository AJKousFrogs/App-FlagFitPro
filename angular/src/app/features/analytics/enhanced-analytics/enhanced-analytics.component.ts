import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { Tabs, TabPanel } from "primeng/tabs";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-enhanced-analytics",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    ButtonModule,
    ChartModule,
    Tabs,
    TabPanel,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="enhanced-analytics-page">
        <app-page-header
          title="Enhanced Analytics"
          subtitle="Advanced performance insights and predictions"
          icon="pi-chart-line"
        >
          <p-button
            label="Export Report"
            icon="pi pi-download"
            [outlined]="true"
            (onClick)="exportReport()"
          ></p-button>
        </app-page-header>

        <p-tabs>
          <p-tabpanel header="Performance Trends">
            <p-card>
              <ng-template pTemplate="header">
                <h3>7-Week Performance Trend</h3>
              </ng-template>
              @if (performanceChartData()) {
                <p-chart
                  type="line"
                  [data]="performanceChartData()"
                  [options]="chartOptions"
                ></p-chart>
              }
            </p-card>
          </p-tabpanel>

          <p-tabpanel header="Injury Risk">
            <p-card>
              <ng-template pTemplate="header">
                <h3>Injury Risk Analysis</h3>
              </ng-template>
              <div class="risk-analysis">
                <p>
                  Based on your training load and wellness data, your current
                  injury risk is:
                </p>
                <div class="risk-score">
                  <span class="score-value">{{ injuryRisk() }}%</span>
                  <span class="score-label">Low Risk</span>
                </div>
              </div>
            </p-card>
          </p-tabpanel>

          <p-tabpanel header="Predictions">
            <p-card>
              <ng-template pTemplate="header">
                <h3>Performance Predictions</h3>
              </ng-template>
              <div class="predictions">
                <p>AI-powered predictions coming soon...</p>
              </div>
            </p-card>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .enhanced-analytics-page {
        padding: var(--space-6);
      }

      .risk-analysis {
        text-align: center;
        padding: var(--space-6);
      }

      .risk-score {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: var(--space-4);
      }

      .score-value {
        font-size: 3rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .score-label {
        font-size: 1.25rem;
        color: var(--text-secondary);
        margin-top: var(--space-2);
      }

      .predictions {
        padding: var(--space-6);
        text-align: center;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class EnhancedAnalyticsComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  performanceChartData = signal<any>(null);
  injuryRisk = signal(15);
  isLoading = signal(false);

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  ngOnInit(): void {
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.isLoading.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.logger.warn("No user found for analytics");
        this.setDefaultChartData();
        return;
      }

      // Load training sessions for the last 7 weeks
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 49); // 7 weeks

      const { data: sessions, error } = await this.supabaseService.client
        .from("training_sessions")
        .select("scheduled_date, status, duration_minutes, intensity")
        .eq("user_id", user.id)
        .gte("scheduled_date", startDate.toISOString())
        .order("scheduled_date", { ascending: true });

      if (error) {
        this.logger.warn("Error loading sessions:", error);
        this.setDefaultChartData();
        return;
      }

      if (sessions && sessions.length > 0) {
        // Group by week and calculate performance scores
        const weeklyData = this.calculateWeeklyPerformance(sessions);
        this.performanceChartData.set(weeklyData);

        // Calculate injury risk based on recent data
        this.calculateInjuryRisk(sessions);
      } else {
        this.setDefaultChartData();
      }
    } catch (error) {
      this.logger.error("Error loading analytics:", error);
      this.setDefaultChartData();
    } finally {
      this.isLoading.set(false);
    }
  }

  private calculateWeeklyPerformance(sessions: any[]): any {
    const weeks: Map<number, { completed: number; total: number; duration: number }> = new Map();

    sessions.forEach((session) => {
      const date = new Date(session.scheduled_date);
      const weekNum = this.getWeekNumber(date);

      if (!weeks.has(weekNum)) {
        weeks.set(weekNum, { completed: 0, total: 0, duration: 0 });
      }

      const week = weeks.get(weekNum)!;
      week.total++;
      if (session.status === "completed") {
        week.completed++;
        week.duration += session.duration_minutes || 0;
      }
    });

    const labels: string[] = [];
    const data: number[] = [];

    // Get last 7 weeks
    const sortedWeeks = Array.from(weeks.entries()).sort((a, b) => a[0] - b[0]).slice(-7);

    sortedWeeks.forEach(([weekNum, stats], index) => {
      labels.push(`Week ${index + 1}`);
      // Performance score: completion rate * intensity factor
      const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      data.push(Math.round(completionRate));
    });

    // Fill in missing weeks with 0
    while (labels.length < 7) {
      labels.unshift(`Week ${7 - labels.length}`);
      data.unshift(0);
    }

    return {
      labels,
      datasets: [
        {
          label: "Performance Score",
          data,
          borderColor: "#089949",
          backgroundColor: "rgba(8, 153, 73, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  private calculateInjuryRisk(sessions: any[]): void {
    // Simple injury risk calculation based on training intensity and frequency
    const recentSessions = sessions.filter((s) => {
      const date = new Date(s.scheduled_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });

    const highIntensityCount = recentSessions.filter(
      (s) => s.intensity === "high" || s.intensity === "very_high"
    ).length;

    // Risk increases with high intensity sessions
    let risk = 10 + highIntensityCount * 5;

    // Risk increases if many sessions in a week
    if (recentSessions.length > 6) {
      risk += 15;
    }

    this.injuryRisk.set(Math.min(risk, 100));
  }

  private setDefaultChartData(): void {
    this.performanceChartData.set({
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
      datasets: [
        {
          label: "Performance Score",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: "#089949",
          backgroundColor: "rgba(8, 153, 73, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }

  exportReport(): void {
    this.toastService.info("Generating report...");

    // Create a simple CSV export
    const chartData = this.performanceChartData();
    if (!chartData) {
      this.toastService.error("No data to export");
      return;
    }

    const csvContent = [
      "Week,Performance Score",
      ...chartData.labels.map((label: string, i: number) =>
        `${label},${chartData.datasets[0].data[i]}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.toastService.success("Report exported successfully!");
  }
}
