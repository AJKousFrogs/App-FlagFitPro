import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { Select } from "primeng/select";
import { SliderModule } from "primeng/slider";
import { ToggleSwitch } from "primeng/toggleswitch";
import { ChipModule } from "primeng/chip";
import { TagModule } from "primeng/tag";
import { SelectButtonModule } from "primeng/selectbutton";
import { ToastModule } from "primeng/toast";
import { ToastService } from "../../../../core/services/toast.service";
import {
  AIService,
  TrainingSuggestion,
} from "../../../core/services/ai.service";
import {
  WeatherService,
  WeatherData,
} from "../../../core/services/weather.service";
import { LoggerService } from "../../../core/services/logger.service";
import { AuthService } from "../../../core/services/auth.service";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    Select,
    SliderModule,
    ToggleSwitch,
    ChipModule,
    TagModule,
    SelectButtonModule,
    ToastModule,
  ],
  template: `
    <p-toast></p-toast>
    <p-card header="Create Training Session">
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
              (onChange)="onSessionTypeChange($event)"
            >
              <ng-template let-option pTemplate="item">
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
                <p-tag
                  [value]="weatherData()?.suitability"
                  [severity]="
                    getWeatherSeverity(weatherData()?.suitability || 'good')
                  "
                >
                </p-tag>
              </div>
              <p-inputSwitch
                formControlName="outdoorSession"
                [disabled]="!weatherData()?.suitable"
              >
              </p-inputSwitch>
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
          <p-button
            label="Create Session"
            icon="pi pi-check"
            (onClick)="onSubmit()"
            [disabled]="trainingForm.invalid"
          ></p-button>
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [outlined]="true"
            (onClick)="onCancel()"
          ></p-button>
        </div>
      </form>
    </p-card>
  `,
  styles: [
    `
      .smart-training-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .ai-suggestions {
        background: linear-gradient(135deg, #f0f9f7 0%, #d0f0eb 100%);
        padding: 1rem;
        border-radius: var(--p-border-radius);
        margin-bottom: 1.5rem;
        border-left: 4px solid var(--p-primary-color);
      }

      .ai-suggestions h5 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.5rem 0;
        color: var(--p-primary-color);
        font-weight: 600;
      }

      .suggestion-chips {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
      }

      .clickable-chip {
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .clickable-chip:hover {
        transform: scale(1.05);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
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

      .session-type-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0;
      }

      .session-type-option i {
        font-size: var(--icon-lg);
        color: var(--color-brand-primary);
      }

      .option-label {
        font-weight: 500;
        color: var(--p-text-color);
      }

      .option-description {
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
      }

      .duration-display {
        font-weight: 600;
        color: var(--p-primary-color);
        text-align: center;
        margin-top: 0.5rem;
      }

      .weather-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--p-surface-100);
        border-radius: var(--p-border-radius);
        margin-bottom: 0.5rem;
      }

      .weather-indicator i {
        color: var(--color-brand-primary);
      }

      .switch-label {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .equipment-section {
        margin-top: 1rem;
      }

      .equipment-section h5 {
        margin-bottom: 1rem;
        color: var(--p-text-color);
      }

      .equipment-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .equipment-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
      }

      .equipment-option i {
        font-size: var(--icon-lg);
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--p-surface-border);
      }

      @media (max-width: 768px) {
        .form-grid {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions p-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class SmartTrainingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private aiService = inject(AIService);
  private weatherService = inject(WeatherService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

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
    const duration = this.trainingForm?.get("duration")?.value || 45;
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

  private async loadAISuggestions() {
    const user = this.authService.getUser();
    if (!user) return;

    this.aiService
      .getTrainingSuggestions({
        userId: user.id,
        recentPerformance: [], // See issue #14 - Load recent performance API
        upcomingGames: [], // See issue #14 - Load upcoming games API
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
    this.weatherService.getWeatherData()
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
    this.trainingForm.get("sessionType")?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.updateRecommendedEquipment(type);
      });
  }

  private updateRecommendedEquipment(sessionType: string) {
    const equipmentMap: Record<string, EquipmentOption[]> = {
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

  onSessionTypeChange(event: { value: string }) {
    // Additional logic when session type changes
    const selectedType = event.value;
    this.logger.debug("Session type changed to:", selectedType);
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

  onSubmit() {
    if (this.trainingForm.valid) {
      const formValue = this.trainingForm.value;
      this.logger.debug("Creating training session:", formValue);
      // See issue #7 - Implement training form submission API
      this.toastService.success("Your training session has been created successfully");
    } else {
      this.toastService.error("Please fill in all required fields");
    }
  }

  onCancel() {
    this.trainingForm.reset();
    this.toastService.info("Training session creation cancelled");
  }
}
