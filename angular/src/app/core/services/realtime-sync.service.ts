import { Injectable } from "@angular/core";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * Realtime Sync Service
 * Handles real-time data synchronization with conflict detection
 * and resolution strategies.
 */

export interface Workout {
  id?: string;
  date: Date | string;
  type?: string;
  duration?: number;
  score?: number;
  notes?: string;
  modified_at?: Date | string;
  created_at?: Date | string;
}

export interface SyncConflictResult {
  resolved: Workout;
  conflict: boolean;
  resolutionStrategy: 'remote' | 'local' | 'merged';
}

@Injectable({
  providedIn: "root",
})
export class RealtimeSyncService {

  /**
   * Handle Supabase realtime updates with conflict detection
   */
  handleWorkoutUpdate(
    payload: RealtimePostgresChangesPayload<Workout>,
    localState: Workout
  ): SyncConflictResult {
    const remoteWorkout = payload.new as Workout;

    if (!remoteWorkout) {
      throw new Error("Invalid payload: missing new state");
    }

    // Detect conflicts: both local and remote modified
    const localModified = localState.modified_at
      ? new Date(localState.modified_at).getTime()
      : 0;
    const remoteModified = remoteWorkout.modified_at
      ? new Date(remoteWorkout.modified_at).getTime()
      : 0;

    const hasConflict =
      localModified > 0 &&
      remoteModified > 0 &&
      localModified !== remoteModified &&
      localModified > remoteModified;

    if (!hasConflict) {
      // No conflict: use remote state (server is source of truth)
      return {
        resolved: remoteWorkout,
        conflict: false,
        resolutionStrategy: "remote",
      };
    }

    // Resolve conflict using Last-Write-Wins strategy with field merging
    const resolved = this.mergeConflictingWorkouts(localState, remoteWorkout);

    return {
      resolved,
      conflict: true,
      resolutionStrategy: "merged",
    };
  }

  /**
   * Merge conflicting workouts using intelligent field selection
   */
  private mergeConflictingWorkouts(local: Workout, remote: Workout): Workout {
    const localModified = local.modified_at
      ? new Date(local.modified_at).getTime()
      : 0;
    const remoteModified = remote.modified_at
      ? new Date(remote.modified_at).getTime()
      : 0;

    // Use remote values for structural data
    const resolved: Workout = {
      ...remote,
      id: remote.id || local.id
    };

    // User-entered fields prefer local if local is newer
    if (localModified > remoteModified) {
      // Local is newer - prefer local user inputs
      if (local.duration !== undefined) {
        resolved.duration = local.duration;
      }
      if (local.score !== undefined) {
        resolved.score = local.score;
      }
      if (local.notes !== undefined && local.notes.trim() !== "") {
        resolved.notes = local.notes;
      }
      // Update modified_at to reflect local modification
      resolved.modified_at = local.modified_at;
    }

    return resolved;
  }

  /**
   * Handle deletion conflicts
   */
  handleDeletionConflict(
    payload: RealtimePostgresChangesPayload<Workout>,
    localState: Workout | null
  ): { shouldDelete: boolean; conflict: boolean } {
    // If remote says deleted, always delete (server is source of truth)
    if (payload.eventType === "DELETE") {
      return { shouldDelete: true, conflict: false };
    }

    // If local was deleted but remote has update, restore from remote
    if (!localState && payload.eventType === "UPDATE") {
      return { shouldDelete: false, conflict: true };
    }

    return { shouldDelete: false, conflict: false };
  }

  /**
   * Detect if two workouts are in conflict
   */
  areWorkoutsInConflict(workout1: Workout, workout2: Workout): boolean {
    if (!workout1.id || !workout2.id || workout1.id !== workout2.id) {
      return false;
    }

    const modified1 = workout1.modified_at
      ? new Date(workout1.modified_at).getTime()
      : 0;
    const modified2 = workout2.modified_at
      ? new Date(workout2.modified_at).getTime()
      : 0;

    return modified1 > 0 && modified2 > 0 && modified1 !== modified2;
  }

  /**
   * Get conflict resolution strategy recommendation
   */
  getConflictResolutionStrategy(
    local: Workout,
    remote: Workout
  ): "remote" | "local" | "merged" {
    const localModified = local.modified_at
      ? new Date(local.modified_at).getTime()
      : 0;
    const remoteModified = remote.modified_at
      ? new Date(remote.modified_at).getTime()
      : 0;

    if (localModified > remoteModified) {
      // Local is newer - merge with local preference
      return "merged";
    } else {
      // Remote is newer or equal - use remote
      return "remote";
    }
  }
}

