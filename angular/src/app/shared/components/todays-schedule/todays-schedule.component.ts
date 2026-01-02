/**
 * Today's Schedule Component
 *
 * Displays the athlete's daily training schedule with timeline view.
 * Shows scheduled sessions, completed items, and upcoming activities.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  type: "training" | "recovery" | "nutrition" | "wellness" | "game" | "rest";
  duration?: number; // minutes
  status: "upcoming" | "in-progress" | "completed" | "skipped";
  description?: string;
  location?: string;
}

@Component({
  selector: "app-todays-schedule",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
  ],
  templateUrl: "./todays-schedule.component.html",
  styleUrls: ["./todays-schedule.component.scss"],
})
export class TodaysScheduleComponent implements OnInit {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // State
  isLoading = signal(true);
  scheduleItems = signal<ScheduleItem[]>([]);
  error = signal<string | null>(null);

  // Computed
  hasSchedule = computed(() => this.scheduleItems().length > 0);
  completedCount = computed(
    () => this.scheduleItems().filter((item) => item.status === "completed").length
  );
  totalCount = computed(() => this.scheduleItems().length);
  progressPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  currentItem = computed(() =>
    this.scheduleItems().find((item) => item.status === "in-progress")
  );

  nextItem = computed(() => {
    const items = this.scheduleItems();
    const currentIndex = items.findIndex((item) => item.status === "in-progress");
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      return items[currentIndex + 1];
    }
    return items.find((item) => item.status === "upcoming");
  });

  ngOnInit(): void {
    this.loadSchedule();
  }

  private loadSchedule(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Try to fetch from daily-training API
    this.apiService.get<any>("/api/daily-training").subscribe({
      next: (response) => {
        if (response?.data?.todaysPractice) {
          const practice = response.data.todaysPractice;
          const items = this.mapPracticeToSchedule(practice);
          this.scheduleItems.set(items);
        } else {
          // Generate default schedule
          this.scheduleItems.set(this.getDefaultSchedule());
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.logger.error("Error loading schedule:", err);
        // Fall back to default schedule
        this.scheduleItems.set(this.getDefaultSchedule());
        this.isLoading.set(false);
      },
    });
  }

  private mapPracticeToSchedule(practice: any): ScheduleItem[] {
    const items: ScheduleItem[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    // Morning wellness check
    items.push({
      id: "wellness-am",
      time: "07:00",
      title: "Morning Wellness Check",
      type: "wellness",
      duration: 5,
      status: currentHour >= 8 ? "completed" : currentHour >= 7 ? "in-progress" : "upcoming",
      description: "Log sleep, energy, and mood",
    });

    // Pre-workout nutrition
    items.push({
      id: "nutrition-pre",
      time: "08:30",
      title: "Pre-Workout Nutrition",
      type: "nutrition",
      duration: 30,
      status: currentHour >= 9 ? "completed" : currentHour >= 8 ? "in-progress" : "upcoming",
      description: "Balanced meal 1-2 hours before training",
    });

    // Main training session
    if (practice.sessionType && practice.sessionType !== "Rest") {
      items.push({
        id: "training-main",
        time: "10:00",
        title: practice.sessionType || "Training Session",
        type: "training",
        duration: practice.totalDuration || 60,
        status: currentHour >= 11 ? "completed" : currentHour >= 10 ? "in-progress" : "upcoming",
        description: practice.focus?.join(", ") || "Scheduled training",
        location: practice.location,
      });
    } else {
      items.push({
        id: "rest-day",
        time: "10:00",
        title: "Active Recovery",
        type: "rest",
        duration: 30,
        status: currentHour >= 11 ? "completed" : currentHour >= 10 ? "in-progress" : "upcoming",
        description: "Light stretching and mobility work",
      });
    }

    // Post-workout recovery
    items.push({
      id: "recovery-post",
      time: "12:00",
      title: "Post-Workout Recovery",
      type: "recovery",
      duration: 20,
      status: currentHour >= 13 ? "completed" : currentHour >= 12 ? "in-progress" : "upcoming",
      description: "Cool down, stretching, foam rolling",
    });

    // Afternoon nutrition
    items.push({
      id: "nutrition-post",
      time: "13:00",
      title: "Recovery Nutrition",
      type: "nutrition",
      duration: 30,
      status: currentHour >= 14 ? "completed" : currentHour >= 13 ? "in-progress" : "upcoming",
      description: "Protein-rich meal for recovery",
    });

    // Evening wellness
    items.push({
      id: "wellness-pm",
      time: "20:00",
      title: "Evening Check-in",
      type: "wellness",
      duration: 5,
      status: currentHour >= 21 ? "completed" : currentHour >= 20 ? "in-progress" : "upcoming",
      description: "Log soreness and daily summary",
    });

    return items;
  }

  private getDefaultSchedule(): ScheduleItem[] {
    const now = new Date();
    const currentHour = now.getHours();

    return [
      {
        id: "wellness-am",
        time: "07:00",
        title: "Morning Wellness",
        type: "wellness",
        duration: 5,
        status: currentHour >= 8 ? "completed" : "upcoming",
      },
      {
        id: "training-main",
        time: "10:00",
        title: "Training Session",
        type: "training",
        duration: 60,
        status: currentHour >= 11 ? "completed" : currentHour >= 10 ? "in-progress" : "upcoming",
      },
      {
        id: "recovery",
        time: "12:00",
        title: "Recovery",
        type: "recovery",
        duration: 20,
        status: currentHour >= 13 ? "completed" : "upcoming",
      },
    ];
  }

  getTypeIcon(type: ScheduleItem["type"]): string {
    const icons: Record<string, string> = {
      training: "pi-bolt",
      recovery: "pi-heart",
      nutrition: "pi-apple", // Note: Using a generic icon
      wellness: "pi-chart-line",
      game: "pi-flag",
      rest: "pi-moon",
    };
    return icons[type] || "pi-calendar";
  }

  getTypeSeverity(type: ScheduleItem["type"]): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    // All tags use the same neutral color for visual consistency
    return "secondary";
  }

  getStatusClass(status: ScheduleItem["status"]): string {
    return `status--${status}`;
  }

  markComplete(item: ScheduleItem): void {
    const items = this.scheduleItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      const updated = [...items];
      updated[index] = { ...updated[index], status: "completed" };
      this.scheduleItems.set(updated);
    }
  }

  refresh(): void {
    this.loadSchedule();
  }
}
