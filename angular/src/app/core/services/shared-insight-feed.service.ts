/**
 * Shared Insight Feed Service
 *
 * Provides role-filtered feed of professional insights from:
 * - Physiotherapist → Coach (injury notes, RTP progress)
 * - Nutritionist → Coach/Player (compliance tracking, meal plans)
 * - Psychologist → Coach (mental fatigue flags, summary-only)
 *
 * Implements write-once, multi-role visibility model
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

export interface SharedInsight {
  id: string;
  insightType:
    | "physio_note"
    | "nutrition_compliance"
    | "psychology_flag"
    | "coach_note";
  fromRole: "physiotherapist" | "nutritionist" | "psychologist" | "coach";
  toRoles: string[]; // Roles that can view this insight
  playerId: string;
  playerName?: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  priority: "low" | "medium" | "high";
  status: "active" | "archived";
}

export interface InsightFilter {
  role?: string;
  playerId?: string;
  insightType?: string[];
  priority?: string[];
}

@Injectable({
  providedIn: "root",
})
export class SharedInsightFeedService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // State
  private readonly _insights = signal<SharedInsight[]>([]);
  private readonly _loading = signal(false);
  private readonly _filter = signal<InsightFilter>({});

  // Public readonly signals
  readonly insights = this._insights.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly filter = this._filter.asReadonly();

  // Computed: Filtered insights based on current role and filter
  readonly filteredInsights = computed(() => {
    const allInsights = this._insights();
    const filter = this._filter();
    const userRole = this.getCurrentUserRole();

    return allInsights.filter((insight) => {
      // Role-based filtering
      if (!insight.toRoles.includes(userRole)) {
        return false;
      }

      // Player filter
      if (filter.playerId && insight.playerId !== filter.playerId) {
        return false;
      }

      // Type filter
      if (
        filter.insightType &&
        !filter.insightType.includes(insight.insightType)
      ) {
        return false;
      }

      // Priority filter
      if (filter.priority && !filter.priority.includes(insight.priority)) {
        return false;
      }

      return insight.status === "active";
    });
  });

  /**
   * Load shared insights for current user's role
   */
  async loadInsights(teamId?: string): Promise<void> {
    this._loading.set(true);
    try {
      const user = this.supabaseService.currentUser();
      if (!user?.id) {
        this._insights.set([]);
        return;
      }

      // Get user's role
      const userRole = this.getCurrentUserRole(user);

      // Query shared insights table
      let query = this.supabaseService.client
        .from("shared_insights")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      // Filter by team if provided
      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map to SharedInsight format and filter by role visibility
      const insights: SharedInsight[] = (data || [])
        .filter((item) => {
          // Check if user's role can view this insight
          const toRoles = item.to_roles || [];
          return toRoles.includes(userRole);
        })
        .map((item) => ({
          id: item.id,
          insightType: item.insight_type,
          fromRole: item.from_role,
          toRoles: item.to_roles || [],
          playerId: item.player_id,
          playerName: item.player_name,
          title: item.title,
          content: item.content,
          metadata: item.metadata || {},
          createdAt: new Date(item.created_at),
          priority: item.priority || "medium",
          status: item.status,
        }));

      this._insights.set(insights);
    } catch (error) {
      this.logger.error("[SharedInsightFeed] Error loading insights:", error);
      this._insights.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new shared insight
   */
  async createInsight(
    insight: Omit<SharedInsight, "id" | "createdAt" | "status">,
  ): Promise<string | null> {
    try {
      const user = this.supabaseService.currentUser();
      if (!user?.id) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await this.supabaseService.client
        .from("shared_insights")
        .insert({
          insight_type: insight.insightType,
          from_role: insight.fromRole,
          to_roles: insight.toRoles,
          player_id: insight.playerId,
          player_name: insight.playerName,
          title: insight.title,
          content: insight.content,
          metadata: insight.metadata || {},
          priority: insight.priority,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      // Reload insights
      await this.loadInsights();

      return data.id;
    } catch (error) {
      this.logger.error("[SharedInsightFeed] Error creating insight:", error);
      return null;
    }
  }

  /**
   * Set filter
   */
  setFilter(filter: InsightFilter): void {
    this._filter.set(filter);
  }

  /**
   * Clear filter
   */
  clearFilter(): void {
    this._filter.set({});
  }

  private getCurrentUserRole(
    user: ReturnType<SupabaseService["currentUser"]> = this.supabaseService.currentUser(),
  ): string {
    const metadata = user?.user_metadata as { role?: string } | undefined;
    return metadata?.role || "player";
  }
}
