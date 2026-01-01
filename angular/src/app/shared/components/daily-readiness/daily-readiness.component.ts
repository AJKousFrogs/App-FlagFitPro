/**
 * Daily Readiness Component
 *
 * Phase 1: Quick daily check-in for athletes before AI coaching
 *
 * Features:
 * - 4 sliders: Pain, Fatigue, Sleep Quality, Motivation (0-10)
 * - Auto-computed readiness score
 * - Saves to athlete_daily_state table
 * - Can be shown as modal or inline card
 * - "Skip for now" option with gentle reminder
 */

import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { SliderModule } from "primeng/slider";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import { ProgressBarModule } from "primeng/progressbar";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";

interface DailyState {
  pain_level: number;
  fatigue_level: number;
  sleep_quality: number;
  motivation_level: number;
}

@Component({
  selector: "app-daily-readiness",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    SliderModule,
    DialogModule,
    TooltipModule,
    ProgressBarModule,
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
            <p-button
              label="Skip for now"
              [text]="true"
              severity="secondary"
              (onClick)="onSkip()"
            ></p-button>
            <p-button
              label="Save Check-in"
              icon="pi pi-check"
              [loading]="saving()"
              [disabled]="saving()"
              (onClick)="saveState()"
            ></p-button>
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
            <p-button
              label="Save"
              icon="pi pi-check"
              [loading]="saving()"
              [disabled]="saving()"
              (onClick)="saveState()"
            ></p-button>
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
              (onChange)="updateState()"
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
              (onChange)="updateState()"
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
              (onChange)="updateState()"
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
              (onChange)="updateState()"
            ></p-slider>
            <div class="slider-labels">
              <span>Low</span>
              <span>High</span>
            </div>
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
  styles: [
    `
      .readiness-card {
        max-width: 400px;
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4);
      }

      .card-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        font-size: var(--text-base);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .card-header h3 i {
        color: var(--ds-primary-green, #089949);
      }

      .readiness-badge {
        padding: 4px 12px;
        border-radius: var(--radius-xl);
        font-size: var(--text-xs);
        font-weight: var(--font-weight-semibold);
      }

      .readiness-badge.excellent {
        background: rgba(8, 153, 73, 0.1);
        color: #089949;
      }

      .readiness-badge.good {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      .readiness-badge.moderate {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }

      .readiness-badge.low {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      .readiness-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .score-display {
        text-align: center;
        padding: var(--space-4) 0;
      }

      .score-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-3);
        border: 3px solid;
      }

      .score-circle.excellent {
        border-color: #089949;
        background: rgba(8, 153, 73, 0.05);
      }

      .score-circle.good {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.05);
      }

      .score-circle.moderate {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.05);
      }

      .score-circle.low {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.05);
      }

      .score-value {
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .score-label {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .score-hint {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }

      .slider-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .slider-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .slider-header label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .slider-header label i {
        color: var(--color-text-secondary);
        font-size: var(--text-base);
      }

      .slider-value {
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
      }

      .slider-value.danger {
        color: #ef4444;
      }

      .slider-value.good {
        color: #089949;
      }

      .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      .risk-flags {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: rgba(245, 158, 11, 0.1);
        border-radius: var(--radius-lg);
        font-size: var(--text-sm);
        color: #b45309;
      }

      .risk-flags i {
        color: #f59e0b;
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
      }

      .card-footer {
        display: flex;
        justify-content: flex-end;
        padding-top: var(--space-3);
      }

      :host ::ng-deep .p-slider {
        height: 6px;
      }

      :host ::ng-deep .p-slider .p-slider-range {
        background: var(--ds-primary-green, #089949);
      }

      :host ::ng-deep .p-slider .p-slider-handle {
        width: 18px;
        height: 18px;
        border: 2px solid var(--ds-primary-green, #089949);
        background: white;
      }

      :host ::ng-deep .p-slider .p-slider-handle:hover {
        background: var(--ds-primary-green, #089949);
        border-color: var(--ds-primary-green, #089949);
      }
    `,
  ],
})
export class DailyReadinessComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  @Input() mode = signal<"modal" | "card">("modal");
  @Input() showOnInit = true;

  @Output() completed = new EventEmitter<DailyState>();
  @Output() skipped = new EventEmitter<void>();

  dialogVisible = false;
  saving = signal(false);

  state = signal<DailyState>({
    pain_level: 0,
    fatigue_level: 3,
    sleep_quality: 7,
    motivation_level: 7,
  });

  // Computed readiness score (0-100)
  readinessScore = computed(() => {
    const s = this.state();
    // Invert pain and fatigue (lower is better)
    // Keep sleep and motivation as-is (higher is better)
    const score =
      ((10 - s.pain_level) * 0.3 +
        (10 - s.fatigue_level) * 0.25 +
        s.sleep_quality * 0.25 +
        s.motivation_level * 0.2) *
      10;
    return Math.round(Math.max(0, Math.min(100, score)));
  });

  // Readiness class for styling
  readinessClass = computed(() => {
    const score = this.readinessScore();
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "moderate";
    return "low";
  });

  // Readiness label
  readinessLabel = computed(() => {
    const score = this.readinessScore();
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Moderate";
    return "Low";
  });

  // Readiness hint text
  readinessHint = computed(() => {
    const score = this.readinessScore();
    if (score >= 80) return "Great condition for training!";
    if (score >= 60) return "Good to train with some awareness";
    if (score >= 40) return "Consider lighter activity today";
    return "Recovery day recommended";
  });

  // Risk flags
  riskFlags = computed(() => {
    const s = this.state();
    const flags: string[] = [];
    if (s.pain_level >= 7) flags.push("High pain");
    if (s.fatigue_level >= 7) flags.push("High fatigue");
    if (s.sleep_quality <= 3) flags.push("Poor sleep");
    if (s.motivation_level <= 3) flags.push("Low motivation");
    return flags;
  });

  ngOnInit(): void {
    if (this.showOnInit && this.mode() === "modal") {
      this.checkAndShowPrompt();
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
      const { data: existingState } = await this.supabaseService.client
        .from("athlete_daily_state")
        .select("id")
        .eq("user_id", user.id)
        .eq("state_date", today)
        .single();

      if (!existingState) {
        this.dialogVisible = true;
      }
    } catch {
      // No state for today, show prompt
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
   * Save the daily state to database
   */
  async saveState(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error("Please log in to save your check-in");
      return;
    }

    this.saving.set(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const stateData = {
        user_id: user.id,
        state_date: today,
        pain_level: this.state().pain_level,
        fatigue_level: this.state().fatigue_level,
        sleep_quality: this.state().sleep_quality,
        motivation_level: this.state().motivation_level,
        source: "ai_prompt",
      };

      // Upsert (insert or update if exists)
      const { error } = await this.supabaseService.client
        .from("athlete_daily_state")
        .upsert(stateData, {
          onConflict: "user_id,state_date",
        });

      if (error) throw error;

      this.toastService.success("Check-in saved!");
      this.dialogVisible = false;
      this.completed.emit(this.state());
    } catch (error) {
      this.logger.error("Error saving daily state:", error);
      this.toastService.error("Failed to save check-in. Please try again.");
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Handle skip action
   */
  onSkip(): void {
    this.dialogVisible = false;
    this.skipped.emit();
  }
}
