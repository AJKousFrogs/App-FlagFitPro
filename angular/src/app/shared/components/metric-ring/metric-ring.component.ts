/**
 * Metric Ring Component
 *
 * A beautiful circular progress indicator for displaying key metrics.
 * Perfect for ACWR, readiness scores, completion percentages, etc.
 *
 * Features:
 * - Animated progress ring with gradient
 * - Color-coded status (success, warning, danger)
 * - Optional sparkline mini-trend
 * - Responsive sizing
 * - Accessibility support
 *
 * @example
 * <app-metric-ring
 *   [value]="85"
 *   [max]="100"
 *   label="Readiness"
 *   [thresholds]="{ danger: 50, warning: 70, success: 85 }"
 * />
 */

import {
  Component,
  input,
  computed,
  signal,
  ChangeDetectionStrategy,
  afterNextRender,
  ElementRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export interface MetricRingThresholds {
  danger: number;
  warning: number;
  success: number;
}

@Component({
  selector: "app-metric-ring",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="metric-ring"
      [class]="'size-' + size()"
      [attr.aria-label]="ariaLabel()"
      role="meter"
      [attr.aria-valuenow]="value()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="max()"
    >
      <!-- SVG Ring -->
      <svg
        class="ring-svg"
        [attr.viewBox]="'0 0 ' + svgSize + ' ' + svgSize"
      >
        <!-- Background track -->
        <circle
          class="ring-track"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          [attr.stroke-width]="strokeWidth()"
        />

        <!-- Progress ring -->
        <circle
          class="ring-progress"
          [class]="'status-' + status()"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          [attr.stroke-width]="strokeWidth()"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset()"
          [style.--progress-color]="progressColor()"
        />

        <!-- Glow effect -->
        @if (showGlow()) {
          <circle
            class="ring-glow"
            [class]="'status-' + status()"
            [attr.cx]="center"
            [attr.cy]="center"
            [attr.r]="radius"
            fill="none"
            [attr.stroke-width]="strokeWidth() + 4"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset()"
          />
        }
      </svg>

      <!-- Center content -->
      <div class="ring-content">
        <div class="ring-value" [class]="'status-' + status()">
          {{ displayValue() }}
          @if (unit()) {
            <span class="ring-unit">{{ unit() }}</span>
          }
        </div>
        @if (label()) {
          <div class="ring-label">{{ label() }}</div>
        }
        @if (sublabel()) {
          <div class="ring-sublabel">{{ sublabel() }}</div>
        }
      </div>

      <!-- Status indicator dot -->
      @if (showStatusDot()) {
        <div class="status-dot" [class]="'status-' + status()">
          @if (status() === 'success') {
            <i class="pi pi-check"></i>
          } @else if (status() === 'warning') {
            <i class="pi pi-exclamation-triangle"></i>
          } @else if (status() === 'danger') {
            <i class="pi pi-times"></i>
          }
        </div>
      }

      <!-- Trend indicator -->
      @if (trend()) {
        <div class="trend-indicator" [class]="'trend-' + trend()">
          <i [class]="'pi ' + trendIcon()"></i>
          @if (trendValue()) {
            <span>{{ trendValue() }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .metric-ring {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Sizes */
    .size-sm {
      width: 80px;
      height: 80px;
    }

    .size-md {
      width: 120px;
      height: 120px;
    }

    .size-lg {
      width: 160px;
      height: 160px;
    }

    .size-xl {
      width: 200px;
      height: 200px;
    }

    /* SVG */
    .ring-svg {
      position: absolute;
      inset: 0;
      transform: rotate(-90deg);
    }

    .ring-track {
      stroke: var(--p-surface-200);
    }

    .ring-progress {
      stroke: var(--progress-color, var(--color-brand-primary));
      stroke-linecap: round;
      transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .ring-progress.status-success {
      stroke: var(--color-status-success);
    }

    .ring-progress.status-warning {
      stroke: var(--color-status-warning);
    }

    .ring-progress.status-danger {
      stroke: var(--color-status-error);
    }

    .ring-progress.status-info {
      stroke: var(--color-status-info);
    }

    .ring-progress.status-primary {
      stroke: var(--color-brand-primary);
    }

    /* Glow effect */
    .ring-glow {
      opacity: 0.3;
      filter: blur(4px);
    }

    .ring-glow.status-success {
      stroke: var(--color-status-success);
    }

    .ring-glow.status-warning {
      stroke: var(--color-status-warning);
    }

    .ring-glow.status-danger {
      stroke: var(--color-status-error);
    }

    /* Content */
    .ring-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--space-2);
    }

    .ring-value {
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .size-sm .ring-value {
      font-size: 1.25rem;
    }

    .size-md .ring-value {
      font-size: 1.75rem;
    }

    .size-lg .ring-value {
      font-size: 2.25rem;
    }

    .size-xl .ring-value {
      font-size: 3rem;
    }

    .ring-value.status-success {
      color: var(--color-status-success);
    }

    .ring-value.status-warning {
      color: var(--color-status-warning);
    }

    .ring-value.status-danger {
      color: var(--color-status-error);
    }

    .ring-unit {
      font-size: 0.5em;
      font-weight: 500;
      opacity: 0.7;
      margin-left: 2px;
    }

    .ring-label {
      font-size: var(--font-body-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin-top: var(--space-1);
    }

    .size-sm .ring-label {
      font-size: var(--font-body-xs);
    }

    .ring-sublabel {
      font-size: var(--font-body-xs);
      color: var(--text-secondary);
      margin-top: 2px;
    }

    /* Status dot */
    .status-dot {
      position: absolute;
      top: 0;
      right: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: white;
      box-shadow: var(--shadow-md);
    }

    .status-dot.status-success {
      background: var(--color-status-success);
    }

    .status-dot.status-warning {
      background: var(--color-status-warning);
    }

    .status-dot.status-danger {
      background: var(--color-status-error);
    }

    /* Trend indicator */
    .trend-indicator {
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--font-body-xs);
      font-weight: 600;
      background: var(--surface-primary);
      box-shadow: var(--shadow-sm);
    }

    .trend-indicator.trend-up {
      color: var(--color-status-success);
    }

    .trend-indicator.trend-down {
      color: var(--color-status-error);
    }

    .trend-indicator.trend-stable {
      color: var(--text-secondary);
    }

    /* Animation */
    @keyframes ring-pulse {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.6;
      }
    }

    .ring-glow {
      animation: ring-pulse 2s ease-in-out infinite;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .ring-progress {
        transition: none;
      }

      .ring-glow {
        animation: none;
      }
    }
  `],
})
export class MetricRingComponent {
  // Inputs
  value = input<number>(0);
  max = input<number>(100);
  label = input<string>("");
  sublabel = input<string>("");
  unit = input<string>("");
  size = input<"sm" | "md" | "lg" | "xl">("md");
  thresholds = input<MetricRingThresholds | null>(null);
  showGlow = input<boolean>(true);
  showStatusDot = input<boolean>(false);
  trend = input<"up" | "down" | "stable" | null>(null);
  trendValue = input<string>("");
  decimals = input<number>(0);
  colorOverride = input<string>("");

  // SVG calculations
  private readonly svgSize = 100;
  private readonly center = 50;
  private readonly radius = 42;
  private readonly circumference = 2 * Math.PI * this.radius;

  // Computed
  strokeWidth = computed(() => {
    const sizeMap = { sm: 6, md: 8, lg: 10, xl: 12 };
    return sizeMap[this.size()];
  });

  percentage = computed(() => {
    const val = this.value();
    const maxVal = this.max();
    if (maxVal === 0) return 0;
    return Math.min(100, Math.max(0, (val / maxVal) * 100));
  });

  dashOffset = computed(() => {
    return this.circumference - (this.percentage() / 100) * this.circumference;
  });

  displayValue = computed(() => {
    const val = this.value();
    const dec = this.decimals();
    return dec > 0 ? val.toFixed(dec) : Math.round(val).toString();
  });

  status = computed<"success" | "warning" | "danger" | "info" | "primary">(() => {
    const thresh = this.thresholds();
    if (!thresh) return "primary";

    const val = this.value();
    if (val >= thresh.success) return "success";
    if (val >= thresh.warning) return "warning";
    return "danger";
  });

  progressColor = computed(() => {
    if (this.colorOverride()) return this.colorOverride();
    return undefined;
  });

  trendIcon = computed(() => {
    const t = this.trend();
    if (t === "up") return "pi-arrow-up";
    if (t === "down") return "pi-arrow-down";
    return "pi-minus";
  });

  ariaLabel = computed(() => {
    const lbl = this.label() || "Metric";
    const val = this.displayValue();
    const maxVal = this.max();
    return `${lbl}: ${val} out of ${maxVal}`;
  });
}
