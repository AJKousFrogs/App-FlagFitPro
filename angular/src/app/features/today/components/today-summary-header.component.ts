import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardHeaderComponent } from "../../../shared/components/card-header/card-header.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import type {
  ExactTrainingSummary,
  TodayReadinessDisplay,
} from "../today-protocol.facade";

@Component({
  selector: "app-today-summary-header",
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardHeaderComponent, CardShellComponent],
  templateUrl: "./today-summary-header.component.html",
  styleUrl: "./today-summary-header.component.scss",
})
export class TodaySummaryHeaderComponent {
  readonly todayDateLabel = input.required<string>();
  readonly readinessDisplay = input.required<TodayReadinessDisplay>();
  readonly exactTrainingSummary = input<ExactTrainingSummary | null>(null);

  readonly logSession = output<void>();
  readonly startExactPlan = output<void>();
}
