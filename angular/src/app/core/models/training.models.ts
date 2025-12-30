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
  | 'speed'
  | 'agility'
  | 'strength'
  | 'endurance'
  | 'skills'
  | 'recovery'
  | 'warmup'
  | 'cooldown'
  | 'nutrition'
  | 'mental';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export type TrainingFocus =
  | 'acceleration'
  | 'top-speed'
  | 'change-of-direction'
  | 'plyometrics'
  | 'route-running'
  | 'catching'
  | 'throwing'
  | 'defense'
  | 'core'
  | 'flexibility'
  | 'conditioning';

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

export type SessionType =
  | 'speed'
  | 'strength'
  | 'skills'
  | 'game'
  | 'recovery'
  | 'mixed';

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

export type PlanStatus = 'draft' | 'active' | 'completed' | 'cancelled';

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
  trend: 'improving' | 'declining' | 'stable';
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
  priority: 'low' | 'medium' | 'high';
  location?: string;
  coach?: string;
  notes?: string;
}

export interface ScheduleConflict {
  type: 'overlap' | 'rest-day' | 'injury' | 'travel';
  severity: 'warning' | 'error';
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
