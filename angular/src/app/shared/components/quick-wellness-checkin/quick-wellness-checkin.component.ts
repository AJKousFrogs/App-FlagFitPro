/**
 * Quick Wellness Check-in Component
 *
 * Streamlined 30-second check-in with only essential fields:
 * - Overall feeling (1-10)
 * - Sleep hours
 * - Pain/soreness flag
 *
 * For athletes who need a fast daily check-in
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  inject,
  signal,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

// PrimeNG
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { Slider } from "primeng/slider";
import { InputNumberModule } from "primeng/inputnumber";
import { CheckboxModule } from "primeng/checkbox";
import { Textarea } from "primeng/textarea";

// Services
import { WellnessService } from "../../../core/services/wellness.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-quick-wellness-checkin",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DialogModule,
    ButtonModule,
    Slider,
    InputNumberModule,
    CheckboxModule,
    Textarea,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [style]="{ width: '420px', maxWidth: '95vw' }"
      [showHeader]="false"
      styleClass="quick-checkin-dialog"
      (onHide)="onClose()"
    >
      <div class="quick-checkin">
        <!-- Header -->
        <div class="checkin-header">
          <div class="header-icon">
            <i class="pi pi-bolt"></i>
          </div>
          <h2>Quick Check-in</h2>
          <p class="time-estimate">~30 seconds</p>
        </div>

        <!-- Step 1: Overall Feeling -->
        <div class="checkin-field">
          <label>How do you feel overall today?</label>
          <div class="feeling-scale">
            <div class="scale-labels">
              <span>😫 Terrible</span>
              <span>😐 Okay</span>
              <span>🔥 Great</span>
            </div>
            <div class="scale-buttons">
              @for (num of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track num) {
                <button
                  class="scale-btn"
                  [class.selected]="overallFeeling === num"
                  [class.low]="num <= 3"
                  [class.mid]="num >= 4 && num <= 6"
                  [class.high]="num >= 7"
                  (click)="overallFeeling = num"
                >
                  {{ num }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Step 2: Sleep -->
        <div class="checkin-field">
          <label>How much did you sleep last night?</label>
          <div class="sleep-input">
            <p-inputNumber
              [(ngModel)]="sleepHours"
              [min]="0"
              [max]="14"
              [minFractionDigits]="1"
              [maxFractionDigits]="1"
              [showButtons]="true"
              suffix=" hrs"
              styleClass="sleep-number"
            ></p-inputNumber>
            <div class="sleep-quality-indicator">
              @if (sleepHours >= 8) {
                <span class="quality good">✓ Great</span>
              } @else if (sleepHours >= 7) {
                <span class="quality okay">Good</span>
              } @else if (sleepHours >= 6) {
                <span class="quality low">Could be better</span>
              } @else if (sleepHours > 0) {
                <span class="quality poor">Low - prioritize rest</span>
              }
            </div>
          </div>
        </div>

        <!-- Step 3: Pain/Soreness -->
        <div class="checkin-field">
          <div class="pain-question">
            <p-checkbox
              [(ngModel)]="hasPain"
              [binary]="true"
              inputId="hasPain"
            ></p-checkbox>
            <label for="hasPain">Any pain or unusual soreness?</label>
          </div>

          @if (hasPain) {
            <div class="pain-details animate-slide-down">
              <textarea
                pInputTextarea
                [(ngModel)]="painNotes"
                placeholder="Where? Describe briefly..."
                [rows]="2"
                [autoResize]="true"
              ></textarea>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="checkin-actions">
          <p-button
            label="Submit Check-in"
            icon="pi pi-check"
            [loading]="isSubmitting()"
            [disabled]="!canSubmit()"
            (onClick)="submit()"
            styleClass="submit-btn"
          ></p-button>

          <a
            routerLink="/wellness"
            class="full-checkin-link"
            (click)="visible = false"
          >
            Need full check-in? →
          </a>
        </div>

        <!-- Streak Indicator -->
        @if (currentStreak > 0) {
          <div class="streak-indicator">
            <i class="pi pi-fire"></i>
            <span>{{ currentStreak }} day streak! Keep it up!</span>
          </div>
        }
      </div>
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep .quick-checkin-dialog .p-dialog-content {
        padding: 0;
        border-radius: 16px;
        overflow: hidden;
      }

      .quick-checkin {
        padding: var(--space-6);
      }

      /* Header */
      .checkin-header {
        text-align: center;
        margin-bottom: var(--space-6);
      }

      .header-icon {
        width: 56px;
        height: 56px;
        background: var(--color-brand-light);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-3);
      }

      .header-icon i {
        font-size: 1.5rem;
        color: var(--color-brand-primary);
      }

      .checkin-header h2 {
        margin: 0 0 var(--space-1) 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .time-estimate {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      /* Fields */
      .checkin-field {
        margin-bottom: var(--space-5);
      }

      .checkin-field > label {
        display: block;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-3);
      }

      /* Feeling Scale */
      .feeling-scale {
        background: var(--p-surface-50);
        border-radius: 12px;
        padding: var(--space-4);
      }

      .scale-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .scale-buttons {
        display: flex;
        gap: var(--space-1);
      }

      .scale-btn {
        flex: 1;
        aspect-ratio: 1;
        border: 2px solid var(--p-surface-200);
        border-radius: 8px;
        background: white;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
      }

      .scale-btn:hover {
        border-color: var(--p-surface-300);
      }

      .scale-btn.selected {
        color: white;
      }

      .scale-btn.selected.low {
        background: var(--p-red-500);
        border-color: var(--p-red-500);
      }

      .scale-btn.selected.mid {
        background: var(--p-orange-500);
        border-color: var(--p-orange-500);
      }

      .scale-btn.selected.high {
        background: var(--p-green-500);
        border-color: var(--p-green-500);
      }

      /* Sleep Input */
      .sleep-input {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      :host ::ng-deep .sleep-number {
        width: 140px;
      }

      .sleep-quality-indicator {
        flex: 1;
      }

      .quality {
        font-size: 0.875rem;
        font-weight: 500;
        padding: var(--space-2) var(--space-3);
        border-radius: 8px;
      }

      .quality.good {
        background: var(--p-green-50);
        color: var(--p-green-700);
      }

      .quality.okay {
        background: var(--p-blue-50);
        color: var(--p-blue-700);
      }

      .quality.low {
        background: var(--p-orange-50);
        color: var(--p-orange-700);
      }

      .quality.poor {
        background: var(--p-red-50);
        color: var(--p-red-700);
      }

      /* Pain Question */
      .pain-question {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .pain-question label {
        font-weight: 500;
        color: var(--text-primary);
        cursor: pointer;
      }

      .pain-details {
        margin-top: var(--space-3);
      }

      .pain-details textarea {
        width: 100%;
        padding: var(--space-3);
        border: 1px solid var(--p-surface-300);
        border-radius: 8px;
        font-size: 0.875rem;
        resize: none;
      }

      .animate-slide-down {
        animation: slideDown 0.2s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Actions */
      .checkin-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
      }

      :host ::ng-deep .submit-btn {
        width: 100%;
        justify-content: center;
      }

      .full-checkin-link {
        font-size: 0.875rem;
        color: var(--color-brand-primary);
        text-decoration: none;
      }

      .full-checkin-link:hover {
        text-decoration: underline;
      }

      /* Streak */
      .streak-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        margin-top: var(--space-4);
        padding: var(--space-3);
        background: var(--p-orange-50);
        border-radius: 8px;
        color: var(--p-orange-700);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .streak-indicator i {
        color: var(--p-orange-500);
      }

      /* Responsive */
      @media (max-width: 480px) {
        .scale-btn {
          font-size: 0.75rem;
        }

        .sleep-input {
          flex-direction: column;
          align-items: stretch;
        }

        :host ::ng-deep .sleep-number {
          width: 100%;
        }
      }
    `,
  ],
})
export class QuickWellnessCheckinComponent {
  private router = inject(Router);
  private wellnessService = inject(WellnessService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  // Inputs
  showOnLoad = input<boolean>(false);

  // Outputs
  submitted = output<void>();
  closed = output<void>();

  // State
  visible = true;
  isSubmitting = signal(false);

  // Form data
  overallFeeling = 7;
  sleepHours = 7.5;
  hasPain = false;
  painNotes = "";

  // Streak tracking
  currentStreak = 0;

  constructor() {
    this.loadStreak();
  }

  canSubmit(): boolean {
    return this.overallFeeling > 0 && this.sleepHours > 0;
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    try {
      // Map quick check-in to full wellness data
      const wellnessData = {
        sleep: this.sleepHours,
        energy: this.overallFeeling,
        mood: this.overallFeeling,
        stress: Math.max(1, 11 - this.overallFeeling), // Inverse
        soreness: this.hasPain ? 6 : 2,
        notes:
          this.hasPain && this.painNotes
            ? `Pain: ${this.painNotes}`
            : undefined,
        date: new Date().toISOString().split("T")[0],
      };

      this.wellnessService.logWellness(wellnessData).subscribe({
        next: (response) => {
          if (response.success) {
            this.updateStreak();
            this.toastService.success("Check-in saved! 💪");
            this.submitted.emit();
            this.visible = false;
          } else {
            this.toastService.error(response.error || "Failed to save");
          }
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.logger.error("Error submitting quick check-in:", err);
          this.toastService.error("Failed to save check-in");
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      this.logger.error("Error in quick check-in submit:", error);
      this.isSubmitting.set(false);
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  private loadStreak(): void {
    try {
      const streakData = localStorage.getItem("wellness-streak");
      if (streakData) {
        const { count, lastDate } = JSON.parse(streakData);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const lastCheckIn = new Date(lastDate);

        // Check if streak is still valid (checked in yesterday)
        if (lastCheckIn.toDateString() === yesterday.toDateString()) {
          this.currentStreak = count;
        } else if (lastCheckIn.toDateString() === new Date().toDateString()) {
          // Already checked in today
          this.currentStreak = count;
        }
      }
    } catch (error) {
      this.logger.error("Error loading streak:", error);
    }
  }

  private updateStreak(): void {
    try {
      const today = new Date().toISOString().split("T")[0];
      const streakData = localStorage.getItem("wellness-streak");

      if (streakData) {
        const { count, lastDate } = JSON.parse(streakData);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const lastCheckIn = new Date(lastDate);

        if (lastCheckIn.toDateString() === yesterday.toDateString()) {
          // Continue streak
          this.currentStreak = count + 1;
        } else if (lastCheckIn.toDateString() !== new Date().toDateString()) {
          // Reset streak
          this.currentStreak = 1;
        }
      } else {
        this.currentStreak = 1;
      }

      localStorage.setItem(
        "wellness-streak",
        JSON.stringify({
          count: this.currentStreak,
          lastDate: today,
        }),
      );
    } catch (error) {
      this.logger.error("Error updating streak:", error);
    }
  }
}
