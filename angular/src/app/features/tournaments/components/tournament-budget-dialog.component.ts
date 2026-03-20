import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormGroup } from "@angular/forms";

import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { TournamentBudgetDialogContentComponent } from "./tournament-budget-dialog-content.component";

@Component({
  selector: "app-tournament-budget-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    TournamentBudgetDialogContentComponent,
  ],
  templateUrl: "./tournament-budget-dialog.component.html",
})
export class TournamentBudgetDialogComponent {
  visible = input<boolean>(false);
  budgetForm = input.required<FormGroup>();
  totalEstimatedCost = input<number>(0);
  totalFunding = input<number>(0);
  playerShare = input<number>(0);
  confirmedPlayers = input<number>(0);
  saving = input<boolean>(false);

  visibleChange = output<boolean>();
  save = output<void>();
}
