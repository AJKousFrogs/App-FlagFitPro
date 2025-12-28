import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { InputNumberModule } from "primeng/inputnumber";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { WellnessService } from "../../core/services/wellness.service";
import { LoggerService } from "../../core/services/logger.service";
import { ToastService } from "../../core/services/toast.service";

interface WellnessMetric {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: "app-wellness",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    ChartModule,
    InputNumberModule,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent,
  ],
  template: `
    <app-main-layout>
      <div class="wellness-page">
        <app-page-header
          title="Wellness & Recovery"
          subtitle="Track your health, recovery, and wellness metrics"
          icon="pi-heart"
        >
          <p-button
            label="Log Check-in"
            icon="pi pi-plus"
            (onClick)="openCheckIn()"
          ></p-button>
        </app-page-header>

        <!-- Wellness Metrics -->
        <app-stats-grid [stats]="wellnessStats()"></app-stats-grid>

        <!-- Wellness Charts - Lazy loaded for performance -->
        <div class="charts-grid">
          @defer (on viewport) {
            <p-card class="chart-card">
              <ng-template pTemplate="header">
                <h3>Sleep Quality</h3>
              </ng-template>
              @if (sleepChartData()) {
                <p-chart
                  type="line"
                  [data]="sleepChartData()"
                  [options]="chartOptions"
                ></p-chart>
              }
            </p-card>
          } @placeholder {
            <p-card class="chart-card chart-loading">
              <div class="loading-text">Loading sleep data...</div>
            </p-card>
          }

          @defer (on viewport) {
            <p-card class="chart-card">
              <ng-template pTemplate="header">
                <h3>Recovery Score</h3>
              </ng-template>
              @if (recoveryChartData()) {
                <p-chart
                  type="bar"
                  [data]="recoveryChartData()"
                  [options]="chartOptions"
                ></p-chart>
              }
            </p-card>
          } @placeholder {
            <p-card class="chart-card chart-loading">
              <div class="loading-text">Loading recovery data...</div>
            </p-card>
          }
        </div>

        <!-- Daily Check-in - Comprehensive for Olympic Athletes -->
        <p-card class="checkin-card">
          <ng-template pTemplate="header">
            <h3>Daily Wellness Check-in</h3>
          </ng-template>
          <div class="checkin-form">
            <!-- Sleep Section -->
            <div class="checkin-section">
              <h4 class="section-label"><i class="pi pi-moon"></i> Sleep & Recovery</h4>
              <div class="checkin-row">
                <div class="checkin-item">
                  <label>Sleep Hours</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.sleepHours"
                    [min]="0"
                    [max]="24"
                    [showButtons]="true"
                    [minFractionDigits]="1"
                    [maxFractionDigits]="1"
                    placeholder="Hours"
                  ></p-inputNumber>
                </div>
                <div class="checkin-item">
                  <label>Sleep Quality (1-10)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.sleepQuality"
                    [min]="1"
                    [max]="10"
                    [showButtons]="true"
                    placeholder="Quality"
                  ></p-inputNumber>
                </div>
              </div>
            </div>

            <!-- Physical Section -->
            <div class="checkin-section">
              <h4 class="section-label"><i class="pi pi-heart"></i> Physical State</h4>
              <div class="checkin-row">
                <div class="checkin-item">
                  <label>Energy Level (1-10)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.energyLevel"
                    [min]="1"
                    [max]="10"
                    [showButtons]="true"
                    placeholder="Level"
                  ></p-inputNumber>
                </div>
                <div class="checkin-item">
                  <label>Muscle Soreness (1-10)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.soreness"
                    [min]="1"
                    [max]="10"
                    [showButtons]="true"
                    placeholder="1=None, 10=Severe"
                  ></p-inputNumber>
                  <small class="help-text">1 = No soreness, 10 = Very sore</small>
                </div>
              </div>
              <div class="checkin-row">
                <div class="checkin-item">
                  <label>Hydration (glasses of water)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.hydration"
                    [min]="0"
                    [max]="20"
                    [showButtons]="true"
                    placeholder="Glasses (8oz)"
                  ></p-inputNumber>
                  <small class="help-text">Target: 8+ glasses daily</small>
                </div>
                <div class="checkin-item">
                  <label>Resting Heart Rate (BPM)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.restingHR"
                    [min]="40"
                    [max]="120"
                    [showButtons]="true"
                    placeholder="Optional"
                  ></p-inputNumber>
                  <small class="help-text">Elevated HR may indicate fatigue</small>
                </div>
              </div>
            </div>

            <!-- Mental Section -->
            <div class="checkin-section">
              <h4 class="section-label"><i class="pi pi-sparkles"></i> Mental State</h4>
              <div class="checkin-row">
                <div class="checkin-item">
                  <label>Mood (1-10)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.mood"
                    [min]="1"
                    [max]="10"
                    [showButtons]="true"
                    placeholder="Mood"
                  ></p-inputNumber>
                </div>
                <div class="checkin-item">
                  <label>Stress Level (1-10)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.stress"
                    [min]="1"
                    [max]="10"
                    [showButtons]="true"
                    placeholder="1=Relaxed, 10=Very stressed"
                  ></p-inputNumber>
                  <small class="help-text">1 = Very relaxed, 10 = Very stressed</small>
                </div>
              </div>
              <div class="checkin-row">
                <div class="checkin-item">
                  <label>Training Motivation (1-10)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.motivation"
                    [min]="1"
                    [max]="10"
                    [showButtons]="true"
                    placeholder="Motivation"
                  ></p-inputNumber>
                </div>
                <div class="checkin-item">
                  <label>Readiness to Train (1-10)</label>
                  <p-inputNumber
                    [(ngModel)]="checkInData.readiness"
                    [min]="1"
                    [max]="10"
                    [showButtons]="true"
                    placeholder="Readiness"
                  ></p-inputNumber>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div class="checkin-submit">
              <p-button
                label="Submit Check-in"
                icon="pi pi-check"
                [loading]="isSubmitting()"
                (onClick)="submitCheckIn()"
              ></p-button>
              <small class="submit-note">Daily check-ins help optimize your training load</small>
            </div>
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .wellness-page {
        padding: var(--space-6);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--space-6);
        margin-bottom: var(--space-6);
      }

      .chart-card {
        min-height: 300px;
      }

      .chart-loading {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loading-text {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .checkin-card {
        max-width: 800px;
        margin: 0 auto;
      }

      .checkin-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .checkin-section {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        border-left: 4px solid var(--color-brand-primary);
      }

      .section-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-brand-primary);
        margin: 0 0 var(--space-4) 0;
      }

      .checkin-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .checkin-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .checkin-item label {
        font-weight: 500;
        color: var(--text-primary);
        font-size: var(--font-body-sm);
      }

      .help-text {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        margin-top: var(--space-1);
      }

      .checkin-submit {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .submit-note {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }

        .checkin-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WellnessComponent implements OnInit {
  private wellnessService = inject(WellnessService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  isSubmitting = signal(false);

  metrics = signal<WellnessMetric[]>([]);
  wellnessStats = signal<any[]>([]);
  sleepChartData = signal<any>(null);
  recoveryChartData = signal<any>(null);
  checkInData = {
    sleepHours: 7,
    sleepQuality: 7,
    energyLevel: 7,
    soreness: 3,
    hydration: 8,
    restingHR: 0,
    mood: 7,
    stress: 3,
    motivation: 7,
    readiness: 7,
  };

  chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    this.loadWellnessData();
  }

  loadWellnessData(): void {
    // Fetch wellness data from service
    this.wellnessService.getWellnessData("7d")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const latestData = response.data[0];
          const overallScore =
            this.wellnessService.getWellnessScore(latestData);
          const status = this.wellnessService.getWellnessStatus(overallScore);

          // Update stats with real data
          this.wellnessStats.set([
            {
              label: "Sleep Quality",
              value: latestData.sleep ? `${latestData.sleep}h` : "N/A",
              icon: "pi-moon",
              color: "#3498db",
              trend: this.calculateTrend(response.data, "sleep"),
              trendType: "positive",
            },
            {
              label: "Recovery Score",
              value: `${Math.round(overallScore * 10)}%`,
              icon: "pi-heart",
              color: status.color,
              trend: status.status,
              trendType:
                status.status === "good" || status.status === "excellent"
                  ? "positive"
                  : "neutral",
            },
            {
              label: "Energy Level",
              value: latestData.energy ? `${latestData.energy}/10` : "N/A",
              icon: "pi-bolt",
              color: "#f1c40f",
              trend: this.calculateTrend(response.data, "energy"),
              trendType: "positive",
            },
            {
              label: "Stress Level",
              value: latestData.stress
                ? this.getStressLabel(latestData.stress)
                : "N/A",
              icon: "pi-shield",
              color:
                latestData.stress && latestData.stress <= 3
                  ? "#10c96b"
                  : "#f1c40f",
              trend:
                latestData.stress && latestData.stress <= 3
                  ? "Low"
                  : "Moderate",
              trendType:
                latestData.stress && latestData.stress <= 3
                  ? "positive"
                  : "neutral",
            },
          ]);

          // Build chart data from last 7 days
          const sortedData = [...response.data].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

          const labels = sortedData.map((d) => {
            const date = new Date(d.date);
            return date.toLocaleDateString("en-US", { weekday: "short" });
          });

          this.sleepChartData.set({
            labels,
            datasets: [
              {
                label: "Sleep Hours",
                data: sortedData.map((d) => d.sleep || 0),
                borderColor: "#3498db",
                backgroundColor: "rgba(52, 152, 219, 0.1)",
              },
            ],
          });

          this.recoveryChartData.set({
            labels,
            datasets: [
              {
                label: "Recovery Score",
                data: sortedData.map((d) =>
                  Math.round(this.wellnessService.getWellnessScore(d) * 10),
                ),
                backgroundColor: "var(--ds-primary-green)",
              },
            ],
          });
        } else {
          // Fallback to default data if no data available
          this.loadFallbackData();
        }
      },
      error: (err) => {
        this.logger.error("Error loading wellness data:", err);
        this.loadFallbackData();
      },
    });
  }

  private loadFallbackData(): void {
    this.wellnessStats.set([
      {
        label: "Sleep Quality",
        value: "No data",
        icon: "pi-moon",
        color: "#3498db",
        trend: "Log check-in",
        trendType: "neutral",
      },
      {
        label: "Recovery Score",
        value: "N/A",
        icon: "pi-heart",
        color: "var(--ds-primary-green)",
        trend: "Log check-in",
        trendType: "neutral",
      },
      {
        label: "Energy Level",
        value: "N/A",
        icon: "pi-bolt",
        color: "#f1c40f",
        trend: "Log check-in",
        trendType: "neutral",
      },
      {
        label: "Stress Level",
        value: "N/A",
        icon: "pi-shield",
        color: "#10c96b",
        trend: "Log check-in",
        trendType: "neutral",
      },
    ]);

    this.sleepChartData.set(null);
    this.recoveryChartData.set(null);
  }

  private calculateTrend(data: unknown[], metric: string): string {
    if (data.length < 2) return "N/A";
    const currentRecord = data[0] as Record<string, unknown>;
    const previousRecord = data[1] as Record<string, unknown>;
    const current = typeof currentRecord[metric] === 'number' ? currentRecord[metric] : null;
    const previous = typeof previousRecord[metric] === 'number' ? previousRecord[metric] : null;
    if (current === null || previous === null) return "N/A";
    const diff = current - previous;
    if (diff > 0) return `+${diff.toFixed(1)} vs yesterday`;
    if (diff < 0) return `${diff.toFixed(1)} vs yesterday`;
    return "No change";
  }

  private getStressLabel(stress: number): string {
    if (stress <= 3) return "Low";
    if (stress <= 6) return "Moderate";
    return "High";
  }

  openCheckIn(): void {
    // Scroll to check-in form
    const element = document.querySelector(".checkin-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  submitCheckIn(): void {
    // Validate input
    if (!this.checkInData.sleepHours || this.checkInData.sleepHours <= 0) {
      this.toastService.warn("Please enter your sleep hours");
      return;
    }

    this.isSubmitting.set(true);

    // Convert form data to comprehensive wellness check-in format
    const wellnessData = {
      sleep: this.checkInData.sleepHours,
      sleep_quality: this.checkInData.sleepQuality,
      energy: this.checkInData.energyLevel,
      soreness: this.checkInData.soreness,
      hydration: this.checkInData.hydration,
      resting_hr: this.checkInData.restingHR > 0 ? this.checkInData.restingHR : null,
      mood: this.checkInData.mood,
      stress: this.checkInData.stress,
      motivation: this.checkInData.motivation,
      readiness: this.checkInData.readiness,
      date: new Date().toISOString().split("T")[0],
    };

    this.wellnessService.logWellness(wellnessData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.toastService.success("Wellness check-in saved! 💪");
          // Reset form to defaults
          this.checkInData = {
            sleepHours: 7,
            sleepQuality: 7,
            energyLevel: 7,
            soreness: 3,
            hydration: 8,
            restingHR: 0,
            mood: 7,
            stress: 3,
            motivation: 7,
            readiness: 7,
          };
          // Reload wellness data to show updated stats
          this.loadWellnessData();
        } else {
          this.toastService.error(response.error || "Failed to save check-in");
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.logger.error("Error submitting wellness check-in:", err);
        this.toastService.error("Failed to save wellness check-in");
      },
    });
  }

  trackByMetricLabel(index: number, metric: WellnessMetric): string {
    return metric.label;
  }
}
