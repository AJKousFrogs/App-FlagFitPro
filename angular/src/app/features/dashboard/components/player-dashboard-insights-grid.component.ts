import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { ChartSkeletonComponent } from "../../../shared/components/chart-skeleton/chart-skeleton.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import type { SimpleChartData } from "../../../core/models/chart.models";

interface DashboardWeekDay {
  name: string;
  short: string;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface DashboardQuickAction {
  label: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: "app-player-dashboard-insights-grid",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ProgressBarComponent,
    CardShellComponent,
    ButtonComponent,
    LazyChartComponent,
    ChartSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./player-dashboard-insights-grid.component.html",
  styleUrl: "./player-dashboard-insights-grid.component.scss",
})
export class PlayerDashboardInsightsGridComponent {
  readonly weekDays = input.required<DashboardWeekDay[]>();
  readonly weeklyProgress = input(0);
  readonly quickActions = input.required<DashboardQuickAction[]>();
  readonly performanceChartData = input<SimpleChartData | null>(null);
  readonly chartOptions = input.required<Record<string, unknown>>();
}
