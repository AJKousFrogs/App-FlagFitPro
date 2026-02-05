import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface PerformanceRecordRow {
  dash_40: number | null;
  sprint_10m: number | null;
  recorded_at: string | null;
}

@Injectable({
  providedIn: "root",
})
export class AnalyticsDataService {
  private readonly supabaseService = inject(SupabaseService);

  getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  async getPerformanceRecords(userId: string): Promise<{
    records: PerformanceRecordRow[] | null;
    error: unknown | null;
  }> {
    const { data: records, error } = await this.supabaseService.client
      .from("performance_records")
      .select("dash_40, sprint_10m, recorded_at")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(20);

    return { records, error };
  }
}
