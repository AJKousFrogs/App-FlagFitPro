import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";

import { CheckboxComponent } from "../../shared/components/checkbox/checkbox.component";

import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { ApiService } from "../../core/services/api.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { formatDate } from "../../shared/utils/date.utils";
import { WorkoutDataService } from "./services/workout-data.service";

interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  completed: boolean;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  duration?: number;
  completed: boolean;
}

@Component({
  selector: "app-workout",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CheckboxComponent,
    StatusTagComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    AppLoadingComponent,
    CardShellComponent,
  ],
  templateUrl: "./workout.component.html",
  styleUrl: "./workout.component.scss",
})
export class WorkoutComponent implements OnInit {
  private apiService = inject(ApiService);
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private workoutDataService = inject(WorkoutDataService);

  activeWorkout = signal<Workout | null>(null);
  workoutHistory = signal<Workout[]>([]);
  isLoading = signal(true);

  private currentUserId(): string | null {
    return this.supabase.userId();
  }

  private resolveWorkoutExerciseName(
    exercise: Record<string, unknown>,
    index: number,
  ): string {
    const nestedExercise =
      exercise["exercise"] &&
      typeof exercise["exercise"] === "object" &&
      exercise["exercise"] !== null
        ? (exercise["exercise"] as Record<string, unknown>)
        : null;

    const candidates = [
      exercise["exercise_name"],
      exercise["exerciseName"],
      nestedExercise?.["exercise_name"],
      nestedExercise?.["exerciseName"],
      nestedExercise?.["name"],
      exercise["name"],
      exercise["title"],
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }

    return `Exercise ${index + 1}`;
  }

  ngOnInit(): void {
    this.loadWorkouts();
  }

