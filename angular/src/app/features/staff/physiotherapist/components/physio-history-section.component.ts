import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SelectComponent } from "../../../../shared/components/select/select.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectComponent, CardShellComponent],
  templateUrl: "./physio-history-section.component.html",
  styleUrl: "./physio-history-section.component.scss",
})
export class PhysioHistorySectionComponent {
  readonly selectedAthlete = input.required<string | null>();
  readonly athleteOptions = input.required<{ label: string; value: string }[]>();
  readonly history = input.required<InjuryHistoryView | null>();

  readonly athleteChange = output<string | null>();

  emitAthleteChange(value: string | null | undefined): void {
    this.athleteChange.emit(value ?? null);
  }
}
