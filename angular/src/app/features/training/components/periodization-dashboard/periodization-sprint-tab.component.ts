import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Chip } from "primeng/chip";

import { SprintPhaseGuidelines } from "../../../../core/services/sprint-training-knowledge.service";

@Component({
  selector: "app-periodization-sprint-tab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Chip],
  templateUrl: "./periodization-sprint-tab.component.html",
  styleUrl: "./periodization-sprint-tab.component.scss",
})
export class PeriodizationSprintTabComponent {
  @Input() guidelines: SprintPhaseGuidelines | null = null;
  @Input() recommendedProtocols: string[] = [];
  @Input() avoidProtocols: string[] = [];
  @Input() tips: string[] = [];
}
