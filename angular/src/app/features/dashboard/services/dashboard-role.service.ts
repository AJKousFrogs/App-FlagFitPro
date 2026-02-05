import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class DashboardRoleService {
  private readonly supabaseService = inject(SupabaseService);

  async getTeamMembershipRole(
    userId: string,
  ): Promise<{ role: string | null; error: { message?: string } | null }> {
    const { data: teamMembership, error } = await this.supabaseService.client
      .from("team_members")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    return { role: teamMembership?.role ?? null, error };
  }
}
