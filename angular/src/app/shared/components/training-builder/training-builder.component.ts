import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import {
  NonNullableFormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { Stepper, StepList, Step } from "primeng/stepper";
import { COLORS } from "../../../core/constants/app.constants";
import { AIService } from "../../../core/services/ai.service";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { LoadMonitoringService } from "../../../core/services/load-monitoring.service";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { WeatherService } from "../../../core/services/weather.service";
import { formatDate } from "../../utils/date.utils";
import { type AlertVariant } from "../alert/alert.component";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { TrainingBuilderGeneratedSessionComponent } from "./training-builder-generated-session.component";
import { TrainingBuilderGoalsStepComponent } from "./training-builder-goals-step.component";
import { TrainingBuilderParametersStepComponent } from "./training-builder-parameters-step.component";
import {
  Goal,
  TrainingExercise,
  TrainingTimelineEvent,
} from "./training-builder.models";

@Component({
  selector: "app-training-builder",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CardShellComponent,
    Stepper,
    StepList,
    Step,
    TrainingBuilderGoalsStepComponent,
    TrainingBuilderGeneratedSessionComponent,
    TrainingBuilderParametersStepComponent,
  ],
  templateUrl: "./training-builder.component.html",
  styleUrl: "./training-builder.component.scss",
})
export class TrainingBuilderComponent {
  private fb = inject(NonNullableFormBuilder);
  private aiService = inject(AIService);
  private weatherService = inject(WeatherService);
  private logger = inject(LoggerService);
  private loadMonitoringService = inject(LoadMonitoringService);
  private homeRouteService = inject(HomeRouteService);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Session saving state
  isSaving = signal(false);

  activeStep = 0;

  steps = [
    { label: "Session Goals" },
    { label: "Parameters" },
    { label: "Your Session" },
  ];

  sessionForm: FormGroup;

  selectedGoals = signal<string[]>([]);
  generatedExercises = signal<TrainingExercise[]>([]);
  weatherData = signal<{
    condition: string;
    temperature: number;
    recommendation: string;
  } | null>(null);

  availableGoals: Goal[] = [
    {
      id: "speed",
      name: "Speed Development",
      description: "Improve sprint speed and acceleration",
      icon: "pi pi-bolt",
      color: COLORS.PRIMARY_LIGHT,
      aiRecommended: true,
    },
    {
      id: "agility",
      name: "Agility Training",
      description: "Enhance quick direction changes",
      icon: "pi pi-refresh",
      color: COLORS.WARNING,
      aiRecommended: false,
    },
    {
      id: "endurance",
      name: "Endurance Building",
      description: "Build cardiovascular stamina",
      icon: "pi pi-heart",
      color: COLORS.ERROR,
      aiRecommended: false,
    },
    {
      id: "skills",
      name: "Skill Development",
      description: "Practice position-specific skills",
      icon: "pi pi-star",
      color: COLORS.PURPLE_LIGHT,
      aiRecommended: true,
    },
  ];

  intensityLevels = [
    { label: "Light", value: "low" },
    { label: "Moderate", value: "medium" },
    { label: "Intense", value: "high" },
  ];

  totalDuration = computed(() =>
    this.generatedExercises().reduce(
      (sum, exercise) => sum + exercise.duration,
      0,
    ),
  );

  readonly weatherSummary = computed(() => {
    const weather = this.weatherData();
    if (!weather) {
      return "";
    }

    return `${weather.condition}, ${weather.temperature}°F`;
  });

  readonly weatherAlertVariant = computed<AlertVariant>(() => {
    const temp = this.weatherData()?.temperature ?? 70;
    if (temp < 40 || temp > 90) {
      return "warning";
    }

    if (temp < 50 || temp > 85) {
      return "info";
    }

    return "success";
  });

  timelineEvents = computed(() => {
    const events: TrainingTimelineEvent[] = [];

    // Warmup
    events.push({
      type: "warmup",
      icon: "pi pi-sun",
      title: "Warm-up",
      duration: 10,
      description: "Dynamic stretching and light movement",
      aiGenerated: false,
    });

    // Main exercises
    this.generatedExercises().forEach((exercise, index) => {
      events.push({
        type: "exercise",
        icon: "pi pi-play",
        title: exercise.name,
        duration: exercise.duration,
        description: exercise.description,
        aiGenerated: exercise.aiRecommended || false,
      });

      // Add rest period between exercises
      if (index < this.generatedExercises().length - 1) {
        events.push({
          type: "rest",
          icon: "pi pi-pause",
          title: "Rest Period",
          duration: 2,
          description: "Active recovery and hydration",
          aiGenerated: false,
        });
      }
    });

    // Cooldown
    events.push({
      type: "cooldown",
      icon: "pi pi-check",
      title: "Cool-down",
      duration: 10,
      description: "Static stretching and flexibility work",
      aiGenerated: false,
    });

    return events;
  });

