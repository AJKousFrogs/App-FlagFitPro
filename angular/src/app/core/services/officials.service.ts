import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, ApiResponse } from "./api.service";
import { LoggerService } from "./logger.service";
import { formatDate } from "../../shared/utils/date.utils";

export interface Official {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  certification_level?: "youth" | "high_school" | "college" | "professional";
  certifications?: string[];
  years_experience?: number;
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GameOfficial {
  id: string;
  game_id: string;
  official_id: string;
  role:
    | "head_referee"
    | "line_judge"
    | "field_judge"
    | "back_judge"
    | "scorekeeper"
    | "timekeeper";
  status: "scheduled" | "confirmed" | "declined" | "no_show";
  payment_amount?: number;
  payment_status?: "pending" | "paid";
  notes?: string;
  created_at: string;
  updated_at: string;
  official_name?: string;
  official_email?: string;
  official_phone?: string;
  game_date?: string;
  game_location?: string;
  team_names?: string;
}

export interface OfficialAvailability {
  id: string;
  official_id: string;
  date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface OfficialScheduleRequest {
  game_id: string;
  official_id: string;
  role: GameOfficial["role"];
  payment_amount?: number;
  notes?: string;
}

@Injectable({
  providedIn: "root",
})
export class OfficialsService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  readonly OFFICIAL_ROLES: Array<{
    value: GameOfficial["role"];
    label: string;
  }> = [
    { value: "head_referee", label: "Head Referee" },
    { value: "line_judge", label: "Line Judge" },
    { value: "field_judge", label: "Field Judge" },
    { value: "back_judge", label: "Back Judge" },
    { value: "scorekeeper", label: "Scorekeeper" },
    { value: "timekeeper", label: "Timekeeper" },
  ];

  readonly CERTIFICATION_LEVELS: Array<{
    value: Official["certification_level"];
    label: string;
  }> = [
    { value: "youth", label: "Youth" },
    { value: "high_school", label: "High School" },
    { value: "college", label: "College" },
    { value: "professional", label: "Professional" },
  ];

  /**
   * Get all officials
   */
  getOfficials(options?: {
    isActive?: boolean;
    certificationLevel?: Official["certification_level"];
  }): Observable<Official[]> {
    const params: Record<string, unknown> = {};
    if (options?.isActive !== undefined) params["is_active"] = options.isActive;
    if (options?.certificationLevel)
      params["certification_level"] = options.certificationLevel;

    return this.apiService.get<Official[]>("/api/officials", params).pipe(
      map((response: ApiResponse<Official[]>) => response.data || []),
      catchError((error) => {
        this.logger.error("Failed to fetch officials:", error);
        return of([]);
      }),
    );
  }

  /**
   * Get a single official by ID
   */
  getOfficial(officialId: string): Observable<Official | null> {
    return this.apiService.get<Official>(`/api/officials/${officialId}`).pipe(
      map((response: ApiResponse<Official>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to fetch official:", error);
        return of(null);
      }),
    );
  }

  /**
   * Create a new official
   */
  createOfficial(
    official: Omit<Official, "id" | "created_by" | "created_at" | "updated_at">,
  ): Observable<Official | null> {
    return this.apiService.post<Official>("/api/officials", official).pipe(
      map((response: ApiResponse<Official>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to create official:", error);
        return of(null);
      }),
    );
  }

  /**
   * Update an official
   */
  updateOfficial(
    officialId: string,
    updates: Partial<
      Omit<Official, "id" | "created_by" | "created_at" | "updated_at">
    >,
  ): Observable<Official | null> {
    return this.apiService
      .put<Official>(`/api/officials/${officialId}`, updates)
      .pipe(
        map((response: ApiResponse<Official>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to update official:", error);
          return of(null);
        }),
      );
  }

  /**
   * Delete an official (soft delete - sets is_active to false)
   */
  deleteOfficial(officialId: string): Observable<boolean> {
    return this.apiService.delete(`/api/officials/${officialId}`).pipe(
      map(() => true),
      catchError((error) => {
        this.logger.error("Failed to delete official:", error);
        return of(false);
      }),
    );
  }

  /**
   * Get officials scheduled for a specific game
   */
  getGameOfficials(gameId: string): Observable<GameOfficial[]> {
    return this.apiService
      .get<GameOfficial[]>(`/api/officials/game/${gameId}`)
      .pipe(
        map((response: ApiResponse<GameOfficial[]>) => response.data || []),
        catchError((error) => {
          this.logger.error("Failed to fetch game officials:", error);
          return of([]);
        }),
      );
  }

  /**
   * Get all games scheduled for an official
   */
  getOfficialGames(
    officialId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      status?: GameOfficial["status"];
    },
  ): Observable<GameOfficial[]> {
    const params: Record<string, unknown> = {};
    if (options?.startDate) params["start_date"] = options.startDate;
    if (options?.endDate) params["end_date"] = options.endDate;
    if (options?.status) params["status"] = options.status;

    return this.apiService
      .get<GameOfficial[]>(`/api/officials/${officialId}/games`, params)
      .pipe(
        map((response: ApiResponse<GameOfficial[]>) => response.data || []),
        catchError((error) => {
          this.logger.error("Failed to fetch official games:", error);
          return of([]);
        }),
      );
  }

