/**
 * Game Day Countdown Widget
 *
 * Shows countdown to upcoming game with:
 * - Hours/minutes countdown
 * - Readiness checklist progress
 * - Quick access to game day features
 * - Urgency indicators
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

// PrimeNG

import { ButtonComponent } from "../button/button.component";
import { ProgressBar } from "primeng/progressbar";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";

// Services
import { LoggerService } from "../../../core/services/logger.service";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  route?: string;
  icon: string;
}

interface UpcomingGame {
  id: string;
  opponent: string;
  date: Date;
  time: string;
  location: string;
  isHome: boolean;
}

@Component({
  selector: "app-game-day-countdown",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ProgressBar,
    Tooltip,
    ButtonComponent,
    StatusTagComponent,
  ],
  template: `
    @if (game()) {
      <div
        class="countdown-widget"
        [class.urgent]="hoursRemaining() < 24"
        [class.game-day]="hoursRemaining() < 4"
      >
        <!-- Header -->
        <div class="widget-header">
          <div class="header-left">
            <i class="pi pi-flag-fill"></i>
            <span class="header-title">
              @if (hoursRemaining() < 4) {
                GAME TIME!
              } @else if (hoursRemaining() < 24) {
                GAME DAY
              } @else {
                Upcoming Game
              }
            </span>
          </div>
          <app-status-tag
            [value]="getUrgencyLabel()"
            [severity]="getUrgencySeverity()"
            size="sm"
          />
        </div>

        <!-- Countdown Display -->
        <div class="countdown-display">
          @if (hoursRemaining() >= 24) {
            <div class="countdown-unit">
              <span class="countdown-value">{{ daysRemaining() }}</span>
              <span class="countdown-label">days</span>
            </div>
          }
          <div class="countdown-unit">
            <span class="countdown-value">{{ displayHours() }}</span>
            <span class="countdown-label">hours</span>
          </div>
          <div class="countdown-unit">
            <span class="countdown-value">{{ minutesRemaining() }}</span>
            <span class="countdown-label">mins</span>
          </div>
        </div>

        <!-- Game Info -->
        <div class="game-info">
          <div class="opponent-row">
            <span class="vs-label">VS</span>
            <span class="opponent-name">{{ game()!.opponent }}</span>
          </div>
          <div class="game-details">
            <span class="detail">
              <i class="pi pi-clock"></i>
              {{ game()!.time }}
            </span>
            <span class="detail">
              <i class="pi pi-map-marker"></i>
              {{ game()!.isHome ? "Home" : game()!.location }}
            </span>
          </div>
        </div>

        <!-- Readiness Progress -->
        <div class="readiness-section">
          <div class="readiness-header">
            <span class="readiness-label">Readiness</span>
            <span class="readiness-percent">{{ readinessPercent() }}%</span>
          </div>
          <p-progressBar
            [value]="readinessPercent()"
            [showValue]="false"
            [class]="getProgressClass() + ' progressbar-height-sm'"
          ></p-progressBar>
        </div>

        <!-- Checklist Items -->
        <div class="checklist">
          @for (item of checklistItems(); track item.id) {
            <a
              class="checklist-item"
              [class.completed]="item.completed"
              [routerLink]="item.route"
              [pTooltip]="item.completed ? 'Completed' : 'Click to complete'"
            >
              <div class="item-status">
                @if (item.completed) {
                  <i class="pi pi-check-circle"></i>
                } @else {
                  <i class="pi pi-circle"></i>
                }
              </div>
              <span class="item-label">{{ item.label }}</span>
              @if (!item.completed) {
                <i class="pi pi-chevron-right item-arrow"></i>
              }
            </a>
          }
        </div>

        <!-- Action Buttons -->
        <div class="widget-actions">
          <app-button iconLeft="pi-check-square" routerLink="/game/readiness"
            >Game Day Check-in</app-button
          >
          <app-button
            variant="outlined"
            iconLeft="pi-apple"
            routerLink="/game/nutrition"
            >Fuel Plan</app-button
          >
        </div>
      </div>
    }
  `,
  styleUrl: "./game-day-countdown.component.scss",
})
export class GameDayCountdownComponent implements OnInit, OnDestroy {
  private logger = inject(LoggerService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Inputs
  game = input<UpcomingGame | null>(null);

  // State
  private now = signal(new Date());

  // Checklist items
  checklistItems = signal<ChecklistItem[]>([
    {
      id: "wellness",
      label: "Wellness Check-in",
      completed: false,
      route: "/wellness",
      icon: "pi-heart",
    },
    {
      id: "readiness",
      label: "Game Day Readiness",
      completed: false,
      route: "/game/readiness",
      icon: "pi-check-square",
    },
    {
      id: "nutrition",
      label: "Nutrition Plan Reviewed",
      completed: false,
      route: "/game/nutrition",
      icon: "pi-apple",
    },
    {
      id: "equipment",
      label: "Equipment Packed",
      completed: false,
      route: "/equipment",
      icon: "pi-box",
    },
  ]);

  // Computed values
  hoursRemaining = computed(() => {
    const game = this.game();
    if (!game) return 0;
    const diff = game.date.getTime() - this.now().getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  });

  daysRemaining = computed(() => {
    return Math.floor(this.hoursRemaining() / 24);
  });

  displayHours = computed(() => {
    return this.hoursRemaining() % 24;
  });

  minutesRemaining = computed(() => {
    const game = this.game();
    if (!game) return 0;
    const diff = game.date.getTime() - this.now().getTime();
    return Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
  });

  readinessPercent = computed(() => {
    const items = this.checklistItems();
    const completed = items.filter((i) => i.completed).length;
    return Math.round((completed / items.length) * 100);
  });

  ngOnInit(): void {
    // Update time every minute
    this.intervalId = setInterval(() => {
      this.now.set(new Date());
    }, 60000);

    // Load checklist state from localStorage
    this.loadChecklistState();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getUrgencyLabel(): string {
    const hours = this.hoursRemaining();
    if (hours < 4) return "NOW";
    if (hours < 24) return "TODAY";
    if (hours < 48) return "TOMORROW";
    return `${this.daysRemaining()}d`;
  }

  getUrgencySeverity(): "success" | "info" | "warning" | "danger" {
    const hours = this.hoursRemaining();
    if (hours < 4) return "danger";
    if (hours < 24) return "warning";
    return "info";
  }

  getProgressClass(): string {
    const percent = this.readinessPercent();
    if (percent >= 75) return "progress-green";
    if (percent >= 50) return "progress-orange";
    return "progress-red";
  }

  private loadChecklistState(): void {
    try {
      const game = this.game();
      if (!game) return;

      const stored = localStorage.getItem(`game-checklist-${game.id}`);
      if (stored) {
        const completed = JSON.parse(stored) as string[];
        this.checklistItems.update((items) =>
          items.map((item) => ({
            ...item,
            completed: completed.includes(item.id),
          })),
        );
      }
    } catch (error) {
      this.logger.error("Error loading checklist state:", error);
    }
  }
}
