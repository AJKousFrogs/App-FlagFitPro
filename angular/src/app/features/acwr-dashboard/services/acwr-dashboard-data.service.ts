import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface AcwrSessionRecord {
  id?: string;
  session_date: string;
  duration_minutes?: number | null;
  rpe?: number | null;
  status?: string | null;
  session_type?: string | null;
}

@Injectable({
  providedIn: "root",
})
export class AcwrDashboardDataService {
  private readonly supabaseService = inject(SupabaseService);

  async saveReport(input: {
    userId: string;
    reportData: Record<string, unknown>;
    acwrValue: number;
    riskZone: unknown;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("acwr_reports")
      .insert({
        user_id: input.userId,
        report_data: input.reportData,
        acwr_value: input.acwrValue,
        risk_zone: input.riskZone,
      });

    return { error };
  }

  async getTrendSessions(input: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    sessions: AcwrSessionRecord[];
    error: { message?: string } | null;
  }> {
    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("session_date, duration_minutes, rpe, status")
      .eq("user_id", input.userId)
      .gte("session_date", input.startDate)
      .lte("session_date", input.endDate)
      .eq("status", "completed")
      .order("session_date", { ascending: true });

    return { sessions: sessions ?? [], error };
  }

  async getRecentSessions(input: {
    userId: string;
    startDate: string;
    endDate: string;
    limit: number;
  }): Promise<{
    sessions: AcwrSessionRecord[];
    error: { message?: string } | null;
  }> {
    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("id, session_date, duration_minutes, rpe, session_type")
      .eq("user_id", input.userId)
      .gte("session_date", input.startDate)
      .lte("session_date", input.endDate)
      .eq("status", "completed")
      .order("session_date", { ascending: false })
      .limit(input.limit);

    return { sessions: sessions ?? [], error };
  }
}
