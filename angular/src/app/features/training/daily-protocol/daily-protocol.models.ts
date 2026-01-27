/**
 * Daily Protocol Models
 *
 * Type definitions for the Daily Protocol system including:
 * - Exercise prescriptions
 * - Protocol blocks (morning, foam roll, main, evening)
 * - Completion tracking
 */

// ============================================================================
// EXERCISE TYPES
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  category: ExerciseCategory;
  subcategory?: string;

  // Video
  videoUrl?: string;
  videoId?: string;
  videoDurationSeconds?: number;
  thumbnailUrl?: string;

  // Instructions (HOW / FEEL / COMPENSATION)
  howText: string;
  feelText?: string;
  compensationText?: string;

  // Default prescription
  defaultSets: number;
  defaultReps?: number;
  defaultHoldSeconds?: number;
  defaultDurationSeconds?: number;

  // Metadata
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  equipmentRequired?: string[];
  targetMuscles?: string[];
  positionSpecific?: string[];
  loadContributionAu: number;
  isHighIntensity: boolean;
}

export type ExerciseCategory =
  | "mobility"
  | "foam_roll"
  | "warm_up"
  | "strength"
  | "skill"
  | "conditioning"
  | "plyometric"
  | "recovery"
  | "cool_down";

// ============================================================================
// PRESCRIBED EXERCISE (with today's prescription)
// ============================================================================

export interface PrescribedExercise {
  id: string; // protocol_exercise id
  exerciseId: string;
  exercise: Exercise;

  // Block assignment
  blockType: BlockType;
  sequenceOrder: number;

  // Today's AI-calculated prescription
  prescribedSets: number;
  prescribedReps?: number;
  prescribedHoldSeconds?: number;
  prescribedDurationSeconds?: number;
  prescribedWeightKg?: number;

  // Progression context
  yesterdaySets?: number;
  yesterdayReps?: number;
  yesterdayHoldSeconds?: number;
  progressionNote?: string; // "+1 rep from yesterday"

  // AI notes for today
  aiNote?: string; // "Focus on IT band - high sprint volume last 48h"

  // Completion status
  status: ExerciseStatus;
  completedAt?: Date;

  // Actual performance (if different from prescribed)
  actualSets?: number;
  actualReps?: number;
  actualHoldSeconds?: number;
  actualDurationSeconds?: number;
  actualWeightKg?: number;

  // Load
  loadContributionAu: number;
}

export type ExerciseStatus = "pending" | "complete" | "skipped";

// ============================================================================
// PROTOCOL BLOCKS
// ============================================================================

export type BlockType =
  | "morning_mobility"
  | "foam_roll"
  | "warm_up"
  | "isometrics"
  | "plyometrics"
  | "strength"
  | "conditioning"
  | "skill_drills"
  | "main_session"
  | "cool_down"
  | "evening_recovery";

export interface ProtocolBlock {
  type: BlockType;
  title: string;
  icon: string;
  status: BlockStatus;
  exercises: PrescribedExercise[];
  completedAt?: Date;

  // Progress
  completedCount: number;
  totalCount: number;
  progressPercent: number;

  // Block-specific metadata
  estimatedDurationMinutes?: number;
  aiNote?: string;
}

export type BlockStatus = "pending" | "in_progress" | "complete" | "skipped";

// ============================================================================
// DAILY PROTOCOL
// ============================================================================

export interface DailyProtocol {
  id: string;
  userId: string;
  protocolDate: string; // ISO date string

  // Context at generation
  readinessScore?: number;
  acwrValue?: number;
  totalLoadTargetAu?: number;

  // AI rationale
  aiRationale?: string;
  trainingFocus?: string;

  // Blocks - Evidence-based 1.5h training structure
  morningMobility: ProtocolBlock;
  foamRoll: ProtocolBlock;
  warmUp?: ProtocolBlock;
  isometrics?: ProtocolBlock; // NEW: 15 min isometric training
  plyometrics?: ProtocolBlock; // NEW: 15 min plyometric training
  strength?: ProtocolBlock; // NEW: 15 min strength (incl. Nordic curls)
  conditioning?: ProtocolBlock; // NEW: 15 min ACWR-adjusted conditioning
  skillDrills?: ProtocolBlock; // NEW: 15 min skill/twitching drills
  mainSession: ProtocolBlock; // Legacy - kept for backwards compatibility
  coolDown?: ProtocolBlock;
  eveningRecovery: ProtocolBlock;

