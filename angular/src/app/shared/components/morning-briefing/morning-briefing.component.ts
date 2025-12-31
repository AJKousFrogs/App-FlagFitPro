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

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

// PrimeNG
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { Slider } from "primeng/slider";
import { InputNumberModule } from "primeng/inputnumber";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { RippleModule } from "primeng/ripple";
import { TooltipModule } from "primeng/tooltip";
import { CheckboxModule } from "primeng/checkbox";

// Services
import { WellnessService } from "../../../core/services/wellness.service";
import { AcwrService } from "../../../core/services/acwr.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
// GameService would be used for real game data - using signals for now

interface QuickCheckIn {
  overallFeeling: number;
  sleepHours: number;
  hasPain: boolean;
  painLocation?: string;
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
    CardModule,
    ButtonModule,
    Slider,
    InputNumberModule,
    ProgressBarModule,
    TagModule,
    RippleModule,
    TooltipModule,
    CheckboxModule,
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
                <h2>{{ getGreeting() }}, {{ userName() }}!</h2>
                <p class="date-text">{{ formattedDate() }}</p>
              </div>
            </div>
            <div class="quick-status">
              @if (hasCheckedInToday()) {
                <p-tag value="✓ Checked In" severity="success"></p-tag>
              } @else {
                <p-tag value="Check-in Needed" severity="warn"></p-tag>
              }
            </div>
          </div>