  constructor() {
    // Initialize form
    this.sessionForm = this.fb.group({
      duration: [
        60,
        [Validators.required, Validators.min(15), Validators.max(120)],
      ],
      intensity: ["medium", Validators.required],
      equipment: [""],
    });

    // Angular 21: Initialize in constructor instead of OnInit
    this.loadWeatherData();
    this.loadAISuggestions();
  }

  private async loadAISuggestions() {
    const userId = this.supabaseService.userId();
    if (!userId) {
      return;
    }

    // Load recent performance data from Supabase
    let recentPerformance: { date: string; rpe: number; type: string }[] =
      [];
    try {
      const { data: sessions } = await this.supabaseService.client
        .from("training_sessions")
        .select("created_at, rpe, session_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (sessions) {
        recentPerformance = sessions.map((s) => ({
          date: s.created_at,
          rpe: s.rpe || 5,
          type: s.session_type || "general",
        }));
      }
    } catch (error) {
      this.logger.warn(
        "Could not load recent performance:",
        toLogContext(error),
      );
    }

    // Load upcoming games/events
    let upcomingGames: {
      date: string;
      opponent?: string;
      importance?: string;
    }[] = [];
    try {
      const { data: events } = await this.supabaseService.client
        .from("games")
        .select("game_date, opponent_name")
        .gte("game_date", new Date().toISOString().split("T")[0])
        .order("game_date", { ascending: true })
        .limit(5);

      if (events) {
        upcomingGames = events.map((e) => ({
          date: e.game_date,
          opponent: e.opponent_name,
          importance: "high",
        }));
      }
    } catch (error) {
      this.logger.warn("Could not load upcoming games:", toLogContext(error));
    }

    // Load AI suggestions based on user's recent performance
    this.aiService
      .getTrainingSuggestions({
        userId,
        recentPerformance,
        upcomingGames,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (suggestions) => {
          // Mark AI-recommended goals
          if (suggestions && suggestions.length > 0) {
            this.availableGoals = this.availableGoals.map((goal) => {
              const suggestion = suggestions.find(
                (s) => s.formData?.sessionType === goal.id,
              );
              return {
                ...goal,
                aiRecommended: suggestion ? true : goal.aiRecommended,
              };
            });
          }
        },
        error: () => {
          // Continue with default goals if AI service fails
          this.logger.debug("AI service not available, using default goals");
        },
      });
  }

  toggleGoal(goalId: string) {
    this.selectedGoals.update((current) =>
      current.includes(goalId)
        ? current.filter((id) => id !== goalId)
        : [...current, goalId],
    );
  }

  generateSession() {
    // AI-powered session generation based on goals and parameters
    const duration = this.sessionForm.get("duration")?.value || 60;
    const intensity = this.sessionForm.get("intensity")?.value || "medium";
    const goals = this.selectedGoals();
    const equipmentStr = this.sessionForm.get("equipment")?.value || "";
    const equipment = equipmentStr
      ? equipmentStr
          .split(",")
          .map((e: string) => e.trim())
          .filter((e: string) => e)
      : [];

    // Try AI service first
    const userId = this.supabaseService.userId();
    if (userId) {
      this.aiService
        .getTrainingSuggestions({
          userId,
          recentPerformance: [],
          upcomingGames: [],
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (suggestions) => {
            // Use AI suggestions if available
            if (suggestions && suggestions.length > 0) {
              const aiExercises = this.convertAISuggestionsToExercises(
                suggestions,
                duration,
                intensity,
                equipment,
              );
              if (aiExercises.length > 0) {
                this.generatedExercises.set(aiExercises);
                return;
              }
            }
            // Fallback to rule-based generation
            const exercises = this.generateExercisesForGoals(
              goals,
              duration,
              intensity,
              equipment,
            );
            this.generatedExercises.set(exercises);
          },
          error: () => {
            // Fallback to rule-based generation
            const exercises = this.generateExercisesForGoals(
              goals,
              duration,
              intensity,
              equipment,
            );
            this.generatedExercises.set(exercises);
          },
        });
    } else {
      // Fallback to rule-based generation
      const exercises = this.generateExercisesForGoals(
        goals,
        duration,
        intensity,
        equipment,
      );
      this.generatedExercises.set(exercises);
    }
  }

