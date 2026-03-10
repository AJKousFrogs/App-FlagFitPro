import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import { ChartSkeletonComponent } from "../../../shared/components/chart-skeleton/chart-skeleton.component";
import {
  LazyChartComponent,
  LazyChartData,
  LazyChartOptionsInput,
} from "../../../shared/components/lazy-chart/lazy-chart.component";

@Component({
  selector: "app-coach-dashboard-analytics-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LazyChartComponent, ChartSkeletonComponent],
  templateUrl: "./coach-dashboard-analytics-section.component.html",
  styleUrl: "./coach-dashboard-analytics-section.component.scss",
})
export class CoachDashboardAnalyticsSectionComponent {
  readonly performanceChartData = input.required<LazyChartData | null>();
  readonly lineChartOptions = input.required<LazyChartOptionsInput>();
  readonly latestPerformanceScore = input.required<number>();
  readonly practiceAttendanceRate = input.required<number>();
  readonly nextGenEnabled = input.required<boolean>();
}
