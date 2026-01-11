import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";
import { SupabaseService } from "./supabase.service";

// Physical Measurements Interfaces
export interface PhysicalMeasurement {
  id?: string;
  userId?: string;
  weight: number;
  height: number;
  bodyFat?: number;
  muscleMass?: number;
  // Enhanced body composition from smart scales
  bodyWaterMass?: number;
  fatMass?: number;
  proteinMass?: number;
  boneMineralContent?: number;
  skeletalMuscleMass?: number;
  musclePercentage?: number;
  bodyWaterPercentage?: number;
  proteinPercentage?: number;
  boneMineralPercentage?: number;
  visceralFatRating?: number;
  basalMetabolicRate?: number;
  waistToHipRatio?: number;
  bodyAge?: number;
  notes?: string;
  timestamp: string;
}

export interface MeasurementsSummary {
  latest?: PhysicalMeasurement;
  changes?: {
    weight?: string;
    bodyFat?: string;
  };
}

// Supplement Interfaces
export interface Supplement {
  id?: number;
  userId?: string;
  name: string;
  dosage?: string;
  taken: boolean;
  date: string;
  timeOfDay?:
    | "morning"
    | "afternoon"
    | "evening"
    | "pre-workout"
    | "post-workout";
  notes?: string;
  timestamp?: string;
}

export interface SupplementCompliance {
  complianceRate: number;
  totalDays: number;
  missedDays: number;
  bySupplement?: Record<string, { taken: number; missed: number }>;
}

// Performance Test Interfaces
export interface PerformanceTest {
  id?: number;
  userId?: string;
  testType: string;
  result: number;
  target?: number;
  timestamp: string;
  conditions?: Record<string, unknown>;
}

// Trends Interfaces
export interface TrendsData {
  performance: Record<string, TrendValue>;
  body_composition: {
    trend: string;
    changes: TrendChanges | null;
    latest?: PhysicalMeasurement;
    previous?: PhysicalMeasurement;
  };
  wellness: {
    trend: string;
    trends: Record<string, TrendValue>;
    recentAverage?: number;
  };
  correlations: Record<string, number>;
  insights: string[];
  recommendations: string[];
}

interface TrendValue {
  value: number;
  change?: number;
  trend?: "up" | "down" | "stable";
}

interface TrendChanges {
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

interface DatabaseMeasurement {
  id: string;
  user_id: string;
  weight: number; // in kg
  height: number; // in cm
  body_fat?: number; // percentage
  muscle_mass?: number; // in kg
  body_water_mass?: number;
  fat_mass?: number;
  protein_mass?: number;
  bone_mineral_content?: number;
  skeletal_muscle_mass?: number;
  muscle_percentage?: number;
  body_water_percentage?: number;
  protein_percentage?: number;
  bone_mineral_percentage?: number;
  visceral_fat_rating?: number;
  basal_metabolic_rate?: number;
  waist_to_hip_ratio?: number;
  body_age?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}

interface DatabaseSupplement {
  id: number;
  user_id: string;
  supplement_name: string;
  dosage?: string;
  taken: boolean;
  date: string;
  time_of_day?: Supplement["timeOfDay"];
  notes?: string;
  created_at: string;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}

interface DatabaseTest {
  id: number;
  user_id: string;
  test_name: string;
  test_type?: string;
  result_value: number;
  target_value?: number;
  performed_at: string;
  test_date?: string;
  test_conditions?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}

interface TestSummary {
  totalTests: number;
  byType?: Record<string, number>;
  improvements?: Record<string, number>;
}

@Injectable({
  providedIn: "root",
})
export class PerformanceDataService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private realtimeService = inject(RealtimeService);
  private authService = inject(AuthService);

  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  // State signals
  private readonly _recentMeasurements = signal<PhysicalMeasurement[]>([]);
  private readonly _recentTests = signal<PerformanceTest[]>([]);
  private readonly _todaysSupplements = signal<Supplement[]>([]);

  readonly recentMeasurements = this._recentMeasurements.asReadonly();
  readonly recentTests = this._recentTests.asReadonly();
  readonly todaysSupplements = this._todaysSupplements.asReadonly();

