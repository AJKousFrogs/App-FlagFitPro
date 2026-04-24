import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

@Injectable({
  providedIn: "root",
})
export class SettingsDataService {
  private readonly supabaseService = inject(SupabaseService);
  private usersTableUnavailable = false;

  private mapSettingsRows(
    rows: { setting_key?: string | null; setting_value?: unknown }[] | null,
  ): Record<string, unknown> | null {
    if (!rows || rows.length === 0) {
      return null;
    }

    return rows.reduce<Record<string, unknown>>((acc, row) => {
      if (row.setting_key) {
        acc[row.setting_key] = row.setting_value;
      }
      return acc;
    }, {});
  }

  private async upsertUserSettingsRows(userId: string, data: Record<string, unknown>) {
    const timestamp =
      typeof data.updated_at === "string"
        ? data.updated_at
        : new Date().toISOString();

    const rows = Object.entries(data)
      .filter(([key]) => key !== "user_id" && key !== "updated_at")
      .map(([setting_key, setting_value]) => ({
        user_id: userId,
        setting_key,
        setting_value,
        updated_at: timestamp,
      }));

    if (rows.length === 0) {
      return { data: null, error: null };
    }

    const { data: result, error } = await this.supabaseService.client
      .from("user_settings")
      .upsert(rows, { onConflict: "user_id,setting_key" })
      .select("setting_key, setting_value");

    return {
      data: this.mapSettingsRows(
        (result as { setting_key?: string | null; setting_value?: unknown }[]) ?? null,
      ),
      error,
    };
  }

  getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  async updateAuthUser(payload: Record<string, unknown>) {
    return await this.supabaseService.updateUser(payload);
  }

  async signOut() {
    return await this.supabaseService.signOut();
  }

  async fetchUserProfile(userId: string): Promise<{
    profile: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { profile: null, error: null };
    }

