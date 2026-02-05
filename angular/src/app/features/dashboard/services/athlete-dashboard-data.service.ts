import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface UpcomingGameRecord {
  id: string;
  game_date: string;
  opponent?: string | null;
  location?: string | null;
  game_time?: string | null;
  is_home?: boolean | null;
}

@Injectable({
  providedIn: "root",
})
export class AthleteDashboardDataService {
  private readonly supabaseService = inject(SupabaseService);

  async getUpcomingGames(input: {
    startDate: string;
    endDate: string;
  }): Promise<{
    games: UpcomingGameRecord[];
    error: { message?: string } | null;
  }> {
    const { data: games, error } = await this.supabaseService.client
      .from("games")
      .select("id, game_date, opponent, location, game_time, is_home")
      .gte("game_date", input.startDate)
      .lte("game_date", input.endDate)
      .order("game_date", { ascending: true })
      .limit(1);

    return { games: games ?? [], error };
  }

  async getTeamMembership(userId: string): Promise<{
    teamId: string | null;
    error: { message?: string } | null;
  }> {
    const { data: teamMember, error } = await this.supabaseService.client
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .maybeSingle();

    return { teamId: teamMember?.team_id ?? null, error };
  }

  async getUpcomingTeamGames(input: {
    teamId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    games: UpcomingGameRecord[];
    error: { message?: string } | null;
  }> {
    const { data: teamGames, error } = await this.supabaseService.client
      .from("team_games")
      .select("id, game_date, opponent, location, game_time, is_home")
      .eq("team_id", input.teamId)
      .gte("game_date", input.startDate)
      .lte("game_date", input.endDate)
      .order("game_date", { ascending: true })
      .limit(1);

    return { games: teamGames ?? [], error };
  }
}
