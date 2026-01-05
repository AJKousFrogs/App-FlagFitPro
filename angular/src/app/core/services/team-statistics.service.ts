import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ConsentInfo {
  blockedPlayerIds: string[];
  blockedCount: number;
  accessibleCount: number;
}

export interface TeamOverviewStats {
  teamId: string;
  teamName: string;
  season: string;

  // Record
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  streak: string; // e.g., "W3" or "L1"

  // Squad
  totalPlayers: number;
  activePlayers: number;
  injuredPlayers: number;

  // Ratings
  overallRating: number;
  offenseRating: number;
  defenseRating: number;
  teamChemistry: number;

  // Attendance
  practiceAttendanceRate: number;
  gameAttendanceRate: number;

  // Training
  avgTeamWorkload: number;
  playersAtRisk: number;
  trainingConsistency: number;

  // Consent
  consentInfo?: ConsentInfo;
  dataState?: string;
}

export interface PlayerPerformanceStats {
  playerId: string;
  playerName: string;
  position: string;
  jerseyNumber?: string;
  avatarInitials: string;
  status: "active" | "injured" | "inactive" | "at_risk";

  // Overall
  performanceScore: number;
  performanceTrend: "up" | "down" | "stable";
  gamesPlayed: number;
  gamesMissed: number;
  attendanceRate: number;

  // Workload & Risk
  workload: number;
  acwr: number;
  readiness: number;
  riskLevel: "low" | "medium" | "high";

  // Position-specific stats (varies by position)
  positionStats: PositionStats;

  // Consent
  _consentBlocked?: boolean;
}

export interface PositionStats {
  // QB Stats
  passAttempts?: number;
  completions?: number;
  completionPercentage?: number;
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  qbRating?: number;

  // Receiving Stats
  targets?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  catchRate?: number;
  drops?: number;
  yardsAfterCatch?: number;

  // Rushing Stats
  rushAttempts?: number;
  rushingYards?: number;
  rushingTDs?: number;
  yardsPerCarry?: number;

  // Defensive Stats
  flagPulls?: number;
  flagPullAttempts?: number;
  flagPullSuccessRate?: number;
  interceptionsDef?: number;
  passDeflections?: number;
}

export interface GameResult {
  gameId: string;
  date: Date;
  opponent: string;
  opponentLogo?: string;
  location: "home" | "away" | "neutral";
  result: "win" | "loss" | "tie";
  teamScore: number;
  opponentScore: number;
  gameType: string;
  highlights?: string[];
}

export interface UpcomingGame {
  gameId: string;
  date: Date;
  opponent: string;
  opponentLogo?: string;
  location: string;
  gameType: string;
  daysUntil: number;
  teamReadiness: number;
}

export interface TrainingSession {
  sessionId: string;
  date: Date;
  time: string;
  title: string;
  type: "practice" | "game_prep" | "conditioning" | "film_study";
  duration: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  attendanceCount?: number;
  totalPlayers?: number;
}

export interface TeamMessage {
  messageId: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  type: "announcement" | "player" | "coach" | "system";
  isRead: boolean;
}

