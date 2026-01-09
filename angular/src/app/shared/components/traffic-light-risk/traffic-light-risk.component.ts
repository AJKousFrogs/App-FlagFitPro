/**
 * Traffic Light Risk Component
 *
 * Visual indicator for ACWR-based injury risk assessment.
 * Uses a horizontal traffic light design for compact dashboard display.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 *
 * @author FlagFit Pro Team
 * @version 2.0.0
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RiskZone } from "../../../core/models/acwr.models";

@Component({
  selector: "app-traffic-light-risk",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: "./traffic-light-risk.component.html",
  styleUrls: ["./traffic-light-risk.component.scss"],
})
export class TrafficLightRiskComponent {
  // Angular signals for inputs
  riskZone = input.required<RiskZone>();
  acwrValue = input.required<number>();
  compact = input<boolean>(false);

  currentRisk = computed(() => this.riskZone());

  // Calculate marker position on the scale bar
  markerPosition = computed(() => {
    const value = this.acwrValue();
    if (value < 0.8) {
      // Under training zone: 0-20%
      return (value / 0.8) * 20;
    } else if (value < 1.3) {
      // Sweet spot zone: 20-70%
      return 20 + ((value - 0.8) / 0.5) * 50;
    } else if (value < 1.5) {
      // Elevated risk zone: 70-90%
      return 70 + ((value - 1.3) / 0.2) * 20;
    } else {
      // Danger zone: 90-100%
      return 90 + Math.min(((value - 1.5) / 0.5) * 10, 10);
    }
  });

  // Get CSS class for ACWR value color
  getAcwrClass(): string {
    const level = this.currentRisk().level;
    switch (level) {
      case "sweet-spot":
        return "optimal";
      case "elevated-risk":
        return "warning";
      case "danger-zone":
        return "danger";
      case "under-training":
        return "under";
      default:
        return "no-data";
    }
  }
}
