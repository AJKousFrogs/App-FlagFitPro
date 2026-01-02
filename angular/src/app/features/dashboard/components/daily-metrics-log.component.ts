import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { TextareaModule } from "primeng/textarea";
import { ToastService } from "../../../core/services/toast.service";
import { PerformanceDataService } from "../../../core/services/performance-data.service";
import { WellnessService } from "../../../core/services/wellness.service";
import { AuthService } from "../../../core/services/auth.service";

interface DailyMetrics {
  // Body Composition (from scale)
  totalWeight: number | null;
  bodyWaterMass: number | null;
  fatMass: number | null;
  boneMineralContent: number | null;
  proteinMass: number | null;
  muscleMass: number | null;
  musclePercentage: number | null;
  bodyWaterPercentage: number | null;
  proteinPercentage: number | null;
  boneMineralPercentage: number | null;
  skeletalMuscleMass: number | null;
  visceralFatRating: number | null;
  basalMetabolicRate: number | null;
  waistToHipRatio: number | null;
  bodyAge: number | null;

  // Sleep
  sleepScore: number | null; // 0-100
  sleepHours: number | null;
  sleepQuality: number | null; // 1-10

  // Optional notes
  notes: string;
}

/**
 * Daily Metrics Log Component
 * 
 * PLAIN IMPLEMENTATION - Design tokens to be applied later
 * 
 * Allows athletes to log daily body composition from smart scales
 * (like the one in the screenshot) plus sleep data.
 */
