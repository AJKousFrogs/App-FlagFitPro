import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { SliderModule } from "primeng/slider";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-rest-timer",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, DialogModule, SliderModule, FormsModule],
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
          <div 
            class="progress-fill" 
            [style.width.%]="progressPercent()"
          ></div>
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
      position="bottom-right"
      styleClass="rest-timer-dialog"
    >
      <ng-template pTemplate="header">
        <div class="timer-header">
          <span class="timer-title">
            <i class="pi pi-clock"></i>
            Rest Timer
          </span>
          <div class="header-actions">
            <p-button
              icon="pi pi-minus"
              [text]="true"
              [rounded]="true"
              size="small"
              (onClick)="minimize()"
              pTooltip="Minimize"
            ></p-button>
            <p-button
              icon="pi pi-times"
              [text]="true"
              [rounded]="true"
              size="small"
              (onClick)="close()"
              pTooltip="Close"
            ></p-button>
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
              (onChange)="onCustomDurationChange()"
            ></p-slider>
          </div>
        }

        <!-- Controls -->
        <div class="timer-controls">
          @if (!isRunning()) {
            <p-button
              label="Start"
              icon="pi pi-play"
              (onClick)="start()"
              styleClass="w-full"
            ></p-button>
          } @else {
            <p-button
              [label]="isPaused() ? 'Resume' : 'Pause'"
              [icon]="isPaused() ? 'pi pi-play' : 'pi pi-pause'"
              (onClick)="togglePause()"
              [outlined]="true"
            ></p-button>
            <p-button
              label="Reset"
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              (onClick)="reset()"
            ></p-button>
            <p-button
              label="+30s"
              icon="pi pi-plus"
              severity="secondary"
              [text]="true"
              (onClick)="addTime(30)"
            ></p-button>
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
            <span>{{ isMuted() ? 'Sound Off' : 'Sound On' }}</span>
          </button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    /* Floating Timer Button */
    .floating-timer {
      position: fixed;
      bottom: 80px;
      right: var(--space-4);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-3);
      background: var(--color-brand-primary);
      color: white;
      border: none;
      border-radius: var(--p-border-radius);
      cursor: pointer;
      box-shadow: var(--shadow-lg);
      min-width: 100px;
      transition: all 0.2s ease;
    }

    .floating-timer:hover {
      transform: scale(1.05);
    }

    .floating-timer.warning {
      background: var(--color-status-warning);
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .floating-content {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .floating-time {
      font-size: 1.25rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .floating-progress {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      margin-top: var(--space-2);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: white;
      transition: width 0.5s linear;
    }

    /* Timer Dialog */
    :host ::ng-deep .rest-timer-dialog {
      .p-dialog-header {
        padding: var(--space-3);
      }
      
      .p-dialog-content {
        padding: 0 var(--space-4) var(--space-4);
      }
    }

    .timer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .timer-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: var(--space-1);
    }

    .timer-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    /* Timer Display */
    .timer-display {
      position: relative;
      width: 200px;
      height: 200px;
      margin: 0 auto;
    }

    .progress-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-ring-bg {
      stroke: var(--p-surface-200);
    }

    .progress-ring-fill {
      stroke: var(--color-brand-primary);
      transition: stroke-dashoffset 0.5s linear;
    }

    .timer-display.warning .progress-ring-fill {
      stroke: var(--color-status-warning);
    }

    .timer-display.finished .progress-ring-fill {
      stroke: var(--color-status-success);
    }

    .timer-text {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .time-value {
      font-size: 3rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text-primary);
      line-height: 1;
    }

    .timer-display.warning .time-value {
      color: var(--color-status-warning);
    }

    .timer-display.finished .time-value {
      color: var(--color-status-success);
    }

    .time-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: var(--space-1);
    }

    /* Time Presets */
    .time-presets {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-2);
    }

    .preset-btn {
      padding: var(--space-2);
      border: 1px solid var(--p-surface-300);
      background: var(--surface-primary);
      border-radius: var(--p-border-radius);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .preset-btn:hover {
      border-color: var(--color-brand-primary);
      background: var(--color-brand-light);
    }

    .preset-btn.active {
      border-color: var(--color-brand-primary);
      background: var(--color-brand-primary);
      color: white;
    }

    /* Custom Duration */
    .custom-duration {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .custom-duration label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Controls */
    .timer-controls {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
    }

    /* Sound Toggle */
    .sound-toggle {
      display: flex;
      justify-content: center;
    }

    .sound-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      border-radius: var(--p-border-radius);
      transition: all 0.2s ease;
    }

    .sound-btn:hover {
      background: var(--p-surface-100);
    }

    .sound-btn.muted {
      color: var(--color-status-error);
    }

    @media (max-width: 768px) {
      .floating-timer {
        bottom: 140px;
      }
    }
  `],
})
export class RestTimerComponent implements OnDestroy {
  @Input() defaultDuration = 60; // seconds
  @Output() timerComplete = new EventEmitter<void>();
  @Output() timerClosed = new EventEmitter<void>();

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
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins}m`;
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
    this.remainingSeconds.update(v => v + seconds);
    this.selectedDuration.update(v => v + seconds);
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
    this.isMuted.update(v => !v);
  }

  private startInterval(): void {
    this.clearInterval();
    
    this.intervalId = setInterval(() => {
      this.remainingSeconds.update(v => {
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
    if (this.isMinimized() && "Notification" in window && Notification.permission === "granted") {
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
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
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
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
      
      // Play second note
      setTimeout(() => {
        const osc2 = this.audioContext!.createOscillator();
        const gain2 = this.audioContext!.createGain();
        
        osc2.connect(gain2);
        gain2.connect(this.audioContext!.destination);
        
        osc2.frequency.value = 659.25; // E5
        osc2.type = "sine";
        
        gain2.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.5);
        
        osc2.start(this.audioContext!.currentTime);
        osc2.stop(this.audioContext!.currentTime + 0.5);
      }, 150);
    } catch {
      // Audio not supported
    }
  }
}
