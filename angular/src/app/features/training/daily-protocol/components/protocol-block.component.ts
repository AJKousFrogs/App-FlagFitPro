/**
 * Protocol Block Component
 *
 * Wraps a group of exercises (Morning Mobility, Foam Roll, Main Session, etc.)
 * with:
 * - Expandable/collapsible header
 * - Progress tracking
 * - Completion status
 * - Time of day recommendations
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
import { ProgressBarModule } from "primeng/progressbar";
import { formatDate } from "../../../../shared/utils/date.utils";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

import {
  ProtocolBlock,
  PrescribedExercise,
  getBlockConfig,
  formatPrescription,
} from "../daily-protocol.models";
import { ExerciseCardComponent } from "./exercise-card.component";

@Component({
  selector: "app-protocol-block",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ProgressBarModule,
    StatusTagComponent,
    ExerciseCardComponent,

    ButtonComponent,
  ],
  template: `
    <div
      class="protocol-block"
      [class.completed]="block().status === 'complete'"
      [class.expanded]="isExpanded()"
      [attr.aria-label]="block().title"
      [attr.data-testid]="'protocol-block-' + block().type"
    >
      <!-- Block Header -->
      <div
        class="block-header"
        data-testid="protocol-block-header"
        (click)="toggleExpand()"
        [style.--block-color]="blockConfig().color"
        role="button"
        tabindex="0"
        (keydown.enter)="toggleExpand()"
        (keydown.space)="toggleExpand(); $event.preventDefault()"
      >
        <div class="header-left">
          <div class="block-icon" [style.background]="blockConfig().color">
            @if (block().status === "complete") {
              <i class="pi pi-check"></i>
            } @else {
              <i class="pi" [class]="blockConfig().icon"></i>
            }
          </div>
          <div class="block-info">
            <h3 class="block-title">{{ block().title }}</h3>
            <div class="block-meta">
              <span class="exercise-count">
                {{ block().completedCount }}/{{ block().totalCount }} exercises
              </span>
              @if (block().estimatedDurationMinutes) {
                <span class="separator">•</span>
                <span class="duration"
                  >~{{ block().estimatedDurationMinutes }} min</span
                >
              }
            </div>
          </div>
        </div>

        <div class="header-right">
          @if (!simpleView()) {
            <!-- Status Tag -->
            @if (block().status === "complete") {
              <app-status-tag value="Done" severity="success" size="sm" />
            } @else if (block().status === "in_progress") {
              <app-status-tag value="In Progress" severity="info" size="sm" />
            } @else if (block().status === "skipped") {
              <app-status-tag value="Skipped" severity="secondary" size="sm" />
            } @else {
              <app-status-tag value="Pending" severity="warning" size="sm" />
            }

            <!-- Progress -->
            @if (block().status !== "complete" && block().totalCount > 0) {
              <div class="progress-indicator">
                <span class="progress-text"
                  >{{ block().progressPercent }}%</span
                >
              </div>
            }
          }

          <!-- Expand Toggle -->
          <button
            class="expand-toggle"
            [attr.aria-expanded]="isExpanded()"
            (click)="$event.stopPropagation()"
          >
            <span class="expand-text">▼ Expand</span>
          </button>
        </div>
      </div>

      <!-- Progress Bar (only in detailed view) -->
      @if (!simpleView() && block().totalCount > 0) {
        <div
          class="progress-bar-container"
          [style.--block-color]="blockConfig().color"
        >
          <div
            class="progress-bar-fill"
            [style.width.%]="block().progressPercent"
          ></div>
        </div>
      }

      <!-- Expanded Content -->
      @if (isExpanded()) {
        <div class="block-content">
          <!-- AI Note for the Block -->
          @if (block().aiNote) {
            <div class="block-ai-note">
              <i class="pi pi-sparkles"></i>
              <span>{{ block().aiNote }}</span>
            </div>
          }

          <!-- Exercise List -->
          <div class="exercise-list" data-testid="protocol-block-exercise-list">
            @if (simpleView()) {
              <!-- Simple list view matching wireframe -->
              @for (exercise of block().exercises; track exercise.id) {
                <div
                  class="exercise-list-item"
                  [attr.data-testid]="'exercise-item-' + exercise.id"
                >
                  <label class="exercise-checkbox">
                    <input
                      type="checkbox"
                      [attr.data-testid]="'exercise-checkbox-' + exercise.id"
                      [checked]="exercise.status === 'complete'"
                      (change)="onExerciseToggle(exercise)"
                    />
                    <span class="exercise-name">{{
                      exercise.exercise.name
                    }}</span>
                    <span class="exercise-prescription"
                      >– {{ formatPrescriptionText(exercise) }}</span
                    >
                    @if (
                      exercise.exercise.videoUrl || exercise.exercise.videoId
                    ) {
                      <a
                        [href]="
                          exercise.exercise.videoUrl ||
                          'https://www.youtube.com/watch?v=' +
                            exercise.exercise.videoId
                        "
                        target="_blank"
                        rel="noopener noreferrer"
                        class="video-link"
                        (click)="$event.stopPropagation()"
                      >
                        [► Video]
                      </a>
                    }
                  </label>
                </div>
              }
            } @else {
              <!-- Detailed card view -->
              @for (
                exercise of block().exercises;
                track exercise.id;
                let i = $index
              ) {
                <app-exercise-card
                  [exercise]="exercise"
                  [sequenceNumber]="i + 1"
                  (complete)="onExerciseComplete($event)"
                  (skip)="onExerciseSkip($event)"
                ></app-exercise-card>
              }
            }
          </div>

          <!-- Block Actions -->
          @if (block().status !== "complete" && block().totalCount > 0) {
            <div class="block-actions">
              <app-button
                variant="outlined"
                iconLeft="pi-check-circle"
                (clicked)="onMarkAllComplete()"
                >Mark All Complete</app-button
              >
              <app-button
                variant="outlined"
                iconLeft="pi-forward"
                (clicked)="onSkipBlock()"
                >Skip Block</app-button
              >
            </div>
          }

          <!-- Completion Info -->
          @if (block().status === "complete" && block().completedAt) {
            <div class="completion-info">
              <i class="pi pi-check-circle"></i>
              <span
                >Completed at
                {{ formatDate(block().completedAt!, "h:mm a") }}</span
              >
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./protocol-block.component.scss",
})
export class ProtocolBlockComponent {
  // Inputs
  block = input.required<ProtocolBlock>();
  defaultExpanded = input<boolean>(false);
  simpleView = input<boolean>(false); // Simple list view matching wireframe

  // Outputs
  exerciseComplete = output<PrescribedExercise>();
  exerciseSkip = output<PrescribedExercise>();
  markAllComplete = output<ProtocolBlock>();
  skipBlock = output<ProtocolBlock>();

  // Local state
  isExpanded = signal(false);

  // Computed
  blockConfig = computed(() => getBlockConfig(this.block().type));

  constructor() {
    // Expanded state will be set in ngOnInit when inputs are available
  }

  ngOnInit(): void {
    // Set initial expanded state based on input or block status
    if (this.defaultExpanded() || this.block().status === "in_progress") {
      this.isExpanded.set(true);
    }
  }

  // Methods
  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  onExerciseComplete(exercise: PrescribedExercise): void {
    this.exerciseComplete.emit(exercise);
  }

  onExerciseSkip(exercise: PrescribedExercise): void {
    this.exerciseSkip.emit(exercise);
  }

  onMarkAllComplete(): void {
    this.markAllComplete.emit(this.block());
  }

  onSkipBlock(): void {
    this.skipBlock.emit(this.block());
  }

  onExerciseToggle(exercise: PrescribedExercise): void {
    if (exercise.status === "complete") {
      // Toggle off - mark as pending (or emit skip if needed)
      // For now, we'll just emit complete again to toggle
      this.exerciseComplete.emit(exercise);
    } else {
      this.exerciseComplete.emit(exercise);
    }
  }

  formatPrescriptionText(exercise: PrescribedExercise): string {
    return formatPrescription(exercise);
  }

  formatDate(date: Date | string, formatStr?: string): string {
    return formatDate(date, formatStr || "h:mm a");
  }
}
