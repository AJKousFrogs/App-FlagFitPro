import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";
import { getTeamInvitationRpcError } from "../utils/team-invitation-rpc.utils";

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
    const { data, error } = await this.supabaseService.client.rpc(
      "accept_team_invitation",
      { p_invitation_id: invitationId },
    );

    return {
      error: getTeamInvitationRpcError(
        data,
        error,
        "Failed to accept invitation.",
      ),
    };
  }

  async declineInvitation(invitationId: string): Promise<{
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client.rpc(
      "decline_team_invitation",
      { p_invitation_id: invitationId },
    );

    return {
      error: getTeamInvitationRpcError(
        data,
        error,
        "Failed to decline invitation.",
      ),
    };
  }
}
