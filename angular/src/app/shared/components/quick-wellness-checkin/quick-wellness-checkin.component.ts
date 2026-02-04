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

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

// PrimeNG
import { ButtonComponent } from "../button/button.component";
import { Checkbox } from "primeng/checkbox";
import { InputNumber } from "primeng/inputnumber";
import { Textarea } from "primeng/textarea";
import { AppDialogComponent } from "../dialog/dialog.component";

// Services
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { WellnessService } from "../../../core/services/wellness.service";

@Component({
  selector: "app-quick-wellness-checkin",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppDialogComponent,
    InputNumber,
    Checkbox,
    Textarea,

    ButtonComponent,
  ],
  template: `
    <app-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      styleClass="quick-checkin-dialog dialog-w-xl dialog-max-w-md"
      (hide)="onClose()"
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
              variant="filled"
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
          <app-button
            iconLeft="pi-check"
            [loading]="isSubmitting()"
            [disabled]="!canSubmit()"
            (clicked)="submit()"
            >Submit Check-in</app-button
          >

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
    </app-dialog>
  `,
  styleUrl: "./quick-wellness-checkin.component.scss",
})
export class QuickWellnessCheckinComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
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

      this.wellnessService
        .logWellness(wellnessData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.updateStreak();
              this.toastService.success(TOAST.SUCCESS.CHECKIN_SAVED);
              this.submitted.emit();
              this.visible = false;
            } else {
              this.toastService.error(response.error || TOAST.ERROR.SAVE_FAILED);
            }
            this.isSubmitting.set(false);
          },
          error: (err) => {
            this.logger.error("Error submitting quick check-in:", err);
            this.toastService.error(TOAST.ERROR.CHECKIN_SAVE_FAILED);
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
