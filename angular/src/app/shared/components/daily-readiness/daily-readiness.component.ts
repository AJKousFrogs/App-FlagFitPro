/**
 * Daily Readiness Component
 *
 * Phase 1: Quick daily check-in for athletes before Merlin AI coaching
 *
 * Features:
 * - 4 sliders: Pain, Fatigue, Sleep Quality, Motivation (0-10)
 * - Auto-computed readiness score
 * - Saves via /api/wellness/checkin (single source of truth)
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
import { CardShellComponent } from "../card-shell/card-shell.component";
import { AppDialogComponent } from "../dialog/dialog.component";
import { DialogFooterComponent } from "../dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../dialog-header/dialog-header.component";

import { AuthService } from "../../../core/services/auth.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ProfileCompletionService } from "../../../core/services/profile-completion.service";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";
import { DailyReadinessFormContentComponent } from "./daily-readiness-form-content.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardShellComponent,
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    DailyReadinessFormContentComponent,
  ],
  template: `
    @if (mode() === "modal") {
      <app-dialog
        [(visible)]="dialogVisible"
        [modal]="true"
        [closable]="false"
        [draggable]="false"
        [resizable]="false"
        [dismissableMask]="true"
        [blockScroll]="true"
        [styleClass]="'dialog-w-xl dialog-max-w-md'"
        [ariaLabel]="'Daily Check-in'"
        (onHide)="onSkip()"
      >
        <app-dialog-header
          icon="heart-fill"
          title="Daily Check-in"
          subtitle="Quick recovery check before training"
          (close)="onSkip()"
        />

        <app-daily-readiness-form-content
          [state]="state()"
          [readinessScore]="readinessScore()"
          [readinessClass]="readinessClass()"
          [readinessHint]="readinessHint()"
          [riskFlags]="riskFlags()"
          [lastWeight]="lastWeight()"
          (sliderChange)="onSliderStateChange($event)"
          (weightChange)="onWeightChange($event)"
        />

        <app-dialog-footer
          cancelLabel="Skip for now"
          primaryLabel="Save Check-in"
          primaryIcon="check"
          [loading]="saving()"
          [disabled]="saving()"
          (cancel)="onSkip()"
          (primary)="saveState()"
        />
      </app-dialog>
    } @else {
      <app-card-shell
        class="readiness-card"
        title="Daily Check-in"
        headerIcon="pi-heart-fill"
        [hasFooter]="true"
      >
        <span
          header-actions
          class="readiness-badge"
          [class]="readinessClass()"
        >
          {{ readinessLabel() }}
        </span>

        <app-daily-readiness-form-content
          [state]="state()"
          [readinessScore]="readinessScore()"
          [readinessClass]="readinessClass()"
          [readinessHint]="readinessHint()"
          [riskFlags]="riskFlags()"
          [lastWeight]="lastWeight()"
          (sliderChange)="onSliderStateChange($event)"
          (weightChange)="onWeightChange($event)"
        />

        <div footer class="card-footer">
          <app-button
            iconLeft="pi-check"
            [loading]="saving()"
            [disabled]="saving()"
            (clicked)="saveState()"
          >
            Save
          </app-button>
        </div>
      </app-card-shell>
    }
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
        .get(`/api/wellness/checkin?date=${today}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (!extractApiPayload(response)) {
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

  onStateChange<K extends keyof DailyState>(key: K, value: DailyState[K]): void {
    this.state.update((s) => ({ ...s, [key]: value }));
  }

  onSliderChange(
    key: Exclude<keyof DailyState, "weight_kg">,
    value: number | number[] | null | undefined,
  ): void {
    const nextValue = Array.isArray(value) ? value[0] : value;
    this.onStateChange(key, typeof nextValue === "number" ? nextValue : 0);
  }

  onWeightChange(value: number | null | undefined): void {
    this.onStateChange("weight_kg", typeof value === "number" ? value : null);
  }

  /**
   * Save the daily state via /api/wellness/checkin (single source of truth)
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
      notes: `Quick check-in via Merlin AI prompt`,
      // readinessScore will be calculated server-side
    };

    // POST to /api/wellness/checkin (UPSERT on user_id, checkin_date)
    this.api
      .post(API_ENDPOINTS.wellness.checkin, wellnessPayload)
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

  onSliderStateChange(change: {
    key: Exclude<keyof DailyState, "weight_kg">;
    value: number | number[] | null | undefined;
  }): void {
    this.onSliderChange(change.key, change.value);
  }

  /**
   * Handle skip action
   */
  onSkip(): void {
    this.dialogVisible = false;
    this.skipped.emit();
  }
}