  // Computed signals
  readonly latestMeasurement = computed(() => {
    const measurements = this._recentMeasurements();
    return measurements.length > 0 ? measurements[0] : null;
  });
  readonly supplementComplianceToday = computed(() => {
    const supplements = this._todaysSupplements();
    if (supplements.length === 0) return 100;
    const taken = supplements.filter((s) => s.taken).length;
    return Math.round((taken / supplements.length) * 100);
  });

  constructor() {
    // Set up realtime subscription when user logs in/out
    effect(() => {
      const userId = this.userId();

      if (userId) {
        this.logger.info(
          "[PerformanceData] User logged in, setting up realtime subscriptions",
        );
        this.loadRecentData();
        this.subscribeToPerformanceUpdates(userId);
      } else {
        this.logger.info("[PerformanceData] User logged out, cleaning up");
        this._recentMeasurements.set([]);
        this._recentTests.set([]);
        this._todaysSupplements.set([]);
        this.realtimeService.unsubscribe("physical_measurements");
        this.realtimeService.unsubscribe("performance_tests");
        this.realtimeService.unsubscribe("supplement_logs");
      }
    });
  }

  /**
   * Load recent performance data
   */
  private loadRecentData(): void {
    const userId = this.userId();
    if (!userId) return;

    // Load recent measurements
    this.getMeasurements("3m", 1, 10).subscribe({
      next: (response) => {
        this._recentMeasurements.set(response.data);
        this.logger.success("[PerformanceData] Loaded recent measurements");
      },
      error: (error) => {
        this.logger.error(
          "[PerformanceData] Failed to load measurements:",
          error,
        );
      },
    });

    // Load recent tests
    this.getPerformanceTests("3m").subscribe({
      next: (response) => {
        this._recentTests.set(response.data);
        this.logger.success("[PerformanceData] Loaded recent tests");
      },
      error: (error) => {
        this.logger.error("[PerformanceData] Failed to load tests:", error);
      },
    });

    // Load today's supplements
    this.getSupplements("1d").subscribe({
      next: (response) => {
        this._todaysSupplements.set(response.data);
        this.logger.success("[PerformanceData] Loaded today's supplements");
      },
      error: (error) => {
        this.logger.error(
          "[PerformanceData] Failed to load supplements:",
          error,
        );
      },
    });
  }

