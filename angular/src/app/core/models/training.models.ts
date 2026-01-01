/**
 * Shared Training Models
 *
 * Centralized type definitions for training-related data structures.
 * Reduces duplication across services and components.
 *
 * @module core/models/training
 */

// ============================================================================
// TRAINING VIDEO TYPES
// ============================================================================

export interface TrainingVideo {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  category: TrainingCategory;
  difficulty: DifficultyLevel;
  focus: TrainingFocus[];
  equipment?: string[];
  tags?: string[];
  featured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrainingCategory =
  | "speed"
  | "agility"
  | "strength"
  | "endurance"
  | "skills"
  | "recovery"
  | "warmup"
  | "cooldown"
  | "nutrition"
  | "mental";

export type DifficultyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "elite";

export type TrainingFocus =
  | "acceleration"
  | "top-speed"
  | "change-of-direction"
  | "plyometrics"
  | "route-running"
  | "catching"
  | "throwing"
  | "defense"
  | "core"
  | "flexibility"
  | "conditioning";

// ============================================================================
// TRAINING SESSION TYPES
// ============================================================================

export interface TrainingSession {
  id: string;
  userId: string;
  date: Date;
  type: SessionType;
  duration: number; // in minutes
  workload?: number;
  intensity?: number;
  videos?: TrainingVideo[];
  exercises?: Exercise[];
  notes?: string;
  completed: boolean;
  performance?: SessionPerformance;
}

/**
 * Session types - aligned with DB training_sessions.session_type
 * DB also accepts: conditioning, technique, team_practice, scrimmage
 */
export type SessionType =
  | "speed"
  | "strength"
  | "skills"
  | "game"
  | "recovery"
  | "mixed"
  | "conditioning"
  | "technique"
  | "team_practice"
  | "scrimmage";

export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  rest?: number;
  weight?: number;
  notes?: string;
}

export interface SessionPerformance {
  rating: number; // 1-10
  effort: number; // 1-10
  rpe?: number; // Rate of Perceived Exertion
  heartRateAvg?: number;
  heartRateMax?: number;
  feedback?: string;
}

// ============================================================================
// TRAINING PLAN TYPES
// ============================================================================

export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  goal: string;
  weeks: WeeklyPlan[];
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PlanStatus = "draft" | "active" | "completed" | "cancelled";

/**
 * Training session status - aligned with DB enum training_session_status
 * DB values: planned, in_progress, completed, cancelled, scheduled
 * UI may map these to display-friendly values
 */
export type TrainingSessionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "scheduled";

export interface WeeklyPlan {
  weekNumber: number;
  theme: string;
  focus: TrainingFocus[];
  sessions: TrainingSession[];
  targetWorkload?: number;
  notes?: string;
}

// ============================================================================
// TRAINING METRICS TYPES
// ============================================================================

export interface TrainingMetrics {
  totalSessions: number;
  totalDuration: number; // minutes
  totalWorkload: number;
  averageIntensity: number;
  sessionsPerWeek: number;
  streak: number; // consecutive days
  lastSessionDate?: Date;
}

export interface TrainingProgress {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: "improving" | "declining" | "stable";
  history: ProgressDataPoint[];
}

export interface ProgressDataPoint {
  date: Date;
  value: number;
}

// ============================================================================
// TRAINING SCHEDULE TYPES
// ============================================================================

export interface TrainingSchedule {
  userId: string;
  date: Date;
  sessions: ScheduledSession[];
  conflicts?: ScheduleConflict[];
}

export interface ScheduledSession {
  time: string; // HH:MM format
  duration: number;
  type: SessionType;
  priority: "low" | "medium" | "high";
  location?: string;
  coach?: string;
  notes?: string;
}

export interface ScheduleConflict {
  type: "overlap" | "rest-day" | "injury" | "travel";
  severity: "warning" | "error";
  message: string;
  affectedSessions: string[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface VideoFilter {
  category?: TrainingCategory[];
  difficulty?: DifficultyLevel[];
  focus?: TrainingFocus[];
  duration?: {
    min?: number;
    max?: number;
  };
  equipment?: string[];
  featured?: boolean;
  search?: string;
}

export interface TrainingStats {
  total: number;
  completed: number;
  upcoming: number;
  completionRate: number;
  averageDuration: number;
  averageIntensity: number;
  streak: number;
}

// ============================================================================
// TRAINING COMPONENT UI TYPES
// ============================================================================

/**
 * Training statistics card for dashboard display
 */
export interface TrainingStatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend: string;
  trendType: "positive" | "negative" | "neutral";
}

/**
 * Weekly schedule day view for training component
 */
export interface WeeklyScheduleDay {
  name: string;
  date?: Date;
  sessions: Array<{
    time: string;
    title: string;
    type?: SessionType;
    duration?: number;
  }>;
  isToday?: boolean;
}

/**
 * Workout card for training component
 * Simplified view optimized for quick actions
 */
export interface Workout {
  id?: string;
  type: string;
  title: string;
  description: string;
  duration: string;
  intensity: "low" | "medium" | "high";
  location: string;
  icon: string;
  iconBg: string;
  scheduledTime?: string;
  completed?: boolean;
}

/**
 * Achievement badge for training component
 */
export interface Achievement {
  id?: string;
  icon: string;
  title: string;
  description?: string;
  date: string;
  category?: "streak" | "milestone" | "performance" | "consistency";
  level?: "bronze" | "silver" | "gold" | "platinum";
}

/**
 * Wellness alert for training readiness
 */
export interface WellnessAlert {
  severity: "info" | "warning" | "critical";
  message: string;
  recommendations: string[];
  icon?: string;
  actionLabel?: string;
  actionRoute?: string;
}

/**
 * Readiness status for training
 */
export type ReadinessStatus = "excellent" | "good" | "caution" | "rest";

/**
 * Wellness data integrated with training
 */
export interface WellnessTrainingData {
  alert: WellnessAlert | null;
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  lastCheckin?: Date;
  metrics?: {
    sleep?: number;
    energy?: number;
    stress?: number;
    soreness?: number;
    motivation?: number;
  };
}

/**
 * Complete training data result from loader
 * Aggregates all data needed by training component
 */
export interface TrainingDataResult {
  stats: TrainingStatCard[];
  schedule: WeeklyScheduleDay[];
  workouts: Workout[];
  achievements: Achievement[];
  wellnessData: WellnessTrainingData;
  userName?: string;
  lastRefresh?: Date;
}

/**
 * Training component state
 * Used by TrainingStateService
 */
export interface TrainingComponentState {
  userName: string;
  trainingStats: TrainingStatCard[];
  weeklySchedule: WeeklyScheduleDay[];
  workouts: Workout[];
  achievements: Achievement[];
  wellnessAlert: WellnessAlert | null;
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  swipingWorkoutId: string | null;
  swipeDirection: "left" | "right" | null;
  isRefreshing: boolean;
  wellnessAlertDismissed: boolean;
}

/**
 * Swipe event for workout actions
 */
export interface SwipeEvent {
  type: "swipeleft" | "swiperight";
  deltaX: number;
  deltaY: number;
  velocity: number;
  target: HTMLElement;
}
