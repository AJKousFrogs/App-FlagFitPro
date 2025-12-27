import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { StepsModule } from "primeng/steps";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { SliderModule } from "primeng/slider";
import { ChipModule } from "primeng/chip";
import { TagModule } from "primeng/tag";
import { TimelineModule } from "primeng/timeline";
import { DialogModule } from "primeng/dialog";
import { ToggleButtonModule } from "primeng/togglebutton";
import { AIService } from "../../../core/services/ai.service";
import { WeatherService } from "../../../core/services/weather.service";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { LoadMonitoringService } from "../../../core/services/load-monitoring.service";
import { ToastService } from "../../../core/services/toast.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";

interface TrainingExercise {
  id: string;
  name: string;
  category: string;
  duration: number;
  intensity: "low" | "medium" | "high";
  equipment: string[];
  description: string;
  videoUrl?: string;
  aiRecommended?: boolean;
}

interface Goal {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  aiRecommended: boolean;
}

@Component({
  selector: "app-training-builder",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    StepsModule,
    ButtonModule,
    SelectModule,
    SliderModule,
    ChipModule,
    TagModule,
    TimelineModule,
    DialogModule,
    ToggleButtonModule,
  ],
  template: `
    <p-card header="Smart Training Session Builder" class="training-builder">
      <p-steps [(activeIndex)]="activeStep" [model]="steps" [readonly]="false">
      </p-steps>

      <div class="step-content-wrapper">
        <!-- Step 1: Session Goals -->
        @if (activeStep === 0) {
          <div class="step-content">
            <h3>What are your training goals for today?</h3>
            <div class="goals-grid">
              @for (goal of availableGoals; track trackByGoalId($index, goal)) {
                <div
                  class="goal-card"
                  [class.selected]="isGoalSelected(goal.id)"
                  (click)="toggleGoal(goal.id)"
                >
                  <i [class]="goal.icon" [style.color]="goal.color"></i>
                  <h4>{{ goal.name }}</h4>
                  <p>{{ goal.description }}</p>
                  @if (goal.aiRecommended) {
                    <p-tag
                      value="AI Recommended"
                      severity="success"
                      icon="pi pi-sparkles"
                    >
                    </p-tag>
                  }
                </div>
              }
            </div>
            <div class="step-actions">
              <p-button
                label="Next"
                icon="pi pi-arrow-right"
                [disabled]="selectedGoals().length === 0"
                (onClick)="activeStep = 1"
              >
              </p-button>
            </div>
          </div>
        }

        <!-- Step 2: Session Parameters -->
        @if (activeStep === 1) {
          <div class="step-content">
            <form [formGroup]="sessionForm" class="parameters-form">
              <div class="form-row">
                <div class="form-field">
                  <label>Session Duration (minutes)</label>
                  <p-slider
                    formControlName="duration"
                    [min]="15"
                    [max]="120"
                    [step]="15"
                  >
                  </p-slider>
                  <span class="duration-display"
                    >{{ sessionForm.get("duration")?.value }} minutes</span
                  >
                </div>
                <div class="form-field">
                  <label>Intensity Level</label>
                  <p-select
                    formControlName="intensity"
                    [options]="intensityLevels"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select intensity"
                  >
                    <ng-template let-option pTemplate="item">
                      <div class="intensity-option">
                        <span
                          class="intensity-indicator"
                          [class]="'intensity-' + option.value"
                        ></span>
                        <span>{{ option.label }}</span>
                      </div>
                    </ng-template>
                  </p-select>
                </div>
              </div>
              <div class="form-field">
                <label>Available Equipment</label>
                <p-chips
                  formControlName="equipment"
                  placeholder="Add equipment (optional)"
                >
                </p-chips>
              </div>
              <!-- Weather-based recommendations -->
              @if (weatherData()) {
                <div class="weather-notice">
                  <i class="pi pi-sun"></i>
                  <span
                    >{{ weatherData()?.condition }},
                    {{ weatherData()?.temperature }}°F</span
                  >
                  <p-tag
                    [value]="weatherData()?.recommendation"
                    [severity]="getWeatherSeverity()"
                  >
                  </p-tag>
                </div>
              }
            </form>
            <div class="step-actions">
              <p-button
                label="Previous"
                icon="pi pi-arrow-left"
                severity="secondary"
                [outlined]="true"
                (onClick)="activeStep = 0"
              >
              </p-button>
              <p-button
                label="Generate Session"
                icon="pi pi-sparkles"
                [disabled]="sessionForm.invalid"
                (onClick)="generateSession(); activeStep = 2"
              >
              </p-button>
            </div>
          </div>
        }

        <!-- Step 3: Generated Session -->
        @if (activeStep === 2) {
          <div class="step-content">
            <div class="session-overview">
              <h3>Generated Training Session</h3>
              <div class="session-stats">
                <div class="stat">
                  <span class="label">Duration</span>
                  <span class="value">{{ totalDuration() }} min</span>
                </div>
                <div class="stat">
                  <span class="label">Exercises</span>
                  <span class="value">{{ generatedExercises().length }}</span>
                </div>
                <div class="stat">
                  <span class="label">Intensity</span>
                  <p-tag
                    [value]="sessionForm.get('intensity')?.value"
                    [severity]="getIntensitySeverity()"
                  ></p-tag>
                </div>
              </div>
            </div>
            <!-- Exercise Timeline -->
            <p-timeline
              [value]="timelineEvents()"
              layout="vertical"
              class="session-timeline"
            >
              <ng-template pTemplate="marker" let-event>
                <div class="timeline-marker" [class]="'marker-' + event.type">
                  <i [class]="event.icon"></i>
                </div>
              </ng-template>
              <ng-template pTemplate="content" let-event>
                <p-card class="timeline-card">
                  <div class="exercise-header">
                    <h4>{{ event.title }}</h4>
                    <div class="exercise-meta">
                      <span class="duration">{{ event.duration }} min</span>
                      @if (event.aiGenerated) {
                        <p-tag
                          value="AI Generated"
                          severity="info"
                          size="small"
                        >
                        </p-tag>
                      }
                    </div>
                  </div>
                  <p class="exercise-description">{{ event.description }}</p>
                  <div class="exercise-actions">
                    <p-button
                      icon="pi pi-play"
                      label="Preview"
                      size="small"
                      [text]="true"
                      (onClick)="previewExercise(event)"
                    >
                    </p-button>
                    <p-button
                      icon="pi pi-pencil"
                      label="Modify"
                      size="small"
                      [text]="true"
                      (onClick)="modifyExercise(event)"
                    >
                    </p-button>
                  </div>
                </p-card>
              </ng-template>
            </p-timeline>
            <div class="step-actions">
              <p-button
                label="Previous"
                icon="pi pi-arrow-left"
                severity="secondary"
                [outlined]="true"
                (onClick)="activeStep = 1"
              >
              </p-button>
              <p-button
                label="Start Session"
                icon="pi pi-play"
                severity="success"
                [loading]="isSaving()"
                (onClick)="startSession()"
              >
              </p-button>
              <p-button
                label="Save for Later"
                icon="pi pi-bookmark"
                severity="secondary"
                [outlined]="true"
                [loading]="isSaving()"
                (onClick)="saveSession()"
              >
              </p-button>
            </div>
          </div>
        }
      </div>
    </p-card>
  `,
  styles: [
    `
      .training-builder {
        max-width: 1000px;
        margin: 0 auto;
      }

      .step-content-wrapper {
        margin-top: 2rem;
      }

      .step-content {
        padding: 2rem 0;
        min-height: 400px;
      }

      .goals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .goal-card {
        padding: 1.5rem;
        border: 2px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }

      .goal-card:hover {
        border-color: var(--p-primary-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .goal-card.selected {
        border-color: var(--p-primary-color);
        background: var(--p-primary-50);
      }

      .goal-card i {
        font-size: var(--icon-2xl);
        margin-bottom: var(--space-4);
      }

      .goal-card h4 {
        margin: 0.5rem 0;
        color: var(--p-text-color);
      }

      .goal-card p {
        margin: 0;
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
      }

      .parameters-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-field label {
        font-weight: 600;
        color: var(--p-text-color);
      }

      .duration-display {
        text-align: center;
        font-weight: 600;
        color: var(--p-primary-color);
        margin-top: 0.5rem;
      }

      .intensity-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .intensity-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .intensity-indicator.intensity-low {
        background: var(--color-status-success);
      }

      .intensity-indicator.intensity-medium {
        background: var(--color-status-warning);
      }

      .intensity-indicator.intensity-high {
        background: var(--color-status-error);
      }

      .weather-notice {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        border-left: 4px solid var(--p-primary-color);
      }

      .session-overview {
        margin-bottom: 2rem;
      }

      .session-stats {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
      }

      .stat {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .stat .label {
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .stat .value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-text-color);
      }

      .timeline-marker {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .marker-exercise {
        background: var(--p-primary-color);
      }

      .marker-rest {
        background: var(--p-surface-400);
      }

      .marker-warmup {
        background: var(--color-status-warning);
      }

      .marker-cooldown {
        background: var(--color-brand-primary);
      }

      .timeline-card {
        margin-left: 1rem;
        width: 300px;
      }

      .exercise-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .exercise-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .duration {
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .exercise-description {
        margin: 0.5rem 0;
        color: var(--p-text-color-secondary);
      }

      .exercise-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--p-surface-border);
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }

        .session-stats {
          flex-direction: column;
          gap: 1rem;
        }

        .timeline-card {
          width: 100%;
          margin-left: 0;
        }

        .step-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class TrainingBuilderComponent {
  private fb = inject(FormBuilder);
  private aiService = inject(AIService);
  private weatherService = inject(WeatherService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private loadMonitoringService = inject(LoadMonitoringService);
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
      color: "#10c96b",
      aiRecommended: true,
    },
    {
      id: "agility",
      name: "Agility Training",
      description: "Enhance quick direction changes",
      icon: "pi pi-refresh",
      color: "#f1c40f",
      aiRecommended: false,
    },
    {
      id: "endurance",
      name: "Endurance Building",
      description: "Build cardiovascular stamina",
      icon: "pi pi-heart",
      color: "#ef4444",
      aiRecommended: false,
    },
    {
      id: "skills",
      name: "Skill Development",
      description: "Practice position-specific skills",
      icon: "pi pi-star",
      color: "#8b5cf6",
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

  timelineEvents = computed(() => {
    interface TimelineEvent {
      type: string;
      icon: string;
      title: string;
      duration: number;
      description: string;
      aiGenerated: boolean;
    }

    const events: TimelineEvent[] = [];
    let currentTime = 0;

    // Warmup
    events.push({
      type: "warmup",
      icon: "pi pi-sun",
      title: "Warm-up",
      duration: 10,
      description: "Dynamic stretching and light movement",
      aiGenerated: false,
    });
    currentTime += 10;

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
      currentTime += exercise.duration;

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
        currentTime += 2;
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
      equipment: [[]],
    });

    // Angular 21: Initialize in constructor instead of OnInit
    this.loadWeatherData();
    this.loadAISuggestions();
  }

  private async loadAISuggestions() {
    const user = this.authService.getUser();
    if (!user?.id) {
      return;
    }

    // Load recent performance data from Supabase
    let recentPerformance: Array<{ date: string; rpe: number; type: string }> = [];
    try {
      const { data: sessions } = await this.supabaseService.client
        .from("training_sessions")
        .select("created_at, rpe, session_type")
        .eq("user_id", user.id)
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
      this.logger.warn("Could not load recent performance:", error);
    }

    // Load upcoming games/events
    let upcomingGames: Array<{ date: string; opponent?: string; importance?: string }> = [];
    try {
      const { data: events } = await this.supabaseService.client
        .from("team_events")
        .select("event_date, event_name, event_type")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(5);

      if (events) {
        upcomingGames = events.map((e) => ({
          date: e.event_date,
          opponent: e.event_name,
          importance: e.event_type === "game" ? "high" : "medium",
        }));
      }
    } catch (error) {
      this.logger.warn("Could not load upcoming games:", error);
    }

    // Load AI suggestions based on user's recent performance
    this.aiService
      .getTrainingSuggestions({
        userId: user.id,
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

  isGoalSelected(goalId: string): boolean {
    return this.selectedGoals().includes(goalId);
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
    const equipment = this.sessionForm.get("equipment")?.value || [];

    // Try AI service first
    const user = this.authService.getUser();
    if (user?.id) {
      this.aiService
        .getTrainingSuggestions({
          userId: user.id,
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
      .filter((s): s is Record<string, unknown> => 
        s !== null && 
        typeof s === 'object' && 
        'formData' in s &&
        s['formData'] !== null &&
        typeof s['formData'] === 'object'
      )
      .map((suggestion, index) => {
        const formData = suggestion['formData'] as Record<string, unknown>;
        const suggestionId = suggestion['id'];
        const suggestionTitle = suggestion['title'];
        const suggestionDescription = suggestion['description'];
        const formSessionType = formData['sessionType'];
        const formDuration = formData['duration'];
        const formIntensity = formData['intensity'];
        const formEquipment = formData['equipment'];
        
        return {
          id: `ai-${typeof suggestionId === 'string' ? suggestionId : 'unknown'}-${index}`,
          name: typeof suggestionTitle === 'string' ? suggestionTitle : 'Untitled Exercise',
          category: typeof formSessionType === 'string' ? formSessionType : "mixed",
          duration: typeof formDuration === 'number' ? formDuration : Math.floor(duration / 3),
          intensity: (
            formIntensity === 'low' ||
            formIntensity === 'medium' ||
            formIntensity === 'high'
              ? formIntensity
              : intensity
          ) as "low" | "medium" | "high",
          equipment: Array.isArray(formEquipment) 
            ? formEquipment.filter((e): e is string => typeof e === 'string')
            : equipment,
          description: typeof suggestionDescription === 'string' ? suggestionDescription : '',
          aiRecommended: true,
        };
      });
  }

  private generateExercisesForGoals(
    goals: string[],
    duration: number,
    intensity: string,
    equipment: string[] = [],
  ): TrainingExercise[] {
    // Mock exercise generation logic
    const exerciseDatabase: Record<string, TrainingExercise[]> = {
      speed: [
        {
          id: "sprint-intervals",
          name: "40-Yard Sprints",
          category: "speed",
          duration: 15,
          intensity: intensity as "low" | "medium" | "high",
          equipment: ["cones"],
          description: "High-intensity sprint intervals to improve top speed",
          aiRecommended: true,
        },
      ],
      agility: [
        {
          id: "cone-drill",
          name: "5-10-5 Shuttle",
          category: "agility",
          duration: 12,
          intensity: intensity as "low" | "medium" | "high",
          equipment: ["cones"],
          description: "Lateral movement drill for quick direction changes",
          aiRecommended: true,
        },
      ],
      endurance: [
        {
          id: "cardio-intervals",
          name: "Cardiovascular Intervals",
          category: "endurance",
          duration: 20,
          intensity: intensity as "low" | "medium" | "high",
          equipment: [],
          description:
            "High-intensity interval training for cardiovascular fitness",
          aiRecommended: false,
        },
      ],
      skills: [
        {
          id: "skill-drills",
          name: "Position-Specific Drills",
          category: "skills",
          duration: 18,
          intensity: intensity as "low" | "medium" | "high",
          equipment: ["football"],
          description: "Focused practice on position-specific techniques",
          aiRecommended: true,
        },
      ],
    };

    const exercises: TrainingExercise[] = [];
    const availableTime = duration - 20; // Account for warmup/cooldown

    goals.forEach((goal) => {
      if (exerciseDatabase[goal]) {
        exercises.push(...exerciseDatabase[goal]);
      }
    });

    return exercises.slice(0, Math.floor(availableTime / 15)); // Rough estimation
  }

  private loadWeatherData() {
    // Fetch real weather data
    this.weatherService
      .getWeatherData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (weather) => {
          if (weather) {
            this.weatherData.set({
              condition: weather.condition,
              temperature: weather.temp,
              recommendation: this.getWeatherRecommendation(weather),
            });
          }
        },
        error: () => {
          // Fallback to mock data
          this.weatherData.set({
            condition: "Sunny",
            temperature: 72,
            recommendation: "Perfect for outdoor training",
          });
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
    | "warn"
    | "danger"
    | "contrast" {
    const temp = this.weatherData()?.temperature || 70;
    if (temp < 40 || temp > 90) return "danger";
    if (temp < 50 || temp > 85) return "warn";
    return "success";
  }

  getIntensitySeverity():
    | "success"
    | "secondary"
    | "info"
    | "warn"
    | "danger"
    | "contrast" {
    const intensity = this.sessionForm.get("intensity")?.value;
    switch (intensity) {
      case "high":
        return "danger";
      case "medium":
        return "warn";
      default:
        return "success";
    }
  }

  previewExercise(event: { title: string; description: string }) {
    // Open exercise preview modal
    this.logger.debug("Preview exercise:", event);
  }

  modifyExercise(event: { title: string; description: string }) {
    // Open exercise modification modal
    this.logger.debug("Modify exercise:", event);
  }

  async startSession() {
    // Save session to database and start tracking
    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error("Please log in to start a session");
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
        user.id,
        sessionType,
        rpe,
        duration,
        `Training goals: ${goals.join(", ")}. Exercises: ${this.generatedExercises().map(e => e.name).join(", ")}`
      );

      if (session.id) {
        this.toastService.success("Training session started and logged!");
        this.logger.success("Session saved to database:", session);
        
        // Navigate to dashboard to see updated ACWR
        this.router.navigate(["/dashboard"]);
      } else {
        this.toastService.warn("Session started but may not have been saved");
      }
    } catch (error) {
      this.logger.error("Error starting session:", error);
      this.toastService.error("Failed to save training session");
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveSession() {
    // Save session template to database
    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error("Please log in to save a session");
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
      const sessionName = `${goals.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(" & ")} Session`;

      const { data: template, error: templateError } = await this.supabaseService.client
        .from("training_session_templates")
        .insert({
          session_name: sessionName,
          session_type: sessionType,
          duration_minutes: duration,
          intensity_level: intensity,
          description: `AI-generated ${sessionType} session focusing on ${goals.join(", ")}`,
          equipment_needed: [...new Set(exercises.flatMap(e => e.equipment || []))],
          notes: `Generated on ${new Date().toLocaleDateString()}`,
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
          const { data: newExercise, error: exerciseError } = await this.supabaseService.client
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
            this.logger.warn(`Could not create exercise ${exercise.name}:`, exerciseError);
            continue;
          }
          exerciseId = newExercise?.id;
        }

        // Link exercise to session template
        await this.supabaseService.client
          .from("session_exercises")
          .insert({
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

      this.toastService.success("Session template saved successfully!");
      this.logger.info("Session template saved:", template.id);
      
      // Optionally navigate to training schedule
      this.router.navigate(["/training/schedule"]);
    } catch (error: any) {
      this.logger.error("Error saving session template:", error);
      this.toastService.error(error.message || "Failed to save session template");
    } finally {
      this.isSaving.set(false);
    }
  }

  private mapGoalsToSessionType(goals: string[]): "technical" | "sprint" | "strength" | "conditioning" | "recovery" | "game" {
    // Map training goals to session types
    if (goals.includes("speed")) return "sprint";
    if (goals.includes("agility")) return "technical";
    if (goals.includes("endurance")) return "conditioning";
    if (goals.includes("skills")) return "technical";
    return "technical"; // Default
  }

  trackByGoalId(index: number, goal: Goal): string {
    return goal.id;
  }
}
