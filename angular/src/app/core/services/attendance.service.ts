import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, ApiResponse } from "./api.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";

export interface TeamEvent {
  id: string;
  team_id: string;
  event_type: "practice" | "game" | "meeting" | "film_session" | "conditioning" | "other";
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  is_mandatory: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  player_id: string;
  status: "present" | "absent" | "late" | "excused";
  check_in_time?: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
  player_name?: string;
  player_avatar?: string;
}

export interface PlayerAttendanceStats {
  player_id: string;
  team_id: string;
  total_events: number;
  events_attended: number;
  events_missed: number;
  events_excused: number;
  events_late: number;
  attendance_rate: number;
  current_streak: number;
  last_updated: string;
}

export interface AbsenceRequest {
  id: string;
  player_id: string;
  event_id: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface CreateEventPayload {
  team_id: string;
  event_type: TeamEvent["event_type"];
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  is_mandatory?: boolean;
}

export interface RecordAttendancePayload {
  event_id: string;
  player_id: string;
  status: AttendanceRecord["status"];
  notes?: string;
}

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  /**
   * Get team events with optional filters
   */
  getTeamEvents(
    teamId: string,
    options?: {
      eventType?: TeamEvent["event_type"];
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Observable<TeamEvent[]> {
    const params: Record<string, unknown> = { team_id: teamId };
    if (options?.eventType) params["event_type"] = options.eventType;
    if (options?.startDate) params["start_date"] = options.startDate;
    if (options?.endDate) params["end_date"] = options.endDate;
    if (options?.limit) params["limit"] = options.limit;

    return this.apiService.get<TeamEvent[]>("/api/attendance/events", params).pipe(
      map((response: ApiResponse<TeamEvent[]>) => response.data || []),
      catchError((error) => {
        this.logger.error("Failed to fetch team events:", error);
        return of([]);
      })
    );
  }

  /**
   * Create a new team event (practice, meeting, etc.)
   */
  createEvent(payload: CreateEventPayload): Observable<TeamEvent | null> {
    return this.apiService.post<TeamEvent>("/api/attendance/events", payload).pipe(
      map((response: ApiResponse<TeamEvent>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to create event:", error);
        return of(null);
      })
    );
  }

  /**
   * Update an existing event
   */
  updateEvent(eventId: string, updates: Partial<CreateEventPayload>): Observable<TeamEvent | null> {
    return this.apiService.put<TeamEvent>(`/api/attendance/events/${eventId}`, updates).pipe(
      map((response: ApiResponse<TeamEvent>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to update event:", error);
        return of(null);
      })
    );
  }

  /**
   * Delete an event
   */
  deleteEvent(eventId: string): Observable<boolean> {
    return this.apiService.delete(`/api/attendance/events/${eventId}`).pipe(
      map(() => true),
      catchError((error) => {
        this.logger.error("Failed to delete event:", error);
        return of(false);
      })
    );
  }

  /**
   * Get attendance records for an event
   */
  getEventAttendance(eventId: string): Observable<AttendanceRecord[]> {
    return this.apiService.get<AttendanceRecord[]>(`/api/attendance/events/${eventId}/attendance`).pipe(
      map((response: ApiResponse<AttendanceRecord[]>) => response.data || []),
      catchError((error) => {
        this.logger.error("Failed to fetch event attendance:", error);
        return of([]);
      })
    );
  }

  /**
   * Record attendance for a player at an event
   */
  recordAttendance(payload: RecordAttendancePayload): Observable<AttendanceRecord | null> {
    return this.apiService.post<AttendanceRecord>("/api/attendance/record", payload).pipe(
      map((response: ApiResponse<AttendanceRecord>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to record attendance:", error);
        return of(null);
      })
    );
  }

  /**
   * Bulk record attendance for multiple players
   */
  bulkRecordAttendance(
    eventId: string,
    records: Array<{ player_id: string; status: AttendanceRecord["status"]; notes?: string }>
  ): Observable<AttendanceRecord[]> {
    return this.apiService.post<AttendanceRecord[]>("/api/attendance/record/bulk", {
      event_id: eventId,
      records,
    }).pipe(
      map((response: ApiResponse<AttendanceRecord[]>) => response.data || []),
      catchError((error) => {
        this.logger.error("Failed to bulk record attendance:", error);
        return of([]);
      })
    );
  }

  /**
   * Get attendance statistics for a player
   */
  getPlayerAttendanceStats(playerId: string, teamId: string): Observable<PlayerAttendanceStats | null> {
    return this.apiService.get<PlayerAttendanceStats>(`/api/attendance/stats/player/${playerId}`, {
      team_id: teamId,
    }).pipe(
      map((response: ApiResponse<PlayerAttendanceStats>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to fetch player attendance stats:", error);
        return of(null);
      })
    );
  }

  /**
   * Get attendance statistics for all players in a team
   */
  getTeamAttendanceStats(teamId: string): Observable<PlayerAttendanceStats[]> {
    return this.apiService.get<PlayerAttendanceStats[]>(`/api/attendance/stats/team/${teamId}`).pipe(
      map((response: ApiResponse<PlayerAttendanceStats[]>) => response.data || []),
      catchError((error) => {
        this.logger.error("Failed to fetch team attendance stats:", error);
        return of([]);
      })
    );
  }

  /**
   * Submit an absence request
   */
  submitAbsenceRequest(eventId: string, reason: string): Observable<AbsenceRequest | null> {
    const playerId = this.authService.getUser()?.id;
    if (!playerId) {
      this.logger.warn("No user logged in, cannot submit absence request");
      return of(null);
    }

    return this.apiService.post<AbsenceRequest>("/api/attendance/absence-request", {
      event_id: eventId,
      player_id: playerId,
      reason,
    }).pipe(
      map((response: ApiResponse<AbsenceRequest>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to submit absence request:", error);
        return of(null);
      })
    );
  }

  /**
   * Get pending absence requests for a team (coach view)
   */
  getPendingAbsenceRequests(teamId: string): Observable<AbsenceRequest[]> {
    return this.apiService.get<AbsenceRequest[]>("/api/attendance/absence-requests", {
      team_id: teamId,
      status: "pending",
    }).pipe(
      map((response: ApiResponse<AbsenceRequest[]>) => response.data || []),
      catchError((error) => {
        this.logger.error("Failed to fetch absence requests:", error);
        return of([]);
      })
    );
  }

  /**
   * Review an absence request (approve/deny)
   */
  reviewAbsenceRequest(
    requestId: string,
    status: "approved" | "denied"
  ): Observable<AbsenceRequest | null> {
    return this.apiService.put<AbsenceRequest>(`/api/attendance/absence-request/${requestId}`, {
      status,
    }).pipe(
      map((response: ApiResponse<AbsenceRequest>) => response.data || null),
      catchError((error) => {
        this.logger.error("Failed to review absence request:", error);
        return of(null);
      })
    );
  }

  /**
   * Quick check-in for the current user at an event
   */
  quickCheckIn(eventId: string): Observable<AttendanceRecord | null> {
    const playerId = this.authService.getUser()?.id;
    if (!playerId) {
      this.logger.warn("No user logged in, cannot check in");
      return of(null);
    }

    return this.recordAttendance({
      event_id: eventId,
      player_id: playerId,
      status: "present",
    });
  }
}