@Component({
  selector: "app-daily-metrics-log",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputNumberModule,
    TextareaModule,
  ],
  template: `
    <p-dialog
      header="Daily Metrics Log"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '600px', maxHeight: '90vh' }"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      (onHide)="onClose()"
    >
      <div class="daily-metrics-form">
        <!-- Quick Entry Section -->
        <div class="section">
          <h3 class="section-title">Quick Entry</h3>
          <p class="section-description">
            Enter your daily weight and sleep score for fast tracking
          </p>

          <div class="form-row">
            <div class="form-field">
              <label for="totalWeight">Total Weight (kg) *</label>
              <p-inputNumber
                inputId="totalWeight"
                [(ngModel)]="metrics.totalWeight"
                [min]="40"
                [max]="200"
                [minFractionDigits]="1"
                [maxFractionDigits]="1"
                mode="decimal"
                [step]="0.1"
                placeholder="70.5"
                styleClass="w-full"
              />
            </div>

            <div class="form-field">
              <label for="sleepScore">Sleep Score (%) *</label>
              <p-inputNumber
                inputId="sleepScore"
                [(ngModel)]="metrics.sleepScore"
                [min]="0"
                [max]="100"
                suffix="%"
                placeholder="85"
                styleClass="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Body Composition Section -->
        <div class="section">
          <h3 class="section-title">
            Body Composition
            <span class="optional-badge">(Optional - from smart scale)</span>
          </h3>

          <!-- Mass Values (kg) -->
          <div class="subsection">
            <h4 class="subsection-title">Mass Values</h4>
            <div class="form-grid">
              <div class="form-field">
                <label for="bodyWaterMass">Body Water Mass (kg)</label>
                <p-inputNumber
                  inputId="bodyWaterMass"
                  [(ngModel)]="metrics.bodyWaterMass"
                  [min]="0"
                  [maxFractionDigits]="1"
                  mode="decimal"
                  placeholder="52.5"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="fatMass">Fat Mass (kg)</label>
                <p-inputNumber
                  inputId="fatMass"
                  [(ngModel)]="metrics.fatMass"
                  [min]="0"
                  [maxFractionDigits]="1"
                  mode="decimal"
                  placeholder="22.7"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="proteinMass">Protein Mass (kg)</label>
                <p-inputNumber
                  inputId="proteinMass"
                  [(ngModel)]="metrics.proteinMass"
                  [min]="0"
                  [maxFractionDigits]="1"
                  mode="decimal"
                  placeholder="13.2"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="boneMineralContent">Bone Mineral (kg)</label>
                <p-inputNumber
                  inputId="boneMineralContent"
                  [(ngModel)]="metrics.boneMineralContent"
                  [min]="0"
                  [maxFractionDigits]="1"
                  mode="decimal"
                  placeholder="3.9"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="muscleMass">Muscle Mass (kg)</label>
                <p-inputNumber
                  inputId="muscleMass"
                  [(ngModel)]="metrics.muscleMass"
                  [min]="0"
                  [maxFractionDigits]="1"
                  mode="decimal"
                  placeholder="66.5"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="skeletalMuscleMass">Skeletal Muscle (kg)</label>
                <p-inputNumber
                  inputId="skeletalMuscleMass"
                  [(ngModel)]="metrics.skeletalMuscleMass"
                  [min]="0"
                  [maxFractionDigits]="1"
                  mode="decimal"
                  placeholder="38.5"
                  styleClass="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Percentage Values -->
          <div class="subsection">
            <h4 class="subsection-title">Percentage Values</h4>
            <div class="form-grid">
              <div class="form-field">
                <label for="musclePercentage">Muscle %</label>
                <p-inputNumber
                  inputId="musclePercentage"
                  [(ngModel)]="metrics.musclePercentage"
                  [min]="0"
                  [max]="100"
                  [maxFractionDigits]="1"
                  suffix="%"
                  placeholder="71.4"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="bodyWaterPercentage">Body Water %</label>
                <p-inputNumber
                  inputId="bodyWaterPercentage"
                  [(ngModel)]="metrics.bodyWaterPercentage"
                  [min]="0"
                  [max]="100"
                  [maxFractionDigits]="1"
                  suffix="%"
                  placeholder="56.4"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="proteinPercentage">Protein %</label>
                <p-inputNumber
                  inputId="proteinPercentage"
                  [(ngModel)]="metrics.proteinPercentage"
                  [min]="0"
                  [max]="100"
                  [maxFractionDigits]="1"
                  suffix="%"
                  placeholder="14.2"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="boneMineralPercentage">Bone Mineral %</label>
                <p-inputNumber
                  inputId="boneMineralPercentage"
                  [(ngModel)]="metrics.boneMineralPercentage"
                  [min]="0"
                  [max]="100"
                  [maxFractionDigits]="1"
                  suffix="%"
                  placeholder="4.2"
                  styleClass="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Advanced Metrics -->
          <div class="subsection">
            <h4 class="subsection-title">Advanced Metrics</h4>
            <div class="form-grid">
              <div class="form-field">
                <label for="visceralFatRating">Visceral Fat Rating</label>
                <p-inputNumber
                  inputId="visceralFatRating"
                  [(ngModel)]="metrics.visceralFatRating"
                  [min]="1"
                  [max]="59"
                  placeholder="10"
                  styleClass="w-full"
                />
                <small class="field-hint">1-12: Standard, 13-59: High</small>
              </div>

              <div class="form-field">
                <label for="basalMetabolicRate">Basal Metabolic Rate (kcal)</label>
                <p-inputNumber
                  inputId="basalMetabolicRate"
                  [(ngModel)]="metrics.basalMetabolicRate"
                  [min]="800"
                  [max]="5000"
                  placeholder="1891"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="waistToHipRatio">Waist-to-Hip Ratio</label>
                <p-inputNumber
                  inputId="waistToHipRatio"
                  [(ngModel)]="metrics.waistToHipRatio"
                  [min]="0.5"
                  [max]="2.0"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  placeholder="1.1"
                  styleClass="w-full"
                />
              </div>

              <div class="form-field">
                <label for="bodyAge">Body Age (years)</label>
                <p-inputNumber
                  inputId="bodyAge"
                  [(ngModel)]="metrics.bodyAge"
                  [min]="10"
                  [max]="100"
                  placeholder="35"
                  styleClass="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Sleep Details Section -->
        <div class="section">
          <h3 class="section-title">Sleep Details</h3>

          <div class="form-row">
            <div class="form-field">
              <label for="sleepHours">Hours Slept</label>
              <p-inputNumber
                inputId="sleepHours"
                [(ngModel)]="metrics.sleepHours"
                [min]="0"
                [max]="24"
                [maxFractionDigits]="1"
                mode="decimal"
                placeholder="7.5"
                styleClass="w-full"
              />
            </div>

            <div class="form-field">
              <label for="sleepQuality">Sleep Quality (1-10)</label>
              <p-inputNumber
                inputId="sleepQuality"
                [(ngModel)]="metrics.sleepQuality"
                [min]="1"
                [max]="10"
                placeholder="7"
                styleClass="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="section">
          <div class="form-field">
            <label for="notes">Notes</label>
            <textarea
              pInputTextarea
              id="notes"
              [(ngModel)]="metrics.notes"
              rows="3"
              placeholder="Any observations about today's measurements..."
              class="w-full"
            ></textarea>
          </div>
        </div>

        <!-- Data Source Help -->
        <div class="help-section">
          <p class="help-text">
            <strong>💡 Tip:</strong> Connect a smart scale (like Xiaomi Mi Body
            Composition Scale) for automatic tracking of all body composition metrics.
          </p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button
            label="Cancel"
            severity="secondary"
            [text]="true"
            (onClick)="onCancel()"
            [disabled]="isSubmitting()"
          />
          <p-button
            label="Save Metrics"
            icon="pi pi-check"
            (onClick)="onSubmit()"
            [loading]="isSubmitting()"
            [disabled]="!isValid()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './daily-metrics-log.component.scss',
})
export class DailyMetricsLogComponent {
  private toastService = inject(ToastService);
  private performanceDataService = inject(PerformanceDataService);
  private wellnessService = inject(WellnessService);
  private authService = inject(AuthService);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  visible = true;
  isSubmitting = signal(false);

  metrics: DailyMetrics = {
    totalWeight: null,
    bodyWaterMass: null,
    fatMass: null,
    boneMineralContent: null,
    proteinMass: null,
    muscleMass: null,
    musclePercentage: null,
    bodyWaterPercentage: null,
    proteinPercentage: null,
    boneMineralPercentage: null,
    skeletalMuscleMass: null,
    visceralFatRating: null,
    basalMetabolicRate: null,
    waistToHipRatio: null,
    bodyAge: null,
    sleepScore: null,
    sleepHours: null,
    sleepQuality: null,
    notes: "",
  };

  isValid(): boolean {
    // At minimum, need weight and sleep score
    return this.metrics.totalWeight !== null && this.metrics.sleepScore !== null;
  }

  onCancel(): void {
    this.visible = false;
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  async onSubmit(): Promise<void> {
    if (!this.isValid()) {
      this.toastService.error("Please enter at least weight and sleep score");
      return;
    }

    this.isSubmitting.set(true);

    try {
      const user = this.authService.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Save body composition data to physical_measurements table
      if (this.metrics.totalWeight !== null) {
        await this.performanceDataService
          .logMeasurement({
            weight: this.metrics.totalWeight,
            height: 0, // Height not tracked in daily log
            bodyFat: this.metrics.fatMass || undefined,
            muscleMass: this.metrics.muscleMass || undefined,
            bodyWaterMass: this.metrics.bodyWaterMass || undefined,
            proteinMass: this.metrics.proteinMass || undefined,
            boneMineralContent: this.metrics.boneMineralContent || undefined,
            skeletalMuscleMass: this.metrics.skeletalMuscleMass || undefined,
            musclePercentage: this.metrics.musclePercentage || undefined,
            bodyWaterPercentage: this.metrics.bodyWaterPercentage || undefined,
            proteinPercentage: this.metrics.proteinPercentage || undefined,
            boneMineralPercentage: this.metrics.boneMineralPercentage || undefined,
            visceralFatRating: this.metrics.visceralFatRating || undefined,
            basalMetabolicRate: this.metrics.basalMetabolicRate || undefined,
            waistToHipRatio: this.metrics.waistToHipRatio || undefined,
            bodyAge: this.metrics.bodyAge || undefined,
            notes: this.metrics.notes || undefined,
            timestamp: new Date().toISOString(),
          })
          .toPromise();
      }

      // Save sleep data to wellness_entries table
      if (this.metrics.sleepScore !== null) {
        await this.wellnessService.logWellness({
          sleepHours: this.metrics.sleepHours || undefined,
          sleep: this.metrics.sleepQuality || undefined, // Map sleepQuality to sleep (1-10 rating)
          sleepScore: this.metrics.sleepScore,
          notes: this.metrics.notes || undefined,
        });
      }

      this.toastService.success("Daily metrics saved successfully!");
      this.visible = false;
      this.saved.emit();
    } catch (error) {
      console.error("Error saving daily metrics:", error);
      this.toastService.error(
        "Failed to save metrics. Please try again."
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
