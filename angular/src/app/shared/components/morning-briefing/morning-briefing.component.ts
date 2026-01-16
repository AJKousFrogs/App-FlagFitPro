/**
 * Morning Briefing Component
 *
 * Streamlined morning flow for elite athletes:
 * - Quick 30-second wellness check-in
 * - Today's training overview
 * - Game day alerts
 * - ACWR status at a glance
 *
 * Reduces morning navigation from 3-4 screens to 1
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { firstValueFrom } from "rxjs";

// PrimeNG
import { Checkbox } from "primeng/checkbox";
import { InputNumber } from "primeng/inputnumber";
import { ProgressBar } from "primeng/progressbar";
import { Ripple } from "primeng/ripple";
import { Slider } from "primeng/slider";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";

// Services
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import { DailyTrainingService } from "../../../core/services/daily-training.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";
import { WellnessService } from "../../../core/services/wellness.service";
import { ButtonComponent, CardComponent } from "../ui-components";

interface QuickCheckIn {
  overallFeeling: number;
  sleepHours: number;
  hasPain: boolean;
  painLocation?: string;
  tookSupplements: boolean;
  supplementsTaken?: string;
}

interface TodaysPlan {
  sessionType: string;
  duration: number;
  focus: string[];
  phase: string;
}

@Component({
  selector: "app-morning-briefing",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardComponent,
    ButtonComponent,
    Slider,
    InputNumber,
    ProgressBar,
    Ripple,
    Tooltip,
    Checkbox,
    StatusTagComponent,
  ],
  template: `
    <div class="morning-briefing" [class.expanded]="isExpanded()">
      <!-- Collapsed State: Quick Summary -->
      @if (!isExpanded()) {
        <div class="briefing-collapsed" (click)="expand()">
          <div class="greeting-row">
            <div class="greeting">
              <span class="greeting-emoji">{{ getTimeEmoji() }}</span>
              <div class="greeting-text">
                <h2 data-testid="welcome-message">
                  {{ getGreeting() }}, {{ userName() }}!
                </h2>
                <p class="date-text">{{ formattedDate() }}</p>
              </div>
            </div>
            <div class="quick-status">
              @if (hasCheckedInToday()) {
                <app-status-tag value="✓ Checked In" severity="success" size="sm" />
              } @else {
                <app-status-tag value="Check-in Needed" severity="warning" size="sm" />
              }
            </div>
          </div>

          <!-- ACWR Quick View with Micro-Context -->
          <div class="metrics-row">
            <div class="metric">
              <span class="metric-label">ACWR</span>
              <span class="metric-value" [class]="getAcwrClass()">
                @if (acwrValue() === 0) {
                  <span class="value-placeholder">—</span>
                } @else {
                  {{ acwrValue() | number: "1.2-2" }}
                }
              </span>
              <span class="metric-context" [class]="getAcwrClass()">
                {{ getAcwrContext() }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">READINESS</span>
              <span class="metric-value">{{ readinessScore() }}%</span>
              <span class="metric-context" [class]="getReadinessClass()">
                {{ getReadinessContext() }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">TODAY</span>
              <span class="metric-value">{{
                todaysPlan()?.sessionType || "Rest"
              }}</span>
              <span class="metric-context muted">
                {{
                  todaysPlan()?.duration
                    ? todaysPlan()?.duration + " min"
                    : "No session"
                }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">SUPPLEMENTS</span>
              <span
                class="metric-value"
                [class]="
                  quickCheckIn.tookSupplements
                    ? 'status-good'
                    : 'status-pending'
                "
              >
                {{ quickCheckIn.tookSupplements ? "Done" : "Pending" }}
              </span>
              <span
                class="metric-context"
                [class]="quickCheckIn.tookSupplements ? 'muted' : 'status-warn'"
              >
                {{ getSupplementContext() }}
              </span>
            </div>
          </div>

          <!-- Game Day Alert -->
          @if (upcomingGame()) {
            <div class="game-alert" [class.urgent]="isGameToday()">
              <i class="pi pi-flag"></i>
              <span>
                @if (isGameToday()) {
                  GAME DAY! {{ upcomingGame()?.opponent }} at
                  {{ upcomingGame()?.time }}
                } @else {
                  Game in {{ hoursUntilGame() }}h vs
                  {{ upcomingGame()?.opponent }}
                }
              </span>
            </div>
          }

          <app-button
            variant="text"
            [fullWidth]="true"
            iconRight="chevron-down"
          >
            {{ hasCheckedInToday() ? "View Details" : "Quick Check-in" }}
          </app-button>
        </div>
      }

      <!-- Expanded State: Full Briefing -->
      @if (isExpanded()) {
        <div class="briefing-expanded">
          <!-- Header with close -->
          <div class="expanded-header">
            <div class="greeting">
              <span class="greeting-emoji">{{ getTimeEmoji() }}</span>
              <div class="greeting-text">
                <h2 data-testid="welcome-message-expanded">
                  {{ getGreeting() }}, {{ userName() }}!
                </h2>
                <p class="date-text">{{ formattedDate() }}</p>
              </div>
            </div>
            <app-button
              variant="text"
              icon="times"
              ariaLabel="Collapse briefing"
              (clicked)="collapse()"
            ></app-button>
          </div>

          <!-- Quick Check-in Section -->
          @if (!hasCheckedInToday()) {
            <div class="checkin-section">
              <h3>
                <i class="pi pi-bolt"></i>
                Quick Check-in
                <span class="time-badge">~30 sec</span>
              </h3>

              <div
                class="checkin-form"
                role="form"
                aria-label="Quick wellness check-in form"
              >
                <!-- Overall Feeling Slider -->
                <div class="feeling-slider">
                  <label id="feeling-label">How do you feel overall?</label>
                  <div
                    class="slider-container"
                    role="group"
                    aria-labelledby="feeling-label"
                  >
                    <span class="emoji-label" aria-hidden="true">😫</span>
                    <p-slider
                      [(ngModel)]="quickCheckIn.overallFeeling"
                      [min]="1"
                      [max]="10"
                      [step]="1"
                      styleClass="feeling-slider-input"
                      [ariaLabel]="
                        'Overall feeling rating: ' +
                        quickCheckIn.overallFeeling +
                        ' out of 10'
                      "
                    ></p-slider>
                    <span class="emoji-label" aria-hidden="true">🔥</span>
                  </div>
                  <div class="slider-value" aria-live="polite">
                    <span class="visually-hidden">Current rating:</span>
                    {{ quickCheckIn.overallFeeling }}/10
                    <span class="feeling-label">{{
                      getFeelingLabel(quickCheckIn.overallFeeling)
                    }}</span>
                  </div>
                </div>

                <!-- Sleep Hours -->
                <div class="sleep-input">
                  <label id="sleep-label">Sleep last night</label>
                  <div class="input-row">
                    <p-inputNumber
                      [(ngModel)]="quickCheckIn.sleepHours"
                      [min]="0"
                      [max]="14"
                      [minFractionDigits]="1"
                      [maxFractionDigits]="1"
                      [showButtons]="true"
                      suffix=" hrs"
                      styleClass="sleep-number-input"
                      ariaLabelledBy="sleep-label"
                    ></p-inputNumber>
                    <span
                      class="sleep-quality"
                      [class]="getSleepQualityClass()"
                      role="status"
                      [attr.aria-label]="
                        'Sleep quality: ' + getSleepQualityLabel()
                      "
                    >
                      {{ getSleepQualityLabel() }}
                    </span>
                  </div>
                </div>

                <!-- Pain Check -->
                <div class="pain-check">
                  <div class="pain-toggle">
                    <p-checkbox
                      [(ngModel)]="quickCheckIn.hasPain"
                      [binary]="true"
                      variant="filled"
                      inputId="hasPain"
                    ></p-checkbox>
                    <label for="hasPain">Any pain or soreness?</label>
                  </div>
                  @if (quickCheckIn.hasPain) {
                    <div class="pain-location">
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="quickCheckIn.painLocation"
                        placeholder="Where? (e.g., left hamstring)"
                        class="pain-input"
                      />
                    </div>
                  }
                </div>

                <!-- Supplement Check -->
                <div class="supplement-check">
                  <div class="supplement-toggle">
                    <p-checkbox
                      [(ngModel)]="quickCheckIn.tookSupplements"
                      [binary]="true"
                      variant="filled"
                      inputId="tookSupplements"
                    ></p-checkbox>
                    <label for="tookSupplements"
                      >Did you take your supplements?</label
                    >
                  </div>
                  @if (quickCheckIn.tookSupplements) {
                    <div class="supplement-details">
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="quickCheckIn.supplementsTaken"
                        placeholder="What did you take? (e.g., Creatine, Vit D)"
                        class="supplement-input"
                      />
                    </div>
                  }
                </div>

                <app-button
                  iconLeft="check"
                  [fullWidth]="true"
                  [loading]="isSubmitting()"
                  (clicked)="submitQuickCheckIn()"
                  >Submit Quick Check-in</app-button
                >

                <a routerLink="/wellness" class="full-checkin-link">
                  Need full check-in? →
                </a>
              </div>
            </div>
          } @else {
            <div class="checkin-complete">
              <i class="pi pi-check-circle"></i>
              <span>Wellness check-in complete for today!</span>
              <a routerLink="/wellness">View details →</a>
            </div>
          }

          <!-- Today's Plan Section -->
          <div class="todays-plan-section">
            <h3>
              <i class="pi pi-calendar"></i>
              Today's Plan
            </h3>

            @if (todaysPlan() && todaysPlan()?.sessionType !== "Rest") {
              <app-card variant="outlined" [flush]="true">
                <div class="plan-header-custom">
                  <div class="plan-type">
                    <span class="type-badge">{{
                      todaysPlan()!.sessionType
                    }}</span>
                    <span class="duration"
                      >{{ todaysPlan()!.duration }} min</span
                    >
                  </div>
                  <app-status-tag
                    [value]="todaysPlan()!.phase"
                    [severity]="getPhasesSeverity()"
                    size="sm"
                  />
                </div>

                @if (todaysPlan()!.focus.length > 0) {
                  <div class="focus-areas">
                    <span class="focus-label">Focus:</span>
                    @for (focus of todaysPlan()!.focus; track focus) {
                      <span class="focus-tag">{{ focus }}</span>
                    }
                  </div>
                }

                <div class="acwr-status">
                  <div class="acwr-visual">
                    <span class="acwr-label">ACWR Status</span>
                    <div class="acwr-bar">
                      <div
                        class="acwr-indicator"
                        [style.left.%]="getAcwrPosition()"
                        [class]="getAcwrClass()"
                      ></div>
                      <div class="zone zone-low"></div>
                      <div class="zone zone-optimal"></div>
                      <div class="zone zone-high"></div>
                    </div>
                    <div class="acwr-zones">
                      <span>Under</span>
                      <span>Optimal</span>
                      <span>High Risk</span>
                    </div>
                  </div>
                  <div class="acwr-value-display">
                    <span class="value" [class]="getAcwrClass()">
                      {{ acwrValue() | number: "1.2-2" }}
                    </span>
                    <span class="status">{{ acwrStatus() }}</span>
                  </div>
                </div>

                <app-button
                  iconLeft="play"
                  [fullWidth]="true"
                  routerLink="/training/daily"
                  >Start Today's Practice</app-button
                >
              </app-card>
            } @else {
              <div class="rest-day">
                <i class="pi pi-moon"></i>
                <h4>Rest Day</h4>
                <p>Focus on recovery and nutrition today.</p>
                <app-button
                  variant="outlined"
                  iconLeft="heart"
                  routerLink="/wellness"
                  >View Recovery Protocols</app-button
                >
              </div>
            }
          </div>

          <!-- Game Day Alert Section -->
          @if (upcomingGame()) {
            <div class="game-day-section" [class.urgent]="isGameToday()">
              <h3>
                <i class="pi pi-flag"></i>
                @if (isGameToday()) {
                  Game Day!
                } @else {
                  Upcoming Game
                }
              </h3>

              <div class="game-info">
                <div class="game-opponent">
                  <span class="vs">VS</span>
                  <span class="opponent">{{ upcomingGame()!.opponent }}</span>
                </div>
                <div class="game-details">
                  <span
                    ><i class="pi pi-clock"></i>
                    {{ upcomingGame()!.time }}</span
                  >
                  <span
                    ><i class="pi pi-map-marker"></i>
                    {{ upcomingGame()!.location }}</span
                  >
                </div>
                <div class="countdown" [class.urgent]="hoursUntilGame() < 24">
                  <span class="countdown-value">{{ hoursUntilGame() }}</span>
                  <span class="countdown-label">hours until game</span>
                </div>
              </div>

              <div class="game-actions">
                <app-button
                  variant="primary"
                  icon="check-square"
                  routerLink="/game/readiness"
                  >Game Day Check-in</app-button
                >
                <app-button
                  variant="outlined"
                  icon="heart"
                  routerLink="/game/nutrition"
                  >Nutrition Plan</app-button
                >
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ["./morning-briefing.component.scss"],
})
export class MorningBriefingComponent implements OnInit {
  private router = inject(Router);
  private trainingService = inject(UnifiedTrainingService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private apiService = inject(ApiService);
  private dailyTrainingService = inject(DailyTrainingService);
  private wellnessService = inject(WellnessService);

  // Outputs
  checkInComplete = output<void>();

  // State
  isExpanded = signal(false);
  isSubmitting = signal(false);
  isLoadingPlan = signal(false);

  // Quick check-in data
  quickCheckIn: QuickCheckIn = {
    overallFeeling: 7,
    sleepHours: 7.5,
    hasPain: false,
    painLocation: "",
    tookSupplements: false,
    supplementsTaken: "",
  };

  // Computed values from Unified Service
  userName = computed(() => {
    const user = this.authService.getUser();
    const typedUser = user as { name?: string; email?: string } | null;
    const name = typedUser?.name || typedUser?.email?.split("@")[0];
    return name?.split(" ")[0] || "Athlete";
  });

  acwrValue = this.trainingService.acwrRatio;
  acwrStatus = computed(() => this.trainingService.acwrRiskZone().description);
  readinessScore = this.trainingService.readinessScore;
  hasCheckedInToday = this.trainingService.hasCheckedInToday;

  todaysPlan = signal<TodaysPlan | null>(null);

  upcomingGame = signal<{
    opponent: string;
    time: string;
    location: string;
    date: Date;
  } | null>(null);

  formattedDate = computed(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  });

  ngOnInit(): void {
    this.loadUpcomingGame();
    this.loadDailyTrainingPlan();
  }

  private loadDailyTrainingPlan(): void {
    this.isLoadingPlan.set(true);
    this.dailyTrainingService.getDailyTraining().subscribe({
      next: (response) => {
        if (response && response.todaysPractice) {
          this.todaysPlan.set({
            sessionType: response.todaysPractice.sessionType,
            duration: response.todaysPractice.totalDuration,
            focus: response.todaysPractice.focus,
            phase: response.trainingStatus.phase || "Foundation",
          });
        }
        this.isLoadingPlan.set(false);
      },
      error: (err) => {
        this.logger.error("Error loading daily training plan:", err);
        // Fallback or default
        this.todaysPlan.set(null);
        this.isLoadingPlan.set(false);
      },
    });
  }

  expand(): void {
    this.isExpanded.set(true);
  }

  collapse(): void {
    this.isExpanded.set(false);
  }

  getTimeEmoji(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅";
    if (hour < 17) return "☀️";
    if (hour < 21) return "🌆";
    return "🌙";
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  }

  getAcwrClass(): string {
    const acwr = this.acwrValue();
    if (acwr === 0) return "unavailable";
    if (acwr >= 0.8 && acwr <= 1.3) return "optimal";
    if (acwr < 0.8 || (acwr > 1.3 && acwr <= 1.5)) return "warning";
    return "danger";
  }

  /** Micro-context label for ACWR */
  getAcwrContext(): string {
    const acwr = this.acwrValue();
    if (acwr === 0) return "Not calculated";
    if (acwr >= 0.8 && acwr <= 1.3) return "Optimal";
    if (acwr < 0.8) return "Undertraining";
    if (acwr > 1.5) return "High Risk";
    return "Caution";
  }

  /** Micro-context label for Readiness */
  getReadinessContext(): string {
    const score = this.readinessScore();
    if (score >= 80) return "High";
    if (score >= 60) return "Moderate";
    if (score >= 40) return "Low";
    return "Very Low";
  }

  getReadinessClass(): string {
    const score = this.readinessScore();
    if (score >= 80) return "optimal";
    if (score >= 60) return "moderate";
    if (score >= 40) return "warning";
    return "danger";
  }

  /** Micro-context label for Supplements */
  getSupplementContext(): string {
    if (this.quickCheckIn.tookSupplements) {
      return "All logged";
    }
    const hour = new Date().getHours();
    if (hour < 12) return "Morning dose";
    if (hour < 18) return "Afternoon dose";
    return "Evening dose";
  }

  getAcwrPosition(): number {
    const acwr = this.acwrValue();
    // Map ACWR 0-2 to 0-100%
    return Math.min(100, Math.max(0, (acwr / 2) * 100));
  }

  getSleepQualityClass(): string {
    const hours = this.quickCheckIn.sleepHours;
    if (hours >= 7) return "good";
    if (hours >= 5) return "moderate";
    return "poor";
  }

  getSleepQualityLabel(): string {
    const hours = this.quickCheckIn.sleepHours;
    if (hours >= 8) return "Excellent";
    if (hours >= 7) return "Good";
    if (hours >= 6) return "Okay";
    if (hours >= 5) return "Low";
    return "Poor";
  }

  /**
   * Get human-readable label for feeling value
   * Improves slider accessibility by providing semantic meaning
   */
  getFeelingLabel(value: number): string {
    if (value <= 2) return "Very poor";
    if (value <= 4) return "Below average";
    if (value <= 6) return "Average";
    if (value <= 8) return "Good";
    return "Excellent";
  }

  getPhasesSeverity(): "success" | "info" | "warning" | "danger" {
    const phase = this.todaysPlan()?.phase;
    switch (phase) {
      case "Competition":
        return "success";
      case "Peak":
        return "warning";
      case "Build":
        return "info";
      default:
        return "info";
    }
  }

  isGameToday(): boolean {
    const game = this.upcomingGame();
    if (!game) return false;
    const today = new Date();
    return game.date.toDateString() === today.toDateString();
  }

  hoursUntilGame(): number {
    const game = this.upcomingGame();
    if (!game) return 0;
    const now = new Date();
    const diff = game.date.getTime() - now.getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60)));
  }

  private async loadUpcomingGame(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    try {
      const today = new Date();
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(today.getDate() + 2);

      interface GameData {
        game_date: string;
        opponent_name?: string;
        opponent?: string;
        game_time?: string;
        location?: string;
      }
      const response = await firstValueFrom(
        this.apiService.get<GameData[]>("/api/games", {
          startDate: today.toISOString().split("T")[0],
          endDate: twoDaysFromNow.toISOString().split("T")[0],
          limit: 1,
        }),
      );

      if (response && response.data && response.data.length > 0) {
        const game = response.data[0];
        const gameDate = new Date(game.game_date);

        // Only show if the game is in the future
        if (gameDate.getTime() > Date.now()) {
          this.upcomingGame.set({
            opponent: game.opponent_name || game.opponent || "TBD",
            time: game.game_time || "TBD",
            location: game.location || "TBD",
            date: gameDate,
          });
        } else {
          this.upcomingGame.set(null);
        }
      } else {
        this.upcomingGame.set(null);
      }
    } catch (error) {
      this.logger.error("Error loading upcoming game:", error);
    }
  }

  async submitQuickCheckIn(): Promise<void> {
    this.isSubmitting.set(true);

    try {
      // Convert quick check-in to full wellness format
      const wellnessData = {
        sleep: this.quickCheckIn.sleepHours,
        energy: this.quickCheckIn.overallFeeling,
        mood: this.quickCheckIn.overallFeeling,
        stress: Math.max(1, 11 - this.quickCheckIn.overallFeeling), // Inverse of feeling
        soreness: this.quickCheckIn.hasPain ? 6 : 2,
        notes: this.quickCheckIn.hasPain
          ? `Pain/soreness reported: ${this.quickCheckIn.painLocation}`
          : undefined,
        date: new Date().toISOString().split("T")[0],
      };

      // Handle supplements if taken
      if (
        this.quickCheckIn.tookSupplements &&
        this.quickCheckIn.supplementsTaken
      ) {
        // Log supplements - ideally unified service would handle this too
        // For now, let's just use the wellness submission which includes hydration
      }

      const result = await this.trainingService.submitWellness(wellnessData);
      if (result?.success) {
        this.toastService.success(TOAST.SUCCESS.QUICK_CHECKIN_SAVED);
        this.checkInComplete.emit();
      } else {
        this.toastService.error(
          (result as { error?: string } | null)?.error ||
            "Failed to save check-in",
        );
      }
      this.isSubmitting.set(false);
    } catch (error) {
      this.logger.error("Error in submitQuickCheckIn:", error);
      this.toastService.error(TOAST.ERROR.CHECKIN_SAVE_FAILED);
      this.isSubmitting.set(false);
    }
  }
}
