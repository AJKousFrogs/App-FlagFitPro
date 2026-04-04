import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
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
  imports: [CardShellComponent, StatusTagComponent],
  templateUrl: "./coach-dashboard-protocols-section.component.html",
  styleUrl: "./coach-dashboard-protocols-section.component.scss",
})
export class CoachDashboardProtocolsSectionComponent {
  teamContinuity = input.required<CoachDashboardTeamContinuity>();

  viewPlayer = output<string>();

  readonly protocolSections = computed(() => {
    const tc = this.teamContinuity();
    type Row = {
      playerId: string;
      playerName: string;
      tagValue: string;
      tagSeverity: "info" | "warning";
    };
    type Section = { title: string; subtitle: string; rows: Row[] };
    const sections: Section[] = [];
    if (tc.gameDayRecovery.length > 0) {
      sections.push({
        title: "Game Day Recovery",
        subtitle: `${tc.gameDayRecovery.length} players`,
        rows: tc.gameDayRecovery.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          tagValue: `Day ${p.dayNumber}`,
          tagSeverity: "info",
        })),
      });
    }
    if (tc.loadCaps.length > 0) {
      sections.push({
        title: "ACWR Load Caps",
        subtitle: `${tc.loadCaps.length} players`,
        rows: tc.loadCaps.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          tagValue: `${p.sessionsRemaining} sessions remaining`,
          tagSeverity: "warning",
        })),
      });
    }
    if (tc.travelRecovery.length > 0) {
      sections.push({
        title: "Travel Recovery",
        subtitle: `${tc.travelRecovery.length} players`,
        rows: tc.travelRecovery.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          tagValue: `${p.daysRemaining} day(s) remaining`,
          tagSeverity: "info",
        })),
      });
    }
    return sections;
  });

  readonly hasProtocolSections = computed(
    () => this.protocolSections().length > 0,
  );
}
