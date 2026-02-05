import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface CoachProfileRecord {
  id: string;
  full_name?: string | null;
}

@Injectable({
  providedIn: "root",
})
export class PlayerDashboardDataService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchCoachProfiles(
    coachIds: string[],
  ): Promise<{ profiles: CoachProfileRecord[]; error: { message?: string } | null }> {
    const { data: profiles, error } = await this.supabaseService.client
      .from("users")
      .select("id, full_name")
      .in("id", coachIds);

    return { profiles: profiles ?? [], error };
  }
}
