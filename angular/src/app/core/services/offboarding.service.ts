/**
 * Offboarding Service
 * 
 * Handles season end archiving, inactive player detection, account pause,
 * and long-term injury analytics exclusion
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { ToastService } from "./toast.service";
import { TOAST } from "../constants/toast-messages.constants";
import { ApiService } from "./api.service";

export interface Season {
  id: string;
  team_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_archived: boolean;
  archived_at?: string;
}

export interface AccountPause {
  id: string;
  user_id: string;
  paused_at: string;
  paused_until?: string;
  reason?: string;
  acwr_frozen: boolean;
  is_active: boolean;
  resumed_at?: string;
}

export interface PlayerActivity {
  id: string;
  user_id: string;
  team_id: string;
  last_activity_date: string;
  days_inactive: number;
  notification_sent_30d: boolean;
  notification_sent_90d: boolean;
  excluded_from_analytics: boolean;
}

export interface LongTermInjury {
  id: string;
  user_id: string;
  team_id: string;
  injury_id: string;
  injury_start_date: string;
  days_injured: number;
  excluded_from_analytics: boolean;
}

export interface SeasonSummaryReport {
  id: string;
  season_id: string;
  team_id: string;
  report_type: "player" | "coach" | "team";
  user_id?: string;
  report_data: Record<string, unknown>;
  generated_at: string;
}

@Injectable({
  providedIn: "root",
})
export class OffboardingService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private apiService = inject(ApiService);

  // State
  private readonly _seasons = signal<Season[]>([]);
  private readonly _activeSeason = signal<Season | null>(null);
  private readonly _accountPause = signal<AccountPause | null>(null);
  private readonly _inactivePlayers = signal<PlayerActivity[]>([]);
  private readonly _longTermInjuries = signal<LongTermInjury[]>([]);

  // Public readonly signals
  readonly seasons = this._seasons.asReadonly();
  readonly activeSeason = this._activeSeason.asReadonly();
  readonly accountPause = this._accountPause.asReadonly();
  readonly inactivePlayers = this._inactivePlayers.asReadonly();
  readonly longTermInjuries = this._longTermInjuries.asReadonly();

  // Computed signals
  readonly isAccountPaused = computed(() => this._accountPause()?.is_active ?? false);
  readonly isAcwrFrozen = computed(() => this._accountPause()?.acwr_frozen ?? false);
  readonly hasInactivePlayers = computed(() => this._inactivePlayers().length > 0);
  readonly hasLongTermInjuries = computed(() => this._longTermInjuries().length > 0);

  /**
   * Load seasons for current team
   */
  async loadSeasons(teamId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from("seasons")
        .select("*")
        .eq("team_id", teamId)
        .order("start_date", { ascending: false });

      if (error) throw error;

      this._seasons.set(data || []);
      
      // Set active season
      const active = data?.find(s => s.is_active && !s.is_archived);
      this._activeSeason.set(active || null);
    } catch (error) {
      this.logger.error("[Offboarding] Error loading seasons:", error);
      throw error;
    }
  }

  /**
   * Create a new season
   */
  async createSeason(
    teamId: string,
    name: string,
    startDate: string,
    endDate: string
  ): Promise<Season> {
    try {
      const { data, error } = await this.supabase.client
        .from("seasons")
        .insert({
          team_id: teamId,
          name,
          start_date: startDate,
          end_date: endDate,
          is_active: true,
          is_archived: false,
        })
        .select()
        .single();

      if (error) throw error;

      await this.loadSeasons(teamId);
      return data;
    } catch (error) {
      this.logger.error("[Offboarding] Error creating season:", error);
      throw error;
    }
  }

  /**
   * Archive season data
   */
  async archiveSeason(seasonId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.post("/api/season/archive", {
        season_id: seasonId,
      }));

      if (response.error) throw new Error(response.error);

      this.toastService.success(TOAST.SUCCESS.ARCHIVED);
      
      // Reload seasons
      const season = this._seasons().find(s => s.id === seasonId);
      if (season) {
        await this.loadSeasons(season.team_id);
      }
    } catch (error) {
      this.logger.error("[Offboarding] Error archiving season:", error);
      this.toastService.error(TOAST.ERROR.GENERIC);
      throw error;
    }
  }

  /**
   * Generate season summary reports
   */
  async generateSeasonReports(seasonId: string): Promise<SeasonSummaryReport[]> {
    try {
      const response = await firstValueFrom(this.apiService.post<SeasonSummaryReport[]>("/api/season/generate-reports", {
        season_id: seasonId,
      }));

      if (response.error) throw new Error(response.error);

      this.toastService.success(TOAST.SUCCESS.REPORT_GENERATED);
      return response.data || [];
    } catch (error) {
      this.logger.error("[Offboarding] Error generating reports:", error);
      this.toastService.error(TOAST.ERROR.REPORT_FAILED);
      throw error;
    }
  }

  /**
   * Load account pause status
   */
  async loadAccountPause(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from("account_pause_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("paused_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

      this._accountPause.set(data || null);
    } catch (error) {
      this.logger.error("[Offboarding] Error loading account pause:", error);
    }
  }

  /**
   * Pause account
   */
  async pauseAccount(
    userId: string,
    pausedUntil?: string,
    reason?: string
  ): Promise<AccountPause> {
    try {
      const response = await firstValueFrom(this.apiService.post<AccountPause>("/api/account/pause", {
        user_id: userId,
        paused_until: pausedUntil,
        reason,
      }));

      if (response.error) throw new Error(response.error);

      await this.loadAccountPause(userId);
      this.toastService.success(TOAST.SUCCESS.ACCOUNT_PAUSED);
      return response.data as AccountPause;
    } catch (error) {
      this.logger.error("[Offboarding] Error pausing account:", error);
      this.toastService.error(TOAST.ERROR.GENERIC);
      throw error;
    }
  }

  /**
   * Resume account
   */
  async resumeAccount(userId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.post("/api/account/resume", {
        user_id: userId,
      }));

      if (response.error) throw new Error(response.error);

      await this.loadAccountPause(userId);
      this.toastService.success(TOAST.SUCCESS.ACCOUNT_RESUMED);
    } catch (error) {
      this.logger.error("[Offboarding] Error resuming account:", error);
      this.toastService.error(TOAST.ERROR.GENERIC);
      throw error;
    }
  }

  /**
   * Load inactive players for team
   */
  async loadInactivePlayers(teamId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from("player_activity_tracking")
        .select(`
          *,
          user:user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("team_id", teamId)
        .gte("days_inactive", 30)
        .order("days_inactive", { ascending: false });

      if (error) throw error;

      this._inactivePlayers.set(data || []);
    } catch (error) {
      this.logger.error("[Offboarding] Error loading inactive players:", error);
    }
  }

  /**
   * Send notification to inactive player
   */
  async notifyInactivePlayer(userId: string, daysInactive: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.post("/api/player/notify-inactive", {
        user_id: userId,
        days_inactive: daysInactive,
      }));

      if (response.error) throw new Error(response.error);

      this.toastService.success(TOAST.SUCCESS.NOTIFICATION_SENT);
    } catch (error) {
      this.logger.error("[Offboarding] Error notifying inactive player:", error);
      this.toastService.error(TOAST.ERROR.GENERIC);
      throw error;
    }
  }

  /**
   * Load long-term injuries for team
   */
  async loadLongTermInjuries(teamId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from("long_term_injury_tracking")
        .select(`
          *,
          user:user_id (
            id,
            first_name,
            last_name
          ),
          injury:injury_id (
            id,
            injury_type,
            severity
          )
        `)
        .eq("team_id", teamId)
        .eq("excluded_from_analytics", true)
        .order("days_injured", { ascending: false });

      if (error) throw error;

      this._longTermInjuries.set(data || []);
    } catch (error) {
      this.logger.error("[Offboarding] Error loading long-term injuries:", error);
    }
  }

  /**
   * Check if ACWR should be frozen for user
   */
  async checkAcwrFrozen(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.client.rpc("should_freeze_acwr", {
        p_user_id: userId,
      });

      if (error) throw error;

      return data ?? false;
    } catch (error) {
      this.logger.error("[Offboarding] Error checking ACWR freeze status:", error);
      return false;
    }
  }
}

