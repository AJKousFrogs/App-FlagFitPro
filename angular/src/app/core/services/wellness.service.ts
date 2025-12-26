import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { map, tap, catchError } from "rxjs/operators";
import { toSignal } from "@angular/core/rxjs-interop";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { RealtimeService, RealtimeEvent } from "./realtime.service";

export interface WellnessData {
  id?: number;
  userId?: string;
  date: string;
  sleep?: number;
  energy?: number;
  stress?: number;
  soreness?: number;
  motivation?: number;
  mood?: number;
  hydration?: number;
  notes?: string;
  timestamp?: string;
}

export interface WellnessAverages {
  sleep?: number;
  energy?: number;
  stress?: number;
  soreness?: number;
  motivation?: number;
  mood?: number;
  hydration?: number;
}

export interface WellnessPatterns {
  patterns: string[];
  insights: string[];
  averages?: WellnessAverages;
}

export interface WellnessResponse {
  success: boolean;
  data: WellnessData[];
  averages?: WellnessAverages;
  patterns?: WellnessPatterns;
}

interface DatabaseWellnessEntry {
  id: number;
  athlete_id: string;
  date: string;
  sleep_quality?: number;
  energy_level?: number;
  stress_level?: number;
  muscle_soreness?: number;
  motivation_level?: number;
  mood?: number;
  hydration_level?: number;
  notes?: string;
  created_at: string;
}

// RealtimeEvent is now imported from realtime.service.ts

interface WellnessTrend {
  metric: string;
  trend: "improving" | "declining" | "stable";
  change: number;
}

