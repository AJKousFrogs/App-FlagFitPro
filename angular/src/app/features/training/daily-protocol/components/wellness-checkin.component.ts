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
import {
  extractApiPayload,
  isSuccessfulApiResponse,
} from "../../../../core/utils/api-response-mapper";
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
  templateUrl: "./wellness-checkin.component.html",
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
        this.trainingService.getWellnessForDay<WellnessData>(targetDate),
      );
      const payload = extractApiPayload<WellnessData>(response);

      if (payload) {
        this.wellnessData.set(payload);
        this.formData.set({ ...payload });
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

      if (isSuccessfulApiResponse(response)) {
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

  onAreaToggle(area: string, event: Event): void {
    this.toggleArea(area, this.readChecked(event));
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

  onNotesInput(event: Event): void {
    this.updateFormField("notes", this.readInputValue(event));
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  private readChecked(event: Event): boolean {
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
