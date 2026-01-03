/**
 * Today schedule Component
 *
 * Displays the athlete's daily training schedule with timeline view.
 * Shows scheduled sessions, completed items, and upcoming activities.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import {
    ButtonComponent,
    CardComponent,
} from "../ui-components";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";
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
    ButtonComponent,
    CardComponent,
    TagModule,
    TooltipModule,
    SkeletonModule,
  ],
  templateUrl: "./todays-schedule.component.html",
  styleUrls: ["./todays-schedule.component.scss"],
})
export class TodaysScheduleComponent {
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly logger = inject(LoggerService);

  // State - local writable signal initialized from service
  readonly isLoading = this.trainingService.isRefreshing;
  readonly scheduleItems = signal<ScheduleItem[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    // Initialize schedule items from service using effect
    effect(() => {
      const items = this.trainingService.todaysScheduleItems();
      this.scheduleItems.set(items as ScheduleItem[]);
    });
  }

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


  private loadSchedule(): void {
    // Handled by service refresh
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

  takeSupplements(item: ScheduleItem): void {
    const morningSupps = ["Creatine", "Vitamin D", "Omega-3", "Iron", "Calcium", "Multivitamin"];
    const date = new Date().toISOString().split('T')[0];
    
    morningSupps.forEach(name => {
      this.trainingService.logSupplement({
        name,
        taken: true,
        timeOfDay: 'morning' as const,
        date
      }).subscribe({
        error: (err: unknown) => this.logger.error('Failed to log supplement:', err)
      });
    });

    this.markComplete(item);
  }

  refresh(): void {
    this.loadSchedule();
  }
}
