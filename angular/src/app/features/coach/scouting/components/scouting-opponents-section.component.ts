import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Tooltip } from "primeng/tooltip";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";

export interface ScoutingOpponentPlayerView {
  name: string;
  number: string;
  position: string;
  notes: string;
  threatLevel: "high" | "medium" | "low";
}

export interface ScoutingOpponentProfileView {
  id: string;
  teamName: string;
  conference?: string;
  record: { wins: number; losses: number; ties: number };
  headCoach?: string;
  offensiveStyle?: string;
  defensiveStyle?: string;
  keyPlayers: ScoutingOpponentPlayerView[];
  lastMeetingResult?: string;
}

@Component({
  selector: "app-scouting-opponents-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip, ButtonComponent, CardShellComponent],
  templateUrl: "./scouting-opponents-section.component.html",
  styleUrl: "./scouting-opponents-section.component.scss",
})
export class ScoutingOpponentsSectionComponent {
  readonly items = input.required<ScoutingOpponentProfileView[]>();

  readonly addOpponent = output<void>();
  readonly viewOpponent = output<ScoutingOpponentProfileView>();
  readonly createReport = output<ScoutingOpponentProfileView>();
}
