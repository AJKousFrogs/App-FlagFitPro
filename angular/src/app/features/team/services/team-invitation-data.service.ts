import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

export interface InvitationRecord {
  id: string;
  team_id: string;
  email: string;
  role: string | null;
  position: string | null;
  jersey_number: number | null;
  status: string;
  expires_at: string;
  invited_by: string | null;
  teams?: { name?: string } | { name?: string }[] | null;
}

export interface InviterRecord {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface InvitationUserProfileRecord {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  country?: string | null;
  phone?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  date_of_birth?: string | null;
  position?: string | null;
  jersey_number?: number | null;
}

@Injectable({
  providedIn: "root",
})
export class TeamInvitationDataService {
  private readonly supabaseService = inject(SupabaseService);
  private usersTableUnavailable = false;

  getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  async getInvitationByToken(token: string): Promise<{
    invitation: InvitationRecord | null;
    error: { code?: string; message?: string } | null;
  }> {
    const { data: invitation, error } = await this.supabaseService.client
      .from("team_invitations")
      .select(
        `
          id,
          team_id,
          email,
          role,
          position,
          jersey_number,
          status,
          expires_at,
          invited_by,
          teams!team_invitations_team_id_fkey (
            id,
            name
          )
        `,
      )
      .eq("token", token)
      .single();

    return { invitation: invitation ?? null, error };
  }

  async getInviter(inviterId: string): Promise<{
    inviter: InviterRecord | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { inviter: null, error: null };
    }

    const { data: inviter, error } = await this.supabaseService.client
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", inviterId)
      .single();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { inviter: null, error: null };
    }

    return { inviter: inviter ?? null, error };
  }

  async acceptInvitation(invitationId: string): Promise<{
    error: { code?: string; message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    return { error };
  }

  async createTeamMember(input: {
    teamId: string;
    userId: string;
    role: string;
    position: string | null;
    jerseyNumber: number | null;
  }): Promise<{
    error: { code?: string; message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("team_members")
      .insert({
        team_id: input.teamId,
        user_id: input.userId,
        role: input.role,
        position: input.position,
        jersey_number: input.jerseyNumber,
        status: "active",
        joined_at: new Date().toISOString(),
      });

    return { error };
  }

  async fetchUserProfile(userId: string): Promise<{
    profile: InvitationUserProfileRecord | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { profile: null, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("users")
      .select(
        "full_name, first_name, last_name, email, country, phone, height_cm, weight_kg, date_of_birth, position, jersey_number",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { profile: null, error: null };
    }

    return {
      profile: (data as InvitationUserProfileRecord) ?? null,
      error,
    };
  }

  async fetchTeamPlayer(input: {
    userId: string;
    teamId: string;
  }): Promise<{
    player: { id?: string } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("team_players")
      .select("id")
      .eq("user_id", input.userId)
      .eq("team_id", input.teamId)
      .maybeSingle();

    return {
      player: (data as { id?: string }) ?? null,
      error,
    };
  }

  async insertTeamPlayer(data: Record<string, unknown>): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("team_players")
      .insert(data);

    return { error };
  }

  async updateTeamPlayer(playerId: string, data: Record<string, unknown>): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("team_players")
      .update(data)
      .eq("id", playerId);

    return { error };
  }

  async revertInvitation(invitationId: string): Promise<void> {
    await this.supabaseService.client
      .from("team_invitations")
      .update({ status: "pending", accepted_at: null })
      .eq("id", invitationId);
  }

  async declineInvitation(invitationId: string): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("team_invitations")
      .update({
        status: "declined",
      })
      .eq("id", invitationId);

    return { error };
  }
}