  async loadWorkouts(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    try {
      // Load workout logs from Supabase
      const { workoutLogs, error } =
        await this.workoutDataService.fetchWorkoutLogs(userId);

      if (error) {
        this.logger.warn(
          "workout_load_error",
          toLogContext(error),
        );
        this.isLoading.set(false);
        return;
      }

      if (workoutLogs.length > 0) {
        const workouts: Workout[] = workoutLogs.map((log) => {
          // Parse exercises from training session if available
          let exercises: WorkoutExercise[] = [];
          const session = Array.isArray(log.training_sessions)
            ? log.training_sessions[0]
            : log.training_sessions;

          if (session?.exercises) {
            try {
              const parsedExercises =
                typeof session.exercises === "string"
                  ? JSON.parse(session.exercises)
                  : session.exercises;

              exercises = (parsedExercises || []).map(
                (ex: Record<string, unknown>, idx: number) => ({
                  id: (ex["id"] as string) || `${log.id}-${idx}`,
                  name: this.resolveWorkoutExerciseName(ex, idx),
                  sets: (ex["sets"] as number) || 3,
                  reps: (ex["reps"] as number) || 10,
                  weight: ex["weight"] as number | undefined,
                  completed: true,
                }),
              );
            } catch (_e) {
              this.logger.debug("workout_parse_exercises_failed");
            }
          }

          // If no exercises from session, create placeholder based on notes
          if (exercises.length === 0) {
            const notes = (log.notes || "").toLowerCase();
            if (notes.includes("strength") || notes.includes("gym")) {
              exercises = [
                {
                  id: "1",
                  name: "Strength Exercise",
                  sets: 3,
                  reps: 10,
                  completed: true,
                },
              ];
            } else if (notes.includes("sprint") || notes.includes("speed")) {
              exercises = [
                {
                  id: "1",
                  name: "Sprint Drills",
                  sets: 5,
                  reps: 1,
                  completed: true,
                },
              ];
            } else {
              exercises = [
                {
                  id: "1",
                  name: "Training Session",
                  sets: 1,
                  reps: 1,
                  completed: true,
                },
              ];
            }
          }

          return {
            id: log.id,
            name: session?.name || this.inferWorkoutName(log.notes ?? null),
            date: formatDate(log.completed_at, "P"),
            exercises,
            duration: log.duration_minutes ?? undefined,
            completed: true,
          };
        });

        this.workoutHistory.set(workouts);
      }
    } catch (error) {
      this.logger.error("workout_load_failed", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private inferWorkoutName(notes: string | null): string {
    if (!notes) return "Training Session";
    const lowerNotes = notes.toLowerCase();

    if (
      lowerNotes.includes("strength") ||
      lowerNotes.includes("gym") ||
      lowerNotes.includes("weight")
    ) {
      return "Strength Training";
    }
    if (lowerNotes.includes("sprint") || lowerNotes.includes("speed")) {
      return "Speed Training";
    }
    if (lowerNotes.includes("route") || lowerNotes.includes("passing")) {
      return "Route Running";
    }
    if (lowerNotes.includes("agility") || lowerNotes.includes("cut")) {
      return "Agility Training";
    }
    if (lowerNotes.includes("conditioning") || lowerNotes.includes("cardio")) {
      return "Conditioning";
    }
    if (lowerNotes.includes("recovery") || lowerNotes.includes("mobility")) {
      return "Recovery Session";
    }

    return "Training Session";
  }

  createNewWorkout(): void {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name: "New Training Session",
      date: new Date().toISOString().split("T")[0],
      exercises: [],
      completed: false,
    };
    this.activeWorkout.set(newWorkout);
  }

  async saveWorkout(): Promise<void> {
    if (!this.activeWorkout()) return;

    const userId = this.currentUserId();
    if (!userId) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_SAVE_WORKOUTS);
      return;
    }

    const workout = this.activeWorkout();
    if (!workout) return;

    try {
      // Save as workout log
      const { error } = await this.workoutDataService.createWorkoutLog({
        playerId: userId,
        durationMinutes: workout.duration || 60,
        rpe: 5,
        notes: `${workout.name}: ${workout.exercises.map((e) => e.name).join(", ")}`,
      });

      if (error) throw error;

      this.toastService.success(TOAST.SUCCESS.WORKOUT_SAVED);
    } catch (error) {
      this.logger.error("workout_save_failed", error);
      this.toastService.error(TOAST.ERROR.WORKOUT_SAVE_FAILED);
    }
  }

  async completeWorkout(): Promise<void> {
    if (!this.activeWorkout()) return;

    const userId = this.currentUserId();
    if (!userId) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_COMPLETE_WORKOUTS);
      return;
    }

    const activeWorkout = this.activeWorkout();
    if (!activeWorkout) return;
    const workout = { ...activeWorkout, completed: true };

    try {
      // Save completed workout to database
      const { error } = await this.workoutDataService.createWorkoutLog({
        playerId: userId,
        durationMinutes: workout.duration || 60,
        rpe: 6,
        notes: `Completed: ${workout.name} - ${workout.exercises.filter((e) => e.completed).length}/${workout.exercises.length} exercises`,
      });

      if (error) throw error;

      // Update local state
      this.workoutHistory.update((history) => [workout, ...history]);
      this.activeWorkout.set(null);
      this.toastService.success(TOAST.SUCCESS.WORKOUT_COMPLETED_EMOJI);
    } catch (error) {
      this.logger.error("workout_complete_failed", error);
      this.toastService.error(TOAST.ERROR.WORKOUT_COMPLETE_FAILED);

      // Still update local state
      this.workoutHistory.update((history) => [workout, ...history]);
      this.activeWorkout.set(null);
    }
  }

  trackByExerciseId(index: number, exercise: WorkoutExercise): string {
    return exercise.id;
  }

  onExerciseCompletedChange(
    exercise: WorkoutExercise,
    checked: boolean | undefined,
  ): void {
    exercise.completed = !!checked;
  }

  trackByWorkoutId(index: number, workout: Workout): string {
    return workout.id;
  }
}
