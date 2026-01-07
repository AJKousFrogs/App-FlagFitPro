/**
 * Accountability Tracking Service
 * 
 * Tracks accountability for ownership transitions and actions
 * Provides status tracking: Pending → In Progress → Completed
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { OwnershipTransitionService } from "./ownership-transition.service";

export interface AccountabilityItem {
  id: string;
  transitionId: string;
  assignedTo: string; // Role or user ID
  actionRequired: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
}

@Injectable({
  providedIn: "root",
})
export class AccountabilityTrackingService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly ownershipTransitionService = inject(OwnershipTransitionService);

  // State
  private readonly _items = signal<AccountabilityItem[]>([]);
  private readonly _loading = signal(false);

  // Public readonly signals
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed signals
  readonly pendingCount = computed(() =>
    this._items().filter((item) => item.status === "pending").length
  );

  readonly overdueCount = computed(() =>
    this._items().filter((item) => item.status === "overdue").length
  );

  readonly inProgressCount = computed(() =>
    this._items().filter((item) => item.status === "in_progress").length
  );

  /**
   * Load accountability items from ownership transitions
   */
  async loadAccountabilityItems(role: string): Promise<void> {
    this._loading.set(true);
    try {
      const transitions = await this.ownershipTransitionService.getPendingTransitions(role, 50);
      
      // Convert transitions to accountability items
      const items: AccountabilityItem[] = transitions.map((transition) => ({
        id: transition.id || `item_${Date.now()}_${Math.random()}`,
        transitionId: transition.id || "",
        assignedTo: transition.toRole,
        actionRequired: transition.actionRequired,
        status: transition.status,
        completedAt: transition.completedAt,
        notes: undefined,
      }));

      this._items.set(items);
    } catch (error) {
      this.logger.error("[Accountability] Error loading items:", error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update accountability item status
   */
  async updateItemStatus(
    itemId: string,
    status: "pending" | "in_progress" | "completed" | "overdue",
    notes?: string
  ): Promise<boolean> {
    try {
      // Update the underlying ownership transition
      const success = await this.ownershipTransitionService.updateStatus(
        itemId,
        status,
        undefined // acknowledgedBy will be set by the transition service
      );

      if (success) {
        // Update local state
        this._items.update((items) =>
          items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status,
                  notes: notes || item.notes,
                  completedAt: status === "completed" ? new Date() : item.completedAt,
                }
              : item
          )
        );
      }

      return success;
    } catch (error) {
      this.logger.error("[Accountability] Error updating item status:", error);
      return false;
    }
  }

  /**
   * Mark item as in progress
   */
  async markInProgress(itemId: string, _acknowledgedBy: string): Promise<boolean> {
    return this.updateItemStatus(itemId, "in_progress");
  }

  /**
   * Mark item as completed
   */
  async markCompleted(itemId: string, notes?: string): Promise<boolean> {
    return this.updateItemStatus(itemId, "completed", notes);
  }

  /**
   * Get accountability items for a specific player
   */
  async getPlayerAccountabilityItems(playerId: string): Promise<AccountabilityItem[]> {
    try {
      const transitions = await this.ownershipTransitionService.getPlayerTransitions(playerId, 20);
      
      return transitions.map((transition) => ({
        id: transition.id || `item_${Date.now()}_${Math.random()}`,
        transitionId: transition.id || "",
        assignedTo: transition.toRole,
        actionRequired: transition.actionRequired,
        status: transition.status,
        completedAt: transition.completedAt,
        notes: undefined,
      }));
    } catch (error) {
      this.logger.error("[Accountability] Error loading player items:", error);
      return [];
    }
  }
}

