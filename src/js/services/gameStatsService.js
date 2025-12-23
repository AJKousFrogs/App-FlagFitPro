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
    // Use backend in production/staging, localStorage in development
    this.useBackend =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
  }

  /**
   * Save a game to backend (with localStorage fallback)
   * @param {Object} game - Game object to save
   * @returns {Promise<boolean>} Success status
   */
  async saveGame(game) {
    // Always save to localStorage as backup
    try {
      let games = await this.getAllGames();
      // Ensure games is an array
      if (!Array.isArray(games)) {
        logger.warn("getAllGames() did not return an array, using empty array");
        games = [];
      }
      const existingIndex = games.findIndex((g) => g.gameId === game.gameId);

      if (existingIndex >= 0) {
        games[existingIndex] = {
          ...games[existingIndex],
          ...game,
          updatedAt: new Date().toISOString(),
        };
      } else {
        games.push({
          ...game,
          createdAt: game.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      storageService.set(this.storageKey, games, { usePrefix: false });
      storageService.set(this.currentGameKey, game, { usePrefix: false });
    } catch (error) {
      logger.error("Error saving to localStorage:", error);
    }

    // Try to save to backend
    if (this.useBackend) {
      try {
        const token = storageService.get("authToken", null, {
          usePrefix: false,
        });
        if (!token) {
          logger.warn("No auth token, skipping backend save");
          return true; // Saved to localStorage
        }

        // Prepare game data for API
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
          // Update local game with backend game_id
          if (response.data && response.data.game_id) {
            game.gameId = response.data.game_id;
            storageService.set(this.currentGameKey, game, { usePrefix: false });
          }
          return true;
        }
      } catch (error) {
        logger.error("Error saving game to backend:", error);
        // Continue with localStorage version
      }
    }

    return true; // Saved to localStorage at least
  }

  /**
   * Get a specific game by ID
   * @param {string} gameId - Game ID
   * @returns {Object|null} Game object or null
   */
  getGame(gameId) {
    try {
      const games = this.getAllGames({ forceSync: true });
      if (!Array.isArray(games)) {
        return null;
      }
      return games.find((g) => g.gameId === gameId) || null;
    } catch (error) {
      logger.error("Error getting game:", error);
      return null;
    }
  }

  /**
   * Get all games from backend (with localStorage fallback)
   * @param {Object} options - Options for loading games
   * @param {boolean} options.forceSync - Force synchronous localStorage-only read
   * @returns {Promise<Array>|Array} Array of game objects
   */
  async getAllGames(options = { forceSync: false }) {
    // Synchronous localStorage-only mode (for backward compatibility)
    if (options.forceSync) {
      try {
        return storageService.get(this.storageKey, [], { usePrefix: false });
      } catch (error) {
        logger.error("Error loading games from localStorage:", error);
        return [];
      }
    }

    // Try backend first
    if (this.useBackend) {
      try {
        const token = storageService.get("authToken", null, {
          usePrefix: false,
        });
        if (token) {
          const response = await apiClient.get(API_ENDPOINTS.games.list);
          if (response.success && response.data) {
            // Transform backend data to frontend format
            const games = response.data.map((g) => ({
              gameId: g.game_id,
              teamId: g.team_id,
              opponentName: g.opponent_team_name,
              gameDate: g.game_date,
              gameTime: g.game_time,
              location: g.location,
              isHomeGame: g.is_home_game,
              weather: g.weather_conditions,
              temperature: g.temperature,
              fieldConditions: g.field_conditions,
              teamScore: g.team_score || 0,
              opponentScore: g.opponent_score || 0,
              createdAt: g.created_at,
              updatedAt: g.updated_at,
            }));

            // Sync to localStorage
            storageService.set(this.storageKey, games, { usePrefix: false });
            return games;
          }
        }
      } catch (error) {
        logger.error("Error loading games from backend:", error);
        // Fall through to localStorage
      }
    }

    // Fallback to localStorage
    try {
      return storageService.get(this.storageKey, [], { usePrefix: false });
    } catch (error) {
      logger.error("Error loading games from localStorage:", error);
      return [];
    }
  }

  /**
   * Get current active game
   * @returns {Object|null} Current game or null
   */
  getCurrentGame() {
    try {
      return storageService.get(this.currentGameKey, null, {
        usePrefix: false,
      });
    } catch (error) {
      logger.error("Error loading current game:", error);
      return null;
    }
  }

  /**
   * Delete a game
   * @param {string} gameId - Game ID to delete
   * @returns {boolean} Success status
   */
  deleteGame(gameId) {
    try {
      const games = this.getAllGames({ forceSync: true });
      if (!Array.isArray(games)) {
        logger.warn("getAllGames() did not return an array in deleteGame");
        return false;
      }
      const filteredGames = games.filter((g) => g.gameId !== gameId);
      storageService.set(this.storageKey, filteredGames, { usePrefix: false });
      return true;
    } catch (error) {
      logger.error("Error deleting game:", error);
      return false;
    }
  }

  /**
   * Get games for a specific date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Filtered games
   */
  getGamesByDateRange(startDate, endDate) {
    const games = this.getAllGames({ forceSync: true });
    if (!Array.isArray(games)) {
      logger.warn(
        "getAllGames() did not return an array in getGamesByDateRange",
      );
      return [];
    }
    return games.filter((game) => {
      const gameDate = new Date(game.gameDate);
      return gameDate >= startDate && gameDate <= endDate;
    });
  }

  /**
   * Calculate player statistics across all games
   * Uses centralized backend endpoint for consistent, date-filtered stats
   * Falls back to local calculation if backend is unavailable
   * @param {string} playerId - Player ID
   * @param {Object} options - Options for fetching stats
   * @returns {Promise<Object>|Object} Player statistics
   */
  async getPlayerStats(playerId, options = {}) {
    // Try backend first for consistent, date-filtered stats
    if (this.useBackend && !options.forceLocal) {
      try {
        const token = storageService.get("authToken", null, {
          usePrefix: false,
        });
        if (token) {
          const params = new URLSearchParams();
          if (options.season) {
            params.append("season", options.season);
          }
          if (options.teamId) {
            params.append("teamId", options.teamId);
          }

          const url = `${API_ENDPOINTS.playerStats.aggregated}?playerId=${playerId}${params.toString() ? "&" + params.toString() : ""}`;
          const response = await apiClient.get(url);

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
        }
      } catch (error) {
        logger.warn(
          "Error fetching stats from backend, falling back to local calculation:",
          error,
        );
        // Fall through to local calculation
      }
    }

    // Fallback to local calculation (for backward compatibility)
    const games = this.getAllGames({ forceSync: true });
    const stats = {
      gamesPlayed: 0,
      // Passing stats
      passAttempts: 0,
      completions: 0,
      passingYards: 0,
      touchdowns: 0,
      interceptions: 0,
      completionPercentage: 0,
      badThrows: 0,
      // Receiving stats
      targets: 0,
      receptions: 0,
      receivingYards: 0,
      drops: 0,
      dropRate: 0,
      // Rushing stats
      rushingAttempts: 0,
      rushingYards: 0,
      // Defensive stats
      flagPullAttempts: 0,
      flagPulls: 0,
      flagPullSuccessRate: 0,
      missedFlagPulls: 0,
    };

    games.forEach((game) => {
      if (!game.plays) {
        return;
      }

      let playerInGame = false;

      game.plays.forEach((play) => {
        // Check if player was involved in this play
        const isQB = play.quarterbackId === playerId;
        const isReceiver = play.receiverId === playerId;
        const isBallCarrier = play.ballCarrierId === playerId;
        const isDefender = play.defenderId === playerId;

        if (isQB || isReceiver || isBallCarrier || isDefender) {
          playerInGame = true;
        }

        // Passing stats
        if (isQB && play.playType === "pass") {
          stats.passAttempts++;
          if (play.outcome === "completion") {
            stats.completions++;
          }
          if (play.outcome === "interception") {
            stats.interceptions++;
          }
          if (
            play.throwAccuracy === "bad" ||
            play.throwAccuracy === "terrible"
          ) {
            stats.badThrows++;
          }
          // You could track yards here if added to play data
        }

        // Receiving stats
        if (isReceiver && play.playType === "pass") {
          stats.targets++;
          if (play.outcome === "completion") {
            stats.receptions++;
          }
          if (play.isDrop) {
            stats.drops++;
          }
        }

        // Rushing stats
        if (isBallCarrier && play.playType === "run") {
          stats.rushingAttempts++;
          stats.rushingYards += play.yardsGained || 0;
        }

        // Defensive stats
        if (isDefender && play.playType === "flag_pull") {
          stats.flagPullAttempts++;
          if (play.isSuccessful) {
            stats.flagPulls++;
          } else {
            stats.missedFlagPulls++;
          }
        }
      });

      if (playerInGame) {
        stats.gamesPlayed++;
      }
    });

    // Calculate percentages
    if (stats.passAttempts > 0) {
      stats.completionPercentage = (
        (stats.completions / stats.passAttempts) *
        100
      ).toFixed(1);
    }

    if (stats.targets > 0) {
      stats.dropRate = ((stats.drops / stats.targets) * 100).toFixed(1);
    }

    if (stats.flagPullAttempts > 0) {
      stats.flagPullSuccessRate = (
        (stats.flagPulls / stats.flagPullAttempts) *
        100
      ).toFixed(1);
    }

    return stats;
  }

  /**
   * Get player stats for a specific date range
   * Uses centralized backend endpoint
   * @param {string} playerId - Player ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Player statistics
   */
  async getPlayerStatsByDateRange(playerId, startDate, endDate) {
    if (this.useBackend) {
      try {
        const token = storageService.get("authToken", null, {
          usePrefix: false,
        });
        if (token) {
          const params = new URLSearchParams({
            playerId,
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
          });

          const response = await apiClient.get(
            `${API_ENDPOINTS.playerStats.dateRange}?${params.toString()}`,
          );

          if (response.success && response.data) {
            return response.data;
          }
        }
      } catch (error) {
        logger.error("Error fetching stats by date range:", error);
        throw error;
      }
    }

    // Fallback to local calculation
    const games = this.getGamesByDateRange(startDate, endDate);
    const stats = {
      gamesPlayed: games.length,
      passAttempts: 0,
      completions: 0,
      passingYards: 0,
      touchdowns: 0,
      interceptions: 0,
      completionPercentage: 0,
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
    };

    games.forEach((game) => {
      if (!game.plays) {
        return;
      }
      game.plays.forEach((play) => {
        // Aggregate stats (same logic as getPlayerStats)
        if (play.quarterbackId === playerId && play.playType === "pass") {
          stats.passAttempts++;
          if (play.outcome === "completion") {
            stats.completions++;
          }
          if (play.outcome === "interception") {
            stats.interceptions++;
          }
        }
        if (play.receiverId === playerId && play.playType === "pass") {
          stats.targets++;
          if (play.outcome === "completion") {
            stats.receptions++;
          }
          if (play.isDrop) {
            stats.drops++;
          }
        }
        if (play.ballCarrierId === playerId && play.playType === "run") {
          stats.rushingAttempts++;
          stats.rushingYards += play.yardsGained || 0;
        }
        if (play.defenderId === playerId && play.playType === "flag_pull") {
          stats.flagPullAttempts++;
          if (play.isSuccessful) {
            stats.flagPulls++;
          } else {
            stats.missedFlagPulls++;
          }
        }
      });
    });

    // Calculate percentages
    if (stats.passAttempts > 0) {
      stats.completionPercentage = Number(
        ((stats.completions / stats.passAttempts) * 100).toFixed(1),
      );
    }
    if (stats.targets > 0) {
      stats.dropRate = Number(((stats.drops / stats.targets) * 100).toFixed(1));
    }
    if (stats.flagPullAttempts > 0) {
      stats.flagPullSuccessRate = Number(
        ((stats.flagPulls / stats.flagPullAttempts) * 100).toFixed(1),
      );
    }

    return stats;
  }

  /**
   * Get drop analysis for a player
   * @param {string} playerId - Player ID
   * @returns {Object} Drop analysis
   */
  getPlayerDropAnalysis(playerId) {
    const games = this.getAllGames({ forceSync: true });
    if (!Array.isArray(games)) {
      logger.warn(
        "getAllGames() did not return an array in getPlayerDropAnalysis",
      );
      return { totalDrops: 0, dropRate: 0, drops: [] };
    }
    const drops = [];

    games.forEach((game) => {
      if (!game.plays) {
        return;
      }

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
      // Count by severity
      severityCounts[drop.dropSeverity] =
        (severityCounts[drop.dropSeverity] || 0) + 1;

      // Count by reason
      reasonCounts[drop.dropReason] = (reasonCounts[drop.dropReason] || 0) + 1;

      // Count by route
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
  }

  /**
   * Get flag pull analysis for a defender
   * @param {string} playerId - Player ID (defender)
   * @returns {Object} Flag pull analysis
   */
  getDefenderFlagPullAnalysis(playerId) {
    const games = this.getAllGames({ forceSync: true });
    if (!Array.isArray(games)) {
      logger.warn(
        "getAllGames() did not return an array in getDefenderFlagPullAnalysis",
      );
      return { successRate: 0, attempts: [] };
    }
    const attempts = [];

    games.forEach((game) => {
      if (!game.plays) {
        return;
      }

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

    // Analyze miss reasons
    const missReasons = {};
    attempts.forEach((attempt) => {
      if (!attempt.isSuccessful && attempt.missReason) {
        missReasons[attempt.missReason] =
          (missReasons[attempt.missReason] || 0) + 1;
      }
    });

    return {
      totalAttempts: attempts.length,
      successful: successful,
      missed: missed,
      successRate:
        attempts.length > 0
          ? ((successful / attempts.length) * 100).toFixed(1)
          : 0,
      attempts: attempts,
      missReasons: missReasons,
      mostCommonMissReason: this.getMostCommon(missReasons),
    };
  }

  /**
   * Get QB accuracy analysis
   * @param {string} playerId - Player ID (QB)
   * @returns {Object} QB accuracy analysis
   */
  getQBAccuracyAnalysis(playerId) {
    const games = this.getAllGames({ forceSync: true });
    if (!Array.isArray(games)) {
      logger.warn(
        "getAllGames() did not return an array in getPlayerThrowAnalysis",
      );
      return { totalThrows: 0, throws: [] };
    }
    const throws = [];

    games.forEach((game) => {
      if (!game.plays) {
        return;
      }

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

    // Analyze by route type
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
      if (t.outcome === "completion") {
        byRoute[t.routeType].completions++;
      }
      if (t.outcome !== "completion") {
        byRoute[t.routeType].incompletions++;
      }
      if (t.isDrop) {
        byRoute[t.routeType].drops++;
      }
      if (t.throwAccuracy === "bad" || t.throwAccuracy === "terrible") {
        byRoute[t.routeType].badThrows++;
      }
    });

    // Calculate completion % by route
    Object.keys(byRoute).forEach((route) => {
      const data = byRoute[route];
      if (data.attempts > 0) {
        data.completionPercentage = (
          (data.completions / data.attempts) *
          100
        ).toFixed(1);
        data.badThrowRate = ((data.badThrows / data.attempts) * 100).toFixed(1);
      }
    });

    return {
      totalThrows: throws.length,
      throws: throws,
      byRoute: byRoute,
    };
  }

  /**
   * Get team statistics for a game
   * @param {string} gameId - Game ID
   * @returns {Object} Team statistics
   */
  getTeamStats(gameId) {
    const game = this.getGame(gameId);

    if (!game || !game.plays) {
      return null;
    }

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
        if (play.outcome === "completion") {
          stats.completions++;
        } else {
          stats.incompletions++;
        }
        if (play.isDrop) {
          stats.drops++;
        }
        if (play.outcome === "interception") {
          stats.interceptions++;
        }
      } else if (play.playType === "run") {
        stats.rushingAttempts++;
        stats.totalYards += play.yardsGained || 0;
      } else if (play.playType === "flag_pull") {
        stats.flagPullAttempts++;
        if (play.isSuccessful) {
          stats.flagPulls++;
        }
      }
    });

    // Calculate percentages using validated calculation service
    if (stats.passAttempts > 0) {
      try {
        const completionResult =
          statisticsCalculationService.calculateCompletionPercentage(
            stats.completions,
            stats.passAttempts,
          );
        stats.completionPercentage = completionResult.percentage.toFixed(1);
      } catch (error) {
        logger.warn("Error calculating completion percentage:", error);
        stats.completionPercentage = "0.0";
      }

      try {
        const dropRateResult = statisticsCalculationService.calculateDropRate(
          stats.drops,
          stats.passAttempts,
        );
        stats.dropRate = dropRateResult.rate.toFixed(1);
        stats.dropRateSeverity = dropRateResult.severity;
        stats.dropRateRecommendation = dropRateResult.recommendation;
      } catch (error) {
        logger.warn("Error calculating drop rate:", error);
        stats.dropRate = "0.0";
      }
    }

    if (stats.flagPullAttempts > 0) {
      try {
        const flagPullResult =
          statisticsCalculationService.calculateFlagPullSuccessRate(
            stats.flagPulls,
            stats.flagPullAttempts,
          );
        stats.flagPullSuccessRate = flagPullResult.rate.toFixed(1);
        stats.flagPullConfidence95 = flagPullResult.confidence95;
        stats.flagPullSampleSizeAdequate = flagPullResult.sampleSizeAdequate;
        stats.defensiveGrade = flagPullResult.defensiveGrade;
      } catch (error) {
        logger.warn("Error calculating flag pull success rate:", error);
        stats.flagPullSuccessRate = "0.0";
      }
    }

    return stats;
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
