import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { BadgeComponent } from "../../../shared/components/badge/badge.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { SemanticMeaningRendererComponent } from "../../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { PlayerMissingData } from "../../../core/services/missing-data-detection.service";
import { RiskAlert } from "../../../core/services/team-statistics.service";
import { RiskMeaning } from "../../../core/semantics/semantic-meaning.types";

@Component({
  selector: "app-coach-dashboard-priority-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    SemanticMeaningRendererComponent,
    StatusTagComponent,
  ],
  templateUrl: "./coach-dashboard-priority-section.component.html",
  styleUrl: "./coach-dashboard-priority-section.component.scss",
})
export class CoachDashboardPrioritySectionComponent {
  merlinCoachInsight = input.required<string>();
  riskAlerts = input<RiskAlert[]>([]);
  playersWithMissingData = input<PlayerMissingData[]>([]);
  nextGenEnabled = input(false);

  viewPlayer = output<string>();

  getPlayerInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getMissingDataSeverity(
    severity: string,
  ): "success" | "info" | "warning" | "danger" {
    switch (severity) {
      case "critical":
        return "danger";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  }

  getRiskMeaningForAlert(alert: RiskAlert): RiskMeaning | null {
    if (alert.alertType !== "high_acwr" || !alert.acwr || alert.acwr <= 1.3) {
      return null;
    }

    let severity: RiskMeaning["severity"] = "moderate";
    if (alert.acwr > 1.5) {
      severity = "critical";
    } else if (alert.acwr > 1.3) {
      severity = "high";
    }

    return {
      type: "risk",
      severity,
      source: "acwr",
      affectedEntity: `player-${alert.playerId}`,
      message:
        alert.message ||
        `ACWR is ${alert.acwr.toFixed(2)} - injury risk elevated`,
      recommendation: `Review training load for ${alert.playerName}. Consider reducing load by ${severity === "critical" ? "20-30%" : "15-20%"}.`,
    };
  }
}
