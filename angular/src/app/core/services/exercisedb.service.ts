import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { map, catchError, tap, shareReplay } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";
import { ApiResponse } from "../models/common.models";

/**
 * ExerciseDB Exercise interface
 * Represents an exercise from the ExerciseDB API or our curated database
 */
export interface ExerciseDBExercise {
  id: string;
  external_id: string;
  name: string;
  body_part: string;
  equipment: string;
  target_muscle: string;
  secondary_muscles?: string[];
  gif_url?: string;
  instructions?: string[];

  // Flag Football curation fields
  is_curated?: boolean;
  flag_football_relevance?: number;
  relevance_notes?: string;
  ff_category?: string;
  ff_training_focus?: string[];
  applicable_positions?: string[];

  // Training parameters
  recommended_sets?: number;
  recommended_reps?: string;
  recommended_rest_seconds?: number;
  difficulty_level?: "Beginner" | "Intermediate" | "Advanced" | "Elite";

  // Safety & coaching
  safety_notes?: string[];
  coaching_cues?: string[];
  common_mistakes?: string[];
  progression_tips?: string[];

  // Status
  is_active?: boolean;
  is_approved?: boolean;
  approved_at?: string;

  // Source tracking
  source?: "exercisedb" | "internal";
}

/**
 * Filter options for exercise queries
 */
export interface ExerciseDBFilters {
  categories: string[];
  bodyParts: string[];
  equipment: string[];
  positions: string[];
}

/**
 * Import statistics
 */
export interface ImportStats {
  fetched: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Import log entry
 */
export interface ImportLog {
  id: string;
  import_type: string;
  status: string;
  total_fetched: number;
  total_imported: number;
  total_updated: number;
  total_skipped: number;
  total_errors: number;
  body_parts_filter?: string[];
  equipment_filter?: string[];
  error_message?: string;
  started_at: string;
  completed_at?: string;
  triggered_by?: string;
}

/**
 * Exercise approval data
 */
export interface ExerciseApprovalData {
  flag_football_relevance?: number;
  ff_category?: string;
  ff_training_focus?: string[];
  applicable_positions?: string[];
  difficulty_level?: string;
  recommended_sets?: number;
  recommended_reps?: string;
  recommended_rest_seconds?: number;
  safety_notes?: string[];
  coaching_cues?: string[];
}

// Service-specific response interface (extends canonical ApiResponse)
// This includes ExerciseDB-specific fields like exercises, filters, etc.
interface ExerciseDBApiResponse<T> extends ApiResponse<T> {
  exercises?: T;
  filters?: T;
  logs?: T;
  stats?: ImportStats;
  exercise?: ExerciseDBExercise;
  count?: number;
}

@Injectable({
  providedIn: "root",
})
export class ExerciseDBService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  private baseUrl = this.getApiBaseUrl();

  // Cache for filter options
  private filtersCache$: Observable<ExerciseDBFilters> | null = null;

  // Loading states (Angular 21 signals)
  readonly isLoading = signal<boolean>(false);
  readonly isImporting = signal<boolean>(false);

  // Flag Football Categories for mapping
  readonly FF_CATEGORIES = [
    "Hip Power & Explosiveness",
    "Leg Strength",
    "Posterior Chain",
    "Lateral Movement",
    "Ankle Stability",
    "Core Stability",
    "Rotational Core",
    "Shoulder Stability",
    "Upper Body Power",
    "Pushing Power",
    "Arm Extension",
    "Arm Strength",
    "Conditioning",
    "Mobility",
  ];

  // Positions for flag football
  readonly POSITIONS = ["QB", "WR", "RB", "DB", "Rusher", "Center", "All"];

  // Training focuses
  readonly TRAINING_FOCUSES = [
    "Speed",
    "Agility",
    "Strength",
    "Acceleration",
    "Deceleration",
    "Rotational Power",
    "Throwing",
    "Injury Prevention",
    "Stability",
    "Endurance",
    "Recovery",
    "Flexibility",
    "Position-Specific",
  ];