    const { data: profile, error } = await this.supabaseService.client
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { profile: null, error: null };
    }

    return { profile: (profile as Record<string, unknown>) ?? null, error };
  }

  async findUserRecord(userId: string): Promise<{
    user: { id?: string } | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { user: null, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { user: null, error: null };
    }

    return { user: (data as { id?: string }) ?? null, error };
  }

  async updateUser(userId: string, updateData: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { data: null, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { data: null, error: null };
    }

    return { data: (data as Record<string, unknown>) ?? null, error };
  }

  async insertUser(insertData: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { data: null, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("users")
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { data: null, error: null };
    }

    return { data: (data as Record<string, unknown>) ?? null, error };
  }

  async fetchTeamMember(userId: string): Promise<{
    member: { id?: string; team_id?: string } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("team_members")
      .select("id, team_id")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      member: (data as { id?: string; team_id?: string }) ?? null,
      error,
    };
  }

  async deleteTeamMember(memberId: string): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("team_members")
      .delete()
      .eq("id", memberId);
    return { error };
  }

  async insertTeamMember(data: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: result, error } = await this.supabaseService.client
      .from("team_members")
      .insert(data)
      .select()
      .maybeSingle();
    return { data: (result as Record<string, unknown>) ?? null, error };
  }

  async updateTeamMember(memberId: string, data: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: result, error } = await this.supabaseService.client
      .from("team_members")
      .update(data)
      .eq("id", memberId)
      .select()
      .maybeSingle();
    return { data: (result as Record<string, unknown>) ?? null, error };
  }

  async fetchTeamPlayer(params: {
    userId: string;
    teamId: string;
  }): Promise<{
    player: { id?: string } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("team_players")
      .select("id")
      .eq("user_id", params.userId)
      .eq("team_id", params.teamId)
      .maybeSingle();

    return {
      player: (data as { id?: string }) ?? null,
      error,
    };
  }

  async fetchAnyTeamPlayer(userId: string): Promise<{
    player: { id?: string; team_id?: string } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("team_players")
      .select("id, team_id")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      player: (data as { id?: string; team_id?: string }) ?? null,
      error,
    };
  }

  async updateTeamPlayer(playerId: string, data: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: result, error } = await this.supabaseService.client
      .from("team_players")
      .update(data)
      .eq("id", playerId)
      .select()
      .maybeSingle();

    return { data: (result as Record<string, unknown>) ?? null, error };
  }

  async insertTeamPlayer(data: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: result, error } = await this.supabaseService.client
      .from("team_players")
      .insert(data)
      .select()
      .maybeSingle();

    return { data: (result as Record<string, unknown>) ?? null, error };
  }

  async insertPhysicalMeasurement(data: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: result, error } = await this.supabaseService.client
      .from("physical_measurements")
      .insert(data)
      .select()
      .maybeSingle();

    return { data: (result as Record<string, unknown>) ?? null, error };
  }

  async fetchUserSettings(userId: string): Promise<{
    settings: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("user_settings")
      .select("setting_key, setting_value")
      .eq("user_id", userId);
    return {
      settings: this.mapSettingsRows(
        (data as { setting_key?: string | null; setting_value?: unknown }[]) ?? null,
      ),
      error,
    };
  }

  async updateUserSettings(userId: string, data: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    return await this.upsertUserSettingsRows(userId, data);
  }

  async insertUserSettings(data: Record<string, unknown>): Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const userId = typeof data.user_id === "string" ? data.user_id : null;
    if (!userId) {
      return { data: null, error: { message: "user_id is required" } };
    }
    return await this.upsertUserSettingsRows(userId, data);
  }

  async insertDeletionRequest(data: Record<string, unknown>): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("account_deletion_requests")
      .insert(data);
    return { error };
  }

  async upsertUserSecurity(data: Record<string, unknown>): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("user_security")
      .upsert(data);
    return { error };
  }

  async updateUserSecurity(userId: string, data: Record<string, unknown>): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("user_security")
      .update(data)
      .eq("user_id", userId);
    return { error };
  }

  async fetchExportProfile(userId: string): Promise<{
    profile: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { profile: null, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { profile: null, error: null };
    }

    return { profile: (data as Record<string, unknown>) ?? null, error };
  }

  async fetchExportTraining(userId: string, limit: number): Promise<{
    sessions: Record<string, unknown>[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(limit);
    return { sessions: (data as Record<string, unknown>[]) ?? [], error };
  }

  async fetchExportWellness(userId: string, limit: number): Promise<{
    checkins: Record<string, unknown>[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("daily_wellness_checkin")
      .select("*")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false })
      .limit(limit);
    return { checkins: (data as Record<string, unknown>[]) ?? [], error };
  }

  async fetchExportAchievements(userId: string): Promise<{
    achievements: Record<string, unknown>[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId);
    return { achievements: (data as Record<string, unknown>[]) ?? [], error };
  }

  async fetchApprovedTeams(): Promise<{
    teams: { id: string; name: string }[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("teams")
      .select("id, name")
      .neq("approval_status", "rejected")
      .order("name");
    return { teams: (data as { id: string; name: string }[]) ?? [], error };
  }

  async createTeam(data: Record<string, unknown>): Promise<{
    team: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: team, error } = await this.supabaseService.client
      .from("teams")
      .insert(data)
      .select("id, name")
      .maybeSingle();
    return { team: (team as Record<string, unknown>) ?? null, error };
  }

  async insertApprovalRequest(data: Record<string, unknown>): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("approval_requests")
      .insert(data);
    return { error };
  }

  async invokeFunction(name: string, body: Record<string, unknown>): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client.functions.invoke(name, {
      body,
    });
    return { error };
  }

  async fetchExistingMembership(input: {
    userId: string;
    teamId: string;
  }): Promise<{ membership: { id?: string } | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client
      .from("team_members")
      .select("id")
      .eq("user_id", input.userId)
      .eq("team_id", input.teamId)
      .maybeSingle();
    return { membership: (data as { id?: string }) ?? null, error };
  }

  async fetchOtherMembership(input: {
    userId: string;
    teamId: string;
  }): Promise<{ membership: { id?: string } | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client
      .from("team_members")
      .select("id, team_id")
      .eq("user_id", input.userId)
      .neq("team_id", input.teamId)
      .maybeSingle();
    return { membership: (data as { id?: string }) ?? null, error };
  }
}
