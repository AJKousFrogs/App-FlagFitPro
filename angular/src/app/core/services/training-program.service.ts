/**
 * Training Program Service
 *
 * Service for fetching structured annual training programs from the database.
 * Provides access to programs, phases, weeks, sessions, and exercises.
 *
 * This is the single source of truth for training program data.
 * Replaces the old JS/JSON files (annual-training-program.js, weekly-schedules.js, etc.)
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface Position {
  id: string;
  name: string;
  display_name: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  position_id: string;
  program_type: string;
  difficulty_level: string;
  duration_weeks: number;
  sessions_per_week: number;
  start_date: string;
  end_date: string;
  is_template: boolean;
  is_active: boolean;
  created_at: string;
  positions?: Position;
  training_phases?: TrainingPhase[];
  movement_patterns?: MovementPattern[];
  warmup_protocols?: WarmupProtocol[];
}

export interface TrainingPhase {
  id: string;
  program_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  phase_order: number;
  focus_areas: string[];
  load_progression: Record<string, string>;
  goals: string[];
  weeks?: TrainingWeek[];
}

export interface TrainingWeek {
  id: string;
  phase_id: string;
  week_number: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  load_percentage: number;
  intensity_level: string;
  focus: string;
  notes: string;
  sessions?: SessionTemplate[];
}

export interface SessionTemplate {
  id: string;
  week_id: string;
  program_id: string;
  day_of_week: number;
  session_name: string;
  session_type: string;
  location: string;
  duration_minutes: number;
  intensity_level: string;
  description: string;
  warm_up_protocol: string;
  cool_down_protocol: string;
  equipment_needed: string[];
  notes: string;
  session_order: number;
  session_exercises?: SessionExercise[];
}

export interface SessionExercise {
  id: string;
  session_template_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_order: number;
  sets: number;
  reps: string;
  duration_seconds: number;
  distance_meters: number;
  load_description: string;
  load_percentage: number;
  rest_seconds: number;
  tempo: string;
  intensity: string;
  notes: string;
  exercises?: Exercise;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  instructions: string[];
  coaching_cues: string[];
  equipment_needed: string[];
  muscle_groups: string[];
  difficulty_level: string;
  video_url: string;
  image_url: string;
}

export interface MovementPattern {
  id: string;
  program_id: string;
  pattern_name: string;
  pattern_type: string;
  description: string;
  frequency_per_week: number;
  drills: Array<{ name: string; reps: string }>;
  weekly_volume_targets: Record<string, string>;
  load_progression: Record<string, string>;
  notes: string;
}

export interface WarmupProtocol {
  id: string;
  program_id: string;
  name: string;
  protocol_type: string;
  duration_minutes: number;
  description: string;
  steps: Array<{
    exercise: string;
    duration?: string;
    reps?: string;
    notes?: string;
  }>;
  equipment_needed: string[];
  notes: string;
}

interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    count: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class TrainingProgramService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // State signals
  readonly programs = signal<TrainingProgram[]>([]);
  readonly currentProgram = signal<TrainingProgram | null>(null);
  readonly currentWeek = signal<TrainingWeek | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly currentPhase = computed(() => {
    const program = this.currentProgram();
    const week = this.currentWeek();
    if (!program || !week || !program.training_phases) return null;
    return program.training_phases.find((p) =>
      p.weeks?.some((w) => w.id === week.id),
    );
  });

  readonly todaysSessions = computed(() => {
    const week = this.currentWeek();
    if (!week || !week.sessions) return [];
    const today = new Date().getDay();
    // Convert Sunday (0) to match our Monday-start week
    const dayOfWeek = today === 0 ? 6 : today - 1;
    return week.sessions.filter((s) => s.day_of_week === dayOfWeek);
  });

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Fetch all training programs
   */
  async fetchPrograms(activeOnly = true): Promise<TrainingProgram[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<TrainingProgram[]>>(
          "/api/training-programs",
          { active_only: activeOnly ? "true" : "false" },
        ),
      );

      const programs = response?.data?.data || response?.data || [];
      this.programs.set(programs as TrainingProgram[]);
      return programs as TrainingProgram[];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch programs";
      this.error.set(message);
      this.logger.error("Error fetching training programs:", err);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch a single program with phases
   */
  async fetchProgram(programId: string): Promise<TrainingProgram | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<TrainingProgram>>(
          "/api/training-programs",
          { id: programId },
        ),
      );

      const program = response?.data?.data || response?.data || null;
      if (program) {
        this.currentProgram.set(program as TrainingProgram);
      }
      return program as TrainingProgram | null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch program";
      this.error.set(message);
      this.logger.error("Error fetching training program:", err);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch full program with all nested data (phases, weeks, sessions, exercises)
   */
  async fetchFullProgram(programId: string): Promise<TrainingProgram | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<TrainingProgram>>(
          "/api/training-programs",
          { id: programId, full: "true" },
        ),
      );

      const program = response?.data?.data || response?.data || null;
      if (program) {
        this.currentProgram.set(program as TrainingProgram);
      }
      return program as TrainingProgram | null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch full program";
      this.error.set(message);
      this.logger.error("Error fetching full training program:", err);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch phases for a program
   */
  async fetchPhases(programId: string): Promise<TrainingPhase[]> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<TrainingPhase[]>>(
          "/api/training-programs/phases",
          { programId },
        ),
      );

      // Handle both nested and direct response formats
      const data = response?.data;
      if (Array.isArray(data)) {
        return data;
      }
      return (data as ApiResponse<TrainingPhase[]>)?.data || [];
    } catch (err) {
      this.logger.error("Error fetching training phases:", err);
      return [];
    }
  }

  /**
   * Fetch weeks for a phase
   */
  async fetchWeeks(phaseId: string): Promise<TrainingWeek[]> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<TrainingWeek[]>>(
          "/api/training-programs/weeks",
          { phaseId },
        ),
      );

      // Handle both nested and direct response formats
      const data = response?.data;
      if (Array.isArray(data)) {
        return data;
      }
      return (data as ApiResponse<TrainingWeek[]>)?.data || [];
    } catch (err) {
      this.logger.error("Error fetching training weeks:", err);
      return [];
    }
  }

  /**
   * Fetch sessions for a week
   */
  async fetchSessions(weekId: string): Promise<SessionTemplate[]> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<SessionTemplate[]>>(
          "/api/training-programs/sessions",
          { weekId },
        ),
      );

      // Handle both nested and direct response formats
      const data = response?.data;
      if (Array.isArray(data)) {
        return data;
      }
      return (data as ApiResponse<SessionTemplate[]>)?.data || [];
    } catch (err) {
      this.logger.error("Error fetching session templates:", err);
      return [];
    }
  }

  /**
   * Fetch exercises for a session
   */
  async fetchExercises(sessionId: string): Promise<SessionExercise[]> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<SessionExercise[]>>(
          "/api/training-programs/exercises",
          { sessionId },
        ),
      );

      // Handle both nested and direct response formats
      const data = response?.data;
      if (Array.isArray(data)) {
        return data;
      }
      return (data as ApiResponse<SessionExercise[]>)?.data || [];
    } catch (err) {
      this.logger.error("Error fetching session exercises:", err);
      return [];
    }
  }

  /**
   * Fetch current week based on today's date
   */
  async fetchCurrentWeek(
    programId: string,
    date?: string,
  ): Promise<TrainingWeek | null> {
    try {
      const params: Record<string, string> = { programId };
      if (date) {
        params["date"] = date;
      }

      const response = await firstValueFrom(
        this.apiService.get<ApiResponse<TrainingWeek>>(
          "/api/training-programs/current-week",
          params,
        ),
      );

      const week = response?.data?.data || response?.data || null;
      if (week) {
        this.currentWeek.set(week as TrainingWeek);
      }
      return week as TrainingWeek | null;
    } catch (err) {
      this.logger.error("Error fetching current week:", err);
      return null;
    }
  }

  /**
   * Get program by position (e.g., "WR/DB", "QB")
   */
  async fetchProgramByPosition(
    positionName: string,
  ): Promise<TrainingProgram | null> {
    const programs = await this.fetchPrograms(true);
    return programs.find((p) => p.positions?.name === positionName) || null;
  }

  /**
   * Get the Ljubljana Frogs WR/DB program (convenience method)
   */
  async fetchLjubljanaFrogsProgram(): Promise<TrainingProgram | null> {
    const programs = await this.fetchPrograms(true);
    const program = programs.find(
      (p) =>
        p.name.toLowerCase().includes("ljubljana frogs") &&
        p.name.toLowerCase().includes("wr/db"),
    );

    if (program) {
      return this.fetchFullProgram(program.id);
    }

    return null;
  }

  /**
   * Get sessions for a specific day of the week
   */
  getSessionsForDay(dayOfWeek: number): SessionTemplate[] {
    const week = this.currentWeek();
    if (!week || !week.sessions) return [];
    return week.sessions.filter((s) => s.day_of_week === dayOfWeek);
  }

  /**
   * Get day name from day number
   */
  getDayName(dayOfWeek: number): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek] || "Unknown";
  }

  /**
   * Clear current program state
   */
  clearProgram(): void {
    this.currentProgram.set(null);
    this.currentWeek.set(null);
    this.error.set(null);
  }
}