  /**
   * Subscribe to realtime performance data updates
   */
  private subscribeToPerformanceUpdates(userId: string): void {
    const today = new Date().toISOString().split("T")[0];

    // Subscribe to physical measurements
    this.realtimeService.subscribe<DatabaseMeasurement>(
      "physical_measurements",
      `user_id=eq.${userId}`,
      {
        onInsert: (payload) => {
          this.logger.info("[PerformanceData] New measurement via realtime");
          const measurement = this.transformMeasurement(payload.new);
          const current = this._recentMeasurements();
          this._recentMeasurements.set([measurement, ...current.slice(0, 9)]);
        },
        onUpdate: (payload) => {
          this.logger.info(
            "[PerformanceData] Measurement updated via realtime",
          );
          const measurement = this.transformMeasurement(payload.new);
          const current = this._recentMeasurements();
          const index = current.findIndex((m) => m.id === measurement.id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = measurement;
            this._recentMeasurements.set(updated);
          }
        },
        onDelete: (payload) => {
          this.logger.info(
            "[PerformanceData] Measurement deleted via realtime",
          );
          const current = this._recentMeasurements();
          this._recentMeasurements.set(
            current.filter((m) => m.id !== payload.old.id),
          );
        },
      },
    );

    // Subscribe to performance tests
    this.realtimeService.subscribe<DatabaseTest>(
      "performance_tests",
      `user_id=eq.${userId}`,
      {
        onInsert: (payload) => {
          this.logger.info("[PerformanceData] New test via realtime");
          const test = this.transformTest(payload.new);
          const current = this._recentTests();
          this._recentTests.set([test, ...current]);
        },
        onUpdate: (payload) => {
          this.logger.info("[PerformanceData] Test updated via realtime");
          const test = this.transformTest(payload.new);
          const current = this._recentTests();
          const index = current.findIndex((t) => t.id === test.id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = test;
            this._recentTests.set(updated);
          }
        },
        onDelete: (payload) => {
          this.logger.info("[PerformanceData] Test deleted via realtime");
          const current = this._recentTests();
          this._recentTests.set(current.filter((t) => t.id !== payload.old.id));
        },
      },
    );

    // Subscribe to supplement logs
    this.realtimeService.subscribe<DatabaseSupplement>(
      "supplement_logs",
      `user_id=eq.${userId}`,
      {
        onInsert: (payload) => {
          const logDate = payload.new.date;
          if (logDate === today) {
            this.logger.info(
              "[PerformanceData] New supplement log via realtime",
            );
            const supplement = this.transformSupplement(payload.new);
            const current = this._todaysSupplements();
            this._todaysSupplements.set([...current, supplement]);
          }
        },
        onUpdate: (payload) => {
          const logDate = payload.new.date;
          if (logDate === today) {
            this.logger.info(
              "[PerformanceData] Supplement log updated via realtime",
            );
            const supplement = this.transformSupplement(payload.new);
            const current = this._todaysSupplements();
            const index = current.findIndex((s) => s.id === supplement.id);
            if (index !== -1) {
              const updated = [...current];
              updated[index] = supplement;
              this._todaysSupplements.set(updated);
            }
          }
        },
        onDelete: (payload) => {
          this.logger.info(
            "[PerformanceData] Supplement log deleted via realtime",
          );
          const current = this._todaysSupplements();
          this._todaysSupplements.set(
            current.filter((s) => s.id !== payload.old.id),
          );
        },
      },
    );
  }

  /**
   * Transform database measurement to PhysicalMeasurement
   */
  private transformMeasurement(data: DatabaseMeasurement): PhysicalMeasurement {
    return {
      id: data.id,
      userId: data.user_id,
      weight: data.weight,
      height: data.height,
      bodyFat: data.body_fat,
      muscleMass: data.muscle_mass,
      bodyWaterMass: data.body_water_mass,
      fatMass: data.fat_mass,
      proteinMass: data.protein_mass,
      boneMineralContent: data.bone_mineral_content,
      skeletalMuscleMass: data.skeletal_muscle_mass,
      musclePercentage: data.muscle_percentage,
      bodyWaterPercentage: data.body_water_percentage,
      proteinPercentage: data.protein_percentage,
      boneMineralPercentage: data.bone_mineral_percentage,
      visceralFatRating: data.visceral_fat_rating,
      basalMetabolicRate: data.basal_metabolic_rate,
      waistToHipRatio: data.waist_to_hip_ratio,
      bodyAge: data.body_age,
      notes: data.notes,
      timestamp: data.created_at || new Date().toISOString(),
    };
  }

  /**
   * Transform database test to PerformanceTest
   */
  private transformTest(data: DatabaseTest): PerformanceTest {
    return {
      id: data.id,
      userId: data.user_id,
      testType: data.test_name,
      result: data.result_value,
      target: data.target_value,
      timestamp: data.performed_at,
      conditions: data.test_conditions,
    };
  }

