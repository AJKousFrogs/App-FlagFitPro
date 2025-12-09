import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { KnobModule } from 'primeng/knob';
import { ProgressBarModule } from 'primeng/progressbar';
import { interval, takeUntil, Subject } from 'rxjs';
import { ApiService, API_ENDPOINTS } from '../../../core/services/api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface PerformanceMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  target: number;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    TagModule,
    KnobModule,
    ProgressBarModule,
  ],
  template: `
    <div class="performance-dashboard">
      <div class="metrics-grid">
        @for (metric of metrics(); track trackByMetricId($index, metric)) {
          <p-card
            class="metric-card"
            [ngClass]="'metric-' + metric.id"
            >
            <div class="metric-header">
              <div class="metric-info">
                <i [class]="metric.icon" [style.color]="metric.color"></i>
                <h4>{{ metric.label }}</h4>
              </div>
              <p-tag
                [value]="formatTrend(metric.trend, metric.trendValue)"
                [severity]="getTrendSeverity(metric.trend)"
                [icon]="getTrendIcon(metric.trend)"
                >
              </p-tag>
            </div>
            <div class="metric-visualization">
              <div class="metric-value-container">
                <p-knob
                  [(ngModel)]="metric.value"
                  [min]="0"
                  [max]="metric.target * 1.2"
                  [size]="120"
                  [strokeWidth]="8"
                  [valueColor]="metric.color"
                  [rangeColor]="'#e5e7eb'"
                  [readonly]="true"
                  [showValue]="false"
                  >
                </p-knob>
                <div class="metric-overlay">
                  <span class="metric-value">{{ metric.value }}</span>
                  <span class="metric-unit">{{ metric.unit }}</span>
                </div>
              </div>
              <div class="metric-progress">
                <label>Progress to Goal</label>
                <p-progressBar
                  [value]="(metric.value / metric.target) * 100"
                  [showValue]="false"
                  [style]="{'--p-progressbar-value-bg': metric.color}"
                  >
                </p-progressBar>
                <span class="progress-text">
                  {{ metric.value }} / {{ metric.target }} {{ metric.unit }}
                </span>
              </div>
            </div>
            <!-- Real-time mini chart -->
            <div class="metric-chart">
              <p-chart
                type="line"
                [data]="getMetricChartData(metric.id)"
                [options]="miniChartOptions"
                [width]="'100%'"
                [height]="'60px'"
                >
              </p-chart>
            </div>
          </p-card>
        }
      </div>
    
      <!-- Performance Summary Chart -->
      <p-card header="Performance Overview" class="performance-summary">
        <p-chart
          type="radar"
          [data]="radarChartData()"
          [options]="radarChartOptions"
          >
        </p-chart>
      </p-card>
    </div>
    `,
  styles: [
    `
      .performance-dashboard {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }

      .metric-card {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        border: 1px solid var(--p-surface-border);
      }

      .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .metric-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .metric-info i {
        font-size: 1.5rem;
      }

      .metric-info h4 {
        margin: 0;
        font-weight: 600;
        color: var(--p-text-color);
      }

      .metric-visualization {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .metric-value-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .metric-overlay {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--p-text-color);
      }

      .metric-unit {
        font-size: 0.75rem;
        color: var(--p-text-color-secondary);
        text-transform: uppercase;
      }

      .metric-progress {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .metric-progress label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--p-text-color-secondary);
      }

      .progress-text {
        font-size: 0.75rem;
        color: var(--p-text-color-secondary);
        text-align: center;
      }

      .metric-chart {
        width: 100%;
        height: 60px;
        margin-top: 1rem;
        opacity: 0.7;
      }

      .performance-summary {
        grid-column: 1 / -1;
      }

      /* Animation for real-time updates */
      .metric-card.updating {
        animation: pulse 0.6s ease-in-out;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
        100% {
          transform: scale(1);
        }
      }

      @media (max-width: 768px) {
        .metrics-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  @Input() athleteId?: string;
  @Input() realTimeEnabled = true;

  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  metrics = signal<PerformanceMetric[]>([
    {
      id: 'speed',
      label: 'Top Speed',
      value: 18.5,
      unit: 'mph',
      trend: 'up',
      trendValue: 2.1,
      target: 20,
      color: '#10c96b',
      icon: 'pi pi-bolt',
    },
    {
      id: 'accuracy',
      label: 'Pass Accuracy',
      value: 87.3,
      unit: '%',
      trend: 'up',
      trendValue: 5.2,
      target: 90,
      color: '#f1c40f',
      icon: 'pi pi-target',
    },
    {
      id: 'endurance',
      label: 'Endurance',
      value: 75,
      unit: 'min',
      trend: 'stable',
      trendValue: 0,
      target: 80,
      color: '#ef4444',
      icon: 'pi pi-heart',
    },
  ]);

  radarChartData = computed(() => ({
    labels: ['Speed', 'Accuracy', 'Endurance', 'Agility', 'Strength', 'Focus'],
    datasets: [
      {
        label: 'Current',
        data: [
          this.metrics().find((m) => m.id === 'speed')?.value || 85,
          this.metrics().find((m) => m.id === 'accuracy')?.value || 87,
          this.metrics().find((m) => m.id === 'endurance')?.value || 75,
          90,
          78,
          82,
        ],
        backgroundColor: 'rgba(16, 201, 107, 0.2)',
        borderColor: '#10c96b',
        pointBackgroundColor: '#10c96b',
      },
      {
        label: 'Target',
        data: [90, 90, 85, 95, 85, 90],
        backgroundColor: 'rgba(241, 196, 15, 0.2)',
        borderColor: '#f1c40f',
        pointBackgroundColor: '#f1c40f',
      },
    ],
  }));

  radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20 },
      },
    },
    plugins: {
      legend: { position: 'top' as const },
    },
  };

  miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      legend: { display: false },
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.4 },
    },
  };

  ngOnInit() {
    this.loadPerformanceMetrics();
    
    if (this.realTimeEnabled) {
      this.startRealTimeUpdates();
    }
  }

  private loadPerformanceMetrics() {
    if (!this.athleteId) {
      return;
    }

    // Try to load from API
    this.apiService
      .get('/api/performance/metrics', { athleteId: this.athleteId })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.updateMetricsFromApi(response.data);
          }
        },
        error: () => {
          // Use default mock metrics if API fails
          console.debug('Performance API not available, using default metrics');
        },
      });
  }

  private updateMetricsFromApi(data: any) {
    if (data.metrics && Array.isArray(data.metrics)) {
      this.metrics.set(
        data.metrics.map((m: any) => ({
          id: m.id || m.metricId,
          label: m.label || m.name,
          value: m.value || m.currentValue,
          unit: m.unit || '%',
          trend: m.trend || 'stable',
          trendValue: m.trendValue || 0,
          target: m.target || m.goal || 100,
          color: m.color || '#10c96b',
          icon: m.icon || 'pi pi-chart-line',
        }))
      );
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startRealTimeUpdates() {
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateMetrics();
      });
  }

  private updateMetrics() {
    this.metrics.update((current) =>
      current.map((metric) => ({
        ...metric,
        value: this.simulateRealTimeValue(metric),
      }))
    );
  }

  private simulateRealTimeValue(metric: PerformanceMetric): number {
    const variance = metric.value * 0.05; // 5% variance
    const change = (Math.random() - 0.5) * variance;
    return Math.max(
      0,
      Math.min(metric.target * 1.2, metric.value + change)
    );
  }

  formatTrend(trend: string, value: number): string {
    if (trend === 'stable') return 'Stable';
    const sign = trend === 'up' ? '+' : '-';
    return `${sign}${value.toFixed(1)}%`;
  }

  getTrendSeverity(trend: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'danger';
      default:
        return 'info';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return 'pi pi-arrow-up';
      case 'down':
        return 'pi pi-arrow-down';
      default:
        return 'pi pi-minus';
    }
  }

  getMetricChartData(metricId: string) {
    // Generate sample time series data
    const metric = this.metrics().find((m) => m.id === metricId);
    const baseValue = metric?.value || 50;
    const data = Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: baseValue + (Math.random() - 0.5) * 10,
    }));

    return {
      datasets: [
        {
          data,
          borderColor: metric?.color || '#10c96b',
          fill: false,
          tension: 0.4,
        },
      ],
    };
  }

  trackByMetricId(index: number, metric: PerformanceMetric): string {
    return metric.id;
  }
}

