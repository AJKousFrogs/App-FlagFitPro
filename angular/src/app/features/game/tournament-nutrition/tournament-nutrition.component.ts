/**
 * Tournament Nutrition Component
 *
 * Critical feature for multi-game tournament days.
 * Provides personalized nutrition and hydration timing based on game schedule.
 *
 * Key features:
 * - Pre-game fueling recommendations
 * - Halftime nutrition guidance
 * - Between-game recovery nutrition
 * - Hydration tracking with reminders
 * - Cramp prevention protocols
 * - Referee duty considerations
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

// PrimeNG Components

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";

import { ProgressBar } from "primeng/progressbar";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

// App Components & Services
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { NutritionService } from "../../../core/services/nutrition.service";
import { ToastService } from "../../../core/services/toast.service";
import { DialogService } from "../../../core/ui/dialog.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

interface GameSchedule {
  id: string;
  time: string; // HH:MM format
  opponent?: string;
  isReferee?: boolean;
  completed?: boolean;
}

interface NutritionWindow {
  id: string;
  type:
    | "pre-game"
    | "halftime"
    | "post-game"
    | "between-games"
    | "referee-duty"
    | "morning";
  startTime: string;
  endTime: string;
  title: string;
  priority: "critical" | "high" | "medium";
  recommendations: NutritionRecommendation[];
  hydrationTarget: number; // ml
  completed?: boolean;
  relatedGameId?: string;
}

interface NutritionRecommendation {
  category: "food" | "drink" | "supplement" | "action";
  item: string;
  amount?: string;
  timing?: string;
  reason: string;
  icon: string;
  alternatives?: string[];
}

interface HydrationLog {
  time: string;
  amount: number; // ml
  type: "water" | "electrolyte" | "sports-drink" | "smoothie" | "protein-shake";
}

@Component({
  selector: "app-tournament-nutrition",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Checkbox,
    StatusTagComponent,
    Tooltip,
    ProgressBar,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyStateComponent,
  ],
  styleUrl: "./tournament-nutrition.component.scss",
  templateUrl: "./tournament-nutrition.component.html",
})
export class TournamentNutritionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private nutritionService = inject(NutritionService);
  private dialogService = inject(DialogService);

  // State
  games = signal<GameSchedule[]>([]);
  nutritionWindows = signal<NutritionWindow[]>([]);
  hydrationLogs = signal<HydrationLog[]>([]);
  tournamentName = signal("Tournament Day");
  showScheduleEditor = false;

  readonly openScheduleEditorHandler = (): void => {
    this.showScheduleEditor = true;
  };
  selectedHydration: string | null = null;
  expandedWindows = new Set<string>(); // Track which windows are expanded

  // Edit state
  editGames: GameSchedule[] = [];
  editTournamentName = "Tournament Day";

  // Hydration options
  hydrationOptions = [
    {
      type: "water",
      label: "Water",
      amount: 250,
      icon: "💧",
      tooltip: "Plain water",
    },
    {
      type: "electrolyte",
      label: "Electrolyte",
      amount: 500,
      icon: "⚡",
      tooltip: "Electrolyte drink",
    },
    {
      type: "sports-drink",
      label: "Sports Drink",
      amount: 350,
      icon: "🥤",
      tooltip: "Gatorade, Powerade, etc.",
    },
    {
      type: "smoothie",
      label: "Smoothie",
      amount: 400,
      icon: "🥤",
      tooltip: "Fruit smoothie",
    },
    {
      type: "protein-shake",
      label: "Protein Shake",
      amount: 300,
      icon: "🥛",
      tooltip: "Protein shake",
    },
    {
      type: "coconut",
      label: "Coconut Water",
      amount: 330,
      icon: "🥥",
      tooltip: "Natural electrolytes",
    },
  ];

  // Evidence-based supplements for game day
  gameDaySupplements = [
    {
      name: "Creatine Monohydrate",
      dose: "3-5g",
      timing: "Any time (daily)",
      icon: "💪",
      category: "performance",
      evidence: "Strong",
      reason:
        "Improves high-intensity performance, power output, and recovery between sprints",
      notes: "Take daily - timing doesn't matter. Stay hydrated.",
    },
    {
      name: "Beta-Alanine",
      dose: "3-6g",
      timing: "Split doses throughout day",
      icon: "⚡",
      category: "endurance",
      evidence: "Strong",
      reason:
        "Buffers lactic acid, delays fatigue in repeated sprints and high-intensity efforts",
      notes: "May cause tingling (harmless). Split dose to reduce.",
    },
    {
      name: "Caffeine",
      dose: "3-6mg/kg bodyweight",
      timing: "30-60 min before game",
      icon: "☕",
      category: "performance",
      evidence: "Strong",
      reason: "Enhances alertness, reaction time, and reduces perceived effort",
      notes: "Don't exceed 400mg/day. Avoid if sensitive or late games.",
    },
    {
      name: "Magnesium",
      dose: "200-400mg",
      timing: "With breakfast & evening",
      icon: "🧲",
      category: "recovery",
      evidence: "Strong",
      reason:
        "Prevents cramps, supports muscle function, improves sleep quality",
      notes: "Glycinate or citrate forms best absorbed. Essential on hot days.",
    },
    {
      name: "Iron",
      dose: "18-27mg (if deficient)",
      timing: "With vitamin C, away from calcium",
      icon: "🩸",
      category: "endurance",
      evidence: "Conditional",
      reason:
        "Supports oxygen transport - critical for endurance. Test levels first.",
      notes: "Only supplement if blood test shows deficiency. Take with OJ.",
    },
    {
      name: "Vitamin D3",
      dose: "2000-5000 IU",
      timing: "With fatty meal",
      icon: "☀️",
      category: "recovery",
      evidence: "Strong",
      reason: "Muscle function, bone health, immune support, injury prevention",
      notes: "Most athletes are deficient. Get levels tested.",
    },
    {
      name: "Omega-3 (EPA/DHA)",
      dose: "2-3g combined",
      timing: "With meals",
      icon: "🐟",
      category: "recovery",
      evidence: "Strong",
      reason: "Reduces inflammation, supports joint health and recovery",
      notes: "Choose high-quality fish oil. Helps with post-game soreness.",
    },
    {
      name: "Electrolyte Tabs",
      dose: "1-2 tabs per hour of play",
      timing: "Before, during, after games",
      icon: "🧂",
      category: "hydration",
      evidence: "Strong",
      reason:
        "Replaces sodium, potassium, magnesium lost in sweat. Prevents cramps.",
      notes: "Essential in hot weather. More important than plain water.",
    },
  ];

  // Computed values
  dailyHydrationTarget = computed(() => {
    // Base: 3L + 500ml per game
    return 3000 + this.games().length * 500;
  });

  totalHydration = computed(() => {
    return this.hydrationLogs().reduce((sum, log) => sum + log.amount, 0);
  });

  hydrationProgress = computed(() => {
    const target = this.dailyHydrationTarget();
    const current = this.totalHydration();
    return Math.min(100, Math.round((current / target) * 100));
  });

  completedWindows = computed(() => {
    return this.nutritionWindows().filter((w) => w.completed).length;
  });

  tournamentDuration = computed(() => {
    const gameList = this.games();
    if (gameList.length === 0) return "No games scheduled";
    const first = gameList[0].time;
    const last = gameList[gameList.length - 1].time;
    return `${first} - ${last}`;
  });

  nextGameIn = computed(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const game of this.games()) {
      const [hours, minutes] = game.time.split(":").map(Number);
      const gameTime = hours * 60 + minutes;

      if (gameTime > currentTime && !game.completed) {
        const diff = gameTime - currentTime;
        if (diff < 60) return `${diff}min`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
      }
    }
    return "Done!";
  });

  hasRefereeDuty = computed(() => {
    return this.games().some((g) => g.isReferee);
  });

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadSavedSchedule();

    // Auto-refresh every minute to update "next game" countdown
    this.refreshInterval = setInterval(() => {
      // Trigger reactivity
      this.games.update((g) => [...g]);
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private async loadSavedSchedule(): Promise<void> {
    // Try to load from localStorage first (for quick access)
    const saved = localStorage.getItem("tournament_schedule");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.tournamentName.set(data.name || "Tournament Day");
        this.games.set(data.games || []);
        this.editTournamentName = data.name || "Tournament Day";
        this.editGames = [...(data.games || [])];

        if (data.games?.length > 0) {
          this.generateNutritionPlan();
        }
      } catch (_e) {
        this.logger.warn(
          "[TournamentNutrition] Could not parse saved schedule",
        );
      }
    }

    // Load hydration logs for today
    const todayLogs = localStorage.getItem(
      "hydration_logs_" + new Date().toDateString(),
    );
    if (todayLogs) {
      try {
        this.hydrationLogs.set(JSON.parse(todayLogs));
      } catch (_e) {
        // Ignore
      }
    }

    // If no schedule, show empty state - user must create their own schedule
    // No default example games to avoid misleading calculations
  }

  addGame(): void {
    const lastGame = this.editGames[this.editGames.length - 1];
    let nextTime = "09:00";

    if (lastGame) {
      const [hours, minutes] = lastGame.time.split(":").map(Number);
      const nextHours = hours + 2;
      nextTime = `${nextHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    this.editGames.push({
      id: Date.now().toString(),
      time: nextTime,
      opponent: "",
      isReferee: false,
    });
  }

  removeGame(index: number): void {
    this.editGames.splice(index, 1);
  }

  generateNutritionPlan(): void {
    // Sort games by time
    const sortedGames = [...this.editGames].sort((a, b) =>
      a.time.localeCompare(b.time),
    );

    this.games.set(sortedGames);
    this.tournamentName.set(this.editTournamentName);
    this.showScheduleEditor = false;

    // Save to localStorage
    localStorage.setItem(
      "tournament_schedule",
      JSON.stringify({
        name: this.editTournamentName,
        games: sortedGames,
      }),
    );

    // Generate nutrition windows
    const windows: NutritionWindow[] = [];

    // Morning nutrition (if first game is after 7am)
    const firstGameTime = sortedGames[0]?.time;
    if (firstGameTime) {
      const [firstHour] = firstGameTime.split(":").map(Number);

      if (firstHour >= 7) {
        const wakeUpTime = this.subtractMinutes(firstGameTime, 180); // 3 hours before
        windows.push(this.createMorningWindow(wakeUpTime, firstGameTime));
      }
    }

    // Pre-game, halftime, and post-game windows for each game
    sortedGames.forEach((game, index) => {
      const _isLastGame = index === sortedGames.length - 1;
      const nextGame = sortedGames[index + 1];

      // Pre-game (45-60 min before)
      windows.push(this.createPreGameWindow(game, index + 1));

      // Halftime
      windows.push(this.createHalftimeWindow(game, index + 1));

      // Post-game / Between games
      if (nextGame) {
        const timeBetween = this.getMinutesBetween(game.time, nextGame.time);

        if (game.isReferee || nextGame.isReferee) {
          windows.push(this.createRefereeDutyWindow(game, nextGame, index + 1));
        } else if (timeBetween >= 120) {
          windows.push(
            this.createBetweenGamesWindow(
              game,
              nextGame,
              index + 1,
              timeBetween,
            ),
          );
        } else {
          windows.push(
            this.createQuickRecoveryWindow(game, nextGame, index + 1),
          );
        }
      } else {
        // Final post-game recovery
        windows.push(this.createFinalRecoveryWindow(game, index + 1));
      }
    });

    this.nutritionWindows.set(windows);
    this.toastService.success(
      `Nutrition plan generated for ${sortedGames.length} games!`,
    );
  }

  private createMorningWindow(
    wakeTime: string,
    firstGameTime: string,
  ): NutritionWindow {
    return {
      id: "morning",
      type: "morning",
      startTime: wakeTime,
      endTime: this.subtractMinutes(firstGameTime, 90),
      title: "🌅 Tournament Morning Fuel",
      priority: "critical",
      hydrationTarget: 500,
      recommendations: [
        {
          category: "food",
          item: "Complex Carbs Breakfast",
          amount: "300-400 calories",
          timing: "2-3 hours before first game",
          reason: "Slow-release energy for sustained performance",
          icon: "🥣",
          alternatives: [
            "Oatmeal with banana",
            "Whole grain toast with PB",
            "Rice with eggs",
          ],
        },
        {
          category: "drink",
          item: "Water + Electrolytes",
          amount: "500ml",
          timing: "With breakfast",
          reason: "Start hydrated - you'll sweat a lot today",
          icon: "💧",
        },
        {
          category: "food",
          item: "Banana",
          amount: "1 medium",
          timing: "1 hour before game",
          reason: "Quick potassium boost for muscle function",
          icon: "🍌",
        },
        {
          category: "action",
          item: "Light Dynamic Stretching",
          timing: "30 min before game",
          reason: "Activate muscles without depleting energy",
          icon: "🧘",
        },
      ],
    };
  }

  private createPreGameWindow(
    game: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const startTime = this.subtractMinutes(game.time, 45);
    return {
      id: `pre-game-${gameNum}`,
      type: "pre-game",
      startTime,
      endTime: this.subtractMinutes(game.time, 15),
      title: `⚡ Pre-Game ${gameNum}${game.opponent ? ` vs ${game.opponent}` : ""}`,
      priority: "critical",
      hydrationTarget: 300,
      relatedGameId: game.id,
      recommendations: [
        {
          category: "drink",
          item: "Water or Sports Drink",
          amount: "200-300ml",
          timing: "30-45 min before",
          reason: "Final hydration before intense activity",
          icon: "💧",
        },
        {
          category: "food",
          item: "Quick Energy Snack",
          amount: "100-150 calories",
          timing: "30 min before",
          reason: "Fast-absorbing carbs for immediate energy",
          icon: "⚡",
          alternatives: [
            "Energy gel",
            "Rice cake with honey",
            "Half banana",
            "Sports chews",
          ],
        },
        {
          category: "supplement",
          item: "Electrolyte Tab",
          amount: "1 tab in water",
          timing: "30 min before",
          reason: "Pre-load sodium to prevent cramping",
          icon: "🧂",
        },
      ],
    };
  }

  private createHalftimeWindow(
    game: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const halftimeStart = this.addMinutes(game.time, 20); // ~20 min into game
    return {
      id: `halftime-${gameNum}`,
      type: "halftime",
      startTime: halftimeStart,
      endTime: this.addMinutes(halftimeStart, 10),
      title: `Halftime - Game ${gameNum}`,
      priority: "high",
      hydrationTarget: 200,
      relatedGameId: game.id,
      recommendations: [
        {
          category: "drink",
          item: "Electrolyte Drink",
          amount: "150-200ml",
          timing: "Immediately",
          reason: "Replace sweat losses, prevent second-half cramping",
          icon: "⚡",
        },
        {
          category: "food",
          item: "Quick Sugar Hit",
          amount: "50-75 calories",
          reason: "Instant energy for second half push",
          icon: "🍬",
          alternatives: ["Orange slices", "Sports chews", "Honey packet"],
        },
        {
          category: "action",
          item: "Ice Towel on Neck",
          reason: "Cool core temperature, reduce fatigue",
          icon: "🧊",
        },
      ],
    };
  }

  private createBetweenGamesWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number,
    minutesBetween: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45); // ~45 min after game starts (post-game)
    return {
      id: `between-${gameNum}`,
      type: "between-games",
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 45),
      title: `🔄 Recovery Window (${Math.round(minutesBetween / 60)}h gap)`,
      priority: "high",
      hydrationTarget: 600,
      recommendations: [
        {
          category: "drink",
          item: "Protein Shake + Carbs",
          amount: "300ml shake + banana",
          timing: "Within 30 min of game end",
          reason: "Critical recovery window - muscle repair starts now",
          icon: "🥛",
        },
        {
          category: "drink",
          item: "Electrolyte Water",
          amount: "500ml",
          timing: "Sip continuously",
          reason: "Replace all sweat losses before next game",
          icon: "💧",
        },
        {
          category: "food",
          item: "Light Meal",
          amount: "300-400 calories",
          timing: "60-90 min before next game",
          reason: "Refuel glycogen stores without feeling heavy",
          icon: "🍚",
          alternatives: [
            "Rice + chicken",
            "Pasta salad",
            "PB&J sandwich",
            "Smoothie bowl",
          ],
        },
        {
          category: "action",
          item: "Legs Up / Light Stretch",
          timing: "10-15 min",
          reason: "Promote blood flow and recovery",
          icon: "🦵",
        },
      ],
    };
  }

  private createQuickRecoveryWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45);
    return {
      id: `quick-${gameNum}`,
      type: "between-games",
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 20),
      title: `⏱️ Quick Turnaround (Short gap!)`,
      priority: "critical",
      hydrationTarget: 400,
      recommendations: [
        {
          category: "drink",
          item: "Sports Drink",
          amount: "300-400ml",
          timing: "Immediately after game",
          reason: "Fast carbs + electrolytes - no time for solid food",
          icon: "🥤",
        },
        {
          category: "food",
          item: "Energy Gel or Chews",
          amount: "1-2 servings",
          timing: "15 min before next game",
          reason: "Quick energy without digestion burden",
          icon: "⚡",
        },
        {
          category: "action",
          item: "Stay Moving Lightly",
          reason: "Don't sit down - keep blood flowing",
          icon: "🚶",
        },
      ],
    };
  }

  private createRefereeDutyWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45);
    return {
      id: `referee-${gameNum}`,
      type: "referee-duty",
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 30),
      title: `🏁 Referee Duty Period`,
      priority: "high",
      hydrationTarget: 500,
      recommendations: [
        {
          category: "drink",
          item: "Water + Electrolytes",
          amount: "500ml",
          timing: "Sip throughout",
          reason: "You're still active - stay hydrated",
          icon: "💧",
        },
        {
          category: "food",
          item: "Light Snacks Only",
          amount: "100-200 calories",
          reason: "Avoid heavy food while on your feet",
          icon: "🍎",
          alternatives: ["Energy bar", "Trail mix (small)", "Rice cake"],
        },
        {
          category: "action",
          item: "Shade Breaks",
          reason: "Conserve energy for your next game",
          icon: "🌴",
        },
      ],
    };
  }

  private createFinalRecoveryWindow(
    game: GameSchedule,
    _gameNum: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(game.time, 45);
    return {
      id: `final-recovery`,
      type: "post-game",
      startTime,
      endTime: this.addMinutes(startTime, 120),
      title: `Post-Tournament Recovery`,
      priority: "high",
      hydrationTarget: 750,
      recommendations: [
        {
          category: "drink",
          item: "Protein Shake",
          amount: "25-30g protein",
          timing: "Within 30 min",
          reason: "Critical for muscle repair after intense day",
          icon: "🥛",
        },
        {
          category: "drink",
          item: "Chocolate Milk",
          amount: "500ml",
          timing: "Great alternative",
          reason: "Perfect 3:1 carb-to-protein ratio for recovery",
          icon: "🥛",
          alternatives: ["Recovery shake", "Smoothie with protein"],
        },
        {
          category: "food",
          item: "Full Meal",
          amount: "500-700 calories",
          timing: "Within 2 hours",
          reason: "Replenish all energy stores",
          icon: "🍽️",
          alternatives: [
            "Grilled chicken + rice + veggies",
            "Salmon + sweet potato",
            "Pasta with lean protein",
          ],
        },
        {
          category: "action",
          item: "Foam Roll + Stretch",
          timing: "15-20 min",
          reason: "Reduce next-day soreness significantly",
          icon: "🧘",
        },
        {
          category: "supplement",
          item: "Magnesium",
          amount: "200-400mg",
          timing: "Before bed",
          reason: "Muscle relaxation and sleep quality",
          icon: "💊",
        },
      ],
    };
  }

  // Time utility methods
  private subtractMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const totalMins = hours * 60 + mins - minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  }

  private getMinutesBetween(time1: string, time2: string): number {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    return h2 * 60 + m2 - (h1 * 60 + m1);
  }

  isCurrentWindow(window: NutritionWindow): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    return currentTime >= window.startTime && currentTime <= window.endTime;
  }

  logHydration(type: string, amount: number): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const log: HydrationLog = {
      time: timeStr,
      amount,
      type: type as HydrationLog["type"],
    };

    this.hydrationLogs.update((logs) => [...logs, log]);
    this.selectedHydration = type;

    // Save to localStorage
    localStorage.setItem(
      "hydration_logs_" + new Date().toDateString(),
      JSON.stringify(this.hydrationLogs()),
    );

    // Visual feedback
    setTimeout(() => {
      this.selectedHydration = null;
    }, 500);

    this.toastService.success(`+${amount}ml logged! 💧`);
  }

  completeWindow(window: NutritionWindow): void {
    this.nutritionWindows.update((windows) =>
      windows.map((w) => (w.id === window.id ? { ...w, completed: true } : w)),
    );
    // Auto-collapse when completed
    this.expandedWindows.delete(window.id);
    this.toastService.success(TOAST.SUCCESS.WINDOW_COMPLETED);
  }

  toggleWindowExpanded(windowId: string): void {
    if (this.expandedWindows.has(windowId)) {
      this.expandedWindows.delete(windowId);
    } else {
      this.expandedWindows.add(windowId);
    }
  }

  isWindowExpanded(windowId: string): boolean {
    return this.expandedWindows.has(windowId);
  }

  async clearAllData(): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      "Are you sure you want to clear all tournament data? This will remove your schedule, nutrition windows, and hydration logs.",
      "Clear Tournament Data",
    );
    if (!confirmed) return;

    // Clear all data
    this.games.set([]);
    this.nutritionWindows.set([]);
    this.hydrationLogs.set([]);
    this.tournamentName.set("Tournament Day");
    this.editGames = [];
    this.editTournamentName = "Tournament Day";
    this.expandedWindows.clear();

    // Clear localStorage
    localStorage.removeItem("tournament_schedule");
    localStorage.removeItem("hydration_logs_" + new Date().toDateString());

    this.toastService.success("All tournament data cleared successfully!");
  }
}
