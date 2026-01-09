/**
 * Player Program Service
 *
 * Manages player-to-program assignments via the /api/player-programs endpoints.
 * This is the frontend wrapper for the player_programs API.
 *
 * Usage:
 * - assignMyProgram(programId): Assign current user to a program
 * - getMyProgramAssignment(): Get current user's active program assignment
 * - switchProgram(programId): Switch to a different program (inactivates previous)
 * - updateAssignment(id, updates): Update assignment status/notes
 */

import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, map, of } from "rxjs";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";

// Program ID constants - must match backend
export const PROGRAM_IDS = {
  QB: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  WRDB: "ffffffff-ffff-ffff-ffff-ffffffffffff",
} as const;

/**
 * Position value mapping from UI values to database/modifier values
 * UI values: "QB", "WR", "Center", "DB", "Rusher", "LB", "Hybrid"
 * DB values: "quarterback", "wr_db", "center", "blitzer", "rusher", "wr_db", "wr_db"
 *
 * Note: Rusher and Blitzer are the same position (USA vs Europe terminology)
 * Both map to "rusher" in modifiers table (which has entries for both)
 */
export const POSITION_TO_MODIFIER_KEY: Record<string, string> = {
  QB: "quarterback",
  WR: "wr_db",
  DB: "wr_db",
  Center: "center",
  Rusher: "rusher", // USA terminology
  Blitzer: "blitzer", // Europe terminology - same as Rusher
  LB: "wr_db", // Linebackers use WR/DB base with some adjustments
  Hybrid: "wr_db", // Hybrid players use WR/DB base
};

/**
 * Normalize UI position value to database modifier key
 * @param uiPosition - Position value from onboarding (e.g., "QB", "WR", "Rusher")
 * @returns Normalized position key for position_exercise_modifiers table
 */
export function normalizePositionForModifiers(uiPosition: string): string {
  return POSITION_TO_MODIFIER_KEY[uiPosition] || "wr_db";
}

export interface ProgramAssignment {
  id: string;
  player_id: string;
  program_id: string;
  status: "active" | "paused" | "completed" | "inactive";
  start_date: string;
  end_date: string | null;
  current_week: number;
  current_phase_id: string | null;
  completion_percentage: number;
  modifications: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  program: {
    id: string;
    name: string;
  };
}

export interface AssignmentResponse {
  success: boolean;
  data?: {
    assignment: ProgramAssignment | null;
    message?: string;
  };
  error?: string;
  message?: string;
}

export interface AssignProgramRequest {
  program_id: string;
  start_date?: string;
  status?: "active" | "paused";
  force?: boolean;
}

export interface UpdateAssignmentRequest {
  status?: "active" | "paused" | "completed" | "inactive";
  end_date?: string;
  program_id?: string;
  notes?: string;
  modifications?: Record<string, unknown>;
}

/**
 * Get program ID for a given position
 * QB gets the QB program, everyone else gets WR/DB program
 */
export function getProgramIdForPosition(position: string): string {
  if (position === "QB") {
    return PROGRAM_IDS.QB;
  }
  return PROGRAM_IDS.WRDB;
}

@Injectable({
  providedIn: "root",
})
export class PlayerProgramService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly baseUrl = `${environment.apiUrl}/api/player-programs`;

  constructor() {
    this.logger.info(
      `[PlayerProgramService] Initialized with baseUrl: ${this.baseUrl}`,
    );
  }

  /**
   * Get current user's active program assignment
   */
  getMyProgramAssignment(): Observable<ProgramAssignment | null> {
    return this.http
      .get<AssignmentResponse>(`${this.baseUrl}/me`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.success && response.data?.assignment) {
            return response.data.assignment;
          }
          return null;
        }),
        catchError((error) => {
          this.logger.error(
            "[PlayerProgramService] Error fetching assignment:",
            error,
          );
          return of(null);
        }),
      );
  }

  /**
   * Assign current user to a program
   * If user already has the same program, returns existing (idempotent)
   * If user has different program and force=false, returns error
   * If user has different program and force=true, switches programs
   */
  assignMyProgram(
    programId: string,
    options: { startDate?: string; force?: boolean } = {},
  ): Observable<ProgramAssignment | null> {
    const body: AssignProgramRequest = {
      program_id: programId,
      status: "active",
    };

    if (options.startDate) {
      body.start_date = options.startDate;
    }

    if (options.force) {
      body.force = true;
    }

    this.logger.info(
      `[PlayerProgramService] Assigning program ${programId} with options:`,
      options,
    );

    return this.http
      .post<AssignmentResponse>(this.baseUrl, body, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.success && response.data?.assignment) {
            this.logger.info(
              `[PlayerProgramService] ✅ Assigned program: ${response.data.assignment.program.name}`,
            );
            return response.data.assignment;
          }
          this.logger.warn(
            "[PlayerProgramService] API response missing assignment data",
            response,
          );
          return null;
        }),
        catchError((error) => {
          // Enhanced error logging with all available details
          this.logger.error(
            "[PlayerProgramService] ❌ Error assigning program:",
            {
              programId: programId,
              options: options,
              error: error,
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              errorResponse: error.error,
              url: error.url,
            },
          );
          
          // Return null instead of throwing to prevent blocking
          return of(null);
        }),
      );
  }

  /**
   * Convenience method: Assign program based on position
   */
  assignProgramForPosition(
    position: string,
    options: { startDate?: string; force?: boolean } = {},
  ): Observable<ProgramAssignment | null> {
    const programId = getProgramIdForPosition(position);
    this.logger.info(
      `[PlayerProgramService] Position "${position}" maps to program: ${programId}`,
    );
    return this.assignMyProgram(programId, options);
  }

  /**
   * Switch to a different program (force inactivates previous)
   */
  switchProgram(programId: string): Observable<ProgramAssignment | null> {
    return this.assignMyProgram(programId, { force: true });
  }

  /**
   * Update an existing assignment
   */
  updateAssignment(
    assignmentId: string,
    updates: UpdateAssignmentRequest,
  ): Observable<ProgramAssignment | null> {
    return this.http
      .put<AssignmentResponse>(`${this.baseUrl}/${assignmentId}`, updates, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.success && response.data?.assignment) {
            return response.data.assignment;
          }
          return null;
        }),
        catchError((error) => {
          this.logger.error(
            "[PlayerProgramService] Error updating assignment:",
            error,
          );
          return of(null);
        }),
      );
  }

  /**
   * Check if user has an active program assignment
   */
  hasActiveProgram(): Observable<boolean> {
    return this.getMyProgramAssignment().pipe(
      map(
        (assignment) => assignment !== null && assignment.status === "active",
      ),
    );
  }
}
