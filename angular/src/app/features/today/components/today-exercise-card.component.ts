import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { NgClass } from "@angular/common";

/**
 * Status of an individual set within an exercise.
 */
export type SetPillStatus = "done" | "active" | "upcoming";

/**
 * A single set to display in the set-pills grid.
 */
export interface ExerciseSetItem {
  label: string;
  value: string;
  note: string;
  status: SetPillStatus;
}

/**
 * Superset pair information — the partner exercise in a superset.
 */
export interface SupersetPairInfo {
  name: string;
  meta: string;
}

/**
 * View-model for the rich exercise card.
 */
export interface ExerciseCardItem {
  name: string;
  blockLabel: string;
  tags: string[];
  sets: ExerciseSetItem[];
  /** e.g. "5 sets x 5 reps · 2:00 rest · Hips + glutes" */
  meta: string;
  /** CSS gradient class suffix: 'strength' | 'hot' | 'focus' or a raw gradient string */
  thumbnailGradient: string;
  isKeystone: boolean;
  isCompleted: boolean;
  isSuperset: boolean;
  supersetPair: SupersetPairInfo | null;
}

@Component({
  selector: "app-today-exercise-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  templateUrl: "./today-exercise-card.component.html",
  styleUrl: "./today-exercise-card.component.scss",
})
export class TodayExerciseCardComponent {
  /** The exercise data to render. */
  readonly exercise = input.required<ExerciseCardItem>();

  /** Whether to show the set pills grid (expanded state). */
  readonly showSets = input<boolean>(false);

  /** Emitted when the user taps the Start / Open button. */
  readonly startExercise = output<void>();

  /** Emitted when the user taps the Swap button. */
  readonly swapExercise = output<void>();

  /** Emitted when the user taps the History button. */
  readonly viewHistory = output<void>();

  get thumbnailClass(): string {
    const gradient = this.exercise().thumbnailGradient;
    if (gradient === "strength" || gradient === "hot" || gradient === "focus") {
      return `exercise-card__thumb--${gradient}`;
    }
    return "";
  }
}
