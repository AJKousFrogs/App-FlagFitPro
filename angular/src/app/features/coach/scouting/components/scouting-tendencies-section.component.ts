import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { SelectComponent } from "../../../../shared/components/select/select.component";
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
  imports: [SelectComponent, CardShellComponent],
  templateUrl: "./scouting-tendencies-section.component.html",
  styleUrl: "./scouting-tendencies-section.component.scss",
})
export class ScoutingTendenciesSectionComponent {
  readonly filterOptions = input.required<ScoutingTendencyFilterOption[]>();
  readonly selectedOpponentId = input<string | null>(null);
  readonly tendencies = input<ScoutingTendenciesView | null>(null);

  readonly filterChange = output<string | null>();

  emitFilterChange(value: string | null): void {
    this.filterChange.emit(value);
  }
}
