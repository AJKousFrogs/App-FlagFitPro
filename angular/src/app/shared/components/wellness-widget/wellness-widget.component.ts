import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { WellnessService } from "../../../core/services/wellness.service";
import { LoggerService } from "../../../core/services/logger.service";

interface WellnessMetric {
  icon: string;
  label: string;
  value: string;
  color: string;
}

@Component({
  selector: "app-wellness-widget",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ButtonModule, ProgressBarModule],
  template: `
    <p-card class="wellness-widget">
      <ng-template pTemplate="header">
        <div class="widget-header">
          <div class="header-content">
            <i class="pi pi-heart icon"></i>
            <h3>Wellness</h3>
          </div>
          <p-button
            icon="pi pi-external-link"
            [text]="true"
            [rounded]="true"
            size="small"
            (onClick)="navigateToWellness()"
            [attr.aria-label]="'View full wellness details'"
          ></p-button>
        </div>
      </ng-template>

      <div class="wellness-content">
        <!-- Overall Score -->
        <div class="score-section">
          <div class="score-circle" [style.border-color]="statusColor()">
            <span class="score-value">{{ overallScore() }}</span>
            <span class="score-label">{{ statusLabel() }}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <p-progressBar
            [value]="overallScore()"
            [showValue]="false"
            [style]="{ height: '8px' }"
            [styleClass]="'wellness-progress'"
          ></p-progressBar>
        </div>

        <!-- Key Metrics -->
        @if (metrics().length > 0) {
          <div class="metrics-grid">
            @for (metric of metrics(); track trackByLabel($index, metric)) {
              <div class="metric-item">
                <i
                  [class]="'pi ' + metric.icon"
                  [style.color]="metric.color"
                ></i>
                <div class="metric-info">
                  <span class="metric-label">{{ metric.label }}</span>
                  <span class="metric-value">{{ metric.value }}</span>
                </div>
              </div>
            }
          </div>
        }

        <!-- No Data Message -->
        @if (metrics().length === 0) {
          <div class="no-data">
            <i class="pi pi-info-circle"></i>
            <p>No wellness data yet</p>
            <p-button
              label="Log Check-in"
              icon="pi pi-plus"
              size="small"
              (onClick)="navigateToWellness()"
            ></p-button>
          </div>
        }
      </div>
    </p-card>
  `,
  styles: [
    `
      .wellness-widget {
        height: 100%;
      }

      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--surface-border);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .header-content .icon {
        color: var(--brand-primary-700);
        font-size: 1.25rem;
      }

      .header-content h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .wellness-content {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .score-section {
        display: flex;
        justify-content: center;
        padding: var(--space-3) 0;
      }

      .score-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid var(--brand-primary-700);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--surface-primary);
        transition: all 0.3s ease;
      }

      .score-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
      }

      .score-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: var(--space-1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .progress-section {
        padding: 0 var(--space-2);
      }

      :host ::ng-deep .wellness-progress .p-progressbar-value {
        background: linear-gradient(
          90deg,
          var(--brand-primary-700) 0%,
          var(--status-success-500) 100%
        );
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }

      .metric-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2);
        background: var(--surface-secondary);
        border-radius: var(--p-border-radius);
        transition: background-color 0.2s ease;
      }

      .metric-item:hover {
        background: var(--surface-hover);
      }

      .metric-item i {
        font-size: 1.25rem;
      }

      .metric-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .metric-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .metric-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .no-data {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        text-align: center;
      }

      .no-data i {
        font-size: 2rem;
        color: var(--text-tertiary);
      }

      .no-data p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      @media (max-width: 768px) {
        .score-circle {
          width: 100px;
          height: 100px;
        }

        .score-value {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class WellnessWidgetComponent {
  private wellnessService = inject(WellnessService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  overallScore = signal<number>(0);
  statusLabel = signal<string>("N/A");
  statusColor = signal<string>("var(--ds-primary-green)");
  metrics = signal<WellnessMetric[]>([]);

  constructor() {
    // Angular 21: Initialize in constructor instead of OnInit
    this.loadWellnessData();
  }

  loadWellnessData(): void {
    this.wellnessService.getWellnessData("7d").subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const latestData = response.data[0];
          const score = this.wellnessService.getWellnessScore(latestData);
          const status = this.wellnessService.getWellnessStatus(score);

          // Update overall score
          this.overallScore.set(Math.round(score * 10));
          this.statusLabel.set(status.status);
          this.statusColor.set(status.color);

          // Build metrics array
          const metricsData: WellnessMetric[] = [];

          if (latestData.sleep) {
            metricsData.push({
              icon: "pi-moon",
              label: "Sleep",
              value: `${latestData.sleep}h`,
              color: "#3498db",
            });
          }

          if (latestData.energy) {
            metricsData.push({
              icon: "pi-bolt",
              label: "Energy",
              value: `${latestData.energy}/10`,
              color: "#f1c40f",
            });
          }

          if (latestData.stress !== undefined && latestData.stress !== null) {
            const stressLabel =
              latestData.stress <= 3
                ? "Low"
                : latestData.stress <= 6
                  ? "Moderate"
                  : "High";
            metricsData.push({
              icon: "pi-shield",
              label: "Stress",
              value: stressLabel,
              color: latestData.stress <= 3 ? "#10c96b" : "#f39c12",
            });
          }

          this.metrics.set(metricsData);
        } else {
          // No data available
          this.overallScore.set(0);
          this.statusLabel.set("No data");
          this.statusColor.set("#94a3b8");
          this.metrics.set([]);
        }
      },
      error: (err) => {
        this.logger.error("Error loading wellness data for widget:", err);
        this.overallScore.set(0);
        this.statusLabel.set("Error");
        this.statusColor.set("#ef4444");
        this.metrics.set([]);
      },
    });
  }

  navigateToWellness(): void {
    this.router.navigate(["/wellness"]);
  }

  trackByLabel(index: number, metric: WellnessMetric): string {
    return metric.label;
  }
}
