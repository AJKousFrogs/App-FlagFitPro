import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { TooltipModule } from "primeng/tooltip";
import { BadgeModule } from "primeng/badge";

export interface WorkoutDay {
  date: Date;
  workouts: WorkoutEntry[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isPast: boolean;
}

export interface WorkoutEntry {
  id: string;
  title: string;
  type: "strength" | "cardio" | "mobility" | "practice" | "game" | "rest";
  duration?: number; // minutes
  completed: boolean;
  intensity?: "low" | "medium" | "high";
}

@Component({
  selector: "app-workout-calendar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule, BadgeModule,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <div class="workout-calendar">
      <!-- Calendar Header -->
      <div class="calendar-header">
        <app-icon-button icon="pi-chevron-left" variant="text" (clicked)="previousMonth()" ariaLabel="chevron-left" />

        <h3 class="month-title">{{ monthYearLabel() }}</h3>

        <app-icon-button icon="pi-chevron-right" variant="text" (clicked)="nextMonth()" ariaLabel="chevron-right" />

        <app-button variant="text" size="sm" (clicked)="goToToday()">Today</app-button>
      </div>

      <!-- View Toggle -->
      <div class="view-toggle">
        <button
          class="toggle-btn"
          [class.active]="viewMode() === 'month'"
          (click)="viewMode.set('month')"
        >
          Month
        </button>
        <button
          class="toggle-btn"
          [class.active]="viewMode() === 'week'"
          (click)="viewMode.set('week')"
        >
          Week
        </button>
      </div>

      <!-- Weekday Headers -->
      <div class="weekday-headers">
        @for (day of weekdays; track day) {
          <div class="weekday">{{ day }}</div>
        }
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid" [class.week-view]="viewMode() === 'week'">
        @for (day of visibleDays(); track day.date.toISOString()) {
          <div
            class="calendar-day"
            [class.today]="day.isToday"
            [class.other-month]="!day.isCurrentMonth"
            [class.past]="day.isPast"
            [class.has-workouts]="day.workouts.length > 0"
            (click)="selectDay(day)"
          >
            <div class="day-header">
              <span class="day-number">{{ day.date.getDate() }}</span>
              @if (day.workouts.length > 0) {
                <div class="workout-indicators">
                  @for (workout of day.workouts.slice(0, 3); track workout.id) {
                    <span
                      class="workout-dot"
                      [class]="'type-' + workout.type"
                      [class.completed]="workout.completed"
                      [pTooltip]="workout.title"
                    ></span>
                  }
                  @if (day.workouts.length > 3) {
                    <span class="more-indicator"
                      >+{{ day.workouts.length - 3 }}</span
                    >
                  }
                </div>
              }
            </div>

            @if (viewMode() === "week" || day.isToday) {
              <div class="day-workouts">
                @for (workout of day.workouts; track workout.id) {
                  <div
                    class="workout-item"
                    [class]="'type-' + workout.type"
                    [class.completed]="workout.completed"
                    (click)="onWorkoutClick(workout, $event)"
                  >
                    <i [class]="getWorkoutIcon(workout.type)"></i>
                    <span class="workout-title">{{ workout.title }}</span>
                    @if (workout.duration) {
                      <span class="workout-duration"
                        >{{ workout.duration }}m</span
                      >
                    }
                    @if (workout.completed) {
                      <i class="pi pi-check-circle completed-icon"></i>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Legend -->
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-dot type-strength"></span>
          <span>Strength</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot type-cardio"></span>
          <span>Cardio</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot type-mobility"></span>
          <span>Mobility</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot type-practice"></span>
          <span>Practice</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot type-game"></span>
          <span>Game</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot type-rest"></span>
          <span>Rest</span>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="month-stats">
        <div class="stat">
          <span class="stat-value">{{ monthStats().totalWorkouts }}</span>
          <span class="stat-label">Workouts</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ monthStats().completedWorkouts }}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ monthStats().totalMinutes }}</span>
          <span class="stat-label">Minutes</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ monthStats().streakDays }}</span>
          <span class="stat-label">Day Streak</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './workout-calendar.component.scss',
})
export class WorkoutCalendarComponent implements OnInit {
  @Input() workouts: WorkoutEntry[] = [];
  @Output() daySelected = new EventEmitter<Date>();
  @Output() workoutSelected = new EventEmitter<WorkoutEntry>();

