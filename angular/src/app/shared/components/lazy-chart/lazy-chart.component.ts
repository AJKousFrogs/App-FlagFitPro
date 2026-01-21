/**
 * Lazy Chart Component
 * =====================
 * Dynamically loads Chart.js only when a chart needs to be rendered
 * This prevents Chart.js (~200 KB) from being in the initial bundle
 *
 * PrimeNG 21 Update:
 * - Uses direct UIChart import instead of dynamic createComponent
 * - Fixes "t.clear is not a function" and "createComponent is not a function" errors
 */

import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  effect,
  ElementRef,
  viewChild,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ChartSkeletonComponent } from "../chart-skeleton/chart-skeleton.component";
import { LoggerService } from "../../../core/services/logger.service";

export interface ChartDatasetConfig {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  [key: string]: unknown;
}

export interface LazyChartData {
  labels?: string[];
  datasets: ChartDatasetConfig[];
}

export interface ChartPlugins {
  legend?: Record<string, unknown>;
  tooltip?: Record<string, unknown>;
  title?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ChartScales {
  x?: Record<string, unknown>;
  y?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LazyChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: ChartPlugins;
  scales?: ChartScales;
  [key: string]: unknown;
}

// Type alias for better compatibility with Chart.js types
export type LazyChartOptionsInput =
  | LazyChartOptions
  | Record<string, unknown>
  | null;

// Chart.js instance type
interface ChartInstance {
  destroy: () => void;
  update: (mode?: string) => void;
  render: () => void;
  data: unknown;
  options: unknown;
}

@Component({
  selector: "app-lazy-chart",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartSkeletonComponent],
  template: `
    <div class="lazy-chart-container">
      @if (loading()) {
        <app-chart-skeleton [type]="type()" [height]="height()" />
      }
      @if (!loading() && !hasError()) {
        <canvas #chartCanvas [style.width]="width()" [style.height]="height()"></canvas>
      }
      @if (hasError()) {
        <div class="chart-error">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Failed to load chart</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .lazy-chart-container {
        position: relative;
        width: 100%;
      }
      .chart-error {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2rem;
        color: var(--text-color-secondary, #6c757d);
        font-size: var(--ds-font-size-sm);
      }
      .chart-error i {
        color: var(--yellow-500, #f59e0b);
      }
      canvas {
        display: block;
      }
    `,
  ],
})
export class LazyChartComponent implements OnInit, OnDestroy {
  private readonly logger = inject(LoggerService);

  // Canvas reference for Chart.js
  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>("chartCanvas");

  // Angular 21: Use input() signals instead of @Input()
  type = input<"line" | "bar" | "pie" | "doughnut" | "radar" | "polarArea">(
    "line",
  );
  data = input<LazyChartData | Record<string, unknown> | null>(null);
  options = input<LazyChartOptionsInput>({});
  width = input<string>("100%");
  height = input<string>("300px");

  // Angular 21: Use output() instead of @Output()
  chartClick = output<unknown>();
  chartHover = output<unknown>();

  loading = signal(true);
  hasError = signal(false);

  private chartInstance: ChartInstance | null = null;
  private ChartJS: typeof import("chart.js").Chart | null = null;

  constructor() {
    // Effect to update chart when data or options change
    effect(() => {
      const currentData = this.data();
      const currentOptions = this.options();
      const canvas = this.chartCanvas();

      if (this.chartInstance && currentData && canvas) {
        this.chartInstance.data = currentData;
        if (currentOptions) {
          this.chartInstance.options = currentOptions;
        }
        this.chartInstance.update();
      }
    });
  }

  async ngOnInit() {
    try {
      // Dynamically import Chart.js
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      this.ChartJS = Chart;

      this.loading.set(false);

      // Wait for canvas to be available in next tick
      setTimeout(() => this.initChart(), 0);
    } catch (error) {
      this.logger.error("Failed to load Chart.js:", error);
      this.loading.set(false);
      this.hasError.set(true);
    }
  }

  private initChart(): void {
    const canvas = this.chartCanvas();
    const chartData = this.data();

    if (!canvas?.nativeElement || !chartData || !this.ChartJS) {
      return;
    }

    try {
      const ctx = canvas.nativeElement.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas 2D context");
      }

      // Destroy existing chart if any
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      // Create new chart instance
      this.chartInstance = new this.ChartJS(ctx, {
        type: this.type() as "line" | "bar" | "pie" | "doughnut" | "radar" | "polarArea",
        data: chartData as import("chart.js").ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...(this.options() || {}),
          onClick: (_event: unknown, elements: unknown[]) => {
            if (elements.length > 0) {
              this.chartClick.emit(elements);
            }
          },
          onHover: (_event: unknown, elements: unknown[]) => {
            if (elements.length > 0) {
              this.chartHover.emit(elements);
            }
          },
        } as import("chart.js").ChartOptions,
      }) as unknown as ChartInstance;
    } catch (error) {
      this.logger.error("Failed to initialize chart:", error);
      this.hasError.set(true);
    }
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  /**
   * Update chart data dynamically
   */
  updateData(newData: LazyChartData) {
    if (this.chartInstance) {
      this.chartInstance.data = newData;
      this.chartInstance.update();
    }
  }

  /**
   * Update chart options dynamically
   */
  updateOptions(newOptions: LazyChartOptions) {
    if (this.chartInstance) {
      this.chartInstance.options = newOptions;
      this.chartInstance.update();
    }
  }

  /**
   * Refresh the chart
   */
  refresh() {
    if (this.chartInstance) {
      this.chartInstance.update();
    }
  }
}
