/**
 * Lazy Chart Component
 * =====================
 * Dynamically loads Chart.js only when a chart needs to be rendered
 * This prevents Chart.js (~200 KB) from being in the initial bundle
 */

import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  viewChild,
  ViewContainerRef,
  ComponentRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ChartSkeletonComponent } from "../chart-skeleton/chart-skeleton.component";

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
      <ng-container #chartContainer></ng-container>
    </div>
  `,
  styles: [
    `
      .lazy-chart-container {
        position: relative;
        width: 100%;
      }
    `,
  ],
})
export class LazyChartComponent implements OnInit, OnDestroy {
  // Angular 21: Use viewChild() signal instead of @ViewChild()
  chartContainer = viewChild.required<ViewContainerRef>("chartContainer");

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
  private chartComponentRef: ComponentRef<unknown> | null = null;

  async ngOnInit() {
    // Only load Chart.js when this component is actually rendered
    try {
      // Dynamically import PrimeNG's UIChart component (the actual component class)
      const chartModule = await import("primeng/chart");
      const Chart = chartModule.UIChart || chartModule.default;

      if (!Chart) {
        throw new Error(
          "Could not find Chart component in primeng/chart module",
        );
      }

      // Create the chart component dynamically
      const container = this.chartContainer();
      this.chartComponentRef = container.createComponent(Chart);

      // Set inputs
      if (this.chartComponentRef) {
        this.chartComponentRef.setInput("type", this.type());
        this.chartComponentRef.setInput("data", this.data());
        this.chartComponentRef.setInput("options", this.options());
        this.chartComponentRef.setInput("width", this.width());
        this.chartComponentRef.setInput("height", this.height());

        // Wire up outputs
        const instance = this.chartComponentRef.instance as {
          onDataSelect?: { subscribe: (fn: (event: unknown) => void) => void };
        };
        instance.onDataSelect?.subscribe((event: unknown) => {
          this.chartClick.emit(event);
        });
      }

      this.loading.set(false);
    } catch (error) {
      console.error("Failed to load Chart component:", error);
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    if (this.chartComponentRef) {
      this.chartComponentRef.destroy();
    }
  }

  /**
   * Update chart data dynamically
   */
  updateData(newData: LazyChartData) {
    if (this.chartComponentRef) {
      this.chartComponentRef.setInput("data", newData);
    }
  }

  /**
   * Update chart options dynamically
   */
  updateOptions(newOptions: LazyChartOptions) {
    if (this.chartComponentRef) {
      this.chartComponentRef.setInput("options", newOptions);
    }
  }

  /**
   * Refresh the chart
   */
  refresh() {
    if (this.chartComponentRef) {
      const instance = this.chartComponentRef.instance as {
        refresh?: () => void;
      };
      instance.refresh?.();
    }
  }
}