  currentDate = signal(new Date());
  viewMode = signal<"month" | "week">("month");
  weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  monthYearLabel = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  });

  visibleDays = computed(() => {
    const date = this.currentDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.viewMode() === "week") {
      return this.getWeekDays(date, today);
    }
    return this.getMonthDays(date, today);
  });

  monthStats = computed(() => {
    const days = this.visibleDays();
    const allWorkouts = days.flatMap((d) => d.workouts);
    const completedWorkouts = allWorkouts.filter((w) => w.completed);

    // Calculate streak
    let streakDays = 0;
    const sortedDays = [...days].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    for (const day of sortedDays) {
      if (day.isPast || day.isToday) {
        const hasCompletedWorkout = day.workouts.some((w) => w.completed);
        if (hasCompletedWorkout) {
          streakDays++;
        } else if (day.workouts.length > 0) {
          break;
        }
      }
    }

    return {
      totalWorkouts: allWorkouts.length,
      completedWorkouts: completedWorkouts.length,
      totalMinutes: completedWorkouts.reduce(
        (sum, w) => sum + (w.duration || 0),
        0,
      ),
      streakDays,
    };
  });

  ngOnInit(): void {
    // Initialize with current date
  }

  private getMonthDays(date: Date, today: Date): WorkoutDay[] {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: WorkoutDay[] = [];

    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.createWorkoutDay(d, today, false));
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push(this.createWorkoutDay(d, today, true));
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.createWorkoutDay(d, today, false));
    }

    return days;
  }

  private getWeekDays(date: Date, today: Date): WorkoutDay[] {
    const days: WorkoutDay[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(
        this.createWorkoutDay(d, today, d.getMonth() === date.getMonth()),
      );
    }

    return days;
  }

  private createWorkoutDay(
    date: Date,
    today: Date,
    isCurrentMonth: boolean,
  ): WorkoutDay {
    const dateStr = date.toISOString().split("T")[0];
    const workoutsForDay = this.workouts.filter((w) => {
      // Assuming workouts have a date property or we match by some logic
      return true; // Placeholder - would filter by actual date
    });

    return {
      date,
      workouts: workoutsForDay,
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth,
      isPast: date < today,
    };
  }

  previousMonth(): void {
    const current = this.currentDate();
    if (this.viewMode() === "week") {
      const newDate = new Date(current);
      newDate.setDate(current.getDate() - 7);
      this.currentDate.set(newDate);
    } else {
      this.currentDate.set(
        new Date(current.getFullYear(), current.getMonth() - 1, 1),
      );
    }
  }

  nextMonth(): void {
    const current = this.currentDate();
    if (this.viewMode() === "week") {
      const newDate = new Date(current);
      newDate.setDate(current.getDate() + 7);
      this.currentDate.set(newDate);
    } else {
      this.currentDate.set(
        new Date(current.getFullYear(), current.getMonth() + 1, 1),
      );
    }
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  selectDay(day: WorkoutDay): void {
    this.daySelected.emit(day.date);
  }

  onWorkoutClick(workout: WorkoutEntry, event: Event): void {
    event.stopPropagation();
    this.workoutSelected.emit(workout);
  }

  getWorkoutIcon(type: string): string {
    const icons: Record<string, string> = {
      strength: "pi pi-bolt",
      cardio: "pi pi-heart",
      mobility: "pi pi-sync",
      practice: "pi pi-users",
      game: "pi pi-flag",
      rest: "pi pi-moon",
    };
    return icons[type] || "pi pi-circle";
  }
}
