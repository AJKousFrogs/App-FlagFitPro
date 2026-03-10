import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Tournament, TournamentService } from "../../../core/services/tournament.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

@Component({
  selector: "app-tournament-season-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonComponent,
    IconButtonComponent,
    StatusTagComponent,
    EmptyStateComponent,
    CardShellComponent,
  ],
  templateUrl: "./tournament-season-panel.component.html",
  styleUrl: "./tournament-season-panel.component.scss",
})
export class TournamentSeasonPanelComponent {
  readonly tournamentService = inject(TournamentService);
  readonly addTournamentHandler = (): void => this.addTournament.emit();

  tournaments = input<Tournament[]>([]);
  seasonYear = input.required<string>();
  isAuthenticated = input(false);
  canViewTeamAvailability = input(false);
  showExtendedDetails = input(true);
  isPlayerView = input(false);

  addTournament = output<void>();
  edit = output<Tournament>();
  delete = output<Tournament>();
  availability = output<Tournament>();
  teamAvailability = output<Tournament>();
  viewDetails = output<Tournament>();
  openWebsite = output<string>();

  isPersonalTournament(tournament: Tournament): boolean {
    return tournament.visibility_scope === "personal";
  }

  resolveStatus(tournament: Tournament): string {
    return tournament.calculatedStatus || "upcoming";
  }

  shouldShowCountdown(tournament: Tournament): boolean {
    return (
      this.resolveStatus(tournament) === "upcoming" &&
      typeof tournament.daysUntil === "number" &&
      tournament.daysUntil >= 0
    );
  }

  websiteUrl(tournament: Tournament): string | null {
    return tournament.website_url || null;
  }

  formatTournamentType(type?: Tournament["tournament_type"]): string {
    if (!type) {
      return "Tournament";
    }

    return type
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}
