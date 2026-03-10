import { CommonModule, DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

export interface NutritionistTournamentBriefView {
  tournament: {
    name: string;
    dates: { start: Date; end: Date };
    location: string;
    expectedGames: number;
    climate: { temperature: number; humidity: number };
  };
  calculatedNeeds: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyHydration: number;
  };
}

@Component({
  selector: "app-nutritionist-tournament-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  templateUrl: "./nutritionist-tournament-section.component.html",
  styleUrl: "./nutritionist-tournament-section.component.scss",
})
export class NutritionistTournamentSectionComponent {
  readonly items = input.required<NutritionistTournamentBriefView[]>();

  readonly createBrief = output<void>();
  readonly viewBrief = output<NutritionistTournamentBriefView>();
  readonly exportBrief = output<NutritionistTournamentBriefView>();
}
