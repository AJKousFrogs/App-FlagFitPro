import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService } from "./api.service";
import { ApiResponse } from "../models/common.models";
import { LoggerService } from "./logger.service";

export interface DepthChartTemplate {
  id: string;
  team_id: string;
  name: string;
  chart_type: "offense" | "defense" | "special_teams";
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DepthChartEntry {
  id: string;
  template_id: string;
  position_name: string;
  position_abbreviation: string;
  depth_order: number;
  player_id?: string;
  player_name?: string;
  player_number?: string;
  notes?: string;
  updated_by: string;
  updated_at: string;
}

export interface DepthChartHistory {
  id: string;
  template_id: string;
  position_name: string;
  old_player_id?: string;
  new_player_id?: string;
  old_depth_order?: number;
  new_depth_order?: number;
  change_reason?: string;
  changed_by: string;
  changed_at: string;
  old_player_name?: string;
  new_player_name?: string;
}

export interface PlayerPositionPreference {
  id: string;
  player_id: string;
  position_name: string;
  preference_order: number;
  coach_assessment?: "primary" | "secondary" | "developmental";
  notes?: string;
}

export interface DepthChartWithEntries extends DepthChartTemplate {
  entries: DepthChartEntry[];
}

export interface CreateDepthChartPayload {
  team_id: string;
  name: string;
  chart_type: DepthChartTemplate["chart_type"];
  positions?: Array<{
    position_name: string;
    position_abbreviation: string;
  }>;
}

export interface UpdateEntryPayload {
  player_id?: string | null;
  depth_order?: number;
  notes?: string;
  change_reason?: string;
}

@Injectable({
  providedIn: "root",
})
export class DepthChartService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // Standard flag football positions
  readonly FLAG_FOOTBALL_POSITIONS = {
    offense: [
      { name: "Quarterback", abbreviation: "QB" },
      { name: "Center", abbreviation: "C" },
      { name: "Wide Receiver 1", abbreviation: "WR1" },
      { name: "Wide Receiver 2", abbreviation: "WR2" },
      { name: "Wide Receiver 3", abbreviation: "WR3" },
      { name: "Running Back", abbreviation: "RB" },
    ],
    defense: [
      { name: "Rusher", abbreviation: "R" },
      { name: "Safety", abbreviation: "S" },
      { name: "Cornerback 1", abbreviation: "CB1" },
      { name: "Cornerback 2", abbreviation: "CB2" },
      { name: "Linebacker", abbreviation: "LB" },
    ],
    special_teams: [
      { name: "Punt Returner", abbreviation: "PR" },
      { name: "Kick Returner", abbreviation: "KR" },
    ],
  };

