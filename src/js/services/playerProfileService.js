/**
 * Player Profile Service
 * Manages player schedules, league commitments, and preferences
 */

import { getSupabase, safeSupabaseQuery } from "./supabase-client.js";
import { logger } from "../../logger.js";
import { authManager } from "../../auth-manager.js";

class PlayerProfileService {
  constructor() {
    this.supabase = getSupabase();
  }

  /**
   * Create or update player profile in Supabase
   * @param {Object} profile - Player profile data
   */
  async savePlayerProfile(profile) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      const userId = profile.id || user.id;

      // Update user metadata for profile info
      const { error: authError } = await safeSupabaseQuery(
        this.supabase.auth.updateUser({
          data: {
            name: profile.name,
            jersey_number: profile.jerseyNumber,
            position: profile.position,
            preferences: profile.preferences || {},
          },
        }),
        "PlayerProfile:UpdateMetadata"
      );

      if (authError) throw authError;

      // Practices and LeagueGames are stored in their respective tables,
      // handled by addPractice and addLeagueGame methods.

      return {
        ...profile,
        id: userId,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[PlayerProfileService] Error saving profile:", error);
      throw error;
    }
  }

  /**
   * Get player profile by ID from Supabase
   */
  async getPlayerProfile(playerId) {
    try {
      // 1. Get user data from Supabase Auth (metadata contains profile info)
      const { data: { user }, error: userError } = await safeSupabaseQuery(
        this.supabase.auth.getUser(playerId),
        "PlayerProfile:GetUser"
      );

      if (userError || !user) return null;

      // 2. Get practices from training_sessions
      const { data: practices, error: practicesError } = await safeSupabaseQuery(
        this.supabase
          .from("training_sessions")
          .select("*")
          .eq("user_id", playerId),
        "PlayerProfile:GetPractices"
      );

      // 3. Get games from games table
      const { data: games, error: gamesError } = await safeSupabaseQuery(
        this.supabase
          .from("games")
          .select("*")
          .eq("team_id", user.user_metadata?.team_id || `TEAM_${playerId}`),
        "PlayerProfile:GetGames"
      );

      return {
        id: user.id,
        name: user.user_metadata?.name || user.email,
        jerseyNumber: user.user_metadata?.jersey_number,
        position: user.user_metadata?.position,
        preferences: user.user_metadata?.preferences || {},
        practices: practices || [],
        leagueGames: games || [],
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      logger.error(`[PlayerProfileService] Error getting profile for ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Get all player profiles (from team_members)
   */
  async getAllProfiles() {
    try {
      const user = authManager.getCurrentUser();
      if (!user) return [];

      const { data: profiles, error } = await safeSupabaseQuery(
        this.supabase
          .from("team_members")
          .select(`
            user_id,
            users:user_id (
              id,
              email,
              user_metadata
            )
          `)
          .eq("role", "player"),
        "PlayerProfile:GetAllProfiles"
      );

      if (error) throw error;

      return profiles.map(p => ({
        id: p.users.id,
        name: p.users.user_metadata?.name || p.users.email,
        jerseyNumber: p.users.user_metadata?.jersey_number,
        position: p.users.user_metadata?.position,
      }));
    } catch (error) {
      logger.error("[PlayerProfileService] Error getting all profiles:", error);
      return [];
    }
  }

  /**
   * Get current active profile
   */
  async getCurrentProfile() {
    const user = authManager.getCurrentUser();
    if (user) {
      return this.getPlayerProfile(user.id);
    }
    return null;
  }

  /**
   * Add practice to player schedule in Supabase
   */
  async addPractice(playerId, practice) {
    try {
      const { data, error } = await safeSupabaseQuery(
        this.supabase
          .from("training_sessions")
          .insert({
            user_id: playerId,
            session_date: practice.date,
            session_type: practice.type || "flag_practice",
            duration_minutes: practice.duration || 120,
            intensity_level: practice.intensity || "medium",
            notes: practice.notes || "",
          })
          .select()
          .single(),
        "PlayerProfile:AddPractice"
      );

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("[PlayerProfileService] Error adding practice:", error);
      throw error;
    }
  }

  /**
   * Add league game to player schedule in Supabase
   */
  async addLeagueGame(playerId, leagueGame) {
    try {
      const { data, error } = await safeSupabaseQuery(
        this.supabase
          .from("games")
          .insert({
            team_id: `TEAM_${playerId}`, // Default team ID for individual players
            game_date: leagueGame.date,
            opponent_team_name: leagueGame.opponent,
            location: leagueGame.location,
            tournament_name: leagueGame.league,
            game_type: "league_game",
          })
          .select()
          .single(),
        "PlayerProfile:AddLeagueGame"
      );

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("[PlayerProfileService] Error adding league game:", error);
      throw error;
    }
  }

  /**
   * Parse uploaded schedule file and add to profile in Supabase
   */
  async parseAndAddSchedule(playerId, file) {
    const { scheduleFileParser } = await import("./scheduleFileParser.js");

    try {
      const parsedSchedule = await scheduleFileParser.parseFile(file);
      
      // Add game days
      if (parsedSchedule.gameDays) {
        for (const gameDay of parsedSchedule.gameDays) {
          await this.addLeagueGame(playerId, {
            date: gameDay.date,
            league: "Uploaded Schedule",
            opponent: "",
            location: "",
          });
        }
      }

      // Add practices from workouts
      if (parsedSchedule.workouts) {
        for (const workout of parsedSchedule.workouts) {
          await this.addPractice(playerId, {
            date: workout.date,
            type: this.mapWorkoutTypeToPracticeType(workout.type),
            duration: workout.duration || 120,
            intensity: this.mapWorkoutTypeToIntensity(workout.type),
            notes: workout.notes || "",
          });
        }
      }

      return this.getPlayerProfile(playerId);
    } catch (error) {
      logger.error("[PlayerProfileService] Error parsing schedule file:", error);
      throw error;
    }
  }

  /**
   * Map workout type to practice type
   */
  mapWorkoutTypeToPracticeType(workoutType) {
    const typeMap = {
      flag_practice: "flag_practice",
      technique: "technique_training",
      practice: "flag_practice",
      training: "technique_training",
    };

    return typeMap[workoutType?.toLowerCase()] || "flag_practice";
  }

  /**
   * Map workout type to intensity
   */
  mapWorkoutTypeToIntensity(workoutType) {
    const intensityMap = {
      flag_practice: "high",
      technique: "medium",
      practice: "high",
      training: "medium",
    };

    return intensityMap[workoutType?.toLowerCase()] || "medium";
  }

  /**
   * Generate unique player ID (Legacy - use Supabase UUIDs now)
   */
  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const playerProfileService = new PlayerProfileService();
