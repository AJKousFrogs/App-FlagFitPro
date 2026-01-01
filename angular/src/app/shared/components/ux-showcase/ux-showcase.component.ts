import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { PerformanceDashboardComponent } from "../performance-dashboard/performance-dashboard.component";
import { TrainingBuilderComponent } from "../training-builder/training-builder.component";
import { SwipeTableComponent } from "../swipe-table/swipe-table.component";
import { TrainingHeatmapComponent } from "../training-heatmap/training-heatmap.component";
import { CardModule } from "primeng/card";
import { Tabs } from "primeng/tabs";
import { LoggerService } from "../../../core/services/logger.service";

/**
 * Showcase component demonstrating all advanced UX/UI components
 * This can be used as a reference for implementing these components
 */
@Component({
  selector: "app-ux-showcase",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    Tabs,
    PerformanceDashboardComponent,
    TrainingBuilderComponent,
    SwipeTableComponent,
    TrainingHeatmapComponent,
  ],
  template: `
    <div class="ux-showcase">
      <p-card header="Advanced UX/UI Components Showcase">
        <p-tabs>
          <!-- Performance Dashboard Tab -->
          <p-tabpanel header="Performance Dashboard">
            <app-performance-dashboard
              [athleteId]="'demo-athlete'"
              [realTimeEnabled]="true"
            >
            </app-performance-dashboard>
          </p-tabpanel>

          <!-- Training Builder Tab -->
          <p-tabpanel header="Training Builder">
            <app-training-builder></app-training-builder>
          </p-tabpanel>

          <!-- Swipe Table Tab -->
          <p-tabpanel header="Swipe Table">
            <h3>Mobile Swipe Gestures</h3>
            <p class="info-text">
              Swipe left on rows (mobile only) to reveal edit/delete actions
            </p>
            <app-swipe-table
              [data]="tableData"
              [columns]="tableColumns"
              [onEdit]="handleEdit"
              [onDelete]="handleDelete"
            >
            </app-swipe-table>
          </p-tabpanel>

          <!-- Training Heatmap Tab -->
          <p-tabpanel header="Training Heatmap">
            <app-training-heatmap></app-training-heatmap>
          </p-tabpanel>
        </p-tabs>
      </p-card>
    </div>
  `,
  styles: [
    `
      .ux-showcase {
        padding: 1rem;
      }

      .info-text {
        color: var(--p-text-color-secondary);
        margin-bottom: 1rem;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class UxShowcaseComponent {
  private logger = inject(LoggerService);
  // Example data for swipe table
  tableData = signal([
    {
      id: 1,
      name: "John Doe",
      position: "Quarterback",
      performance: "92%",
    },
    {
      id: 2,
      name: "Jane Smith",
      position: "Receiver",
      performance: "88%",
    },
    {
      id: 3,
      name: "Mike Johnson",
      position: "Defender",
      performance: "85%",
    },
  ]);

  tableColumns = signal([
    { field: "name", header: "Name" },
    { field: "position", header: "Position" },
    { field: "performance", header: "Performance" },
  ]);

  handleEdit = (row: {
    id: number;
    name: string;
    position: string;
    performance: string;
  }) => {
    this.logger.debug("Edit row:", row);
    // Implement edit logic
  };

  handleDelete = (row: {
    id: number;
    name: string;
    position: string;
    performance: string;
  }) => {
    this.logger.debug("Delete row:", row);
    // Implement delete logic
  };
}
