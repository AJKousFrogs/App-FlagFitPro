import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

import { Tournament } from "../../../core/services/tournament.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { TournamentTeamAvailabilityDialogContentComponent } from "./tournament-team-availability-dialog-content.component";

type PlayerAvailability = {
  playerId: string;
  playerName: string;
  position: string;
  status: "confirmed" | "declined" | "tentative" | "pending";
  reason?: string;
  paymentStatus: "pending" | "paid" | "partial" | "not_required";
  amountPaid: number;
};

type AvailabilitySummary = {
  confirmed: number;
  tentative: number;
  declined: number;
  pending: number;
};

type TournamentBudget = {
  totalEstimated: number;
  teamContribution: number;
  sponsorContribution: number;
  perPlayer: number;
};

@Component({
  selector: "app-tournament-team-availability-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    TournamentTeamAvailabilityDialogContentComponent,
  ],
  templateUrl: "./tournament-team-availability-dialog.component.html",
})
export class TournamentTeamAvailabilityDialogComponent {
  visible = input<boolean>(false);
  tournament = input<Tournament | null>(null);
  dateRangeLabel = input<string>("");
  summary = input.required<AvailabilitySummary>();
  budget = input<TournamentBudget | null>(null);
  players = input.required<PlayerAvailability[]>();

  visibleChange = output<boolean>();
  openBudget = output<void>();
  sendReminders = output<void>();
  exportReport = output<void>();
}
