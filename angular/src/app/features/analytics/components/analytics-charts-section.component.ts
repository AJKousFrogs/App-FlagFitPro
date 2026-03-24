import { TitleCasePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { Tooltip } from "primeng/tooltip";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-analytics-charts-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TitleCasePipe,
    SelectComponent,
    Tooltip,
    ButtonComponent,
    IconButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    LazyChartComponent,
    AppLoadingComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./analytics-charts-section.component.html",
  styleUrl: "./analytics-charts-section.component.scss",
})
export class AnalyticsChartsSectionComponent {
  performanceChartData = input<Record<string, unknown> | null>(null);
  chemistryChartData = input<Record<string, unknown> | null>(null);
  distributionChartData = input<Record<string, unknown> | null>(null);
  positionChartData = input<Record<string, unknown> | null>(null);
  speedChartData = input<Record<string, unknown> | null>(null);
  acwrData = input<{ acwr: number | null; riskZone: string } | null>(null);
  noDataMessage = input.required<{
    title: string;
    reason: string;
    icon?: string | null;
    actionLabel?: string | null;
    helpLink?: string | null;
  }>();
  gapAnalysisData = input.required<
    Array<{
      metric: string;
      current: number;
      benchmark: number;
      gap: number;
      unit: string;
    }>
  >();
  gapAnalysisSummary = input.required<{
    achieved: number;
    close: number;
    needsWork: number;
    overallScore: number;
  }>();
  speedInsights = input<{
    best40: string | null;
    best10: string | null;
    improvement: string | null;
  } | null>(null);
  timePeriods = input.required<string[]>();
  metricOptions = input.required<string[]>();
  lineChartOptions = input.required<Record<string, unknown>>();
  radarChartOptions = input.required<Record<string, unknown>>();
  doughnutChartOptions = input.required<Record<string, unknown>>();
  barChartOptions = input.required<Record<string, unknown>>();

  resetPerformanceChart = output<void>();
  exportPerformanceChart = output<void>();
  selectedTimePeriodChange = output<string | null>();
  selectedMetricChange = output<string | null>();
}