  /**
   * Get all depth chart templates for a team
   */
  getTeamDepthCharts(teamId: string): Observable<DepthChartTemplate[]> {
    return this.apiService
      .get<DepthChartTemplate[]>("/api/depth-chart/templates", {
        team_id: teamId,
      })
      .pipe(
        map(
          (response: ApiResponse<DepthChartTemplate[]>) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch depth charts:", error);
          return of([]);
        }),
      );
  }

  /**
   * Get a depth chart with all its entries
   */
  getDepthChartWithEntries(
    templateId: string,
  ): Observable<DepthChartWithEntries | null> {
    return this.apiService
      .get<DepthChartWithEntries>(`/api/depth-chart/templates/${templateId}`)
      .pipe(
        map(
          (response: ApiResponse<DepthChartWithEntries>) =>
            response.data || null,
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch depth chart:", error);
          return of(null);
        }),
      );
  }

  /**
   * Create a new depth chart template
   */
  createDepthChart(
    payload: CreateDepthChartPayload,
  ): Observable<DepthChartTemplate | null> {
    // Add default positions if not provided
    const positionsToCreate =
      payload.positions ||
      this.FLAG_FOOTBALL_POSITIONS[payload.chart_type]?.map((p) => ({
        position_name: p.name,
        position_abbreviation: p.abbreviation,
      })) ||
      [];

    return this.apiService
      .post<DepthChartTemplate>("/api/depth-chart/templates", {
        ...payload,
        positions: positionsToCreate,
      })
      .pipe(
        map(
          (response: ApiResponse<DepthChartTemplate>) => response.data || null,
        ),
        catchError((error) => {
          this.logger.error("Failed to create depth chart:", error);
          return of(null);
        }),
      );
  }

  /**
   * Update a depth chart template
   */
  updateDepthChart(
    templateId: string,
    updates: Partial<Pick<DepthChartTemplate, "name" | "is_active">>,
  ): Observable<DepthChartTemplate | null> {
    return this.apiService
      .put<DepthChartTemplate>(
        `/api/depth-chart/templates/${templateId}`,
        updates,
      )
      .pipe(
        map(
          (response: ApiResponse<DepthChartTemplate>) => response.data || null,
        ),
        catchError((error) => {
          this.logger.error("Failed to update depth chart:", error);
          return of(null);
        }),
      );
  }

  /**
   * Delete a depth chart template
   */
  deleteDepthChart(templateId: string): Observable<boolean> {
    return this.apiService
      .delete(`/api/depth-chart/templates/${templateId}`)
      .pipe(
        map(() => true),
        catchError((error) => {
          this.logger.error("Failed to delete depth chart:", error);
          return of(false);
        }),
      );
  }

  /**
   * Update a single depth chart entry (assign player, change depth order)
   */
  updateEntry(
    entryId: string,
    updates: UpdateEntryPayload,
  ): Observable<DepthChartEntry | null> {
    return this.apiService
      .put<DepthChartEntry>(`/api/depth-chart/entries/${entryId}`, updates)
      .pipe(
        map((response: ApiResponse<DepthChartEntry>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to update depth chart entry:", error);
          return of(null);
        }),
      );
  }

  /**
   * Swap two players' positions in the depth chart
   */
  swapPositions(
    entryId1: string,
    entryId2: string,
    reason?: string,
  ): Observable<boolean> {
    return this.apiService
      .post("/api/depth-chart/entries/swap", {
        entry_id_1: entryId1,
        entry_id_2: entryId2,
        change_reason: reason,
      })
      .pipe(
        map(() => true),
        catchError((error) => {
          this.logger.error("Failed to swap positions:", error);
          return of(false);
        }),
      );
  }

  /**
   * Add a new position to a depth chart
   */
  addPosition(
    templateId: string,
    positionName: string,
    abbreviation: string,
  ): Observable<DepthChartEntry | null> {
    return this.apiService
      .post<DepthChartEntry>("/api/depth-chart/entries", {
        template_id: templateId,
        position_name: positionName,
        position_abbreviation: abbreviation,
        depth_order: 1,
      })
      .pipe(
        map((response: ApiResponse<DepthChartEntry>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to add position:", error);
          return of(null);
        }),
      );
  }

  /**
   * Get depth chart change history
   */
  getDepthChartHistory(
    templateId: string,
    options?: { limit?: number; startDate?: string; endDate?: string },
  ): Observable<DepthChartHistory[]> {
    return this.apiService
      .get<DepthChartHistory[]>(
        `/api/depth-chart/templates/${templateId}/history`,
        {
          limit: options?.limit,
          start_date: options?.startDate,
          end_date: options?.endDate,
        },
      )
      .pipe(
        map(
          (response: ApiResponse<DepthChartHistory[]>) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch depth chart history:", error);
          return of([]);
        }),
      );
  }

  /**
   * Get player position preferences
   */
  getPlayerPositionPreferences(
    playerId: string,
  ): Observable<PlayerPositionPreference[]> {
    return this.apiService
      .get<
        PlayerPositionPreference[]
      >(`/api/depth-chart/player/${playerId}/preferences`)
      .pipe(
        map(
          (response: ApiResponse<PlayerPositionPreference[]>) =>
            response.data || [],
        ),
        catchError((error) => {
          this.logger.error(
            "Failed to fetch player position preferences:",
            error,
          );
          return of([]);
        }),
      );
  }

  /**
   * Update player position preferences (coach assessment)
   */
  updatePlayerPositionPreference(
    preferenceId: string,
    updates: Partial<
      Pick<PlayerPositionPreference, "coach_assessment" | "notes">
    >,
  ): Observable<PlayerPositionPreference | null> {
    return this.apiService
      .put<PlayerPositionPreference>(
        `/api/depth-chart/preferences/${preferenceId}`,
        updates,
      )
      .pipe(
        map(
          (response: ApiResponse<PlayerPositionPreference>) =>
            response.data || null,
        ),
        catchError((error) => {
          this.logger.error(
            "Failed to update player position preference:",
            error,
          );
          return of(null);
        }),
      );
  }

  /**
   * Get all unassigned players for a team (players not in any depth chart position)
   */
  getUnassignedPlayers(
    teamId: string,
    templateId: string,
  ): Observable<Array<{ id: string; name: string; number?: string }>> {
    return this.apiService
      .get<
        Array<{ id: string; name: string; number?: string }>
      >(`/api/depth-chart/templates/${templateId}/unassigned`, { team_id: teamId })
      .pipe(
        map(
          (
            response: ApiResponse<
              Array<{ id: string; name: string; number?: string }>
            >,
          ) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch unassigned players:", error);
          return of([]);
        }),
      );
  }

  /**
   * Initialize default depth charts for a new team
   */
  initializeTeamDepthCharts(teamId: string): Observable<DepthChartTemplate[]> {
    return this.apiService
      .post<DepthChartTemplate[]>("/api/depth-chart/initialize", {
        team_id: teamId,
      })
      .pipe(
        map(
          (response: ApiResponse<DepthChartTemplate[]>) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to initialize depth charts:", error);
          return of([]);
        }),
      );
  }
}
