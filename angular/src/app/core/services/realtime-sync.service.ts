import { Injectable, inject } from "@angular/core";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { LoggerService } from "./logger.service";

/**
 * Realtime Sync Service
 * Handles real-time data synchronization with bidirectional conflict detection
 * and resolution strategies.
 *
 * Conflict Detection:
 * - Detects when both local and remote have been modified
 * - Handles both directions: local newer AND remote newer
 * - Supports field-level merging for complex objects
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
  resolutionStrategy: "remote" | "local" | "merged";
  conflictType?: "local_newer" | "remote_newer" | "simultaneous" | "none";
}

/**
 * Tracks local uncommitted changes for conflict detection
 */
export interface LocalChangeTracker {
  id: string;
  originalState: Workout;
  pendingChanges: Partial<Workout>;
  changedAt: Date;
}

@Injectable({
  providedIn: "root",
})
export class RealtimeSyncService {
  private readonly logger = inject(LoggerService);

  // Track local uncommitted changes for proper conflict detection
  private localChanges = new Map<string, LocalChangeTracker>();

  /**
   * Register local changes before they're sent to server
   * This enables proper bidirectional conflict detection
   */
  trackLocalChange(
    id: string,
    originalState: Workout,
    changes: Partial<Workout>,
  ): void {
    this.localChanges.set(id, {
      id,
      originalState,
      pendingChanges: changes,
      changedAt: new Date(),
    });
  }

  /**
   * Clear tracked changes after successful sync
   */
  clearLocalChange(id: string): void {
    this.localChanges.delete(id);
  }

  /**
   * Handle Supabase realtime updates with bidirectional conflict detection
   * Detects conflicts in both directions and handles simultaneous updates
   */
  handleWorkoutUpdate(
    payload: RealtimePostgresChangesPayload<Workout>,
    localState: Workout,
  ): SyncConflictResult {
    const remoteWorkout = payload.new as Workout;

    if (!remoteWorkout) {
      throw new Error("Invalid payload: missing new state");
    }

    const localModified = localState.modified_at
      ? new Date(localState.modified_at).getTime()
      : 0;
    const remoteModified = remoteWorkout.modified_at
      ? new Date(remoteWorkout.modified_at).getTime()
      : 0;

    // Check for pending local changes that haven't been synced yet
    const pendingChange = localState.id
      ? this.localChanges.get(localState.id)
      : null;
    const hasPendingLocalChanges = pendingChange !== null;

    // Determine conflict type
    const conflictType = this.determineConflictType(
      localModified,
      remoteModified,
      hasPendingLocalChanges,
    );

    // No conflict: remote and local are in sync
    if (conflictType === "none") {
      return {
        resolved: remoteWorkout,
        conflict: false,
        resolutionStrategy: "remote",
        conflictType: "none",
      };
    }

    // Handle simultaneous updates (within 1 second tolerance)
    if (conflictType === "simultaneous") {
      this.logger.warn(
        `[RealtimeSync] Simultaneous update detected for workout ${localState.id}`,
      );
      // Prefer remote for simultaneous updates (server is source of truth)
      // but preserve any local-only fields
      const resolved = this.mergeSimultaneousUpdates(localState, remoteWorkout);
      return {
        resolved,
        conflict: true,
        resolutionStrategy: "merged",
        conflictType: "simultaneous",
      };
    }

    // Remote is newer - use remote but check for uncommitted local changes
    if (conflictType === "remote_newer") {
      if (hasPendingLocalChanges) {
        // We have uncommitted changes that might be lost
        this.logger.warn(
          `[RealtimeSync] Remote update will override pending local changes for ${localState.id}`,
        );
        const resolved = this.mergeConflictingWorkouts(
          localState,
          remoteWorkout,
          "remote",
        );
        return {
          resolved,
          conflict: true,
          resolutionStrategy: "merged",
          conflictType: "remote_newer",
        };
      }
      // No pending changes, just use remote
      return {
        resolved: remoteWorkout,
        conflict: false,
        resolutionStrategy: "remote",
        conflictType: "remote_newer",
      };
    }

    // Local is newer - merge with local preference
    if (conflictType === "local_newer") {
      const resolved = this.mergeConflictingWorkouts(
        localState,
        remoteWorkout,
        "local",
      );
      return {
        resolved,
        conflict: true,
        resolutionStrategy: "merged",
        conflictType: "local_newer",
      };
    }

    // Fallback: use remote
    return {
      resolved: remoteWorkout,
      conflict: false,
      resolutionStrategy: "remote",
      conflictType: "none",
    };
  }

