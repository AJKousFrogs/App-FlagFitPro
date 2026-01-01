/**
 * Statistics Calculation Service (JavaScript)
 * Provides validated, precise statistical calculations with proper rounding,
 * confidence intervals, and edge case handling for flag football statistics.
 */

class StatisticsCalculationService {
  /**
   * Calculate completion percentage with proper rounding and validation
   */
  calculateCompletionPercentage(completions, attempts) {
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
  calculateDropRate(drops, targets) {
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
    let severity;
    let recommendation;

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
  calculateFlagPullSuccessRate(successes, attempts) {
    // Validation
    if (!Number.isInteger(successes) || !Number.isInteger(attempts)) {
      throw new Error("Pull stats must be integers");
    }

    if (attempts === 0) {
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
    const confidence95 = [
      Number(lowerBound.toFixed(1)),
      Number(upperBound.toFixed(1)),
    ];

    // Sample size adequacy (Cochran's rule: n*p >= 5 and n*(1-p) >= 5)
    const sampleSizeAdequate = attempts * p >= 5 && attempts * (1 - p) >= 5;

    // Defensive grading
    let defensiveGrade;
    if (rounded >= 90) {
      defensiveGrade = "A+ (Elite)";
    } else if (rounded >= 85) {
      defensiveGrade = "A (Excellent)";
    } else if (rounded >= 80) {
      defensiveGrade = "B (Very Good)";
    } else if (rounded >= 75) {
      defensiveGrade = "C (Good)";
    } else if (rounded >= 70) {
      defensiveGrade = "D (Adequate)";
    } else {
      defensiveGrade = "F (Needs Improvement)";
    }

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
  calculateStreak(workouts, referenceDate = new Date()) {
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
    const normalizeToUTCMidnight = (date) => {
      const d = new Date(date);
      const normalized = new Date(
        Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
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
        // Rest day (skip one day)
        expectedDate.setDate(expectedDate.getDate() - 2);
      } else {
        // Gap too large, streak broken
        break;
      }
    }

    // Calculate longest streak and stretches
    let longestStreak = 0;
    let currentLength = 0;
    const stretchDates = [];
    let stretchStart = null;

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
    if (currentLength > longestStreak) {
      longestStreak = currentLength;
    }
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
  calculateWeeklyStats(workouts, referenceDate = new Date()) {
    // Get week boundaries (ISO week: Monday-Sunday)
    const getISOWeekStart = (date) => {
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
    const intensityPoints = [];

    weekWorkouts.forEach((workout) => {
      if (workout.duration) {
        totalMinutes += workout.duration * 60; // Convert hours to minutes
        recordedCount++;
      } else {
        // Use type-specific default duration
        const defaultDuration = this.getDefaultDurationByType(workout.type);
        totalMinutes += defaultDuration;
        estimatedCount++;
      }

      // Track intensity for variance calculation
      const intensity = this.getIntensityScore(workout.type, workout.intensity);
      intensityPoints.push(intensity);
    });

    // Calculate data quality
    const totalWorkouts = weekWorkouts.length;
    const recordedPercentage =
      totalWorkouts > 0 ? recordedCount / totalWorkouts : 0;
    let dataQuality;

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

    const variance =
      intensityPoints.length > 1
        ? intensityPoints.reduce(
            (sum, intensity) => sum + (intensity - avgIntensity) ** 2,
            0,
          ) / intensityPoints.length
        : 0;

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      sessionsCompleted: weekWorkouts.length,
      totalHours,
      totalMinutes,
      dataQuality,
      estimatedHours: (estimatedCount * 45) / 60, // 45 min default per session
      confidenceLevel: recordedPercentage * 100,
      weeklyLoad: {
        totalIntensityPoints: intensityPoints.reduce((a, b) => a + b, 0),
        avgIntensityPerSession: avgIntensity,
        varianceInLoad: Number(Math.sqrt(variance).toFixed(2)),
      },
    };
  }

  /**
   * Get default duration by workout type
   */
  getDefaultDurationByType(type) {
    const defaults = {
      speed: 45,
      strength: 60,
      agility: 30,
      endurance: 50,
      flag_practice: 60,
      technique: 45,
      training: 45,
    };
    return defaults[type] || 45; // Explicit defaults per type
  }

  /**
   * Get intensity score by workout type and intensity level
   */
  getIntensityScore(type, intensity) {
    const baseScores = {
      speed: 8,
      strength: 7,
      agility: 8,
      endurance: 6,
      flag_practice: 8,
      technique: 5,
      training: 6,
    };

    const base = baseScores[type] || 6;

    if (intensity === "high") {
      return base;
    }
    if (intensity === "medium") {
      return base * 0.7;
    }
    if (intensity === "low") {
      return base * 0.5;
    }

    return base;
  }
}

// Export singleton instance
export const statisticsCalculationService = new StatisticsCalculationService();
