import { Injectable, inject } from "@angular/core";
import { SupabaseClient } from "@supabase/supabase-js";
import { Observable, of } from "rxjs";
import { catchError, delay, retryWhen, take } from "rxjs/operators";
import { getErrorMessage } from "../../shared/utils/error.utils";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { toLogContext } from "./logger.service";
import { GamePlayerStats } from "../models/player.models";

/**
 * Game Stats Service
 * Provides robust game statistics retrieval with retry logic,
 * error recovery, and data integrity checks.
 */

export interface GamePlay {
  id?: string;
  playType: "pass" | "run" | "flag_pull";
  outcome?: "completion" | "incompletion" | "interception" | "drop";
  quarterbackId?: string;
  receiverId?: string;
  ballCarrierId?: string;
  defenderId?: string;
  yardsGained?: number;
  routeType?: string;
  isDrop?: boolean;
  isSuccessful?: boolean;
  dropSeverity?: string;
  dropReason?: string;
  missReason?: string;
}


@Injectable({
  providedIn: "root",
})
export class GameStatsService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  /**
   * Get Supabase client instance
   */
  private get supabase(): SupabaseClient {
    return this.supabaseService.client;
  }

  /**
   * Get player stats with retry logic and error recovery
   */
  async getPlayerStats(
    playerId: string,
    gameId: string,
    maxRetries = this.MAX_RETRIES,
  ): Promise<GamePlayerStats | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { data, error } = await this.supabase
          .from("game_plays")
          .select("*")
          .eq("player_id", playerId)
          .eq("game_id", gameId);

        if (error) {
          // PGRST116 = not found - valid state, don't retry
          if (error.code === "PGRST116" || error.code === "42P01") {
            return null;
          }
          throw error;
        }

        if (!data || data.length === 0) {
          return null;
        }

        // Aggregate stats
        return this.aggregatePlayerStats(data as GamePlay[]);
      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await this.delay(this.RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }

        this.logger.error(
          `Failed to fetch player stats after ${maxRetries} attempts:`,
          error,
        );
        throw new Error(
          `Unable to fetch player statistics: ${getErrorMessage(error)}`,
        );
      }
    }

    return null;
  }

  /**
   * Get player stats as Observable (RxJS version)
   */
  getPlayerStatsObservable(
    playerId: string,
    gameId: string,
  ): Observable<GamePlayerStats | null> {
    // Convert promise to observable with retry logic
    return new Observable<GamePlayerStats | null>((subscriber) => {
      this.getPlayerStats(playerId, gameId)
        .then((stats) => {
          subscriber.next(stats);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    }).pipe(
      retryWhen((errors) =>
        errors.pipe(delay(this.RETRY_DELAY_MS), take(this.MAX_RETRIES)),
      ),
      catchError((error) => {
        this.logger.error("Error fetching player stats:", error);
        return of(null);
      }),
    );
  }

  /**
   * Aggregate plays into statistics with data integrity checks
   */
  private aggregatePlayerStats(plays: GamePlay[]): GamePlayerStats {
    const stats: GamePlayerStats = {
      passAttempts: 0,
      completions: 0,
      interceptions: 0,
      drops: 0,
      targets: 0,
      receptions: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      flagPullAttempts: 0,
      flagPulls: 0,
      missedFlagPulls: 0,
    };

    plays.forEach((play) => {
      // Data integrity checks
      if (!play.playType || typeof play.playType !== "string") {
        this.logger.warn("Invalid play type in data:", toLogContext(play));
        return;
      }

      switch (play.playType) {
        case "pass":
          stats.passAttempts++;
          if (play.outcome === "completion") {
            stats.completions++;
            stats.receptions++;
            stats.targets++;
          } else if (play.outcome === "interception") {
            stats.interceptions++;
            stats.targets++;
          } else if (play.outcome === "incompletion") {
            stats.targets++;
          }
          if (play.isDrop) {
            stats.drops++;
            stats.targets++;
          }
          break;

        case "run":
          stats.rushingAttempts++;
          if (
            play.yardsGained !== undefined &&
            typeof play.yardsGained === "number"
          ) {
            stats.rushingYards += play.yardsGained;
          }
          break;

        case "flag_pull":
          stats.flagPullAttempts++;
          if (play.isSuccessful) {
            stats.flagPulls++;
          } else {
            stats.missedFlagPulls++;
          }
          break;
      }
    });

    return stats;
  }

  /**
   * Batch get stats for multiple players
   */
  async getMultiplePlayerStats(
    playerIds: string[],
    gameId: string,
  ): Promise<Map<string, GamePlayerStats | null>> {
    const results = new Map<string, GamePlayerStats | null>();

    // Process in parallel with concurrency limit
    const batchSize = 10;
    for (let i = 0; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      const batchPromises = batch.map((playerId) =>
        this.getPlayerStats(playerId, gameId).then((stats) => ({
          playerId,
          stats,
        })),
      );

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ playerId, stats }) => {
        results.set(playerId, stats);
      });
    }

    return results;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