          <!-- ACWR Quick View -->
          <div class="metrics-row">
            <div class="metric">
              <span class="metric-label">ACWR</span>
              <span class="metric-value" [class]="getAcwrClass()">
                {{ acwrValue() | number: "1.2-2" }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Readiness</span>
              <span class="metric-value">{{ readinessScore() }}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Today</span>
              <span class="metric-value">{{ todaysPlan()?.sessionType || "Rest" }}</span>
            </div>
          </div>

          <!-- Game Day Alert -->
          @if (upcomingGame()) {
            <div class="game-alert" [class.urgent]="isGameToday()">
              <i class="pi pi-flag"></i>
              <span>
                @if (isGameToday()) {
                  GAME DAY! {{ upcomingGame()?.opponent }} at {{ upcomingGame()?.time }}
                } @else {
                  Game in {{ hoursUntilGame() }}h vs {{ upcomingGame()?.opponent }}
                }
              </span>
            </div>
          }

          <button class="expand-btn" pRipple>
            <span>{{ hasCheckedInToday() ? "View Details" : "Quick Check-in" }}</span>
            <i class="pi pi-chevron-down"></i>
          </button>
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
                <h2>{{ getGreeting() }}, {{ userName() }}!</h2>
                <p class="date-text">{{ formattedDate() }}</p>
              </div>
            </div>
            <button class="close-btn" (click)="collapse()">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Quick Check-in Section -->
          @if (!hasCheckedInToday()) {
            <div class="checkin-section">
              <h3>
                <i class="pi pi-bolt"></i>
                Quick Check-in
                <span class="time-badge">~30 sec</span>
              </h3>

              <div class="checkin-form">
                <!-- Overall Feeling Slider -->
                <div class="feeling-slider">
                  <label>How do you feel overall?</label>
                  <div class="slider-container">
                    <span class="emoji-label">😫</span>
                    <p-slider
                      [(ngModel)]="quickCheckIn.overallFeeling"
                      [min]="1"
                      [max]="10"
                      [step]="1"
                      styleClass="feeling-slider-input"
                    ></p-slider>
                    <span class="emoji-label">🔥</span>
                  </div>
                  <div class="slider-value">{{ quickCheckIn.overallFeeling }}/10</div>
                </div>

                <!-- Sleep Hours -->
                <div class="sleep-input">
                  <label>Sleep last night</label>
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
                    ></p-inputNumber>
                    <span class="sleep-quality" [class]="getSleepQualityClass()">
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

                <p-button
                  label="Submit Quick Check-in"
                  icon="pi pi-check"
                  styleClass="submit-btn"
                  [loading]="isSubmitting()"
                  (onClick)="submitQuickCheckIn()"
                ></p-button>

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

            @if (todaysPlan()) {
              <div class="plan-card">
                <div class="plan-header">
                  <div class="plan-type">
                    <span class="type-badge">{{ todaysPlan()!.sessionType }}</span>
                    <span class="duration">{{ todaysPlan()!.duration }} min</span>
                  </div>
                  <p-tag
                    [value]="todaysPlan()!.phase"
                    [severity]="getPhasesSeverity()"
                  ></p-tag>
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

                <p-button
                  label="Start Today's Practice"
                  icon="pi pi-play"
                  styleClass="start-practice-btn"
                  routerLink="/training/daily"
                ></p-button>
              </div>
            } @else {
              <div class="rest-day">
                <i class="pi pi-moon"></i>
                <h4>Rest Day</h4>
                <p>Focus on recovery and nutrition today.</p>
                <p-button
                  label="View Recovery Protocols"
                  icon="pi pi-heart"
                  [outlined]="true"
                  routerLink="/wellness"
                ></p-button>
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
                  <span><i class="pi pi-clock"></i> {{ upcomingGame()!.time }}</span>
                  <span><i class="pi pi-map-marker"></i> {{ upcomingGame()!.location }}</span>
                </div>
                <div class="countdown" [class.urgent]="hoursUntilGame() < 24">
                  <span class="countdown-value">{{ hoursUntilGame() }}</span>
                  <span class="countdown-label">hours until game</span>
                </div>
              </div>

              <div class="game-actions">
                <p-button
                  label="Game Day Check-in"
                  icon="pi pi-check-square"
                  styleClass="p-button-warning"
                  routerLink="/game/readiness"
                ></p-button>
                <p-button
                  label="Nutrition Plan"
                  icon="pi pi-heart"
                  [outlined]="true"
                  routerLink="/game/nutrition"
                ></p-button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .morning-briefing {
        background: var(--surface-primary);
        border-radius: 16px;
        border: 1px solid var(--p-surface-200);
        overflow: hidden;
        transition: all 0.3s ease;
        margin-bottom: var(--space-6);
      }

      /* Collapsed State */
      .briefing-collapsed {
        padding: var(--space-5);
        cursor: pointer;
        transition: background 0.2s;
      }

      .briefing-collapsed:hover {
        background: var(--p-surface-50);
      }

      .greeting-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-4);
      }

      .greeting {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .greeting-emoji {
        font-size: 2rem;
      }

      .greeting-text h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .date-text {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .metrics-row {
        display: flex;
        gap: var(--space-6);
        margin-bottom: var(--space-4);
      }

      .metric {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .metric-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .metric-value.optimal {
        color: var(--p-green-600);
      }

      .metric-value.warning {
        color: var(--p-orange-600);
      }

      .metric-value.danger {
        color: var(--p-red-600);
      }

      .game-alert {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--p-orange-50);
        border-radius: 8px;
        color: var(--p-orange-700);
        font-weight: 600;
        margin-bottom: var(--space-4);
      }

      .game-alert.urgent {
        background: var(--p-red-50);
        color: var(--p-red-700);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .expand-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        width: 100%;
        padding: var(--space-3);
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .expand-btn:hover {
        background: var(--color-brand-primary);
        color: white;
      }

      /* Expanded State */
      .briefing-expanded {
        padding: var(--space-6);
      }

      .expanded-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-6);
      }

      .close-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: var(--p-surface-100);
        border-radius: 50%;
        cursor: pointer;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: var(--p-surface-200);
        color: var(--text-primary);
      }

      /* Check-in Section */
      .checkin-section {
        background: var(--p-surface-50);
        border-radius: 12px;
        padding: var(--space-5);
        margin-bottom: var(--space-6);
      }

      .checkin-section h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-4) 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .time-badge {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        background: var(--p-surface-200);
        padding: 2px 8px;
        border-radius: 12px;
        margin-left: auto;
      }

