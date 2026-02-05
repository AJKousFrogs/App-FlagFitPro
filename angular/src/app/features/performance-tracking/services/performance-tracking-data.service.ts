import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface PerformanceRecordRow {
  id?: string;
  recorded_at: string;
  sprint_10m?: number | null;
  sprint_20m?: number | null;
  dash_40?: number | null;
  pro_agility?: number | null;
  l_drill?: number | null;
  reactive_agility?: number | null;
  vertical_jump?: number | null;
  broad_jump?: number | null;
  rsi?: number | null;
  bench_press?: number | null;
  back_squat?: number | null;
  deadlift?: number | null;
  body_weight?: number | null;
  notes?: string | null;
  overall_score?: number | null;
}

@Injectable({
  providedIn: "root",
})
export class PerformanceTrackingDataService {
  private readonly supabaseService = inject(SupabaseService);

  getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  async fetchPerformanceRecords(userId: string): Promise<{
    records: PerformanceRecordRow[];
    error: { message?: string } | null;
  }> {
    const { data: records, error } = await this.supabaseService.client
      .from("performance_records")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false });

    return { records: records ?? [], error };
  }

  async createPerformanceRecord(input: {
    userId: string;
    score: number;
    payload: Omit<PerformanceRecordRow, "recorded_at">;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("performance_records")
      .insert({
        user_id: input.userId,
        sprint_10m: input.payload.sprint_10m,
        sprint_20m: input.payload.sprint_20m,
        dash_40: input.payload.dash_40,
        pro_agility: input.payload.pro_agility,
        l_drill: input.payload.l_drill,
        reactive_agility: input.payload.reactive_agility,
        vertical_jump: input.payload.vertical_jump,
        broad_jump: input.payload.broad_jump,
        rsi: input.payload.rsi,
        bench_press: input.payload.bench_press,
        back_squat: input.payload.back_squat,
        deadlift: input.payload.deadlift,
        body_weight: input.payload.body_weight,
        notes: input.payload.notes,
        overall_score: input.score,
        recorded_at: new Date().toISOString(),
      });

    return { error };
  }
}
