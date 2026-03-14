import { Injectable, inject } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";

export interface TournamentNutritionHydrationLog {
  time: string;
  amount: number;
  type: "water" | "electrolyte" | "sports-drink" | "smoothie" | "protein-shake";
}

export interface TournamentNutritionState {
  tournamentName: string;
  games: unknown[];
  nutritionWindows: unknown[];
  hydrationLogs: TournamentNutritionHydrationLog[];
}

@Injectable({
  providedIn: "root",
})
export class TournamentNutritionStateService {
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  async loadTodayState(): Promise<TournamentNutritionState | null> {
    const userId = this.authService.currentUser()?.id;
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
        this.logger.warn("[TournamentNutrition] Failed to load persisted plan", {
          error: planResult.error,
        });
      }

      if (hydrationResult.error && !hydrationErrorMessage.includes("relation")) {
        this.logger.warn(
          "[TournamentNutrition] Failed to load persisted hydration logs",
          {
            error: hydrationResult.error,
          },
        );
      }

      if (!planResult.data && !hydrationResult.data?.length) {
        return null;
      }

      return {
        tournamentName: planResult.data?.tournament_name || "Tournament Day",
        games: Array.isArray(planResult.data?.games) ? planResult.data.games : [],
        nutritionWindows: Array.isArray(planResult.data?.nutrition_windows)
          ? planResult.data.nutrition_windows
          : [],
        hydrationLogs: (hydrationResult.data || []).map((log) => ({
          time: log.log_time?.slice(0, 5) || "00:00",
          amount: log.fluid_ml || 0,
          type:
            (log.fluid_type as TournamentNutritionHydrationLog["type"]) ||
            "water",
        })),
      };
    } catch (error) {
      this.logger.warn("[TournamentNutrition] Persistence unavailable", {
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
    const userId = this.authService.currentUser()?.id;
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
        this.logger.warn("[TournamentNutrition] Failed to persist plan", {
          error,
        });
      }
    } catch (error) {
      this.logger.warn("[TournamentNutrition] Plan persistence unavailable", {
        error,
      });
    }
  }

  async logHydration(log: TournamentNutritionHydrationLog): Promise<void> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      return;
    }

    const date = this.getTodayIsoDate();

    try {
      const { error } = await this.supabaseService.client
        .from("hydration_logs")
        .insert({
          user_id: userId,
          fluid_ml: log.amount,
          fluid_type: log.type,
          log_date: date,
          log_time: `${log.time}:00`,
          context: this.getHydrationContext(date),
          created_at: new Date().toISOString(),
        });

      if (error) {
        this.logger.warn(
          "[TournamentNutrition] Failed to persist hydration log",
          {
            error,
          },
        );
      }
    } catch (error) {
      this.logger.warn(
        "[TournamentNutrition] Hydration persistence unavailable",
        {
          error,
        },
      );
    }
  }

  async clearTodayState(): Promise<void> {
    const userId = this.authService.currentUser()?.id;
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
      this.logger.warn("[TournamentNutrition] Could not clear persisted state", {
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
