import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { DatePicker } from "primeng/datepicker";
import { InputNumberModule } from "primeng/inputnumber";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { WellnessService } from "../../core/services/wellness.service";

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
    DatePicker,
    InputNumberModule,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent
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
    
        <!-- Wellness Charts -->
        <div class="charts-grid">
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
        </div>
    
        <!-- Daily Check-in -->
        <p-card class="checkin-card">
          <ng-template pTemplate="header">
            <h3>Daily Wellness Check-in</h3>
          </ng-template>
          <div class="checkin-form">
            <div class="checkin-item">
              <label>Sleep Hours</label>
              <p-inputNumber
                [(ngModel)]="checkInData.sleepHours"
                [min]="0"
                [max]="24"
                [showButtons]="true"
                placeholder="Hours"
              ></p-inputNumber>
            </div>
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
              <label>Mood (1-10)</label>
              <p-inputNumber
                [(ngModel)]="checkInData.mood"
                [min]="1"
                [max]="10"
                [showButtons]="true"
                placeholder="Mood"
              ></p-inputNumber>
            </div>
            <p-button
              label="Submit Check-in"
              icon="pi pi-check"
              (onClick)="submitCheckIn()"
            ></p-button>
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

      .checkin-card {
        max-width: 600px;
        margin: 0 auto;
      }

      .checkin-form {
        display: flex;
        flex-direction: column;
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
      }

      @media (max-width: 768px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WellnessComponent implements OnInit {
  private wellnessService = inject(WellnessService);

  metrics = signal<WellnessMetric[]>([]);
  wellnessStats = signal<any[]>([]);
  sleepChartData = signal<any>(null);
  recoveryChartData = signal<any>(null);
  checkInData = {
    sleepHours: 0,
    energyLevel: 5,
    mood: 5,
  };

  chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    this.loadWellnessData();
  }

  loadWellnessData(): void {
    // Fetch wellness data from service
    this.wellnessService.getWellnessData('7d').subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const latestData = response.data[0];
          const overallScore = this.wellnessService.getWellnessScore(latestData);
          const status = this.wellnessService.getWellnessStatus(overallScore);

          // Update stats with real data
          this.wellnessStats.set([
            {
              label: "Sleep Quality",
              value: latestData.sleep ? `${latestData.sleep}h` : "N/A",
              icon: "pi-moon",
              color: "#3498db",
              trend: this.calculateTrend(response.data, 'sleep'),
              trendType: "positive",
            },
            {
              label: "Recovery Score",
              value: `${Math.round(overallScore * 10)}%`,
              icon: "pi-heart",
              color: status.color,
              trend: status.label,
              trendType: status.label.toLowerCase().includes('good') || status.label.toLowerCase().includes('excellent') ? "positive" : "neutral",
            },
            {
              label: "Energy Level",
              value: latestData.energy ? `${latestData.energy}/10` : "N/A",
              icon: "pi-bolt",
              color: "#f1c40f",
              trend: this.calculateTrend(response.data, 'energy'),
              trendType: "positive",
            },
            {
              label: "Stress Level",
              value: latestData.stress ? this.getStressLabel(latestData.stress) : "N/A",
              icon: "pi-shield",
              color: latestData.stress && latestData.stress <= 3 ? "#10c96b" : "#f1c40f",
              trend: latestData.stress && latestData.stress <= 3 ? "Low" : "Moderate",
              trendType: latestData.stress && latestData.stress <= 3 ? "positive" : "neutral",
            },
          ]);

          // Build chart data from last 7 days
          const sortedData = [...response.data].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          const labels = sortedData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          });

          this.sleepChartData.set({
            labels,
            datasets: [
              {
                label: "Sleep Hours",
                data: sortedData.map(d => d.sleep || 0),
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
                data: sortedData.map(d => Math.round(this.wellnessService.getWellnessScore(d) * 10)),
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
        console.error('Error loading wellness data:', err);
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

  private calculateTrend(data: any[], metric: string): string {
    if (data.length < 2) return 'N/A';
    const current = data[0][metric];
    const previous = data[1][metric];
    if (!current || !previous) return 'N/A';
    const diff = current - previous;
    if (diff > 0) return `+${diff.toFixed(1)} vs yesterday`;
    if (diff < 0) return `${diff.toFixed(1)} vs yesterday`;
    return 'No change';
  }

  private getStressLabel(stress: number): string {
    if (stress <= 3) return 'Low';
    if (stress <= 6) return 'Moderate';
    return 'High';
  }

  openCheckIn(): void {
    // Scroll to check-in form
    const element = document.querySelector(".checkin-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  submitCheckIn(): void {
    // Convert form data to wellness check-in format
    const wellnessData = {
      sleep: this.checkInData.sleepHours,
      energy: this.checkInData.energyLevel,
      mood: this.checkInData.mood,
      date: new Date().toISOString().split('T')[0],
    };

    this.wellnessService.logWellness(wellnessData).subscribe({
      next: (response) => {
        if (response.success) {
          // Reset form
          this.checkInData = { sleepHours: 0, energyLevel: 5, mood: 5 };
          // Reload wellness data to show updated stats
          this.loadWellnessData();
        }
      },
      error: (err) => {
        console.error('Error submitting wellness check-in:', err);
      },
    });
  }

  trackByMetricLabel(index: number, metric: WellnessMetric): string {
    return metric.label;
  }
}
