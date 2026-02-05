import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs";
import { ApiService } from "./api.service";
import { ApiResponse } from "../models/common.models";
import { LoggerService } from "./logger.service";

export interface EquipmentItem {
  id: string;
  team_id: string;
  item_type:
    | "jersey"
    | "shorts"
    | "flags"
    | "belt"
    | "cleats"
    | "ball"
    | "cones"
    | "other";
  name: string;
  description?: string;
  size?: string;
  color?: string;
  quantity_total: number;
  quantity_available: number;
  condition: "new" | "good" | "fair" | "poor" | "needs_replacement";
  purchase_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentAssignment {
  id: string;
  equipment_id: string;
  player_id: string;
  quantity_assigned: number;
  assigned_at: string;
  returned_at?: string;
  condition_at_assignment: EquipmentItem["condition"];
  condition_at_return?: EquipmentItem["condition"];
  notes?: string;
  player_name?: string;
  equipment_name?: string;
  equipment_type?: EquipmentItem["item_type"];
}

export interface EquipmentCheckout {
  player_id: string;
  equipment_id: string;
  quantity: number;
  notes?: string;
}

export interface EquipmentReturn {
  assignment_id: string;
  condition_at_return: EquipmentItem["condition"];
  notes?: string;
}

export interface EquipmentSummary {
  total_items: number;
  total_quantity: number;
  assigned_quantity: number;
  available_quantity: number;
  items_needing_replacement: number;
  by_type: Record<string, { total: number; available: number }>;
}

@Injectable({
  providedIn: "root",
})
export class EquipmentService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  readonly EQUIPMENT_TYPES: Array<{
    value: EquipmentItem["item_type"];
    label: string;
    icon: string;
  }> = [
    { value: "jersey", label: "Jersey", icon: "pi-user" },
    { value: "shorts", label: "Shorts", icon: "pi-user" },
    { value: "flags", label: "Flags", icon: "pi-flag" },
    { value: "belt", label: "Flag Belt", icon: "pi-circle" },
    { value: "cleats", label: "Cleats", icon: "pi-compass" },
    { value: "ball", label: "Football", icon: "pi-circle-fill" },
    { value: "cones", label: "Cones", icon: "pi-exclamation-triangle" },
    { value: "other", label: "Other", icon: "pi-box" },
  ];

  readonly CONDITIONS: Array<{
    value: EquipmentItem["condition"];
    label: string;
    severity: string;
  }> = [
    { value: "new", label: "New", severity: "success" },
    { value: "good", label: "Good", severity: "success" },
    { value: "fair", label: "Fair", severity: "warning" },
    { value: "poor", label: "Poor", severity: "danger" },
    {
      value: "needs_replacement",
      label: "Needs Replacement",
      severity: "danger",
    },
  ];

  /**
   * Get all equipment items for a team
   */
  getTeamEquipment(
    teamId: string,
    options?: {
      itemType?: EquipmentItem["item_type"];
      condition?: EquipmentItem["condition"];
      availableOnly?: boolean;
    },
  ): Observable<EquipmentItem[]> {
    const params: Record<string, unknown> = { team_id: teamId };
    if (options?.itemType) params["item_type"] = options.itemType;
    if (options?.condition) params["condition"] = options.condition;
    if (options?.availableOnly) params["available_only"] = true;

    return this.apiService
      .get<EquipmentItem[]>("/api/equipment/items", params)
      .pipe(
        map((response: ApiResponse<EquipmentItem[]>) => response.data || []),
        catchError((error) => {
          this.logger.error("Failed to fetch equipment:", error);
          return of([]);
        }),
      );
  }

  /**
   * Get a single equipment item
   */
  getEquipmentItem(itemId: string): Observable<EquipmentItem | null> {
    return this.apiService
      .get<EquipmentItem>(`/api/equipment/items/${itemId}`)
      .pipe(
        map((response: ApiResponse<EquipmentItem>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to fetch equipment item:", error);
          return of(null);
        }),
      );
  }

  /**
   * Create a new equipment item
   */
  createEquipmentItem(
    item: Omit<
      EquipmentItem,
      "id" | "quantity_available" | "created_at" | "updated_at"
    >,
  ): Observable<EquipmentItem | null> {
    return this.apiService
      .post<EquipmentItem>("/api/equipment/items", item)
      .pipe(
        map((response: ApiResponse<EquipmentItem>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to create equipment item:", error);
          return of(null);
        }),
      );
  }

  /**
   * Update an equipment item
   */
  updateEquipmentItem(
    itemId: string,
    updates: Partial<
      Omit<EquipmentItem, "id" | "team_id" | "created_at" | "updated_at">
    >,
  ): Observable<EquipmentItem | null> {
    return this.apiService
      .put<EquipmentItem>(`/api/equipment/items/${itemId}`, updates)
      .pipe(
        map((response: ApiResponse<EquipmentItem>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to update equipment item:", error);
          return of(null);
        }),
      );
  }

