import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

interface TeamContinuityItem {
  playerId: string;
  playerName: string;
}

interface RecoveryContinuityItem extends TeamContinuityItem {
  dayNumber: number;
}

interface LoadCapContinuityItem extends TeamContinuityItem {
  sessionsRemaining: number;
}

interface TravelContinuityItem extends TeamContinuityItem {
  daysRemaining: number;
}

export interface CoachDashboardTeamContinuity {
  gameDayRecovery: RecoveryContinuityItem[];
  loadCaps: LoadCapContinuityItem[];
  travelRecovery: TravelContinuityItem[];
}

@Component({
  selector: "app-coach-dashboard-protocols-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardShellComponent, StatusTagComponent],
  templateUrl: "./coach-dashboard-protocols-section.component.html",
  styleUrl: "./coach-dashboard-protocols-section.component.scss",
})
export class CoachDashboardProtocolsSectionComponent {
  teamContinuity = input.required<CoachDashboardTeamContinuity>();

  viewPlayer = output<string>();
}
