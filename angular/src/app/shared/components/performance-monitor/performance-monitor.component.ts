import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { MessageModule } from "primeng/message";
import { PerformanceMonitorService } from "../../../core/services/performance-monitor.service";
import { MessageService } from "primeng/api";
import { timer } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-performance-monitor",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, ProgressBarModule, MessageModule],
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
          @for (
            metric of performanceMetrics();
            track trackByLabel($index, metric)
          ) {
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
  styleUrl: './performance-monitor.component.scss',
})
export class PerformanceMonitorComponent implements OnInit, OnDestroy {
  private performanceMonitorService = inject(PerformanceMonitorService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  showMonitor = signal(false);
  performanceMetrics = computed(() => this.performanceMonitorService.metrics());
  hasIssues = computed(() => this.performanceMonitorService.hasIssues());

  ngOnInit(): void {
    // Show monitor if there are issues
    this.checkAndShowMonitor();

    // Subscribe to metrics changes using RxJS timer with automatic cleanup
    // timer(0, 5000) emits immediately, then every 5 seconds
    // takeUntilDestroyed automatically unsubscribes when component is destroyed
    timer(0, 5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkAndShowMonitor();
      });
  }

  ngOnDestroy(): void {
    // Cleanup is handled automatically by takeUntilDestroyed
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

  trackByLabel(index: number, metric: { label: string }): string {
    return metric.label;
  }
}
