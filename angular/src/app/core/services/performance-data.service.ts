import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

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
  private apiService = inject(ApiService);

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
    return this.apiService
      .get(API_ENDPOINTS.performanceData.measurements, {
        timeframe,
        page,
        limit,
      })
      .pipe(
        map(
          (response) =>
            response.data || { data: [], summary: {}, pagination: {} },
        ),
      );
  }

  logMeasurement(measurement: Partial<PhysicalMeasurement>): Observable<any> {
    return this.apiService.post(
      API_ENDPOINTS.performanceData.measurements,
      measurement,
    );
  }

  // Supplements
  getSupplements(timeframe: string = "30d"): Observable<{
    data: Supplement[];
    compliance: SupplementCompliance;
  }> {
    return this.apiService
      .get(API_ENDPOINTS.performanceData.supplements, { timeframe })
      .pipe(
        map(
          (response) =>
            response.data || {
              data: [],
              compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 },
            },
        ),
      );
  }

  logSupplement(supplement: Partial<Supplement>): Observable<any> {
    return this.apiService.post(API_ENDPOINTS.performanceData.supplements, {
      name: supplement.name,
      dosage: supplement.dosage,
      taken: supplement.taken !== undefined ? supplement.taken : true,
      date: supplement.date || new Date().toISOString().split("T")[0],
      timeOfDay: supplement.timeOfDay,
      notes: supplement.notes,
    });
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
    const params: any = { timeframe };
    if (testType) {
      params.testType = testType;
    }

    return this.apiService
      .get(API_ENDPOINTS.performanceData.performanceTests, params)
      .pipe(
        map(
          (response) =>
            response.data || {
              data: [],
              trends: {},
              summary: {},
              pagination: {},
            },
        ),
      );
  }

  logPerformanceTest(test: Partial<PerformanceTest>): Observable<any> {
    return this.apiService.post(
      API_ENDPOINTS.performanceData.performanceTests,
      {
        testType: test.testType,
        result: test.result,
        date: test.timestamp || new Date().toISOString(),
        conditions: test.conditions || {},
      },
    );
  }

  // Trends Analysis
  getTrends(timeframe: string = "12m"): Observable<TrendsData> {
    return this.apiService
      .get<TrendsData>(API_ENDPOINTS.performanceData.trends, { timeframe })
      .pipe(
        map(
          (response) =>
            response.data || {
              performance: {},
              body_composition: { trend: "insufficient_data", changes: null },
              wellness: { trend: "insufficient_data", trends: {} },
              correlations: {},
              insights: [],
              recommendations: [],
            },
        ),
      );
  }

  // Data Export
  exportData(
    timeframe: string = "12m",
    format: "json" | "csv" = "json",
  ): Observable<any> {
    return this.apiService.get(API_ENDPOINTS.performanceData.export, {
      timeframe,
      format,
    });
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
