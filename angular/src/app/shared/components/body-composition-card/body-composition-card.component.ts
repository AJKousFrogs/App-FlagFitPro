/**
 * Body Composition Card Component
 *
 * Displays latest body composition metrics from smart scale.
 * Shows weight, body fat, muscle mass with trend indicators.
 * Includes logging dialog for new measurements.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md):
 * - Decision 14: Border-first cards
 * - Decision 33: Card header pattern
 */

import { CommonModule, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { InputNumberComponent } from "../input-number/input-number.component";

import { Tooltip } from "primeng/tooltip";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";
import { ButtonComponent } from "../ui-components";
import { EmptyStateComponent } from "../empty-state/empty-state.component";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { AppDialogComponent } from "../dialog/dialog.component";
import { DialogHeaderComponent } from "../dialog-header/dialog-header.component";
import { DialogFooterComponent } from "../dialog-footer/dialog-footer.component";

interface BodyCompositionData {
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  bodyWater: number | null;
  bmi: number | null;
  visceralFat: number | null;
  basalMetabolicRate: number | null;
  measurementDate: string | null;
  weightTrend: "up" | "down" | "stable" | null;
  fatTrend: "up" | "down" | "stable" | null;
}

@Component({
  selector: "app-body-composition-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    Tooltip,
    DecimalPipe,
    InputNumberComponent,
    EmptyStateComponent,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./body-composition-card.component.html",
  styleUrl: "./body-composition-card.component.scss",
})
export class BodyCompositionCardComponent implements OnInit {
  private trainingService = inject(UnifiedTrainingService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);

  // Use unified service signals
  latestMeasurement = this.trainingService.latestMeasurement;
  recentMeasurements = this.trainingService.recentMeasurements;
  isLoading = this.trainingService.isRefreshing;

  // Dialog state
  showLogDialog = false;
  readonly isSaving = signal(false);
  measurementForm = {
    weight: null as number | null,
    bodyFat: null as number | null,
    muscleMass: null as number | null,
    bodyWater: null as number | null,
    basalMetabolicRate: null as number | null,
  };

  // Computed display data
  displayData = computed<BodyCompositionData>(() => {
    const latest = this.latestMeasurement();
    const measurements = this.recentMeasurements();
    const previous = measurements.length > 1 ? measurements[1] : null;

    if (!latest) {
      return {
        weight: null,
        bodyFat: null,
        muscleMass: null,
        bodyWater: null,
        bmi: null,
        visceralFat: null,
        basalMetabolicRate: null,
        measurementDate: null,
        weightTrend: null,
        fatTrend: null,
      };
    }

    return {
      weight: latest.weight || null,
      bodyFat: latest.bodyFat || null,
      muscleMass: latest.muscleMass || null,
      bodyWater: latest.bodyWaterPercentage || null,
      bmi: latest.basalMetabolicRate ? null : null, // placeholder
      visceralFat: latest.visceralFatRating || null,
      basalMetabolicRate: latest.basalMetabolicRate || null,
      measurementDate: latest.timestamp || null,
      weightTrend: previous
        ? this.calculateTrend(latest.weight, previous.weight)
        : null,
      fatTrend: previous
        ? this.calculateTrend(latest.bodyFat, previous.bodyFat)
        : null,
    };
  });

  hasData = computed(() => this.displayData().weight !== null);
  lastUpdated = computed(() => this.displayData().measurementDate);

  ngOnInit(): void {
    // Data is automatically loaded/refreshed by UnifiedTrainingService
  }

  readonly openLogDialogHandler = (): void => this.openLogDialog();

  openLogDialog(): void {
    // Reset form
    this.measurementForm = {
      weight: null,
      bodyFat: null,
      muscleMass: null,
      bodyWater: null,
      basalMetabolicRate: null,
    };
    this.showLogDialog = true;
  }

  onMeasurementInput(
    field: keyof typeof this.measurementForm,
    value: number | null | undefined,
  ): void {
    this.measurementForm[field] = value ?? null;
  }

  async saveMeasurement(): Promise<void> {
    if (!this.measurementForm.weight) {
      this.toastService.warn("Please enter your weight");
      return;
    }

    this.isSaving.set(true);
    this.logger.info(
      "[BodyComposition] Saving measurement:",
      this.measurementForm,
    );

    try {
      const result = await this.trainingService.logBodyComp({
        weight: this.measurementForm.weight,
        bodyFat: this.measurementForm.bodyFat ?? undefined,
        muscleMass: this.measurementForm.muscleMass ?? undefined,
        bodyWaterPercentage: this.measurementForm.bodyWater ?? undefined,
        basalMetabolicRate:
          this.measurementForm.basalMetabolicRate ?? undefined,
      });

      this.isSaving.set(false);
      if (result?.success) {
        this.toastService.success("Body composition saved!");
        this.showLogDialog = false;
        // Data is refreshed internally by logBodyComp
      } else {
        const errorMsg = result?.error
          ? `Failed to save: ${typeof result.error === "string" ? result.error : (result.error as { message?: string })?.message || "Unknown error"}`
          : "Failed to save measurement. Are you logged in?";
        this.logger.error("body_composition_save_failed", result?.error);
        this.toastService.error(errorMsg);
      }
    } catch (err) {
      this.isSaving.set(false);
      this.logger.error("body_composition_measurement_save_failed", err);
      this.toastService.error("Failed to save measurement. Please try again.");
    }
  }

  private calculateTrend(
    current: number | null | undefined,
    previous: number | null | undefined,
  ): "up" | "down" | "stable" | null {
    if (current == null || previous == null) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return "stable";
    return diff > 0 ? "up" : "down";
  }

  getTrendIcon(trend: "up" | "down" | "stable"): string {
    switch (trend) {
      case "up":
        return "pi pi-arrow-up";
      case "down":
        return "pi pi-arrow-down";
      default:
        return "pi pi-minus";
    }
  }

  getFatBarWidth(fatPercent: number): number {
    return Math.min(100, (fatPercent / 40) * 100);
  }

  getFatRangeTooltip(fatPercent: number): string {
    if (fatPercent < 10) return "Below essential fat range";
    if (fatPercent <= 14) return "Athletic range";
    if (fatPercent <= 20) return "Fitness range";
    if (fatPercent <= 25) return "Average range";
    return "Above average";
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
  }
}
