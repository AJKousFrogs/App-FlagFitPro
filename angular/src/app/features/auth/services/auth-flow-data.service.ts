import { Injectable, inject } from "@angular/core";
import type { Session } from "@supabase/supabase-js";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class AuthFlowDataService {
  private readonly supabaseService = inject(SupabaseService);

  getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  getCurrentSession() {
    return this.supabaseService.getSession();
  }

  async updateAuthUser(payload: Record<string, unknown>) {
    return await this.supabaseService.updateUser(payload);
  }

  async signOut() {
    return await this.supabaseService.signOut();
  }

  async setSession(input: {
    accessToken: string;
    refreshToken: string;
  }): Promise<{
    data: { session: Session | null } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client.auth.setSession({
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
    });

    return { data: data ?? null, error };
  }

  async resendVerificationEmail(input: {
    email: string;
    redirectTo: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client.auth.resend({
      type: "signup",
      email: input.email,
      options: {
        emailRedirectTo: input.redirectTo,
      },
    });

    return { error };
  }

  async resetPasswordForEmail(input: {
    email: string;
    redirectTo: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(
      input.email,
      {
        redirectTo: input.redirectTo,
      },
    );

    return { error };
  }

  async getSession(): Promise<{
    data: { session: unknown | null };
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client.auth.getSession();
    return { data, error };
  }

  async getUserOnboardingStatus(userId: string): Promise<{
    data: { onboarding_completed?: boolean } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    return { data: data ?? null, error };
  }
}
