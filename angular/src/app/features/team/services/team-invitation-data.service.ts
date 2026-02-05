import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

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

@Injectable({
  providedIn: "root",
})
export class TeamInvitationDataService {
  private readonly supabaseService = inject(SupabaseService);

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
    const { data: inviter, error } = await this.supabaseService.client
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", inviterId)
      .single();

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
