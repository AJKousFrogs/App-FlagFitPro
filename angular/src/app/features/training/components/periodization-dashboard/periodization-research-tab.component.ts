import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

import { EvidenceReference } from "../../../../core/services/flag-football-periodization.service";

@Component({
  selector: "app-periodization-research-tab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: "./periodization-research-tab.component.html",
  styleUrl: "./periodization-research-tab.component.scss",
})
export class PeriodizationResearchTabComponent {
  @Input() references: EvidenceReference[] = [];
}
