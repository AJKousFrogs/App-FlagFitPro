/**
 * Exercise Card Component
 *
 * Displays a single exercise with:
 * - Video embed (YouTube iframe)
 * - Prescription badges (Sets/Reps/Hold)
 * - HOW/FEEL/COMPENSATION instruction text
 * - Progression context from yesterday
 * - Mark Complete button
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { CountdownTimerComponent } from "../../../../shared/components/countdown-timer/countdown-timer.component";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { formatDate } from "../../../../shared/utils/date.utils";

import {
  PrescribedExercise,
  formatPrescription,
} from "../daily-protocol.models";

@Component({
  selector: "app-exercise-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TagModule,
    TooltipModule,
    ButtonComponent,
    CountdownTimerComponent,
  ],
  template: `
    <div
      class="exercise-card"
      [class.completed]="exercise().status === 'complete'"
      [class.expanded]="isExpanded()"
      role="article"
      [attr.aria-label]="exercise().exercise.name"
    >
      <!-- Header Row -->
      <div class="exercise-header" (click)="toggleExpand()">
        <div class="exercise-title-row">
          <div class="status-indicator" [class]="exercise().status">
            @if (exercise().status === "complete") {
              <i class="pi pi-check"></i>
            } @else if (exercise().status === "skipped") {
              <i class="pi pi-minus"></i>
            } @else {
              <span class="status-number">{{ sequenceNumber() }}</span>
            }
          </div>
          <div class="title-content">
            <h4 class="exercise-name">{{ exercise().exercise.name }}</h4>
            <span class="prescription-summary">
              {{ prescriptionText() }}
            </span>
          </div>
          <button
            class="expand-toggle"
            [attr.aria-expanded]="isExpanded()"
            [attr.aria-label]="isExpanded() ? 'Collapse' : 'Expand'"
          >
            <i
              class="pi"
              [class.pi-chevron-down]="!isExpanded()"
              [class.pi-chevron-up]="isExpanded()"
            ></i>
          </button>
        </div>
      </div>

      <!-- Expanded Content -->
      @if (isExpanded()) {
        <div class="exercise-body">
          <!-- Video + Prescription Row -->
          <div class="video-prescription-row">
            <!-- Video Player -->
            <div class="video-container">
              @if (videoEmbedUrl()) {
                <iframe
                  [src]="videoEmbedUrl()"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="video-iframe"
                  [title]="exercise().exercise.name + ' demonstration'"
                ></iframe>
              } @else {
                <div class="video-placeholder">
                  <i class="pi pi-video"></i>
                  <span>Video coming soon</span>
                </div>
              }
              @if (exercise().exercise.videoUrl) {
                <a
                  [href]="exercise().exercise.videoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="youtube-link"
                >
                  <i class="pi pi-external-link"></i>
                  Open in YouTube
                </a>
              }
            </div>

            <!-- Prescription Badges -->
            <div class="prescription-panel">
              <h5 class="prescription-title">Today's Prescription</h5>
              <div class="prescription-badges">
                @if (exercise().prescribedSets) {
                  <div class="badge-item">
                    <span class="badge-value">{{
                      exercise().prescribedSets
                    }}</span>
                    <span class="badge-label">Sets</span>
                  </div>
                }
                @if (exercise().prescribedReps) {
                  <div class="badge-item">
                    <span class="badge-value">{{
                      exercise().prescribedReps
                    }}</span>
                    <span class="badge-label">Reps</span>
                  </div>
                }
                @if (exercise().prescribedHoldSeconds) {
                  <div class="badge-item">
                    <span class="badge-value"
                      >{{ exercise().prescribedHoldSeconds }}s</span
                    >
                    <span class="badge-label">Hold</span>
                  </div>
                }
                @if (exercise().prescribedDurationSeconds) {
                  <div class="badge-item">
                    <span class="badge-value">{{
                      formatDuration(exercise().prescribedDurationSeconds!)
                    }}</span>
                    <span class="badge-label">Duration</span>
                  </div>
                }
              </div>

              <!-- Progression Note -->
              @if (exercise().progressionNote) {
                <div class="progression-note">
                  <i class="pi pi-arrow-up"></i>
                  {{ exercise().progressionNote }}
                </div>
              }

              <!-- Yesterday's comparison -->
              @if (hasYesterdayData()) {
                <div class="yesterday-comparison">
                  <span class="yesterday-label">Yesterday:</span>
                  <span class="yesterday-value">{{ yesterdayText() }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Instructions Section -->
          <div class="instructions-section">
            <!-- HOW -->
            <div class="instruction-block how">
              <h5 class="instruction-label">
                <i class="pi pi-info-circle"></i>
                HOW
              </h5>
              <p class="instruction-text">{{ exercise().exercise.howText }}</p>
            </div>

            <!-- FEEL & COMPENSATION Row -->
            <div class="instruction-row">
              @if (exercise().exercise.feelText) {
                <div class="instruction-block feel">
                  <h5 class="instruction-label">
                    <i class="pi pi-heart"></i>
                    FEEL
                  </h5>
                  <p class="instruction-text">
                    {{ exercise().exercise.feelText }}
                  </p>
                </div>
              }

              @if (exercise().exercise.compensationText) {
                <div class="instruction-block compensation">
                  <h5 class="instruction-label">
                    <i class="pi pi-exclamation-triangle"></i>
                    COMPENSATION
                  </h5>
                  <p class="instruction-text">
                    {{ exercise().exercise.compensationText }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- AI Note -->
          @if (exercise().aiNote) {
            <div class="ai-note">
              <i class="pi pi-sparkles"></i>
              <span>{{ exercise().aiNote }}</span>
            </div>
          }

          <!-- Timer for Timed Exercises -->
          @if (
            exercise().prescribedDurationSeconds &&
            exercise().status !== "complete"
          ) {
            <div class="exercise-timer-section">
              <h5 class="timer-section-title">
                <i class="pi pi-clock"></i>
                Exercise Timer
              </h5>
              <app-countdown-timer
                [initialSeconds]="exercise().prescribedDurationSeconds!"
                [autoStart]="false"
                [showPresets]="false"
                [showProgressBar]="true"
                label="remaining"
                (timerComplete)="onTimerComplete()"
              />
            </div>
          }

          <!-- Action Row -->
          <div class="action-row">
            @if (exercise().status !== "complete") {
              <app-button
                iconLeft="pi-check"
                [loading]="isCompleting()"
                (clicked)="onComplete()"
                >Mark Complete</app-button
              >
              <app-button
                variant="outlined"
                iconLeft="pi-forward"
                (clicked)="onSkip()"
                >Skip</app-button
              >
            } @else {
              <div class="completed-badge">
                <i class="pi pi-check-circle"></i>
                <span>Completed</span>
                @if (exercise().completedAt) {
                  <span class="completed-time">
                    at {{ formatDate(exercise().completedAt!, "h:mm a") }}
                  </span>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: "./exercise-card.component.scss",
})
export class ExerciseCardComponent {
  // Inputs
  exercise = input.required<PrescribedExercise>();
  sequenceNumber = input<number>(1);

  // Outputs
  complete = output<PrescribedExercise>();
  skip = output<PrescribedExercise>();

  // Local state
  isExpanded = signal(false);
  isCompleting = signal(false);

  constructor(private sanitizer: DomSanitizer) {}

  // Computed
  prescriptionText = computed(() => formatPrescription(this.exercise()));

  videoEmbedUrl = computed((): SafeResourceUrl | null => {
    const videoId = this.exercise().exercise.videoId;
    if (!videoId) return null;

    const url = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  hasYesterdayData = computed(() => {
    const ex = this.exercise();
    return ex.yesterdaySets || ex.yesterdayReps || ex.yesterdayHoldSeconds;
  });

  yesterdayText = computed(() => {
    const ex = this.exercise();
    const parts: string[] = [];

    if (ex.yesterdaySets) {
      parts.push(`${ex.yesterdaySets} sets`);
    }
    if (ex.yesterdayReps) {
      parts.push(`${ex.yesterdayReps} reps`);
    }
    if (ex.yesterdayHoldSeconds) {
      parts.push(`${ex.yesterdayHoldSeconds}s hold`);
    }

    return parts.join(" × ");
  });

  // Methods
  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  onComplete(): void {
    this.isCompleting.set(true);
    this.complete.emit(this.exercise());
    // Parent will reset completing state
  }

  onSkip(): void {
    this.skip.emit(this.exercise());
  }

  /**
   * Handle timer completion - auto-mark exercise as complete
   */
  onTimerComplete(): void {
    // Auto-complete the exercise when timer finishes
    this.onComplete();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    return `${secs}s`;
  }

  formatDate(date: Date | string, formatStr?: string): string {
    return formatDate(date, formatStr || "h:mm a");
  }
}
