import { Injectable, inject } from "@angular/core";
import { Observable, map, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { StatisticsCalculationService } from "./statistics-calculation.service";
import { LoggerService } from "./logger.service";
import { toLogContext } from "./logger.service";
import type { ApiResponse } from "@shared/types";

export interface PlayerGameStats {
  gameId: string;
  gameDate: string;
  opponent: string;
  present: boolean;
  // Passing stats
  passAttempts: number;
  completions: number;
  passingYards: number;
  touchdowns: number;
  interceptions: number;
  snapAccuracy: number;
  throwAccuracy: number;
  // Receiving stats
  targets: number;
  receptions: number;
  receivingYards: number;
  drops: number;
  // Rushing stats
  rushingAttempts: number;
  rushingYards: number;
  // Defensive stats
  flagPullAttempts: number;
  flagPulls: number;
  interceptionsDef: number;
  passDeflections: number;
}

// Extended interface for API responses that include raw accuracy arrays
interface PlayerGameStatsApiResponse extends Partial<PlayerGameStats> {
  id?: string;
  date?: string;
  hasStats?: boolean;
  snapAccuracies?: (string | number)[];
  throwAccuracies?: (string | number)[];
}

export interface PlayerTournamentStats extends PlayerGameStats {
  tournamentId: string;
  tournamentName: string;
  gamesPlayed: number;
  gamesMissed: number;
}

export interface PlayerSeasonStats {
  season: string;
  gamesPlayed: number;
  gamesMissed: number;
  totalGames: number;
  attendanceRate: number;
  // Aggregated stats
  totalPassAttempts: number;
  totalCompletions: number;
  totalPassingYards: number;
  totalTouchdowns: number;
  totalInterceptions: number;
  totalTargets: number;
  totalReceptions: number;
  totalReceivingYards: number;
  totalDrops: number;
  totalRushingAttempts: number;
  totalRushingYards: number;
  totalFlagPullAttempts: number;
  totalFlagPulls: number;
  totalInterceptionsDef: number;
  totalPassDeflections: number;
  // Averages
  avgPassingYards: number;
  avgReceivingYards: number;
  avgRushingYards: number;
  completionPercentage: number;
  dropRate: number;
  flagPullSuccessRate: number;
}

export interface PlayerMultiSeasonStats {
  totalSeasons: number;
  totalGamesPlayed: number;
  totalGamesMissed: number;
  overallAttendanceRate: number;
  seasons: PlayerSeasonStats[];
  // Career totals
  careerPassAttempts: number;
  careerCompletions: number;
  careerPassingYards: number;
  careerTouchdowns: number;
  careerInterceptions: number;
  careerTargets: number;
  careerReceptions: number;
  careerReceivingYards: number;
  careerDrops: number;
  careerRushingAttempts: number;
  careerRushingYards: number;
  careerFlagPullAttempts: number;
  careerFlagPulls: number;
  careerInterceptionsDef: number;
  careerPassDeflections: number;
}

@Injectable({
  providedIn: "root",
})
export class PlayerStatisticsService {
  private apiService = inject(ApiService);
  private statsCalcService = inject(StatisticsCalculationService);
  private logger = inject(LoggerService);

  /**
   * Get player statistics for a specific game
   * Uses the games API endpoint: GET /api/games/{gameId}/player-stats?playerId={playerId}
   * If player didn't track stats, they are marked as absent
   */
  getPlayerGameStats(
    playerId: string,
    gameId: string,
  ): Observable<PlayerGameStats> {
    // Use the games endpoint with player-stats sub-route
    return this.apiService
      .get<
        ApiResponse<PlayerGameStatsApiResponse> | PlayerGameStatsApiResponse
      >(`${API_ENDPOINTS.games.details(gameId)}/player-stats`, { playerId })
      .pipe(
        map((response): PlayerGameStats => {
          // Handle both ApiResponse wrapper and direct response
          const apiResponse =
            response as ApiResponse<PlayerGameStatsApiResponse>;
          const stats: PlayerGameStatsApiResponse =
            apiResponse.data ?? (response as PlayerGameStatsApiResponse);
          return {
            gameId: stats.gameId || gameId,
            gameDate: stats.gameDate || "",
            opponent: stats.opponent || "",
            present: stats.present !== false, // Default to true if not specified
            passAttempts: stats.passAttempts || 0,
            completions: stats.completions || 0,
            passingYards: stats.passingYards || 0,
            touchdowns: stats.touchdowns || 0,
            interceptions: stats.interceptions || 0,
            snapAccuracy:
              stats.snapAccuracy ??
              this.calculateAverageAccuracy(stats.snapAccuracies || []),
            throwAccuracy:
              stats.throwAccuracy ??
              this.calculateAverageAccuracy(stats.throwAccuracies || []),
            targets: stats.targets || 0,
            receptions: stats.receptions || 0,
            receivingYards: stats.receivingYards || 0,
            drops: stats.drops || 0,
            rushingAttempts: stats.rushingAttempts || 0,
            rushingYards: stats.rushingYards || 0,
            flagPullAttempts: stats.flagPullAttempts || 0,
            flagPulls: stats.flagPulls || 0,
            interceptionsDef: stats.interceptionsDef || 0,
            passDeflections: stats.passDeflections || 0,
          };
        }),
        catchError((error) => {
          this.logger.error("Error fetching player game stats:", error);
          return of(this.getEmptyPlayerGameStats(gameId));
        }),
      );
  }

  /**
   * Get empty stats structure for error fallback
   */
  private getEmptyPlayerGameStats(gameId: string): PlayerGameStats {
    return {
      gameId,
      gameDate: "",
      opponent: "",
      present: false,
      passAttempts: 0,
      completions: 0,
      passingYards: 0,
      touchdowns: 0,
      interceptions: 0,
      snapAccuracy: 0,
      throwAccuracy: 0,
      targets: 0,
      receptions: 0,
      receivingYards: 0,
      drops: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      flagPullAttempts: 0,
      flagPulls: 0,
      interceptionsDef: 0,
      passDeflections: 0,
    };
  }

  /**
   * Get all games for a player with their stats
   * Uses the games API endpoint: GET /api/games
   * Games where player didn't track stats are marked as missed
   */
  getPlayerAllGames(_playerId: string): Observable<PlayerGameStats[]> {
    // Use the games list endpoint - games are filtered by user's team
    return this.apiService.get<unknown>(API_ENDPOINTS.games.list).pipe(
      map((response): PlayerGameStats[] => {
        // Handle both ApiResponse wrapper and direct array
        const apiResponse = response as ApiResponse<
          PlayerGameStatsApiResponse[]
        >;
        const games: PlayerGameStatsApiResponse[] =
          apiResponse.data ||
          (Array.isArray(response)
            ? (response as PlayerGameStatsApiResponse[])
            : []);
        return games.map(
          (game): PlayerGameStats => ({
            gameId: game.gameId || game.id || "",
            gameDate: game.gameDate || game.date || "",
            opponent: game.opponent || "",
            present: game.present !== false && (game.hasStats || false), // Present only if stats were tracked
            passAttempts: game.passAttempts || 0,
            completions: game.completions || 0,
            passingYards: game.passingYards || 0,
            touchdowns: game.touchdowns || 0,
            interceptions: game.interceptions || 0,
            snapAccuracy: this.calculateAverageAccuracy(
              game.snapAccuracies || [],
            ),
            throwAccuracy: this.calculateAverageAccuracy(
              game.throwAccuracies || [],
            ),
            targets: game.targets || 0,
            receptions: game.receptions || 0,
            receivingYards: game.receivingYards || 0,
            drops: game.drops || 0,
            rushingAttempts: game.rushingAttempts || 0,
            rushingYards: game.rushingYards || 0,
            flagPullAttempts: game.flagPullAttempts || 0,
            flagPulls: game.flagPulls || 0,
            interceptionsDef: game.interceptionsDef || 0,
            passDeflections: game.passDeflections || 0,
          }),
        );
      }),
      catchError((error) => {
        this.logger.error("Error fetching player games:", error);
        return of([]);
      }),
    );
  }

  /**
   * Get player statistics for a tournament
   * Uses the player-stats API with season/tournament filter
   * Note: Tournament-specific stats require filtering games by tournament_name
   */
  getPlayerTournamentStats(
    playerId: string,
    tournamentId: string,
  ): Observable<PlayerTournamentStats> {
    // Use player-stats endpoint with tournament filter
    // The backend aggregates stats from game_events
    return this.apiService
      .get<unknown>(API_ENDPOINTS.playerStats.aggregated, {
        playerId,
        tournamentId,
      })
      .pipe(
        map((response) => {
          const apiResponse = response as ApiResponse<{
            gamesPlayed?: number;
            totalGames?: number;
            passAttempts?: number;
            completions?: number;
            passingYards?: number;
            touchdowns?: number;
            interceptions?: number;
            targets?: number;
            receptions?: number;
            receivingYards?: number;
            drops?: number;
            rushingAttempts?: number;
            rushingYards?: number;
            flagPullAttempts?: number;
            flagPulls?: number;
          }>;
          const stats =
            apiResponse.data || (response as unknown as Record<string, number>);
          const gamesPlayed =
            (stats as { gamesPlayed?: number }).gamesPlayed || 0;
          const totalGames = (stats as { totalGames?: number }).totalGames || 0;

          return {
            tournamentId: tournamentId,
            tournamentName: "", // Would need separate tournament lookup
            gamesPlayed,
            gamesMissed: totalGames - gamesPlayed,
            gameId: "",
            gameDate: "",
            opponent: "",
            present: true,
            snapAccuracy: 0,
            throwAccuracy: 0,
            passAttempts:
              (stats as { passAttempts?: number }).passAttempts || 0,
            completions: (stats as { completions?: number }).completions || 0,
            passingYards:
              (stats as { passingYards?: number }).passingYards || 0,
            touchdowns: (stats as { touchdowns?: number }).touchdowns || 0,
            interceptions:
              (stats as { interceptions?: number }).interceptions || 0,
            targets: (stats as { targets?: number }).targets || 0,
            receptions: (stats as { receptions?: number }).receptions || 0,
            receivingYards:
              (stats as { receivingYards?: number }).receivingYards || 0,
            drops: (stats as { drops?: number }).drops || 0,
            rushingAttempts:
              (stats as { rushingAttempts?: number }).rushingAttempts || 0,
            rushingYards:
              (stats as { rushingYards?: number }).rushingYards || 0,
            flagPullAttempts:
              (stats as { flagPullAttempts?: number }).flagPullAttempts || 0,
            flagPulls: (stats as { flagPulls?: number }).flagPulls || 0,
            interceptionsDef: 0, // Not in aggregated stats
            passDeflections: 0, // Not in aggregated stats
          };
        }),
        catchError((error) => {
          this.logger.error("Error fetching tournament stats:", error);
          return of({
            tournamentId,
            tournamentName: "",
            gamesPlayed: 0,
            gamesMissed: 0,
            ...this.getEmptyPlayerGameStats(tournamentId),
          });
        }),
      );
  }

  /**
   * Get player statistics for a season
   * Uses the player-stats API with season filter
   */
  getPlayerSeasonStats(
    playerId: string,
    season: string,
  ): Observable<PlayerSeasonStats> {
    // Use player-stats endpoint with season filter
    return this.apiService
      .get<unknown>(API_ENDPOINTS.playerStats.aggregated, {
        playerId,
        season,
      })
      .pipe(
        map((response) => {
          const apiResponse = response as ApiResponse<{
            gamesPlayed?: number;
            totalGames?: number;
            passAttempts?: number;
            completions?: number;
            passingYards?: number;
            touchdowns?: number;
            interceptions?: number;
            targets?: number;
            receptions?: number;
            receivingYards?: number;
            drops?: number;
            rushingAttempts?: number;
            rushingYards?: number;
            flagPullAttempts?: number;
            flagPulls?: number;
            completionPercentage?: number;
            dropRate?: number;
            flagPullSuccessRate?: number;
          }>;
          const stats =
            apiResponse.data || (response as unknown as Record<string, number>);

          const gamesPlayed =
            (stats as { gamesPlayed?: number }).gamesPlayed || 0;
          const totalGames = (stats as { totalGames?: number }).totalGames || 0;
          const gamesMissed = totalGames - gamesPlayed;
          const attendanceRate =
            totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0;

          const passAttempts =
            (stats as { passAttempts?: number }).passAttempts || 0;
          const completions =
            (stats as { completions?: number }).completions || 0;
          const passingYards =
            (stats as { passingYards?: number }).passingYards || 0;
          const touchdowns = (stats as { touchdowns?: number }).touchdowns || 0;
          const interceptions =
            (stats as { interceptions?: number }).interceptions || 0;
          const targets = (stats as { targets?: number }).targets || 0;
          const receptions = (stats as { receptions?: number }).receptions || 0;
          const receivingYards =
            (stats as { receivingYards?: number }).receivingYards || 0;
          const drops = (stats as { drops?: number }).drops || 0;
          const rushingAttempts =
            (stats as { rushingAttempts?: number }).rushingAttempts || 0;
          const rushingYards =
            (stats as { rushingYards?: number }).rushingYards || 0;
          const flagPullAttempts =
            (stats as { flagPullAttempts?: number }).flagPullAttempts || 0;
          const flagPulls = (stats as { flagPulls?: number }).flagPulls || 0;

          return {
            season,
            gamesPlayed,
            gamesMissed,
            totalGames,
            attendanceRate,
            totalPassAttempts: passAttempts,
            totalCompletions: completions,
            totalPassingYards: passingYards,
            totalTouchdowns: touchdowns,
            totalInterceptions: interceptions,
            totalTargets: targets,
            totalReceptions: receptions,
            totalReceivingYards: receivingYards,
            totalDrops: drops,
            totalRushingAttempts: rushingAttempts,
            totalRushingYards: rushingYards,
            totalFlagPullAttempts: flagPullAttempts,
            totalFlagPulls: flagPulls,
            totalInterceptionsDef: 0, // Not in aggregated stats
            totalPassDeflections: 0, // Not in aggregated stats
            avgPassingYards: gamesPlayed > 0 ? passingYards / gamesPlayed : 0,
            avgReceivingYards:
              gamesPlayed > 0 ? receivingYards / gamesPlayed : 0,
            avgRushingYards: gamesPlayed > 0 ? rushingYards / gamesPlayed : 0,
            completionPercentage:
              (stats as { completionPercentage?: number })
                .completionPercentage ||
              (passAttempts > 0
                ? this.calculateCompletionPercentage(completions, passAttempts)
                : 0),
            dropRate:
              (stats as { dropRate?: number }).dropRate ||
              (targets > 0 ? this.calculateDropRate(drops, targets) : 0),
            flagPullSuccessRate:
              (stats as { flagPullSuccessRate?: number }).flagPullSuccessRate ||
              (flagPullAttempts > 0
                ? this.calculateFlagPullSuccessRate(flagPulls, flagPullAttempts)
                : 0),
          };
        }),
        catchError((error) => {
          this.logger.error("Error fetching season stats:", error);
          return of(this.getEmptySeasonStats(season));
        }),
      );
  }

  /**
   * Get empty season stats structure for error fallback
   */
  private getEmptySeasonStats(season: string): PlayerSeasonStats {
    return {
      season,
      gamesPlayed: 0,
      gamesMissed: 0,
      totalGames: 0,
      attendanceRate: 0,
      totalPassAttempts: 0,
      totalCompletions: 0,
      totalPassingYards: 0,
      totalTouchdowns: 0,
      totalInterceptions: 0,
      totalTargets: 0,
      totalReceptions: 0,
      totalReceivingYards: 0,
      totalDrops: 0,
      totalRushingAttempts: 0,
      totalRushingYards: 0,
      totalFlagPullAttempts: 0,
      totalFlagPulls: 0,
      totalInterceptionsDef: 0,
      totalPassDeflections: 0,
      avgPassingYards: 0,
      avgReceivingYards: 0,
      avgRushingYards: 0,
      completionPercentage: 0,
      dropRate: 0,
      flagPullSuccessRate: 0,
    };
  }

  /**
   * Get player statistics across multiple seasons
   * Uses the player-stats API to get aggregated career stats
   * Note: Multi-season breakdown would require additional backend support
   */
  getPlayerMultiSeasonStats(
    playerId: string,
  ): Observable<PlayerMultiSeasonStats> {
    // Use player-stats endpoint for overall career stats
    // The backend aggregates all game events for the player
    return this.apiService
      .get<unknown>(API_ENDPOINTS.playerStats.aggregated, { playerId })
      .pipe(
        map((response) => {
          const apiResponse = response as ApiResponse<{
            gamesPlayed?: number;
            totalGames?: number;
            passAttempts?: number;
            completions?: number;
            passingYards?: number;
            touchdowns?: number;
            interceptions?: number;
            targets?: number;
            receptions?: number;
            receivingYards?: number;
            drops?: number;
            rushingAttempts?: number;
            rushingYards?: number;
            flagPullAttempts?: number;
            flagPulls?: number;
          }>;
          const stats =
            apiResponse.data || (response as unknown as Record<string, number>);

          // For now, treat all stats as a single "career" season
          // Multi-season breakdown would require additional backend endpoint
          const gamesPlayed =
            (stats as { gamesPlayed?: number }).gamesPlayed || 0;
          const totalGames = (stats as { totalGames?: number }).totalGames || 0;
          const gamesMissed = totalGames - gamesPlayed;

          const careerPassAttempts =
            (stats as { passAttempts?: number }).passAttempts || 0;
          const careerCompletions =
            (stats as { completions?: number }).completions || 0;
          const careerPassingYards =
            (stats as { passingYards?: number }).passingYards || 0;
          const careerTouchdowns =
            (stats as { touchdowns?: number }).touchdowns || 0;
          const careerInterceptions =
            (stats as { interceptions?: number }).interceptions || 0;
          const careerTargets = (stats as { targets?: number }).targets || 0;
          const careerReceptions =
            (stats as { receptions?: number }).receptions || 0;
          const careerReceivingYards =
            (stats as { receivingYards?: number }).receivingYards || 0;
          const careerDrops = (stats as { drops?: number }).drops || 0;
          const careerRushingAttempts =
            (stats as { rushingAttempts?: number }).rushingAttempts || 0;
          const careerRushingYards =
            (stats as { rushingYards?: number }).rushingYards || 0;
          const careerFlagPullAttempts =
            (stats as { flagPullAttempts?: number }).flagPullAttempts || 0;
          const careerFlagPulls =
            (stats as { flagPulls?: number }).flagPulls || 0;

          // Create a single season entry representing career totals
          const careerSeason: PlayerSeasonStats = {
            season: "Career",
            gamesPlayed,
            gamesMissed,
            totalGames,
            attendanceRate:
              totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0,
            totalPassAttempts: careerPassAttempts,
            totalCompletions: careerCompletions,
            totalPassingYards: careerPassingYards,
            totalTouchdowns: careerTouchdowns,
            totalInterceptions: careerInterceptions,
            totalTargets: careerTargets,
            totalReceptions: careerReceptions,
            totalReceivingYards: careerReceivingYards,
            totalDrops: careerDrops,
            totalRushingAttempts: careerRushingAttempts,
            totalRushingYards: careerRushingYards,
            totalFlagPullAttempts: careerFlagPullAttempts,
            totalFlagPulls: careerFlagPulls,
            totalInterceptionsDef: 0,
            totalPassDeflections: 0,
            avgPassingYards:
              gamesPlayed > 0 ? careerPassingYards / gamesPlayed : 0,
            avgReceivingYards:
              gamesPlayed > 0 ? careerReceivingYards / gamesPlayed : 0,
            avgRushingYards:
              gamesPlayed > 0 ? careerRushingYards / gamesPlayed : 0,
            completionPercentage:
              careerPassAttempts > 0
                ? this.calculateCompletionPercentage(
                    careerCompletions,
                    careerPassAttempts,
                  )
                : 0,
            dropRate:
              careerTargets > 0
                ? this.calculateDropRate(careerDrops, careerTargets)
                : 0,
            flagPullSuccessRate:
              careerFlagPullAttempts > 0
                ? this.calculateFlagPullSuccessRate(
                    careerFlagPulls,
                    careerFlagPullAttempts,
                  )
                : 0,
          };

          return {
            totalSeasons: 1, // Career totals only for now
            totalGamesPlayed: gamesPlayed,
            totalGamesMissed: gamesMissed,
            overallAttendanceRate:
              totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0,
            seasons: [careerSeason],
            careerPassAttempts,
            careerCompletions,
            careerPassingYards,
            careerTouchdowns,
            careerInterceptions,
            careerTargets,
            careerReceptions,
            careerReceivingYards,
            careerDrops,
            careerRushingAttempts,
            careerRushingYards,
            careerFlagPullAttempts,
            careerFlagPulls,
            careerInterceptionsDef: 0,
            careerPassDeflections: 0,
          };
        }),
        catchError((error) => {
          this.logger.error("Error fetching multi-season stats:", error);
          return of(this.getEmptyMultiSeasonStats());
        }),
      );
  }

  /**
   * Get empty multi-season stats structure for error fallback
   */
  private getEmptyMultiSeasonStats(): PlayerMultiSeasonStats {
    return {
      totalSeasons: 0,
      totalGamesPlayed: 0,
      totalGamesMissed: 0,
      overallAttendanceRate: 0,
      seasons: [],
      careerPassAttempts: 0,
      careerCompletions: 0,
      careerPassingYards: 0,
      careerTouchdowns: 0,
      careerInterceptions: 0,
      careerTargets: 0,
      careerReceptions: 0,
      careerReceivingYards: 0,
      careerDrops: 0,
      careerRushingAttempts: 0,
      careerRushingYards: 0,
      careerFlagPullAttempts: 0,
      careerFlagPulls: 0,
      careerInterceptionsDef: 0,
      careerPassDeflections: 0,
    };
  }

  private aggregateGameStats(
    games: Array<PlayerGameStats & { hasStats?: boolean }>,
  ): Omit<
    PlayerGameStats,
    | "gameId"
    | "gameDate"
    | "opponent"
    | "present"
    | "snapAccuracy"
    | "throwAccuracy"
  > {
    return games.reduce(
      (acc, game) => {
        const gameWithStats = game as PlayerGameStats & { hasStats?: boolean };
        if (!gameWithStats.present || !gameWithStats.hasStats) return acc;

        return {
          passAttempts: acc.passAttempts + (gameWithStats.passAttempts || 0),
          completions: acc.completions + (gameWithStats.completions || 0),
          passingYards: acc.passingYards + (gameWithStats.passingYards || 0),
          touchdowns: acc.touchdowns + (gameWithStats.touchdowns || 0),
          interceptions: acc.interceptions + (gameWithStats.interceptions || 0),
          targets: acc.targets + (gameWithStats.targets || 0),
          receptions: acc.receptions + (gameWithStats.receptions || 0),
          receivingYards:
            acc.receivingYards + (gameWithStats.receivingYards || 0),
          drops: acc.drops + (gameWithStats.drops || 0),
          rushingAttempts:
            acc.rushingAttempts + (gameWithStats.rushingAttempts || 0),
          rushingYards: acc.rushingYards + (gameWithStats.rushingYards || 0),
          flagPullAttempts:
            acc.flagPullAttempts + (gameWithStats.flagPullAttempts || 0),
          flagPulls: acc.flagPulls + (gameWithStats.flagPulls || 0),
          interceptionsDef:
            acc.interceptionsDef + (gameWithStats.interceptionsDef || 0),
          passDeflections:
            acc.passDeflections + (gameWithStats.passDeflections || 0),
        };
      },
      {
        passAttempts: 0,
        completions: 0,
        passingYards: 0,
        touchdowns: 0,
        interceptions: 0,
        targets: 0,
        receptions: 0,
        receivingYards: 0,
        drops: 0,
        rushingAttempts: 0,
        rushingYards: 0,
        flagPullAttempts: 0,
        flagPulls: 0,
        interceptionsDef: 0,
        passDeflections: 0,
      },
    );
  }

  /**
   * Calculate completion percentage using validated calculation service
   */
  private calculateCompletionPercentage(
    completions: number,
    attempts: number,
  ): number {
    try {
      const result = this.statsCalcService.calculateCompletionPercentage(
        completions,
        attempts,
      );
      return result.percentage;
    } catch (error) {
      this.logger.warn("Error calculating completion percentage:", toLogContext(error));
      return attempts > 0 ? (completions / attempts) * 100 : 0;
    }
  }

  /**
   * Calculate drop rate using validated calculation service
   */
  private calculateDropRate(drops: number, targets: number): number {
    try {
      const result = this.statsCalcService.calculateDropRate(drops, targets);
      return result.rate;
    } catch (error) {
      this.logger.warn("Error calculating drop rate:", toLogContext(error));
      return targets > 0 ? (drops / targets) * 100 : 0;
    }
  }

  /**
   * Calculate flag pull success rate using validated calculation service
   */
  private calculateFlagPullSuccessRate(
    successes: number,
    attempts: number,
  ): number {
    try {
      const result = this.statsCalcService.calculateFlagPullSuccessRate(
        successes,
        attempts,
      );
      return result.rate;
    } catch (error) {
      this.logger.warn("Error calculating flag pull success rate:", toLogContext(error));
      return attempts > 0 ? (successes / attempts) * 100 : 0;
    }
  }

  private calculateAverageAccuracy(accuracies: (string | number)[]): number {
    if (!accuracies || accuracies.length === 0) return 0;

    const accuracyMap: Record<string, number> = {
      perfect: 100,
      good: 80,
      catchable: 60,
      bad: 40,
      terrible: 20,
    };

    const sum = accuracies.reduce((total: number, acc) => {
      if (typeof acc === "number") {
        return total + acc;
      }
      return total + (accuracyMap[String(acc).toLowerCase()] || 0);
    }, 0);
    return sum / accuracies.length;
  }
}
