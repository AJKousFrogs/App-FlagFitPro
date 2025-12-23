/**
 * Game Stats Service
 * Handles saving, loading, and analyzing game statistics
 * Now uses backend API with localStorage fallback
 */

import { apiClient } from "../../api-client.js";
import { API_ENDPOINTS } from "../../api-config.js";
import { storageService } from "./storage-service-unified.js";
import { statisticsCalculationService } from "./statisticsCalculationService.js";
import { logger } from "../../logger.js";

class GameStatsService {
  constructor() {
    this.storageKey = "flagfit_games";
    this.currentGameKey = "flagfit_current_game";
    // Real data enforcement: Always use backend/Supabase
    this.useBackend = true;
  }

  /**
   * Save a game to Supabase
   * @param {Object} game - Game object to save
   * @returns {Promise<boolean>} Success status
   */
  async saveGame(game) {
    try {
      // 1. Prepare game data for API
      const gameData = {
        teamId:
          game.teamId ||
          `TEAM_${storageService.get("userId", "", { usePrefix: false })}`,
        opponentName: game.opponentName,
        gameDate: game.gameDate,
        gameTime: game.gameTime,
        location: game.location,
        isHomeGame: game.isHomeGame,
        weather: game.weather,
        temperature: game.temperature,
        fieldConditions: game.fieldConditions,
        teamScore: game.teamScore || 0,
        opponentScore: game.opponentScore || 0,
      };

      let response;
      if (game.gameId && game.gameId.startsWith("GAME_")) {
        // Update existing game
        response = await apiClient.put(
          API_ENDPOINTS.games.update(game.gameId),
          gameData,
        );
      } else {
        // Create new game
        response = await apiClient.post(API_ENDPOINTS.games.create, gameData);
      }

      if (response.success) {
        // Update local game object with backend game_id if it was new
        if (response.data && response.data.game_id) {
          game.gameId = response.data.game_id;
        }
        // Cache current game locally for UI responsiveness during active session
        storageService.set(this.currentGameKey, game, { usePrefix: false });
        return true;
      }
      return false;
    } catch (error) {
      logger.error("[GameStatsService] Error saving game to Supabase:", error);
      throw error;
    }
  }

