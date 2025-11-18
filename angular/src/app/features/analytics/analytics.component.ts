import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DEFAULT_CHART_OPTIONS, LINE_CHART_OPTIONS, BAR_CHART_OPTIONS, DOUGHNUT_CHART_OPTIONS } from '../../shared/config/chart.config';
import { ApiService, API_ENDPOINTS } from '../../core/services/api.service';

interface Metric {
  icon: string;
  value: string;
  label: string;
  trend: string;
  trendType: 'positive' | 'negative';
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ChartModule,
    DropdownModule,
    MainLayoutComponent,
    PageHeaderComponent
  ],
  template: `
    <app-main-layout>
      <div class="analytics-page">
        <app-page-header title="FlagFit Pro Analytics" subtitle="Advanced Performance Analytics & Team Insights" icon="pi-chart-bar"></app-page-header>

        <!-- Key Metrics Overview -->
        <div class="metrics-grid">
          <p-card *ngFor="let metric of metrics(); trackBy: trackByMetricLabel" class="metric-card">
            <div class="metric-icon">
              <i [class]="'pi ' + metric.icon"></i>
            </div>
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-trend" [class]="'trend-' + metric.trendType">
              {{ metric.trend }}
            </div>
          </p-card>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <!-- Performance Trends Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Performance Trends</h3>
                <div class="chart-actions">
                  <p-button label="Export" [outlined]="true" size="small"></p-button>
                  <p-button label="Customize" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart *ngIf="performanceChartData()" type="line" [data]="performanceChartData()" 
                    [options]="lineChartOptions"></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">91</div>
                <div class="insight-label">Current Score</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">+13</div>
                <div class="insight-label">Total Improvement</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">+5.2%</div>
                <div class="insight-label">Weekly Trend</div>
              </div>
            </div>
          </p-card>

          <!-- Team Chemistry Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Team Chemistry Analysis</h3>
                <div class="chart-actions">
                  <p-button label="Details" [outlined]="true" size="small"></p-button>
                  <p-button label="Improve" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart *ngIf="chemistryChartData()" type="radar" [data]="chemistryChartData()" 
                    [options]="radarChartOptions"></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">8.4</div>
                <div class="insight-label">Overall Score</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">9.1</div>
                <div class="insight-label">Trust Level</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">7.5</div>
                <div class="insight-label">Leadership</div>
              </div>
            </div>
          </p-card>

          <!-- Training Distribution Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Training Session Distribution</h3>
                <div class="chart-actions">
                  <p-button label="Filter" [outlined]="true" size="small"></p-button>
                  <p-button label="Schedule" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart *ngIf="distributionChartData()" type="doughnut" [data]="distributionChartData()" 
                    [options]="DOUGHNUT_CHART_OPTIONS"></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">30</div>
                <div class="insight-label">Agility Sessions</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">25</div>
                <div class="insight-label">Speed Sessions</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">20</div>
                <div class="insight-label">Technical Sessions</div>
              </div>
            </div>
          </p-card>

          <!-- Position Performance Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Position Performance Comparison</h3>
                <div class="chart-actions">
                  <p-button label="Benchmarks" [outlined]="true" size="small"></p-button>
                  <p-button label="Optimize" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart *ngIf="positionChartData()" type="bar" [data]="positionChartData()" 
                    [options]="BAR_CHART_OPTIONS"></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">94</div>
                <div class="insight-label">Lorenzo S. #21</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">91</div>
                <div class="insight-label">Aljosa K. #55</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">89</div>
                <div class="insight-label">Vince M. #10</div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Full Width Charts -->
        <p-card class="chart-card full-width">
          <ng-template pTemplate="header">
            <div class="chart-header">
              <h3 class="chart-title">Speed Development Progress</h3>
              <div class="chart-controls">
                <p-dropdown [options]="timePeriods" [(ngModel)]="selectedTimePeriod" 
                           placeholder="Time Period" styleClass="w-full md:w-14rem"></p-dropdown>
                <p-dropdown [options]="metricOptions" [(ngModel)]="selectedMetric" 
                           placeholder="Metrics" styleClass="w-full md:w-14rem"></p-dropdown>
              </div>
            </div>
          </ng-template>
          <p-chart *ngIf="speedChartData()" type="line" [data]="speedChartData()" 
                  [options]="lineChartOptions"></p-chart>
          <div class="chart-insights">
            <div class="insight-item">
              <div class="insight-value">4.46s</div>
              <div class="insight-label">Best 40-Yard</div>
            </div>
            <div class="insight-item">
              <div class="insight-value">1.54s</div>
              <div class="insight-label">Best 10-Yard</div>
            </div>
            <div class="insight-item">
              <div class="insight-value">-0.19s</div>
              <div class="insight-label">Total Improvement</div>
            </div>
            <div class="insight-item">
              <div class="insight-value">4.40s</div>
              <div class="insight-label">Olympic Target</div>
            </div>
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .analytics-page {
      padding: var(--space-6);
    }

    .page-header {
      margin-bottom: var(--space-8);
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: var(--space-2);
      color: var(--text-primary);
    }

    .page-subtitle {
      font-size: 1.125rem;
      color: var(--text-secondary);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .metric-card {
      text-align: center;
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto var(--space-4);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--p-primary-50);
      color: var(--p-primary-600);
      border-radius: 50%;
      font-size: 1.5rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }

    .metric-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
    }

    .metric-trend {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .trend-positive {
      color: var(--color-success);
    }

    .trend-negative {
      color: var(--color-warning);
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .chart-card {
      min-height: 400px;
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .chart-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .chart-actions {
      display: flex;
      gap: var(--space-2);
    }

    .chart-controls {
      display: flex;
      gap: var(--space-3);
    }

    .chart-insights {
      display: flex;
      gap: var(--space-4);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--p-surface-200);
    }

    .insight-item {
      flex: 1;
      text-align: center;
    }

    .insight-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-brand-primary);
      margin-bottom: var(--space-1);
    }

    .insight-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .chart-controls {
        flex-direction: column;
        width: 100%;
      }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private apiService = inject(ApiService);

  metrics = signal<Metric[]>([]);
  performanceChartData = signal<any>(null);
  chemistryChartData = signal<any>(null);
  distributionChartData = signal<any>(null);
  positionChartData = signal<any>(null);
  speedChartData = signal<any>(null);
  
  selectedTimePeriod: string = 'Last 7 Weeks';
  selectedMetric: string = '40-Yard & 10-Yard';
  
  timePeriods = ['Last 7 Weeks', 'Last 30 Days', 'Season Progress'];
  metricOptions = ['40-Yard & 10-Yard', 'All Sprint Distances', 'Agility Tests'];

  readonly lineChartOptions = LINE_CHART_OPTIONS;
  readonly BAR_CHART_OPTIONS = BAR_CHART_OPTIONS;
  readonly DOUGHNUT_CHART_OPTIONS = DOUGHNUT_CHART_OPTIONS;

  radarChartOptions = {
    ...DEFAULT_CHART_OPTIONS,
    scales: {
      r: {
        beginAtZero: true,
        max: 10
      }
    }
  };

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    // Load metrics
    this.metrics.set([
      {
        icon: 'pi-chart-bar',
        value: '87%',
        label: 'Overall Performance',
        trend: '+5.2% this week',
        trendType: 'positive'
      },
      {
        icon: 'pi-users',
        value: '8.4',
        label: 'Team Chemistry',
        trend: '+0.6 improvement',
        trendType: 'positive'
      },
      {
        icon: 'pi-bolt',
        value: '4.52s',
        label: '40-Yard Dash',
        trend: '-0.13s faster',
        trendType: 'positive'
      },
      {
        icon: 'pi-trophy',
        value: '73%',
        label: 'Olympic Qualification',
        trend: '+8% progress',
        trendType: 'positive'
      }
    ]);

    // Load charts
    this.performanceChartData.set({
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
      datasets: [{
        label: 'Performance Score',
        data: [78, 82, 85, 79, 88, 91, 87],
        borderColor: '#089949',
        backgroundColor: 'rgba(8, 153, 73, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    });

    this.chemistryChartData.set({
      labels: ['Communication', 'Coordination', 'Trust', 'Cohesion', 'Leadership', 'Adaptability'],
      datasets: [{
        label: 'Team Chemistry',
        data: [8.4, 9.1, 7.5, 8.8, 9.2, 8.0],
        borderColor: '#089949',
        backgroundColor: 'rgba(16, 201, 107, 0.2)',
        borderWidth: 2
      }]
    });

    this.distributionChartData.set({
      labels: ['Speed Training', 'Strength', 'Agility', 'Endurance', 'Technique'],
      datasets: [{
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          '#089949',
          '#10c89b',
          '#f1c40f',
          '#e74c3c',
          '#3498db'
        ]
      }]
    });

    this.positionChartData.set({
      labels: ['QB', 'WR', 'RB', 'DB', 'Rusher'],
      datasets: [{
        label: 'Performance',
        data: [94, 91, 89, 87, 85],
        backgroundColor: '#089949'
      }]
    });

    this.speedChartData.set({
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
      datasets: [
        {
          label: '40-Yard',
          data: [4.65, 4.58, 4.52, 4.49, 4.47, 4.46, 4.46],
          borderColor: '#089949',
          backgroundColor: 'rgba(8, 153, 73, 0.1)'
        },
        {
          label: '10-Yard',
          data: [1.65, 1.60, 1.57, 1.55, 1.54, 1.54, 1.54],
          borderColor: '#10c96b',
          backgroundColor: 'rgba(16, 201, 107, 0.1)'
        }
      ]
    });
  }

  trackByMetricLabel(index: number, metric: Metric): string {
    return metric.label;
  }
}
