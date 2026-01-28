import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { Select } from "primeng/select";
import { Tag } from "primeng/tag";
import { ToggleButton } from "primeng/togglebutton";
import { Tooltip } from "primeng/tooltip";
import { formatDate } from "../../utils/date.utils";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface HeatmapCell {
  date: Date;
  value: number;
  intensity: number;
  sessions: number;
  duration: number;
  row: number;
  col: number;
}

interface HeatmapApiCell {
  date: string;
  intensity: number;
  sessions: number;
  duration: number;
}

@Component({
  selector: "app-training-heatmap",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Select,
    ToggleButton,
    Tag,
    Dialog,
    Tooltip,
    DatePipe,
  ],
  template: `
    <p-card header="Training Load Heatmap" class="heatmap-card">
      <div class="heatmap-controls">
        <p-select
          [options]="timeRangeOptions"
          [(ngModel)]="selectedTimeRange"
          (onValueChange)="updateHeatmap()"
          placeholder="Select time range"
          optionLabel="label"
          optionValue="value"
        >
        </p-select>

        <p-toggleButton
          [(ngModel)]="showIntensity"
          onLabel="Intensity"
          offLabel="Volume"
          (onValueChange)="toggleMetric()"
        >
        </p-toggleButton>
      </div>

      <div class="heatmap-container">
        <div class="heatmap-grid">
          @for (cell of heatmapData(); track trackByCell($index, cell)) {
            <div
              class="heatmap-cell"
              [class]="getIntensityClass(cell)"
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
              <div class="gradient-step" [class]="step.class"></div>
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
            <h4>{{ selectedCell.date | date: "fullDate" }}</h4>
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
  styleUrl: "./training-heatmap.component.scss",
})
export class TrainingHeatmapComponent {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  selectedTimeRange = "6months";
  showIntensity = true;
  showDetailModal = false;
  selectedCell: HeatmapCell | null = null;

  constructor() {
    // Angular 21: Initialize in constructor instead of OnInit
    this.updateHeatmap();
  }

  timeRangeOptions = [
    { label: "Last 3 Months", value: "3months" },
    { label: "Last 6 Months", value: "6months" },
    { label: "Last Year", value: "1year" },
  ];

  legendSteps = [
    { class: "intensity-0" },
    { class: "intensity-1" },
    { class: "intensity-2" },
    { class: "intensity-3" },
    { class: "intensity-4" },
    { class: "intensity-5" },
    { class: "intensity-6" },
    { class: "intensity-7" },
  ];

  rawHeatmapData = signal<HeatmapApiCell[]>([]);
  heatmapData = signal<HeatmapCell[]>([]);

  updateHeatmap() {
    this.apiService
      .get("/api/performance/heatmap", { timeRange: this.selectedTimeRange })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const cells = response.data?.cells;
          if (!Array.isArray(cells)) {
            this.rawHeatmapData.set([]);
            this.heatmapData.set([]);
            return;
          }
          this.rawHeatmapData.set(cells);
          this.heatmapData.set(this.buildHeatmapCells(cells));
        },
        error: () => {
          this.logger.debug("Heatmap data unavailable");
          this.rawHeatmapData.set([]);
          this.heatmapData.set([]);
        },
      });
  }

  private buildHeatmapCells(cells: HeatmapApiCell[]): HeatmapCell[] {
    if (cells.length === 0) {
      return [];
    }

    const { startDate } = this.getDateRange(this.selectedTimeRange);
    const startOffset = startDate.getDay();

    return cells
      .map((cell) => {
        const date = new Date(cell.date);
        if (Number.isNaN(date.getTime())) {
          return null;
        }

        const dayIndex = this.dateDiffInDays(startDate, date);
        if (dayIndex < 0) {
          return null;
        }

        const gridIndex = startOffset + dayIndex;
        const row = Math.floor(gridIndex / 7) + 1;
        const col = (gridIndex % 7) + 1;

        const intensity = Math.max(0, Math.min(7, Number(cell.intensity || 0)));
        const duration = Math.max(0, Number(cell.duration || 0));
        const value = this.showIntensity ? Math.round(intensity * 10) : duration;

        return {
          date,
          value,
          intensity,
          sessions: Math.max(0, Number(cell.sessions || 0)),
          duration,
          row,
          col,
        };
      })
      .filter(Boolean) as HeatmapCell[];
  }

  private getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date(endDate);

    if (timeRange === "3months") {
      startDate.setMonth(endDate.getMonth() - 3);
    } else if (timeRange === "1year") {
      startDate.setFullYear(endDate.getFullYear() - 1);
    } else {
      startDate.setMonth(endDate.getMonth() - 6);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }

  private dateDiffInDays(startDate: Date, endDate: Date): number {
    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  getIntensityClass(cell: HeatmapCell): string {
    if (!cell.intensity) return "intensity-0";
    const intensity = Math.min(7, Math.floor(cell.intensity));
    return `intensity-${intensity}`;
  }

  getTooltipText(cell: HeatmapCell): string {
    const metric = this.showIntensity ? "Intensity" : "Volume";
    return `${formatDate(cell.date, "P")}\n${metric}: ${cell.value}${this.showIntensity ? "/70" : " min"}`;
  }

  getAriaLabel(cell: HeatmapCell): string {
    const metric = this.showIntensity ? "Intensity" : "Volume";
    return `Training ${metric} on ${formatDate(cell.date, "P")}: ${cell.value}${this.showIntensity ? "/70" : " minutes"}`;
  }

  onCellClick(cell: HeatmapCell) {
    this.selectedCell = cell;
    this.showDetailModal = true;
  }

  toggleMetric() {
    this.heatmapData.set(this.buildHeatmapCells(this.rawHeatmapData()));
  }

  trackByCell(index: number, cell: HeatmapCell): string {
    return cell.date.toISOString();
  }

  trackByStep(index: number, _step: { class: string }): number {
    return index;
  }
}
