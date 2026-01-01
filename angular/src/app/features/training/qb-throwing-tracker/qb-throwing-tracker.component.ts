import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CommonModule, DatePipe } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { Select } from "primeng/select";
import { TextareaModule } from "primeng/textarea";
import { SkeletonModule } from "primeng/skeleton";
import { ToastModule } from "primeng/toast";
import { ChartModule } from "primeng/chart";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";

interface ThrowingSession {
  id: string;
  date: string;
  total_throws: number;
  completions: number;
  completion_rate: number;
  throw_type: string;
  notes?: string;
}

@Component({
  selector: "app-qb-throwing-tracker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    Select,
    TextareaModule,
    SkeletonModule,
    ToastModule,
    ChartModule,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="qb-throwing-tracker-page">
        <app-page-header
          title="QB Throwing Tracker"
          subtitle="Track your throwing volume, accuracy, and progression"
          icon="pi-chart-bar"
        ></app-page-header>

        <div class="tracker-grid">
          <!-- Log Session Card -->
          <p-card class="tracker-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3><i class="pi pi-plus-circle"></i> Log Throwing Session</h3>
              </div>
            </ng-template>
            <form class="tracker-form" (ngSubmit)="saveSession()">
              <div class="form-group">
                <label>Throw Type</label>
                <p-select
                  [(ngModel)]="sessionData.throwType"
                  name="throwType"
                  [options]="throwTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select throw type"
                  styleClass="w-full"
                ></p-select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Total Throws</label>
                  <p-inputNumber
                    [(ngModel)]="sessionData.totalThrows"
                    name="totalThrows"
                    [min]="0"
                    [max]="500"
                    placeholder="0"
                    styleClass="w-full"
                  ></p-inputNumber>
                </div>
                <div class="form-group">
                  <label>Completions</label>
                  <p-inputNumber
                    [(ngModel)]="sessionData.completions"
                    name="completions"
                    [min]="0"
                    [max]="sessionData.totalThrows || 500"
                    placeholder="0"
                    styleClass="w-full"
                  ></p-inputNumber>
                </div>
              </div>

              <div class="completion-preview">
                <span class="completion-rate">
                  {{ calculatedCompletionRate() }}%
                </span>
                <span class="completion-label">Completion Rate</span>
              </div>

              <div class="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  pTextarea
                  [(ngModel)]="sessionData.notes"
                  name="notes"
                  rows="3"
                  placeholder="How did the session feel? Any focus areas?"
                  class="w-full"
                ></textarea>
              </div>

              <p-button
                type="submit"
                label="Save Session"
                icon="pi pi-save"
                [loading]="isSaving()"
                [disabled]="!canSave()"
                styleClass="w-full"
              ></p-button>
            </form>
          </p-card>

          <!-- Weekly Stats Card -->
          <p-card class="stats-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3><i class="pi pi-chart-line"></i> Weekly Stats</h3>
              </div>
            </ng-template>

            @if (isLoading()) {
              <div class="stats-grid">
                @for (i of [1, 2, 3, 4]; track i) {
                  <div class="stat-item">
                    <p-skeleton width="60px" height="40px"></p-skeleton>
                    <p-skeleton
                      width="100px"
                      height="16px"
                      class="mt-2"
                    ></p-skeleton>
                  </div>
                }
              </div>
            } @else {
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ weeklyStats().totalThrows }}</div>
                  <div class="stat-label">Total Throws</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value highlight">
                    {{ weeklyStats().avgCompletion }}%
                  </div>
                  <div class="stat-label">Avg Completion</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">
                    {{ weeklyStats().sessionsCount }}
                  </div>
                  <div class="stat-label">Sessions</div>
                </div>
                <div class="stat-item">
                  <div
                    class="stat-value"
                    [class.positive]="weeklyStats().trend > 0"
                    [class.negative]="weeklyStats().trend < 0"
                  >
                    {{ weeklyStats().trend > 0 ? "+" : ""
                    }}{{ weeklyStats().trend }}%
                  </div>
                  <div class="stat-label">vs Last Week</div>
                </div>
              </div>
            }
          </p-card>
        </div>

        <!-- Progress Chart -->
        <p-card class="chart-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3><i class="pi pi-chart-bar"></i> Throwing Progress</h3>
            </div>
          </ng-template>
          @if (chartData()) {
            <p-chart
              type="line"
              [data]="chartData()"
              [options]="chartOptions"
            ></p-chart>
          } @else {
            <div class="empty-chart">
              <i class="pi pi-chart-line"></i>
              <p>Log more sessions to see your progress chart</p>
            </div>
          }
        </p-card>

        <!-- Recent Sessions -->
        <p-card class="sessions-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3><i class="pi pi-history"></i> Recent Sessions</h3>
            </div>
          </ng-template>

          @if (isLoading()) {
            @for (i of [1, 2, 3]; track i) {
              <div class="session-item">
                <p-skeleton width="100px" height="16px"></p-skeleton>
                <p-skeleton width="150px" height="14px"></p-skeleton>
                <p-skeleton width="80px" height="24px"></p-skeleton>
              </div>
            }
          } @else if (recentSessions().length === 0) {
            <div class="empty-sessions">
              <i class="pi pi-inbox"></i>
              <p>No sessions logged yet. Start tracking your throws!</p>
            </div>
          } @else {
            <div class="sessions-list">
              @for (session of recentSessions(); track session.id) {
                <div class="session-item">
                  <div class="session-date">
                    {{ session.date | date: "MMM d, yyyy" }}
                  </div>
                  <div class="session-details">
                    <span class="throw-type">{{ session.throw_type }}</span>
                    <span class="throws"
                      >{{ session.total_throws }} throws</span
                    >
                  </div>
                  <div
                    class="session-rate"
                    [class.good]="session.completion_rate >= 70"
                    [class.average]="
                      session.completion_rate >= 50 &&
                      session.completion_rate < 70
                    "
                    [class.needs-work]="session.completion_rate < 50"
                  >
                    {{ session.completion_rate }}%
                  </div>
                </div>
              }
            </div>
          }
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .qb-throwing-tracker-page {
        padding: var(--space-6);
      }

      .tracker-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
        margin-top: var(--space-4);
      }

      @media (max-width: 1024px) {
        .tracker-grid {
          grid-template-columns: 1fr;
        }
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .card-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .tracker-card,
      .stats-card,
      .chart-card,
      .sessions-card {
        margin-top: var(--space-4);
      }

      .form-group {
        margin-bottom: var(--space-4);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: 500;
        color: var(--text-primary);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .completion-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-4);
        margin-bottom: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .completion-rate {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .completion-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
      }

      .stat-item {
        text-align: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-value.highlight {
        color: var(--color-brand-primary);
      }

      .stat-value.positive {
        color: var(--p-green-500);
      }

      .stat-value.negative {
        color: var(--p-red-500);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: var(--space-2);
      }

      .chart-card {
        margin-top: var(--space-6);
      }

      .empty-chart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        color: var(--text-secondary);
        text-align: center;
      }

      .empty-chart i {
        font-size: 3rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .sessions-card {
        margin-top: var(--space-6);
      }

      .sessions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .session-date {
        font-weight: 500;
        color: var(--text-primary);
      }

      .session-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        flex: 1;
        margin: 0 var(--space-4);
      }

      .throw-type {
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .throws {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .session-rate {
        font-weight: 700;
        font-size: 1.125rem;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--p-border-radius);
      }

      .session-rate.good {
        background: var(--p-green-100);
        color: var(--p-green-700);
      }

      .session-rate.average {
        background: var(--p-yellow-100);
        color: var(--p-yellow-700);
      }

      .session-rate.needs-work {
        background: var(--p-red-100);
        color: var(--p-red-700);
      }

      .empty-sessions {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-8);
        color: var(--text-secondary);
        text-align: center;
      }

      .empty-sessions i {
        font-size: 2.5rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }
    `,
  ],
})
export class QbThrowingTrackerComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  throwTypes = [
    { label: "Short Passes (0-10 yds)", value: "short" },
    { label: "Medium Passes (10-20 yds)", value: "medium" },
    { label: "Deep Passes (20+ yds)", value: "deep" },
    { label: "Quick Releases", value: "quick" },
    { label: "Play Action", value: "play_action" },
    { label: "Rollout", value: "rollout" },
    { label: "Mixed/Practice", value: "mixed" },
  ];

  sessionData = {
    throwType: "mixed",
    totalThrows: 0,
    completions: 0,
    notes: "",
  };

  isLoading = signal(false);
  isSaving = signal(false);
  recentSessions = signal<ThrowingSession[]>([]);
  weeklyStats = signal({
    totalThrows: 0,
    avgCompletion: 0,
    sessionsCount: 0,
    trend: 0,
  });
  chartData = signal<any>(null);

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Completion Rate (%)",
        },
      },
    },
  };

  calculatedCompletionRate = computed(() => {
    if (this.sessionData.totalThrows === 0) return 0;
    return Math.round(
      (this.sessionData.completions / this.sessionData.totalThrows) * 100,
    );
  });

  canSave = computed(() => {
    return (
      this.sessionData.totalThrows > 0 &&
      this.sessionData.completions <= this.sessionData.totalThrows
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.logger.warn("No user found");
        return;
      }

      // Load recent sessions
      const { data: sessions, error: sessionsError } =
        await this.supabaseService.client
          .from("qb_throwing_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(10);

      if (sessionsError) {
        this.logger.warn("Error loading sessions:", sessionsError);
      } else {
        this.recentSessions.set(sessions || []);
        this.calculateWeeklyStats(sessions || []);
        this.buildChartData(sessions || []);
      }
    } catch (error) {
      this.logger.error("Error loading QB throwing data:", error);
      this.toastService.error("Failed to load throwing data");
    } finally {
      this.isLoading.set(false);
    }
  }

  private calculateWeeklyStats(sessions: ThrowingSession[]): void {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = sessions.filter(
      (s) => new Date(s.date) >= weekAgo,
    );
    const lastWeekSessions = sessions.filter(
      (s) => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < weekAgo,
    );

    const thisWeekTotal = thisWeekSessions.reduce(
      (sum, s) => sum + s.total_throws,
      0,
    );
    const thisWeekAvg =
      thisWeekSessions.length > 0
        ? Math.round(
            thisWeekSessions.reduce((sum, s) => sum + s.completion_rate, 0) /
              thisWeekSessions.length,
          )
        : 0;

    const lastWeekAvg =
      lastWeekSessions.length > 0
        ? Math.round(
            lastWeekSessions.reduce((sum, s) => sum + s.completion_rate, 0) /
              lastWeekSessions.length,
          )
        : 0;

    const trend = lastWeekAvg > 0 ? thisWeekAvg - lastWeekAvg : 0;

    this.weeklyStats.set({
      totalThrows: thisWeekTotal,
      avgCompletion: thisWeekAvg,
      sessionsCount: thisWeekSessions.length,
      trend,
    });
  }

  private buildChartData(sessions: ThrowingSession[]): void {
    if (sessions.length < 2) {
      this.chartData.set(null);
      return;
    }

    const last7Sessions = sessions.slice(0, 7).reverse();

    this.chartData.set({
      labels: last7Sessions.map((s) =>
        new Date(s.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      ),
      datasets: [
        {
          label: "Completion Rate",
          data: last7Sessions.map((s) => s.completion_rate),
          fill: false,
          borderColor: "#10b981",
          backgroundColor: "#10b981",
          tension: 0.4,
        },
        {
          label: "Throws",
          data: last7Sessions.map((s) => s.total_throws),
          fill: false,
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f6",
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    });

    // Update chart options for dual axis
    this.chartOptions = {
      ...this.chartOptions,
      scales: {
        ...this.chartOptions.scales,
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Total Throws",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      } as any,
    };
  }

  async saveSession(): Promise<void> {
    if (!this.canSave()) return;

    this.isSaving.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.toastService.error("You must be logged in to save sessions");
        return;
      }

      const completionRate = this.calculatedCompletionRate();

      const { error } = await this.supabaseService.client
        .from("qb_throwing_sessions")
        .insert({
          user_id: user.id,
          date: new Date().toISOString().split("T")[0],
          total_throws: this.sessionData.totalThrows,
          completions: this.sessionData.completions,
          completion_rate: completionRate,
          throw_type: this.sessionData.throwType,
          notes: this.sessionData.notes || null,
        });

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success("Session saved successfully!");

      // Reset form
      this.sessionData = {
        throwType: "mixed",
        totalThrows: 0,
        completions: 0,
        notes: "",
      };

      // Reload data
      await this.loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save session";
      this.toastService.error(message);
      this.logger.error("Error saving session:", error);
    } finally {
      this.isSaving.set(false);
    }
  }
}
