import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { Slider } from "primeng/slider";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";

@Component({
  selector: "app-rest-timer",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DialogModule,
    Slider,
    FormsModule,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <!-- Floating Timer Button (when minimized) -->
    @if (isMinimized() && isRunning()) {
      <button
        class="floating-timer"
        [class.warning]="remainingSeconds() <= 10"
        (click)="maximize()"
      >
        <div class="floating-content">
          <i class="pi pi-clock"></i>
          <span class="floating-time">{{ formattedTime() }}</span>
        </div>
        <div class="floating-progress">
          <div class="progress-fill" [style.width.%]="progressPercent()"></div>
        </div>
      </button>
    }

    <!-- Timer Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="false"
      [draggable]="true"
      [resizable]="false"
      [closable]="false"
      [style]="{ width: '320px' }"
      position="bottomright"
      styleClass="rest-timer-dialog"
    >
      <ng-template pTemplate="header">
        <div class="timer-header">
          <span class="timer-title">
            <i class="pi pi-clock"></i>
            Rest Timer
          </span>
          <div class="header-actions">
            <app-icon-button
              icon="pi-minus"
              variant="text"
              size="sm"
              (clicked)="minimize()"
              ariaLabel="minus"
            />
            <app-icon-button
              icon="pi-times"
              variant="text"
              size="sm"
              (clicked)="close()"
              ariaLabel="times"
            />
          </div>
        </div>
      </ng-template>

      <div class="timer-body">
        <!-- Timer Display -->
        <div
          class="timer-display"
          [class.running]="isRunning()"
          [class.warning]="remainingSeconds() <= 10 && isRunning()"
          [class.finished]="remainingSeconds() === 0"
        >
          <svg class="progress-ring" viewBox="0 0 120 120">
            <circle
              class="progress-ring-bg"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke-width="8"
            />
            <circle
              class="progress-ring-fill"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke-width="8"
              [style.stroke-dasharray]="circumference"
              [style.stroke-dashoffset]="strokeDashoffset()"
            />
          </svg>
          <div class="timer-text">
            <span class="time-value">{{ formattedTime() }}</span>
            <span class="time-label">{{ timerLabel() }}</span>
          </div>
        </div>

        <!-- Quick Time Presets -->
        @if (!isRunning()) {
          <div class="time-presets">
            @for (preset of presets; track preset) {
              <button
                class="preset-btn"
                [class.active]="selectedDuration() === preset"
                (click)="setDuration(preset)"
              >
                {{ formatPreset(preset) }}
              </button>
            }
          </div>

          <!-- Custom Duration Slider -->
          <div class="custom-duration">
            <label>Custom: {{ selectedDuration() }}s</label>
            <p-slider
              [(ngModel)]="customDuration"
              [min]="10"
              [max]="300"
              [step]="5"
              (onValueChange)="onCustomDurationChange()"
            ></p-slider>
          </div>
        }

        <!-- Controls -->
        <div class="timer-controls">
          @if (!isRunning()) {
            <app-button iconLeft="pi-play" (clicked)="start()"
              >Start</app-button
            >
          } @else {
            <app-button
              variant="outlined"
              (clicked)="togglePause()"
            ></app-button>
            <app-button
              variant="outlined"
              iconLeft="pi-refresh"
              (clicked)="reset()"
              >Reset</app-button
            >
            <app-button
              variant="text"
              iconLeft="pi-plus"
              (clicked)="addTime(30)"
              >+30s</app-button
            >
          }
        </div>

        <!-- Sound Toggle -->
        <div class="sound-toggle">
          <button
            class="sound-btn"
            [class.muted]="isMuted()"
            (click)="toggleMute()"
          >
            <i [class]="isMuted() ? 'pi pi-volume-off' : 'pi pi-volume-up'"></i>
            <span>{{ isMuted() ? "Sound Off" : "Sound On" }}</span>
          </button>
        </div>
      </div>
    </p-dialog>
  `,
  styleUrl: "./rest-timer.component.scss",
})
export class RestTimerComponent implements OnDestroy {
  readonly defaultDuration = input<number>(60); // seconds
  readonly timerComplete = output<void>();
  readonly timerClosed = output<void>();

  dialogVisible = true;
  customDuration = 60;

  isRunning = signal(false);
  isPaused = signal(false);
  isMinimized = signal(false);
  isMuted = signal(false);
  selectedDuration = signal(60);
  remainingSeconds = signal(60);

  presets = [30, 60, 90, 120];
  circumference = 2 * Math.PI * 54; // 2πr where r=54

  private intervalId?: ReturnType<typeof setInterval>;
  private audioContext?: AudioContext;

  formattedTime = computed(() => {
    const seconds = this.remainingSeconds();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  });

  timerLabel = computed(() => {
    if (this.remainingSeconds() === 0) return "Rest Complete!";
    if (this.isPaused()) return "Paused";
    if (this.isRunning()) return "Resting...";
    return "Ready";
  });

  progressPercent = computed(() => {
    const total = this.selectedDuration();
    const remaining = this.remainingSeconds();
    return ((total - remaining) / total) * 100;
  });

  strokeDashoffset = computed(() => {
    const progress = this.progressPercent() / 100;
    return this.circumference * (1 - progress);
  });

  ngOnDestroy(): void {
    this.clearInterval();
  }

  setDuration(seconds: number): void {
    this.selectedDuration.set(seconds);
    this.remainingSeconds.set(seconds);
    this.customDuration = seconds;
  }

  onCustomDurationChange(): void {
    this.selectedDuration.set(this.customDuration);
    this.remainingSeconds.set(this.customDuration);
  }

  formatPreset(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `${mins}m`;
  }

  start(): void {
    this.isRunning.set(true);
    this.isPaused.set(false);
    this.startInterval();
  }

  togglePause(): void {
    if (this.isPaused()) {
      this.isPaused.set(false);
      this.startInterval();
    } else {
      this.isPaused.set(true);
      this.clearInterval();
    }
  }

  reset(): void {
    this.clearInterval();
    this.isRunning.set(false);
    this.isPaused.set(false);
    this.remainingSeconds.set(this.selectedDuration());
  }

  addTime(seconds: number): void {
    this.remainingSeconds.update((v) => v + seconds);
    this.selectedDuration.update((v) => v + seconds);
  }

  minimize(): void {
    this.isMinimized.set(true);
    this.dialogVisible = false;
  }

  maximize(): void {
    this.isMinimized.set(false);
    this.dialogVisible = true;
  }

  close(): void {
    this.clearInterval();
    this.dialogVisible = false;
    this.timerClosed.emit();
  }

  toggleMute(): void {
    this.isMuted.update((v) => !v);
  }

  private startInterval(): void {
    this.clearInterval();

    this.intervalId = setInterval(() => {
      this.remainingSeconds.update((v) => {
        if (v <= 1) {
          this.onTimerComplete();
          return 0;
        }

        // Play tick sound at 10 seconds
        if (v <= 11 && v > 1 && !this.isMuted()) {
          this.playTickSound();
        }

        return v - 1;
      });
    }, 1000);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private onTimerComplete(): void {
    this.clearInterval();
    this.isRunning.set(false);

    if (!this.isMuted()) {
      this.playCompleteSound();
    }

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    this.timerComplete.emit();

    // Show notification if minimized
    if (
      this.isMinimized() &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Rest Timer Complete", {
        body: "Time to get back to your workout!",
        icon: "/assets/icons/icon-192x192.png",
        tag: "rest-timer",
      });
    }
  }

  private playTickSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.1,
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch {
      // Audio not supported
    }
  }

  private playCompleteSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 523.25; // C5
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.5,
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);

      // Play second note
      setTimeout(() => {
        if (!this.audioContext) return;
        const ctx = this.audioContext;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.frequency.value = 659.25; // E5
        osc2.type = "sine";

        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      }, 150);
    } catch {
      // Audio not supported
    }
  }
}
