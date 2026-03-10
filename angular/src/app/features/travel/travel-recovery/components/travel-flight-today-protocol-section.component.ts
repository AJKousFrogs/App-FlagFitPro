import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import { StatusTagSeverity } from "../../../../shared/components/status-tag/status-tag.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { RecoveryProtocol } from "../../../../core/services/travel-recovery.service";

@Component({
  selector: "app-travel-flight-today-protocol-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardShellComponent, StatusTagComponent],
  templateUrl: "./travel-flight-today-protocol-section.component.html",
  styleUrl: "./travel-flight-today-protocol-section.component.scss",
})
export class TravelFlightTodayProtocolSectionComponent {
  protocol = input.required<RecoveryProtocol>();
  phaseSeverity = input.required<StatusTagSeverity>();

  getIntensityColor(intensity: string): StatusTagSeverity {
    switch (intensity) {
      case "full":
        return "success";
      case "moderate":
        return "info";
      case "light":
        return "warning";
      case "none":
        return "danger";
      default:
        return "secondary";
    }
  }

  getImportanceColor(importance: string): StatusTagSeverity {
    switch (importance) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  }
}
