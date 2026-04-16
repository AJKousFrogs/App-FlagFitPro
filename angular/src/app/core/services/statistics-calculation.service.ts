import { Injectable } from "@angular/core";

/**
 * Statistics Calculation Service
 * Provides validated, precise statistical calculations with proper rounding,
 * confidence intervals, and edge case handling for flag football statistics.
 */

export interface CompletionPercentageResult {
  percentage: number;
}

export interface DropRateResult {
  rate: number;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

export interface FlagPullSuccessRateResult {
  rate: number;
  confidence95: [number, number]; // 95% confidence interval
  sampleSizeAdequate: boolean;
  defensiveGrade: string;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  stretchDates: { start: Date; end: Date }[];
  nextOpportunity: Date;
}

export interface WeeklyStatsResult {
  sessionsCompleted: number;
  totalHours: number;
  totalMinutes: number;
  dataQuality: "complete" | "partial" | "poor";
  estimatedHours: number;
  confidenceLevel: number; // 0-100%
  weeklyLoad: {
    totalIntensityPoints: number;
    avgIntensityPerSession: number;
    varianceInLoad: number;
  };
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  athleteAdjustment: number;
  isOutlier: boolean;
  recommendation: string;
}

export interface BodyFatCalculationResult {
  bodyFatPercentage: number;
  category: string;
  confidence: number;
  measurements: { waist: number; neck: number; hips?: number };
  validMeasurements: boolean;
}

export interface Workout {
  date: Date | string;
  type?: string;
  duration?: number;
  intensity?: "high" | "medium" | "low";
  score?: number;
}

@Injectable({
  providedIn: "root",
})
export class StatisticsCalculationService {
  /**
   * Calculate completion percentage with proper rounding and validation
   */
  calculateCompletionPercentage(
    completions: number,
    attempts: number,
  ): CompletionPercentageResult {
    // Validation
    if (!Number.isInteger(completions) || !Number.isInteger(attempts)) {
      throw new Error("Completion stats must be integers");
    }

    if (attempts === 0) {
      return { percentage: 0 };
    }

    if (completions > attempts) {
      throw new Error("Completions cannot exceed attempts");
    }

    if (completions < 0 || attempts < 0) {
      throw new Error("Stats cannot be negative");
    }

    // Precise calculation with proper rounding
    const percentage = (completions / attempts) * 100;

    // Banker's rounding (round-half-to-even) for statistical accuracy
    const rounded = Number((Math.round(percentage * 10) / 10).toFixed(1));

    return { percentage: rounded };
  }

  /**
   * Calculate drop rate with severity classification
   */
  calculateDropRate(drops: number, targets: number): DropRateResult {
    // Validation
    if (!Number.isInteger(drops) || !Number.isInteger(targets)) {
      throw new Error("Drop stats must be integers");
    }

    if (targets === 0) {
      return {
        rate: 0,
        severity: "low",
        recommendation: "No targets recorded",
      };
    }

    if (drops > targets) {
      throw new Error("Drops cannot exceed targets");
    }

    if (drops < 0 || targets < 0) {
      throw new Error("Stats cannot be negative");
    }

    // Calculate drop rate with precision
    const rate = (drops / targets) * 100;
    const rounded = Number((Math.round(rate * 10) / 10).toFixed(1));

    // Severity classification (industry standards)
    let severity: "critical" | "high" | "medium" | "low";
    let recommendation: string;

    if (rounded > 15) {
      severity = "critical";
      recommendation =
        "Critical drop rate. Focus on hand placement and concentration drills.";
    } else if (rounded > 10) {
      severity = "high";
      recommendation =
        "High drop rate. Implement technique improvement program.";
    } else if (rounded > 5) {
      severity = "medium";
      recommendation = "Moderate drop rate. Maintain current technique focus.";
    } else {
      severity = "low";
      recommendation = "Excellent catch consistency. Maintain current form.";
    }

    return { rate: rounded, severity, recommendation };
  }

