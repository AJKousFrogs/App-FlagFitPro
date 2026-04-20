/**
 * Session Type Inference Utilities
 *
 * Pure functions for inferring training session types from workout log data.
 * Extracted from AcwrService for testability and reuse.
 */

interface WorkoutLogLike {
  workout_type?: string;
  notes?: string;
}

type SessionType =
  | "game"
  | "sprint"
  | "technical"
  | "conditioning"
  | "strength"
  | "recovery";

/**
 * Infer a session type from workout log fields.
 * Checks workout_type first, then falls back to notes for legacy rows,
 * then defaults to "technical".
 */
export function inferSessionType(log: WorkoutLogLike): SessionType {
  const workoutType = (log.workout_type || "").toLowerCase();
  if (workoutType.includes("game") || workoutType.includes("match")) {
    return "game";
  } else if (workoutType.includes("sprint") || workoutType.includes("speed")) {
    return "sprint";
  } else if (
    workoutType.includes("strength") ||
    workoutType.includes("gym") ||
    workoutType.includes("weight")
  ) {
    return "strength";
  } else if (
    workoutType.includes("conditioning") ||
    workoutType.includes("cardio")
  ) {
    return "conditioning";
  } else if (
    workoutType.includes("recovery") ||
    workoutType.includes("mobility") ||
    workoutType.includes("activation")
  ) {
    return "recovery";
  }

  // Fall back to notes for legacy rows, then default to technical.
  const notes = (log.notes || "").toLowerCase();

  if (notes.includes("game") || notes.includes("match")) {
    return "game";
  } else if (notes.includes("sprint") || notes.includes("speed")) {
    return "sprint";
  } else if (
    notes.includes("strength") ||
    notes.includes("gym") ||
    notes.includes("weights")
  ) {
    return "strength";
  } else if (notes.includes("conditioning") || notes.includes("cardio")) {
    return "conditioning";
  } else if (notes.includes("recovery") || notes.includes("rest")) {
    return "recovery";
  }

  return "technical";
}