  private convertAISuggestionsToExercises(
    suggestions: unknown[],
    duration: number,
    intensity: string,
    equipment: string[],
  ): TrainingExercise[] {
    return suggestions
      .filter(
        (s): s is Record<string, unknown> =>
          s !== null &&
          typeof s === "object" &&
          "formData" in s &&
          s["formData"] !== null &&
          typeof s["formData"] === "object",
      )
      .map((suggestion, index) => {
        const formData = suggestion["formData"] as Record<string, unknown>;
        const suggestionId = suggestion["id"];
        const suggestionTitle = suggestion["title"];
        const suggestionDescription = suggestion["description"];
        const formSessionType = formData["sessionType"];
        const formDuration = formData["duration"];
        const formIntensity = formData["intensity"];
        const formEquipment = formData["equipment"];

        return {
          id: `ai-${typeof suggestionId === "string" ? suggestionId : "unknown"}-${index}`,
          name:
            typeof suggestionTitle === "string"
              ? suggestionTitle
              : "Suggested Exercise",
          category:
            typeof formSessionType === "string" ? formSessionType : "mixed",
          duration:
            typeof formDuration === "number"
              ? formDuration
              : Math.floor(duration / 3),
          intensity: (formIntensity === "low" ||
          formIntensity === "medium" ||
          formIntensity === "high"
            ? formIntensity
            : intensity) as "low" | "medium" | "high",
          equipment: Array.isArray(formEquipment)
            ? formEquipment.filter((e): e is string => typeof e === "string")
            : equipment,
          description:
            typeof suggestionDescription === "string"
              ? suggestionDescription
              : "",
          aiRecommended: true,
        };
      });
  }

  private generateExercisesForGoals(
    _goals: string[],
    _duration: number,
    _intensity: string,
    _equipment: string[] = [],
  ): TrainingExercise[] {
    // Return empty array. In production, this would fetch from a rule-based engine or ExerciseDB
    return [];
  }

