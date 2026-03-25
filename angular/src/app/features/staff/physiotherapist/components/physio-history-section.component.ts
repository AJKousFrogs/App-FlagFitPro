import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Select, type SelectChangeEvent } from "primeng/select";

import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";

interface InjuryHistoryView {
  totalInjuries: number;
  daysSinceLastInjury: number | null;
  injuriesByType: { type: string; count: number; avgRecoveryDays: number }[];
  recurrentInjuries: string[];
}

@Component({
  selector: "app-physio-history-section",
  standalone: true,
  imports: [CommonModule, FormsModule, Select, CardShellComponent],
  templateUrl: "./physio-history-section.component.html",
  styleUrl: "./physio-history-section.component.scss",
})
export class PhysioHistorySectionComponent {
  readonly selectedAthlete = input.required<string | null>();
  readonly athleteOptions = input.required<Array<{ label: string; value: string }>>();
  readonly history = input.required<InjuryHistoryView | null>();

  readonly athleteChange = output<string | null>();

  emitAthleteChange(event: SelectChangeEvent): void {
    this.athleteChange.emit((event.value as string | null | undefined) ?? null);
  }
}
