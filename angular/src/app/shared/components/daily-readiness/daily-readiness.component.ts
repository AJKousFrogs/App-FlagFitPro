/**
 * Daily Readiness Component
 *
 * Phase 1: Quick daily check-in for athletes before AI coaching
 *
 * Features:
 * - 4 sliders: Pain, Fatigue, Sleep Quality, Motivation (0-10)
 * - Auto-computed readiness score
 * - Saves via /api/wellness-checkin (single source of truth)
 * - Can be shown as modal or inline card
 * - "Skip for now" option with gentle reminder
 */

import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  input,
  output,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../button/button.component";
import { PrimeTemplate } from "primeng/api";
import { Card } from "primeng/card";
import { Slider } from "primeng/slider";
import { Dialog } from "primeng/dialog";

import { AuthService } from "../../../core/services/auth.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ProfileCompletionService } from "../../../core/services/profile-completion.service";
import { InputNumber } from "primeng/inputnumber";
import { ApiService } from "../../../core/services/api.service";

// Centralized wellness constants
import {
  WELLNESS,
  computeDailyReadiness,
  getReadinessLevel,
  getRiskFlags,
} from "../../../core/constants/wellness.constants";

interface DailyState {
  pain_level: number;
  fatigue_level: number;
  sleep_quality: number;
  motivation_level: number;
  weight_kg: number | null;
}