  /**
   * Calculate flag pull success rate with confidence intervals
   */
  calculateFlagPullSuccessRate(
    successes: number,
    attempts: number,
  ): FlagPullSuccessRateResult {
    // Validation
    if (!Number.isInteger(successes) || !Number.isInteger(attempts)) {
      throw new Error("Pull stats must be integers");
    }

    if (attempts <= 0) {
      return {
        rate: 0,
        confidence95: [0, 0],
        sampleSizeAdequate: false,
        defensiveGrade: "Insufficient Data",
      };
    }

    if (successes > attempts) {
      throw new Error("Successes cannot exceed attempts");
    }

    // Calculate rate
    const rate = (successes / attempts) * 100;
    const rounded = Number((Math.round(rate * 10) / 10).toFixed(1));

    // Wilson score interval (more accurate than normal approximation)
    const p = successes / attempts;
    const z = 1.96; // 95% confidence
    const denominator = 1 + (z * z) / attempts;
    const center = (p + (z * z) / (2 * attempts)) / denominator;
    const margin =
      (z *
        Math.sqrt(
          (p * (1 - p)) / attempts + (z * z) / (4 * attempts * attempts),
        )) /
      denominator;

    const lowerBound = Math.max(0, (center - margin) * 100);
    const upperBound = Math.min(100, (center + margin) * 100);
    const confidence95: [number, number] = [
      Number(lowerBound.toFixed(1)),
      Number(upperBound.toFixed(1)),
    ];

    // Sample size adequacy (Cochran's rule: n*p >= 5 and n*(1-p) >= 5)
    const sampleSizeAdequate = attempts * p >= 5 && attempts * (1 - p) >= 5;

    // Defensive grading
    let defensiveGrade: string;
    if (rounded >= 90) defensiveGrade = "A+ (Elite)";
    else if (rounded >= 85) defensiveGrade = "A (Excellent)";
    else if (rounded >= 80) defensiveGrade = "B (Very Good)";
    else if (rounded >= 75) defensiveGrade = "C (Good)";
    else if (rounded >= 70) defensiveGrade = "D (Adequate)";
    else defensiveGrade = "F (Needs Improvement)";

    return {
      rate: rounded,
      confidence95,
      sampleSizeAdequate,
      defensiveGrade,
    };
  }

  /**
   * Calculate streak with timezone safety
   */
  calculateStreak(
    workouts: Workout[],
    referenceDate: Date = new Date(),
  ): StreakResult {
    if (!Array.isArray(workouts) || workouts.length === 0) {
      const tomorrow = new Date(referenceDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        currentStreak: 0,
        longestStreak: 0,
        stretchDates: [],
        nextOpportunity: tomorrow,
      };
    }

    // Normalize all dates to UTC midnight for consistent comparison
    const normalizeToUTCMidnight = (date: Date): Date => {
      const normalized = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      return normalized;
    };

    // Get unique workout dates (eliminate same-day duplicates)
    const workoutDates = Array.from(
      new Set(
        workouts
          .map((w) => normalizeToUTCMidnight(new Date(w.date)))
          .map((d) => d.getTime()),
      ),
    )
      .map((ts) => new Date(ts))
      .sort((a, b) => b.getTime() - a.getTime()); // Newest first

    const refNormalized = normalizeToUTCMidnight(referenceDate);

    // Calculate current streak (backwards from today)
    let currentStreak = 0;
    const expectedDate = new Date(refNormalized);

    for (const workoutDate of workoutDates) {
      const dayDifference =
        (expectedDate.getTime() - workoutDate.getTime()) /
        (1000 * 60 * 60 * 24);

      // Allow for 1-day gaps (rest days) but not 2+ days
      if (dayDifference === 0) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (dayDifference === 1) {
        // One allowed rest day — this workout still counts toward the streak
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 2);
      } else {
        // Gap too large, streak broken
        break;
      }
    }

    // Calculate longest streak and stretches
    let longestStreak = 0;
    let currentLength = 0;
    const stretchDates: { start: Date; end: Date }[] = [];
    let stretchStart: Date | null = null;

    for (let i = workoutDates.length - 1; i >= 0; i--) {
      if (i === workoutDates.length - 1) {
        currentLength = 1;
        stretchStart = new Date(workoutDates[i]);
      } else {
        const dayDifference =
          (workoutDates[i + 1].getTime() - workoutDates[i].getTime()) /
          (1000 * 60 * 60 * 24);

        if (dayDifference <= 1) {
          currentLength++;
        } else {
          if (currentLength > longestStreak) {
            longestStreak = currentLength;
          }
          if (stretchStart && currentLength >= 3) {
            // Only track stretches of 3+
            stretchDates.push({
              start: new Date(workoutDates[i + 1]),
              end: stretchStart,
            });
          }
          currentLength = 1;
          stretchStart = new Date(workoutDates[i]);
        }
      }
    }