@Injectable({
  providedIn: "root",
})
export class WellnessService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private realtimeService = inject(RealtimeService);

  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  // UI State: Use signals instead of BehaviorSubject
  private readonly _wellnessData = signal<WellnessData[]>([]);
  private readonly _averages = signal<WellnessAverages | null>(null);

  // Public readonly signals for components
  readonly wellnessData = this._wellnessData.asReadonly();
  readonly averages = this._averages.asReadonly();

  // Computed signals for derived state
  readonly hasWellnessData = computed(() => this._wellnessData().length > 0);
  readonly latestWellnessEntry = computed(() => {
    const data = this._wellnessData();
    return data.length > 0 ? data[0] : null;
  });

  constructor() {
    // Set up realtime subscription when user logs in/out
    effect(() => {
      const userId = this.userId();

      if (userId) {
        this.logger.info(
          "[Wellness] User logged in, setting up realtime subscription",
        );
        this.loadWellnessData();
        this.subscribeToWellnessUpdates(userId);
      } else {
        this.logger.info("[Wellness] User logged out, cleaning up");
        this.clearCache();
        this.realtimeService.unsubscribe("wellness_entries");
      }
    });
  }

  /**
   * Get wellness data for a specific timeframe
   * @param timeframe - Time range (e.g., '7d', '30d', '3m')
   * Returns Observable using direct Supabase queries
   */
  getWellnessData(timeframe: string = "30d"): Observable<WellnessResponse> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("[Wellness] Cannot fetch data: No user logged in");
      return of({ success: false, data: [] });
    }

    // Parse timeframe to days
    const days = this.parseTimeframe(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        const { data, error } = await this.supabaseService.client
          .from("wellness_entries")
          .select("*")
          .eq("athlete_id", userId)
          .gte("date", cutoffDate.toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (error) {
          this.logger.error("[Wellness] Error fetching data:", error);
          throw error;
        }

        const wellnessData: WellnessData[] = (data || []).map((entry: DatabaseWellnessEntry) => ({
          id: entry.id,
          userId: entry.athlete_id,
          date: entry.date,
          sleep: entry.sleep_quality,
          energy: entry.energy_level,
          stress: entry.stress_level,
          soreness: entry.muscle_soreness,
          motivation: entry.motivation_level,
          mood: entry.mood,
          hydration: entry.hydration_level,
          notes: entry.notes,
          timestamp: entry.created_at,
        }));

        // Calculate averages
        const averages = this.calculateAverages(wellnessData);

        // Update signals
        this._wellnessData.set(wellnessData);
        this._averages.set(averages);

        return {
          success: true,
          data: wellnessData,
          averages,
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("[Wellness] Failed to fetch data:", error);
        return of({ success: false, data: [] });
      }),
    );
  }

  /**
   * Parse timeframe string to number of days
   */
  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([dmyw])$/);
    if (!match) return 30; // Default to 30 days

    const [, num, unit] = match;
    const value = parseInt(num, 10);

    switch (unit) {
      case "d":
        return value;
      case "w":
        return value * 7;
      case "m":
        return value * 30;
      case "y":
        return value * 365;
      default:
        return 30;
    }
  }

  /**
   * Calculate averages from wellness data
   */
  private calculateAverages(data: WellnessData[]): WellnessAverages {
    if (data.length === 0) {
      return {};
    }

    const sums = {
      sleep: 0,
      energy: 0,
      stress: 0,
      soreness: 0,
      motivation: 0,
      mood: 0,
      hydration: 0,
    };
    const counts = { ...sums };

    data.forEach((entry) => {
      if (entry.sleep !== undefined) {
        sums.sleep += entry.sleep;
        counts.sleep++;
      }
      if (entry.energy !== undefined) {
        sums.energy += entry.energy;
        counts.energy++;
      }
      if (entry.stress !== undefined) {
        sums.stress += entry.stress;
        counts.stress++;
      }
      if (entry.soreness !== undefined) {
        sums.soreness += entry.soreness;
        counts.soreness++;
      }
      if (entry.motivation !== undefined) {
        sums.motivation += entry.motivation;
        counts.motivation++;
      }
      if (entry.mood !== undefined) {
        sums.mood += entry.mood;
        counts.mood++;
      }
      if (entry.hydration !== undefined) {
        sums.hydration += entry.hydration;
        counts.hydration++;
      }
    });

    return {
      sleep:
        counts.sleep > 0
          ? Math.round((sums.sleep / counts.sleep) * 10) / 10
          : undefined,
      energy:
        counts.energy > 0
          ? Math.round((sums.energy / counts.energy) * 10) / 10
          : undefined,
      stress:
        counts.stress > 0
          ? Math.round((sums.stress / counts.stress) * 10) / 10
          : undefined,
      soreness:
        counts.soreness > 0
          ? Math.round((sums.soreness / counts.soreness) * 10) / 10
          : undefined,
      motivation:
        counts.motivation > 0
          ? Math.round((sums.motivation / counts.motivation) * 10) / 10
          : undefined,
      mood:
        counts.mood > 0
          ? Math.round((sums.mood / counts.mood) * 10) / 10
          : undefined,
      hydration:
        counts.hydration > 0
          ? Math.round((sums.hydration / counts.hydration) * 10) / 10
          : undefined,
    };
  }

  /**
   * Log wellness entry for today or specific date
   * Saves directly to Supabase wellness_entries table
   */
  logWellness(data: Partial<WellnessData>): Observable<{ success: boolean; data?: unknown; error?: string }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("[Wellness] Cannot log entry: No user logged in");
      return of({ success: false, error: "Not authenticated" });
    }

    const wellnessEntry = {
      athlete_id: userId,
      date: data.date || new Date().toISOString().split("T")[0],
      sleep_quality: data.sleep,
      energy_level: data.energy,
      stress_level: data.stress,
      muscle_soreness: data.soreness,
      motivation_level: data.motivation,
      mood: data.mood,
      hydration_level: data.hydration,
      notes: data.notes,
    };

    return from(
      this.supabaseService.client
        .from("wellness_entries")
        .insert(wellnessEntry)
        .select()
        .single(),
    ).pipe(
      map(({ data: insertedData, error }) => {
        if (error) {
          this.logger.error("[Wellness] Error logging entry:", error);
          throw error;
        }
        this.logger.success("[Wellness] Entry logged:", insertedData.id);
        return { success: true, data: insertedData };
      }),
      tap(() => {
        // Refresh wellness data after successful post
        this.getWellnessData("30d").subscribe();
      }),
      catchError((error) => {
        this.logger.error("[Wellness] Failed to log entry:", error);
        return of({ success: false, error: error.message });
      }),
    );
  }

  /**
   * Get wellness score (average of all metrics)
   */
  getWellnessScore(data: WellnessData): number {
    const metrics = [
      data.sleep,
      data.energy,
      data.stress ? 10 - data.stress : undefined, // Invert stress
      data.soreness ? 10 - data.soreness : undefined, // Invert soreness
      data.motivation,
      data.mood,
      data.hydration,
    ].filter((m): m is number => m !== undefined && m !== null);

    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / metrics.length) * 10) / 10;
  }

  /**
   * Get wellness status based on score
   */
  getWellnessStatus(score: number): {
    status: "excellent" | "good" | "fair" | "poor";
    color: string;
    message: string;
  } {
    if (score >= 8) {
      return {
        status: "excellent",
        color: "#10c96b",
        message: "Your wellness is excellent! Keep up the great work.",
      };
    } else if (score >= 6) {
      return {
        status: "good",
        color: "#2196f3",
        message:
          "Your wellness is good. Small improvements can make a big difference.",
      };
    } else if (score >= 4) {
      return {
        status: "fair",
        color: "#ff9800",
        message: "Your wellness needs attention. Focus on recovery and rest.",
      };
    } else {
      return {
        status: "poor",
        color: "#f44336",
        message:
          "Your wellness is concerning. Consider taking a rest day and consulting a coach.",
      };
    }
  }

  /**
   * Get wellness trends over time
   */
  getWellnessTrends(data: WellnessData[]): WellnessTrend[] {
    if (data.length < 2) return [];

    const metrics = [
      "sleep",
      "energy",
      "stress",
      "soreness",
      "motivation",
      "mood",
      "hydration",
    ];
    const trends: WellnessTrend[] = [];

    metrics.forEach((metric) => {
      const values = data
        .map((d) => (d as unknown as Record<string, unknown>)[metric])
        .filter((v): v is number => typeof v === 'number');

      if (values.length < 2) return;

      const recent = values.slice(0, Math.floor(values.length / 2));
      const earlier = values.slice(Math.floor(values.length / 2));

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

      const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

      // For stress and soreness, lower is better
      const invertMetrics = ["stress", "soreness"];
      const adjustedChange = invertMetrics.includes(metric) ? -change : change;

      trends.push({
        metric,
        trend:
          adjustedChange > 5
            ? "improving"
            : adjustedChange < -5
              ? "declining"
              : "stable",
        change: Math.round(Math.abs(change) * 10) / 10,
      });
    });

    return trends;
  }

  /**
   * Get recommendations based on wellness data
   */
  getRecommendations(data: WellnessData): string[] {
    const recommendations: string[] = [];

    if (data.sleep !== undefined && data.sleep < 6) {
      recommendations.push(
        "Prioritize 7-9 hours of sleep for optimal recovery",
      );
    }

    if (data.energy !== undefined && data.energy < 5) {
      recommendations.push("Consider a rest day or light training session");
    }

    if (data.stress !== undefined && data.stress > 7) {
      recommendations.push(
        "Practice stress management techniques like meditation or breathing exercises",
      );
    }

    if (data.soreness !== undefined && data.soreness > 7) {
      recommendations.push(
        "Focus on recovery protocols: foam rolling, stretching, ice baths",
      );
    }

    if (data.hydration !== undefined && data.hydration < 6) {
      recommendations.push(
        "Increase water intake to support performance and recovery",
      );
    }

    if (data.motivation !== undefined && data.motivation < 5) {
      recommendations.push(
        "Try varying your training routine to maintain engagement",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Keep up the excellent wellness habits!");
    }

    return recommendations;
  }

  /**
   * Load wellness data from database
   */
  private loadWellnessData(): void {
    this.getWellnessData("30d").subscribe({
      next: (response) => {
        if (response.success) {
          this.logger.success("[Wellness] Loaded wellness data from database");
        }
      },
      error: (error) => {
        this.logger.error("[Wellness] Failed to load wellness data:", error);
      },
    });
  }

  /**
   * Subscribe to realtime wellness updates
   */
  private subscribeToWellnessUpdates(userId: string): void {
    this.realtimeService.subscribe(
      "wellness_entries",
      `athlete_id=eq.${userId}`,
      {
        onInsert: (payload: RealtimeEvent) => {
          this.logger.info("[Wellness] New entry received via realtime");
          const newEntry = this.transformEntry(payload.new as unknown as DatabaseWellnessEntry);
          const current = this._wellnessData();
          this._wellnessData.set([newEntry, ...current]);
          this._averages.set(this.calculateAverages([newEntry, ...current]));
        },
        onUpdate: (payload: RealtimeEvent) => {
          this.logger.info("[Wellness] Entry updated via realtime");
          const updatedEntry = this.transformEntry(payload.new as unknown as DatabaseWellnessEntry);
          const current = this._wellnessData();
          const index = current.findIndex((e) => e.id === updatedEntry.id);

          if (index !== -1) {
            const updated = [...current];
            updated[index] = updatedEntry;
            this._wellnessData.set(updated);
            this._averages.set(this.calculateAverages(updated));
          }
        },
        onDelete: (payload: RealtimeEvent) => {
          this.logger.info("[Wellness] Entry deleted via realtime");
          const current = this._wellnessData();
          const oldEntry = payload.old as unknown as DatabaseWellnessEntry;
          const filtered = current.filter((e) => e.id !== oldEntry.id);
          this._wellnessData.set(filtered);
          this._averages.set(this.calculateAverages(filtered));
        },
      },
    );
  }

  /**
   * Transform database entry to WellnessData
   */
  private transformEntry(entry: DatabaseWellnessEntry): WellnessData {
    return {
      id: entry.id,
      userId: entry.athlete_id,
      date: entry.date,
      sleep: entry.sleep_quality,
      energy: entry.energy_level,
      stress: entry.stress_level,
      soreness: entry.muscle_soreness,
      motivation: entry.motivation_level,
      mood: entry.mood,
      hydration: entry.hydration_level,
      notes: entry.notes,
      timestamp: entry.created_at,
    };
  }

  /**
   * Clear cached wellness data
   */
  clearCache(): void {
    this._wellnessData.set([]);
    this._averages.set(null);
  }
}
