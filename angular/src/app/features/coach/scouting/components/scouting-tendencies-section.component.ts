import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Select, type SelectChangeEvent } from "primeng/select";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";

export interface ScoutingTendencyFilterOption {
  label: string;
  value: string;
}

export interface ScoutingTendenciesView {
  offensive: {
    formationFrequency: { formation: string; percentage: number }[];
    playTypeDistribution: {
      quickPass: number;
      deepPass: number;
      qbRun: number;
      screen: number;
    };
    redZoneTendencies: string[];
    favoriteTargets: { player: string; targetShare: number }[];
  };
  defensive: {
    coverageFrequency: { coverage: string; percentage: number }[];
    blitzRate: number;
    blitzTendencies: string[];
    weaknesses: string[];
  };
  specialSituations: {
    twoPointPlays: string[];
    hurryUpOffense: string[];
    endOfHalfStrategy: string[];
  };
}

@Component({
  selector: "app-scouting-tendencies-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Select, CardShellComponent],
  templateUrl: "./scouting-tendencies-section.component.html",
  styleUrl: "./scouting-tendencies-section.component.scss",
})
export class ScoutingTendenciesSectionComponent {
  readonly filterOptions = input.required<ScoutingTendencyFilterOption[]>();
  readonly selectedOpponentId = input<string | null>(null);
  readonly tendencies = input<ScoutingTendenciesView | null>(null);

  readonly filterChange = output<string | null>();

  emitFilterChange(event: SelectChangeEvent): void {
    this.filterChange.emit(
      typeof event.value === "string" ? event.value : null,
    );
  }
}
