import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay, map, catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

interface RecentPerformance {
  type: string;
  date: string;
  score?: number;
  [key: string]: unknown;
}

interface UpcomingGame {
  date: string | Date;
  opponent?: string;
  [key: string]: unknown;
}

interface UserPreferences {
  [key: string]: unknown;
}

interface CommandAction {
  label: string;
  icon: string;
  action: () => void;
}

interface CommandResponse {
  message: string;
  actions?: CommandAction[];
}

interface ContextInsight {
  id: string;
  type: string;
  message: string;
  icon: string;
  priority: "high" | "medium" | "low";
  actions?: CommandAction[];
}

interface AnalysisContext {
  currentExercise?: unknown;
  heartRate?: number;
  timeInSession?: number;
  previousPerformance?: RecentPerformance[];
  environmentalFactors?: unknown;
  userFatigue?: number;
}

export interface TrainingSuggestion {
  id: string;
  title: string;
  description: string;
  formData: {
    sessionType?: string;
    duration?: number;
    equipment?: string[];
    intensity?: string;
    focus?: string[];
  };
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface TrainingSuggestionParams {
  userId: string;
  recentPerformance?: RecentPerformance[];
  upcomingGames?: UpcomingGame[];
  preferences?: UserPreferences;
}

@Injectable({
  providedIn: "root",
})
export class AIService {
  private apiService = inject(ApiService);

