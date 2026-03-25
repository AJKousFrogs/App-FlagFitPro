import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { getTeamInvitationRpcError } from "../../team/utils/team-invitation-rpc.utils";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

@Injectable({
  providedIn: "root",
})
export class ProfileDataService {
  private readonly supabaseService = inject(SupabaseService);
  private usersTableUnavailable = false;

  async fetchTrainingSessions(userId: string): Promise<{
    sessions: Array<{
      id: string;
      status?: string | null;
      completed_at?: string | null;
      session_date?: string | null;
      duration_minutes?: number | null;
    }>;
    error: { code?: string; message?: string } | null;
  }> {
    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("id, status, completed_at, session_date, duration_minutes")
      .eq("user_id", userId);

    return { sessions: (sessions as typeof sessions) ?? [], error };
  }

  async fetchGameParticipations(userId: string): Promise<{
    participations: Array<{ id: string }>;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("game_participations")
      .select("id, game_id, status")
      .eq("player_id", userId)
      .eq("status", "played");

    return { participations: (data as Array<{ id: string }>) ?? [], error };
  }

  async fetchGamesByParticipant(userId: string): Promise<{
    games: Array<{ id: string }>;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("games")
      .select("id")
      .contains("participants", [userId]);

    return { games: (data as Array<{ id: string }>) ?? [], error };
  }

  async fetchWellnessEntries(userId: string): Promise<{
    entries: Array<{ energy_level?: number | null; sleep_quality?: number | null; checkin_date?: string }>;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("daily_wellness_checkin")
      .select("energy_level, sleep_quality, checkin_date")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false })
      .limit(7);

    return { entries: (data as typeof data) ?? [], error };
  }

  async uploadAvatar(input: {
    path: string;
    file: File;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client.storage
      .from("avatars")
      .upload(input.path, input.file, {
        cacheControl: "3600",
        upsert: true,
      });
    return { error };
  }

  getAvatarPublicUrl(path: string): { publicUrl: string } {
    const { data } = this.supabaseService.client.storage
      .from("avatars")
      .getPublicUrl(path);
    return { publicUrl: data.publicUrl };
  }

  async updateProfilePhoto(input: {
    userId: string;
    avatarUrl: string;
  }): Promise<{ error: { message?: string } | null }> {
    if (this.usersTableUnavailable) {
      return { error: null };
    }

    const { error } = await this.supabaseService.client
      .from("users")
      .update({
        profile_photo_url: input.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.userId);

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { error: null };
    }

    return { error };
  }

  async fetchProfilePhoto(userId: string): Promise<{
    profilePhotoUrl: string | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { profilePhotoUrl: null, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("users")
      .select("profile_photo_url")
      .eq("id", userId)
      .maybeSingle();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { profilePhotoUrl: null, error: null };
    }

    return { profilePhotoUrl: data?.profile_photo_url ?? null, error };
  }

  async getAuthUser(): Promise<{
    user: { created_at?: string | null } | null;
    error: { message?: string } | null;
  }> {
    const {
      data: { user },
      error,
    } = await this.supabaseService.client.auth.getUser();
    return { user: user ?? null, error };
  }

  async fetchPendingInvitations(email: string): Promise<{
    invitations: Array<Record<string, unknown>>;
    error: { code?: string; message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("team_invitations")
      .select(
        `
          id,
          team_id,
          role,
          status,
          expires_at,
          created_at,
          invited_by,
          teams:team_id(name)
        `,
      )
      .eq("email", email)
      .in("status", ["pending", "expired"])
      .order("created_at", { ascending: false });

    return { invitations: (data as Record<string, unknown>[]) ?? [], error };
  }

  async acceptInvitation(invitationId: string): Promise<{
    error: { message?: string } | null;
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
