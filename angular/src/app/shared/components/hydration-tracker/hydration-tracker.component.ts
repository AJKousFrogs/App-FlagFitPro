/**
 * Hydration Tracker Component
 * 
 * Visual water intake tracking widget for athlete dashboard.
 * Allows quick logging and shows daily progress toward hydration goal.
 * 
 * Design System Compliant (DESIGN_SYSTEM_RULES.md):
 * - Decision 14: Border-first cards
 * - Decision 33: Card header pattern (title left, actions right)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { TooltipModule } from "primeng/tooltip";
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";

interface HydrationLog {
  id: string;
  amount: number;
  timestamp: string;
  type: "water" | "sports_drink" | "other";
}

@Component({
  selector: "app-hydration-tracker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, ProgressBarModule, TooltipModule],
  template: `
    <div class="hydration-card">
      <!-- Header -->
      <div class="hydration-header">
        <div class="header-title">
          <i class="pi pi-tint"></i>
          <h3>Hydration</h3>
        </div>
        <span class="daily-goal">Goal: {{ dailyGoal() }}ml</span>
      </div>

      <!-- Main Display -->
      <div class="hydration-display">
        <div class="water-visual">
          <div class="water-bottle">
            <div 
              class="water-level" 
              [style.height.%]="waterLevelPercent()"
              [class.low]="waterLevelPercent() < 30"
              [class.medium]="waterLevelPercent() >= 30 && waterLevelPercent() < 70"
              [class.high]="waterLevelPercent() >= 70"
            ></div>
            <div class="water-waves"></div>
          </div>
        </div>
        
        <div class="hydration-stats">
          <div class="current-intake">
            <span class="value">{{ totalIntake() }}</span>
            <span class="unit">ml</span>
          </div>
          <div class="progress-text">
            {{ progressPercent() }}% of daily goal
          </div>
          <p-progressBar 
            [value]="progressPercent()" 
            [showValue]="false"
            styleClass="hydration-progress"
          ></p-progressBar>
        </div>
      </div>

      <!-- Quick Add Buttons -->
      <div class="quick-add-section">
        <span class="quick-add-label" id="quick-add-label">Quick Add:</span>
        <div class="quick-add-buttons" role="group" aria-labelledby="quick-add-label">
          @for (amount of quickAddAmounts; track amount) {
            <button 
              class="quick-add-btn"
              [class.loading]="isLoading()"
              (click)="addWater(amount)"
              [disabled]="isLoading()"
              [pTooltip]="'Add ' + amount + 'ml of water'"
              [attr.aria-label]="'Add ' + amount + ' milliliters of water'"
              [attr.aria-busy]="isLoading()"
            >
              @if (isLoading()) {
                <i class="pi pi-spin pi-spinner"></i>
              } @else {
                <i class="pi pi-plus"></i>
              }
              {{ amount }}ml
            </button>
          }
        </div>
      </div>

      <!-- Recent Logs -->
      @if (recentLogs().length > 0) {
        <div class="recent-logs">
          <span class="logs-label">Today:</span>
          <div class="logs-list">
            @for (log of recentLogs().slice(0, 3); track log.id) {
              <span class="log-item">
                {{ log.amount }}ml @ {{ formatTime(log.timestamp) }}
              </span>
            }
          </div>
        </div>
      }

      <!-- Hydration Tips -->
      @if (showTip()) {
        <div class="hydration-tip" [class.warning]="needsMoreWater()">
          <i [class]="needsMoreWater() ? 'pi pi-exclamation-triangle' : 'pi pi-info-circle'"></i>
          <span>{{ hydrationTip() }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './hydration-tracker.component.scss',
})
export class HydrationTrackerComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // State
  isLoading = signal(false);
  hydrationLogs = signal<HydrationLog[]>([]);
  dailyGoal = signal(2500); // Default 2.5L goal

  // Quick add amounts
  quickAddAmounts = [150, 250, 500];

  // Computed values
  totalIntake = computed(() => {
    return this.hydrationLogs().reduce((sum, log) => sum + log.amount, 0);
  });

  progressPercent = computed(() => {
    const percent = (this.totalIntake() / this.dailyGoal()) * 100;
    return Math.min(100, Math.round(percent));
  });

  waterLevelPercent = computed(() => {
    return Math.min(100, (this.totalIntake() / this.dailyGoal()) * 100);
  });

  recentLogs = computed(() => {
    return [...this.hydrationLogs()].reverse();
  });

  needsMoreWater = computed(() => {
    const hour = new Date().getHours();
    const expectedPercent = (hour / 18) * 100; // Expect to hit goal by 6pm
    return this.progressPercent() < expectedPercent - 20;
  });

  showTip = computed(() => {
    return this.progressPercent() < 100;
  });

  hydrationTip = computed(() => {
    const percent = this.progressPercent();
    const remaining = this.dailyGoal() - this.totalIntake();

    if (percent < 25) {
      return `You're behind on hydration! Drink ${remaining}ml more today.`;
    } else if (percent < 50) {
      return `Keep drinking! ${remaining}ml left to reach your goal.`;
    } else if (percent < 75) {
      return `Good progress! Just ${remaining}ml more to go.`;
    } else if (percent < 100) {
      return `Almost there! Only ${remaining}ml remaining.`;
    }
    return "Great job! You've hit your hydration goal! 💧";
  });

  ngOnInit(): void {
    this.loadTodayLogs();
  }

  /**
   * Load today's hydration logs
   */
  private loadTodayLogs(): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    this.isLoading.set(true);

    this.apiService
      .get<{ success: boolean; data: { logs: HydrationLog[] } }>(
        "/api/hydration"
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = response as any;
          if (data.success && data.data?.logs) {
            this.hydrationLogs.set(data.data.logs as HydrationLog[]);
          }
          this.isLoading.set(false);
        },
        error: () => {
          // Use empty state, no error toast for missing data
          this.hydrationLogs.set([]);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Add water intake
   */
  addWater(amount: number): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    this.isLoading.set(true);

    this.apiService
      .post<{ success: boolean; data: HydrationLog }>("/api/hydration/log", {
        amount,
        type: "water",
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = response as any;
          if (data.success && data.data) {
            // Add to local state immediately
            const newLog: HydrationLog = {
              id: data.data.id || Date.now().toString(),
              amount: data.data.amount || amount,
              timestamp: data.data.timestamp || new Date().toISOString(),
              type: data.data.type || "water",
            };
            this.hydrationLogs.update((logs) => [...logs, newLog]);
            this.toastService.success(`Added ${amount}ml 💧`);
          }
          this.isLoading.set(false);
        },
        error: () => {
          // Optimistically add locally even if API fails
          const newLog: HydrationLog = {
            id: Date.now().toString(),
            amount,
            timestamp: new Date().toISOString(),
            type: "water",
          };
          this.hydrationLogs.update((logs) => [...logs, newLog]);
          this.toastService.success(`Added ${amount}ml 💧`);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Format time for display
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}
