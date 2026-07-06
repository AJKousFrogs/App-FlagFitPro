import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";

export interface NutritionReportRow {
  id: string;
  report_type?: string;
  period_start?: string | null;
  period_end?: string | null;
  created_at?: string;
  report_data?: {
    metrics?: Record<string, number>;
    recommendations?: { priority?: string; message?: string }[];
  };
}

/** Data access for `nutrition_reports` (athlete's generated nutrition reports). */
@Injectable({ providedIn: "root" })
export class NutritionReportsService {
  private readonly supabase = inject(SupabaseService);

  /** Most recent nutrition reports, newest first. */
  async loadRecent(limit = 10): Promise<NutritionReportRow[]> {
    const { data } = await this.supabase.client
      .from("nutrition_reports")
      .select("id, report_type, period_start, period_end, created_at, report_data")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as NutritionReportRow[] | null) ?? [];
  }
}
