/**
 * Week Progress Strip Component
 *
 * Compact horizontal strip showing the week's training progress:
 * - Days of the week with completion status
 * - Current day highlighted
 * - Weekly stats summary
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Tooltip } from "primeng/tooltip";

export interface WeekDay {
  date: string; // ISO date string
  dayName: string; // Mon, Tue, etc.
  dayNumber: number; // 1-31
  status: "complete" | "partial" | "planned" | "rest" | "empty";
  loadAu?: number;
  isToday: boolean;
}

export interface WeekStats {
  completedDays: number;
  totalTrainingDays: number;
  weeklyLoadAu: number;
  targetLoadAu: number;
  currentStreak: number;
}

@Component({
  selector: "app-week-progress-strip",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip],
  template: `
    <div class="week-progress-strip">
      <!-- Week Days -->
      <div class="week-days">
        @for (day of weekDays(); track day.date) {
          <div
            class="day-item"
            [class.today]="day.isToday"
            [class]="'status-' + day.status"
            [pTooltip]="getDayTooltip(day)"
            tooltipPosition="top"
          >
            <span class="day-name">{{ day.dayName }}</span>
            <div class="day-indicator">
              @if (day.status === "complete") {
                <i class="pi pi-check"></i>
              } @else if (day.status === "partial") {
                <i class="pi pi-minus"></i>
              } @else if (day.status === "planned") {
                <span class="dot"></span>
              } @else if (day.status === "rest") {
                <i class="pi pi-moon"></i>
              } @else {
                <span class="empty-dot"></span>
              }
            </div>
            @if (day.isToday) {
              <span class="today-label">TODAY</span>
            }
          </div>
        }
      </div>

      <!-- Week Stats -->
      <div class="week-stats">
        <div class="stat-item stat-block stat-block--compact">
          <div class="stat-block__content">
            <span class="stat-block__value"
              >{{ stats().completedDays }}/{{ stats().totalTrainingDays }}</span
            >
            <span class="stat-block__label">Training Days</span>
          </div>
        </div>
        @if (stats().currentStreak > 0) {
          <div class="stat-item streak stat-block stat-block--compact">
            <div class="stat-block__content">
              <span class="stat-block__value"
                >{{ stats().currentStreak }} 🔥</span
              >
              <span class="stat-block__label">Day Streak</span>
            </div>
          </div>
        }
        @if (stats().weeklyLoadAu > 0) {
          <div class="stat-item stat-block stat-block--compact">
            <div class="stat-block__content">
              <span class="stat-block__value">{{
                formatLoad(stats().weeklyLoadAu)
              }}</span>
              <span class="stat-block__label">Weekly Load</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: "./week-progress-strip.component.scss",
})
export class WeekProgressStripComponent {
  // Inputs
  weekDays = input.required<WeekDay[]>();
  stats = input.required<WeekStats>();

  // Methods
  getDayTooltip(day: WeekDay): string {
    const statusText =
      {
        complete: "Completed",
        partial: "Partially done",
        planned: "Planned",
        rest: "Rest day",
        empty: "No session",
      }[day.status] || "";

    let tooltip = `${day.dayName} ${day.dayNumber}: ${statusText}`;

    if (day.loadAu && day.loadAu > 0) {
      tooltip += ` (${day.loadAu} AU)`;
    }

    return tooltip;
  }

  formatLoad(au: number): string {
    if (au >= 1000) {
      return `${(au / 1000).toFixed(1)}k AU`;
    }
    return `${au} AU`;
  }
}
