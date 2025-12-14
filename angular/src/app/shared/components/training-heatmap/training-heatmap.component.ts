import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { Select } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

interface HeatmapCell {
  date: Date;
  value: number;
  intensity: number;
  sessions: number;
  duration: number;
  row: number;
  col: number;
}

@Component({
  selector: 'app-training-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    Select,
    ToggleButtonModule,
    TagModule,
    DialogModule,
    TooltipModule,
    DatePipe,
  ],
  template: `
    <p-card header="Training Load Heatmap" class="heatmap-card">
      <div class="heatmap-controls">
        <p-select
          [options]="timeRangeOptions"
          [(ngModel)]="selectedTimeRange"
          (onChange)="updateHeatmap()"
          placeholder="Select time range"
          optionLabel="label"
          optionValue="value"
        >
        </p-select>

        <p-toggleButton
          [(ngModel)]="showIntensity"
          onLabel="Intensity"
          offLabel="Volume"
          (onChange)="toggleMetric()"
        >
        </p-toggleButton>
      </div>

      <div class="heatmap-container">
        <div class="heatmap-grid">
          @for (cell of heatmapData(); track trackByCell($index, cell)) {
            <div
              class="heatmap-cell"
              [class]="getIntensityClass(cell.value)"
              [style.grid-column]="cell.col"
              [style.grid-row]="cell.row"
              [pTooltip]="getTooltipText(cell)"
              tooltipPosition="top"
              (click)="onCellClick(cell)"
              [attr.aria-label]="getAriaLabel(cell)"
              role="button"
              tabindex="0"
              (keydown.enter)="onCellClick(cell)"
              (keydown.space)="onCellClick(cell)"
            >
              @if (cell.value > 0) {
                <span class="cell-value">{{ cell.value }}</span>
              }
            </div>
          }
        </div>

        <div class="heatmap-legend">
          <span class="legend-label">Less</span>
          <div class="legend-gradient">
            @for (step of legendSteps; track trackByStep($index, step)) {
              <div
                class="gradient-step"
                [class]="step.class"
              ></div>
            }
          </div>
          <span class="legend-label">More</span>
        </div>
      </div>

      <!-- Detailed view modal -->
      <p-dialog
        [(visible)]="showDetailModal"
        header="Training Details"
        [modal]="true"
        [style]="{ width: '400px' }"
        (onHide)="selectedCell = null"
      >
        @if (selectedCell) {
          <div class="detail-content">
            <h4>{{ selectedCell.date | date : 'fullDate' }}</h4>
            <div class="detail-metrics">
              <div class="metric">
                <span class="label">Training Load:</span>
                <span class="value">{{ selectedCell.value }}</span>
              </div>
              <div class="metric">
                <span class="label">Sessions:</span>
                <span class="value">{{ selectedCell.sessions }}</span>
              </div>
              <div class="metric">
                <span class="label">Duration:</span>
                <span class="value">{{ selectedCell.duration }} min</span>
              </div>
            </div>
          </div>
        }
      </p-dialog>
    </p-card>
  `,
  styles: [
    `
      .heatmap-card {
        width: 100%;
        max-width: 800px;
      }

      .heatmap-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        gap: 1rem;
      }

      .heatmap-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .heatmap-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-auto-rows: minmax(30px, auto);
        gap: 2px;
        background: var(--p-surface-100);
        padding: 2px;
        border-radius: var(--p-border-radius);
      }

      .heatmap-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        min-height: 30px;
        outline: none;
      }

      .heatmap-cell:hover {
        transform: scale(1.1);
        z-index: 1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .heatmap-cell:focus {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 2px;
      }

      .heatmap-cell.intensity-0 {
        background: var(--p-surface-200);
      }

      .heatmap-cell.intensity-1 {
        background: #d0f0eb;
      }

      .heatmap-cell.intensity-2 {
        background: #a0e4d7;
      }

      .heatmap-cell.intensity-3 {
        background: #70d8c3;
      }

      .heatmap-cell.intensity-4 {
        background: #40ccaf;
      }

      .heatmap-cell.intensity-5 {
        background: #10c96b;
      }

      .heatmap-cell.intensity-6 {
        background: #0ab85a;
      }

      .heatmap-cell.intensity-7 {
        background: var(--ds-primary-green);
      }

      .cell-value {
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .heatmap-legend {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .legend-gradient {
        display: flex;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--p-surface-border);
      }

      .gradient-step {
        width: 20px;
        height: 12px;
      }

      .gradient-step.intensity-0 {
        background: var(--p-surface-200);
      }

      .gradient-step.intensity-1 {
        background: #d0f0eb;
      }

      .gradient-step.intensity-2 {
        background: #a0e4d7;
      }

      .gradient-step.intensity-3 {
        background: #70d8c3;
      }

      .gradient-step.intensity-4 {
        background: #40ccaf;
      }

      .gradient-step.intensity-5 {
        background: #10c96b;
      }

      .gradient-step.intensity-6 {
        background: #0ab85a;
      }

      .gradient-step.intensity-7 {
        background: var(--ds-primary-green);
      }

      .legend-label {
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .detail-content {
        padding: 1rem 0;
      }

      .detail-content h4 {
        margin: 0 0 1rem 0;
        color: var(--p-text-color);
      }

      .detail-metrics {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--p-surface-border);
      }

      .metric:last-child {
        border-bottom: none;
      }

      .metric .label {
        font-weight: 500;
        color: var(--p-text-color-secondary);
      }

      .metric .value {
        font-weight: 600;
        color: var(--p-text-color);
        font-size: 1.125rem;
      }

      @media (max-width: 768px) {
        .heatmap-controls {
          flex-direction: column;
          align-items: stretch;
        }

        .heatmap-grid {
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
        }

        .heatmap-cell {
          min-height: 25px;
        }

        .cell-value {
          font-size: 0.625rem;
        }
      }
    `,
  ],
})
export class TrainingHeatmapComponent implements OnInit {
  selectedTimeRange = '6months';
  showIntensity = true;
  showDetailModal = false;
  selectedCell: HeatmapCell | null = null;

