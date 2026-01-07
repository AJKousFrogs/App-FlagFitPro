/**
 * Lazy Chart Component
 * =====================
 * Dynamically loads Chart.js only when a chart needs to be rendered
 * This prevents Chart.js (~200 KB) from being in the initial bundle
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  ViewChild,
  ViewContainerRef,
  inject,
  ComponentRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartSkeletonComponent } from '../chart-skeleton/chart-skeleton.component';

export interface LazyChartData {
  labels?: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    [key: string]: any;
  }>;
}

export interface LazyChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: any;
  scales?: any;
  [key: string]: any;
}

// Type alias for better compatibility with Chart.js types
export type LazyChartOptionsInput = LazyChartOptions | any | null;

@Component({
  selector: 'app-lazy-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartSkeletonComponent],
  template: `
    <div class="lazy-chart-container">
      @if (loading()) {
        <app-chart-skeleton
          [type]="type"
          [height]="height"
        />
      }
      <ng-container #chartContainer></ng-container>
    </div>
  `,
  styles: [`
    .lazy-chart-container {
      position: relative;
      width: 100%;
    }
  `]
})
export class LazyChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer', { read: ViewContainerRef })
  chartContainer!: ViewContainerRef;

  @Input() type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' = 'line';
  @Input() data: LazyChartData | any | null = null;
  @Input() options: LazyChartOptionsInput = {};
  @Input() width: string = '100%';
  @Input() height: string = '300px';
  
  @Output() chartClick = new EventEmitter<any>();
  @Output() chartHover = new EventEmitter<any>();

  loading = signal(true);
  private chartComponentRef: ComponentRef<any> | null = null;

  async ngOnInit() {
    // Only load Chart.js when this component is actually rendered
    try {
      // Dynamically import PrimeNG's UIChart component (the actual component class)
      const chartModule = await import('primeng/chart');
      const Chart = chartModule.UIChart || chartModule.default;
      
      if (!Chart) {
        throw new Error('Could not find Chart component in primeng/chart module');
      }
      
      // Create the chart component dynamically
      this.chartComponentRef = this.chartContainer.createComponent(Chart);
      
      // Set inputs
      if (this.chartComponentRef) {
        this.chartComponentRef.setInput('type', this.type);
        this.chartComponentRef.setInput('data', this.data);
        this.chartComponentRef.setInput('options', this.options);
        this.chartComponentRef.setInput('width', this.width);
        this.chartComponentRef.setInput('height', this.height);

        // Wire up outputs
        this.chartComponentRef.instance.onDataSelect?.subscribe((event: any) => {
          this.chartClick.emit(event);
        });
      }

      this.loading.set(false);
    } catch (error) {
      console.error('Failed to load Chart component:', error);
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
      this.chartComponentRef.setInput('data', newData);
    }
  }

  /**
   * Update chart options dynamically
   */
  updateOptions(newOptions: LazyChartOptions) {
    if (this.chartComponentRef) {
      this.chartComponentRef.setInput('options', newOptions);
    }
  }

  /**
   * Refresh the chart
   */
  refresh() {
    if (this.chartComponentRef) {
      this.chartComponentRef.instance.refresh?.();
    }
  }
}
