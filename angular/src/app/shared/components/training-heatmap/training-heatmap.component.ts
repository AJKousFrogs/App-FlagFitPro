import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Select } from "primeng/select";
import { ToggleButtonModule } from "primeng/togglebutton";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import { formatDate } from "../../utils/date.utils";

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
  selector: "app-training-heatmap",
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

  heatmapData = signal<HeatmapCell[]>([]);

  updateHeatmap() {
    // In a real app, this would fetch from this.apiService.get("/api/performance/heatmap")
    // For now, removing random data generation
    this.heatmapData.set([]);
  }

  private generateHeatmapData(): HeatmapCell[] {
    return [];
  }

  getIntensityClass(value: number): string {
    if (value === 0) return "intensity-0";
    const intensity = Math.min(7, Math.floor(value / 10));
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
    this.updateHeatmap();
  }

  trackByCell(index: number, cell: HeatmapCell): string {
    return cell.date.toISOString();
  }

  trackByStep(index: number, _step: { class: string }): number {
    return index;
  }
}