  /**
   * Get AI-powered training suggestions based on user history, performance gaps, and goals
   */
  getTrainingSuggestions(
    params: TrainingSuggestionParams,
  ): Observable<TrainingSuggestion[]> {
    // Try API first
    return this.apiService
      .post<
        TrainingSuggestion[]
      >(API_ENDPOINTS.training.suggestions || "/api/training/suggestions", params)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          // Fallback to mock suggestions
          return this.generateMockSuggestions(params);
        }),
        catchError(() => {
          // Fallback to mock suggestions on error
          return of(this.generateMockSuggestions(params));
        }),
      );
  }

  /**
   * Generate mock suggestions based on user context
   */
  private generateMockSuggestions(
    params: TrainingSuggestionParams,
  ): TrainingSuggestion[] {
    const suggestions: TrainingSuggestion[] = [];

    // Analyze recent performance to suggest improvements
    if (params.recentPerformance && params.recentPerformance.length > 0) {
      // Check for speed training gaps
      const hasSpeedTraining = params.recentPerformance.some(
        (p) => p.type === "speed",
      );
      if (!hasSpeedTraining) {
        suggestions.push({
          id: "speed-1",
          title: "Speed & Agility Focus",
          description: "Based on your recent sessions, add speed training",
          formData: {
            sessionType: "speed",
            duration: 45,
            equipment: ["cones", "ladder"],
            intensity: "high",
            focus: ["acceleration", "agility"],
          },
          reason: "You haven't done speed training recently",
          priority: "high",
        });
      }

      // Check for strength training
      const hasStrengthTraining = params.recentPerformance.some(
        (p) => p.type === "strength",
      );
      if (!hasStrengthTraining) {
        suggestions.push({
          id: "strength-1",
          title: "Strength & Power",
          description: "Add strength training to improve power",
          formData: {
            sessionType: "strength",
            duration: 60,
            equipment: ["weights", "resistance_bands"],
            intensity: "medium",
            focus: ["power", "core"],
          },
          reason: "Strength training complements your speed work",
          priority: "medium",
        });
      }
    }

    // Check for upcoming games
    if (params.upcomingGames && params.upcomingGames.length > 0) {
      const nextGame = params.upcomingGames[0];
      const daysUntilGame = this.getDaysUntil(nextGame.date);

      if (daysUntilGame <= 2) {
        suggestions.push({
          id: "recovery-1",
          title: "Pre-Game Recovery",
          description: "Light recovery session before your game",
          formData: {
            sessionType: "recovery",
            duration: 30,
            equipment: [],
            intensity: "low",
            focus: ["mobility", "stretching"],
          },
          reason: `Game in ${daysUntilGame} day(s) - focus on recovery`,
          priority: "high",
        });
      } else if (daysUntilGame <= 5) {
        suggestions.push({
          id: "game-prep-1",
          title: "Game Preparation",
          description: "Game-specific drills and tactics",
          formData: {
            sessionType: "tactical",
            duration: 60,
            equipment: ["football", "cones"],
            intensity: "medium",
            focus: ["tactics", "positioning"],
          },
          reason: `Game in ${daysUntilGame} days - time to prepare`,
          priority: "high",
        });
      }
    }

    // Default suggestions if none generated
    if (suggestions.length === 0) {
      suggestions.push({
        id: "default-1",
        title: "Balanced Training",
        description: "A well-rounded training session",
        formData: {
          sessionType: "mixed",
          duration: 45,
          equipment: ["cones"],
          intensity: "medium",
          focus: ["endurance", "skills"],
        },
        reason: "Maintain your training consistency",
        priority: "medium",
      });
    }

    return suggestions.slice(0, 3); // Return max 3 suggestions
  }

  private getDaysUntil(date: string | Date): number {
    const gameDate = typeof date === "string" ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    gameDate.setHours(0, 0, 0, 0);
    const diffTime = gameDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Process natural language command from voice or text input
   */
  processNaturalCommand(command: string): Observable<CommandResponse> {
    const lowerCommand = command.toLowerCase().trim();

    // Intent detection patterns
    const intents = {
      start: /start|begin|commence/i,
      stop: /stop|end|finish/i,
      log: /log|record|save|track/i,
      show: /show|display|view|see/i,
      stats: /stats|statistics|performance|metrics/i,
      training: /training|workout|exercise|session/i,
      break: /break|rest|pause/i,
      intensity: /intensity|harder|easier|more|less/i,
      help: /help|assist|guide|what can/i,
    };

    // Extract intent
    let detectedIntent = "";
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(lowerCommand)) {
        detectedIntent = intent;
        break;
      }
    }

    // Generate response based on intent
    switch (detectedIntent) {
      case "start":
        if (
          lowerCommand.includes("training") ||
          lowerCommand.includes("workout")
        ) {
          return of({
            message: "Starting your training session. Let's get moving!",
            actions: [
              {
                label: "Begin Session",
                icon: "pi pi-play",
                action: () => {
                  // Start training logic
                },
              },
            ],
          });
        }
        break;

      case "log":
        return of({
          message:
            "I'll help you log your session. What would you like to record?",
          actions: [
            {
              label: "Log Session",
              icon: "pi pi-save",
              action: () => {
                // Log session logic
              },
            },
          ],
        });

      case "show":
        if (
          lowerCommand.includes("stats") ||
          lowerCommand.includes("performance")
        ) {
          return of({
            message: "Here are your performance stats. You're doing great!",
            actions: [
              {
                label: "View Analytics",
                icon: "pi pi-chart-line",
                action: () => {
                  // Show stats logic
                },
              },
            ],
          });
        }
        break;

      case "break":
        return of({
          message: "Taking a break is important for recovery. Rest up!",
        });

      case "intensity":
        const isIncrease = /increase|more|harder|up/i.test(lowerCommand);
        return of({
          message: isIncrease
            ? "Increasing intensity. Push yourself!"
            : "Reducing intensity. Listen to your body.",
        });

      case "help":
        return of({
          message:
            "I can help you start training, log sessions, view stats, adjust intensity, and more. Just tell me what you need!",
        });

      default:
        // Try API for advanced processing
        return this.apiService
          .post<CommandResponse>("/api/ai/process-command", { command: lowerCommand })
          .pipe(
            map((response): CommandResponse => {
              if (response.success && response.data) {
                return {
                  message: response.data.message,
                  actions: response.data.actions,
                };
              }
              return {
                message: "I'm not sure I understand. Can you rephrase that?",
              };
            }),
            catchError(() => {
              return of({
                message:
                  "I'm having trouble understanding. Try saying 'help' for assistance.",
              });
            }),
          );
    }

    return of({
      message:
        "I heard you, but I'm not sure what you want me to do. Try saying 'help' for assistance.",
    });
  }

  /**
   * Analyze training context and generate insights
   */
  analyzeContext(context: AnalysisContext): Observable<ContextInsight[]> {
    const insights: ContextInsight[] = [];

    // Analyze heart rate
    if (context.heartRate) {
      if (context.heartRate > 180) {
        insights.push({
          id: "hr-high",
          type: "Performance",
          message:
            "Your heart rate is elevated. Consider taking a short break.",
          icon: "pi pi-heart",
          priority: "high",
          actions: [
            {
              label: "Take Break",
              icon: "pi pi-pause",
              action: () => {
                // Break logic
              },
            },
          ],
        });
      } else if (
        context.heartRate < 100 &&
        context.timeInSession &&
        context.timeInSession > 10
      ) {
        insights.push({
          id: "hr-low",
          type: "Performance",
          message: "Your heart rate suggests you can increase intensity.",
          icon: "pi pi-arrow-up",
          priority: "medium",
        });
      }
    }

    // Analyze session duration
    if (context.timeInSession && context.timeInSession > 60) {
      insights.push({
        id: "duration-long",
        type: "Recovery",
        message:
          "You've been training for over an hour. Great work! Consider recovery.",
        icon: "pi pi-clock",
        priority: "medium",
        actions: [
          {
            label: "End Session",
            icon: "pi pi-check",
            action: () => {
              // End session logic
            },
          },
        ],
      });
    }

    // Analyze fatigue
    if (context.userFatigue && context.userFatigue > 7) {
      insights.push({
        id: "fatigue-high",
        type: "Recovery",
        message:
          "You're showing signs of fatigue. Rest is important for performance.",
        icon: "pi pi-exclamation-triangle",
        priority: "high",
      });
    }

    // Analyze performance trends
    if (context.previousPerformance && context.previousPerformance.length > 0) {
      const recentAvg =
        context.previousPerformance
          .slice(-3)
          .reduce((sum: number, p: RecentPerformance) => sum + (p.score || 0), 0) /
        Math.min(3, context.previousPerformance.length);

      if (recentAvg > 85) {
        insights.push({
          id: "performance-excellent",
          type: "Motivation",
          message:
            "Your recent performance has been excellent! Keep up the great work!",
          icon: "pi pi-star",
          priority: "low",
        });
      }
    }

    // Try API for advanced analysis
    return this.apiService.post<ContextInsight[]>("/api/ai/analyze-context", context).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        return insights;
      }),
      catchError(() => of(insights)),
    );
  }
}
