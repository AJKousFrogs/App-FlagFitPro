import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { InputNumberModule } from "primeng/inputnumber";
import { CheckboxModule } from "primeng/checkbox";
import {} from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { ApiService } from "../../core/services/api.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
import { formatDate } from "../../shared/utils/date.utils";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    InputNumberModule,
    CheckboxModule,
    StatusTagComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    EmptyStateComponent,

    ButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="workout-page">
        <app-page-header
          title="Workout Tracker"
          subtitle="Track your workouts and monitor your progress"
          icon="pi-bolt"
        >
          <app-button iconLeft="pi-plus" (clicked)="createNewWorkout()"
            >New Workout</app-button
          >
        </app-page-header>

        <!-- Active Workout -->
        @if (activeWorkout()) {
          <p-card class="active-workout-card">
            <ng-template pTemplate="header">
              <div class="workout-header">
                <h3>{{ activeWorkout()?.name }}</h3>
                <app-status-tag
                  [value]="
                    activeWorkout()?.completed ? 'Completed' : 'In Progress'
                  "
                  [severity]="activeWorkout()?.completed ? 'success' : 'info'"
                  size="sm"
                />
              </div>
            </ng-template>
            <div class="exercises-list">
              @for (
                exercise of activeWorkout()?.exercises;
                track trackByExerciseId($index, exercise)
              ) {
                <div class="exercise-item">
                  <div class="exercise-info">
                    <h4>{{ exercise.name }}</h4>
                    <div class="exercise-details">
                      <span
                        >{{ exercise.sets }} sets ×
                        {{ exercise.reps }} reps</span
                      >
                      @if (exercise.weight) {
                        <span>{{ exercise.weight }} lbs</span>
                      }
                    </div>
                  </div>
                  <div class="exercise-actions">
                    <p-checkbox
                      [(ngModel)]="exercise.completed"
                      [binary]="true"
                      variant="filled"
                      inputId="exercise-{{ exercise.id }}"
                    >
                    </p-checkbox>
                    <label for="exercise-{{ exercise.id }}">Done</label>
                  </div>
                </div>
              }
            </div>
            <div class="workout-actions">
              <app-button variant="outlined" (clicked)="saveWorkout()"
                >Save Progress</app-button
              >
              <app-button (clicked)="completeWorkout()"
                >Complete Workout</app-button
              >
            </div>
          </p-card>
        }

        <!-- Workout History -->
        <p-card class="workout-history-card">
          <ng-template pTemplate="header">
            <h3>Workout History</h3>
          </ng-template>
          @if (isLoading()) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Loading workouts...</p>
            </div>
          } @else if (workoutHistory().length === 0) {
            <app-empty-state
              icon="pi-bolt"
              title="No Workouts Yet"
              message="Start logging your strength and conditioning sessions to track your training progress."
              actionLabel="Log First Workout"
              (actionClicked)="createNewWorkout()"
            ></app-empty-state>
          } @else {
            <div class="workouts-list">
              @for (
                workout of workoutHistory();
                track trackByWorkoutId($index, workout)
              ) {
                <div class="workout-item">
                  <div class="workout-info">
                    <h4>{{ workout.name }}</h4>
                    <p class="workout-date">{{ workout.date }}</p>
                    <p class="workout-stats">
                      {{ workout.exercises.length }} exercises
                    </p>
                  </div>
                  <div class="workout-status">
                    <app-status-tag
                      [value]="workout.completed ? 'Completed' : 'Incomplete'"
                      [severity]="workout.completed ? 'success' : 'warning'"
                      size="sm"
                    />
                  </div>
                </div>
              }
            </div>
          }
        </p-card>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./workout.component.scss",
})
export class WorkoutComponent implements OnInit {
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  activeWorkout = signal<Workout | null>(null);
  workoutHistory = signal<Workout[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadWorkouts();
  }

  async loadWorkouts(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) {
      this.isLoading.set(false);
      return;
    }

