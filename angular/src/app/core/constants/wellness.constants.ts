/**
 * Wellness & Readiness Configuration Constants
 *
 * Centralizes all readiness calculation thresholds, weights, and wellness metrics.
 * Used by: TodayComponent, DailyReadinessComponent, WellnessService, PlayerDashboard
 *
 * @example
 * // Import from barrel
 * import { WELLNESS, getReadinessLevel, computeQuickReadiness } from '@core/constants';
 *
 * @example
 * // Get readiness level from score
 * const level = getReadinessLevel(score);
 * if (level.severity === 'success') {
 *   // Good to train
 * }
 *
 * @example
 * // Compute quick readiness score
 * const score = computeQuickReadiness(4, 5, false); // feeling: 4, energy: 5, no soreness
 *
 * @example
 * // Check thresholds
 * if (score >= WELLNESS.READINESS_EXCELLENT) {
 *   // Excellent readiness
 * }
 *
 * @example
 * // Use weights for custom calculations
 * const { QUICK_READINESS_WEIGHTS } = WELLNESS;
 * const weightedScore = feeling * QUICK_READINESS_WEIGHTS.feeling +
 *                       energy * QUICK_READINESS_WEIGHTS.energy;
 */

// =============================================================================
// CORE WELLNESS THRESHOLDS
// =============================================================================

export const WELLNESS = {
  // Scale maximums for input normalization
  /** Quick check-in feeling scale (1-5 emoji scale) */
  FEELING_SCALE_MAX: 5,
  /** Daily readiness slider scale (0-10) */
  SLIDER_SCALE_MAX: 10,
  /** Percentage scale max */
  PERCENTAGE_MAX: 100,

  // Readiness score thresholds (0-100 scale)
  /** Score >= this is "Excellent" readiness */
  READINESS_EXCELLENT: 80,
  /** Score >= this is "Good" readiness */
  READINESS_GOOD: 60,
  /** Score >= this is "Moderate" readiness */
  READINESS_MODERATE: 40,
  /** Generic "high readiness" threshold used in conditionals */
  READINESS_THRESHOLD_HIGH: 70,

  // Default values
  /** Default readiness score when no data available */
  DEFAULT_READINESS_SCORE: 70,
  /** Default initial slider positions */
  DEFAULT_PAIN_LEVEL: 0,
  DEFAULT_FATIGUE_LEVEL: 3,
  DEFAULT_SLEEP_QUALITY: 7,
  DEFAULT_MOTIVATION_LEVEL: 7,

  // Soreness impact on quick check-in score
  /** Score when athlete reports soreness */
  SORENESS_PENALTY_SCORE: 60,
  /** Score when athlete reports no soreness */
  NO_SORENESS_SCORE: 100,

  // Quick check-in weights (must sum to 1.0)
  // Used in: today.component.ts quickReadinessScore()
  // Validated at build time - see constants-validation.ts
  QUICK_READINESS_WEIGHTS: {
    feeling: 0.4,
    energy: 0.35,
    soreness: 0.25,
  } as const,

  // Daily readiness weights (must sum to 1.0)
  // Used in: daily-readiness.component.ts readinessScore()
  // Validated at build time - see constants-validation.ts
  DAILY_READINESS_WEIGHTS: {
    pain: 0.3,
    fatigue: 0.25,
    sleep: 0.25,
    motivation: 0.2,
  } as const,

  // Risk flag thresholds
  /** Pain level >= this triggers "High pain" risk flag */
  HIGH_PAIN_THRESHOLD: 7,
  /** Fatigue level >= this triggers "High fatigue" risk flag */
  HIGH_FATIGUE_THRESHOLD: 7,
  /** Sleep quality <= this triggers "Poor sleep" risk flag */
  POOR_SLEEP_THRESHOLD: 3,
  /** Motivation level <= this triggers "Low motivation" risk flag */
  LOW_MOTIVATION_THRESHOLD: 3,

  // Biometric thresholds
  /** Resting HR above this is considered elevated */
  ELEVATED_HR_THRESHOLD: 70,

  // Environmental risk thresholds
  /** Temperature (Celsius) above this triggers heat risk warning */
  HEAT_RISK_TEMP_CELSIUS: 25,
  /** Humidity (%) above this combined with high temp triggers heat risk */
  HEAT_RISK_HUMIDITY_PERCENT: 70,

  // Performance thresholds
  /** Performance score >= this is considered "good" */
  PERFORMANCE_THRESHOLD_GOOD: 70,
} as const;

// =============================================================================
// READINESS LEVEL DEFINITIONS
// =============================================================================

export type ReadinessLevelKey = "EXCELLENT" | "GOOD" | "MODERATE" | "LOW";

export interface ReadinessLevelConfig {
  readonly minScore: number;
  readonly label: string;
  readonly cssClass: string;
  readonly severity: "success" | "info" | "warn" | "danger";
  readonly hint: string;
}

/**
 * Readiness level configurations with thresholds, labels, and styling
 * @example
 * const level = getReadinessLevel(75); // Returns READINESS_LEVELS.GOOD
 */
