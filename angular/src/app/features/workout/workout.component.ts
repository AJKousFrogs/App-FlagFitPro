import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { CheckboxModule } from "primeng/checkbox";
import { TagModule } from "primeng/tag";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

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
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    CheckboxModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
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
        <p-card *ngIf="activeWorkout()" class="active-workout-card">
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
            <div
              *ngFor="
                let exercise of activeWorkout()?.exercises;
                trackBy: trackByExerciseId
              "
              class="exercise-item"
            >
              <div class="exercise-info">
                <h4>{{ exercise.name }}</h4>
                <div class="exercise-details">
                  <span
                    >{{ exercise.sets }} sets × {{ exercise.reps }} reps</span
                  >
                  <span *ngIf="exercise.weight">{{ exercise.weight }} lbs</span>
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

        <!-- Workout History -->
        <p-card class="workout-history-card">
          <ng-template pTemplate="header">
            <h3>Workout History</h3>
          </ng-template>
          <div class="workouts-list">
            <div
              *ngFor="
                let workout of workoutHistory();
                trackBy: trackByWorkoutId
              "
              class="workout-item"
            >
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
          </div>
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
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
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
        font-size: 1.25rem;
        font-weight: 600;
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
        font-size: 0.875rem;
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
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
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

  activeWorkout = signal<Workout | null>(null);
  workoutHistory = signal<Workout[]>([]);

  ngOnInit(): void {
    this.loadWorkouts();
  }

  loadWorkouts(): void {
    // Load workout history
    this.workoutHistory.set([
      {
        id: "1",
        name: "Upper Body Strength",
        date: "2024-03-15",
        exercises: [
          {
            id: "1",
            name: "Bench Press",
            sets: 3,
            reps: 10,
            weight: 185,
            completed: true,
          },
          {
            id: "2",
            name: "Shoulder Press",
            sets: 3,
            reps: 10,
            weight: 135,
            completed: true,
          },
        ],
        completed: true,
      },
      {
        id: "2",
        name: "Lower Body Power",
        date: "2024-03-14",
        exercises: [
          {
            id: "3",
            name: "Squats",
            sets: 4,
            reps: 8,
            weight: 225,
            completed: true,
          },
          {
            id: "4",
            name: "Deadlifts",
            sets: 3,
            reps: 6,
            weight: 275,
            completed: true,
          },
        ],
        completed: true,
      },
    ]);
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

  saveWorkout(): void {
    if (!this.activeWorkout()) return;

    const workout = this.activeWorkout()!;
    this.apiService
      .put(`/api/training/workouts/${workout.id}`, workout)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          // Workout saved successfully
        },
        error: () => {
          // Error handled by error interceptor
        },
      });
  }

  completeWorkout(): void {
    if (!this.activeWorkout()) return;

    const workout = { ...this.activeWorkout()!, completed: true };
    this.workoutHistory.update((history) => [workout, ...history]);
    this.activeWorkout.set(null);
  }

  trackByExerciseId(index: number, exercise: WorkoutExercise): string {
    return exercise.id;
  }

  trackByWorkoutId(index: number, workout: Workout): string {
    return workout.id;
  }
}