      .checkin-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .feeling-slider label,
      .sleep-input label,
      .pain-check label {
        display: block;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .emoji-label {
        font-size: 1.5rem;
      }

      :host ::ng-deep .feeling-slider-input {
        flex: 1;
      }

      .slider-value {
        text-align: center;
        font-weight: 600;
        color: var(--color-brand-primary);
        margin-top: var(--space-2);
      }

      .input-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      :host ::ng-deep .sleep-number-input {
        width: 140px;
      }

      .sleep-quality {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .sleep-quality.good {
        color: var(--p-green-600);
      }

      .sleep-quality.moderate {
        color: var(--p-orange-600);
      }

      .sleep-quality.poor {
        color: var(--p-red-600);
      }

      .pain-toggle {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .pain-location {
        margin-top: var(--space-3);
      }

      .pain-input {
        width: 100%;
        padding: var(--space-3);
        border: 1px solid var(--p-surface-300);
        border-radius: 8px;
        font-size: 0.875rem;
      }

      :host ::ng-deep .submit-btn {
        width: 100%;
        justify-content: center;
      }

      .full-checkin-link {
        text-align: center;
        display: block;
        color: var(--color-brand-primary);
        font-size: 0.875rem;
        text-decoration: none;
      }

      .full-checkin-link:hover {
        text-decoration: underline;
      }

      .checkin-complete {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--p-green-50);
        border-radius: 8px;
        color: var(--p-green-700);
        margin-bottom: var(--space-6);
      }

      .checkin-complete i {
        font-size: 1.25rem;
      }

      .checkin-complete a {
        margin-left: auto;
        color: var(--p-green-700);
        text-decoration: none;
      }

      .checkin-complete a:hover {
        text-decoration: underline;
      }

      /* Today's Plan Section */
      .todays-plan-section h3,
      .game-day-section h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-4) 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .plan-card {
        background: var(--p-surface-50);
        border-radius: 12px;
        padding: var(--space-5);
      }

      .plan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .plan-type {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .type-badge {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .duration {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .focus-areas {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .focus-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .focus-tag {
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      /* ACWR Visual */
      .acwr-status {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        background: white;
        border-radius: 8px;
        margin-bottom: var(--space-4);
      }

      .acwr-visual {
        flex: 1;
      }

      .acwr-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: block;
        margin-bottom: var(--space-2);
      }

      .acwr-bar {
        height: 8px;
        background: var(--p-surface-200);
        border-radius: 4px;
        position: relative;
        display: flex;
        overflow: hidden;
      }

      .zone {
        flex: 1;
      }

      .zone-low {
        background: var(--p-blue-200);
      }

      .zone-optimal {
        background: var(--p-green-300);
      }

      .zone-high {
        background: var(--p-red-200);
      }

      .acwr-indicator {
        position: absolute;
        top: -4px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        border: 3px solid var(--p-green-500);
        transform: translateX(-50%);
        transition: left 0.3s;
      }

      .acwr-indicator.warning {
        border-color: var(--p-orange-500);
      }

      .acwr-indicator.danger {
        border-color: var(--p-red-500);
      }

      .acwr-zones {
        display: flex;
        justify-content: space-between;
        font-size: 0.625rem;
        color: var(--text-secondary);
        margin-top: var(--space-1);
      }

      .acwr-value-display {
        text-align: center;
      }

      .acwr-value-display .value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .acwr-value-display .status {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      :host ::ng-deep .start-practice-btn {
        width: 100%;
        justify-content: center;
      }

      .rest-day {
        text-align: center;
        padding: var(--space-6);
        background: var(--p-surface-50);
        border-radius: 12px;
      }

      .rest-day i {
        font-size: 2.5rem;
        color: var(--p-blue-400);
        margin-bottom: var(--space-3);
      }

      .rest-day h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }

      .rest-day p {
        margin: 0 0 var(--space-4) 0;
        color: var(--text-secondary);
      }

      /* Game Day Section */
      .game-day-section {
        background: var(--p-orange-50);
        border-radius: 12px;
        padding: var(--space-5);
        margin-top: var(--space-6);
        border: 2px solid var(--p-orange-200);
      }

      .game-day-section.urgent {
        background: var(--p-red-50);
        border-color: var(--p-red-300);
      }

      .game-day-section h3 {
        color: var(--p-orange-700);
      }

      .game-day-section.urgent h3 {
        color: var(--p-red-700);
      }

      .game-info {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .game-opponent {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .vs {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .opponent {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .game-details {
        display: flex;
        gap: var(--space-4);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .game-details span {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .countdown {
        margin-left: auto;
        text-align: center;
      }

      .countdown-value {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: var(--p-orange-600);
      }

      .countdown.urgent .countdown-value {
        color: var(--p-red-600);
      }

      .countdown-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .game-actions {
        display: flex;
        gap: var(--space-3);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .metrics-row {
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .metric {
          min-width: 80px;
        }

        .game-info {
          flex-direction: column;
          align-items: flex-start;
        }

        .countdown {
          margin-left: 0;
          width: 100%;
          text-align: left;
        }

        .game-actions {
          flex-direction: column;
        }

        .game-actions p-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class MorningBriefingComponent implements OnInit {
  private router = inject(Router);
  private wellnessService = inject(WellnessService);
  private acwrService = inject(AcwrService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  // Outputs
  checkInComplete = output<void>();

  // State
  isExpanded = signal(false);
  isSubmitting = signal(false);
  hasCheckedInToday = signal(false);

  // Quick check-in data
  quickCheckIn: QuickCheckIn = {
    overallFeeling: 7,
    sleepHours: 7.5,
    hasPain: false,
    painLocation: "",
  };

  // Computed values
  userName = computed(() => {
    const user = this.authService.getUser();
    // Access name or email from user object
    const name = (user as { name?: string; email?: string })?.name || 
                 (user as { email?: string })?.email?.split("@")[0];
    return name?.split(" ")[0] || "Athlete";
  });

  acwrValue = computed(() => this.acwrService.acwrRatio());
  acwrStatus = computed(() => this.acwrService.riskZone().description);
  readinessScore = signal(85); // Would come from ReadinessService

  todaysPlan = signal<TodaysPlan | null>({
    sessionType: "Speed & Agility",
    duration: 90,
    focus: ["Acceleration", "Change of Direction", "Route Running"],
    phase: "Competition",
  });

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
    this.checkTodaysWellness();
    this.loadUpcomingGame();
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
    if (acwr >= 0.8 && acwr <= 1.3) return "optimal";
    if (acwr < 0.8 || (acwr > 1.3 && acwr <= 1.5)) return "warning";
    return "danger";
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

  getPhasesSeverity(): "success" | "info" | "warn" | "danger" {
    const phase = this.todaysPlan()?.phase;
    switch (phase) {
      case "Competition":
        return "success";
      case "Peak":
        return "warn";
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

  private async checkTodaysWellness(): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      this.wellnessService.getWellnessData("1d").subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.length > 0) {
            const todaysEntry = response.data.find(
              (entry: { date: string }) =>
                entry.date === today ||
                new Date(entry.date).toDateString() === new Date().toDateString()
            );
            this.hasCheckedInToday.set(!!todaysEntry);
          }
        },
        error: (err) => {
          this.logger.error("Error checking today's wellness:", err);
        },
      });
    } catch (error) {
      this.logger.error("Error in checkTodaysWellness:", error);
    }
  }

  private async loadUpcomingGame(): Promise<void> {
    // Check for games in next 48 hours
    try {
      // Mock data for now - would come from GameService
      const mockGame = {
        opponent: "Eagles",
        time: "2:00 PM",
        location: "Home Field",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      // Only show if game is within 48 hours
      const hoursUntil =
        (mockGame.date.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil <= 48 && hoursUntil > 0) {
        this.upcomingGame.set(mockGame);
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

      this.wellnessService.logWellness(wellnessData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success("Quick check-in saved! 💪");
            this.hasCheckedInToday.set(true);
            this.checkInComplete.emit();
          } else {
            this.toastService.error(response.error || "Failed to save check-in");
          }
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.logger.error("Error submitting quick check-in:", err);
          this.toastService.error("Failed to save check-in");
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      this.logger.error("Error in submitQuickCheckIn:", error);
      this.toastService.error("Failed to save check-in");
      this.isSubmitting.set(false);
    }
  }
}