export const READINESS_LEVELS: Record<ReadinessLevelKey, ReadinessLevelConfig> =
  {
    EXCELLENT: {
      minScore: WELLNESS.READINESS_EXCELLENT,
      label: "Excellent",
      cssClass: "excellent",
      severity: "success",
      hint: "Great condition for training!",
    },
    GOOD: {
      minScore: WELLNESS.READINESS_GOOD,
      label: "Good",
      cssClass: "good",
      severity: "success",
      hint: "Good to train with some awareness",
    },
    MODERATE: {
      minScore: WELLNESS.READINESS_MODERATE,
      label: "Moderate",
      cssClass: "moderate",
      severity: "warn",
      hint: "Consider lighter activity today",
    },
    LOW: {
      minScore: 0,
      label: "Low",
      cssClass: "low",
      severity: "danger",
      hint: "Recovery day recommended",
    },
  } as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the readiness level configuration based on score
 * @param score Readiness score (0-100)
 * @returns ReadinessLevelConfig for the appropriate level
 */
export function getReadinessLevel(score: number): ReadinessLevelConfig {
  if (score >= READINESS_LEVELS.EXCELLENT.minScore)
    return READINESS_LEVELS.EXCELLENT;
  if (score >= READINESS_LEVELS.GOOD.minScore) return READINESS_LEVELS.GOOD;
  if (score >= READINESS_LEVELS.MODERATE.minScore)
    return READINESS_LEVELS.MODERATE;
  return READINESS_LEVELS.LOW;
}

/**
 * Compute quick readiness score from quick check-in data
 * Formula: (feeling * 0.4) + (energy * 0.35) + (soreness * 0.25)
 *
 * @param feeling Overall feeling score (1-5)
 * @param energy Energy level (1-5)
 * @param hasSoreness Whether athlete has soreness
 * @returns Readiness score (0-100)
 */
export function computeQuickReadiness(
  feeling: number,
  energy: number,
  hasSoreness: boolean
): number {
  const { FEELING_SCALE_MAX, PERCENTAGE_MAX, QUICK_READINESS_WEIGHTS } =
    WELLNESS;
  const { SORENESS_PENALTY_SCORE, NO_SORENESS_SCORE } = WELLNESS;

  const feelingScore = (feeling / FEELING_SCALE_MAX) * PERCENTAGE_MAX;
  const energyScore = (energy / FEELING_SCALE_MAX) * PERCENTAGE_MAX;
  const sorenessScore = hasSoreness ? SORENESS_PENALTY_SCORE : NO_SORENESS_SCORE;

  const score = Math.round(
    feelingScore * QUICK_READINESS_WEIGHTS.feeling +
      energyScore * QUICK_READINESS_WEIGHTS.energy +
      sorenessScore * QUICK_READINESS_WEIGHTS.soreness
  );

  return Math.max(0, Math.min(PERCENTAGE_MAX, score));
}

/**
 * Compute daily readiness score from full check-in data
 * Formula: ((10 - pain) * 0.3) + ((10 - fatigue) * 0.25) + (sleep * 0.25) + (motivation * 0.2)
 *
 * @param pain Pain level (0-10, lower is better)
 * @param fatigue Fatigue level (0-10, lower is better)
 * @param sleepQuality Sleep quality (0-10, higher is better)
 * @param motivation Motivation level (0-10, higher is better)
 * @returns Readiness score (0-100)
 */
export function computeDailyReadiness(
  pain: number,
  fatigue: number,
  sleepQuality: number,
  motivation: number
): number {
  const { SLIDER_SCALE_MAX, PERCENTAGE_MAX, DAILY_READINESS_WEIGHTS } = WELLNESS;

  // Invert pain and fatigue (lower is better for these)
  const painScore = SLIDER_SCALE_MAX - pain;
  const fatigueScore = SLIDER_SCALE_MAX - fatigue;

  const weightedScore =
    (painScore * DAILY_READINESS_WEIGHTS.pain +
      fatigueScore * DAILY_READINESS_WEIGHTS.fatigue +
      sleepQuality * DAILY_READINESS_WEIGHTS.sleep +
      motivation * DAILY_READINESS_WEIGHTS.motivation) *
    SLIDER_SCALE_MAX;

  const score = Math.round(
    Math.max(0, Math.min(PERCENTAGE_MAX, weightedScore))
  );
  return score;
}

/**
 * Get risk flags based on daily readiness inputs
 * @returns Array of risk flag strings
 */
export function getRiskFlags(state: {
  pain_level: number;
  fatigue_level: number;
  sleep_quality: number;
  motivation_level: number;
}): string[] {
  const flags: string[] = [];

  if (state.pain_level >= WELLNESS.HIGH_PAIN_THRESHOLD) {
    flags.push("High pain");
  }
  if (state.fatigue_level >= WELLNESS.HIGH_FATIGUE_THRESHOLD) {
    flags.push("High fatigue");
  }
  if (state.sleep_quality <= WELLNESS.POOR_SLEEP_THRESHOLD) {
    flags.push("Poor sleep");
  }
  if (state.motivation_level <= WELLNESS.LOW_MOTIVATION_THRESHOLD) {
    flags.push("Low motivation");
  }

  return flags;
}

/**
 * Check if environmental conditions pose heat risk
 * @param tempCelsius Temperature in Celsius
 * @param humidityPercent Humidity percentage
 * @returns Whether heat risk warning should be shown
 */
export function isHeatRisk(
  tempCelsius: number,
  humidityPercent: number
): boolean {
  return (
    tempCelsius > WELLNESS.HEAT_RISK_TEMP_CELSIUS &&
    humidityPercent > WELLNESS.HEAT_RISK_HUMIDITY_PERCENT
  );
}

/**
 * Check if resting heart rate is elevated
 * @param restingHR Resting heart rate in BPM
 * @returns Whether HR is above threshold
 */
export function isElevatedHeartRate(restingHR: number): boolean {
  return restingHR > WELLNESS.ELEVATED_HR_THRESHOLD;
}
