import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { Workout, WeeklyScheduleDay } from "../../../core/models/training.models";
import { UI_LIMITS } from "../../../core/constants/app.constants";

@Component({
  selector: "app-training-schedule-workouts-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, CardShellComponent],
  templateUrl: "./training-schedule-workouts-section.component.html",
  styleUrl: "./training-schedule-workouts-section.component.scss",
})
export class TrainingScheduleWorkoutsSectionComponent {
  readonly weeklySchedule = input.required<WeeklyScheduleDay[]>();
  readonly workouts = input.required<Workout[]>();
  readonly currentDayName = input.required<string>();

  readonly openSchedule = output<void>();
  readonly openAllWorkouts = output<void>();
  readonly selectWorkout = output<Workout>();

  protected readonly UI_LIMITS = UI_LIMITS;

  protected readonly previewWorkouts = computed(() =>
    this.workouts().slice(0, UI_LIMITS.WORKOUTS_PREVIEW_COUNT),
  );

  protected isToday(dayName: string): boolean {
    return dayName.toLowerCase() === this.currentDayName().toLowerCase();
  }

  protected trackByDayName(index: number, day: WeeklyScheduleDay): string {
    return day.name;
  }

  protected trackByWorkoutTitle(index: number, workout: Workout): string {
    return workout.title || workout.id || index.toString();
  }
}
