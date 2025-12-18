/* eslint-disable no-console */
/**
 * Player Profile Service
 * Manages player schedules, league commitments, and preferences
 */

import { storageService } from './storage-service-unified.js';

class PlayerProfileService {
  /**
   * Create or update player profile
   * @param {Object} profile - Player profile data
   */
  savePlayerProfile(profile) {
    const profileData = {
      id: profile.id || this.generatePlayerId(),
      name: profile.name,
      jerseyNumber: profile.jerseyNumber,
      position: profile.position,
      practices: profile.practices || [],
      games: profile.games || [],
      leagueGames: profile.leagueGames || [],
      preferences: profile.preferences || {},
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const profiles = this.getAllProfiles();
    const existingIndex = profiles.findIndex(p => p.id === profileData.id);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profileData;
    } else {
      profiles.push(profileData);
    }

    storageService.set("playerProfiles", profiles, { usePrefix: false });
    return profileData;
  }

  /**
   * Get player profile by ID
   */
  getPlayerProfile(playerId) {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === playerId);
  }

  /**
   * Get all player profiles
   */
  getAllProfiles() {
    return storageService.get("playerProfiles", [], { usePrefix: false });
  }

  /**
   * Get current active profile
   */
  getCurrentProfile() {
    const currentId = storageService.get("currentPlayerId", null, { usePrefix: false });
    if (currentId) {
      return this.getPlayerProfile(currentId);
    }
    return null;
  }

  /**
   * Set current active profile
   */
  setCurrentProfile(playerId) {
    storageService.set("currentPlayerId", playerId, { usePrefix: false });
  }

  /**
   * Add practice to player schedule
   */
  addPractice(playerId, practice) {
    const profile = this.getPlayerProfile(playerId);
    if (!profile) {return null;}

    profile.practices.push({
      date: practice.date,
      type: practice.type || "flag_practice",
      duration: practice.duration || 120,
      intensity: practice.intensity || "medium",
      notes: practice.notes || "",
    });

    return this.savePlayerProfile(profile);
  }

  /**
   * Add league game to player schedule
   */
  addLeagueGame(playerId, leagueGame) {
    const profile = this.getPlayerProfile(playerId);
    if (!profile) {return null;}

    profile.leagueGames.push({
      date: leagueGame.date,
      league: leagueGame.league,
      opponent: leagueGame.opponent,
      location: leagueGame.location,
      gameDay: leagueGame.gameDay || 1,
      maxGames: leagueGame.maxGames || 3,
    });

    return this.savePlayerProfile(profile);
  }

  /**
   * Parse uploaded schedule file and add to profile
   */
  async parseAndAddSchedule(playerId, file) {
    const { scheduleFileParser } = await import("./scheduleFileParser.js");
    
    try {
      const parsedSchedule = await scheduleFileParser.parseFile(file);
      const profile = this.getPlayerProfile(playerId);
      
      if (!profile) {return null;}

      // Add game days
      if (parsedSchedule.gameDays) {
        parsedSchedule.gameDays.forEach(gameDay => {
          profile.leagueGames.push({
            date: gameDay.date,
            league: "Uploaded Schedule",
            opponent: "",
            location: "",
            gameDay: 1,
            maxGames: 3,
          });
        });
      }

      // Add practices from workouts
      if (parsedSchedule.workouts) {
        parsedSchedule.workouts.forEach(workout => {
          profile.practices.push({
            date: workout.date,
            type: this.mapWorkoutTypeToPracticeType(workout.type),
            duration: workout.duration || 120,
            intensity: this.mapWorkoutTypeToIntensity(workout.type),
            notes: workout.notes || "",
          });
        });
      }

      return this.savePlayerProfile(profile);
    } catch (error) {
      console.error("Error parsing schedule file:", error);
      throw error;
    }
  }

  /**
   * Map workout type to practice type
   */
  mapWorkoutTypeToPracticeType(workoutType) {
    const typeMap = {
      "flag_practice": "flag_practice",
      "technique": "technique_training",
      "practice": "flag_practice",
      "training": "technique_training",
    };

    return typeMap[workoutType?.toLowerCase()] || "flag_practice";
  }

  /**
   * Map workout type to intensity
   */
  mapWorkoutTypeToIntensity(workoutType) {
    const intensityMap = {
      "flag_practice": "high",
      "technique": "medium",
      "practice": "high",
      "training": "medium",
    };

    return intensityMap[workoutType?.toLowerCase()] || "medium";
  }

  /**
   * Generate unique player ID
   */
  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create example profile for Aljoša Kous
   */
  createExampleProfile() {
    return {
      id: "aljosa_kous_55",
      name: "Aljoša Kous",
      jerseyNumber: 55,
      position: "WR/DB",
      practices: [],
      games: [],
      leagueGames: [
        // Austrian League - 5 weeks, one game day, up to 3 games max per game day
        // Example dates (adjust based on actual schedule)
        {
          date: "2026-04-20",
          league: "Austrian League",
          opponent: "TBD",
          location: "Austria",
          gameDay: 1,
          maxGames: 3,
        },
        {
          date: "2026-04-27",
          league: "Austrian League",
          opponent: "TBD",
          location: "Austria",
          gameDay: 1,
          maxGames: 3,
        },
        {
          date: "2026-05-04",
          league: "Austrian League",
          opponent: "TBD",
          location: "Austria",
          gameDay: 1,
          maxGames: 3,
        },
        {
          date: "2026-05-11",
          league: "Austrian League",
          opponent: "TBD",
          location: "Austria",
          gameDay: 1,
          maxGames: 3,
        },
        {
          date: "2026-05-18",
          league: "Austrian League",
          opponent: "TBD",
          location: "Austria",
          gameDay: 1,
          maxGames: 3,
        },
        // Slovenian National League games (add actual dates)
      ],
      preferences: {
        preferredTrainingDays: [1, 3, 5], // Monday, Wednesday, Friday
        maxTrainingDaysPerWeek: 5,
        restDayPreference: 0, // Sunday
      },
    };
  }
}

// Export singleton instance
export const playerProfileService = new PlayerProfileService();

