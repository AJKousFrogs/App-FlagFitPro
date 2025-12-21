import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { MessageModule } from "primeng/message";
import { PerformanceMonitorService } from "../../../core/services/performance-monitor.service";
import { MessageService } from "primeng/api";

@Component({
  selector: "app-performance-monitor",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressBarModule,
    MessageModule,
  ],
  template: `
    @if (showMonitor()) {
      <div class="performance-monitor">
        <div class="monitor-header">
          <h4>Performance Monitor</h4>
          <p-button
            icon="pi pi-times"
            [text]="true"
            size="small"
            (onClick)="hideMonitor()"
            ariaLabel="Close performance monitor"
          >
          </p-button>
        </div>

        <div class="performance-metrics">
          @for (metric of performanceMetrics(); track trackByLabel($index, metric)) {
            <div
              class="metric"
              [class.warning]="metric.status === 'warning'"
              [class.critical]="metric.status === 'critical'"
            >
              <div class="metric-header">
                <span class="metric-label">{{ metric.label }}</span>
                <span class="metric-value">{{ metric.value }}</span>
              </div>
              <p-progressBar
                [value]="metric.score"
                [severity]="getProgressSeverity(metric.status)"
                [showValue]="false"
              >
              </p-progressBar>
              <div class="metric-status">
                <span [class]="'status-' + metric.status">
                  {{ getStatusLabel(metric.status) }}
                </span>
              </div>
            </div>
          }
        </div>

        @if (hasIssues()) {
          <div class="performance-actions">
            <p-message
              severity="warn"
              text="Performance issues detected"
              [closable]="false"
            >
            </p-message>
            <div class="action-buttons">
              <p-button
                label="Optimize Now"
                icon="pi pi-cog"
                size="small"
                (onClick)="optimizePerformance()"
              >
              </p-button>
              <p-button
                label="Report Issue"
                icon="pi pi-flag"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="reportIssue()"
              >
              </p-button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .performance-monitor {
        position: fixed;
        bottom: var(--space-4);
        left: var(--space-4);
        width: 320px;
        max-width: calc(100vw - 2rem);
        background: var(--surface-primary);
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        padding: var(--space-4);
        z-index: 1001;
        transition: transform 0.3s ease, opacity 0.3s ease;
        max-height: calc(100vh - 2rem);
        overflow-y: auto;
      }

      .monitor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-3);
        border-bottom: 1px solid var(--p-surface-border);
      }

      .monitor-header h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .performance-metrics {
        margin-bottom: var(--space-4);
      }

      .metric {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-50);
        border-left: 4px solid var(--p-surface-300);
        transition: all 0.2s;
      }

      .metric:last-child {
        margin-bottom: 0;
      }

      .metric.warning {
        background: var(--p-yellow-50);
        border-left-color: var(--p-yellow-500);
      }

      .metric.critical {
        background: var(--p-red-50);
        border-left-color: var(--p-red-500);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .metric-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-color-secondary);
      }

      .metric-value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color);
      }

      .metric-status {
        display: flex;
        justify-content: flex-end;
        margin-top: var(--space-1);
      }

      .status-good {
        color: var(--p-green-600);
        font-size: 0.75rem;
        font-weight: 500;
      }

      .status-warning {
        color: var(--p-yellow-600);
        font-size: 0.75rem;
        font-weight: 500;
      }

      .status-critical {
        color: var(--p-red-600);
        font-size: 0.75rem;
        font-weight: 500;
      }

      .performance-actions {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-border);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-3);
        flex-wrap: wrap;
      }

      .action-buttons p-button {
        flex: 1;
        min-width: 120px;
      }

      @media (max-width: 768px) {
        .performance-monitor {
          bottom: var(--space-2);
          left: var(--space-2);
          right: var(--space-2);
          width: auto;
        }
      }

      @media (max-width: 480px) {
        .action-buttons {
          flex-direction: column;
        }

        .action-buttons p-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class PerformanceMonitorComponent implements OnInit, OnDestroy {
  private performanceMonitorService = inject(PerformanceMonitorService);
  private messageService = inject(MessageService);

  showMonitor = signal(false);
  performanceMetrics = computed(() =>
    this.performanceMonitorService.metrics(),
  );
  hasIssues = computed(() =>
    this.performanceMonitorService.hasIssues(),
  );

  ngOnInit(): void {
    // Initialize message service in performance monitor service
    this.performanceMonitorService.setMessageService(this.messageService);

    // Show monitor if there are issues
    this.checkAndShowMonitor();

    // Subscribe to metrics changes
    // In a real implementation, you might want to use an effect or subscription
    setInterval(() => {
      this.checkAndShowMonitor();
    }, 5000);
  }

  ngOnDestroy(): void {
    // Service cleanup is handled by the service itself
  }

  private checkAndShowMonitor(): void {
    if (this.hasIssues()) {
      this.showMonitor.set(true);
    }
  }

  hideMonitor(): void {
    this.showMonitor.set(false);
  }

  optimizePerformance(): void {
    this.performanceMonitorService.optimizePerformance();
  }

  reportIssue(): void {
    this.performanceMonitorService.reportIssue();
  }

  getProgressSeverity(status: string): string {
    const severityMap: Record<string, string> = {
      good: "success",
      warning: "warn",
      critical: "danger",
    };
    return severityMap[status] || "info";
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      good: "Good",
      warning: "Warning",
      critical: "Critical",
    };
    return labelMap[status] || "Unknown";
  }

  trackByLabel(index: number, metric: any): string {
    return metric.label;
  }
}

