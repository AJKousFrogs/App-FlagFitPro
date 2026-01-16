/**
 * Data Confidence Service
 *
 * Calculates confidence scores for metrics based on data completeness and recency
 * Used to display confidence indicators throughout the app
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

export interface ConfidenceScore {
  score: number; // 0.0 to 1.0
  missingInputs: string[];
  staleData: string[];
}

export interface WellnessData {
  date: string | Date;
  sleep?: number;
  energy?: number;
  soreness?: number;
  stress?: number;
  mood?: number;
  hydration?: number;
}

@Injectable({
  providedIn: "root",
})
export class DataConfidenceService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Calculate confidence score for wellness data
   * Returns 0.0 to 1.0 based on completeness and recency
   */
  calculateWellnessConfidence(
    wellnessData: WellnessData[],
    daysRequired: number = 7,
  ): ConfidenceScore {
    if (!wellnessData || wellnessData.length === 0) {
      return {
        score: 0,
        missingInputs: ["wellness_data"],
        staleData: ["wellness"],
      };
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - daysRequired * 24 * 60 * 60 * 1000);

    const recentData = wellnessData.filter((d) => {
      const entryDate = new Date(d.date);
      return entryDate >= cutoff;
    });

    const completeness = Math.min(recentData.length / daysRequired, 1.0);

    // Check for missing metrics in recent entries
    const missingMetrics: string[] = [];
    const expectedMetrics = ["sleep", "energy", "soreness", "stress", "mood"];

    recentData.forEach((entry) => {
      expectedMetrics.forEach((metric) => {
        const value = entry[metric as keyof WellnessData];
        if (value === undefined || value === null) {
          missingMetrics.push(metric);
        }
      });
    });

    // Calculate metric completeness
    const totalExpectedMetrics = recentData.length * expectedMetrics.length;
    const metricCompleteness =
      totalExpectedMetrics > 0
        ? 1 - missingMetrics.length / totalExpectedMetrics
        : 0;

    // Score combines completeness and metric completeness
    const score = Math.min(completeness * metricCompleteness, 1.0);

    // Determine stale data
    const staleData: string[] = [];
    if (recentData.length < daysRequired) {
      staleData.push("wellness");
    }

    // Get unique missing inputs
    const uniqueMissing = [...new Set(missingMetrics)];

    return {
      score: Math.max(0, score), // Ensure non-negative
      missingInputs: uniqueMissing,
      staleData,
    };
  }

  /**
   * Calculate confidence for ACWR calculation
   */
  calculateACWRConfidence(
    trainingDays: number,
    requiredDays: number = 21,
  ): ConfidenceScore {
    if (trainingDays === 0) {
      return {
        score: 0,
        missingInputs: ["training_data"],
        staleData: [],
      };
    }

    const completeness = Math.min(trainingDays / requiredDays, 1.0);

    return {
      score: Math.max(0, completeness),
      missingInputs: trainingDays < requiredDays ? ["training_data"] : [],
      staleData: [],
    };
  }

  /**
   * Calculate confidence for game day readiness
   */
  calculateGameDayReadinessConfidence(metrics: {
    sleep?: number;
    energy?: number;
    soreness?: number;
    hydration?: number;
    confidence?: number;
  }): ConfidenceScore {
    const expectedMetrics = [
      "sleep",
      "energy",
      "soreness",
      "hydration",
      "confidence",
    ];
    const missingMetrics: string[] = [];

    expectedMetrics.forEach((metric) => {
      const value = metrics[metric as keyof typeof metrics];
      if (value === undefined || value === null || value === 0) {
        missingMetrics.push(metric);
      }
    });

    const completeness = 1 - missingMetrics.length / expectedMetrics.length;

    return {
      score: Math.max(0, completeness),
      missingInputs: missingMetrics,
      staleData: [],
    };
  }

  /**
   * Calculate confidence for partial wellness score
   * When only some metrics are provided
   */
  calculatePartialWellnessConfidence(
    providedMetrics: string[],
    totalMetrics: number = 5,
  ): ConfidenceScore {
    const completeness = providedMetrics.length / totalMetrics;

    const missingMetrics: string[] = [];
    const allMetrics = ["sleep", "energy", "soreness", "stress", "mood"];
    allMetrics.forEach((metric) => {
      if (!providedMetrics.includes(metric)) {
        missingMetrics.push(metric);
      }
    });

    return {
      score: Math.max(0, completeness),
      missingInputs: missingMetrics,
      staleData: [],
    };
  }

  /**
   * Get confidence level label
   */
  getConfidenceLevel(score: number): "High" | "Moderate" | "Low" | "Very Low" {
    if (score >= 0.9) return "High";
    if (score >= 0.7) return "Moderate";
    if (score >= 0.5) return "Low";
    return "Very Low";
  }

  /**
   * Get confidence severity for UI
   */
  getConfidenceSeverity(score: number): "success" | "info" | "warning" | "danger" {
    if (score >= 0.9) return "success";
    if (score >= 0.7) return "info";
    if (score >= 0.5) return "warning";
    return "danger";
  }
}
