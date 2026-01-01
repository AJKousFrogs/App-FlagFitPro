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
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { CheckboxModule } from "primeng/checkbox";
import { TagModule } from "primeng/tag";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";

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
    ButtonModule,
    InputNumberModule,
    CheckboxModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-main-layout>
      <div class="workout-page">
        <app-page-header
          title="Workout Tracker"
          subtitle="Track your workouts and monitor your progress"
          icon="pi-bolt"
        >
          <p-button
            label="New Workout"
            icon="pi pi-plus"
            (onClick)="createNewWorkout()"
          ></p-button>
        </app-page-header>

        <!-- Active Workout -->
        @if (activeWorkout()) {
          <p-card class="active-workout-card">
            <ng-template pTemplate="header">
              <div class="workout-header">
                <h3>{{ activeWorkout()?.name }}</h3>
                <p-tag
                  [value]="
                    activeWorkout()?.completed ? 'Completed' : 'In Progress'
                  "
                  [severity]="activeWorkout()?.completed ? 'success' : 'info'"
                >
                </p-tag>
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
                      inputId="exercise-{{ exercise.id }}"
                    >
                    </p-checkbox>
                    <label for="exercise-{{ exercise.id }}">Done</label>
                  </div>
                </div>
              }
            </div>
            <div class="workout-actions">
              <p-button
                label="Save Progress"
                [outlined]="true"
                (onClick)="saveWorkout()"
              ></p-button>
              <p-button
                label="Complete Workout"
                (onClick)="completeWorkout()"
              ></p-button>
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
              message="Start logging your strength and conditioning sessions to track your Olympic preparation progress."
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
                    <p-tag
                      [value]="workout.completed ? 'Completed' : 'Incomplete'"
                      [severity]="workout.completed ? 'success' : 'warn'"
                    >
                    </p-tag>
                  </div>
                </div>
              }
            </div>
          }
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .workout-page {
        padding: var(--space-6);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .active-workout-card {
        margin-bottom: var(--space-6);
      }

      .workout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .workout-header h3 {
        margin: 0;
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .exercises-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .exercise-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .exercise-info h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .exercise-details {
        display: flex;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .exercise-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .workout-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .workout-history-card {
        margin-bottom: var(--space-6);
      }

      .workouts-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .workout-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        transition: background 0.2s;
      }

      .workout-item:hover {
        background: var(--p-surface-100);
      }

      .workout-info h4 {
        margin: 0 0 var(--space-1) 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .workout-date,
      .workout-stats {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-10);
        color: var(--text-secondary);
      }

      .loading-state i {
        font-size: 2rem;
        margin-bottom: var(--space-3);
        color: var(--color-brand-primary);
      }

      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }

        .exercise-item {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }
      }
    `,
  ],
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
        this.logger.warn("[Workout] Error loading workouts:", error);
        this.isLoading.set(false);
        return;
      }

      if (workoutLogs && workoutLogs.length > 0) {
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
                (ex: any, idx: number) => ({
                  id: ex.id || `${log.id}-${idx}`,
                  name: ex.name || ex.exercise_name || "Exercise",
                  sets: ex.sets || 3,
                  reps: ex.reps || 10,
                  weight: ex.weight,
                  completed: true,
                }),
              );
            } catch (e) {
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
            date: new Date(log.completed_at).toLocaleDateString(),
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
      name: "New Workout",
      date: new Date().toISOString().split("T")[0],
      exercises: [
        { id: "1", name: "Exercise 1", sets: 3, reps: 10, completed: false },
        { id: "2", name: "Exercise 2", sets: 3, reps: 10, completed: false },
      ],
      completed: false,
    };
    this.activeWorkout.set(newWorkout);
  }

  async saveWorkout(): Promise<void> {
    if (!this.activeWorkout()) return;

    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error("Please log in to save workouts");
      return;
    }

    const workout = this.activeWorkout()!;

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

      this.toastService.success("Workout saved!");
    } catch (error) {
      this.logger.error("[Workout] Error saving:", error);
      this.toastService.error("Failed to save workout");
    }
  }

  async completeWorkout(): Promise<void> {
    if (!this.activeWorkout()) return;

    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error("Please log in to complete workouts");
      return;
    }

    const workout = { ...this.activeWorkout()!, completed: true };

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
      this.toastService.success("Workout completed! 💪");
    } catch (error) {
      this.logger.error("[Workout] Error completing:", error);
      this.toastService.error("Failed to complete workout");

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
