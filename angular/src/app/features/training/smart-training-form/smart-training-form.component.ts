import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  NonNullableFormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { Chip } from "primeng/chip";
import { Select, type SelectChangeEvent } from "primeng/select";
import { SelectButton } from "primeng/selectbutton";
import { Slider } from "primeng/slider";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { ToggleSwitch } from "primeng/toggleswitch";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import {
  AIService,
  TrainingSuggestion,
} from "../../../core/services/ai.service";
import {
  LoggerService,
  toLogContext,
} from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  WeatherData,
  WeatherService,
} from "../../../core/services/weather.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { SmartTrainingDataService } from "../services/smart-training-data.service";

interface SessionTypeOption {
  label: string;
  value: string;
  icon: string;
  description: string;
}

interface EquipmentOption {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: "app-smart-training-form",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Select,
    Slider,
    ToggleSwitch,
    Chip,
    StatusTagComponent,
    SelectButton,
    ButtonComponent,
    CardShellComponent,
  ],
  template: `
    <app-card-shell title="Create Training Session">
      <form [formGroup]="trainingForm" class="smart-training-form">
        <!-- AI Suggestions Banner -->
        @if (aiSuggestions().length > 0) {
          <div class="ai-suggestions">
            <h5>
              <i class="pi pi-sparkles"></i>
              AI Recommendations
            </h5>
            <div class="suggestion-chips">
              @for (suggestion of aiSuggestions(); track suggestion.title) {
                <p-chip
                  [label]="suggestion.title"
                  icon="pi pi-plus"
                  [removable]="false"
                  (click)="applySuggestion(suggestion)"
                  class="clickable-chip"
                >
                </p-chip>
              }
            </div>
          </div>
        }

        <!-- Dynamic Form Fields -->
        <div class="form-grid">
          <div class="form-field">
            <label for="sessionType">Session Type</label>
            <p-select
              id="sessionType"
              formControlName="sessionType"
              [options]="sessionTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select session type"
              (onChange)="onSessionTypeSelect($event)"
            >
              <ng-template let-option #item>
                <div class="session-type-option">
                  <i [class]="option.icon"></i>
                  <div>
                    <div class="option-label">{{ option.label }}</div>
                    <small class="option-description">{{
                      option.description
                    }}</small>
                  </div>
                </div>
              </ng-template>
            </p-select>
          </div>

          <!-- Context-aware duration field -->
          <div class="form-field">
            <label for="duration">Duration</label>
            <p-slider
              formControlName="duration"
              [min]="15"
              [max]="120"
              [step]="15"
              [range]="false"
            >
            </p-slider>
            <span class="duration-display">{{ durationDisplay() }}</span>
          </div>

          <!-- Weather-aware outdoor toggle -->
          @if (weatherData()) {
            <div class="form-field">
              <div class="weather-indicator">
                <i class="pi pi-sun"></i>
                <span
                  >{{ weatherData()?.temp }}°F,
                  {{ weatherData()?.condition }}</span
                >
                <app-status-tag
                  [value]="weatherData()?.suitability || ''"
                  [severity]="
                    getWeatherSeverity(weatherData()?.suitability || 'good')
                  "
                  size="sm"
                />
              </div>
              <p-toggleswitch
                formControlName="outdoorSession"
                [disabled]="!weatherData()?.suitable"
              >
              </p-toggleswitch>
              <label class="switch-label">Outdoor Session</label>
            </div>
          }
        </div>

        <!-- Smart Equipment Suggestions -->
        @if (recommendedEquipment().length > 0) {
          <div class="equipment-section">
            <h5>Recommended Equipment</h5>
            <div class="equipment-grid">
              <p-selectButton
                formControlName="equipment"
                [options]="equipmentSelectOptions()"
                [multiple]="true"
              >
              </p-selectButton>
            </div>
          </div>
        }

        <!-- Form Actions -->
        <div class="form-actions">
          <app-button
            iconLeft="pi-check"
            [disabled]="trainingForm.invalid"
            (clicked)="onSubmit()"
            >Create Session</app-button
          >
          <app-button
            variant="outlined"
            iconLeft="pi-times"
            (clicked)="onCancel()"
            >Cancel</app-button
          >
        </div>
      </form>
    </app-card-shell>
  `,
  styleUrl: "./smart-training-form.component.scss",
})
export class SmartTrainingFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private aiService = inject(AIService);
  private weatherService = inject(WeatherService);
  private supabase = inject(SupabaseService);
  private teamMembershipService = inject(TeamMembershipService);
  private smartTrainingDataService = inject(SmartTrainingDataService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  isSubmitting = signal(false);
  durationValue = signal(45);

  aiSuggestions = signal<TrainingSuggestion[]>([]);
  weatherData = signal<WeatherData | null>(null);
  recommendedEquipment = signal<EquipmentOption[]>([]);

  equipmentSelectOptions = computed(() => {
    return this.recommendedEquipment().map((eq) => ({
      label: eq.name,
      value: eq.id,
      icon: eq.icon,
    }));
  });

  trainingForm: FormGroup;

  sessionTypes: SessionTypeOption[] = [
    {
      label: "Flag Football Practice",
      value: "flag_football",
      icon: "pi pi-flag",
      description: "Full team practice with plays and scrimmage",
    },
    {
      label: "Speed Training",
      value: "speed",
      icon: "pi pi-bolt",
      description: "Sprint intervals and agility drills",
    },
    {
      label: "Strength Training",
      value: "strength",
      icon: "pi pi-dumbbell",
      description: "Core and functional strength",
    },
    {
      label: "Endurance",
      value: "endurance",
      icon: "pi pi-clock",
      description: "Cardiovascular conditioning",
    },
    {
      label: "Recovery",
      value: "recovery",
      icon: "pi pi-heart",
      description: "Light mobility and stretching",
    },
    {
      label: "Tactical",
      value: "tactical",
      icon: "pi pi-map",
      description: "Game-specific drills and tactics",
    },
    {
      label: "Mixed",
      value: "mixed",
      icon: "pi pi-th-large",
      description: "Combined training approach",
    },
  ];

  durationDisplay = computed(() => {
    const duration = this.durationValue();
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  });

  constructor() {
    this.trainingForm = this.fb.group({
      sessionType: ["", Validators.required],
      duration: [45, [Validators.required, Validators.min(15)]],
      outdoorSession: [false],
      equipment: [[]],
    });
  }

  async ngOnInit() {
    await this.loadAISuggestions();
    await this.loadWeatherData();
    this.setupFormWatchers();
  }

  private currentUserId(): string | null {
    return this.supabase.userId();
  }

  private async loadAISuggestions() {
    const userId = this.currentUserId();
    if (!userId) return;

    // Load recent performance data from Supabase
    let recentPerformance: Array<{ date: string; rpe: number; type: string }> =
      [];
    try {
      const { sessions } =
        await this.smartTrainingDataService.fetchRecentSessions(userId);

      if (sessions.length > 0) {
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

    // Load upcoming games/events - this is optional, don't block on failure
    let upcomingGames: Array<{
      date: string;
      opponent?: string;
      importance?: string;
    }> = [];
    try {
      // Note: team_events requires team_id filter via RLS, this query may return empty
      // if the user is not part of a team. We gracefully handle this case.
      const { events, error: eventsError } =
        await this.smartTrainingDataService.fetchUpcomingTeamEvents(
          new Date().toISOString().split("T")[0],
        );

      if (!eventsError && events) {
        upcomingGames = events.map((e) => ({
          date: e.event_date,
          opponent: e.title ?? undefined,
          importance: e.event_type === "game" ? "high" : "medium",
        }));
      }
    } catch (error) {
      // Non-critical: upcoming games are optional for suggestions
      this.logger.debug(
        "Could not load upcoming games (optional):",
        toLogContext(error),
      );
    }

    this.aiService
      .getTrainingSuggestions({
        userId,
        recentPerformance,
        upcomingGames,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (suggestions) => {
          this.aiSuggestions.set(suggestions);
        },
        error: (error) => {
          this.logger.error("Error loading AI suggestions:", error);
        },
      });
  }

  private async loadWeatherData() {
    this.weatherService
      .getWeatherData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (weather) => {
          this.weatherData.set(weather);
        },
        error: (error) => {
          this.logger.error("Error loading weather data:", error);
        },
      });
  }

  private setupFormWatchers() {
    // Update recommended equipment when session type changes
    this.trainingForm
      .get("sessionType")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.updateRecommendedEquipment(type);
      });

    // Update duration signal when form value changes
    this.trainingForm
      .get("duration")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((duration) => {
        this.durationValue.set(duration);
      });
  }

  private updateRecommendedEquipment(sessionType: string) {
    const equipmentMap: Record<string, EquipmentOption[]> = {
      flag_football: [
        { id: "football", name: "Football", icon: "pi pi-circle" },
        { id: "flags", name: "Flag Belts", icon: "pi pi-flag" },
        { id: "cones", name: "Cones", icon: "pi pi-circle" },
        { id: "markers", name: "Field Markers", icon: "pi pi-map" },
      ],
      speed: [
        { id: "cones", name: "Cones", icon: "pi pi-circle" },
        { id: "ladder", name: "Agility Ladder", icon: "pi pi-th-large" },
        { id: "hurdles", name: "Hurdles", icon: "pi pi-minus" },
      ],
      strength: [
        { id: "weights", name: "Weights", icon: "pi pi-dumbbell" },
        {
          id: "resistance_bands",
          name: "Resistance Bands",
          icon: "pi pi-circle",
        },
        { id: "kettlebells", name: "Kettlebells", icon: "pi pi-circle" },
      ],
      endurance: [
        { id: "cones", name: "Cones", icon: "pi pi-circle" },
        { id: "timer", name: "Timer", icon: "pi pi-clock" },
      ],
      recovery: [
        { id: "mat", name: "Yoga Mat", icon: "pi pi-circle" },
        { id: "foam_roller", name: "Foam Roller", icon: "pi pi-circle" },
      ],
      tactical: [
        { id: "football", name: "Football", icon: "pi pi-circle" },
        { id: "cones", name: "Cones", icon: "pi pi-circle" },
        { id: "markers", name: "Field Markers", icon: "pi pi-map" },
      ],
      mixed: [
        { id: "cones", name: "Cones", icon: "pi pi-circle" },
        { id: "football", name: "Football", icon: "pi pi-circle" },
      ],
    };

    const equipment = equipmentMap[sessionType] || [];
    this.recommendedEquipment.set(equipment);

    // Auto-select first equipment if available
    if (equipment.length > 0) {
      this.trainingForm.patchValue({
        equipment: [equipment[0].id],
      });
    }
  }

  onSessionTypeChange(selectedType: string) {
    // Additional logic when session type changes
    this.logger.debug("Session type changed to:", toLogContext(selectedType));
  }

  onSessionTypeSelect(event: SelectChangeEvent): void {
    this.onSessionTypeChange((event.value as string | null | undefined) ?? "");
  }

  applySuggestion(suggestion: TrainingSuggestion) {
    this.trainingForm.patchValue(suggestion.formData);
    this.toastService.info(suggestion.title + " - " + suggestion.reason);
  }

  getWeatherSeverity(
    suitability: "excellent" | "good" | "fair" | "poor" | undefined,
  ): "success" | "info" | "warning" | "danger" {
    return this.weatherService.getWeatherSeverity(suitability || "good");
  }

  async onSubmit(): Promise<void> {
    if (this.trainingForm.invalid) {
      this.toastService.error(TOAST.ERROR.REQUIRED_FIELDS);
      return;
    }

    this.isSubmitting.set(true);

    try {
      const userId = this.currentUserId();
      if (!userId) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      const formValue = this.trainingForm.value;
      this.logger.debug("Creating training session:", toLogContext(formValue));

      // Save to Supabase
      // Note: 'equipment' is stored in notes as JSON since column doesn't exist in schema
      // Note: athlete_id is required by RLS policy, user_id is for backward compatibility
      const equipmentList =
        formValue.equipment?.length > 0
          ? `Equipment: ${formValue.equipment.join(", ")}`
          : "";

      const { error } = await this.smartTrainingDataService.createTrainingSession(
        {
          athleteId: userId,
          userId,
          sessionType: formValue.sessionType,
          durationMinutes: formValue.duration,
          intensity: this.getIntensityFromDuration(formValue.duration),
          isOutdoor: formValue.outdoorSession,
          scheduledDate: new Date().toISOString(),
          notes: `Created via Smart Training Form${equipmentList ? ". " + equipmentList : ""}`,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success(TOAST.SUCCESS.SESSION_CREATED_SUCCESS);

      // Navigate to training calendar (canonical route)
      setTimeout(() => {
        this.router.navigate(["/training"]);
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create session";
      this.toastService.error(message);
      this.logger.error("Error creating training session:", error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private getIntensityFromDuration(duration: number): string {
    if (duration <= 30) return "low";
    if (duration <= 60) return "moderate";
    if (duration <= 90) return "high";
    return "very_high";
  }

  onCancel() {
    this.trainingForm.reset();
    this.toastService.info(TOAST.INFO.SESSION_CANCELLED);

    // Navigate back to appropriate dashboard based on user role
    const dashboardRoute = this.teamMembershipService.canManageRoster()
      ? "/coach"
      : "/dashboard";
    this.router.navigate([dashboardRoute]);
  }
}