  private loadWeatherData() {
    // Fetch real weather data
    this.weatherService
      .getWeatherData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (weather) => {
          if (weather && weather.condition !== "N/A") {
            this.weatherData.set({
              condition: weather.condition,
              temperature: weather.temp,
              recommendation: this.getWeatherRecommendation(weather),
            });
          } else {
            this.weatherData.set(null);
          }
        },
        error: () => {
          this.weatherData.set(null);
        },
      });
  }

  private getWeatherRecommendation(weather: {
    suitable?: boolean;
    suitability?: string;
  }): string {
    if (!weather.suitable) {
      return "Indoor training recommended";
    }
    switch (weather.suitability) {
      case "excellent":
        return "Perfect for outdoor training";
      case "good":
        return "Good conditions for outdoor training";
      case "fair":
        return "Fair conditions - consider indoor option";
      case "poor":
        return "Indoor training recommended";
      default:
        return "Check conditions before training";
    }
  }

  getWeatherSeverity():
    | "success"
    | "secondary"
    | "info"
    | "warning"
    | "danger" {
    const temp = this.weatherData()?.temperature || 70;
    if (temp < 40 || temp > 90) return "danger";
    if (temp < 50 || temp > 85) return "warning";
    return "success";
  }

  getIntensitySeverity():
    | "success"
    | "secondary"
    | "info"
    | "warning"
    | "danger" {
    const intensity = this.sessionForm.get("intensity")?.value;
    switch (intensity) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      default:
        return "success";
    }
  }

  previewExercise(event: { title: string; description: string }) {
    // Open exercise preview modal
    this.logger.debug("Preview exercise:", toLogContext(event));
  }

  modifyExercise(event: { title: string; description: string }) {
    // Open exercise modification modal
    this.logger.debug("Modify exercise:", toLogContext(event));
  }

  async startSession() {
    // Save session to database and start tracking
    const userId = this.supabaseService.userId();
    if (!userId) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_START_SESSION);
      return;
    }

    this.isSaving.set(true);

    try {
      const duration = this.sessionForm.get("duration")?.value || 60;
      const intensity = this.sessionForm.get("intensity")?.value || "medium";

      // Map intensity to RPE (1-10 scale)
      const rpeMap: Record<string, number> = {
        low: 4,
        medium: 6,
        high: 8,
      };
      const rpe = rpeMap[intensity] || 6;

      // Determine session type from selected goals
      const goals = this.selectedGoals();
      const sessionType = this.mapGoalsToSessionType(goals);

      // Save workout log to database
      const session = await this.loadMonitoringService.createQuickSession(
        userId,
        sessionType,
        rpe,
        duration,
        `Training goals: ${goals.join(", ")}. Exercises: ${this.generatedExercises()
          .map((e) => e.name)
          .join(", ")}`,
      );

      if (session.id) {
        this.toastService.success(TOAST.SUCCESS.SESSION_STARTED);
        this.logger.info("Session saved to database:", session);

        this.router.navigateByUrl(this.homeRouteService.getHomeRoute());
      } else {
        this.toastService.warn(TOAST.WARN.START_SESSION_FIRST);
      }
    } catch (error) {
      this.logger.error("Error starting session:", error);
      this.toastService.error(TOAST.ERROR.SESSION_SAVE_FAILED);
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveSession() {
    // Save session template to database
    const userId = this.supabaseService.userId();
    if (!userId) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_SAVE_SESSION);
      return;
    }

    this.isSaving.set(true);
    const exercises = this.generatedExercises();
    const goals = this.selectedGoals();
    const duration = this.sessionForm.get("duration")?.value || 60;
    const intensity = this.sessionForm.get("intensity")?.value || "medium";

    try {
      // Create the session template
      const sessionType = this.mapGoalsToSessionType(goals);
      const sessionName = `${goals.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(" & ")} Session`;

      const { data: template, error: templateError } =
        await this.supabaseService.client
          .from("training_session_templates")
          .insert({
            session_name: sessionName,
            session_type: sessionType,
            duration_minutes: duration,
            intensity_level: intensity,
            description: `AI-generated ${sessionType} session focusing on ${goals.join(", ")}`,
            equipment_needed: [
              ...new Set(exercises.flatMap((e) => e.equipment || [])),
            ],
            notes: `Generated on ${formatDate(new Date(), "P")}`,
            day_of_week: new Date().getDay(),
            session_order: 1,
          })
          .select()
          .single();

      if (templateError) {
        throw new Error(templateError.message);
      }

      // Save individual exercises linked to the template
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];

        // Check if exercise exists in master exercises table
        const { data: existingExercise } = await this.supabaseService.client
          .from("exercises")
          .select("id")
          .eq("name", exercise.name)
          .single();

        let exerciseId = existingExercise?.id;

        // If not, create it
        if (!exerciseId) {
          const { data: newExercise, error: exerciseError } =
            await this.supabaseService.client
              .from("exercises")
              .insert({
                name: exercise.name,
                category: exercise.category,
                description: exercise.description,
                equipment_needed: exercise.equipment,
                difficulty_level: exercise.intensity,
              })
              .select("id")
              .single();

          if (exerciseError) {
            this.logger.warn(
              `Could not create exercise ${exercise.name}:`,
              exerciseError,
            );
            continue;
          }
          exerciseId = newExercise?.id;
        }

        // Link exercise to session template
        await this.supabaseService.client.from("session_exercises").insert({
          session_template_id: template.id,
          exercise_id: exerciseId,
          exercise_name: exercise.name,
          exercise_order: i + 1,
          sets: 3,
          reps: "8-12",
          duration_seconds: exercise.duration * 60,
          intensity: exercise.intensity,
          notes: exercise.description,
        });
      }

      this.toastService.success(TOAST.SUCCESS.SAVED);
      this.logger.info("Session template saved:", toLogContext(template.id));

      // Optionally navigate to training schedule
      this.router.navigate(["/training"]);
    } catch (error: unknown) {
      this.logger.error("Error saving session template:", error);
      this.toastService.error(
        (error as Error)?.message || "Failed to save session template",
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private mapGoalsToSessionType(
    goals: string[],
  ):
    | "technical"
    | "sprint"
    | "strength"
    | "conditioning"
    | "recovery"
    | "game" {
    // Map training goals to session types
    if (goals.includes("speed")) return "sprint";
    if (goals.includes("agility")) return "technical";
    if (goals.includes("endurance")) return "conditioning";
    if (goals.includes("skills")) return "technical";
    return "technical"; // Default
  }
}
