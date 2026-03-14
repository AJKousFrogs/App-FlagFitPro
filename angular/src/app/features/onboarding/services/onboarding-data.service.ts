import { Injectable, inject } from "@angular/core";
import type { User } from "@supabase/supabase-js";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class OnboardingDataService {
  private readonly supabaseService = inject(SupabaseService);

  getCurrentUser() {
    return this.supabaseService.currentUser();
  }

  async updateAuthUser(payload: Record<string, unknown>) {
    return await this.supabaseService.updateUser(payload);
  }

  async getAuthUser(): Promise<{
    data: { user: User | null } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client.auth.getUser();
    return { data: data ?? null, error };
  }

  async resendVerificationEmail(email: string): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client.auth.resend({
      type: "signup",
      email,
    });
    return { error };
  }

  async fetchUserProfileByEmail(email: string): Promise<{
    data: {
      full_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      position?: string | null;
      experience_level?: string | null;
    } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("users")
      .select("full_name, first_name, last_name, position, experience_level")
      .eq("email", email)
      .maybeSingle();

    return { data: data ?? null, error };
  }

  async fetchApprovedTeams(): Promise<{
    teams: { id: string; name: string }[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("teams")
      .select("id, name")
      .eq("approval_status", "approved")
      .order("name");

    return { teams: (data as { id: string; name: string }[]) ?? [], error };
  }

  async updateUserProfileByEmail(
    email: string,
    profile: Record<string, unknown>,
  ): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("users")
      .update(profile)
      .eq("email", email);
    return { error };
  }

  async insertUserProfile(
    profile: Record<string, unknown>,
  ): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("users")
      .insert(profile);
    return { error };
  }

  async upsertUserPreferences(
    preferences: Record<string, unknown>,
  ): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("user_preferences")
      .upsert(preferences, { onConflict: "user_id" });
    return { error };
  }

  async upsertAthleteTrainingConfig(
    config: Record<string, unknown>,
  ): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("athlete_training_config")
      .upsert(config, { onConflict: "user_id" });
    return { error };
  }

  async findTeamByName(name: string): Promise<{
    team: { id: string } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("teams")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    return { team: (data as { id: string }) ?? null, error };
  }

  async createTeam(input: {
    name: string;
    createdBy: string;
  }): Promise<{
    team: { id: string } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("teams")
      .insert({
        name: input.name,
        created_by: input.createdBy,
      })
      .select()
      .single();

    return { team: (data as { id: string }) ?? null, error };
  }

  async findTeamMember(input: {
    teamId: string;
    userId: string;
  }): Promise<{ member: { id: string } | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client
      .from("team_members")
      .select("id")
      .eq("team_id", input.teamId)
      .eq("user_id", input.userId)
      .maybeSingle();

    return { member: (data as { id: string }) ?? null, error };
  }

  async addTeamMember(input: {
    teamId: string;
    userId: string;
    role: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("team_members")
      .insert({
        team_id: input.teamId,
        user_id: input.userId,
        role: input.role,
      });

    return { error };
  }
}
