import { Injectable, inject } from "@angular/core";
import { forkJoin } from "rxjs";

import {
  MissingDataDetectionService,
  type PlayerMissingData,
} from "../../../core/services/missing-data-detection.service";
import { ContinuityIndicatorsService } from "../../../core/services/continuity-indicators.service";
import {
  OwnershipTransitionService,
  type OwnershipTransition,
} from "../../../core/services/ownership-transition.service";
import {
  TeamStatisticsService,
} from "../../../core/services/team-statistics.service";

export interface CoachDashboardFollowUpSnapshot {
  playersWithMissingData: PlayerMissingData[];
  teamContinuity: {
    gameDayRecovery: Array<{
      playerId: string;
      playerName: string;
      dayNumber: number;
    }>;
    loadCaps: Array<{
      playerId: string;
      playerName: string;
      sessionsRemaining: number;
    }>;
    travelRecovery: Array<{
      playerId: string;
      playerName: string;
      daysRemaining: number;
    }>;
  };
  pendingTransitions: OwnershipTransition[];
}

@Injectable({
  providedIn: "root",
})
export class CoachDashboardDataService {
  private readonly teamStatsService = inject(TeamStatisticsService);
  private readonly missingDataService = inject(MissingDataDetectionService);
  private readonly continuityService = inject(ContinuityIndicatorsService);
  private readonly ownershipTransitionService = inject(OwnershipTransitionService);

  loadDashboardSnapshot(teamId: string) {
    return forkJoin({
      overview: this.teamStatsService.getTeamOverview(teamId),
      players: this.teamStatsService.getTeamPlayersStats(teamId),
      recentGames: this.teamStatsService.getRecentGames(teamId, 5),
      upcomingGames: this.teamStatsService.getUpcomingGames(teamId, 5),
      trainingSessions: this.teamStatsService.getTrainingSchedule(teamId, 7),
      riskAlerts: this.teamStatsService.getRiskAlerts(teamId),
      performanceTrend: this.teamStatsService.getPerformanceTrend(teamId, 10),
    });
  }

  async loadFollowUpSnapshot(teamId: string): Promise<CoachDashboardFollowUpSnapshot> {
    const [playersWithMissingData, teamContinuity, transitions] =
      await Promise.all([
        this.missingDataService.getPlayersWithMissingWellness(teamId),
        this.continuityService.getTeamContinuity(teamId),
        this.ownershipTransitionService.getPendingTransitions("coach", 10),
      ]);

    return {
      playersWithMissingData,
      teamContinuity,
      pendingTransitions: transitions,
    };
  }
}