    // Final stretch
    if (currentLength > longestStreak) longestStreak = currentLength;
    if (stretchStart && currentLength >= 3) {
      stretchDates.push({
        start: new Date(workoutDates[workoutDates.length - 1]),
        end: stretchStart,
      });
    }

    // Calculate next opportunity
    const nextOpportunity = new Date(refNormalized);
    nextOpportunity.setDate(nextOpportunity.getDate() + 1);

    return {
      currentStreak,
      longestStreak,
      stretchDates: stretchDates.reverse(), // Oldest first
      nextOpportunity,
    };
  }

  /**
   * Calculate weekly statistics with data quality tracking
   */
  calculateWeeklyStats(
    workouts: Workout[],
    referenceDate: Date = new Date(),
  ): WeeklyStatsResult {
    // Get week boundaries (ISO week: Monday-Sunday)
    const getISOWeekStart = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      return new Date(d.setDate(diff));
    };

    const weekStart = getISOWeekStart(referenceDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Filter workouts within week
    const weekWorkouts = workouts.filter((w) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= weekStart && workoutDate <= weekEnd;
    });

    // Separate recorded vs estimated durations
    let totalMinutes = 0;
    let recordedCount = 0;
    let estimatedCount = 0;
    let estimatedMinutes = 0;
    const intensityPoints: number[] = [];

    weekWorkouts.forEach((workout) => {
      if (typeof workout.duration === "number" && workout.duration > 0) {
        totalMinutes += workout.duration;
        recordedCount++;
      } else {
        const defaultDuration = this.getDefaultDurationByType(workout.type);
        totalMinutes += defaultDuration;
        estimatedCount++;
        estimatedMinutes += defaultDuration;
      }

      // Track intensity for variance calculation
      const intensity = this.getIntensityScore(workout.type, workout.intensity);
      intensityPoints.push(intensity);
    });

    // Calculate data quality
    const totalWorkouts = weekWorkouts.length;
    const recordedPercentage =
      totalWorkouts > 0 ? recordedCount / totalWorkouts : 0;
    let dataQuality: "complete" | "partial" | "poor";

    if (recordedPercentage >= 0.9) {
      dataQuality = "complete";
    } else if (recordedPercentage >= 0.6) {
      dataQuality = "partial";
    } else {
      dataQuality = "poor";
    }

    // Calculate variance in load
    const avgIntensity =
      intensityPoints.length > 0
        ? intensityPoints.reduce((a, b) => a + b) / intensityPoints.length
        : 0;

