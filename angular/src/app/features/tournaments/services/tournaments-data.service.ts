import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";

@Injectable({
  providedIn: "root",
})
export class TournamentsDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly teamMembershipService = inject(TeamMembershipService);

  async fetchPlayerAvailability(input: {
    tournamentId: string;
    playerId: string;
  }): Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client
      .from("player_tournament_availability")
      .select("*")
      .eq("tournament_id", input.tournamentId)
      .eq("player_id", input.playerId)
      .single();

    return { data: (data as Record<string, unknown>) ?? null, error };
  }

  async calculatePlayerTournamentCost(input: {
    tournamentId: string;
    teamId: string;
  }): Promise<{ data: number | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client.rpc(
      "calculate_player_tournament_cost",
      {
        p_tournament_id: input.tournamentId,
        p_team_id: input.teamId,
      },
    );

    return { data: (data as number) ?? null, error };
  }

  async getTeamMemberId(input: {
    userId: string;
    teamId: string;
  }): Promise<{ memberId: string | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client
      .from("team_members")
      .select("id")
      .eq("user_id", input.userId)
      .eq("team_id", input.teamId)
      .maybeSingle();

    return { memberId: (data as { id?: string })?.id ?? null, error };
  }

  async upsertAvailability(input: {
    availabilityData: Record<string, unknown>;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("player_tournament_availability")
      .upsert(input.availabilityData, {
        onConflict: "player_id,tournament_id",
      });

    return { error };
  }

  async fetchTeamMembers(teamId: string): Promise<{
    members: Record<string, unknown>[];
    error: { message?: string } | null;
  }> {
    const { data: members, error } = await this.supabaseService.client
      .from("team_members")
      .select(
        `
          id,
          role,
          users:user_id(raw_user_meta_data)
        `,
      )
      .eq("team_id", teamId)
      .eq("role", "player");

    return { members: (members as Record<string, unknown>[]) ?? [], error };
  }

  async fetchTeamAvailability(input: {
    tournamentId: string;
    teamId: string;
  }): Promise<{ availability: Record<string, unknown>[]; error: { message?: string } | null }> {
    const { data: availability, error } = await this.supabaseService.client
      .from("player_tournament_availability")
      .select("*")
      .eq("tournament_id", input.tournamentId)
      .eq("team_id", input.teamId);

    return {
      availability: (availability as Record<string, unknown>[]) ?? [],
      error,
    };
  }

  async fetchTournamentBudget(input: {
    tournamentId: string;
    teamId: string;
  }): Promise<{ budget: Record<string, unknown> | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client
      .from("tournament_budgets")
      .select("*")
      .eq("tournament_id", input.tournamentId)
      .eq("team_id", input.teamId)
      .single();

    return { budget: (data as Record<string, unknown>) ?? null, error };
  }

  async upsertTournamentBudget(input: {
    budgetData: Record<string, unknown>;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("tournament_budgets")
      .upsert(input.budgetData, {
        onConflict: "tournament_id,team_id",
      });

    return { error };
  }

  async getCurrentTeamId(userId: string): Promise<{
    teamId: string | null;
    error: { message?: string } | null;
  }> {
    const loadedMembership = await this.teamMembershipService.loadMembership();
    if (loadedMembership?.userId === userId && loadedMembership.teamId) {
      return { teamId: loadedMembership.teamId, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return { teamId: (data as { team_id?: string })?.team_id ?? null, error };
  }
}
