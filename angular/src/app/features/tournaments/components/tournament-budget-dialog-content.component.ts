import { Component, input } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { InputNumberComponent } from "../../../shared/components/input-number/input-number.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";

@Component({
  selector: "app-tournament-budget-dialog-content",
  standalone: true,
  imports: [ReactiveFormsModule, InputNumberComponent, FormInputComponent, DecimalPipe],
  templateUrl: "./tournament-budget-dialog-content.component.html",
  styleUrl: "./tournament-budget-dialog-content.component.scss",
})
export class TournamentBudgetDialogContentComponent {
  readonly budgetForm = input.required<FormGroup>();
  readonly totalEstimatedCost = input(0);
  readonly totalFunding = input(0);
  readonly playerShare = input(0);
  readonly confirmedPlayers = input(0);
}
