import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

@Component({
  selector: "app-today-sticky-bar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./today-sticky-bar.component.scss",
  template: `
    <div class="sticky-bar" role="toolbar" aria-label="Workout quick actions">
      <!-- Icon tile -->
      <span class="icon-tile icon-tile--lg icon-tile--brand" aria-hidden="true">&#9654;</span>

      <!-- Next exercise info -->
      <div class="sticky-bar__info">
        <div class="t-body-bold">
          Up next &middot; {{ nextExerciseName() || 'No exercise' }}
        </div>
        @if (nextSetInfo()) {
          <div class="t-2xs">{{ nextSetInfo() }}</div>
        }
      </div>

      <!-- Keyboard hints (hidden on mobile via CSS) -->
      <div class="sticky-bar__hints cluster t-small hide-mobile">
        <kbd class="kbd">Space</kbd> start
        <kbd class="kbd">&rarr;</kbd> next set
      </div>

      <!-- Skip button (hidden on mobile) -->
      <button
        class="btn hide-mobile"
        type="button"
        (click)="skipExercise.emit()"
      >
        Skip
      </button>

      <!-- Start / Resume button -->
      <button
        class="btn btn--primary btn--lg"
        type="button"
        (click)="startWorkout.emit()"
      >
        {{ isWorkoutActive() ? 'Resume workout' : 'Start workout' }}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  `,
})
export class TodayStickyBarComponent {
  /* ── Inputs ── */
  readonly nextExerciseName = input<string>("");
  readonly nextSetInfo = input<string>("");
  readonly isWorkoutActive = input<boolean>(false);

  /* ── Outputs ── */
  readonly startWorkout = output<void>();
  readonly skipExercise = output<void>();
}
