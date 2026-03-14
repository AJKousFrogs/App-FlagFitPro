import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { AppLoadingComponent } from "../../../shared/components/ui-components";
import { SimpleChartData } from "../../../core/models/chart.models";

@Component({
  selector: "app-wellness-charts-section",
  standalone: true,
  imports: [
    CommonModule,
    LazyChartComponent,
    CardShellComponent,
    EmptyStateComponent,
    AppLoadingComponent,
  ],
  templateUrl: "./wellness-charts-section.component.html",
  styleUrl: "./wellness-charts-section.component.scss",
})
export class WellnessChartsSectionComponent {
  readonly sleepChartData = input<SimpleChartData | null>(null);
  readonly recoveryChartData = input<SimpleChartData | null>(null);
  readonly chartOptions = input.required<Record<string, unknown>>();
}
