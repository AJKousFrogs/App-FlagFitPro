import {
  Component,
  input,
  computed,
  signal,
  inject,
  HostListener,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { ChartModule } from "primeng/chart";
import { ButtonModule } from "primeng/button";
import { DEFAULT_CHART_OPTIONS } from "../../config/chart.config";
import { LoggerService } from "../../../core/services/logger.service";

export interface AccessibleDataPoint {
  date: Date | string;
  speed: number;
  accuracy: number;
  trendDescription: string;
}

@Component({
  selector: "app-accessible-performance-chart",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartModule, ButtonModule, DatePipe],
  template: `
    <div
      class="chart-container"
      role="img"
      [attr.aria-label]="chartAriaLabel()"
      tabindex="0"
      (keydown)="handleKeydown($event)"
    >
      <!-- Visual Chart -->
      <p-chart
        [type]="'line'"
        [data]="chartData()"
        [options]="chartOptions()"
        aria-hidden="true"
      ></p-chart>

      <!-- Screen Reader Data Table -->
      <table class="sr-only" aria-label="Performance data table">
        <caption>
          {{
            chartTitle()
          }}
          - Detailed performance metrics over time
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Speed (mph)</th>
            <th scope="col">Accuracy (%)</th>
            <th scope="col">Trend</th>
          </tr>
        </thead>
        <tbody>
          @for (dataPoint of accessibleData(); track $index) {
            <tr>
              <th scope="row">{{ dataPoint.date | date: "short" }}</th>
              <td>{{ dataPoint.speed }}</td>
              <td>{{ dataPoint.accuracy }}</td>
              <td>{{ dataPoint.trendDescription }}</td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Audio Feedback for Key Insights -->
      <div
        class="audio-insights"
        aria-live="polite"
        aria-label="Performance insights"
      >
        <p-button
          type="button"
          class="audio-button"
          (onClick)="playInsight()"
          [text]="true"
          icon="pi pi-volume-up"
          label="Audio Summary"
          ariaLabel="Play audio summary of performance trends"
        >
        </p-button>
      </div>

      <!-- Keyboard Navigation Instructions -->
      <div class="keyboard-help" [class.visible]="showKeyboardHelp()">
        <h4>Keyboard Navigation</h4>
        <ul>
          <li><kbd>Arrow keys</kbd> - Navigate data points</li>
          <li><kbd>Enter</kbd> - Activate data point</li>
          <li><kbd>Space</kbd> - Toggle data series</li>
          <li><kbd>H</kbd> - Toggle this help</li>
        </ul>
        <p-button
          label="Close"
          [text]="true"
          size="small"
          (onClick)="showKeyboardHelp.set(false)"
          class="close-help-btn"
        >
        </p-button>
      </div>

      <!-- Current Data Point Announcement -->
      <div
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
        [attr.aria-label]="currentDataPointAnnouncement()"
      >
        {{ currentDataPointAnnouncement() }}
      </div>
    </div>
  `,
  styles: [
    `
      .chart-container {
        position: relative;
        padding: var(--space-4);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        outline: none;
      }

      .chart-container:focus {
        outline: 2px solid var(--color-brand-primary);
        outline-offset: 2px;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .audio-insights {
        margin-top: var(--space-4);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .keyboard-help {
        position: absolute;
        top: var(--space-4);
        right: var(--space-4);
        background: var(--surface-overlay);
        padding: var(--space-4);
        border-radius: var(--p-border-radius);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        max-width: 300px;
      }

      .keyboard-help.visible {
        opacity: 1;
        visibility: visible;
      }

      .keyboard-help h4 {
        margin: 0 0 var(--space-3) 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .keyboard-help ul {
        margin: 0 0 var(--space-3) 0;
        padding-left: var(--space-5);
        list-style: disc;
      }

      .keyboard-help li {
        margin-bottom: var(--space-2);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      kbd {
        background: var(--p-surface-200);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-family: monospace;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .close-help-btn {
        width: 100%;
        margin-top: var(--space-2);
      }

      @media (max-width: 768px) {
        .keyboard-help {
          top: var(--space-2);
          right: var(--space-2);
          left: var(--space-2);
          max-width: none;
        }
      }
    `,
  ],
})
export class AccessiblePerformanceChartComponent {
  // Angular 21: Use input() signal instead of @Input()
  chartData = input<{
    labels?: (string | Date)[];
    datasets?: Array<{
      label?: string;
      data: (number | { speed?: number; accuracy?: number; [key: string]: unknown })[];
      [key: string]: unknown;
    }>;
  }>();
  chartTitle = input<string>("Performance Chart");
  private logger = inject(LoggerService);
  chartOptions = input<Record<string, unknown>>(DEFAULT_CHART_OPTIONS);

  showKeyboardHelp = signal(false);
  currentDataPointIndex = signal<number | null>(null);

  chartAriaLabel = computed(() => {
    const trend = this.getMainTrend();
    const period = this.getTimePeriod();
    return `Performance chart showing ${trend} over ${period}`;
  });

  accessibleData = computed(() => {
    const data = this.chartData();
    if (!data?.datasets?.[0]?.data) {
      return [];
    }

    return data.datasets[0].data.map((value: number | { speed?: number; accuracy?: number; [key: string]: unknown }, index: number) => {
      const date = data.labels?.[index] || new Date();
      const speed = typeof value === "object" ? (value.speed ?? value as unknown as number) : value;
      const accuracy = typeof value === "object" ? (value.accuracy ?? 0) : 100;
      return {
        date,
        speed,
        accuracy,
        trendDescription: this.calculateTrend(value, index),
      };
    });
  });

