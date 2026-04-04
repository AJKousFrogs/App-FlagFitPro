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
import { ProgressBarComponent } from "../progress-bar/progress-bar.component";
import { Tooltip } from "primeng/tooltip";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";
import { isSuccessfulApiResponse } from "../../../core/utils/api-response-mapper";
import { formatTimeOfDay } from "../../utils/format.utils";
import { ButtonComponent, CardShellComponent } from "../ui-components";

interface HydrationLog {
  id: string;
  amount: number;
  timestamp: string;
  type: "water" | "sports_drink" | "other";
}

@Component({
  selector: "app-hydration-tracker",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardShellComponent,
    ProgressBarComponent,
    Tooltip,
  ],
  template: `
    <app-card-shell
      title="Hydration"
      [subtitle]="'Goal: ' + dailyGoal() + 'ml'"
      headerIcon="pi-tint"
    >
      <!-- Main Display -->
      <div class="hydration-display">
        <div class="water-visual">
          <div class="water-bottle">
            <div
              class="water-level"
              [style.height.%]="waterLevelPercent()"
              [class.low]="waterLevelPercent() < 30"
              [class.medium]="
                waterLevelPercent() >= 30 && waterLevelPercent() < 70
              "
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
          <app-progress-bar
            [value]="progressPercent()"
            [showValue]="false"
            class="hydration-progress"
          ></app-progress-bar>
        </div>
      </div>

      <!-- Quick Add Buttons -->
      <div class="quick-add-section">
        <span class="quick-add-label" id="quick-add-label">Quick Add:</span>
        <div
          class="quick-add-buttons"
          role="group"
          aria-labelledby="quick-add-label"
        >
          @for (amount of quickAddAmounts; track amount) {
            <app-button
              variant="outlined"
              size="sm"
              icon="plus"
              [loading]="isLoading()"
              (clicked)="addWater(amount)"
              [pTooltip]="'Add ' + amount + 'ml of water'"
              [ariaLabel]="'Add ' + amount + ' milliliters of water'"
            >
              {{ amount }}ml
            </app-button>
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
      <div header-actions>
        @if (showTip()) {
          <div class="hydration-tip" [class.warning]="needsMoreWater()">
            <i
              [class]="
                needsMoreWater()
                  ? 'pi pi-exclamation-triangle'
                  : 'pi-info-circle'
              "
            ></i>
            <span>{{ hydrationTip() }}</span>
          </div>
        }
      </div>
    </app-card-shell>
  `,
  styleUrl: "./hydration-tracker.component.scss",
})
export class HydrationTrackerComponent implements OnInit {
  private trainingService = inject(UnifiedTrainingService);
  private supabase = inject(SupabaseService);
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
    // hydrationLevel() returns glasses, convert to ml (1 glass = 250ml)
    const unifiedLevelGlasses = this.trainingService.hydrationLevel();
    const unifiedLevelMl = unifiedLevelGlasses * 250;
    return Math.max(
      unifiedLevelMl,
      this.hydrationLogs().reduce((sum, log) => sum + log.amount, 0),
    );
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
    const userId = this.supabase.userId();
    if (!userId) return;

    this.isLoading.set(true);

    this.trainingService
      .getWellnessForDay(new Date().toISOString().split("T")[0])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Wellness entry might have the level but not individual logs
          // We'll trust the computed totalIntake which uses trainingService.hydrationLevel()
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Add water intake
   */
  addWater(amount: number): void {
    const userId = this.supabase.userId();
    if (!userId) return;

    this.isLoading.set(true);

    this.trainingService
      .addHydration(amount)
      .then((result) => {
        if (isSuccessfulApiResponse(result)) {
          const newLog: HydrationLog = {
            id: Date.now().toString(),
            amount,
            timestamp: new Date().toISOString(),
            type: "water",
          };
          this.hydrationLogs.update((logs) => [...logs, newLog]);
          this.toastService.success(`Added ${amount}ml 💧`);
        }
        this.isLoading.set(false);
      })
      .catch(() => {
        this.isLoading.set(false);
      });
  }

  /**
   * Format time for display
   */
  formatTime = formatTimeOfDay;
}
