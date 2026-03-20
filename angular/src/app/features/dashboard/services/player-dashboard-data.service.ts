import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

export interface CoachProfileRecord {
  id: string;
  full_name?: string | null;
}

@Injectable({
  providedIn: "root",
})
export class PlayerDashboardDataService {
  private readonly supabaseService = inject(SupabaseService);
  private usersTableUnavailable = false;

  async fetchCoachProfiles(
    coachIds: string[],
  ): Promise<{ profiles: CoachProfileRecord[]; error: { message?: string } | null }> {
    if (this.usersTableUnavailable || coachIds.length === 0) {
      return { profiles: [], error: null };
    }

    const { data: profiles, error } = await this.supabaseService.client
      .from("users")
      .select("id, full_name")
      .in("id", coachIds);

    if (error && isBenignSupabaseQueryError(error)) {
      this.usersTableUnavailable = true;
      return { profiles: [], error: null };
    }

    return { profiles: profiles ?? [], error };
  }
}