  /**
   * Schedule an official for a game
   */
  scheduleOfficial(
    request: OfficialScheduleRequest,
  ): Observable<GameOfficial | null> {
    return this.apiService
      .post<GameOfficial>("/api/officials/schedule", request)
      .pipe(
        map((response: ApiResponse<GameOfficial>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to schedule official:", error);
          return of(null);
        }),
      );
  }

  /**
   * Update a game official assignment
   */
  updateGameOfficial(
    assignmentId: string,
    updates: Partial<
      Pick<
        GameOfficial,
        "role" | "status" | "payment_amount" | "payment_status" | "notes"
      >
    >,
  ): Observable<GameOfficial | null> {
    return this.apiService
      .put<GameOfficial>(`/api/officials/assignments/${assignmentId}`, updates)
      .pipe(
        map((response: ApiResponse<GameOfficial>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to update game official:", error);
          return of(null);
        }),
      );
  }

  /**
   * Remove an official from a game
   */
  removeGameOfficial(assignmentId: string): Observable<boolean> {
    return this.apiService
      .delete(`/api/officials/assignments/${assignmentId}`)
      .pipe(
        map(() => true),
        catchError((error) => {
          this.logger.error("Failed to remove game official:", error);
          return of(false);
        }),
      );
  }

  /**
   * Get official availability for a date range
   */
  getOfficialAvailability(
    officialId: string,
    startDate: string,
    endDate: string,
  ): Observable<OfficialAvailability[]> {
    return this.apiService
      .get<OfficialAvailability[]>(
        `/api/officials/${officialId}/availability`,
        {
          start_date: startDate,
          end_date: endDate,
        },
      )
      .pipe(
        map(
          (response: ApiResponse<OfficialAvailability[]>) =>
            response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch official availability:", error);
          return of([]);
        }),
      );
  }

  /**
   * Set official availability
   */
  setOfficialAvailability(
    officialId: string,
    availability: Omit<OfficialAvailability, "id" | "official_id">,
  ): Observable<OfficialAvailability | null> {
    return this.apiService
      .post<OfficialAvailability>(
        `/api/officials/${officialId}/availability`,
        availability,
      )
      .pipe(
        map(
          (response: ApiResponse<OfficialAvailability>) =>
            response.data || null,
        ),
        catchError((error) => {
          this.logger.error("Failed to set official availability:", error);
          return of(null);
        }),
      );
  }

  /**
   * Get available officials for a specific date/time
   */
  getAvailableOfficials(
    date: string,
    startTime?: string,
    endTime?: string,
  ): Observable<Official[]> {
    const params: Record<string, unknown> = { date };
    if (startTime) params["start_time"] = startTime;
    if (endTime) params["end_time"] = endTime;

    return this.apiService
      .get<Official[]>("/api/officials/available", params)
      .pipe(
        map((response: ApiResponse<Official[]>) => response.data || []),
        catchError((error) => {
          this.logger.error("Failed to fetch available officials:", error);
          return of([]);
        }),
      );
  }

  /**
   * Send notification to official about assignment
   */
  notifyOfficial(assignmentId: string, message?: string): Observable<boolean> {
    return this.apiService
      .post(`/api/officials/assignments/${assignmentId}/notify`, {
        message,
      })
      .pipe(
        map(() => true),
        catchError((error) => {
          this.logger.error("Failed to notify official:", error);
          return of(false);
        }),
      );
  }

  /**
   * Get payment summary for officials
   */
  getPaymentSummary(options?: {
    startDate?: string;
    endDate?: string;
    officialId?: string;
  }): Observable<
    Array<{
      official_id: string;
      official_name: string;
      total_games: number;
      total_payment: number;
      paid: number;
      pending: number;
    }>
  > {
    const params: Record<string, unknown> = {};
    if (options?.startDate) params["start_date"] = options.startDate;
    if (options?.endDate) params["end_date"] = options.endDate;
    if (options?.officialId) params["official_id"] = options.officialId;

    return this.apiService
      .get<
        Array<{
          official_id: string;
          official_name: string;
          total_games: number;
          total_payment: number;
          paid: number;
          pending: number;
        }>
      >("/api/officials/payments/summary", params)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          this.logger.error("Failed to fetch payment summary:", error);
          return of([]);
        }),
      );
  }

  /**
   * Get upcoming games for a team
   */
  getUpcomingGames(
    teamId: string,
  ): Observable<
    Array<{ label: string; value: string; date: string; opponent: string }>
  > {
    interface GameResponse {
      id?: string;
      game_id?: string;
      date?: string;
      game_date?: string;
      opponent?: string;
      opponent_name?: string;
    }
    return this.apiService
      .get<GameResponse[]>(`/api/games`, { teamId, limit: 50 })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data.map((g) => ({
              label: `${formatDate(g.date || g.game_date || new Date(), "P")} vs ${g.opponent || g.opponent_name || "TBD"}`,
              value: g.id || g.game_id || "",
              date: g.date || g.game_date || "",
              opponent: g.opponent || g.opponent_name || "",
            }));
          }
          return [];
        }),
        catchError((error) => {
          this.logger.error("Failed to fetch upcoming games:", error);
          return of([]);
        }),
      );
  }
}
