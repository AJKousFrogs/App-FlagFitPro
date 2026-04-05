/**
 * Daily Readiness Component
 *
 * Phase 1: Quick daily check-in for athletes before Merlin AI coaching
 *
 * Features:
 * - 4 sliders: Pain, Fatigue, Sleep Quality, Motivation (0-10)
 * - Auto-computed readiness score
 * - Saves via Supabase RPC `upsert_wellness_checkin`
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
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../button/button.component";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { AppDialogComponent } from "../dialog/dialog.component";
import { DialogFooterComponent } from "../dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../dialog-header/dialog-header.component";

import { TOAST } from "../../../core/constants/toast-messages.constants";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ProfileCompletionService } from "../../../core/services/profile-completion.service";
import {
  AcwrCalculationResult,
  WellnessService,
} from "../../../core/services/wellness.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { DailyReadinessFormContentComponent } from "./daily-readiness-form-content.component";
import { firstValueFrom } from "rxjs";

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
          [acwrResult]="acwrSnapshot()"
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
          [acwrResult]="acwrSnapshot()"
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
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private profileCompletionService = inject(ProfileCompletionService);
  private wellnessService = inject(WellnessService);

  /** Prevents duplicate saves before `saving` signal updates the view. */
  private saveLocked = false;

  readonly mode = input<"modal" | "card">("modal");
  readonly showOnInit = input<boolean>(true);

  readonly completed = output<DailyState>();
  readonly skipped = output<void>();

  dialogVisible = false;
  saving = signal(false);
  lastWeight = signal<number | null>(null);
  /** Latest ACWR from `calculate_acwr` after a successful save. */
  acwrSnapshot = signal<AcwrCalculationResult | null>(null);

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
    const userId = this.supabase.userId();
    if (!userId) return;

    try {
      await this.supabase.waitForInit();
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await this.supabase.client
        .from("daily_wellness_checkin")
        .select("id")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .maybeSingle();

      if (error) {
        this.dialogVisible = true;
        return;
      }
      if (!data) {
        this.dialogVisible = true;
      }
    } catch {
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
   * Save via `upsert_wellness_checkin` RPC; refresh ACWR via `calculate_acwr`.
   * Maps: pain_level → soreness, fatigue → energy (inverted).
   */
  async saveState(): Promise<void> {
    if (this.saveLocked) {
      return;
    }

    const userId = this.supabase.userId();
    if (!userId) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_SAVE);
      return;
    }

    this.saveLocked = true;
    this.saving.set(true);

    const previous = { ...this.state() };
    const today = new Date().toISOString().split("T")[0];
    const state = this.state();

    try {
      const logResult = await firstValueFrom(
        this.wellnessService.logWellness({
          date: today,
          sleep: state.sleep_quality,
          sleepHours: 7,
          energy: 10 - state.fatigue_level,
          soreness: state.pain_level,
          stress: 5,
          sorenessAreas: state.pain_level > 3 ? ["general"] : [],
          notes: `Quick check-in via Merlin AI prompt`,
          readinessScore: this.readinessScore(),
        }),
      );

      if (!logResult.success) {
        throw new Error(logResult.error || "Failed to save check-in");
      }

      if (state.weight_kg && state.weight_kg > 0) {
        await this.profileCompletionService.updateWeight(state.weight_kg);
        this.logger.info(
          `[DailyReadiness] Weight updated: ${state.weight_kg} kg`,
        );
      }

      const acwrResult = await firstValueFrom(
        this.wellnessService.calculateAcwr(),
      );
      if (acwrResult.success && acwrResult.data) {
        this.acwrSnapshot.set(acwrResult.data);
      }

      this.toastService.success(TOAST.SUCCESS.DAILY_CHECKIN_SAVED);
      this.dialogVisible = false;
      this.completed.emit(this.state());
    } catch (error: unknown) {
      this.state.set(previous);
      this.logger.error("Error saving wellness entry:", error);

      let errorMessage = "Failed to save check-in.";
      const err = error as { code?: string; message?: string };

      if (err?.code === "PGRST116" || err?.message?.includes("401")) {
        errorMessage = "Permission denied. Please log out and log back in.";
      } else if (
        err?.code === "23505" ||
        err?.message?.includes("already exists")
      ) {
        errorMessage =
          "You've already submitted a check-in today. Refresh to see it.";
      } else if (
        err?.message?.includes("network") ||
        err?.message?.includes("fetch")
      ) {
        errorMessage = "Network error. Check your connection and try again.";
      } else if (err?.code === "42P01") {
        errorMessage = "System configuration error. Please contact support.";
      } else if (typeof err?.message === "string" && err.message.length > 0) {
        errorMessage = err.message;
      }

      this.toastService.error(errorMessage);
    } finally {
      this.saveLocked = false;
      this.saving.set(false);
    }
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
