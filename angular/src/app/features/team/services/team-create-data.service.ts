import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface CreatedTeamRecord {
  id: string;
}

@Injectable({
  providedIn: "root",
})
export class TeamCreateDataService {
  private readonly supabaseService = inject(SupabaseService);

  async createTeam(input: {
    name: string;
    description: string | null;
    location: string | null;
    sport: string;
    visibility: string;
    ownerId: string;
  }): Promise<{
    team: CreatedTeamRecord | null;
    error: { message?: string } | null;
  }> {
    const { data: team, error } = await this.supabaseService.client
      .from("teams")
      .insert({
        name: input.name,
        description: input.description,
        location: input.location,
        sport: input.sport,
        visibility: input.visibility,
        owner_id: input.ownerId,
        created_by: input.ownerId,
      })
      .select()
      .single();

    return { team: team ?? null, error };
  }

  async createOwnerMembership(input: {
    teamId: string;
    userId: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("team_members")
      .insert({
        team_id: input.teamId,
        user_id: input.userId,
        role: "owner",
        status: "active",
        joined_at: new Date().toISOString(),
      });

    return { error };
  }

  async rollbackTeam(teamId: string): Promise<void> {
    await this.supabaseService.client.from("teams").delete().eq("id", teamId);
  }
}
