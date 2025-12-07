/**
 * ACWR Data Models
 * Type definitions for Acute:Chronic Workload Ratio system
 */

/**
 * Type of training load
 */
export type LoadType = 'external' | 'internal' | 'combined';

/**
 * Risk level classification
 */
export type RiskLevel =
  | 'no-data'
  | 'under-training'
  | 'sweet-spot'
  | 'elevated-risk'
  | 'danger-zone';

/**
 * Session type classification
 */
export type SessionType =
  | 'technical'      // Technical drills, skills work
  | 'conditioning'   // Cardio, endurance
  | 'strength'       // Gym, resistance training
  | 'game'           // Competition
  | 'recovery'       // Active recovery, stretching
  | 'sprint';        // Speed/agility work

/**
 * Risk zone information
 */
export interface RiskZone {
  level: RiskLevel;
  color: 'gray' | 'orange' | 'green' | 'yellow' | 'red';
  label: string;
  description: string;
  recommendation: string;
}

/**
 * External load metrics (GPS/wearable data)
 */
export interface ExternalLoad {
  totalDistance: number;          // Meters
  sprintCount: number;             // Number of sprints
  sprintDistance: number;          // Total sprint distance (m)
  playerLoad?: number;             // Device-specific metric (e.g., PlayerData)
  highSpeedRunning?: number;       // Distance > 5.5 m/s
  accelerations?: number;          // Count of accelerations
  decelerations?: number;          // Count of decelerations
  maxSpeed?: number;               // km/h
}

/**
 * Internal load metrics (subjective/physiological)
 */
export interface InternalLoad {
  sessionRPE: number;              // Rating of Perceived Exertion (1-10)
  duration: number;                // Session duration in minutes
  workload: number;                // RPE × duration = arbitrary units (AU)
  avgHeartRate?: number;           // Average HR (bpm)
  maxHeartRate?: number;           // Max HR (bpm)
  hrZones?: {                      // Time in each HR zone (minutes)
    zone1?: number;  // Recovery: 50-60% max HR
    zone2?: number;  // Aerobic: 60-70%
    zone3?: number;  // Tempo: 70-80%
    zone4?: number;  // Threshold: 80-90%
    zone5?: number;  // VO2 Max: 90-100%
  };
}

/**
 * Wellness/readiness metrics
 */
export interface WellnessMetrics {
  sleepQuality: number;            // 1-10 scale
  sleepDuration: number;           // Hours
  muscleSoreness: number;          // 1-10 (10 = not sore)
  stressLevel: number;             // 1-10 (10 = no stress)
  energyLevel: number;             // 1-10
  mood: number;                    // 1-10
  readinessScore?: number;         // Calculated composite score
}

/**
 * Complete load metrics combining external and internal
 */
export interface LoadMetrics {
  type: LoadType;
  external?: ExternalLoad;
  internal: InternalLoad;          // Always required (minimum is sRPE)
  wellness?: WellnessMetrics;
  calculatedLoad: number;          // Final load value used for ACWR
}

/**
 * Training session record
 */
export interface TrainingSession {
  id?: string;
  playerId: string;
  date: Date;
  sessionType: SessionType;
  metrics: LoadMetrics;
  load: number;                    // Total load for this session
  notes?: string;
  weather?: {
    temperature?: number;          // Celsius
    humidity?: number;             // Percentage
    conditions?: string;           // Sunny, rainy, etc.
  };
  location?: string;
  completed: boolean;
  modifiedFromPlan?: boolean;      // Was session modified due to ACWR?
}

/**
 * Complete ACWR calculation data
 */
export interface ACWRData {
  acute: number;                   // 7-day EWMA load
  chronic: number;                 // 28-day EWMA load
  ratio: number;                   // Acute ÷ Chronic
  riskZone: RiskZone;
  weeklyProgression: {
    currentWeek: number;
    previousWeek: number;
    changePercent: number;
    isSafe: boolean;
    warning?: string;
  };
  lastUpdated: Date;
}

/**
 * Player ACWR profile
 */
export interface PlayerACWRProfile {
  playerId: string;
  playerName: string;
  currentACWR: ACWRData;
  historicalACWR: Array<{
    date: Date;
    ratio: number;
    riskLevel: RiskLevel;
  }>;
  injuries?: Array<{
    date: Date;
    type: string;
    acwrAtInjury: number;          // ACWR when injury occurred
  }>;
  preferences?: {
    alertThreshold: number;        // Custom ACWR threshold for alerts
    enableAutoAdjust: boolean;     // Auto-adjust training based on ACWR
    notifyCoach: boolean;          // Send alerts to coach
  };
}

/**
 * Team ACWR summary
 */
export interface TeamACWRSummary {
  teamId: string;
  teamName: string;
  timestamp: Date;
  playerCount: number;
  riskDistribution: {
    noData: number;
    underTraining: number;
    sweetSpot: number;
    elevatedRisk: number;
    dangerZone: number;
  };
  averageACWR: number;
  playersAtRisk: Array<{
    playerId: string;
    playerName: string;
    acwr: number;
    riskLevel: RiskLevel;
  }>;
  weeklyLoadTrend: Array<{
    week: string;                  // ISO week (e.g., "2024-W48")
    averageLoad: number;
    acwrRange: { min: number; max: number };
  }>;
}

/**
 * Training plan adjustment
 */
export interface TrainingAdjustment {
  playerId: string;
  originalPlan: {
    sessionType: SessionType;
    plannedIntensity: number;      // 1-10 scale
    plannedDuration: number;       // Minutes
  };
  adjustedPlan: {
    sessionType: SessionType;
    adjustedIntensity: number;
    adjustedDuration: number;
    modifications: string[];
  };
  reason: string;
  acwrBeforeAdjustment: number;
  projectedACWRWithoutAdjustment: number;
  projectedACWRWithAdjustment: number;
  autoApplied: boolean;
  coachOverride?: boolean;
}

/**
 * Load monitoring alert
 */
export interface LoadAlert {
  id: string;
  playerId: string;
  playerName: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  type:
    | 'high-acwr'               // ACWR > 1.30
    | 'spike-detected'          // Weekly increase > 10%
    | 'under-training'          // ACWR < 0.80
    | 'danger-zone'             // ACWR > 1.50
    | 'consecutive-high-load';  // Multiple high-load days
  message: string;
  recommendation: string;
  acwrValue: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * ACWR configuration
 */
export interface ACWRConfig {
  acuteDays: number;               // Default: 7
  chronicDays: number;             // Default: 28
  acuteLambda: number;             // Default: 0.2 (EWMA decay)
  chronicLambda: number;           // Default: 0.05
  thresholds: {
    underTraining: number;         // Default: 0.80
    sweetSpotMax: number;          // Default: 1.30
    elevatedRisk: number;          // Default: 1.50
    maxWeeklyIncrease: number;     // Default: 10%
  };
  autoAdjust: boolean;             // Enable auto-adjustments
  alertsEnabled: boolean;
}

/**
 * Load calculation options
 */
export interface LoadCalculationOptions {
  includeWellness: boolean;        // Factor in wellness scores
  externalLoadWeight: number;      // 0-1, weight for external vs internal
  usePlayerLoad: boolean;          // Use device player load if available
  normalizeBySeason: boolean;      // Adjust for seasonal variations
}
