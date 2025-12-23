/**
 * Player Service
 * Handles fetching and managing player data from Supabase
 */

import { getSupabase, safeSupabaseQuery } from "./supabase-client.js";
import { logger } from "../../logger.js";

class PlayerService {
  constructor() {
    this.supabase = getSupabase();
  }

  /**
   * Get all players for a coach's team
   * @param {string} coachId - The ID of the coach
   * @returns {Promise<Array>} List of players with their latest stats
   */
  async getTeamPlayers(coachId) {
    try {
      // 1. Get the team(s) managed by this coach
      const { data: teamData, error: teamError } = await safeSupabaseQuery(
        this.supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", coachId)
          .eq("role", "coach"),
        "PlayerService:GetCoachTeams"
      );

      if (teamError || !teamData?.length) return [];

      const teamIds = teamData.map(t => t.team_id);

      // 2. Get all players in those teams
      const { data: players, error: playersError } = await safeSupabaseQuery(
        this.supabase
          .from("team_members")
          .select(`
            user_id,
            role,
            users:user_id (
              id,
              name,
              email,
              user_metadata
            )
          `)
          .in("team_id", teamIds)
          .eq("role", "player"),
        "PlayerService:GetTeamPlayers"
      );

      if (playersError) throw playersError;

      // 3. Get latest performance stats for these players
      const playerIds = players.map(p => p.user_id);
      const { data: performanceStats, error: statsError } = await safeSupabaseQuery(
        this.supabase
          .from("athlete_performance_tests")
          .select("*")
          .in("user_id", playerIds)
          .order("test_date", { ascending: false }),
        "PlayerService:GetPerformanceStats"
      );

      // Map everything together to match the UI's expected format
      return players.map(p => {
        const user = p.users;
        const stats = performanceStats?.find(s => s.user_id === p.user_id) || {};
        
        return {
          id: user.id,
          name: user.name || user.email,
          position: user.user_metadata?.position || "TBD",
          number: user.user_metadata?.jersey_number || "??",
          status: user.user_metadata?.status || "active",
          olympicScore: stats.overall_score || 0,
          accuracy: stats.accuracy_rating ? `${stats.accuracy_rating}%` : "N/A",
          fortyYard: stats.forty_yard_dash ? `${stats.forty_yard_dash}s` : "N/A",
          games: user.user_metadata?.games_played || 0
        };
      });

    } catch (error) {
      logger.error("Failed to fetch real team players:", error);
      return [];
    }
  }
}

export const playerService = new PlayerService();

