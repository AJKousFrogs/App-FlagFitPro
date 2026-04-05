import { Injectable, inject } from "@angular/core";
import { LoggerService } from "../../../core/services/logger.service";
import { RealtimeService } from "../../../core/services/realtime.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";

export interface TournamentNutritionHydrationLog {
  time: string;
  amount: number;
  type:
    | "water"
    | "electrolyte"
    | "sports-drink"
    | "smoothie"
    | "protein-shake"
    | "coconut";
}

export interface TournamentNutritionState {
  tournamentName: string;
  games: unknown[];
  nutritionWindows: unknown[];
  hydrationLogs: TournamentNutritionHydrationLog[];
}

interface TournamentDayPlanRow extends Record<string, unknown> {
  tournament_date?: string | null;
  tournament_name: string | null;
  games: unknown[] | null;
  nutrition_windows: unknown[] | null;
}

interface HydrationLogRow extends Record<string, unknown> {
  fluid_ml: number | null;
  fluid_type: TournamentNutritionHydrationLog["type"] | null;
  log_time: string | null;
  log_date?: string | null;
  context?: string | null;
}

@Injectable({
  providedIn: "root",
})
export class TournamentNutritionStateService {
  private readonly realtimeService = inject(RealtimeService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  async loadTodayState(): Promise<TournamentNutritionState | null> {
    const userId = this.supabaseService.userId();
    if (!userId) {
      return null;
    }

    const date = this.getTodayIsoDate();

    try {
      const [planResult, hydrationResult] = await Promise.all([
        this.supabaseService.client
          .from("tournament_day_plans")
          .select("tournament_name, games, nutrition_windows")
          .eq("user_id", userId)
          .eq("tournament_date", date)
          .maybeSingle(),
        this.supabaseService.client
          .from("hydration_logs")
          .select("fluid_ml, fluid_type, log_time")
          .eq("user_id", userId)
          .eq("log_date", date)
          .eq("context", this.getHydrationContext(date))
          .order("log_time", { ascending: true }),
      ]);

      const planErrorMessage = String(planResult.error?.message || "");
      const hydrationErrorMessage = String(hydrationResult.error?.message || "");

      if (planResult.error && !planErrorMessage.includes("relation")) {
        this.logger.warn("tournament_nutrition_persist_load_failed", {
          error: planResult.error,
        });
      }

      if (hydrationResult.error && !hydrationErrorMessage.includes("relation")) {
        this.logger.warn(
          "tournament_nutrition_hydration_persist_load_failed",
          {
            error: hydrationResult.error,
          },
        );
      }

      if (!planResult.data && !hydrationResult.data?.length) {
        return null;
      }

      const hydrationLogs = Array.isArray(hydrationResult.data)
        ? (hydrationResult.data as HydrationLogRow[])
        : [];

      return {
        tournamentName: planResult.data?.tournament_name || "Tournament Day",
        games: Array.isArray(planResult.data?.games) ? planResult.data.games : [],
        nutritionWindows: Array.isArray(planResult.data?.nutrition_windows)
          ? planResult.data.nutrition_windows
          : [],
        hydrationLogs: hydrationLogs.map((log) => ({
          time: log.log_time?.slice(0, 5) || "00:00",
          amount: log.fluid_ml || 0,
          type:
            (log.fluid_type as TournamentNutritionHydrationLog["type"]) ||
            "water",
        })),
      };
    } catch (error) {
      this.logger.warn("tournament_nutrition_persistence_unavailable", {
        error,
      });
      return null;
    }
  }

  async savePlan(input: {
    tournamentName: string;
    games: unknown[];
    nutritionWindows: unknown[];
  }): Promise<void> {
    const userId = this.supabaseService.userId();
    if (!userId) {
      return;
    }

    const date = this.getTodayIsoDate();
    const membership = await this.teamMembershipService.loadMembership();

    try {
      const { error } = await this.supabaseService.client
        .from("tournament_day_plans")
        .upsert(
          {
            user_id: userId,
            team_id: membership?.teamId || null,
            tournament_date: date,
            tournament_name: input.tournamentName,
            games: input.games,
            nutrition_windows: input.nutritionWindows,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,tournament_date",
          },
        );

      if (error) {
        this.logger.warn("tournament_nutrition_persist_save_failed", {
          error,
        });
      }
    } catch (error) {
      this.logger.warn("tournament_nutrition_plan_persist_unavailable", {
        error,
      });
    }
  }

  async logHydration(log: TournamentNutritionHydrationLog): Promise<void> {
    const userId = this.supabaseService.userId();
    if (!userId) {
      return;
    }

    const date = this.getTodayIsoDate();
    const membership = await this.teamMembershipService.loadMembership();

    try {
      const { error } = await this.supabaseService.client
        .from("hydration_logs")
        .insert({
          user_id: userId,
          team_id: membership?.teamId || null,
          fluid_ml: log.amount,
          fluid_type: log.type,
          log_date: date,
          log_time: `${log.time}:00`,
          context: this.getHydrationContext(date),
          created_at: new Date().toISOString(),
        });

      if (error) {
        this.logger.warn(
          "tournament_nutrition_hydration_log_persist_failed",
          {
            error,
          },
        );
      }
    } catch (error) {
      this.logger.warn(
        "tournament_nutrition_hydration_persistence_unavailable",
        {
          error,
        },
      );
    }
  }

  subscribeToTodayState(onChange: () => void): (() => void) | null {
    const userId = this.supabaseService.userId();
    if (!userId) {
      return null;
    }

    const date = this.getTodayIsoDate();
    const context = this.getHydrationContext(date);

    const unsubscribePlan = this.realtimeService.subscribe<TournamentDayPlanRow>(
      "tournament_day_plans",
      `user_id=eq.${userId}`,
      {
        onInsert: (event) => {
          if (event.new?.tournament_date === date) {
            onChange();
          }
        },
        onUpdate: (event) => {
          if (event.new?.tournament_date === date) {
            onChange();
          }
        },
        onDelete: () => {
          onChange();
        },
      },
    );

    const unsubscribeHydration = this.realtimeService.subscribe<HydrationLogRow>(
      "hydration_logs",
      `user_id=eq.${userId}`,
      {
        onInsert: (event) => {
          if (event.new?.log_date === date && event.new?.context === context) {
            onChange();
          }
        },
        onUpdate: (event) => {
          if (event.new?.log_date === date && event.new?.context === context) {
            onChange();
          }
        },
        onDelete: () => {
          onChange();
        },
      },
    );

    return () => {
      unsubscribePlan();
      unsubscribeHydration();
    };
  }

  async clearTodayState(): Promise<void> {
    const userId = this.supabaseService.userId();
    if (!userId) {
      return;
    }

    const date = this.getTodayIsoDate();

    try {
      await Promise.all([
        this.supabaseService.client
          .from("tournament_day_plans")
          .delete()
          .eq("user_id", userId)
          .eq("tournament_date", date),
        this.supabaseService.client
          .from("hydration_logs")
          .delete()
          .eq("user_id", userId)
          .eq("log_date", date)
          .eq("context", this.getHydrationContext(date)),
      ]);
    } catch (error) {
      this.logger.warn("tournament_nutrition_persist_clear_failed", {
        error,
      });
    }
  }

  private getTodayIsoDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  private getHydrationContext(date: string): string {
    return `tournament-nutrition:${date}`;
  }
}