  /**
   * Delete an equipment item
   */
  deleteEquipmentItem(itemId: string): Observable<boolean> {
    return this.apiService.delete(`/api/equipment/items/${itemId}`).pipe(
      map(() => true),
      catchError((error) => {
        this.logger.error("Failed to delete equipment item:", error);
        return of(false);
      }),
    );
  }

  /**
   * Get all equipment assignments for a team
   */
  getTeamAssignments(
    teamId: string,
    options?: { playerId?: string; activeOnly?: boolean },
  ): Observable<EquipmentAssignment[]> {
    const params: Record<string, unknown> = { team_id: teamId };
    if (options?.playerId) params["player_id"] = options.playerId;
    if (options?.activeOnly) params["active_only"] = true;

    return this.apiService
      .get<EquipmentAssignment[]>("/api/equipment/assignments", params)
      .pipe(
        map(
          (response: ApiResponse<EquipmentAssignment[]>) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch equipment assignments:", error);
          return of([]);
        }),
      );
  }

  /**
   * Get equipment assignments for a specific player
   */
  getPlayerEquipment(playerId: string): Observable<EquipmentAssignment[]> {
    return this.apiService
      .get<
        EquipmentAssignment[]
      >(`/api/equipment/player/${playerId}/assignments`)
      .pipe(
        map(
          (response: ApiResponse<EquipmentAssignment[]>) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch player equipment:", error);
          return of([]);
        }),
      );
  }

  /**
   * Check out equipment to a player
   */
  checkoutEquipment(
    checkout: EquipmentCheckout,
  ): Observable<EquipmentAssignment | null> {
    return this.apiService
      .post<EquipmentAssignment>("/api/equipment/checkout", checkout)
      .pipe(
        map(
          (response: ApiResponse<EquipmentAssignment>) => response.data || null,
        ),
        catchError((error) => {
          this.logger.error("Failed to checkout equipment:", error);
          return of(null);
        }),
      );
  }

  /**
   * Bulk checkout equipment to multiple players
   */
  bulkCheckout(
    equipmentId: string,
    playerIds: string[],
    quantity: number = 1,
  ): Observable<EquipmentAssignment[]> {
    return this.apiService
      .post<EquipmentAssignment[]>("/api/equipment/checkout/bulk", {
        equipment_id: equipmentId,
        player_ids: playerIds,
        quantity,
      })
      .pipe(
        map(
          (response: ApiResponse<EquipmentAssignment[]>) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to bulk checkout equipment:", error);
          return of([]);
        }),
      );
  }

  /**
   * Return equipment from a player
   */
  returnEquipment(
    returnData: EquipmentReturn,
  ): Observable<EquipmentAssignment | null> {
    return this.apiService
      .post<EquipmentAssignment>("/api/equipment/return", returnData)
      .pipe(
        map(
          (response: ApiResponse<EquipmentAssignment>) => response.data || null,
        ),
        catchError((error) => {
          this.logger.error("Failed to return equipment:", error);
          return of(null);
        }),
      );
  }

  /**
   * Get equipment inventory summary for a team
   */
  getEquipmentSummary(teamId: string): Observable<EquipmentSummary | null> {
    return this.apiService
      .get<EquipmentSummary>(`/api/equipment/summary/${teamId}`)
      .pipe(
        map((response: ApiResponse<EquipmentSummary>) => response.data || null),
        catchError((error) => {
          this.logger.error("Failed to fetch equipment summary:", error);
          return of(null);
        }),
      );
  }

  /**
   * Get equipment that needs attention (low stock, needs replacement)
   */
  getEquipmentAlerts(teamId: string): Observable<EquipmentItem[]> {
    return this.apiService
      .get<EquipmentItem[]>(`/api/equipment/alerts/${teamId}`)
      .pipe(
        map((response: ApiResponse<EquipmentItem[]>) => response.data || []),
        catchError((error) => {
          this.logger.error("Failed to fetch equipment alerts:", error);
          return of([]);
        }),
      );
  }

  /**
   * Get assignment history for an equipment item
   */
  getEquipmentHistory(equipmentId: string): Observable<EquipmentAssignment[]> {
    return this.apiService
      .get<EquipmentAssignment[]>(`/api/equipment/items/${equipmentId}/history`)
      .pipe(
        map(
          (response: ApiResponse<EquipmentAssignment[]>) => response.data || [],
        ),
        catchError((error) => {
          this.logger.error("Failed to fetch equipment history:", error);
          return of([]);
        }),
      );
  }
}
