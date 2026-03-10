import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";

@Component({
  selector: "app-tournament-budget-dialog-content",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputNumber, InputText],
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