export interface RiskAlert {
  playerId: string;
  playerName: string;
  position: string;
  alertType:
    | "high_acwr"
    | "low_readiness"
    | "injury_risk"
    | "overtraining"
    | "undertraining";
  severity: "warning" | "critical";
  message: string;
  recommendation: string;
  acwr?: number;
  readiness?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class TeamStatisticsService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  /**
   * Get comprehensive team overview statistics
   */
  getTeamOverview(teamId: string): Observable<TeamOverviewStats> {
    return this.apiService
      .get<TeamOverviewStats>(API_ENDPOINTS.coach.dashboard, { teamId })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return {
              ...response.data,
              consentInfo: response.data.consentInfo,
              dataState: response.data.dataState,
            };
          }
          throw new Error("No team overview data available");
        }),
        catchError((error) => {
          this.logger.error("Error loading real team overview data:", error);
          throw error;
        }),
      );
  }

  /**
   * Get all players with their performance statistics
   */
  getTeamPlayersStats(teamId: string): Observable<{
    members: PlayerPerformanceStats[];
    consentInfo?: ConsentInfo;
    dataState?: string;
  }> {
    interface TeamResponse {
      success: boolean;
      data?: {
        members?: PlayerPerformanceStats[];
        consentInfo?: ConsentInfo;
        dataState?: string;
      } | PlayerPerformanceStats[];
    }
    return this.apiService.get<TeamResponse>(API_ENDPOINTS.coach.team, { teamId }).pipe(
      map((response) => {
        if (response.success && response.data) {
          const data = response.data;
          if (Array.isArray(data)) {
            return {
              members: this.processPlayersData(data),
              consentInfo: undefined,
              dataState: undefined,
            };
          }
          const members = Array.isArray(data.members) ? data.members : [];
          return {
            members: this.processPlayersData(members),
            consentInfo: data.consentInfo,
            dataState: data.dataState,
          };
        }
        throw new Error("No team players stats available");
      }),
      catchError((error) => {
        this.logger.error("Error loading real players stats:", error);
        throw error;
      }),
    );
  }

  /**
   * Get recent game results
   */
  getRecentGames(teamId: string, limit: number = 5): Observable<GameResult[]> {
    return this.apiService
      .get<
        GameResult[]
      >(API_ENDPOINTS.games.list, { teamId, limit, past: true })
      .pipe(
        map((response) => {
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            return this.processGamesData(response.data);
          }
          throw new Error("No recent games data available");
        }),
        catchError((error) => {
          this.logger.error("Error loading real recent games:", error);
          throw error;
        }),
      );
  }

  /**
   * Get upcoming games/fixtures
   */
  getUpcomingGames(
    teamId: string,
    limit: number = 5,
  ): Observable<UpcomingGame[]> {
    return this.apiService
      .get<UpcomingGame[]>(API_ENDPOINTS.coach.games, { teamId, limit })
      .pipe(
        map((response) => {
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            return this.processUpcomingGames(response.data);
          }
          throw new Error("No upcoming games data available");
        }),
        catchError((error) => {
          this.logger.error("Error loading real upcoming games:", error);
          throw error;
        }),
      );
  }

  /**
   * Get training schedule
   */
  getTrainingSchedule(
    teamId: string,
    days: number = 7,
  ): Observable<TrainingSession[]> {
    return this.apiService
      .get<TrainingSession[]>(API_ENDPOINTS.training.sessions, { teamId, days })
      .pipe(
        map((response) => {
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            return response.data;
          }
          throw new Error("No training schedule data available");
        }),
        catchError((error) => {
          this.logger.error("Error loading real training sessions:", error);
          throw error;
        }),
      );
  }

  /**
   * Get risk alerts for players needing attention
   */
  getRiskAlerts(teamId: string): Observable<RiskAlert[]> {
    return this.apiService
      .get<RiskAlert[]>(API_ENDPOINTS.analytics.injuryRisk, { teamId })
      .pipe(
        map((response) => {
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            return response.data;
          }
          throw new Error("No risk alerts available");
        }),
        catchError((error) => {
          this.logger.error("Error loading real risk alerts:", error);
          throw error;
        }),
      );
  }

  /**
   * Get team messages/communications
   */
  getTeamMessages(
    teamId: string,
    limit: number = 10,
  ): Observable<TeamMessage[]> {
    return this.apiService
      .get<TeamMessage[]>(API_ENDPOINTS.community.feed, { teamId, limit })
      .pipe(
        map((response) => {
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            return response.data;
          }
          throw new Error("No team messages available");
        }),
        catchError((error) => {
          this.logger.error("Error loading real team messages:", error);
          throw error;
        }),
      );
  }

  /**
   * Get team performance trend data for charts
   */
  getPerformanceTrend(
    teamId: string,
    weeks: number = 10,
  ): Observable<{ labels: string[]; scores: number[] }> {
    return this.apiService
      .get<{
        labels: string[];
        scores: number[];
      }>(API_ENDPOINTS.analytics.performanceTrends, { teamId, weeks })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error("No performance trend data available");
        }),
        catchError((error) => {
          this.logger.error("Error loading real performance trend:", error);
          throw error;
        }),
      );
  }

  // ============================================================================
  // DATA PROCESSING HELPERS
  // ============================================================================

  private processPlayersData(players: unknown[]): PlayerPerformanceStats[] {
    return players.map((p: unknown) => {
      const player = p as Record<string, unknown>;
      const name = String(player["name"] || player["full_name"] || "Unknown");
      const acwr = Number(player["acwr"]) || 1.0;
      const readiness = Number(player["readiness"]) || 75;

      let riskLevel: "low" | "medium" | "high" = "low";
      if (acwr > 1.5 || readiness < 55) {
        riskLevel = "high";
      } else if (acwr > 1.3 || readiness < 70) {
        riskLevel = "medium";
      }

      let status: "active" | "injured" | "inactive" | "at_risk" = "active";
      if (player["status"] === "injured") status = "injured";
      else if (player["status"] === "inactive") status = "inactive";
      else if (riskLevel === "high") status = "at_risk";

      return {
        playerId: String(player["id"] || player["user_id"] || ""),
        playerName: name,
        position: String(player["position"] || "N/A"),
        jerseyNumber: player["jersey_number"]
          ? String(player["jersey_number"])
          : undefined,
        avatarInitials: this.getInitials(name),
        status,
        performanceScore:
          Number(player["performance_score"] || player["overall_rating"]) || 75,
        performanceTrend: this.getTrend(player["performance_trend"]),
        gamesPlayed: Number(player["games_played"]) || 0,
        gamesMissed: Number(player["games_missed"]) || 0,
        attendanceRate: Number(player["attendance_rate"]) || 90,
        workload: Number(player["workload"] || player["today_workload"]) || 0,
        acwr,
        readiness,
        riskLevel,
        positionStats: this.extractPositionStats(player),
      };
    });
  }

  private processGamesData(games: unknown[]): GameResult[] {
    return games.map((g: unknown) => {
      const game = g as Record<string, unknown>;
      const teamScore = Number(game["team_score"] || game["our_score"]) || 0;
      const opponentScore = Number(game["opponent_score"]) || 0;

      let result: "win" | "loss" | "tie" = "tie";
      if (teamScore > opponentScore) result = "win";
      else if (teamScore < opponentScore) result = "loss";

      return {
        gameId: String(game["id"] || game["game_id"] || ""),
        date: new Date(String(game["date"] || game["game_date"] || new Date())),
        opponent: String(game["opponent"] || game["opponent_name"] || "TBD"),
        location: (game["location"] as "home" | "away" | "neutral") || "home",
        result,
        teamScore,
        opponentScore,
        gameType: String(game["game_type"] || "Regular Season"),
      };
    });
  }

  private processUpcomingGames(games: unknown[]): UpcomingGame[] {
    const now = new Date();
    return games
      .map((g: unknown) => {
        const game = g as Record<string, unknown>;
        const date = new Date(
          String(
            game["date"] ||
              game["game_start"] ||
              game["game_date"] ||
              new Date(),
          ),
        );
        const daysUntil = Math.ceil(
          (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          gameId: String(game["id"] || game["game_id"] || ""),
          date,
          opponent: String(game["opponent"] || game["opponent_name"] || "TBD"),
          location: String(game["location"] || "TBD"),
          gameType: String(game["game_type"] || "Game"),
          daysUntil,
          teamReadiness: Number(game["team_readiness"]) || 85,
        };
      })
      .filter((g) => g.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  private extractPositionStats(player: Record<string, unknown>): PositionStats {
    return {
      passAttempts: player["pass_attempts"] as number | undefined,
      completions: player["completions"] as number | undefined,
      completionPercentage: player["completion_percentage"] as
        | number
        | undefined,
      passingYards: player["passing_yards"] as number | undefined,
      passingTDs: player["passing_tds"] as number | undefined,
      interceptions: player["interceptions"] as number | undefined,
      qbRating: player["qb_rating"] as number | undefined,
      targets: player["targets"] as number | undefined,
      receptions: player["receptions"] as number | undefined,
      receivingYards: player["receiving_yards"] as number | undefined,
      receivingTDs: player["receiving_tds"] as number | undefined,
      catchRate: player["catch_rate"] as number | undefined,
      drops: player["drops"] as number | undefined,
      yardsAfterCatch: player["yards_after_catch"] as number | undefined,
      rushAttempts: player["rush_attempts"] as number | undefined,
      rushingYards: player["rushing_yards"] as number | undefined,
      rushingTDs: player["rushing_tds"] as number | undefined,
      yardsPerCarry: player["yards_per_carry"] as number | undefined,
      flagPulls: player["flag_pulls"] as number | undefined,
      flagPullAttempts: player["flag_pull_attempts"] as number | undefined,
      flagPullSuccessRate: player["flag_pull_success_rate"] as
        | number
        | undefined,
      interceptionsDef: player["interceptions_def"] as number | undefined,
      passDeflections: player["pass_deflections"] as number | undefined,
    };
  }

  private getInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private getTrend(value: unknown): "up" | "down" | "stable" {
    if (typeof value === "string") {
      if (value === "up" || value === "improving") return "up";
      if (value === "down" || value === "declining") return "down";
    }
    if (typeof value === "number") {
      if (value > 0) return "up";
      if (value < 0) return "down";
    }
    return "stable";
  }
}
