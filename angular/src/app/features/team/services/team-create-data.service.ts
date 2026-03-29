import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

export interface CreatedTeamRecord {
  id: string;
}

@Injectable({
  providedIn: "root",
})
export class TeamCreateDataService {
  private readonly supabaseService = inject(SupabaseService);
  private teamsTableLegacyMode = false;

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
    const basePayload = this.teamsTableLegacyMode
      ? {
          name: input.name,
          description: input.description,
          home_city: input.location,
          league: input.sport,
          season: `${new Date().getUTCFullYear()}`,
          coach_id: input.ownerId,
          approval_status: "approved",
          approved_by: input.ownerId,
          approved_at: new Date().toISOString(),
          application_notes: `Visibility preference: ${input.visibility}`,
        }
      : {
          name: input.name,
          description: input.description,
          location: input.location,
          sport: input.sport,
          visibility: input.visibility,
          owner_id: input.ownerId,
          created_by: input.ownerId,
        };

    let { data: team, error } = await this.supabaseService.client
      .from("teams")
      .insert(basePayload)
      .select()
      .single();

    if (error && isBenignSupabaseQueryError(error) && !this.teamsTableLegacyMode) {
      this.teamsTableLegacyMode = true;
      ({ data: team, error } = await this.supabaseService.client
        .from("teams")
        .insert({
          name: input.name,
          description: input.description,
          home_city: input.location,
          league: input.sport,
          season: `${new Date().getUTCFullYear()}`,
          coach_id: input.ownerId,
          approval_status: "approved",
          approved_by: input.ownerId,
          approved_at: new Date().toISOString(),
          application_notes: `Visibility preference: ${input.visibility}`,
        })
        .select()
        .single());
    }

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
        role: "coach",
        status: "active",
        joined_at: new Date().toISOString(),
        role_approval_status: "approved",
        role_approved_by: input.userId,
        role_approved_at: new Date().toISOString(),
      });

    return { error };
  }

  async rollbackTeam(teamId: string): Promise<void> {
    await this.supabaseService.client.from("teams").delete().eq("id", teamId);
  }
}