  /**
   * Get a specific game by ID from Supabase
   * @param {string} gameId - Game ID
   * @returns {Promise<Object|null>} Game object or null
   */
  async getGame(gameId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.games.get(gameId));
      if (response.success && response.data) {
        return this._transformBackendGame(response.data);
      }
      return null;
    } catch (error) {
      logger.error(`[GameStatsService] Error getting game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Get all games from Supabase
   * @returns {Promise<Array>} Array of game objects
   */
  async getAllGames() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.games.list);
      if (response.success && response.data) {
        // Transform backend data to frontend format
        return response.data.map((g) => this._transformBackendGame(g));
      }
      return [];
    } catch (error) {
      logger.error("[GameStatsService] Error loading games from Supabase:", error);
      return [];
    }
  }

  /**
   * Internal helper to transform backend game format to frontend format
   */
  _transformBackendGame(g) {
    return {
      gameId: g.game_id || g.id,
      teamId: g.team_id,
      opponentName: g.opponent_team_name || g.opponentName,
      gameDate: g.game_date || g.gameDate,
      gameTime: g.game_time || g.gameTime,
      location: g.location,
      isHomeGame: g.is_home_game || g.isHomeGame,
      weather: g.weather_conditions || g.weather,
      temperature: g.temperature,
      fieldConditions: g.field_conditions || g.fieldConditions,
      teamScore: g.team_score || g.teamScore || 0,
      opponentScore: g.opponent_score || g.opponentScore || 0,
      plays: g.plays || [],
      createdAt: g.created_at || g.createdAt,
      updatedAt: g.updated_at || g.updatedAt,
    };
  }

  /**
   * Get current active game from local cache (transient)
   * @returns {Object|null} Current game or null
   */
  getCurrentGame() {
    try {
      return storageService.get(this.currentGameKey, null, {
        usePrefix: false,
      });
    } catch (error) {
      logger.error("[GameStatsService] Error loading current game from cache:", error);
      return null;
    }
  }

  /**
   * Delete a game from Supabase
   * @param {string} gameId - Game ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteGame(gameId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.games.update(gameId));
      if (response.success) {
        // Clear current game if it's the one being deleted
        const current = this.getCurrentGame();
        if (current && current.gameId === gameId) {
          storageService.remove(this.currentGameKey, { usePrefix: false });
        }
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`[GameStatsService] Error deleting game ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Get games for a specific date range from Supabase
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Filtered games
   */
  async getGamesByDateRange(startDate, endDate) {
    try {
      const games = await this.getAllGames();
      return games.filter((game) => {
        const gameDate = new Date(game.gameDate);
        return gameDate >= startDate && gameDate <= endDate;
      });
    } catch (error) {
      logger.error("[GameStatsService] Error getting games by date range:", error);
      return [];
    }
  }

  /**
   * Calculate player statistics across all games
   * Uses centralized Supabase endpoint for consistent, date-filtered stats
   * @param {string} playerId - Player ID
   * @param {Object} options - Options for fetching stats
   * @returns {Promise<Object>} Player statistics
   */
  async getPlayerStats(playerId, options = {}) {
    try {
      const params = {};
      if (options.season) params.season = options.season;
      if (options.teamId) params.teamId = options.teamId;

      const response = await apiClient.get(API_ENDPOINTS.playerStats.aggregated, {
        playerId,
        ...params
      });

      if (response.success && response.data) {
        // Transform backend format to frontend format
        return {
          gamesPlayed: response.data.gamesPlayed || 0,
          passAttempts: response.data.passAttempts || 0,
          completions: response.data.completions || 0,
          passingYards: response.data.passingYards || 0,
          touchdowns: response.data.touchdowns || 0,
          interceptions: response.data.interceptions || 0,
          completionPercentage: response.data.completionPercentage || 0,
          avgYardsPerAttempt: response.data.avgYardsPerAttempt || 0,
          targets: response.data.targets || 0,
          receptions: response.data.receptions || 0,
          receivingYards: response.data.receivingYards || 0,
          drops: response.data.drops || 0,
          dropRate: response.data.dropRate || 0,
          rushingAttempts: response.data.rushingAttempts || 0,
          rushingYards: response.data.rushingYards || 0,
          flagPullAttempts: response.data.flagPullAttempts || 0,
          flagPulls: response.data.flagPulls || 0,
          flagPullSuccessRate: response.data.flagPullSuccessRate || 0,
          missedFlagPulls: response.data.missedFlagPulls || 0,
          totalPlays: response.data.totalPlays || 0,
          totalYards: response.data.totalYards || 0,
        };
      }
      return this._getEmptyPlayerStats();
    } catch (error) {
      logger.error("[GameStatsService] Error fetching player stats:", error);
      return this._getEmptyPlayerStats();
    }
  }

  _getEmptyPlayerStats() {
    return {
      gamesPlayed: 0,
      passAttempts: 0,
      completions: 0,
      passingYards: 0,
      touchdowns: 0,
      interceptions: 0,
      completionPercentage: 0,
      avgYardsPerAttempt: 0,
      targets: 0,
      receptions: 0,
      receivingYards: 0,
      drops: 0,
      dropRate: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      flagPullAttempts: 0,
      flagPulls: 0,
      flagPullSuccessRate: 0,
      missedFlagPulls: 0,
      totalPlays: 0,
      totalYards: 0,
    };
  }

  /**
   * Get drop analysis for a player from Supabase
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} Drop analysis
   */
  async getPlayerDropAnalysis(playerId) {
    try {
      const games = await this.getAllGames();
      const drops = [];

      games.forEach((game) => {
        if (!game.plays) return;

        game.plays.forEach((play) => {
          if (play.receiverId === playerId && play.isDrop) {
            drops.push({
              gameId: game.gameId,
              gameDate: game.gameDate,
              opponent: game.opponentName,
              playNumber: play.playNumber,
              quarter: play.quarter,
              routeType: play.routeType,
              dropSeverity: play.dropSeverity,
              dropReason: play.dropReason,
              throwAccuracy: play.throwAccuracy,
            });
          }
        });
      });

      // Analyze drop patterns
      const severityCounts = {};
      const reasonCounts = {};
      const routeCounts = {};

      drops.forEach((drop) => {
        severityCounts[drop.dropSeverity] = (severityCounts[drop.dropSeverity] || 0) + 1;
        reasonCounts[drop.dropReason] = (reasonCounts[drop.dropReason] || 0) + 1;
        routeCounts[drop.routeType] = (routeCounts[drop.routeType] || 0) + 1;
      });

      return {
        totalDrops: drops.length,
        drops: drops,
        bySeverity: severityCounts,
        byReason: reasonCounts,
        byRoute: routeCounts,
        mostCommonReason: this.getMostCommon(reasonCounts),
        mostCommonRoute: this.getMostCommon(routeCounts),
      };
    } catch (error) {
      logger.error("[GameStatsService] Error analyzing drops:", error);
      return { totalDrops: 0, drops: [] };
    }
  }

  /**
   * Get flag pull analysis for a defender from Supabase
   * @param {string} playerId - Player ID (defender)
   * @returns {Promise<Object>} Flag pull analysis
   */
  async getDefenderFlagPullAnalysis(playerId) {
    try {
      const games = await this.getAllGames();
      const attempts = [];

      games.forEach((game) => {
        if (!game.plays) return;

        game.plays.forEach((play) => {
          if (play.defenderId === playerId && play.playType === "flag_pull") {
            attempts.push({
              gameId: game.gameId,
              gameDate: game.gameDate,
              opponent: game.opponentName,
              playNumber: play.playNumber,
              quarter: play.quarter,
              isSuccessful: play.isSuccessful,
              missReason: play.missReason,
            });
          }
        });
      });

      const successful = attempts.filter((a) => a.isSuccessful).length;
      const missed = attempts.filter((a) => !a.isSuccessful).length;

      const missReasons = {};
      attempts.forEach((attempt) => {
        if (!attempt.isSuccessful && attempt.missReason) {
          missReasons[attempt.missReason] = (missReasons[attempt.missReason] || 0) + 1;
        }
      });

      return {
        totalAttempts: attempts.length,
        successful: successful,
        missed: missed,
        successRate: attempts.length > 0 ? ((successful / attempts.length) * 100).toFixed(1) : 0,
        attempts: attempts,
        missReasons: missReasons,
        mostCommonMissReason: this.getMostCommon(missReasons),
      };
    } catch (error) {
      logger.error("[GameStatsService] Error analyzing flag pulls:", error);
      return { totalAttempts: 0, attempts: [] };
    }
  }

  /**
   * Get QB accuracy analysis from Supabase
   * @param {string} playerId - Player ID (QB)
   * @returns {Promise<Object>} QB accuracy analysis
   */
  async getQBAccuracyAnalysis(playerId) {
    try {
      const games = await this.getAllGames();
      const throws = [];

      games.forEach((game) => {
        if (!game.plays) return;

        game.plays.forEach((play) => {
          if (play.quarterbackId === playerId && play.playType === "pass") {
            throws.push({
              gameId: game.gameId,
              gameDate: game.gameDate,
              opponent: game.opponentName,
              playNumber: play.playNumber,
              quarter: play.quarter,
              routeType: play.routeType,
              outcome: play.outcome,
              throwAccuracy: play.throwAccuracy,
              isDrop: play.isDrop,
            });
          }
        });
      });

      const byRoute = {};
      throws.forEach((t) => {
        if (!byRoute[t.routeType]) {
          byRoute[t.routeType] = {
            attempts: 0,
            completions: 0,
            incompletions: 0,
            drops: 0,
            badThrows: 0,
          };
        }

        byRoute[t.routeType].attempts++;
        if (t.outcome === "completion") byRoute[t.routeType].completions++;
        else byRoute[t.routeType].incompletions++;
        if (t.isDrop) byRoute[t.routeType].drops++;
        if (t.throwAccuracy === "bad" || t.throwAccuracy === "terrible") {
          byRoute[t.routeType].badThrows++;
        }
      });

      Object.keys(byRoute).forEach((route) => {
        const data = byRoute[route];
        if (data.attempts > 0) {
          data.completionPercentage = ((data.completions / data.attempts) * 100).toFixed(1);
          data.badThrowRate = ((data.badThrows / data.attempts) * 100).toFixed(1);
        }
      });

      return {
        totalThrows: throws.length,
        throws: throws,
        byRoute: byRoute,
      };
    } catch (error) {
      logger.error("[GameStatsService] Error analyzing QB accuracy:", error);
      return { totalThrows: 0, throws: [] };
    }
  }

  /**
   * Get team statistics for a game from Supabase
   * @param {string} gameId - Game ID
   * @returns {Promise<Object|null>} Team statistics
   */
  async getTeamStats(gameId) {
    try {
      const game = await this.getGame(gameId);
      if (!game || !game.plays) return null;

      const stats = {
        totalPlays: game.plays.length,
        passAttempts: 0,
        completions: 0,
        incompletions: 0,
        drops: 0,
        interceptions: 0,
        rushingAttempts: 0,
        totalYards: 0,
        flagPullAttempts: 0,
        flagPulls: 0,
      };

      game.plays.forEach((play) => {
        if (play.playType === "pass") {
          stats.passAttempts++;
          if (play.outcome === "completion") stats.completions++;
          else stats.incompletions++;
          if (play.isDrop) stats.drops++;
          if (play.outcome === "interception") stats.interceptions++;
        } else if (play.playType === "run") {
          stats.rushingAttempts++;
          stats.totalYards += play.yardsGained || 0;
        } else if (play.playType === "flag_pull") {
          stats.flagPullAttempts++;
          if (play.isSuccessful) stats.flagPulls++;
        }
      });

      // Calculate percentages using validated calculation service
      if (stats.passAttempts > 0) {
        const completionResult = statisticsCalculationService.calculateCompletionPercentage(
          stats.completions,
          stats.passAttempts,
        );
        stats.completionPercentage = completionResult.percentage.toFixed(1);

        const dropRateResult = statisticsCalculationService.calculateDropRate(
          stats.drops,
          stats.passAttempts,
        );
        stats.dropRate = dropRateResult.rate.toFixed(1);
        stats.dropRateSeverity = dropRateResult.severity;
        stats.dropRateRecommendation = dropRateResult.recommendation;
      }

      if (stats.flagPullAttempts > 0) {
        const flagPullResult = statisticsCalculationService.calculateFlagPullSuccessRate(
          stats.flagPulls,
          stats.flagPullAttempts,
        );
        stats.flagPullSuccessRate = flagPullResult.rate.toFixed(1);
        stats.defensiveGrade = flagPullResult.defensiveGrade;
      }

      return stats;
    } catch (error) {
      logger.error("[GameStatsService] Error calculating team stats:", error);
      return null;
    }
  }

  /**
   * Helper function to get most common item from counts object
   * @param {Object} counts - Object with counts
   * @returns {string} Most common key
   */
  getMostCommon(counts) {
    let maxCount = 0;
    let mostCommon = null;

    Object.keys(counts).forEach((key) => {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        mostCommon = key;
      }
    });

    return mostCommon;
  }

  /**
   * Export game data as JSON
   * @param {string} gameId - Game ID
   * @returns {string} JSON string
   */
  exportGameAsJSON(gameId) {
    const game = this.getGame(gameId);
    return game ? JSON.stringify(game, null, 2) : null;
  }

  /**
   * Export all games as JSON
   * @returns {string} JSON string
   */
  exportAllGamesAsJSON() {
    const games = this.getAllGames({ forceSync: true });
    if (!Array.isArray(games)) {
      logger.warn("getAllGames() did not return an array in exportGames");
      return JSON.stringify([], null, 2);
    }
    return JSON.stringify(games, null, 2);
  }

  /**
   * Import games from JSON
   * @param {string} jsonString - JSON string of games
   * @returns {boolean} Success status
   */
  importGamesFromJSON(jsonString) {
    try {
      const games = JSON.parse(jsonString);
      storageService.set(this.storageKey, games, { usePrefix: false });
      return true;
    } catch (error) {
      logger.error("Error importing games:", error);
      return false;
    }
  }

  /**
   * Clear all game data (use with caution!)
   * @returns {boolean} Success status
   */
  clearAllGames() {
    try {
      storageService.remove(this.storageKey, { usePrefix: false });
      storageService.remove(this.currentGameKey, { usePrefix: false });
      return true;
    } catch (error) {
      logger.error("Error clearing games:", error);
      return false;
    }
  }
}

// Create and export singleton instance
const gameStatsService = new GameStatsService();

export { gameStatsService };
