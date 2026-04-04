import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { Chip } from "primeng/chip";

import { SprintPhaseGuidelines } from "../../../../core/services/sprint-training-knowledge.service";

@Component({
  selector: "app-periodization-sprint-tab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chip],
  templateUrl: "./periodization-sprint-tab.component.html",
  styleUrl: "./periodization-sprint-tab.component.scss",
})
export class PeriodizationSprintTabComponent {
  readonly guidelines = input<SprintPhaseGuidelines | null>(null);
  readonly recommendedProtocols = input<string[]>([]);
  readonly avoidProtocols = input<string[]>([]);
  readonly tips = input<string[]>([]);
}
