import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import { EvidenceReference } from "../../../../core/services/flag-football-periodization.service";

@Component({
  selector: "app-periodization-research-tab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: "./periodization-research-tab.component.html",
  styleUrl: "./periodization-research-tab.component.scss",
})
export class PeriodizationResearchTabComponent {
  readonly references = input<EvidenceReference[]>([]);
}
