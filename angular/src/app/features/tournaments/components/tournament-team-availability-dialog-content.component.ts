import { CommonModule, DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import type { Tournament } from "../../../core/services/tournament.service";

interface PlayerAvailability {
  playerId: string;
  playerName: string;
  position: string;
  status: "confirmed" | "declined" | "tentative" | "pending";
  reason?: string;
  paymentStatus: "pending" | "paid" | "partial" | "not_required";
  amountPaid: number;
}

interface AvailabilitySummary {
  confirmed: number;
  tentative: number;
  declined: number;
  pending: number;
}

interface TournamentBudget {
  totalEstimated: number;
  teamContribution: number;
  sponsorContribution: number;
  perPlayer: number;
}

@Component({
  selector: "app-tournament-team-availability-dialog-content",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, ButtonComponent, StatusTagComponent],
  templateUrl: "./tournament-team-availability-dialog-content.component.html",
  styleUrl: "./tournament-team-availability-dialog-content.component.scss",
})
export class TournamentTeamAvailabilityDialogContentComponent {
  readonly tournament = input.required<Tournament>();
  readonly dateRangeLabel = input.required<string>();
  readonly summary = input.required<AvailabilitySummary>();
  readonly budget = input<TournamentBudget | null>(null);
  readonly players = input.required<PlayerAvailability[]>();

  readonly openBudget = output<void>();
  readonly sendReminders = output<void>();
  readonly exportReport = output<void>();

  getAvailabilityLabel(status: PlayerAvailability["status"]): string {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "tentative":
        return "Tentative";
      case "declined":
        return "Declined";
      default:
        return "Pending";
    }
  }

  getAvailabilitySeverity(
    status: PlayerAvailability["status"],
  ): "success" | "warning" | "danger" | "info" {
    switch (status) {
      case "confirmed":
        return "success";
      case "tentative":
        return "warning";
      case "declined":
        return "danger";
      default:
        return "info";
    }
  }
}
