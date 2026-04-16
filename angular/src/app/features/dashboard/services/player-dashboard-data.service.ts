import { Injectable, inject } from "@angular/core";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs";
import { SupabaseService } from "../../../core/services/supabase.service";
import {
  TrainingStatsCalculationService,
  type TrainingStatsData,
} from "../../../core/services/training-stats-calculation.service";
import {
  TrainingDataService,
  type TrainingSession,
} from "../../../core/services/training-data.service";
import { LoggerService } from "../../../core/services/logger.service";
import {
  OverrideLoggingService,
  type CoachOverride,
} from "../../../core/services/override-logging.service";
import {
  OwnershipTransitionService,
  type OwnershipTransition,
} from "../../../core/services/ownership-transition.service";
import {
  MissingDataDetectionService,
  type MissingDataStatus,
} from "../../../core/services/missing-data-detection.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

export interface CoachProfileRecord {
  id: string;
  full_name?: string | null;
}

export interface PlayerDashboardTrainingSnapshot {
  stats: TrainingStatsData | null;
  weekSessions: TrainingSession[];
  trendSessions: TrainingSession[];
}

export interface PlayerDashboardTrustSnapshot {
  overrides: CoachOverride[];
  activeTransitions: OwnershipTransition[];
  missingWellnessStatus: MissingDataStatus | null;
}

@Injectable({
  providedIn: "root",
})
export class PlayerDashboardDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly trainingStatsService = inject(TrainingStatsCalculationService);
  private readonly trainingDataService = inject(TrainingDataService);
  private readonly logger = inject(LoggerService);
  private readonly overrideLoggingService = inject(OverrideLoggingService);
  private readonly ownershipTransitionService = inject(OwnershipTransitionService);
  private readonly missingDataDetectionService = inject(MissingDataDetectionService);
  private usersTableUnavailable = false;

  async fetchCoachProfiles(
    coachIds: string[],
  ): Promise<{ profiles: CoachProfileRecord[]; error: { message?: string } | null }> {
    if (this.usersTableUnavailable || coachIds.length === 0) {
      return { profiles: [], error: null };
    }

    const { data: profiles, error } = await this.supabaseService.client
      .from("users")
      .select("id, full_name")
      .in("id", coachIds);

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { profiles: [], error: null };
    }

    return { profiles: profiles ?? [], error };
  }

  loadTrainingSnapshot(
    weekStart: string,
    weekEnd: string,
    trendStart: string,
    today: string,
  ) {
    return forkJoin({
      stats: this.trainingStatsService.getTrainingStats().pipe(
        catchError((error) => {
          this.logger.error("player_dashboard_training_stats_failed", error);
          return of(null as TrainingStatsData | null);
        }),
      ),
      weekSessions: this.trainingDataService
        .getTrainingSessions({
          startDate: weekStart,
          endDate: weekEnd,
        })
        .pipe(
          catchError((error) => {
            this.logger.error("player_dashboard_week_sessions_failed", error);
            return of([] as TrainingSession[]);
          }),
        ),
      trendSessions: this.trainingDataService
        .getTrainingSessions({
          startDate: trendStart,
          endDate: today,
        })
        .pipe(
          catchError((error) => {
            this.logger.error("player_dashboard_trend_sessions_failed", error);
            return of([] as TrainingSession[]);
          }),
        ),
    });
  }

  async loadTrustSnapshot(userId: string): Promise<PlayerDashboardTrustSnapshot> {
    const [overrides, transitions, missingWellnessStatus] = await Promise.all([
      this.overrideLoggingService.getRecentUnreadOverrides(userId, 5),
      this.ownershipTransitionService.getPlayerTransitions(userId, 5),
      this.missingDataDetectionService.checkMissingWellness(userId),
    ]);

    return {
      overrides,
      activeTransitions: transitions.filter(
        (transition) =>
          transition.status === "pending" || transition.status === "in_progress",
      ),
      missingWellnessStatus,
    };
  }
}
