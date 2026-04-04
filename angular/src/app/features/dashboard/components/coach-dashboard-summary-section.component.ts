import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { Tooltip } from "primeng/tooltip";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { TeamOverviewStats } from "../../../core/services/team-statistics.service";

@Component({
  selector: "app-coach-dashboard-summary-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, CardShellComponent, ProgressBarComponent, Tooltip, DecimalPipe],
  templateUrl: "./coach-dashboard-summary-section.component.html",
  styleUrl: "./coach-dashboard-summary-section.component.scss",
})
export class CoachDashboardSummarySectionComponent {
  teamOverview = input.required<TeamOverviewStats>();
  nextGenEnabled = input(false);

  createSession = output<void>();
  openTeamMessage = output<void>();

  isWinningStreak(streak: string): boolean {
    return streak.startsWith("W");
  }
}
