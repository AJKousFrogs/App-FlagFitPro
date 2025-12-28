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
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

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
    CardModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
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
          <p-tag
            [value]="getUrgencyLabel()"
            [severity]="getUrgencySeverity()"
          ></p-tag>
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
            [style]="{ height: '8px' }"
            [styleClass]="getProgressClass()"
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
          <p-button
            label="Game Day Check-in"
            icon="pi pi-check-square"
            styleClass="p-button-sm"
            [styleClass]="hoursRemaining() < 24 ? 'p-button-warning' : ''"
            routerLink="/game/readiness"
          ></p-button>
          <p-button
            label="Fuel Plan"
            icon="pi pi-apple"
            [outlined]="true"
            styleClass="p-button-sm"
            routerLink="/game/nutrition"
          ></p-button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .countdown-widget {
        background: var(--surface-primary);
        border-radius: 16px;
        padding: var(--space-5);
        border: 2px solid var(--p-surface-200);
        transition: all 0.3s ease;
      }

      .countdown-widget.urgent {
        border-color: var(--p-orange-300);
        background: linear-gradient(
          135deg,
          var(--surface-primary) 0%,
          var(--p-orange-50) 100%
        );
      }

      .countdown-widget.game-day {
        border-color: var(--p-red-400);
        background: linear-gradient(
          135deg,
          var(--surface-primary) 0%,
          var(--p-red-50) 100%
        );
        animation: pulse-border 2s infinite;
      }

      @keyframes pulse-border {
        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
        }
      }

      /* Header */
      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .header-left i {
        font-size: 1.25rem;
        color: var(--p-orange-500);
      }

      .game-day .header-left i {
        color: var(--p-red-500);
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .header-title {
        font-weight: 700;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-primary);
      }

      /* Countdown Display */
      .countdown-display {
        display: flex;
        justify-content: center;
        gap: var(--space-4);
        margin-bottom: var(--space-5);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: 12px;
      }

      .countdown-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 60px;
      }

      .countdown-value {
        font-size: 2rem;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1;
      }

      .urgent .countdown-value {
        color: var(--p-orange-600);
      }

      .game-day .countdown-value {
        color: var(--p-red-600);
      }

      .countdown-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: var(--space-1);
      }

      /* Game Info */
      .game-info {
        text-align: center;
        margin-bottom: var(--space-4);
      }

      .opponent-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .vs-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .opponent-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .game-details {
        display: flex;
        justify-content: center;
        gap: var(--space-4);
      }

      .detail {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .detail i {
        font-size: 0.875rem;
      }

      /* Readiness Section */
      .readiness-section {
        margin-bottom: var(--space-4);
      }

      .readiness-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .readiness-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .readiness-percent {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      :host ::ng-deep .progress-green .p-progressbar-value {
        background: var(--p-green-500);
      }

      :host ::ng-deep .progress-orange .p-progressbar-value {
        background: var(--p-orange-500);
      }

      :host ::ng-deep .progress-red .p-progressbar-value {
        background: var(--p-red-500);
      }

      /* Checklist */
      .checklist {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.2s;
        cursor: pointer;
      }

      .checklist-item:hover {
        background: var(--p-surface-100);
      }

      .checklist-item.completed {
        background: var(--p-green-50);
      }

      .item-status i {
        font-size: 1rem;
        color: var(--p-surface-400);
      }

      .checklist-item.completed .item-status i {
        color: var(--p-green-500);
      }

      .item-label {
        flex: 1;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .checklist-item.completed .item-label {
        color: var(--p-green-700);
      }

      .item-arrow {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      /* Actions */
      .widget-actions {
        display: flex;
        gap: var(--space-3);
      }

      .widget-actions p-button {
        flex: 1;
      }

      :host ::ng-deep .widget-actions .p-button {
        width: 100%;
        justify-content: center;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .countdown-display {
          gap: var(--space-3);
        }

        .countdown-value {
          font-size: 1.5rem;
        }

        .widget-actions {
          flex-direction: column;
        }
      }
    `,
  ],
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

  getUrgencySeverity(): "success" | "info" | "warn" | "danger" {
    const hours = this.hoursRemaining();
    if (hours < 4) return "danger";
    if (hours < 24) return "warn";
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
          }))
        );
      }
    } catch (error) {
      this.logger.error("Error loading checklist state:", error);
    }
  }
}