@Component({
  selector: "app-daily-readiness",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Slider,
    Dialog,
    PrimeTemplate,
    PrimeTemplate,
    InputNumber,
    ButtonComponent,
  ],
  template: `
    @if (mode() === "modal") {
      <p-dialog
        [header]="'Daily Check-in'"
        [(visible)]="dialogVisible"
        [modal]="true"
        [closable]="true"
        [dismissableMask]="true"
        [style]="{ width: '420px', maxWidth: '95vw' }"
        (onHide)="onSkip()"
      >
        <ng-container *ngTemplateOutlet="formContent"></ng-container>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <app-button variant="text" (clicked)="onSkip()"
              >Skip for now</app-button
            >
            <app-button
              iconLeft="pi-check"
              [loading]="saving()"
              [disabled]="saving()"
              (clicked)="saveState()"
              >Save Check-in</app-button
            >
          </div>
        </ng-template>
      </p-dialog>
    } @else {
      <p-card class="readiness-card">
        <ng-template pTemplate="header">
          <div class="card-header">
            <h3>
              <i class="pi pi-heart-fill"></i>
              Daily Check-in
            </h3>
            <span class="readiness-badge" [class]="readinessClass()">
              {{ readinessLabel() }}
            </span>
          </div>
        </ng-template>

        <ng-container *ngTemplateOutlet="formContent"></ng-container>

        <ng-template pTemplate="footer">
          <div class="card-footer">
            <app-button
              iconLeft="pi-check"
              [loading]="saving()"
              [disabled]="saving()"
              (clicked)="saveState()"
              >Save</app-button
            >
          </div>
        </ng-template>
      </p-card>
    }

    <!-- Shared form content template -->
    <ng-template #formContent>
      <div class="readiness-form">
        <!-- Readiness Score Display -->
        <div class="score-display">
          <div class="score-circle" [class]="readinessClass()">
            <span class="score-value">{{ readinessScore() }}</span>
            <span class="score-label">Ready</span>
          </div>
          <p class="score-hint">{{ readinessHint() }}</p>
        </div>

        <!-- Sliders -->
        <div class="slider-group">
          <!-- Pain Level -->
          <div class="slider-item">
            <div class="slider-header">
              <label>
                <i class="pi pi-exclamation-circle"></i>
                Pain Level
              </label>
              <span
                class="slider-value"
                [class.danger]="state().pain_level >= 7"
              >
                {{ state().pain_level }}/10
              </span>
            </div>
            <p-slider
              [(ngModel)]="state().pain_level"
              [min]="0"
              [max]="10"
              [step]="1"
              (onValueChange)="updateState()"
            ></p-slider>
            <div class="slider-labels">
              <span>No pain</span>
              <span>Severe</span>
            </div>
          </div>

          <!-- Fatigue Level -->
          <div class="slider-item">
            <div class="slider-header">
              <label>
                <i class="pi pi-moon"></i>
                Fatigue
              </label>
              <span
                class="slider-value"
                [class.danger]="state().fatigue_level >= 7"
              >
                {{ state().fatigue_level }}/10
              </span>
            </div>
            <p-slider
              [(ngModel)]="state().fatigue_level"
              [min]="0"
              [max]="10"
              [step]="1"
              (onValueChange)="updateState()"
            ></p-slider>
            <div class="slider-labels">
              <span>Energized</span>
              <span>Exhausted</span>
            </div>
          </div>

          <!-- Sleep Quality -->
          <div class="slider-item">
            <div class="slider-header">
              <label>
                <i class="pi pi-star"></i>
                Sleep Quality
              </label>
              <span
                class="slider-value"
                [class.good]="state().sleep_quality >= 7"
              >
                {{ state().sleep_quality }}/10
              </span>
            </div>
            <p-slider
              [(ngModel)]="state().sleep_quality"
              [min]="0"
              [max]="10"
              [step]="1"
              (onValueChange)="updateState()"
            ></p-slider>
            <div class="slider-labels">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          <!-- Motivation -->
          <div class="slider-item">
            <div class="slider-header">
              <label>
                <i class="pi pi-bolt"></i>
                Motivation
              </label>
              <span
                class="slider-value"
                [class.good]="state().motivation_level >= 7"
              >
                {{ state().motivation_level }}/10
              </span>
            </div>
            <p-slider
              [(ngModel)]="state().motivation_level"
              [min]="0"
              [max]="10"
              [step]="1"
              (onValueChange)="updateState()"
            ></p-slider>
            <div class="slider-labels">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <!-- Weight (Optional) -->
          <div class="slider-item weight-input form-controls-full">
            <div class="slider-header">
              <label>
                <i class="pi pi-chart-line"></i>
                Today's Weight
                <span class="optional-label">(optional)</span>
              </label>
            </div>
            <p-inputNumber
              [(ngModel)]="state().weight_kg"
              [suffix]="' kg'"
              [min]="30"
              [max]="200"
              [step]="0.1"
              [showButtons]="true"
              [buttonLayout]="'horizontal'"
              inputStyleClass="weight-input-field"
              incrementButtonClass="weight-btn"
              decrementButtonClass="weight-btn"
              incrementButtonIcon="pi pi-plus"
              decrementButtonIcon="pi pi-minus"
              placeholder="Enter weight"
              (onInput)="updateState()"
            ></p-inputNumber>
            <p class="weight-hint">
              @if (lastWeight()) {
                Last: {{ lastWeight() }} kg
              } @else {
                Track daily for hydration & recovery insights
              }
            </p>
          </div>
        </div>

        <!-- Risk Flags -->
        @if (riskFlags().length > 0) {
          <div class="risk-flags">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ riskFlags().join(", ") }}</span>
          </div>
        }
      </div>
    </ng-template>
  `,
  styleUrl: "./daily-readiness.component.scss",
})
export class DailyReadinessComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private profileCompletionService = inject(ProfileCompletionService);
  private destroyRef = inject(DestroyRef);

  readonly mode = input<"modal" | "card">("modal");
  readonly showOnInit = input<boolean>(true);

  readonly completed = output<DailyState>();
  readonly skipped = output<void>();

  dialogVisible = false;
  saving = signal(false);
  lastWeight = signal<number | null>(null);

  state = signal<DailyState>({
    pain_level: WELLNESS.DEFAULT_PAIN_LEVEL,
    fatigue_level: WELLNESS.DEFAULT_FATIGUE_LEVEL,
    sleep_quality: WELLNESS.DEFAULT_SLEEP_QUALITY,
    motivation_level: WELLNESS.DEFAULT_MOTIVATION_LEVEL,
    weight_kg: null,
  });

  // Computed readiness score (0-100) using centralized calculation
  readinessScore = computed(() => {
    const s = this.state();
    return computeDailyReadiness(
      s.pain_level,
      s.fatigue_level,
      s.sleep_quality,
      s.motivation_level,
    );
  });

  // Readiness class for styling - uses centralized level config
  readinessClass = computed(() => {
    return getReadinessLevel(this.readinessScore()).cssClass;
  });

  // Readiness label - uses centralized level config
  readinessLabel = computed(() => {
    return getReadinessLevel(this.readinessScore()).label;
  });

  // Readiness hint text - uses centralized level config
  readinessHint = computed(() => {
    return getReadinessLevel(this.readinessScore()).hint;
  });

  // Risk flags - uses centralized thresholds
  riskFlags = computed(() => {
    return getRiskFlags(this.state());
  });

  ngOnInit(): void {
    // Load last recorded weight for reference
    this.loadLastWeight();

    if (this.showOnInit() && this.mode() === "modal") {
      this.checkAndShowPrompt();
    }
  }

  /**
   * Load last recorded weight to display as reference
   */
  private async loadLastWeight(): Promise<void> {
    const weight = await this.profileCompletionService.getCurrentWeight();
    if (weight) {
      this.lastWeight.set(weight);
      // Pre-fill with last weight as starting point
      this.state.update((s) => ({ ...s, weight_kg: weight }));
    }
  }

  /**
   * Check if user has already submitted today's state
   * If not, show the prompt
   */
  async checkAndShowPrompt(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      // Check daily_wellness_checkin via API (single source of truth)
      this.api
        .get(`/api/wellness-checkin?date=${today}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response?.data === null || !response?.data) {
              this.dialogVisible = true;
            }
          },
          error: () => {
            // No entry for today, show prompt
            this.dialogVisible = true;
          },
        });
    } catch {
      // No entry for today, show prompt
      this.dialogVisible = true;
    }
  }

  /**
   * Show the modal (can be called externally)
   */
  show(): void {
    this.dialogVisible = true;
  }

  /**
   * Update state signal (called on slider change)
   */
  updateState(): void {
    // Trigger reactivity by creating new object
    this.state.update((s) => ({ ...s }));
  }

  /**
   * Save the daily state via /api/wellness-checkin (single source of truth)
   * Maps: pain_level → muscleSoreness, fatigue_level → energyLevel (inverted)
   * Also saves weight to body_measurements and users table
   */
  async saveState(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_SAVE);
      return;
    }

    this.saving.set(true);

    const today = new Date().toISOString().split("T")[0];
    const state = this.state();

    // Map daily check-in fields to wellness checkin API format
    // pain_level (0-10 where 10 is severe) → muscleSoreness (0-10)
    // fatigue_level (0-10 where 10 is exhausted) → energyLevel (inverted: 10 - fatigue)
    const wellnessPayload = {
      date: today,
      sleepQuality: state.sleep_quality,
      sleepHours: 7, // Default if not captured
      energyLevel: 10 - state.fatigue_level, // Invert: high fatigue = low energy
      muscleSoreness: state.pain_level,
      stressLevel: 5, // Default neutral if not captured
      sorenessAreas: state.pain_level > 3 ? ["general"] : [],
      notes: `Quick check-in via AI Coach prompt`,
      // readinessScore will be calculated server-side
    };

    // POST to /api/wellness-checkin (UPSERT on user_id, checkin_date)
    this.api
      .post("/api/wellness-checkin", wellnessPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async () => {
          // Save weight if provided (updates both body_measurements for history + users for profile)
          if (state.weight_kg && state.weight_kg > 0) {
            await this.profileCompletionService.updateWeight(state.weight_kg);
            this.logger.info(
              `[DailyReadiness] Weight updated: ${state.weight_kg} kg`,
            );
          }

          this.toastService.success(TOAST.SUCCESS.DAILY_CHECKIN_SAVED);
          this.dialogVisible = false;
          this.completed.emit(this.state());
          this.saving.set(false);
        },
        error: (error: unknown) => {
          this.logger.error("Error saving wellness entry:", error);

          // Provide user-friendly error messages based on error type
          let errorMessage = "Failed to save check-in.";

          const err = error as { code?: string; message?: string };

          if (err?.code === "PGRST116" || err?.message?.includes("401")) {
            // Authentication error
            errorMessage = "Permission denied. Please log out and log back in.";
          } else if (
            err?.code === "23505" ||
            err?.message?.includes("already exists")
          ) {
            // Unique constraint violation - entry already exists
            errorMessage =
              "You've already submitted a check-in today. Refresh to see it.";
          } else if (
            err?.message?.includes("network") ||
            err?.message?.includes("fetch")
          ) {
            errorMessage =
              "Network error. Check your connection and try again.";
          } else if (err?.code === "42P01") {
            // Table doesn't exist
            errorMessage =
              "System configuration error. Please contact support.";
          } else {
            errorMessage =
              "Failed to save check-in. Please try again in a moment.";
          }

          this.toastService.error(errorMessage);
          this.saving.set(false);
        },
      });
  }

  /**
   * Handle skip action
   */
  onSkip(): void {
    this.dialogVisible = false;
    this.skipped.emit();
  }
}
