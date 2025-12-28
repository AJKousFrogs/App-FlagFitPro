/**
 * Tournament Mode Service
 *
 * Manages persistent tournament state across the app:
 * - Active tournament tracking
 * - Game-by-game progress
 * - Nutrition/hydration tracking
 * - Recovery between games
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";

export interface TournamentGame {
  id: string;
  gameNumber: number;
  opponent: string;
  scheduledTime: Date;
  status: "upcoming" | "in_progress" | "completed";
  result?: {
    ourScore: number;
    theirScore: number;
    won: boolean;
  };
  notes?: string;
}

export interface NutritionLog {
  timestamp: Date;
  type: "meal" | "snack" | "hydration" | "supplement";
  description: string;
  calories?: number;
  hydrationMl?: number;
}

export interface ActiveTournament {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  totalGames: number;
  currentDay: number;
  totalDays: number;
  games: TournamentGame[];
  nutritionLogs: NutritionLog[];
  hydrationTarget: number; // ml
  hydrationConsumed: number; // ml
  status: "active" | "completed" | "cancelled";
}

export interface TournamentStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  nextGame: TournamentGame | null;
  hoursUntilNextGame: number;
  hydrationProgress: number; // 0-100
  isOnTrack: boolean;
}

@Injectable({
  providedIn: "root",
})
export class TournamentModeService {
  private logger = inject(LoggerService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  // State
  private _activeTournament = signal<ActiveTournament | null>(null);
  private _isLoading = signal(false);

  // Public signals
  readonly activeTournament = this._activeTournament.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed values
  readonly isInTournament = computed(() => !!this._activeTournament());

  readonly tournamentStats = computed<TournamentStats | null>(() => {
    const tournament = this._activeTournament();
    if (!tournament) return null;

    const completedGames = tournament.games.filter(
      (g) => g.status === "completed"
    );
    const wonGames = completedGames.filter((g) => g.result?.won);
    const upcomingGames = tournament.games.filter(
      (g) => g.status === "upcoming"
    );

    const nextGame = upcomingGames.sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    )[0];

    const hoursUntilNextGame = nextGame
      ? Math.max(
          0,
          (nextGame.scheduledTime.getTime() - Date.now()) / (1000 * 60 * 60)
        )
      : 0;

    const hydrationProgress = Math.min(
      100,
      (tournament.hydrationConsumed / tournament.hydrationTarget) * 100
    );

    return {
      gamesPlayed: completedGames.length,
      gamesWon: wonGames.length,
      gamesLost: completedGames.length - wonGames.length,
      nextGame: nextGame || null,
      hoursUntilNextGame,
      hydrationProgress,
      isOnTrack: hydrationProgress >= this.getExpectedHydrationProgress(),
    };
  });

  readonly currentGame = computed(() => {
    const tournament = this._activeTournament();
    if (!tournament) return null;
    return tournament.games.find((g) => g.status === "in_progress") || null;
  });

  readonly nextGame = computed(() => {
    return this.tournamentStats()?.nextGame || null;
  });

  constructor() {
    // Load active tournament on init
    this.loadActiveTournament();
  }

  /**
   * Start a new tournament
   */
  async startTournament(
    tournamentData: Omit<
      ActiveTournament,
      "id" | "status" | "nutritionLogs" | "hydrationConsumed" | "currentDay"
    >
  ): Promise<void> {
    this._isLoading.set(true);

    try {
      const user = this.authService.getUser();
      if (!user) throw new Error("User not authenticated");

      const tournament: ActiveTournament = {
        ...tournamentData,
        id: crypto.randomUUID(),
        status: "active",
        nutritionLogs: [],
        hydrationConsumed: 0,
        currentDay: 1,
      };

      // Save to localStorage for persistence
      this.saveTournamentToStorage(tournament);

      // Also save to Supabase for sync
      await this.saveTournamentToDatabase(tournament);

      this._activeTournament.set(tournament);
      this.logger.info("Tournament started:", tournament.name);
    } catch (error) {
      this.logger.error("Error starting tournament:", error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * End the current tournament
   */
  async endTournament(): Promise<void> {
    const tournament = this._activeTournament();
    if (!tournament) return;

    try {
      tournament.status = "completed";
      this.saveTournamentToStorage(tournament);
      await this.saveTournamentToDatabase(tournament);

      // Clear active tournament
      localStorage.removeItem("active-tournament");
      this._activeTournament.set(null);

      this.logger.info("Tournament ended:", tournament.name);
    } catch (error) {
      this.logger.error("Error ending tournament:", error);
    }
  }

  /**
   * Log a game result
   */
  async logGameResult(
    gameId: string,
    ourScore: number,
    theirScore: number
  ): Promise<void> {
    const tournament = this._activeTournament();
    if (!tournament) return;

    const game = tournament.games.find((g) => g.id === gameId);
    if (!game) return;

    game.status = "completed";
    game.result = {
      ourScore,
      theirScore,
      won: ourScore > theirScore,
    };

    this.saveTournamentToStorage(tournament);
    await this.saveTournamentToDatabase(tournament);

    this._activeTournament.set({ ...tournament });
    this.logger.info("Game result logged:", gameId);
  }

  /**
   * Start a game
   */
  async startGame(gameId: string): Promise<void> {
    const tournament = this._activeTournament();
    if (!tournament) return;

    const game = tournament.games.find((g) => g.id === gameId);
    if (!game) return;

    game.status = "in_progress";

    this.saveTournamentToStorage(tournament);
    this._activeTournament.set({ ...tournament });
  }

  /**
   * Log nutrition/hydration
   */
  logNutrition(log: Omit<NutritionLog, "timestamp">): void {
    const tournament = this._activeTournament();
    if (!tournament) return;

    const entry: NutritionLog = {
      ...log,
      timestamp: new Date(),
    };

    tournament.nutritionLogs.push(entry);

    if (log.hydrationMl) {
      tournament.hydrationConsumed += log.hydrationMl;
    }

    this.saveTournamentToStorage(tournament);
    this._activeTournament.set({ ...tournament });
  }

  /**
   * Quick hydration log
   */
  logHydration(ml: number, description: string = "Water"): void {
    this.logNutrition({
      type: "hydration",
      description,
      hydrationMl: ml,
    });
  }

  /**
   * Get hydration recommendations based on time and games
   */
  getHydrationRecommendation(): {
    target: number;
    consumed: number;
    remaining: number;
    nextIntake: string;
    urgency: "low" | "medium" | "high";
  } {
    const tournament = this._activeTournament();
    if (!tournament) {
      return {
        target: 3000,
        consumed: 0,
        remaining: 3000,
        nextIntake: "Start hydrating",
        urgency: "medium",
      };
    }

    const remaining = tournament.hydrationTarget - tournament.hydrationConsumed;
    const progress = this.getExpectedHydrationProgress();
    const actualProgress =
      (tournament.hydrationConsumed / tournament.hydrationTarget) * 100;

    let urgency: "low" | "medium" | "high" = "low";
    let nextIntake = "Maintain current pace";

    if (actualProgress < progress - 20) {
      urgency = "high";
      nextIntake = `Drink ${Math.round(remaining / 4)}ml now`;
    } else if (actualProgress < progress - 10) {
      urgency = "medium";
      nextIntake = `Drink ${Math.round(remaining / 6)}ml in next 30 min`;
    }

    return {
      target: tournament.hydrationTarget,
      consumed: tournament.hydrationConsumed,
      remaining,
      nextIntake,
      urgency,
    };
  }

  /**
   * Get nutrition suggestions based on next game timing
   */
  getNutritionSuggestion(): {
    phase: "pre-game" | "during" | "post-game" | "recovery";
    suggestion: string;
    foods: string[];
    timing: string;
  } {
    const stats = this.tournamentStats();
    const currentGame = this.currentGame();

    if (currentGame) {
      return {
        phase: "during",
        suggestion: "Focus on hydration and quick energy",
        foods: ["Sports drink", "Banana", "Energy gel"],
        timing: "Between plays / halftime",
      };
    }

    if (!stats?.nextGame) {
      return {
        phase: "recovery",
        suggestion: "Focus on recovery nutrition",
        foods: ["Protein shake", "Complex carbs", "Vegetables"],
        timing: "Within 2 hours",
      };
    }

    const hours = stats.hoursUntilNextGame;

    if (hours <= 1) {
      return {
        phase: "pre-game",
        suggestion: "Light, easily digestible foods only",
        foods: ["Banana", "Toast", "Small protein bar"],
        timing: "30-60 min before game",
      };
    }

    if (hours <= 3) {
      return {
        phase: "pre-game",
        suggestion: "Moderate meal with carbs and protein",
        foods: ["Chicken wrap", "Rice", "Fruit"],
        timing: "1-2 hours before game",
      };
    }

    return {
      phase: "recovery",
      suggestion: "Full recovery meal",
      foods: ["Lean protein", "Complex carbs", "Vegetables", "Healthy fats"],
      timing: "Now - you have time to digest",
    };
  }

  private async loadActiveTournament(): Promise<void> {
    try {
      // First try localStorage for quick load
      const stored = localStorage.getItem("active-tournament");
      if (stored) {
        const tournament = JSON.parse(stored) as ActiveTournament;
        // Convert date strings back to Date objects
        tournament.startDate = new Date(tournament.startDate);
        tournament.endDate = new Date(tournament.endDate);
        tournament.games = tournament.games.map((g) => ({
          ...g,
          scheduledTime: new Date(g.scheduledTime),
        }));
        tournament.nutritionLogs = tournament.nutritionLogs.map((l) => ({
          ...l,
          timestamp: new Date(l.timestamp),
        }));

        if (tournament.status === "active") {
          this._activeTournament.set(tournament);
        }
      }
    } catch (error) {
      this.logger.error("Error loading active tournament:", error);
    }
  }

  private saveTournamentToStorage(tournament: ActiveTournament): void {
    localStorage.setItem("active-tournament", JSON.stringify(tournament));
  }

  private async saveTournamentToDatabase(
    tournament: ActiveTournament
  ): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user) return;

      await this.supabaseService.client.from("tournament_sessions").upsert({
        id: tournament.id,
        user_id: user.id,
        name: tournament.name,
        data: tournament,
        status: tournament.status,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn("Could not save tournament to database:", error);
    }
  }

  private getExpectedHydrationProgress(): number {
    // Calculate expected progress based on time of day
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(6, 0, 0, 0); // Assume tournament day starts at 6 AM
    const endOfDay = new Date(now);
    endOfDay.setHours(22, 0, 0, 0); // Ends at 10 PM

    const totalMinutes =
      (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60);
    const elapsedMinutes = Math.max(
      0,
      (now.getTime() - startOfDay.getTime()) / (1000 * 60)
    );

    return Math.min(100, (elapsedMinutes / totalMinutes) * 100);
  }
}
