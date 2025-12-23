import { Injectable, inject, computed } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

// Physical Measurements Interfaces
export interface PhysicalMeasurement {
  id?: number;
  userId?: string;
  weight: number;
  height: number;
  bodyFat?: number;
  muscleMass?: number;
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
  conditions?: any;
}

// Trends Interfaces
export interface TrendsData {
  performance: Record<string, any>;
  body_composition: {
    trend: string;
    changes: any;
    latest?: any;
    previous?: any;
  };
  wellness: {
    trend: string;
    trends: Record<string, any>;
    recentAverage?: any;
  };
  correlations: Record<string, number>;
  insights: string[];
  recommendations: string[];
}

@Injectable({
  providedIn: "root",
})
export class PerformanceDataService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  
  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  // Physical Measurements
  getMeasurements(
    timeframe: string = "6m",
    page: number = 1,
    limit: number = 50,
  ): Observable<{
    data: PhysicalMeasurement[];
    summary: MeasurementsSummary;
    pagination: any;
  }> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.warn("[Performance] No user logged in");
      return of({ data: [], summary: {}, pagination: {} });
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
          .gte("measured_at", cutoffDate.toISOString())
          .order("measured_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) {
          this.logger.error("[Performance] Error fetching measurements:", error);
          throw error;
        }

        const measurements: PhysicalMeasurement[] = (data || []).map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          weight: m.weight_kg,
          height: m.height_cm,
          bodyFat: m.body_fat_percentage,
          muscleMass: m.muscle_mass_kg,
          notes: m.notes,
          timestamp: m.measured_at,
        }));

        const summary: MeasurementsSummary = {};
        if (measurements.length > 0) {
          summary.latest = measurements[0];
          if (measurements.length > 1) {
            const previous = measurements[1];
            summary.changes = {
              weight: `${(measurements[0].weight - previous.weight).toFixed(1)} kg`,
              bodyFat: measurements[0].bodyFat && previous.bodyFat 
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
        this.logger.error("[Performance] Failed to fetch measurements:", error);
        return of({ data: [], summary: {}, pagination: {} });
      }),
    );
  }

  logMeasurement(measurement: Partial<PhysicalMeasurement>): Observable<any> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.error("[Performance] Cannot log measurement: No user logged in");
      return of({ success: false });
    }

    return from(
      this.supabaseService.client
        .from("physical_measurements")
        .insert({
          user_id: userId,
          weight_kg: measurement.weight,
          height_cm: measurement.height,
          body_fat_percentage: measurement.bodyFat,
          muscle_mass_kg: measurement.muscleMass,
          notes: measurement.notes,
          measured_at: measurement.timestamp || new Date().toISOString(),
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
      case "d": return value;
      case "w": return value * 7;
      case "m": return value * 30;
      case "y": return value * 365;
      default: return 180;
    }
  }

  // Supplements
  getSupplements(timeframe: string = "30d"): Observable<{
    data: Supplement[];
    compliance: SupplementCompliance;
  }> {
    const userId = this.userId();
    
    if (!userId) {
      return of({ data: [], compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 } });
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

        const supplements: Supplement[] = (data || []).map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          name: s.supplement_name,
          dosage: s.dosage,
          taken: s.taken,
          date: s.date,
          timeOfDay: s.time_of_day,
          notes: s.notes,
          timestamp: s.created_at,
        }));

        // Calculate compliance
        const totalLogs = supplements.length;
        const takenLogs = supplements.filter(s => s.taken).length;
        const complianceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

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
        return of({ data: [], compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 } });
      }),
    );
  }

  logSupplement(supplement: Partial<Supplement>): Observable<any> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.error("[Performance] Cannot log supplement: No user logged in");
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
    trends: any;
    summary: any;
    pagination: any;
  }> {
    const userId = this.userId();
    
    if (!userId) {
      return of({ data: [], trends: {}, summary: {}, pagination: {} });
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

        const { data, error } = await query.order("test_date", { ascending: false });

        if (error) {
          this.logger.error("[Performance] Error fetching tests:", error);
          throw error;
        }

        const tests: PerformanceTest[] = (data || []).map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          testType: t.test_type,
          result: t.result_value,
          target: t.target_value,
          timestamp: t.test_date,
          conditions: t.conditions,
        }));

        // Calculate basic trends
        const trends: any = {};
        const summary: any = { totalTests: tests.length };

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
        return of({ data: [], trends: {}, summary: {}, pagination: {} });
      }),
    );
  }

  logPerformanceTest(test: Partial<PerformanceTest>): Observable<any> {
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
  getTrends(timeframe: string = "12m"): Observable<TrendsData> {
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
    this.logger.warn("[Performance] Trends analysis is simplified - consider implementing as DB function");
    
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
  ): Observable<any> {
    this.logger.warn("[Performance] Export feature not yet implemented for Supabase");
    // TODO: Implement data export by fetching all tables and formatting
    return of({ success: false, message: "Export feature coming soon" });
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
