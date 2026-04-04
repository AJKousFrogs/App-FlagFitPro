import { CommonModule, DecimalPipe, NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { Tooltip } from "primeng/tooltip";
import { TRAINING } from "../../../core/constants/app.constants";
import type { IncompleteDataMeaning } from "../../../core/semantics/semantic-meaning.types";
import { ConfidenceIndicatorComponent } from "../../../shared/components/confidence-indicator/confidence-indicator.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { SemanticMeaningRendererComponent } from "../../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { SkeletonComponent } from "../../../shared/components/skeleton/skeleton.component";

type StatusSeverity =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "primary";

interface AcwrDisplayInput {
  value: number | null;
  label: string;
  severity: StatusSeverity;
  hasData: boolean;
  trainingDaysLogged: number | null;
}

@Component({
  selector: "app-player-dashboard-stats-overview",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    DecimalPipe,
    ProgressBarComponent,
    Tooltip,
    CardShellComponent,
    StatusTagComponent,
    ConfidenceIndicatorComponent,
    SemanticMeaningRendererComponent,
    SkeletonComponent,
  ],
  templateUrl: "./player-dashboard-stats-overview.component.html",
  styleUrl: "./player-dashboard-stats-overview.component.scss",
})
export class PlayerDashboardStatsOverviewComponent {
  readonly TRAINING = TRAINING;

  /** True when individual card data is refreshing (after initial page load) */
  readonly isDataLoading = input(false);

  readonly readinessScore = input<number | null>(null);
  readonly readinessLabel = input.required<string>();
  readonly readinessSeverity = input.required<StatusSeverity>();
  readonly nextGenEnabled = input(false);
  readonly nextGenReadinessScore = input<number | null>(null);
  readonly wellnessCheckedInToday = input(false);
  readonly checkinStreak = input(0);
  readonly checkinOverdue = input(false);
  readonly daysSinceLastCheckin = input(0);

  readonly acwrDataSufficient = input(false);
  readonly acwrDisplay = input.required<AcwrDisplayInput>();
  readonly acwrConfidenceScore = input(0);
  readonly acwrConfidenceMissingInputs = input<string[]>([]);
  readonly acwrIncompleteMeaning = input<IncompleteDataMeaning | null>(null);

  readonly currentStreak = input(0);
  readonly weeklySessionsCompleted = input(0);
  readonly weeklySessionsPlanned = input(0);

  readonly navigateToWellness = output<void>();
  readonly navigateToAcwr = output<void>();
}