  /**
   * Determine the type of conflict between local and remote states
   */
  private determineConflictType(
    localModified: number,
    remoteModified: number,
    hasPendingLocalChanges: boolean,
  ): "local_newer" | "remote_newer" | "simultaneous" | "none" {
    // No timestamps - no conflict
    if (localModified === 0 || remoteModified === 0) {
      return "none";
    }

    // Same timestamp - no conflict
    if (localModified === remoteModified) {
      return hasPendingLocalChanges ? "local_newer" : "none";
    }

    // Check for simultaneous updates (within 1 second)
    const timeDiff = Math.abs(localModified - remoteModified);
    if (timeDiff < 1000) {
      return "simultaneous";
    }

    // Clear winner
    if (localModified > remoteModified) {
      return "local_newer";
    }

    return "remote_newer";
  }

  /**
   * Handle simultaneous updates by merging both states
   */
  private mergeSimultaneousUpdates(local: Workout, remote: Workout): Workout {
    // For simultaneous updates, use remote as base but preserve local user inputs
    return {
      ...remote,
      id: remote.id || local.id,
      // Preserve local user-entered data if it exists
      duration: local.duration ?? remote.duration,
      score: local.score ?? remote.score,
      notes: this.mergeNotes(local.notes, remote.notes),
      // Use later timestamp
      modified_at: new Date(
        Math.max(
          new Date(local.modified_at || 0).getTime(),
          new Date(remote.modified_at || 0).getTime(),
        ),
      ).toISOString(),
    };
  }

  /**
   * Merge notes fields intelligently
   */
  private mergeNotes(
    localNotes?: string,
    remoteNotes?: string,
  ): string | undefined {
    if (!localNotes && !remoteNotes) return undefined;
    if (!localNotes) return remoteNotes;
    if (!remoteNotes) return localNotes;
    if (localNotes === remoteNotes) return localNotes;
    // Both have different notes - combine them
    return `${remoteNotes}\n---\n${localNotes}`;
  }

  /**
   * Merge conflicting workouts using intelligent field selection
   * @param preference - which source to prefer for user-entered fields
   */
  private mergeConflictingWorkouts(
    local: Workout,
    remote: Workout,
    preference: "local" | "remote" = "local",
  ): Workout {
    // Use remote as base for structural data (server is authority)
    const resolved: Workout = {
      ...remote,
      id: remote.id || local.id,
    };

    if (preference === "local") {
      // Local is preferred - use local user inputs
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
    } else {
      // Remote is preferred - but preserve local-only data that remote doesn't have
      if (resolved.duration === undefined && local.duration !== undefined) {
        resolved.duration = local.duration;
      }
      if (resolved.score === undefined && local.score !== undefined) {
        resolved.score = local.score;
      }
      if (
        (!resolved.notes || resolved.notes.trim() === "") &&
        local.notes !== undefined &&
        local.notes.trim() !== ""
      ) {
        resolved.notes = local.notes;
      }
    }

    return resolved;
  }

  /**
   * Handle deletion conflicts
   */
  handleDeletionConflict(
    payload: RealtimePostgresChangesPayload<Workout>,
    localState: Workout | null,
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
    remote: Workout,
  ): "remote" | "local" | "merged" {
    const localModified = local.modified_at
      ? new Date(local.modified_at).getTime()
      : 0;
    const remoteModified = remote.modified_at
      ? new Date(remote.modified_at).getTime()
      : 0;

    // Check for pending local changes
    const hasPendingChanges = local.id
      ? this.localChanges.has(local.id)
      : false;

    // Simultaneous updates (within 1 second) - merge
    if (Math.abs(localModified - remoteModified) < 1000 && localModified > 0) {
      return "merged";
    }

    if (localModified > remoteModified) {
      // Local is newer - merge with local preference
      return "merged";
    } else if (hasPendingChanges) {
      // Remote is newer but we have pending changes - merge to preserve local work
      return "merged";
    } else {
      // Remote is newer or equal, no pending changes - use remote
      return "remote";
    }
  }

  /**
   * Get all tracked local changes (for debugging/diagnostics)
   */
  getTrackedChanges(): Map<string, LocalChangeTracker> {
    return new Map(this.localChanges);
  }

  /**
   * Clear all tracked changes (e.g., on logout or full refresh)
   */
  clearAllTrackedChanges(): void {
    this.localChanges.clear();
  }
}
