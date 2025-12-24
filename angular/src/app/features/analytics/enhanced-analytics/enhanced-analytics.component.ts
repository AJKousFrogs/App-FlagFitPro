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
import { ApiService } from "../../../core/services/api.service";
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
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  performanceChartData = signal<any>(null);
  injuryRisk = signal(15);

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
    try {
      // See issue #11 - Implement enhanced analytics API
      // const response = await this.apiService.getEnhancedAnalytics();

      // Mock chart data
      this.performanceChartData.set({
        labels: [
          "Week 1",
          "Week 2",
          "Week 3",
          "Week 4",
          "Week 5",
          "Week 6",
          "Week 7",
        ],
        datasets: [
          {
            label: "Performance Score",
            data: [78, 82, 85, 88, 90, 87, 92],
            borderColor: "#089949",
            backgroundColor: "rgba(8, 153, 73, 0.1)",
          },
        ],
      });
    } catch (error) {
      this.logger.error("Error loading analytics:", error);
    }
  }

  exportReport(): void {
    // See issue #13 - Implement report export API (PDF with charts)
    this.logger.debug("Export report");
  }
}