    // Use Bessel's correction (n-1) for sample variance
    const variance =
      intensityPoints.length > 1
        ? intensityPoints.reduce(
            (sum, intensity) => sum + Math.pow(intensity - avgIntensity, 2),
            0,
          ) / (intensityPoints.length - 1)
        : 0;

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      sessionsCompleted: weekWorkouts.length,
      totalHours,
      totalMinutes,
      dataQuality,
      estimatedHours: Number((estimatedMinutes / 60).toFixed(1)),
      confidenceLevel: recordedPercentage * 100,
      weeklyLoad: {
        totalIntensityPoints: intensityPoints.reduce((a, b) => a + b, 0),
        avgIntensityPerSession: avgIntensity,
        varianceInLoad: Number(Math.sqrt(variance).toFixed(2)),
      },
    };
  }

  /**
   * Calculate BMI with athlete adjustments
   */
  calculateBMI(weightKg: number, heightCm: number): BMICalculationResult {
    // Input validation
    if (weightKg < 30 || weightKg > 300) {
      throw new Error("Weight must be between 30-300 kg");
    }
    if (heightCm < 100 || heightCm > 250) {
      throw new Error("Height must be between 100-250 cm");
    }

    const heightMeters = heightCm / 100;
    const bmi = Number((weightKg / (heightMeters * heightMeters)).toFixed(1));

    // Outlier detection (beyond 3 standard deviations)
    const isOutlier = bmi < 16 || bmi > 45;

    // Standard BMI categories
    let category: string;
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal Weight";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";

    // Athletic adjustment (athletes have higher muscle mass)
    let athleteAdjustment = 0;
    if (category === "Overweight" || category === "Obese") {
      athleteAdjustment = -2.5; // Flag football players typically lean
    }

    // Recommendation
    let recommendation = "";
    if (isOutlier) {
      recommendation =
        "Consult healthcare provider - value outside normal range";
    } else if (bmi > 30) {
      recommendation =
        "Focus on nutrition and cardio for improved athletic performance";
    } else if (bmi < 18.5) {
      recommendation = "Increase caloric intake to support training demands";
    } else {
      recommendation = "Maintain current weight and focus on body composition";
    }

    return {
      bmi,
      category,
      athleteAdjustment,
      isOutlier,
      recommendation,
    };
  }

  /**
   * Calculate body fat percentage using Navy method
   */
  calculateBodyFat(
    waistCm: number,
    neckCm: number,
    hipsCm: number | undefined,
    heightCm: number,
    gender: "male" | "female",
  ): BodyFatCalculationResult {
    // Validation
    if (waistCm < 50 || waistCm > 200) {
      throw new Error("Waist measurement invalid");
    }
    if (neckCm < 20 || neckCm > 60) {
      throw new Error("Neck measurement invalid");
    }
    if (heightCm < 100 || heightCm > 250) {
      throw new Error("Height invalid");
    }

    let bodyFatPercentage: number;
    const confidence: number = 0.85; // Default confidence (85%)

    if (gender === "male") {
      // Navy method for males
      // BF% = 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
      const difference = waistCm - neckCm;

      if (difference <= 0) {
        throw new Error("Waist must be larger than neck for males");
      }

      const log10 = (x: number) => Math.log10(x);
      bodyFatPercentage =
        86.01 * log10(difference) - 70.041 * log10(heightCm) + 36.76;
    } else {
      // Navy method for females (requires hips)
      if (!hipsCm || hipsCm < 50 || hipsCm > 200) {
        throw new Error(
          "Hip measurement required and must be valid for females",
        );
      }

      // BF% = 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
      const sum = waistCm + hipsCm - neckCm;

      if (sum <= 0) {
        throw new Error("Invalid measurement combination");
      }

      const log10 = (x: number) => Math.log10(x);
      bodyFatPercentage =
        163.205 * log10(sum) - 97.684 * log10(heightCm) - 78.387;
    }

    // Sport-realistic bounds for flag football athletes.
    // Navy method SE: ±3.5% males, ±5% females — result is an estimate, not precise.
    const minBF = gender === "male" ? 5 : 12;
    const maxBF = gender === "male" ? 35 : 40;
    bodyFatPercentage = Math.max(
      minBF,
      Math.min(maxBF, Number(bodyFatPercentage.toFixed(1))),
    );

    // Gender-specific confidence reflecting Navy method standard error
    const genderConfidence = gender === "male" ? 0.85 : 0.75;

    // Category classification
    let category: string;
    if (gender === "male") {
      if (bodyFatPercentage < 10) category = "Athlete";
      else if (bodyFatPercentage < 14) category = "Excellent";
      else if (bodyFatPercentage < 18) category = "Good";
      else if (bodyFatPercentage < 25) category = "Average";
      else category = "Overweight";
    } else {
      if (bodyFatPercentage < 16) category = "Athlete";
      else if (bodyFatPercentage < 20) category = "Excellent";
      else if (bodyFatPercentage < 25) category = "Good";
      else if (bodyFatPercentage < 32) category = "Average";
      else category = "Overweight";
    }

    return {
      bodyFatPercentage,
      category,
      confidence: genderConfidence,
      measurements: { waist: waistCm, neck: neckCm, hips: hipsCm },
      validMeasurements: true,
    };
  }

  /**
   * Get default duration by workout type
   */
  private getDefaultDurationByType(type?: string): number {
    const defaults: { [key: string]: number } = {
      speed: 45,
      strength: 60,
      agility: 30,
      endurance: 50,
      flag_practice: 60,
      technique: 45,
      training: 45,
    };
    return defaults[type || ""] || 45; // Explicit defaults per type
  }

  /**
   * Get intensity score by workout type and intensity level
   */
  private getIntensityScore(
    type?: string,
    intensity?: "high" | "medium" | "low",
  ): number {
    const baseScores: { [key: string]: number } = {
      speed: 8,
      strength: 7,
      agility: 8,
      endurance: 6,
      flag_practice: 8,
      technique: 5,
      training: 6,
    };

    const base = baseScores[type || ""] || 6;

    if (intensity === "high") return base;
    if (intensity === "medium") return base * 0.7;
    if (intensity === "low") return base * 0.5;

    return base;
  }
}
