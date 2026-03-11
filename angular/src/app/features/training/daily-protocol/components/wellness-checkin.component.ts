import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Slider } from "primeng/slider";
import { Tag } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "../../../../core/services/logger.service";
import { UnifiedTrainingService } from "../../../../core/services/unified-training.service";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

export interface WellnessData {
  sleepQuality: number;
  sleepHours: number;
  energyLevel: number;
  muscleSoreness: number;
  stressLevel: number;
  sorenessAreas: string[];
  notes?: string;
}

export interface ReadinessResult {
  readinessScore: number;
  sleepQuality: number;
  energyLevel: number;
  muscleSoreness: number;
  stressLevel: number;
  recommendation: string;
}

@Component({
  selector: "app-wellness-checkin",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Slider,
    Tag,
    Tooltip,
    ButtonComponent,
    IconButtonComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <!-- Quick Checkin Button -->
    @if (!hasCheckedIn()) {
      <div class="checkin-prompt" (click)="showDialog.set(true)">
        <span class="prompt-icon">💚</span>
        <div class="prompt-content">
          <span class="prompt-title">Complete Wellness Check-in</span>
          <span class="prompt-subtitle">Track your readiness for today</span>
        </div>
        <i class="pi pi-chevron-right"></i>
      </div>
    } @else {
      <div class="checkin-complete" (click)="showDialog.set(true)">
        <div class="readiness-display">
          <span
            class="readiness-score"
            [class]="getReadinessClass(readinessScore())"
            >{{ readinessScore() }}</span
          >
          <span class="readiness-label">Readiness</span>
        </div>
        <div class="wellness-summary">
          <div class="meta-row" pTooltip="Sleep Quality">
            <span class="meta-row__icon" aria-hidden="true">😴</span>
            <span class="meta-row__text">{{
              getSleepLabel(wellnessData().sleepQuality)
            }}</span>
          </div>
          <div class="meta-row" pTooltip="Energy Level">
            <span class="meta-row__icon" aria-hidden="true">⚡</span>
            <span class="meta-row__text">{{
              getEnergyLabel(wellnessData().energyLevel)
            }}</span>
          </div>
          <div class="meta-row" pTooltip="Muscle Soreness">
            <span class="meta-row__icon" aria-hidden="true">💪</span>
            <span class="meta-row__text">{{
              getSorenessLabel(wellnessData().muscleSoreness)
            }}</span>
          </div>
        </div>
        <app-icon-button
          icon="pi-pencil"
          variant="text"
          size="sm"
          ariaLabel="Edit check-in"
        />
        <small class="state-narration-inline">
          <strong>What changed:</strong> Check-in completed. Readiness score:
          {{ readinessScore() }}. <strong>Why:</strong> You saved your wellness
          check-in. <strong>What it means:</strong>
          {{ getRecommendation(readinessScore()) }} <strong>Who:</strong> Your
          data is saved and visible to your coach.
          <strong>What next:</strong> Click to edit or view details. This score
          affects your training recommendations.
        </small>
      </div>
    }

    <!-- Checkin Dialog -->
    <app-dialog
      [visible]="showDialog()"
      (visibleChange)="showDialog.set($event)"
      [blockScroll]="true"
      [draggable]="false"
      [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
      styleClass="wellness-dialog"
      ariaLabel="Daily wellness check-in"
    >
      <app-dialog-header
        icon="heart"
        title="Daily Wellness Check-in"
        subtitle="Track your readiness for today"
        (close)="showDialog.set(false)"
      />

      <div class="checkin-form">
        <!-- Sleep Quality -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">😴</span>
            <span>Sleep Quality</span>
            <span class="value-badge">{{
              getSleepLabel(formData().sleepQuality)
            }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Poor</span>
            <p-slider
              [ngModel]="formData().sleepQuality"
              (ngModelChange)="onSliderChange('sleepQuality', $event)"
              [min]="1"
              [max]="5"
              [step]="1"
              class="flex-1"
            />
            <span class="slider-label">Excellent</span>
          </div>
          <small class="state-narration">
            <strong>What changed:</strong> Sleep quality set to
            {{ getSleepLabel(formData().sleepQuality) }}.
            <strong>Why:</strong> Based on your input.
            <strong>What it means:</strong> This affects 30% of your readiness
            score. <strong>Who:</strong> You control this value.
            <strong>What next:</strong> Your readiness score updates
            automatically below.
          </small>
        </div>

        <!-- Sleep Hours -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">🕐</span>
            <span>Hours of Sleep</span>
            <span class="value-badge">{{ formData().sleepHours }}h</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">4h</span>
            <p-slider
              [ngModel]="formData().sleepHours"
              (ngModelChange)="onSliderChange('sleepHours', $event)"
              [min]="4"
              [max]="12"
              [step]="0.5"
              class="flex-1"
            />
            <span class="slider-label">12h</span>
          </div>
          <small class="state-narration">
            <strong>What changed:</strong> Sleep hours set to
            {{ formData().sleepHours }}h. <strong>Why:</strong> Based on your
            input. <strong>What it means:</strong> This affects 15% of your
            readiness score.
            {{
              formData().sleepHours >= 8
                ? "Optimal range (8+ hours)."
                : formData().sleepHours >= 7
                  ? "Good range (7-8 hours)."
                  : "Below optimal range - may impact recovery."
            }}
            <strong>Who:</strong> You control this value.
            <strong>What next:</strong> Your readiness score updates
            automatically below.
          </small>
        </div>

        <!-- Energy Level -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">⚡</span>
            <span>Energy Level</span>
            <span class="value-badge">{{
              getEnergyLabel(formData().energyLevel)
            }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Exhausted</span>
            <p-slider
              [ngModel]="formData().energyLevel"
              (ngModelChange)="onSliderChange('energyLevel', $event)"
              [min]="1"
              [max]="5"
              [step]="1"
              class="flex-1"
            />
            <span class="slider-label">Energized</span>
          </div>
          <small class="state-narration">
            <strong>What changed:</strong> Energy level set to
            {{ getEnergyLabel(formData().energyLevel) }}.
            <strong>Why:</strong> Based on your input.
            <strong>What it means:</strong> This affects 25% of your readiness
            score. <strong>Who:</strong> You control this value.
            <strong>What next:</strong> Your readiness score updates
            automatically below.
          </small>
        </div>

        <!-- Muscle Soreness -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">💪</span>
            <span>Muscle Soreness</span>
            <span class="value-badge">{{
              getSorenessLabel(formData().muscleSoreness)
            }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Very Sore</span>
            <p-slider
              [ngModel]="formData().muscleSoreness"
              (ngModelChange)="onSliderChange('muscleSoreness', $event)"
              [min]="1"
              [max]="5"
              [step]="1"
              class="flex-1"
            />
            <span class="slider-label">No Soreness</span>
          </div>
          <small class="state-narration">
            <strong>What changed:</strong> Muscle soreness set to
            {{ getSorenessLabel(formData().muscleSoreness) }}.
            <strong>Why:</strong> Based on your input.
            <strong>What it means:</strong> This affects 15% of your readiness
            score.
            {{
              formData().muscleSoreness < 4
                ? "Since soreness is moderate or higher, you will be asked to specify affected areas below."
                : "Low soreness indicates good recovery."
            }}
            <strong>Who:</strong> You control this value.
            <strong>What next:</strong>
            {{
              formData().muscleSoreness < 4
                ? "Select affected body areas below, then readiness score updates."
                : "Your readiness score updates automatically below."
            }}
          </small>
        </div>

        <!-- Soreness Areas -->
        @if (formData().muscleSoreness < 4) {
          <div class="form-section">
            <label class="section-label">
              <span class="label-icon"><i class="pi pi-map-marker" aria-hidden="true"></i></span>
              <span>Where are you sore?</span>
            </label>
            <small class="state-narration state-narration--compact">
              <strong>What changed:</strong> Soreness areas section appeared.
              <strong>Why:</strong> Your muscle soreness is
              {{ getSorenessLabel(formData().muscleSoreness) }} (moderate or
              higher). <strong>What it means:</strong> Tracking specific areas
              helps identify patterns and recovery needs.
              <strong>Who:</strong> You select which areas are affected.
              <strong>What next:</strong> Select all areas that feel sore. This
              helps your coach understand your recovery status.
            </small>
            <div class="body-area-grid">
              @for (area of bodyAreas; track area) {
                <label class="area-checkbox">
                  <input
                    type="checkbox"
                    class="area-checkbox-input"
                    [checked]="formData().sorenessAreas.includes(area)"
                    (change)="toggleArea(area, isChecked($event))"
                  />
                  <span>{{ area }}</span>
                </label>
              }
            </div>
            @if (formData().sorenessAreas.length > 0) {
              <small class="state-narration">
                <strong>What changed:</strong>
                {{ formData().sorenessAreas.length }} area(s) selected:
                {{ formData().sorenessAreas.join(", ") }}.
                <strong>Why:</strong> You selected these areas.
                <strong>What it means:</strong> This information will be saved
                with your check-in for coach review. <strong>Who:</strong> You
                control these selections. <strong>What next:</strong> Continue
                with the rest of the check-in.
              </small>
            }
          </div>
        }

        <!-- Stress Level -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon"><i class="pi pi-heart" aria-hidden="true"></i></span>
            <span>Stress Level</span>
            <span class="value-badge">{{
              getStressLabel(formData().stressLevel)
            }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Very High</span>
            <p-slider
              [ngModel]="formData().stressLevel"
              (ngModelChange)="onSliderChange('stressLevel', $event)"
              [min]="1"
              [max]="5"
              [step]="1"
              class="flex-1"
            />
            <span class="slider-label">Very Low</span>
          </div>
          <small class="state-narration">
            <strong>What changed:</strong> Stress level set to
            {{ getStressLabel(formData().stressLevel) }}.
            <strong>Why:</strong> Based on your input.
            <strong>What it means:</strong> This affects 15% of your readiness
            score. <strong>Who:</strong> You control this value.
            <strong>What next:</strong> Your readiness score updates
            automatically below.
          </small>
        </div>

        <!-- Notes -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon"><i class="pi pi-pencil" aria-hidden="true"></i></span>
            <span>Notes (optional)</span>
          </label>
          <textarea
            p-textarea
            [value]="formData().notes || ''"
            (input)="updateFormField('notes', getInputValue($event))"
            rows="2"
            placeholder="Any additional notes..."
          ></textarea>
        </div>

        <!-- Preview Score -->
        <div class="readiness-preview">
          <div class="preview-label">Estimated Readiness Score</div>
          <div
            class="preview-score"
            [class]="getReadinessClass(previewScore())"
          >
            {{ previewScore() }}
          </div>
          <div class="preview-recommendation">
            {{ getRecommendation(previewScore()) }}
          </div>
          <small
            class="state-narration state-narration--centered state-narration--spaced"
          >
            <strong>What changed:</strong> Readiness score is
            {{ previewScore() }} ({{
              getReadinessClass(previewScore()) === "high"
                ? "high"
                : getReadinessClass(previewScore()) === "moderate"
                  ? "moderate"
                  : "low"
            }}). <strong>Why:</strong> Calculated from your sleep quality (30%),
            sleep hours (15%), energy (25%), soreness (15%), and stress (15%).
            <strong>What it means:</strong>
            {{ getRecommendation(previewScore()) }} <strong>Who:</strong> System
            calculates this automatically based on your inputs.
            <strong>What next:</strong>
            {{
              previewScore() >= 70
                ? "You are ready for training. Save your check-in to record this score."
                : previewScore() >= 50
                  ? "Consider lighter training today. Save your check-in to record this score."
                  : "Rest day recommended. Save your check-in to record this score."
            }}
          </small>
        </div>
      </div>

      @if (isSaving()) {
        <div class="save-narration">
          <small class="state-narration">
            <strong>What changed:</strong> Check-in is being saved.
            <strong>Why:</strong> You clicked "Save Check-in".
            <strong>What it means:</strong> Your wellness data and readiness
            score ({{ previewScore() }}) are being recorded.
            <strong>Who:</strong> System is processing your submission.
            <strong>What next:</strong> Dialog will close automatically when
            saved. Your readiness score will appear on your dashboard.
          </small>
        </div>
      }

      <app-dialog-footer
        cancelLabel="Cancel"
        primaryLabel="Save Check-in"
        primaryIcon="check"
        [loading]="isSaving()"
        (cancel)="showDialog.set(false)"
        (primary)="saveCheckin()"
      />
    </app-dialog>
  `,
  styleUrl: "./wellness-checkin.component.scss",
})
export class WellnessCheckinComponent implements OnInit {
  // Dependency Injection (Angular 21 pattern)
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly logger = inject(LoggerService);

  // Input/Output (Angular 21 signals)
  readonly date = input<string>(); // YYYY-MM-DD format
  readonly checkinComplete = output<ReadinessResult>();

  // State from Unified Service
  readonly hasCheckedIn = this.trainingService.hasCheckedInToday;
  readonly readinessScore = this.trainingService.readinessScore;

  // Local State Signals
  readonly isSaving = signal(false);
  readonly showDialog = signal(false);
  readonly saveSuccess = signal(false);
  readonly wellnessData = signal<WellnessData>({
    sleepQuality: 3,
    sleepHours: 7,
    energyLevel: 3,
    muscleSoreness: 3,
    stressLevel: 3,
    sorenessAreas: [],
  });

  // Form Data (reactive with signals)
  readonly formData = signal<WellnessData>({
    sleepQuality: 3,
    sleepHours: 7,
    energyLevel: 3,
    muscleSoreness: 3,
    stressLevel: 3,
    sorenessAreas: [],
    notes: "",
  });

  // Constants
  readonly bodyAreas = [
    "Legs",
    "Lower Back",
    "Upper Back",
    "Shoulders",
    "Arms",
    "Chest",
    "Glutes",
    "Calves",
    "Core",
  ] as const;

  // Computed Values
  readonly previewScore = computed(() => this.calculateScore(this.formData()));

  ngOnInit(): void {
    this.loadExistingCheckin();
    // Note: previewScore is a computed signal that automatically updates when formData changes
  }

  async loadExistingCheckin(): Promise<void> {
    try {
      const targetDate = this.date() || new Date().toISOString().split("T")[0];
      const response = await firstValueFrom(
        this.trainingService.getWellnessForDay(targetDate),
      );

      if (response?.success && response.data) {
        this.wellnessData.set(response.data as WellnessData);
        this.formData.set({ ...(response.data as WellnessData) });
      }
    } catch (_err) {
      // No existing checkin - that's ok
    }
  }

  calculateScore(data: WellnessData): number {
    const sleepQualityScore = (data.sleepQuality / 5) * 100;
    const sleepHoursScore = Math.min(100, ((data.sleepHours - 4) / 4) * 100);
    const energyScore = (data.energyLevel / 5) * 100;
    const sorenessScore = (data.muscleSoreness / 5) * 100;
    const stressScore = (data.stressLevel / 5) * 100;

    const weighted =
      sleepQualityScore * 0.3 +
      sleepHoursScore * 0.15 +
      energyScore * 0.25 +
      sorenessScore * 0.15 +
      stressScore * 0.15;

    return Math.round(weighted);
  }

  async saveCheckin(): Promise<void> {
    this.isSaving.set(true);

    try {
      const targetDate = this.date() || new Date().toISOString().split("T")[0];
      const currentFormData = this.formData();
      const readiness = this.calculateScore(currentFormData);

      const response: { success?: boolean; data?: unknown; error?: string } =
        await this.trainingService.submitWellness({
          date: targetDate,
          ...currentFormData,
          readinessScore: readiness,
        });

      if (response?.success) {
        this.wellnessData.set(currentFormData);
        this.saveSuccess.set(true);
        this.showDialog.set(false);

        this.checkinComplete.emit({
          readinessScore: readiness,
          sleepQuality: currentFormData.sleepQuality,
          energyLevel: currentFormData.energyLevel,
          muscleSoreness: currentFormData.muscleSoreness,
          stressLevel: currentFormData.stressLevel,
          recommendation: this.getRecommendation(readiness),
        });

        // Reset success state after 5 seconds
        setTimeout(() => this.saveSuccess.set(false), 5000);
      }
    } catch (err: unknown) {
      this.logger.error("Failed to save wellness checkin", err);
    } finally {
      this.isSaving.set(false);
    }
  }

  toggleArea(area: string, checked: boolean): void {
    const currentData = this.formData();
    if (checked) {
      this.formData.set({
        ...currentData,
        sorenessAreas: [...currentData.sorenessAreas, area],
      });
    } else {
      this.formData.set({
        ...currentData,
        sorenessAreas: currentData.sorenessAreas.filter((a) => a !== area),
      });
    }
  }

  updateFormField<K extends keyof WellnessData>(
    field: K,
    value: WellnessData[K],
  ): void {
    this.formData.set({
      ...this.formData(),
      [field]: value,
    });
  }

  onSliderChange(
    field:
      | "sleepQuality"
      | "sleepHours"
      | "energyLevel"
      | "muscleSoreness"
      | "stressLevel",
    value: number | number[] | null | undefined,
  ): void {
    const nextValue = Array.isArray(value) ? value[0] : value;
    if (typeof nextValue !== "number") {
      return;
    }
    this.updateFormField(field, nextValue);
  }

  getInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  isChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  getSleepLabel(value: number): string {
    const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
    return labels[value] || "";
  }

  getEnergyLabel(value: number): string {
    const labels = ["", "Exhausted", "Tired", "Normal", "Good", "Energized"];
    return labels[value] || "";
  }

  getSorenessLabel(value: number): string {
    const labels = ["", "Very Sore", "Sore", "Moderate", "Mild", "None"];
    return labels[value] || "";
  }

  getStressLabel(value: number): string {
    const labels = ["", "Very High", "High", "Moderate", "Low", "Very Low"];
    return labels[value] || "";
  }

  getReadinessClass(score: number): string {
    if (score >= 70) return "high";
    if (score >= 50) return "moderate";
    return "low";
  }

  getRecommendation(score: number): string {
    if (score >= 80) return "Ready for high-intensity training";
    if (score >= 70) return "Good for moderate training";
    if (score >= 60) return "Consider lighter training today";
    if (score >= 50) return "Focus on recovery activities";
    return "Rest day recommended";
  }
}
