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
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnInit,
    computed,
    inject,
    signal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { PrimeTemplate } from "primeng/api";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";

import { Tooltip } from "primeng/tooltip";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";
import { ButtonComponent, CardComponent } from "../ui-components";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    Tooltip,
    DecimalPipe,
    Dialog,
    PrimeTemplate,
    PrimeTemplate,
    InputNumber
  ],
  template: `
    <app-card
      title="Body Composition"
      [subtitle]="
        lastUpdated()
          ? 'Last measured ' + formatDate(lastUpdated()!)
          : undefined
      "
      headerIcon="pi-chart-pie"
      headerIconColor="primary"
      [loading]="isLoading()"
    >
      <!-- Empty State -->
      @if (!isLoading() && !hasData()) {
        <div class="empty-state">
          <i class="pi pi-scale empty-icon"></i>
          <p class="empty-title">No measurements yet</p>
          <p class="empty-description">
            Log your first body composition measurement to track changes over
            time.
          </p>
          <app-button
            variant="primary"
            size="md"
            iconLeft="pi-plus"
            (clicked)="openLogDialog()"
          >
            Log Measurement
          </app-button>
        </div>
      }

      <!-- Data Display -->
      @else if (!isLoading()) {
        <div class="body-comp-content">
          <!-- Primary Metric: Weight -->
          <div class="primary-metric">
            <div class="metric-main">
              <span class="metric-value">{{
                displayData().weight | number: "1.1-1"
              }}</span>
              <span class="metric-unit">kg</span>
              @if (displayData().weightTrend) {
                <span
                  class="trend-indicator"
                  [class.up]="displayData().weightTrend === 'up'"
                  [class.down]="displayData().weightTrend === 'down'"
                >
                  <i [class]="getTrendIcon(displayData().weightTrend!)"></i>
                </span>
              }
            </div>
            <span class="metric-label">Total Weight</span>
          </div>

          <!-- Secondary Metrics Grid -->
          <div class="metrics-grid">
            <!-- Body Fat -->
            @if (displayData().bodyFat !== null) {
              <div class="metric-item">
                <div class="metric-row">
                  <span class="metric-value-sm"
                    >{{ displayData().bodyFat | number: "1.1-1" }}%</span
                  >
                  @if (displayData().fatTrend) {
                    <span
                      class="trend-small"
                      [class.good]="displayData().fatTrend === 'down'"
                      [class.neutral]="displayData().fatTrend === 'stable'"
                    >
                      <i [class]="getTrendIcon(displayData().fatTrend!)"></i>
                    </span>
                  }
                </div>
                <span class="metric-label-sm">Body Fat</span>
                <div
                  class="fat-bar"
                  [pTooltip]="getFatRangeTooltip(displayData().bodyFat!)"
                >
                  <div
                    class="fat-fill"
                    [style.width.%]="getFatBarWidth(displayData().bodyFat!)"
                    [class.low]="displayData().bodyFat! < 10"
                    [class.ideal]="
                      displayData().bodyFat! >= 10 &&
                      displayData().bodyFat! <= 20
                    "
                    [class.moderate]="
                      displayData().bodyFat! > 20 &&
                      displayData().bodyFat! <= 30
                    "
                    [class.high]="displayData().bodyFat! > 30"
                  ></div>
                </div>
              </div>
            }

            <!-- Muscle Mass -->
            @if (displayData().muscleMass !== null) {
              <div class="metric-item">
                <span class="metric-value-sm"
                  >{{ displayData().muscleMass | number: "1.1-1" }} kg</span
                >
                <span class="metric-label-sm">Muscle Mass</span>
              </div>
            }

            <!-- Body Water -->
            @if (displayData().bodyWater !== null) {
              <div class="metric-item">
                <span class="metric-value-sm"
                  >{{ displayData().bodyWater | number: "1.1-1" }}%</span
                >
                <span class="metric-label-sm">Body Water</span>
              </div>
            }

            <!-- BMR -->
            @if (displayData().basalMetabolicRate !== null) {
              <div class="metric-item">
                <span class="metric-value-sm">{{
                  displayData().basalMetabolicRate
                }}</span>
                <span class="metric-label-sm">BMR (kcal)</span>
              </div>
            }
          </div>

          <!-- Log New Measurement Button -->
          <div class="log-button-container">
            <app-button
              variant="outlined"
              size="sm"
              iconLeft="pi-plus"
              (clicked)="openLogDialog()"
            >
              Log New Measurement
            </app-button>
          </div>
        </div>
      }

      <!-- Footer -->
      <div footer>
        <a routerLink="/performance-tracking" class="view-link">
          View Full History
          <i class="pi pi-arrow-right"></i>
        </a>
      </div>
    </app-card>

    <!-- Log Measurement Dialog -->
    <p-dialog
      header="Log Body Composition"
      [(visible)]="showLogDialog"
      [modal]="true"
      [style]="{ width: '450px', maxWidth: '95vw' }"
      [contentStyle]="{ maxHeight: 'calc(80dvh - 140px)', overflowY: 'auto' }"
      styleClass="body-comp-dialog"
      [closable]="true"
    >
      <div class="measurement-form">
        <p class="form-description">
          Enter your body composition measurements. Weight is required, other
          fields are optional.
        </p>

        <!-- Weight (Required) -->
        <div class="form-field">
          <label for="weight">Weight (kg) *</label>
          <p-inputNumber
            id="weight"
            [(ngModel)]="measurementForm.weight"
            [minFractionDigits]="1"
            [maxFractionDigits]="1"
            mode="decimal"
            placeholder="e.g., 75.5"
            styleClass="w-full"
          ></p-inputNumber>
        </div>

        <!-- Body Fat -->
        <div class="form-field">
          <label for="bodyFat">Body Fat (%)</label>
          <p-inputNumber
            id="bodyFat"
            [(ngModel)]="measurementForm.bodyFat"
            [minFractionDigits]="1"
            [maxFractionDigits]="1"
            mode="decimal"
            [min]="1"
            [max]="60"
            placeholder="e.g., 15.0"
            styleClass="w-full"
          ></p-inputNumber>
        </div>

        <!-- Muscle Mass -->
        <div class="form-field">
          <label for="muscleMass">Muscle Mass (kg)</label>
          <p-inputNumber
            id="muscleMass"
            [(ngModel)]="measurementForm.muscleMass"
            [minFractionDigits]="1"
            [maxFractionDigits]="1"
            mode="decimal"
            placeholder="e.g., 35.0"
            styleClass="w-full"
          ></p-inputNumber>
        </div>

        <!-- Body Water -->
        <div class="form-field">
          <label for="bodyWater">Body Water (%)</label>
          <p-inputNumber
            id="bodyWater"
            [(ngModel)]="measurementForm.bodyWater"
            [minFractionDigits]="1"
            [maxFractionDigits]="1"
            mode="decimal"
            [min]="30"
            [max]="80"
            placeholder="e.g., 55.0"
            styleClass="w-full"
          ></p-inputNumber>
        </div>

        <!-- BMR -->
        <div class="form-field">
          <label for="bmr">Basal Metabolic Rate (kcal)</label>
          <p-inputNumber
            id="bmr"
            [(ngModel)]="measurementForm.basalMetabolicRate"
            mode="decimal"
            [min]="800"
            [max]="4000"
            placeholder="e.g., 1800"
            styleClass="w-full"
          ></p-inputNumber>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <app-button variant="text" (clicked)="showLogDialog = false">
          Cancel
        </app-button>
        <app-button
          iconLeft="pi-check"
          [loading]="isSaving()"
          [disabled]="!measurementForm.weight"
          (clicked)="saveMeasurement()"
        >
          Save Measurement
        </app-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: "./body-composition-card.component.scss",
})
export class BodyCompositionCardComponent implements OnInit {
  private trainingService = inject(UnifiedTrainingService);
  private authService = inject(AuthService);
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
          ? `Failed to save: ${typeof result.error === 'string' ? result.error : (result.error as { message?: string })?.message || 'Unknown error'}`
          : "Failed to save measurement. Are you logged in?";
        this.logger.error("[BodyComposition] Save failed:", result?.error);
        this.toastService.error(errorMsg);
      }
    } catch (err) {
      this.isSaving.set(false);
      this.logger.error("[BodyComposition] Error saving measurement:", err);
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