  timeRangeOptions = [
    { label: 'Last 3 Months', value: '3months' },
    { label: 'Last 6 Months', value: '6months' },
    { label: 'Last Year', value: '1year' },
  ];

  legendSteps = [
    { class: 'intensity-0' },
    { class: 'intensity-1' },
    { class: 'intensity-2' },
    { class: 'intensity-3' },
    { class: 'intensity-4' },
    { class: 'intensity-5' },
    { class: 'intensity-6' },
    { class: 'intensity-7' },
  ];

  heatmapData = signal<HeatmapCell[]>([]);

  ngOnInit() {
    this.updateHeatmap();
  }

  updateHeatmap() {
    // Generate heatmap data based on selected time range
    const data = this.generateHeatmapData();
    this.heatmapData.set(data);
  }

  private generateHeatmapData(): HeatmapCell[] {
    const data: HeatmapCell[] = [];
    const startDate = new Date();
    const monthsBack =
      this.selectedTimeRange === '3months'
        ? 3
        : this.selectedTimeRange === '6months'
          ? 6
          : 12;
    startDate.setMonth(startDate.getMonth() - monthsBack);

    let currentDate = new Date(startDate);
    let row = 1;
    let col = currentDate.getDay() + 1; // Start from the day of week (0 = Sunday, so +1)

    // Adjust to start from Sunday (col = 1)
    if (col === 8) col = 1;

    while (currentDate <= new Date()) {
      const intensity = Math.floor(Math.random() * 8); // 0-7 scale
      const value = this.showIntensity
        ? intensity * 10
        : Math.floor(Math.random() * 120);

      data.push({
        date: new Date(currentDate),
        value,
        intensity,
        sessions: Math.floor(Math.random() * 3) + 1,
        duration: Math.floor(Math.random() * 90) + 30,
        row,
        col,
      });

      currentDate.setDate(currentDate.getDate() + 1);
      col++;

      if (col > 7) {
        col = 1;
        row++;
      }
    }

    return data;
  }

  getIntensityClass(value: number): string {
    if (value === 0) return 'intensity-0';
    const intensity = Math.min(7, Math.floor(value / 10));
    return `intensity-${intensity}`;
  }

  getTooltipText(cell: HeatmapCell): string {
    const metric = this.showIntensity ? 'Intensity' : 'Volume';
    return `${cell.date.toLocaleDateString()}\n${metric}: ${cell.value}${this.showIntensity ? '/70' : ' min'}`;
  }

  getAriaLabel(cell: HeatmapCell): string {
    const metric = this.showIntensity ? 'Intensity' : 'Volume';
    return `Training ${metric} on ${cell.date.toLocaleDateString()}: ${cell.value}${this.showIntensity ? '/70' : ' minutes'}`;
  }

  onCellClick(cell: HeatmapCell) {
    this.selectedCell = cell;
    this.showDetailModal = true;
  }

  toggleMetric() {
    this.updateHeatmap();
  }

  trackByCell(index: number, cell: HeatmapCell): string {
    return cell.date.toISOString();
  }

  trackByStep(index: number, step: any): number {
    return index;
  }
}

