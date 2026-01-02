import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of, catchError, map } from "rxjs";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { environment } from "../../../environments/environment";

export interface WarmupPhase {
  name: string;
  duration: number;
  exercises: WarmupExercise[];
}

export interface WarmupExercise {
  name: string;
  duration?: string;
  sets?: number;
  reps?: number | string;
  distance?: string;
  focus?: string;
  intensity?: string;
  variations?: string[];
  movements?: string[];
  breakdown?: Array<{ variation: string; duration: string }>;
}

export interface WarmupProtocol {
  title: string;
  totalDuration: number;
  phases: WarmupPhase[];
}

export interface PlyometricExercise {
  id: string;
  exercise_name: string;
  exercise_category: string;
  difficulty_level: string;
  description: string;
  instructions: string[];
  intensity_level: string;
  volume_recommendations: string[];
  rest_periods: string[];
  progression_guidelines: string[];
  safety_notes: string[];
  contraindications: string[];
  proper_form_guidelines: string[];
  common_mistakes: string[];
  applicable_sports: string[];
  equipment_needed: string[];
  effectiveness_rating: number;
  performance_improvements: Record<string, string>;
  injury_risk_rating: string;
  recommended_contacts: number;
  session_sets: number;
  session_reps: number;
}

export interface IsometricExercise {
  id: string;
  name: string;
  description: string;
  category: string;
  muscle_groups: string[];
  protocol_type: string;
  recommended_duration_seconds: number;
  recommended_sets: number;
  rest_period_seconds: number;
  intensity_percentage: number;
  difficulty_level: string;
  equipment_required: string[];
  setup_instructions: string;
  execution_cues: string[];
  safety_notes: string;
  research_studies: string[];
  evidence_level: string;
  lifting_synergy_exercises: string[];
  injury_prevention_benefits: string[];
  session_duration: number;
  session_sets: number;
  rest_between_sets: number;
}

export interface ScheduleBlock {
  block: string;
  duration: number;
  completed: boolean;
  protocol?: WarmupProtocol;
  exercises?: PlyometricExercise[] | IsometricExercise[];
  totalContacts?: number;
  totalDuration?: number;
  notes?: string;
  purpose?: string;
  type?: string;
  focus?: string[];
  activities?: string[];
}

export interface TrainingStatus {
  phase: string;
  acwr: number;
  acwrStatus: string;
  recentSessions: number;
}

export interface SeasonalContext {
  month: number;
  season: string;
  primaryFocus: string;
  secondaryFocus?: string;
  outdoorSprintSuitable: boolean;
  coachingNotes?: string;
  injuryPreventionFocus?: string[];
}

export interface PlayerContext {
  position: string;
  experienceLevel: string;
  primaryGoal?: string;
  trainingDaysPerWeek?: number;
  hasGymAccess?: boolean;
  hasOutdoorSpace?: boolean;
  previousInjuries?: string[];
}

export interface TodaysPractice {
  sessionType: string;
  focus: string[];
  totalDuration: number;
  schedule: ScheduleBlock[];
}

export interface DailyTrainingResponse {
  greeting: string;
  date: string;
  dayOfWeek: string;
  seasonalContext?: SeasonalContext;
  trainingStatus: TrainingStatus;
  playerContext?: PlayerContext;
  todaysPractice: TodaysPractice;
  motivationalMessage: string;
}

@Injectable({
  providedIn: "root",
})
export class DailyTrainingService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  private readonly apiUrl = environment.apiUrl || "/.netlify/functions";

  /**
   * Get personalized daily training plan
   */
  getDailyTraining(): Observable<DailyTrainingResponse> {
    const token = this.authService.getToken();

    if (!token) {
      this.logger.error("[DailyTraining] No auth token - real data required");
      throw new Error("Authentication required for real training data");
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });

    return this.http
      .get<DailyTrainingResponse>(`${this.apiUrl}/api/daily-training`, { headers })
      .pipe(
        map((response) => {
          this.logger.info("[DailyTraining] Received training plan from API");
          return response;
        }),
        catchError((error) => {
          this.logger.error(
            "[DailyTraining] API error loading real data",
            error,
          );
          throw error;
        }),
      );
  }

  /**
   * Update training progress (mark blocks as complete)
   */
  updateTrainingProgress(
    updates: Record<string, boolean | number | string>,
  ): Observable<{ success: boolean; message: string }> {
    const token = this.authService.getToken();

    if (!token) {
      this.logger.warn("[DailyTraining] No auth token for update");
      throw new Error("Authentication required");
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });

    return this.http
      .post<{
        success: boolean;
        message: string;
      }>(`${this.apiUrl}/api/daily-training`, updates, { headers })
      .pipe(
        catchError((error) => {
          this.logger.error("[DailyTraining] Error updating progress", error);
          throw error;
        }),
      );
  }

  /**
   * Get plyometric exercises from database
   */
  getPlyometricExercises(
    difficulty?: string,
    limit = 6,
  ): Observable<PlyometricExercise[]> {
    const token = this.authService.getToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const params: Record<string, string> = { limit: limit.toString() };
    if (difficulty) {
      params["difficulty"] = difficulty;
    }

    return this.http
      .get<PlyometricExercise[]>(`${this.apiUrl}/api/plyometrics`, {
        headers,
        params,
      })
      .pipe(
        catchError((error) => {
          this.logger.error("[DailyTraining] Error loading plyometrics", error);
          throw error;
        }),
      );
  }

  /**
   * Get isometric exercises from database
   */
  getIsometricExercises(
    category?: string,
    limit = 6,
  ): Observable<IsometricExercise[]> {
    const token = this.authService.getToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const params: Record<string, string> = { limit: limit.toString() };
    if (category) {
      params["category"] = category;
    }

    return this.http
      .get<IsometricExercise[]>(`${this.apiUrl}/api/isometrics`, {
        headers,
        params,
      })
      .pipe(
        catchError((error) => {
          this.logger.error("[DailyTraining] Error loading isometrics", error);
          throw error;
        }),
      );
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }
}
