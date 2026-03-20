import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormGroup } from "@angular/forms";

import { Tournament } from "../../../core/services/tournament.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { TournamentAvailabilityDialogContentComponent } from "./tournament-availability-dialog-content.component";

type AvailabilityStatus = "pending" | "confirmed" | "declined" | "tentative";
type AvailabilityOption = {
  value: AvailabilityStatus;
  label: string;
  icon: string;
};

@Component({
  selector: "app-tournament-availability-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    TournamentAvailabilityDialogContentComponent,
  ],
  templateUrl: "./tournament-availability-dialog.component.html",
})
export class TournamentAvailabilityDialogComponent {
  visible = input<boolean>(false);
  tournament = input<Tournament | null>(null);
  dateRangeLabel = input<string>("");
  availabilityForm = input.required<FormGroup>();
  availabilityOptions = input.required<AvailabilityOption[]>();
  currentStatus = input<AvailabilityStatus>("pending");
  tournamentCost = input<number>(0);
  saving = input<boolean>(false);

  visibleChange = output<boolean>();
  setStatus = output<AvailabilityStatus>();
  save = output<void>();
}
