import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Avatar } from "primeng/avatar";
import { Badge } from "primeng/badge";
import { Tooltip } from "primeng/tooltip";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { TableComponent } from "../../../shared/components/table/table.component";
import {
  getMappedStatusSeverity,
  playerStatusSeverityMap,
} from "../../../shared/utils/status.utils";
import { PlayerPerformanceStats } from "../../../core/services/team-statistics.service";

export type CoachDashboardPlayerFilter = "all" | "starters" | "injured" | "at_risk";

@Component({
  selector: "app-coach-dashboard-roster-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    Tooltip,
    Avatar,
    Badge,
    ButtonComponent,
    StatusTagComponent,
    TableComponent
  ],
  templateUrl: "./coach-dashboard-roster-section.component.html",
  styleUrl: "./coach-dashboard-roster-section.component.scss",
})
export class CoachDashboardRosterSectionComponent {
  readonly filteredPlayers = input.required<PlayerPerformanceStats[]>();
  readonly playerFilter = input.required<CoachDashboardPlayerFilter>();
  readonly overrideCounts = input.required<Record<string, number>>();

  readonly filterChange = output<CoachDashboardPlayerFilter>();
  readonly selectPlayer = output<string>();
  readonly requestDataAccess = output<string>();
  readonly viewOverrideHistory = output<string>();

  protected setFilter(filter: CoachDashboardPlayerFilter): void {
    this.filterChange.emit(filter);
  }

  protected openPlayer(playerId: string): void {
    this.selectPlayer.emit(playerId);
  }

  protected requestAccess(playerId: string, event: Event): void {
    event.stopPropagation();
    this.requestDataAccess.emit(playerId);
  }

  protected openOverrideHistory(playerId: string, event: Event): void {
    event.stopPropagation();
    this.viewOverrideHistory.emit(playerId);
  }

  protected getAvatarClass(player: PlayerPerformanceStats): string {
    if (player.status === "injured") {
      return "performance-avatar performance-avatar--injured";
    }
    if (player.riskLevel === "high") {
      return "performance-avatar performance-avatar--high-risk";
    }
    return "performance-avatar performance-avatar--standard";
  }

  protected getPositionSeverity(
    position: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    const positionColors: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      QB: "success",
      WR: "info",
      RB: "warning",
      DB: "secondary",
      Rusher: "danger",
    };
    return positionColors[position] || "info";
  }

  protected getPerformanceClass(score: number): string {
    if (score >= 90) return "excellent";
    if (score >= 80) return "good";
    if (score >= 70) return "average";
    return "poor";
  }

  protected getAcwrClass(acwr: number): string {
    if (acwr <= 1.0) return "acwr-safe";
    if (acwr <= 1.3) return "acwr-moderate";
    if (acwr <= 1.5) return "acwr-high";
    return "acwr-danger";
  }

  protected getReadinessBarClass(readiness: number): string {
    if (readiness >= 75) return "readiness-high";
    if (readiness >= 55) return "readiness-medium";
    return "readiness-low";
  }

  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: "Active",
      injured: "Injured",
      inactive: "Inactive",
      at_risk: "At Risk",
    };
    return labels[status] || status;
  }

  protected getStatusSeverity(
    status: string,
  ): "success" | "info" | "warning" | "danger" {
    return getMappedStatusSeverity(status, playerStatusSeverityMap, "info");
  }

  protected getPlayerOverrideCount(playerId: string): number {
    return this.overrideCounts()[playerId] || 0;
  }
}