  currentDataPointAnnouncement = computed(() => {
    const index = this.currentDataPointIndex();
    if (index === null || !this.accessibleData().length) {
      return "";
    }
    const point = this.accessibleData()[index];
    return `Data point ${index + 1} of ${this.accessibleData().length}: Date ${point.date}, Speed ${point.speed} miles per hour, Accuracy ${point.accuracy} percent. ${point.trendDescription}`;
  });

  // Initialize speechSynthesis at field declaration
  private speechSynthesis: SpeechSynthesis | null =
    typeof window !== "undefined" ? window.speechSynthesis : null;

  @HostListener("keydown", ["$event"])
  handleKeydown(event: KeyboardEvent): void {
    switch (event.key.toLowerCase()) {
      case "h":
        if (!event.ctrlKey && !event.metaKey) {
          this.toggleKeyboardHelp();
          event.preventDefault();
        }
        break;
      case "arrowleft":
        this.navigateDataPoints("left");
        event.preventDefault();
        break;
      case "arrowright":
        this.navigateDataPoints("right");
        event.preventDefault();
        break;
      case "enter":
        this.announceCurrentDataPoint();
        event.preventDefault();
        break;
      case " ":
        if (!event.ctrlKey && !event.metaKey) {
          // Toggle data series visibility (placeholder)
          event.preventDefault();
        }
        break;
      case "escape":
        this.showKeyboardHelp.set(false);
        this.currentDataPointIndex.set(null);
        break;
    }
  }

  toggleKeyboardHelp(): void {
    this.showKeyboardHelp.update((val) => !val);
  }

  navigateDataPoints(direction: "left" | "right"): void {
    const currentIndex = this.currentDataPointIndex();
    const dataLength = this.accessibleData().length;

    if (dataLength === 0) return;

    let newIndex: number;
    if (currentIndex === null) {
      newIndex = direction === "right" ? 0 : dataLength - 1;
    } else {
      if (direction === "right") {
        newIndex = (currentIndex + 1) % dataLength;
      } else {
        newIndex = currentIndex === 0 ? dataLength - 1 : currentIndex - 1;
      }
    }

    this.currentDataPointIndex.set(newIndex);
  }

  announceCurrentDataPoint(): void {
    const index = this.currentDataPointIndex();
    if (index !== null) {
      const announcement = this.currentDataPointAnnouncement();
      this.speak(announcement);
    }
  }

  playInsight(): void {
    const insight = this.generateAudioInsight();
    this.speak(insight);
  }

  private speak(text: string): void {
    if (!this.speechSynthesis) {
      this.logger.warn("Speech synthesis not available");
      return;
    }

    // Cancel any ongoing speech
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    this.speechSynthesis.speak(utterance);
  }

  private generateAudioInsight(): string {
    const trend = this.getMainTrend();
    const period = this.getTimePeriod();
    const avgSpeed = this.getAverage("speed");
    const avgAccuracy = this.getAverage("accuracy");

    return `Your performance has ${trend} over the ${period}. Current speed average is ${avgSpeed} miles per hour, with accuracy at ${avgAccuracy} percent.`;
  }

  private getMainTrend(): string {
    const chartData = this.chartData();
    if (!chartData?.datasets?.[0]?.data?.length) {
      return "remained stable";
    }

    const data = chartData.datasets[0].data;
    const first =
      typeof data[0] === "object" ? data[0].speed || data[0] : data[0];
    const last =
      typeof data[data.length - 1] === "object"
        ? data[data.length - 1].speed || data[data.length - 1]
        : data[data.length - 1];

    if (last > first * 1.05) {
      return "improved significantly";
    } else if (last > first) {
      return "improved";
    } else if (last < first * 0.95) {
      return "declined";
    }
    return "remained stable";
  }

  private getTimePeriod(): string {
    const chartData = this.chartData();
    if (!chartData?.labels?.length) {
      return "the selected period";
    }

    const labels = chartData.labels;
    const count = labels.length;

    if (count <= 7) {
      return "the past week";
    } else if (count <= 30) {
      return "the past month";
    } else if (count <= 90) {
      return "the past quarter";
    }
    return "the selected period";
  }

  private getAverage(metric: "speed" | "accuracy"): number {
    const data = this.accessibleData();
    if (data.length === 0) return 0;

    const sum = data.reduce((acc: number, point) => {
      return acc + (metric === "speed" ? point.speed : point.accuracy);
    }, 0);

    return Math.round((sum / data.length) * 10) / 10;
  }

  private calculateTrend(value: number | { speed?: number; accuracy?: number; [key: string]: unknown }, index: number): string {
    const chartData = this.chartData();
    if (!chartData?.datasets?.[0]?.data || index === 0) {
      return "Baseline measurement";
    }

    const previousValue =
      typeof chartData.datasets[0].data[index - 1] === "object"
        ? (chartData.datasets[0].data[index - 1] as { speed?: number; [key: string]: unknown }).speed ??
          chartData.datasets[0].data[index - 1]
        : chartData.datasets[0].data[index - 1];

    const currentValue =
      typeof value === "object" ? (value.speed ?? value) as number : value;

    const change = ((currentValue - (previousValue as number)) / (previousValue as number)) * 100;

    if (change > 5) {
      return `Significant improvement of ${change.toFixed(1)}%`;
    } else if (change > 0) {
      return `Slight improvement of ${change.toFixed(1)}%`;
    } else if (change < -5) {
      return `Significant decline of ${Math.abs(change).toFixed(1)}%`;
    } else if (change < 0) {
      return `Slight decline of ${Math.abs(change).toFixed(1)}%`;
    }
    return "No significant change";
  }
}
