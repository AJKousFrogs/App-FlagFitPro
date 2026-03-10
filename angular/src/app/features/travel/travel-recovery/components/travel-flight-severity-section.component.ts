import { CommonModule, TitleCasePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { Chip } from "primeng/chip";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";

import {
  StatusTagComponent,
  StatusTagSeverity,
} from "../../../../shared/components/status-tag/status-tag.component";
import {
  JetLagSeverity,
  TravelPlan,
} from "../../../../core/services/travel-recovery.service";

@Component({
  selector: "app-travel-flight-severity-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TitleCasePipe,
    Chip,
    CardShellComponent,
    StatusTagComponent,
  ],
  templateUrl: "./travel-flight-severity-section.component.html",
  styleUrl: "./travel-flight-severity-section.component.scss",
})
export class TravelFlightSeveritySectionComponent {
  readonly currentPlan = input.required<TravelPlan | null>();
  readonly jetLagSeverity = input.required<JetLagSeverity>();
  readonly daysUntilCompetition = input.required<number | null>();
  readonly isCompetitionReady = input.required<boolean>();
  readonly severityColor = input.required<StatusTagSeverity>();

  protected readonly Math = Math;
}