    try {
      // Load workout logs from Supabase
      const { data: workoutLogs, error } = await this.supabaseService.client
        .from("workout_logs")
        .select(
          `
          id,
          session_id,
          completed_at,
          rpe,
          duration_minutes,
          notes,
          training_sessions (
            id,
            name,
            session_type,
            exercises
          )
        `,
        )
        .eq("player_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(20);

      if (error) {
        this.logger.warn(
          "[Workout] Error loading workouts:",
          toLogContext(error),
        );
        this.isLoading.set(false);
        return;
      }

      if (workoutLogs && workoutLogs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workouts: Workout[] = workoutLogs.map((log: any) => {
          // Parse exercises from training session if available
          let exercises: WorkoutExercise[] = [];
          if (log.training_sessions?.exercises) {
            try {
              const parsedExercises =
                typeof log.training_sessions.exercises === "string"
                  ? JSON.parse(log.training_sessions.exercises)
                  : log.training_sessions.exercises;

              exercises = (parsedExercises || []).map(
                (ex: Record<string, unknown>, idx: number) => ({
                  id: (ex["id"] as string) || `${log.id}-${idx}`,
                  name:
                    (ex["name"] as string) ||
                    (ex["exercise_name"] as string) ||
                    "Exercise",
                  sets: (ex["sets"] as number) || 3,
                  reps: (ex["reps"] as number) || 10,
                  weight: ex["weight"] as number | undefined,
                  completed: true,
                }),
              );
            } catch (_e) {
              this.logger.debug("[Workout] Could not parse exercises");
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
            name:
              log.training_sessions?.name || this.inferWorkoutName(log.notes),
            date: formatDate(log.completed_at, "P"),
            exercises,
            duration: log.duration_minutes,
            completed: true,
          };
        });

        this.workoutHistory.set(workouts);
      }
    } catch (error) {
      this.logger.error("[Workout] Failed to load workouts:", error);
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

    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_SAVE_WORKOUTS);
      return;
    }

    const workout = this.activeWorkout();
    if (!workout) return;

    try {
      // Save as workout log
      const { error } = await this.supabaseService.client
        .from("workout_logs")
        .insert({
          player_id: user.id,
          completed_at: new Date().toISOString(),
          duration_minutes: workout.duration || 60,
          rpe: 5, // Default RPE, can be adjusted
          notes: `${workout.name}: ${workout.exercises.map((e) => e.name).join(", ")}`,
        });

      if (error) throw error;

      this.toastService.success(TOAST.SUCCESS.WORKOUT_SAVED);
    } catch (error) {
      this.logger.error("[Workout] Error saving:", error);
      this.toastService.error(TOAST.ERROR.WORKOUT_SAVE_FAILED);
    }
  }

  async completeWorkout(): Promise<void> {
    if (!this.activeWorkout()) return;

    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_COMPLETE_WORKOUTS);
      return;
    }

    const activeWorkout = this.activeWorkout();
    if (!activeWorkout) return;
    const workout = { ...activeWorkout, completed: true };

    try {
      // Save completed workout to database
      const { error } = await this.supabaseService.client
        .from("workout_logs")
        .insert({
          player_id: user.id,
          completed_at: new Date().toISOString(),
          duration_minutes: workout.duration || 60,
          rpe: 6, // Slightly higher RPE for completed workout
          notes: `Completed: ${workout.name} - ${workout.exercises.filter((e) => e.completed).length}/${workout.exercises.length} exercises`,
        });

      if (error) throw error;

      // Update local state
      this.workoutHistory.update((history) => [workout, ...history]);
      this.activeWorkout.set(null);
      this.toastService.success(TOAST.SUCCESS.WORKOUT_COMPLETED_EMOJI);
    } catch (error) {
      this.logger.error("[Workout] Error completing:", error);
      this.toastService.error(TOAST.ERROR.WORKOUT_COMPLETE_FAILED);

      // Still update local state
      this.workoutHistory.update((history) => [workout, ...history]);
      this.activeWorkout.set(null);
    }
  }

  trackByExerciseId(index: number, exercise: WorkoutExercise): string {
    return exercise.id;
  }

  trackByWorkoutId(index: number, workout: Workout): string {
    return workout.id;
  }
}