  private getApiBaseUrl(): string {
    if (environment.apiUrl) {
      return environment.apiUrl;
    }

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (
        hostname.includes("netlify.app") ||
        hostname.includes("netlify.com")
      ) {
        return window.location.origin + "/.netlify/functions";
      }

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:8888/.netlify/functions";
      }
    }

    return "/.netlify/functions";
  }

  /**
   * Get curated exercises from the database
   */
  getCuratedExercises(params?: {
    category?: string;
    position?: string;
    equipment?: string;
    body_part?: string;
    min_relevance?: number;
    approved_only?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<ExerciseDBExercise[]> {
    this.isLoading.set(true);

    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http
      .get<ExerciseDBApiResponse<ExerciseDBExercise[]>>(
        `${this.baseUrl}/api/exercisedb`,
        {
          params: httpParams,
        },
      )
      .pipe(
        map((response) => response.exercises || []),
        tap(() => this.isLoading.set(false)),
        catchError((error) => {
          this.logger.error("Failed to fetch curated exercises", error);
          this.isLoading.set(false);
          throw error;
        }),
      );
  }

  /**
   * Get filter options for the exercise library
   */
  getFilterOptions(): Observable<ExerciseDBFilters> {
    if (!this.filtersCache$) {
      this.filtersCache$ = this.http
        .get<
          ExerciseDBApiResponse<ExerciseDBFilters>
        >(`${this.baseUrl}/api/exercisedb/filters`)
        .pipe(
          map((response) => {
            if (response.filters) return response.filters;
            throw new Error("No filter options available");
          }),
          shareReplay(1),
          catchError((error) => {
            this.logger.error("Failed to fetch filter options", error);
            throw error;
          }),
        );
    }

    return this.filtersCache$;
  }

  /**
   * Search ExerciseDB API directly (for discovery - coach only)
   */
  searchExerciseDB(params: {
    body_part?: string;
    target?: string;
    equipment?: string;
    name?: string;
    limit?: number;
  }): Observable<ExerciseDBExercise[]> {
    this.isLoading.set(true);

    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http
      .get<
        ExerciseDBApiResponse<ExerciseDBExercise[]>
      >(`${this.baseUrl}/api/exercisedb/search`, { params: httpParams })
      .pipe(
        map((response) => response.exercises || []),
        tap(() => this.isLoading.set(false)),
        catchError((error) => {
          this.logger.error("Failed to search ExerciseDB", error);
          this.isLoading.set(false);
          throw error;
        }),
      );
  }

  /**
   * Import exercises from ExerciseDB API (coach only)
   */
  importExercises(params?: {
    body_parts?: string[];
    equipment_filter?: string;
    auto_approve?: boolean;
  }): Observable<{ success: boolean; stats?: ImportStats; error?: string }> {
    this.isImporting.set(true);

    return this.http
      .post<
        ExerciseDBApiResponse<ImportStats>
      >(`${this.baseUrl}/api/exercisedb/import`, params)
      .pipe(
        map((response) => ({
          success: response.success,
          stats: response.stats,
        })),
        tap(() => {
          this.isImporting.set(false);
          // Clear filter cache after import
          this.filtersCache$ = null;
        }),
        catchError((error) => {
          this.logger.error("Failed to import exercises", error);
          this.isImporting.set(false);
          return of({
            success: false,
            error: error.message || "Import failed",
          });
        }),
      );
  }

  /**
   * Approve an exercise for use (coach only)
   */
  approveExercise(
    exerciseId: string,
    approvalData: ExerciseApprovalData,
  ): Observable<{
    success: boolean;
    exercise?: ExerciseDBExercise;
    error?: string;
  }> {
    return this.http
      .post<
        ExerciseDBApiResponse<ExerciseDBExercise>
      >(`${this.baseUrl}/api/exercisedb/approve/${exerciseId}`, approvalData)
      .pipe(
        map((response) => ({
          success: response.success,
          exercise: response.exercise,
        })),
        catchError((error) => {
          this.logger.error("Failed to approve exercise", error);
          return of({
            success: false,
            error: error.message || "Approval failed",
          });
        }),
      );
  }

  /**
   * Get import logs (coach only)
   */
  getImportLogs(): Observable<ImportLog[]> {
    return this.http
      .get<ExerciseDBApiResponse<ImportLog[]>>(`${this.baseUrl}/api/exercisedb/logs`)
      .pipe(
        map((response) => (response.logs as ImportLog[]) || []),
        catchError((error) => {
          this.logger.error("Failed to fetch import logs", error);
          return of([]);
        }),
      );
  }

  /**
   * Get exercises by position
   */
  getExercisesForPosition(position: string): Observable<ExerciseDBExercise[]> {
    return this.getCuratedExercises({
      position,
      approved_only: true,
      min_relevance: 6,
    });
  }

  /**
   * Get exercises by training focus
   */
  getExercisesByCategory(category: string): Observable<ExerciseDBExercise[]> {
    return this.getCuratedExercises({
      category,
      approved_only: true,
    });
  }

  /**
   * Get top recommended exercises for flag football
   */
  getTopRecommendedExercises(limit = 20): Observable<ExerciseDBExercise[]> {
    return this.getCuratedExercises({
      min_relevance: 8,
      approved_only: true,
      limit,
    });
  }

  /**
   * Get exercises by body part
   */
  getExercisesByBodyPart(bodyPart: string): Observable<ExerciseDBExercise[]> {
    return this.getCuratedExercises({
      body_part: bodyPart,
      approved_only: true,
    });
  }

  /**
   * Get exercises by equipment
   */
  getExercisesByEquipment(equipment: string): Observable<ExerciseDBExercise[]> {
    return this.getCuratedExercises({
      equipment,
      approved_only: true,
    });
  }

  /**
   * Clear the filter cache (useful after imports or updates)
   */
  clearCache(): void {
    this.filtersCache$ = null;
  }
}