  /**
   * Transform database supplement to Supplement
   */
  private transformSupplement(data: DatabaseSupplement): Supplement {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.supplement_name,
      dosage: data.dosage,
      taken: data.taken,
      date: data.date,
      timeOfDay: data.time_of_day,
      notes: data.notes,
      timestamp: data.created_at,
    };
  }

  // Physical Measurements
  getMeasurements(
    timeframe: string = "6m",
    page: number = 1,
    limit: number = 50,
  ): Observable<{
    data: PhysicalMeasurement[];
    summary: MeasurementsSummary;
    pagination: PaginationInfo;
  }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("[Performance] No user logged in");
      return of({
        data: [] as PhysicalMeasurement[],
        summary: {} as MeasurementsSummary,
        pagination: { page: 1, limit, total: 0 } as PaginationInfo,
      });
    }

    const days = this.parseTimeframeToDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        const { data, error } = await this.supabaseService.client
          .from("physical_measurements")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", cutoffDate.toISOString())
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) {
          this.logger.error(
            "[Performance] Error fetching measurements",
            error,
          );
          throw error;
        }

        const measurements: PhysicalMeasurement[] = (data || []).map(
          (m: DatabaseMeasurement) => this.transformMeasurement(m),
        );

        const summary: MeasurementsSummary = {};
        if (measurements.length > 0) {
          summary.latest = measurements[0];
          if (measurements.length > 1) {
            const previous = measurements[1];
            summary.changes = {
              weight: `${(measurements[0].weight - previous.weight).toFixed(1)} kg`,
              bodyFat:
                measurements[0].bodyFat && previous.bodyFat
                  ? `${(measurements[0].bodyFat - previous.bodyFat).toFixed(1)}%`
                  : undefined,
            };
          }
        }

        return {
          data: measurements,
          summary,
          pagination: { page, limit, total: data?.length || 0 },
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("[Performance] Failed to fetch measurements", error);
        return of({
          data: [] as PhysicalMeasurement[],
          summary: {} as MeasurementsSummary,
          pagination: { page: 1, limit, total: 0 } as PaginationInfo,
        });
      }),
    );
  }

  logMeasurement(measurement: Partial<PhysicalMeasurement>): Observable<{
    success: boolean;
    data?: DatabaseMeasurement;
    error?: unknown;
  }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error(
        "[Performance] Cannot log measurement: No user logged in",
      );
      return of({ success: false });
    }

    return from(
      this.supabaseService.client
        .from("physical_measurements")
        .insert({
          user_id: userId,
          weight: measurement.weight,
          height: measurement.height,
          body_fat: measurement.bodyFat,
          muscle_mass: measurement.muscleMass,
          // Enhanced body composition fields
          body_water_mass: measurement.bodyWaterMass,
          fat_mass: measurement.fatMass,
          protein_mass: measurement.proteinMass,
          bone_mineral_content: measurement.boneMineralContent,
          skeletal_muscle_mass: measurement.skeletalMuscleMass,
          muscle_percentage: measurement.musclePercentage,
          body_water_percentage: measurement.bodyWaterPercentage,
          protein_percentage: measurement.proteinPercentage,
          bone_mineral_percentage: measurement.boneMineralPercentage,
          visceral_fat_rating: measurement.visceralFatRating,
          basal_metabolic_rate: measurement.basalMetabolicRate,
          waist_to_hip_ratio: measurement.waistToHipRatio,
          body_age: measurement.bodyAge,
          notes: measurement.notes,
          created_at: measurement.timestamp || new Date().toISOString(),
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("[Performance] Error logging measurement:", error);
          return { success: false, error };
        }
        this.logger.success("[Performance] Measurement logged:", data.id);
        return { success: true, data };
      }),
      catchError((error) => {
        this.logger.error("[Performance] Failed to log measurement:", error);
        return of({ success: false, error: error.message });
      }),
    );
  }

  /**
   * Parse timeframe string to days
   */
  private parseTimeframeToDays(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([dmyw])$/);
    if (!match) return 180; // Default 6 months

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
        return 180;
    }
  }

  // Supplements
  getSupplements(timeframe: string = "30d"): Observable<{
    data: Supplement[];
    compliance: SupplementCompliance;
  }> {
    const userId = this.userId();

    if (!userId) {
      return of({
        data: [],
        compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 },
      });
    }

    const days = this.parseTimeframeToDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        const { data, error } = await this.supabaseService.client
          .from("supplement_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("date", cutoffDate.toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (error) {
          this.logger.error("[Performance] Error fetching supplements:", error);
          throw error;
        }

        const supplements: Supplement[] = (data || []).map(
          (s: DatabaseSupplement) => ({
            id: s.id,
            userId: s.user_id,
            name: s.supplement_name,
            dosage: s.dosage,
            taken: s.taken,
            date: s.date,
            timeOfDay: s.time_of_day,
            notes: s.notes,
            timestamp: s.created_at,
          }),
        );

        // Calculate compliance
        const totalLogs = supplements.length;
        const takenLogs = supplements.filter((s) => s.taken).length;
        const complianceRate =
          totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

        return {
          data: supplements,
          compliance: {
            complianceRate,
            totalDays: days,
            missedDays: totalLogs - takenLogs,
          },
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("[Performance] Failed to fetch supplements:", error);
        return of({
          data: [],
          compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 },
        });
      }),
    );
  }

  logSupplement(supplement: Partial<Supplement>): Observable<{
    success: boolean;
    data?: DatabaseSupplement;
    error?: unknown;
  }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error(
        "[Performance] Cannot log supplement: No user logged in",
      );
      return of({ success: false });
    }

    return from(
      this.supabaseService.client
        .from("supplement_logs")
        .insert({
          user_id: userId,
          supplement_name: supplement.name,
          dosage: supplement.dosage,
          taken: supplement.taken !== undefined ? supplement.taken : true,
          date: supplement.date || new Date().toISOString().split("T")[0],
          time_of_day: supplement.timeOfDay,
          notes: supplement.notes,
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("[Performance] Error logging supplement:", error);
          return { success: false, error };
        }
        this.logger.success("[Performance] Supplement logged:", data.id);
        return { success: true, data };
      }),
      catchError((error) => {
        this.logger.error("[Performance] Failed to log supplement:", error);
        return of({ success: false, error: error.message });
      }),
    );
  }

  // Performance Tests
  getPerformanceTests(
    timeframe: string = "12m",
    testType?: string,
  ): Observable<{
    data: PerformanceTest[];
    trends: Record<string, TrendValue>;
    summary: TestSummary;
    pagination: { total: number };
  }> {
    const userId = this.userId();

    if (!userId) {
      return of({
        data: [] as PerformanceTest[],
        trends: {} as Record<string, TrendValue>,
        summary: { totalTests: 0 } as TestSummary,
        pagination: { total: 0 },
      });
    }

    const days = this.parseTimeframeToDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        let query = this.supabaseService.client
          .from("performance_tests")
          .select("*")
          .eq("user_id", userId)
          .gte("test_date", cutoffDate.toISOString());

        if (testType) {
          query = query.eq("test_type", testType);
        }

        const { data, error } = await query.order("test_date", {
          ascending: false,
        });

        if (error) {
          this.logger.error("[Performance] Error fetching tests:", error);
          throw error;
        }

        const tests: PerformanceTest[] = (data || []).map(
          (t: DatabaseTest) => ({
            id: t.id,
            userId: t.user_id,
            testType: t.test_type ?? t.test_name,
            result: t.result_value,
            target: t.target_value,
            timestamp: t.test_date ?? t.performed_at,
            conditions: t.conditions ?? t.test_conditions,
          }),
        );

        // Calculate basic trends
        const trends: Record<string, TrendValue> = {};
        const summary: TestSummary = { totalTests: tests.length };

        return {
          data: tests,
          trends,
          summary,
          pagination: { total: tests.length },
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("[Performance] Failed to fetch tests:", error);
        return of({
          data: [] as PerformanceTest[],
          trends: {} as Record<string, TrendValue>,
          summary: { totalTests: 0 } as TestSummary,
          pagination: { total: 0 },
        });
      }),
    );
  }

  logPerformanceTest(test: Partial<PerformanceTest>): Observable<{
    success: boolean;
    data?: DatabaseTest;
    error?: unknown;
  }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("[Performance] Cannot log test: No user logged in");
      return of({ success: false });
    }

    return from(
      this.supabaseService.client
        .from("performance_tests")
        .insert({
          user_id: userId,
          test_type: test.testType,
          result_value: test.result,
          target_value: test.target,
          test_date: test.timestamp || new Date().toISOString(),
          conditions: test.conditions || {},
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("[Performance] Error logging test:", error);
          return { success: false, error };
        }
        this.logger.success("[Performance] Test logged:", data.id);
        return { success: true, data };
      }),
      catchError((error) => {
        this.logger.error("[Performance] Failed to log test:", error);
        return of({ success: false, error: error.message });
      }),
    );
  }

  // Trends Analysis
  getTrends(_timeframe: string = "12m"): Observable<TrendsData> {
    const userId = this.userId();

    if (!userId) {
      return of({
        performance: {},
        body_composition: { trend: "insufficient_data", changes: null },
        wellness: { trend: "insufficient_data", trends: {} },
        correlations: {},
        insights: [],
        recommendations: [],
      });
    }

    // This is a complex analysis that could be implemented as a Supabase function
    // For now, return basic structure
    this.logger.warn(
      "[Performance] Trends analysis is simplified - consider implementing as DB function",
    );

    return of({
      performance: {},
      body_composition: { trend: "insufficient_data", changes: null },
      wellness: { trend: "insufficient_data", trends: {} },
      correlations: {},
      insights: ["Track more data to see trends"],
      recommendations: ["Log workouts, wellness, and measurements regularly"],
    });
  }

  // Data Export
  exportData(
    timeframe: string = "12m",
    format: "json" | "csv" = "json",
  ): Observable<{ success: boolean; message?: string; data?: unknown }> {
    return from(this.performExport(timeframe, format));
  }

  private async performExport(
    timeframe: string,
    format: "json" | "csv",
  ): Promise<{ success: boolean; message?: string; data?: unknown }> {
    const user = this.authService.getUser();
    if (!user?.id) {
      return { success: false, message: "Please log in to export data" };
    }

    try {
      // Calculate date range
      const now = new Date();
      const months = parseInt(timeframe) || 12;
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - months);

      // Fetch all performance data
      const [trainingSessions, wellnessLogs, bodyMeasurements] =
        await Promise.all([
          this.supabaseService.client
            .from("training_sessions")
            .select("*")
            .eq("user_id", user.id)
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true }),
          this.supabaseService.client
            .from("daily_wellness_checkin")
            .select("*")
            .eq("user_id", user.id)
            .gte("created_at", startDate.toISOString())
            .order("checkin_date", { ascending: true }),
          this.supabaseService.client
            .from("physical_measurements")
            .select("*")
            .eq("user_id", user.id)
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true }),
        ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        timeframe,
        trainingSessions: trainingSessions.data || [],
        wellnessLogs: wellnessLogs.data || [],
        bodyMeasurements: bodyMeasurements.data || [],
      };

      if (format === "json") {
        // Download as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        this.downloadBlob(
          blob,
          `performance-data-${new Date().toISOString().split("T")[0]}.json`,
        );
      } else {
        // Convert to CSV - extract only array data
        const csvData: Record<string, unknown[]> = {
          trainingSessions: exportData.trainingSessions,
          wellnessLogs: exportData.wellnessLogs,
          bodyMeasurements: exportData.bodyMeasurements,
        };
        const csvContent = this.convertToCSV(csvData);
        const blob = new Blob([csvContent], { type: "text/csv" });
        this.downloadBlob(
          blob,
          `performance-data-${new Date().toISOString().split("T")[0]}.csv`,
        );
      }

      return {
        success: true,
        message: "Data exported successfully",
        data: exportData,
      };
    } catch (error) {
      this.logger.error("[Performance] Export failed:", error);
      return { success: false, message: "Failed to export data" };
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: Record<string, unknown[]>): string {
    const lines: string[] = [];

    // Training Sessions
    if (
      data["trainingSessions"] &&
      Array.isArray(data["trainingSessions"]) &&
      data["trainingSessions"].length > 0
    ) {
      lines.push("# Training Sessions");
      const sessions = data["trainingSessions"] as Record<string, unknown>[];
      const headers = Object.keys(sessions[0]);
      lines.push(headers.join(","));
      sessions.forEach((session) => {
        lines.push(
          headers.map((h) => JSON.stringify(session[h] ?? "")).join(","),
        );
      });
      lines.push("");
    }

    // Wellness Logs
    if (
      data["wellnessLogs"] &&
      Array.isArray(data["wellnessLogs"]) &&
      data["wellnessLogs"].length > 0
    ) {
      lines.push("# Wellness Logs");
      const logs = data["wellnessLogs"] as Record<string, unknown>[];
      const headers = Object.keys(logs[0]);
      lines.push(headers.join(","));
      logs.forEach((log) => {
        lines.push(headers.map((h) => JSON.stringify(log[h] ?? "")).join(","));
      });
      lines.push("");
    }

    // Body Measurements
    if (
      data["bodyMeasurements"] &&
      Array.isArray(data["bodyMeasurements"]) &&
      data["bodyMeasurements"].length > 0
    ) {
      lines.push("# Body Measurements");
      const measurements = data["bodyMeasurements"] as Record<
        string,
        unknown
      >[];
      const headers = Object.keys(measurements[0]);
      lines.push(headers.join(","));
      measurements.forEach((m) => {
        lines.push(headers.map((h) => JSON.stringify(m[h] ?? "")).join(","));
      });
    }

    return lines.join("\n");
  }

  // Utility Methods

  /**
   * Calculate BMI from measurements
   */
  calculateBMI(weight: number, height: number): number {
    // height in cm, weight in kg
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  /**
   * Get BMI category
   */
  getBMICategory(bmi: number): {
    category: string;
    color: string;
    message: string;
  } {
    if (bmi < 18.5) {
      return {
        category: "Underweight",
        color: "#ff9800",
        message:
          "Consider consulting a nutritionist for healthy weight gain strategies",
      };
    } else if (bmi < 25) {
      return {
        category: "Normal",
        color: "#10c96b",
        message: "Your BMI is in the healthy range",
      };
    } else if (bmi < 30) {
      return {
        category: "Overweight",
        color: "#ff9800",
        message: "Focus on balanced nutrition and consistent training",
      };
    } else {
      return {
        category: "Obese",
        color: "#f44336",
        message: "Consider consulting a healthcare professional for guidance",
      };
    }
  }

  /**
   * Calculate lean body mass
   */
  calculateLeanBodyMass(weight: number, bodyFat: number): number {
    return Math.round(weight * (1 - bodyFat / 100) * 10) / 10;
  }

  /**
   * Get supplement compliance status
   */
  getComplianceStatus(complianceRate: number): {
    status: "excellent" | "good" | "fair" | "poor";
    color: string;
    message: string;
  } {
    if (complianceRate >= 90) {
      return {
        status: "excellent",
        color: "#10c96b",
        message: "Excellent supplement compliance!",
      };
    } else if (complianceRate >= 75) {
      return {
        status: "good",
        color: "#2196f3",
        message: "Good compliance. Try to be more consistent.",
      };
    } else if (complianceRate >= 50) {
      return {
        status: "fair",
        color: "#ff9800",
        message: "Compliance needs improvement. Set reminders to help.",
      };
    } else {
      return {
        status: "poor",
        color: "#f44336",
        message: "Low compliance. Consider reviewing your supplement regimen.",
      };
    }
  }

  /**
   * Format performance test result
   */
  formatTestResult(testType: string, result: number): string {
    const units: Record<string, string> = {
      "40YardDash": "s",
      VerticalJump: "in",
      BroadJump: "in",
      ThreeCone: "s",
      Shuttle: "s",
      BenchPress: "reps",
      Squat: "lbs",
      PowerClean: "lbs",
    };

    const unit = units[testType] || "";
    return `${result}${unit}`;
  }

  /**
   * Get performance improvement percentage
   */
  calculateImprovement(
    current: number,
    previous: number,
    testType: string,
  ): {
    percent: number;
    trend: "improving" | "declining" | "stable";
    isPositive: boolean;
  } {
    const lowerIsBetter = ["40YardDash", "ThreeCone", "Shuttle"].includes(
      testType,
    );

    const change = ((current - previous) / previous) * 100;
    const improvement = lowerIsBetter ? -change : change;

    return {
      percent: Math.abs(Math.round(change * 10) / 10),
      trend:
        improvement > 2
          ? "improving"
          : improvement < -2
            ? "declining"
            : "stable",
      isPositive: improvement > 0,
    };
  }
}
