import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import { ApiService } from "./api.service";
import { StatisticsCalculationService } from "./statistics-calculation.service";
import { LoggerService } from "./logger.service";

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
   * If player didn't track stats, they are marked as absent
   */
  getPlayerGameStats(
    playerId: string,
    gameId: string,
  ): Observable<PlayerGameStats> {
    return this.apiService
      .get(`/api/players/${playerId}/games/${gameId}/stats`)
      .pipe(
        map((response: any) => {
          const stats = response.data || response;
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
            snapAccuracy: this.calculateAverageAccuracy(
              stats.snapAccuracies || [],
            ),
            throwAccuracy: this.calculateAverageAccuracy(
              stats.throwAccuracies || [],
            ),
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
      );
  }

  /**
   * Get all games for a player with their stats
   * Games where player didn't track stats are marked as missed
   */
  getPlayerAllGames(playerId: string): Observable<PlayerGameStats[]> {
    return this.apiService.get(`/api/players/${playerId}/games`).pipe(
      map((response: any) => {
        const games = response.data || response || [];
        return games.map((game: any) => ({
          gameId: game.gameId || game.id,
          gameDate: game.gameDate || game.date,
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
        }));
      }),
    );
  }

  /**
   * Get player statistics for a tournament
   */
  getPlayerTournamentStats(
    playerId: string,
    tournamentId: string,
  ): Observable<PlayerTournamentStats> {
    return this.apiService
      .get(`/api/players/${playerId}/tournaments/${tournamentId}/stats`)
      .pipe(
        map((response: any) => {
          const stats = response.data || response;
          const games = stats.games || [];
          const gamesPlayed = games.filter(
            (g: any) => g.present && g.hasStats,
          ).length;
          const gamesMissed = games.filter(
            (g: any) => !g.present || !g.hasStats,
          ).length;

          return {
            tournamentId: stats.tournamentId || tournamentId,
            tournamentName: stats.tournamentName || "",
            gamesPlayed,
            gamesMissed,
            gameId: "",
            gameDate: "",
            opponent: "",
            present: true,
            ...this.aggregateGameStats(games),
          };
        }),
      );
  }

  /**
   * Get player statistics for a season
   */
  getPlayerSeasonStats(
    playerId: string,
    season: string,
  ): Observable<PlayerSeasonStats> {
    return this.apiService
      .get(`/api/players/${playerId}/seasons/${season}/stats`)
      .pipe(
        map((response: any) => {
          const stats = response.data || response;
          const games = stats.games || [];
          const gamesPlayed = games.filter(
            (g: any) => g.present && g.hasStats,
          ).length;
          const gamesMissed = games.filter(
            (g: any) => !g.present || !g.hasStats,
          ).length;
          const totalGames = gamesPlayed + gamesMissed;
          const attendanceRate =
            totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0;

          const aggregated = this.aggregateGameStats(games);

          return {
            season,
            gamesPlayed,
            gamesMissed,
            totalGames,
            attendanceRate,
            totalPassAttempts: aggregated.passAttempts,
            totalCompletions: aggregated.completions,
            totalPassingYards: aggregated.passingYards,
            totalTouchdowns: aggregated.touchdowns,
            totalInterceptions: aggregated.interceptions,
            totalTargets: aggregated.targets,
            totalReceptions: aggregated.receptions,
            totalReceivingYards: aggregated.receivingYards,
            totalDrops: aggregated.drops,
            totalRushingAttempts: aggregated.rushingAttempts,
            totalRushingYards: aggregated.rushingYards,
            totalFlagPullAttempts: aggregated.flagPullAttempts,
            totalFlagPulls: aggregated.flagPulls,
            totalInterceptionsDef: aggregated.interceptionsDef,
            totalPassDeflections: aggregated.passDeflections,
            avgPassingYards:
              gamesPlayed > 0 ? aggregated.passingYards / gamesPlayed : 0,
            avgReceivingYards:
              gamesPlayed > 0 ? aggregated.receivingYards / gamesPlayed : 0,
            avgRushingYards:
              gamesPlayed > 0 ? aggregated.rushingYards / gamesPlayed : 0,
            completionPercentage:
              aggregated.passAttempts > 0
                ? this.calculateCompletionPercentage(aggregated.completions, aggregated.passAttempts)
                : 0,
            dropRate:
              aggregated.targets > 0
                ? this.calculateDropRate(aggregated.drops, aggregated.targets)
                : 0,
            flagPullSuccessRate:
              aggregated.flagPullAttempts > 0
                ? this.calculateFlagPullSuccessRate(aggregated.flagPulls, aggregated.flagPullAttempts)
                : 0,
          };
        }),
      );
  }

  /**
   * Get player statistics across multiple seasons
   */
  getPlayerMultiSeasonStats(
    playerId: string,
  ): Observable<PlayerMultiSeasonStats> {
    return this.apiService
      .get(`/api/players/${playerId}/stats/multi-season`)
      .pipe(
        map((response: any) => {
          const data = response.data || response;
          const seasons = data.seasons || [];

          const seasonStats = seasons.map((s: any) => ({
            season: s.season,
            gamesPlayed: s.gamesPlayed || 0,
            gamesMissed: s.gamesMissed || 0,
            totalGames: (s.gamesPlayed || 0) + (s.gamesMissed || 0),
            attendanceRate: s.attendanceRate || 0,
            totalPassAttempts: s.totalPassAttempts || 0,
            totalCompletions: s.totalCompletions || 0,
            totalPassingYards: s.totalPassingYards || 0,
            totalTouchdowns: s.totalTouchdowns || 0,
            totalInterceptions: s.totalInterceptions || 0,
            totalTargets: s.totalTargets || 0,
            totalReceptions: s.totalReceptions || 0,
            totalReceivingYards: s.totalReceivingYards || 0,
            totalDrops: s.totalDrops || 0,
            totalRushingAttempts: s.totalRushingAttempts || 0,
            totalRushingYards: s.totalRushingYards || 0,
            totalFlagPullAttempts: s.totalFlagPullAttempts || 0,
            totalFlagPulls: s.totalFlagPulls || 0,
            totalInterceptionsDef: s.totalInterceptionsDef || 0,
            totalPassDeflections: s.totalPassDeflections || 0,
            avgPassingYards: s.avgPassingYards || 0,
            avgReceivingYards: s.avgReceivingYards || 0,
            avgRushingYards: s.avgRushingYards || 0,
            completionPercentage: s.completionPercentage || 0,
            dropRate: s.dropRate || 0,
            flagPullSuccessRate: s.flagPullSuccessRate || 0,
          }));

          const totalGamesPlayed = seasonStats.reduce(
            (sum: number, s: any) => sum + s.gamesPlayed,
            0,
          );
          const totalGamesMissed = seasonStats.reduce(
            (sum: number, s: any) => sum + s.gamesMissed,
            0,
          );
          const totalGames = totalGamesPlayed + totalGamesMissed;
          const overallAttendanceRate =
            totalGames > 0 ? (totalGamesPlayed / totalGames) * 100 : 0;

          return {
            totalSeasons: seasons.length,
            totalGamesPlayed,
            totalGamesMissed,
            overallAttendanceRate,
            seasons: seasonStats,
            careerPassAttempts: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalPassAttempts,
              0,
            ),
            careerCompletions: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalCompletions,
              0,
            ),
            careerPassingYards: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalPassingYards,
              0,
            ),
            careerTouchdowns: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalTouchdowns,
              0,
            ),
            careerInterceptions: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalInterceptions,
              0,
            ),
            careerTargets: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalTargets,
              0,
            ),
            careerReceptions: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalReceptions,
              0,
            ),
            careerReceivingYards: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalReceivingYards,
              0,
            ),
            careerDrops: seasonStats.reduce((sum: number, s: any) => sum + s.totalDrops, 0),
            careerRushingAttempts: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalRushingAttempts,
              0,
            ),
            careerRushingYards: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalRushingYards,
              0,
            ),
            careerFlagPullAttempts: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalFlagPullAttempts,
              0,
            ),
            careerFlagPulls: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalFlagPulls,
              0,
            ),
            careerInterceptionsDef: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalInterceptionsDef,
              0,
            ),
            careerPassDeflections: seasonStats.reduce(
              (sum: number, s: any) => sum + s.totalPassDeflections,
              0,
            ),
          };
        }),
      );
  }

  private aggregateGameStats(games: any[]): any {
    return games.reduce(
      (acc, game) => {
        if (!game.present || !game.hasStats) return acc;

        return {
          passAttempts: acc.passAttempts + (game.passAttempts || 0),
          completions: acc.completions + (game.completions || 0),
          passingYards: acc.passingYards + (game.passingYards || 0),
          touchdowns: acc.touchdowns + (game.touchdowns || 0),
          interceptions: acc.interceptions + (game.interceptions || 0),
          targets: acc.targets + (game.targets || 0),
          receptions: acc.receptions + (game.receptions || 0),
          receivingYards: acc.receivingYards + (game.receivingYards || 0),
          drops: acc.drops + (game.drops || 0),
          rushingAttempts: acc.rushingAttempts + (game.rushingAttempts || 0),
          rushingYards: acc.rushingYards + (game.rushingYards || 0),
          flagPullAttempts: acc.flagPullAttempts + (game.flagPullAttempts || 0),
          flagPulls: acc.flagPulls + (game.flagPulls || 0),
          interceptionsDef: acc.interceptionsDef + (game.interceptionsDef || 0),
          passDeflections: acc.passDeflections + (game.passDeflections || 0),
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
  private calculateCompletionPercentage(completions: number, attempts: number): number {
    try {
      const result = this.statsCalcService.calculateCompletionPercentage(completions, attempts);
      return result.percentage;
    } catch (error) {
      this.logger.warn('Error calculating completion percentage:', error);
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
      this.logger.warn('Error calculating drop rate:', error);
      return targets > 0 ? (drops / targets) * 100 : 0;
    }
  }

  /**
   * Calculate flag pull success rate using validated calculation service
   */
  private calculateFlagPullSuccessRate(successes: number, attempts: number): number {
    try {
      const result = this.statsCalcService.calculateFlagPullSuccessRate(successes, attempts);
      return result.rate;
    } catch (error) {
      this.logger.warn('Error calculating flag pull success rate:', error);
      return attempts > 0 ? (successes / attempts) * 100 : 0;
    }
  }

  private calculateAverageAccuracy(accuracies: string[]): number {
    if (!accuracies || accuracies.length === 0) return 0;

    const accuracyMap: Record<string, number> = {
      perfect: 100,
      good: 80,
      catchable: 60,
      bad: 40,
      terrible: 20,
    };

    const sum = accuracies.reduce(
      (total, acc) => total + (accuracyMap[acc.toLowerCase()] || 0),
      0,
    );
    return sum / accuracies.length;
  }
}
