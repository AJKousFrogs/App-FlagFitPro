/**
 * Countdown Timer Component
 *
 * A beautiful countdown/rest timer with visual feedback.
 * Perfect for rest periods, pre-game countdowns, interval training, etc.
 *
 * Features:
 * - Circular progress visualization
 * - Audio cues (optional)
 * - Haptic feedback simulation
 * - Color transitions as time runs low
 * - Play/pause/reset controls
 * - Preset time options
 *
 * @example
 * <app-countdown-timer
 *   [initialSeconds]="60"
 *   [autoStart]="false"
 *   (timerComplete)="onRestComplete()"
 * />
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconButtonComponent } from "../button/icon-button.component";

@Component({
  selector: "app-countdown-timer",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="countdown-timer" [class]="'status-' + status()">
      <!-- Progress ring -->
      <div class="timer-ring">
        <svg viewBox="0 0 100 100" class="ring-svg">
          <!-- Background track -->
          <circle
            class="ring-track"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke-width="6"
          />
          <!-- Progress -->
          <circle
            class="ring-progress"
            [class]="'status-' + status()"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke-width="6"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset()"
          />
        </svg>

        <!-- Timer display -->
        <div class="timer-display">
          <span class="timer-time" [class]="'status-' + status()">
            {{ formattedTime() }}
          </span>
          <span class="timer-label">
            @if (isRunning()) {
              {{ label() || "remaining" }}
            } @else if (isComplete()) {
              Complete!
            } @else {
              {{ label() || "ready" }}
            }
          </span>
        </div>

        <!-- Pulse animation when low -->
        @if (status() === "danger" && isRunning()) {
          <div class="pulse-ring"></div>
        }
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        @if (!isRunning() && !isComplete()) {
          <app-icon-button
            icon="pi-play"
            variant="success"
            (clicked)="start()"
            ariaLabel="play"
          />
        }

        @if (isRunning()) {
          <app-icon-button
            icon="pi-pause"
            (clicked)="pause()"
            ariaLabel="pause"
          />
        }

        @if (secondsRemaining() !== initialSeconds() || isComplete()) {
          <app-icon-button
            icon="pi-refresh"
            variant="outlined"
            (clicked)="reset()"
            ariaLabel="refresh"
          />
        }
      </div>

      <!-- Presets -->
      @if (showPresets() && !isRunning()) {
        <div class="timer-presets">
          @for (preset of presets(); track preset) {
            <button
              class="preset-btn"
              [class.active]="initialSeconds() === preset"
              (click)="setPreset(preset)"
            >
              {{ formatPreset(preset) }}
            </button>
          }
        </div>
      }

      <!-- Progress bar (alternative display) -->
      @if (showProgressBar()) {
        <div class="progress-bar-container">
          <div
            class="progress-bar"
            [class]="'status-' + status()"
            [style.width.%]="progressPercentage()"
          ></div>
        </div>
      }
    </div>
  `,
  styleUrl: "./countdown-timer.component.scss",
})
export class CountdownTimerComponent implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Inputs
  initialSeconds = input<number>(60);
  autoStart = input<boolean>(false);
  label = input<string>("");
  showPresets = input<boolean>(true);
  showProgressBar = input<boolean>(false);
  presets = input<number[]>([30, 60, 90, 120, 180]);
  warningThreshold = input<number>(30); // Seconds remaining to show warning
  dangerThreshold = input<number>(10); // Seconds remaining to show danger
  playSound = input<boolean>(false);

  // Outputs
  timerComplete = output<void>();
  timerTick = output<number>();
  timerStart = output<void>();
  timerPause = output<void>();
  timerReset = output<void>();

  // State
  secondsRemaining = signal(60);
  isRunning = signal(false);
  isComplete = signal(false);

  // Constants - protected for template access
  protected readonly circumference = 2 * Math.PI * 45;

  // Computed
  dashOffset = computed(() => {
    const progress = this.secondsRemaining() / this.initialSeconds();
    return this.circumference * (1 - progress);
  });

  progressPercentage = computed(() => {
    return (this.secondsRemaining() / this.initialSeconds()) * 100;
  });

  status = computed<"success" | "warning" | "danger" | "complete">(() => {
    if (this.isComplete()) return "complete";
    const remaining = this.secondsRemaining();
    if (remaining <= this.dangerThreshold()) return "danger";
    if (remaining <= this.warningThreshold()) return "warning";
    return "success";
  });

  formattedTime = computed(() => {
    const total = this.secondsRemaining();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  });

  constructor() {
    // Initialize with input value
    effect(() => {
      if (!this.isRunning()) {
        this.secondsRemaining.set(this.initialSeconds());
      }
    });

    // Auto-start if enabled
    effect(() => {
      if (this.autoStart() && !this.isRunning() && !this.isComplete()) {
        this.start();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }

  start(): void {
    if (this.isRunning() || this.isComplete()) return;

    this.isRunning.set(true);
    this.timerStart.emit();

    this.intervalId = setInterval(() => {
      const current = this.secondsRemaining();

      if (current <= 1) {
        this.secondsRemaining.set(0);
        this.complete();
      } else {
        this.secondsRemaining.update((v) => v - 1);
        this.timerTick.emit(this.secondsRemaining());
      }
    }, 1000);
  }

  pause(): void {
    if (!this.isRunning()) return;

    this.clearInterval();
    this.isRunning.set(false);
    this.timerPause.emit();
  }

  reset(): void {
    this.clearInterval();
    this.isRunning.set(false);
    this.isComplete.set(false);
    this.secondsRemaining.set(this.initialSeconds());
    this.timerReset.emit();
  }

  setPreset(seconds: number): void {
    this.clearInterval();
    this.isRunning.set(false);
    this.isComplete.set(false);
    this.secondsRemaining.set(seconds);
  }

  formatPreset(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }

  private complete(): void {
    this.clearInterval();
    this.isRunning.set(false);
    this.isComplete.set(true);
    this.timerComplete.emit();

    // Play sound if enabled
    if (this.playSound()) {
      this.playCompletionSound();
    }
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playCompletionSound(): void {
    try {
      const audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  }
}
