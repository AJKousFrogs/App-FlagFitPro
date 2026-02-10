import {
  Component,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressBar } from "primeng/progressbar";
import { ButtonComponent } from "../button/button.component";

/**
 * Slow Operation Indicator Component
 *
 * UX AUDIT FIX: Provides reassurance messaging for long-running operations.
 * Shows "taking longer than usual" message after a configurable threshold.
 *
 * Usage:
 * ```html
 * <app-slow-operation-indicator
 *   [visible]="isExporting()"
 *   [progress]="exportProgress()"
 *   operationName="Exporting data"
 *   [slowThresholdMs]="10000"
 *   (cancel)="cancelExport()"
 * ></app-slow-operation-indicator>
 * ```
 */
@Component({
  selector: "app-slow-operation-indicator",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressBar, ButtonComponent],
  template: `
    @if (visible()) {
      <div class="slow-operation-container" role="status" aria-live="polite">
        <div class="operation-header">
          <span class="operation-name">{{ operationName() }}</span>
          @if (showSlowMessage()) {
            <span class="slow-badge">Taking longer than usual</span>
          }
        </div>

        @if (progress() !== null) {
          <p-progressBar
            [value]="progress()!"
            [showValue]="true"
            class="slow-operation-progress"
          ></p-progressBar>
        } @else {
          <p-progressBar
            mode="indeterminate"
            class="slow-operation-progress"
          ></p-progressBar>
        }

        <div class="operation-footer">
          @if (showSlowMessage()) {
            <p class="reassurance-message">
              {{ reassuranceMessage() }}
            </p>
          }

          @if (showCancel()) {
            <app-button variant="text" size="sm" (clicked)="onCancel()"
              >Cancel</app-button
            >
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .slow-operation-container {
        padding: var(--space-4);
        background: var(--surface-secondary);
        border-radius: var(--radius-lg);
        border: var(--border-1) solid var(--border-color);
      }

      .operation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
      }

      .operation-name {
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-primary);
      }

      .slow-badge {
        font-size: var(--ds-font-size-xs);
        padding: var(--space-1) var(--space-2);
        background: var(--ds-color-warning-subtle);
        color: var(--ds-color-warning);
        border-radius: var(--radius-full);
      }

      .operation-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: var(--space-3);
      }

      .reassurance-message {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }

      /* Progress bar styling - uses PrimeNG's styleClass prop */
      :host {
        --p-progressbar-height: var(--space-2);
        --p-progressbar-border-radius: var(--radius-full);
      }
    `,
  ],
})
export class SlowOperationIndicatorComponent implements OnInit, OnDestroy {
  // Inputs
  visible = input<boolean>(false);
  progress = input<number | null>(null);
  operationName = input<string>("Processing");
  slowThresholdMs = input<number>(10000); // 10 seconds default
  showCancel = input<boolean>(true);
  reassuranceMessage = input<string>(
    "This operation is taking a bit longer. Please don't close this page.",
  );

  // Outputs
  cancel = output<void>();

  // Internal state
  showSlowMessage = signal(false);
  private startTime: number | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startTracking();
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }

  private startTracking(): void {
    // Watch for visibility changes
    if (this.visible()) {
      this.startTime = Date.now();
      this.checkInterval = setInterval(() => {
        this.checkSlowThreshold();
      }, 1000);
    }
  }

  private stopTracking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.startTime = null;
    this.showSlowMessage.set(false);
  }

  private checkSlowThreshold(): void {
    if (!this.visible()) {
      this.stopTracking();
      return;
    }

    if (!this.startTime) {
      this.startTime = Date.now();
    }

    const elapsed = Date.now() - this.startTime;
    if (elapsed >= this.slowThresholdMs()) {
      this.showSlowMessage.set(true);
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.stopTracking();
  }
}
