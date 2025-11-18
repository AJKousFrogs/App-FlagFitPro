import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { CalendarModule } from "primeng/calendar";
import { InputNumberModule } from "primeng/inputnumber";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

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
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ChartModule,
    CalendarModule,
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

        <!-- Wellness Charts -->
        <div class="charts-grid">
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <h3>Sleep Quality</h3>
            </ng-template>
            <p-chart
              *ngIf="sleepChartData()"
              type="line"
              [data]="sleepChartData()"
              [options]="chartOptions"
            ></p-chart>
          </p-card>

          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <h3>Recovery Score</h3>
            </ng-template>
            <p-chart
              *ngIf="recoveryChartData()"
              type="bar"
              [data]="recoveryChartData()"
              [options]="chartOptions"
            ></p-chart>
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
  private apiService = inject(ApiService);

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
    // Load stats for StatsGridComponent
    this.wellnessStats.set([
      {
        label: "Sleep Quality",
        value: "8.2h",
        icon: "pi-moon",
        color: "#3498db",
        trend: "+0.5h vs avg",
        trendType: "positive",
      },
      {
        label: "Recovery Score",
        value: "85%",
        icon: "pi-heart",
        color: "#089949",
        trend: "+5% today",
        trendType: "positive",
      },
      {
        label: "Energy Level",
        value: "7.5",
        icon: "pi-bolt",
        color: "#f1c40f",
        trend: "Good",
        trendType: "positive",
      },
      {
        label: "Stress Level",
        value: "Low",
        icon: "pi-shield",
        color: "#10c96b",
        trend: "Optimal",
        trendType: "positive",
      },
    ]);

    // Load charts
    this.sleepChartData.set({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Sleep Hours",
          data: [7.5, 8.0, 7.8, 8.2, 8.5, 9.0, 8.5],
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
        },
      ],
    });

    this.recoveryChartData.set({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Recovery Score",
          data: [80, 82, 85, 83, 87, 85, 88],
          backgroundColor: "#089949",
        },
      ],
    });
  }

  openCheckIn(): void {
    // Scroll to check-in form
    const element = document.querySelector(".checkin-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  submitCheckIn(): void {
    this.apiService
      .post(API_ENDPOINTS.wellness.checkin, this.checkInData)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          // Reset form
          this.checkInData = { sleepHours: 0, energyLevel: 5, mood: 5 };
        },
        error: () => {
          // Error handled by error interceptor
        },
      });
  }

  trackByMetricLabel(index: number, metric: WellnessMetric): string {
    return metric.label;
  }
}
