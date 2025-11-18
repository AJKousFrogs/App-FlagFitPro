import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatsGridComponent } from '../../shared/components/stats-grid/stats-grid.component';
import { DEFAULT_CHART_OPTIONS } from '../../shared/config/chart.config';
import { ApiService, API_ENDPOINTS } from '../../core/services/api.service';

interface PerformanceMetric {
  name: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-performance-tracking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    CalendarModule,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent
  ],
  template: `
    <app-main-layout>
      <div class="performance-page">
        <app-page-header title="Performance Tracking" subtitle="Track and analyze your performance metrics over time" icon="pi-bullseye">
          <p-button label="Log Performance" icon="pi pi-plus" (onClick)="openLogDialog()"></p-button>
        </app-page-header>

        <!-- Performance Metrics -->
        <app-stats-grid [stats]="performanceStats()"></app-stats-grid>

        <!-- Performance Charts -->
        <div class="charts-grid">
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <h3>Performance Over Time</h3>
            </ng-template>
            <p-chart *ngIf="performanceChartData()" type="line" [data]="performanceChartData()" 
                    [options]="chartOptions"></p-chart>
          </p-card>

          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <h3>Speed Metrics</h3>
            </ng-template>
            <p-chart *ngIf="speedChartData()" type="bar" [data]="speedChartData()" 
                    [options]="chartOptions"></p-chart>
          </p-card>
        </div>

        <!-- Performance History Table -->
        <p-card class="table-card">
          <ng-template pTemplate="header">
            <h3>Performance History</h3>
          </ng-template>
          <p-table [value]="performanceHistory()" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Date</th>
                <th>40-Yard Dash</th>
                <th>Vertical Jump</th>
                <th>Broad Jump</th>
                <th>Bench Press</th>
                <th>Overall Score</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-record>
              <tr>
                <td>{{ record.date }}</td>
                <td>{{ record.dash40 }}</td>
                <td>{{ record.vertical }}</td>
                <td>{{ record.broad }}</td>
                <td>{{ record.bench }}</td>
                <td>
                  <p-tag [value]="record.score + '%'" 
                        [severity]="getScoreSeverity(record.score)">
                  </p-tag>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .performance-page {
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

    .table-card {
      margin-bottom: var(--space-6);
    }

    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PerformanceTrackingComponent implements OnInit {
  private apiService = inject(ApiService);

  metrics = signal<PerformanceMetric[]>([]);
  performanceStats = signal<any[]>([]);
  performanceChartData = signal<any>(null);
  speedChartData = signal<any>(null);
  performanceHistory = signal<any[]>([]);

  chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    this.loadPerformanceData();
  }

  loadPerformanceData(): void {
    // Load stats for StatsGridComponent
    this.performanceStats.set([
      {
        label: '40-Yard Dash',
        value: '4.45s',
        icon: 'pi-bolt',
        color: '#089949',
        trend: '+0.05s',
        trendType: 'positive'
      },
      {
        label: 'Vertical Jump',
        value: '38"',
        icon: 'pi-arrow-up',
        color: '#10c96b',
        trend: '+2"',
        trendType: 'positive'
      },
      {
        label: 'Broad Jump',
        value: '10\'2"',
        icon: 'pi-arrow-right',
        color: '#f1c40f',
        trend: '+6"',
        trendType: 'positive'
      },
      {
        label: 'Bench Press',
        value: '225 lbs',
        icon: 'pi-weight',
        color: '#e74c3c',
        trend: '+10 lbs',
        trendType: 'positive'
      }
    ]);

    // Load performance chart
    this.performanceChartData.set({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Overall Performance',
        data: [82, 84, 85, 87, 86, 88],
        borderColor: '#089949',
        backgroundColor: 'rgba(8, 153, 73, 0.1)'
      }]
    });

    // Load speed chart
    this.speedChartData.set({
      labels: ['40-Yard', '100-Yard', 'Shuttle'],
      datasets: [{
        label: 'Speed (seconds)',
        data: [4.45, 11.2, 4.8],
        backgroundColor: '#10c96b'
      }]
    });

    // Load history
    this.performanceHistory.set([
      {
        date: '2024-01-15',
        dash40: '4.50s',
        vertical: '36"',
        broad: '9\'8"',
        bench: '215 lbs',
        score: 85
      },
      {
        date: '2024-02-15',
        dash40: '4.48s',
        vertical: '37"',
        broad: '9\'10"',
        bench: '220 lbs',
        score: 86
      },
      {
        date: '2024-03-15',
        dash40: '4.45s',
        vertical: '38"',
        broad: '10\'2"',
        bench: '225 lbs',
        score: 88
      }
    ]);
  }

  openLogDialog(): void {
    // Open log performance dialog - implementation pending
  }

  getTrendSeverity(trendType: string): string {
    const severities: Record<string, string> = {
      'up': 'success',
      'down': 'danger',
      'neutral': 'info'
    };
    return severities[trendType] || 'info';
  }

  getScoreSeverity(score: number): string {
    if (score >= 90) return 'success';
    if (score >= 80) return 'info';
    if (score >= 70) return 'warn';
    return 'danger';
  }

  trackByMetricName(index: number, metric: PerformanceMetric): string {
    return metric.name;
  }
}