  // Overall progress
  overallProgress: number; // 0-100%
  completedExercises: number;
  totalExercises: number;

  // Logged session data (for main session)
  actualDurationMinutes?: number;
  actualRpe?: number;
  actualLoadAu?: number;
  sessionNotes?: string;

  // Timestamps
  generatedAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

import { BLOCK_COLORS } from "../../../core/utils/design-tokens.util";

/**
 * Block configuration for protocol display
 * Colors use CSS variable references from design-system-tokens.scss
 * This ensures consistency with the design system and theme support
 */
export const BLOCK_CONFIG: Record<
  BlockType,
  { title: string; icon: string; color: string }
> = {
  morning_mobility: {
    title: "Morning Mobility",
    icon: "pi-sun",
    color: BLOCK_COLORS.morning_mobility, // --primitive-warning-500 (amber)
  },
  foam_roll: {
    title: "Pre-Training: Foam Roll",
    icon: "pi-circle-fill",
    color: BLOCK_COLORS.foam_roll, // --primitive-error-500 (red)
  },
  warm_up: {
    title: "Warm-Up (25 min)",
    icon: "pi-bolt",
    color: BLOCK_COLORS.warm_up, // --color-workout-cardio (orange)
  },
  isometrics: {
    title: "Isometrics (15 min)",
    icon: "pi-pause-circle",
    color: BLOCK_COLORS.main_session, // Uses green for strength work
  },
  plyometrics: {
    title: "Plyometrics (15 min)",
    icon: "pi-arrow-up",
    color: BLOCK_COLORS.warm_up, // Uses orange for explosive work
  },
  strength: {
    title: "Strength (15 min)",
    icon: "pi-heart",
    color: BLOCK_COLORS.main_session, // Uses green for strength work
  },
  conditioning: {
    title: "Conditioning (15 min)",
    icon: "pi-directions-run",
    color: BLOCK_COLORS.foam_roll, // Uses red for cardio/conditioning
  },
  skill_drills: {
    title: "Skill Drills (15 min)",
    icon: "pi-bolt",
    color: BLOCK_COLORS.cool_down, // Uses blue for skill work
  },
  main_session: {
    title: "Main Session",
    icon: "pi-play",
    color: BLOCK_COLORS.main_session, // --ds-primary-green (brand green)
  },
  cool_down: {
    title: "Cool-Down (15 min)",
    icon: "pi-stop",
    color: BLOCK_COLORS.cool_down, // --color-chart-tertiary (blue)
  },
  evening_recovery: {
    title: "Evening Recovery",
    icon: "pi-moon",
    color: BLOCK_COLORS.evening_recovery, // --color-status-help (purple)
  },
};

export function getBlockConfig(type: BlockType) {
  return BLOCK_CONFIG[type];
}

export function formatPrescription(exercise: PrescribedExercise): string {
  const parts: string[] = [];

  if (exercise.prescribedSets) {
    parts.push(
      `${exercise.prescribedSets} set${exercise.prescribedSets > 1 ? "s" : ""}`,
    );
  }

  if (exercise.prescribedReps) {
    parts.push(
      `${exercise.prescribedReps} rep${exercise.prescribedReps > 1 ? "s" : ""}`,
    );
  }

  if (exercise.prescribedHoldSeconds) {
    parts.push(`${exercise.prescribedHoldSeconds}s hold`);
  }

  if (exercise.prescribedDurationSeconds) {
    const mins = Math.floor(exercise.prescribedDurationSeconds / 60);
    const secs = exercise.prescribedDurationSeconds % 60;
    if (mins > 0) {
      parts.push(`${mins}m${secs > 0 ? ` ${secs}s` : ""}`);
    } else {
      parts.push(`${secs}s`);
    }
  }

  if (exercise.prescribedWeightKg) {
    parts.push(`${exercise.prescribedWeightKg}kg`);
  }

  return parts.join(" × ");
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface DailyProtocolResponse {
  success: boolean;
  data?: DailyProtocol;
  error?: string;
}

export interface CompleteExerciseRequest {
  protocolExerciseId: string;
  actualSets?: number;
  actualReps?: number;
  actualHoldSeconds?: number;
  actualDurationSeconds?: number;
}

export interface LogSessionRequest {
  protocolId: string;
  actualDurationMinutes: number;
  actualRpe: number;
  sessionNotes?: string;
}
