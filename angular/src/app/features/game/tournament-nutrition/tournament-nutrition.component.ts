/**
 * Tournament Nutrition Component
 *
 * Critical feature for multi-game tournament days.
 * Provides personalized nutrition and hydration timing based on game schedule.
 *
 * Key features:
 * - Pre-game fueling recommendations
 * - Halftime nutrition guidance
 * - Between-game recovery nutrition
 * - Hydration tracking with reminders
 * - Cramp prevention protocols
 * - Referee duty considerations
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

// PrimeNG Components

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";

import { ProgressBar } from "primeng/progressbar";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

// App Components & Services
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { NutritionService } from "../../../core/services/nutrition.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

interface GameSchedule {
  id: string;
  time: string; // HH:MM format
  opponent?: string;
  isReferee?: boolean;
  completed?: boolean;
}

interface NutritionWindow {
  id: string;
  type:
    | "pre-game"
    | "halftime"
    | "post-game"
    | "between-games"
    | "referee-duty"
    | "morning";
  startTime: string;
  endTime: string;
  title: string;
  priority: "critical" | "high" | "medium";
  recommendations: NutritionRecommendation[];
  hydrationTarget: number; // ml
  completed?: boolean;
  relatedGameId?: string;
}

interface NutritionRecommendation {
  category: "food" | "drink" | "supplement" | "action";
  item: string;
  amount?: string;
  timing?: string;
  reason: string;
  icon: string;
  alternatives?: string[];
}

interface HydrationLog {
  time: string;
  amount: number; // ml
  type: "water" | "electrolyte" | "sports-drink" | "smoothie" | "protein-shake";
}

@Component({
  selector: "app-tournament-nutrition",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Checkbox,
    StatusTagComponent,
    Tooltip,
    ProgressBar,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent
  ],
  styleUrl: "./tournament-nutrition.component.scss",
  template: `
    <app-main-layout>
      <div class="tournament-nutrition-page">
        <app-page-header
          title="Tournament Nutrition"
          subtitle="Fuel your performance across all games"
          icon="pi-heart"
        >
          <app-button
            variant="outlined"
            iconLeft="pi-calendar"
            (clicked)="showScheduleEditor = true"
            >Edit Schedule</app-button
          >
          @if (games().length > 0) {
            <app-button
              variant="outlined"
              iconLeft="pi-trash"
              severity="danger"
              (clicked)="clearAllData()"
              >Clear All</app-button
            >
          }
        </app-page-header>

        <!-- Tournament Overview Banner -->
        <div class="tournament-banner">
          <div class="banner-content">
            <div class="banner-icon"><i class="pi pi-trophy"></i></div>
            <div class="banner-info">
              <h2>{{ tournamentName() }}</h2>
              <p>{{ games().length }} Games · {{ tournamentDuration() }}</p>
            </div>
          </div>
          <div class="banner-stats">
            <div class="stat stat-block stat-block--large">
              <div class="stat-block__content">
                <span class="stat-block__value"
                  >{{ totalHydration() | number: "1.0-0" }}ml</span
                >
                <span class="stat-block__label">Hydration Today</span>
              </div>
            </div>
            <div class="stat stat-block stat-block--large">
              <div class="stat-block__content">
                <span class="stat-block__value"
                  >{{ completedWindows() }}/{{
                    nutritionWindows().length
                  }}</span
                >
                <span class="stat-block__label">Nutrition Windows</span>
              </div>
            </div>
            <div class="stat stat-block stat-block--large">
              <div class="stat-block__content">
                <span class="stat-block__value">{{ nextGameIn() }}</span>
                <span class="stat-block__label">Next Game</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Hydration Logger -->
        <p-card class="hydration-card">
          <div class="hydration-tracker">
            <div class="hydration-header">
              <h3><i class="pi pi-tint"></i> Quick Hydration Log</h3>
              <div class="hydration-progress">
                <span>{{ hydrationProgress() }}%</span>
                <p-progressBar
                  [value]="hydrationProgress()"
                  [showValue]="false"
                  styleClass="hydration-progress-bar"
                ></p-progressBar>
                <span class="target">/ {{ dailyHydrationTarget() }}ml</span>
              </div>
            </div>
            <div class="hydration-buttons">
              @for (option of hydrationOptions; track option.type) {
                <button
                  class="hydration-btn"
                  [class.selected]="selectedHydration === option.type"
                  (click)="logHydration(option.type, option.amount)"
                  [pTooltip]="option.tooltip"
                >
                  <span class="btn-icon">{{ option.icon }}</span>
                  <span class="btn-label">{{ option.label }}</span>
                  <span class="btn-amount">{{ option.amount }}ml</span>
                </button>
              }
            </div>
          </div>
        </p-card>

        <!-- Schedule Editor (Collapsible) -->
        @if (showScheduleEditor) {
          <p-card class="schedule-editor-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3><i class="pi pi-calendar"></i> Game Schedule</h3>
                <app-icon-button
                  icon="pi-times"
                  variant="text"
                  (clicked)="showScheduleEditor = false"
                  ariaLabel="Close schedule editor"
                  tooltip="Close"
                />
              </div>
            </ng-template>

            <div class="schedule-form">
              <div class="form-row">
                <label>Tournament Name</label>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="editTournamentName"
                  placeholder="e.g., Regional Championship"
                />
              </div>

              <div class="games-list">
                @for (game of editGames; track game.id; let i = $index) {
                  <div class="game-row">
                    <span class="game-number">Game {{ i + 1 }}</span>
                    <input
                      type="time"
                      [(ngModel)]="game.time"
                      class="time-input"
                    />
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="game.opponent"
                      placeholder="Opponent (optional)"
                      class="opponent-input"
                    />
                    <label class="referee-label">
                      <p-checkbox
                        [(ngModel)]="game.isReferee"
                        [binary]="true"
                        variant="filled"
                      ></p-checkbox>
                      <span>Referee</span>
                    </label>
                    <app-icon-button
                      icon="pi-trash"
                      variant="text"
                      [disabled]="editGames.length <= 1"
                      (clicked)="removeGame(i)"
                      ariaLabel="Remove game from schedule"
                      tooltip="Remove"
                    />
                  </div>
                }
              </div>

              <div class="schedule-actions">
                <app-button
                  variant="outlined"
                  iconLeft="pi-plus"
                  (clicked)="addGame()"
                  >Add Game</app-button
                >
                <app-button
                  iconLeft="pi-bolt"
                  (clicked)="generateNutritionPlan()"
                  >Generate Plan</app-button
                >
              </div>
            </div>
          </p-card>
        }

        <!-- Timeline View -->
        @if (games().length === 0) {
          <p-card class="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-calendar"></i>
              <h3>No Tournament Schedule</h3>
              <p>
                Create your tournament schedule to get personalized nutrition
                recommendations.
              </p>
              <app-button
                iconLeft="pi-calendar"
                (clicked)="showScheduleEditor = true"
                >Create Schedule</app-button
              >
            </div>
          </p-card>
        } @else {
          <div class="nutrition-timeline">
            <h3 class="timeline-title">
              <i class="pi pi-clock"></i> Your Nutrition Timeline
            </h3>

            @for (window of nutritionWindows(); track window.id) {
              <div
                class="timeline-item"
                [class.completed]="window.completed"
                [class.collapsed]="
                  window.completed && !isWindowExpanded(window.id)
                "
                [class.current]="isCurrentWindow(window)"
                [class.critical]="window.priority === 'critical'"
              >
                <div class="timeline-marker">
                  <div
                    class="marker-dot"
                    [class.pulse]="isCurrentWindow(window)"
                  ></div>
                  <div class="marker-line"></div>
                </div>

                <div class="timeline-content">
                  <div
                    class="window-header"
                    (click)="toggleWindowExpanded(window.id)"
                  >
                    <div class="window-time">
                      <span class="item-time"
                        >{{ window.startTime }} - {{ window.endTime }}</span
                      >
                      @if (window.priority === "critical") {
                        <app-status-tag value="Critical" severity="danger" size="sm" />
                      }
                      @if (window.completed) {
                        <span class="completed-badge-inline">
                          <i class="pi pi-check-circle"></i> Completed
                        </span>
                      }
                    </div>
                    <div class="header-row">
                      <h4>{{ window.title }}</h4>
                      @if (window.completed) {
                        <button
                          class="expand-toggle"
                          [class.expanded]="isWindowExpanded(window.id)"
                          type="button"
                        >
                          <i
                            class="pi"
                            [class.pi-chevron-down]="
                              !isWindowExpanded(window.id)
                            "
                            [class.pi-chevron-up]="isWindowExpanded(window.id)"
                          ></i>
                        </button>
                      }
                    </div>
                  </div>

                  @if (!window.completed || isWindowExpanded(window.id)) {
                    <div class="window-details">
                      <div class="recommendations-grid">
                        @for (rec of window.recommendations; track rec.item) {
                          <div
                            class="recommendation-card"
                            [class]="rec.category"
                          >
                            <div class="rec-icon">{{ rec.icon }}</div>
                            <div class="rec-content">
                              <div class="rec-item">{{ rec.item }}</div>
                              @if (rec.amount) {
                                <div class="rec-amount">{{ rec.amount }}</div>
                              }
                              @if (rec.timing) {
                                <div class="rec-timing">{{ rec.timing }}</div>
                              }
                              <div class="rec-reason">{{ rec.reason }}</div>
                              @if (
                                rec.alternatives && rec.alternatives.length > 0
                              ) {
                                <div class="rec-alternatives">
                                  <span class="alt-label">Alternatives:</span>
                                  {{ rec.alternatives.join(", ") }}
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>

                      <div class="window-footer">
                        <div class="hydration-target">
                          <i class="pi pi-tint"></i>
                          <span>Target: {{ window.hydrationTarget }}ml</span>
                        </div>
                        @if (!window.completed) {
                          <app-button
                            variant="outlined"
                            size="sm"
                            iconLeft="pi-check"
                            (clicked)="completeWindow(window)"
                            >Mark Complete</app-button
                          >
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Evidence-Based Supplements Section -->
        <div class="section-card supplements-section">
          <div class="section-header">
            <div class="section-icon"><i class="pi pi-heart-fill"></i></div>
            <div class="section-title">
              <h3>Evidence-Based Game Day Supplements</h3>
              <p>Scientifically proven to enhance performance and recovery</p>
            </div>
          </div>
          <div class="supplements-grid">
            @for (supp of gameDaySupplements; track supp.name) {
              <div class="supplement-card" [attr.data-category]="supp.category">
                <div class="supp-content">
                  <div class="supp-header">
                    <span class="supp-icon">{{ supp.icon }}</span>
                    <div class="supp-meta">
                      <span class="supp-name">{{ supp.name }}</span>
                      <span
                        class="supp-evidence"
                        [ngClass]="'evidence-' + supp.evidence.toLowerCase()"
                      >
                        {{ supp.evidence }} Evidence
                      </span>
                    </div>
                  </div>
                  <div class="supp-details">
                    <div class="supp-row">
                      <span class="supp-label">Dose:</span>
                      <span class="supp-value">{{ supp.dose }}</span>
                    </div>
                    <div class="supp-row">
                      <span class="supp-label">Timing:</span>
                      <span class="supp-value">{{ supp.timing }}</span>
                    </div>
                  </div>
                  <p class="supp-reason">{{ supp.reason }}</p>
                </div>
                <p class="supp-notes">
                  <i class="pi pi-info-circle"></i> {{ supp.notes }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Cramp Prevention Tips -->
        <div class="section-card tips-section">
          <div class="section-header">
            <div class="section-icon warning">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="section-title">
              <h3>Cramp Prevention Protocol</h3>
              <p>Essential strategies to stay cramp-free all day</p>
            </div>
          </div>
          <div class="tips-grid">
            <div class="tip-item">
              <div class="tip-icon">🧂</div>
              <div class="tip-content">
                <h4>Electrolyte Balance</h4>
                <p>
                  Add electrolyte tabs to water between games. Sodium,
                  potassium, and magnesium are key.
                </p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">🍌</div>
              <div class="tip-content">
                <h4>Potassium Boost</h4>
                <p>
                  Banana or coconut water 30min before each game. Prevents
                  muscle cramping.
                </p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">🧊</div>
              <div class="tip-content">
                <h4>Stay Cool</h4>
                <p>
                  Use ice towels between games. Overheating accelerates
                  electrolyte loss.
                </p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">🚫</div>
              <div class="tip-content">
                <h4>Avoid</h4>
                <p>
                  No burgers, hot dogs, or heavy fried foods. They slow
                  digestion and cause sluggishness.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Referee Duty Alert -->
        @if (hasRefereeDuty()) {
          <p-card class="referee-alert-card">
            <div class="referee-alert">
              <div class="alert-icon">🏁</div>
              <div class="alert-content">
                <h4>Referee Duty Detected</h4>
                <p>
                  You're refereeing between games. Stay hydrated but avoid heavy
                  eating. Light snacks and electrolytes only. Full recovery
                  nutrition after your duty.
                </p>
              </div>
            </div>
          </p-card>
        }

        <!-- Quick Reference Card -->
        <p-card class="quick-ref-card">
          <ng-template pTemplate="header">
            <h3><i class="pi pi-list"></i> Quick Reference - What to Pack</h3>
          </ng-template>
          <div class="packing-list">
            <div class="pack-category">
              <h4>🥤 Drinks</h4>
              <ul>
                <li>2-3L Water</li>
                <li>Electrolyte tablets/powder</li>
                <li>Pre-made protein shake</li>
                <li>Coconut water</li>
              </ul>
            </div>
            <div class="pack-category">
              <h4>🍎 Snacks</h4>
              <ul>
                <li>Bananas (2-3)</li>
                <li>Energy bars (low fiber)</li>
                <li>Rice cakes with honey</li>
                <li>Dried fruit (small portions)</li>
              </ul>
            </div>
            <div class="pack-category">
              <h4>🥗 Meals</h4>
              <ul>
                <li>Pre-made smoothie</li>
                <li>Rice + chicken (cold ok)</li>
                <li>Pasta salad</li>
                <li>PB&J sandwich</li>
              </ul>
            </div>
            <div class="pack-category">
              <h4>⚡ Extras</h4>
              <ul>
                <li>Salt packets</li>
                <li>Caffeine gum (optional)</li>
                <li>Ginger chews (nausea)</li>
                <li>Cooler with ice</li>
              </ul>
            </div>
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
})
export class TournamentNutritionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private supabaseService = inject(SupabaseService);
  private destroyRef = inject(DestroyRef);
  private nutritionService = inject(NutritionService);

  // State
  games = signal<GameSchedule[]>([]);
  nutritionWindows = signal<NutritionWindow[]>([]);
  hydrationLogs = signal<HydrationLog[]>([]);
  tournamentName = signal("Tournament Day");
  showScheduleEditor = false;
  selectedHydration: string | null = null;
  expandedWindows = new Set<string>(); // Track which windows are expanded

  // Edit state
  editGames: GameSchedule[] = [];
  editTournamentName = "Tournament Day";

  // Hydration options
  hydrationOptions = [
    {
      type: "water",
      label: "Water",
      amount: 250,
      icon: "💧",
      tooltip: "Plain water",
    },
    {
      type: "electrolyte",
      label: "Electrolyte",
      amount: 500,
      icon: "⚡",
      tooltip: "Electrolyte drink",
    },
    {
      type: "sports-drink",
      label: "Sports Drink",
      amount: 350,
      icon: "🥤",
      tooltip: "Gatorade, Powerade, etc.",
    },
    {
      type: "smoothie",
      label: "Smoothie",
      amount: 400,
      icon: "🥤",
      tooltip: "Fruit smoothie",
    },
    {
      type: "protein-shake",
      label: "Protein Shake",
      amount: 300,
      icon: "🥛",
      tooltip: "Protein shake",
    },
    {
      type: "coconut",
      label: "Coconut Water",
      amount: 330,
      icon: "🥥",
      tooltip: "Natural electrolytes",
    },
  ];

  // Evidence-based supplements for game day
  gameDaySupplements = [
    {
      name: "Creatine Monohydrate",
      dose: "3-5g",
      timing: "Any time (daily)",
      icon: "💪",
      category: "performance",
      evidence: "Strong",
      reason:
        "Improves high-intensity performance, power output, and recovery between sprints",
      notes: "Take daily - timing doesn't matter. Stay hydrated.",
    },
    {
      name: "Beta-Alanine",
      dose: "3-6g",
      timing: "Split doses throughout day",
      icon: "⚡",
      category: "endurance",
      evidence: "Strong",
      reason:
        "Buffers lactic acid, delays fatigue in repeated sprints and high-intensity efforts",
      notes: "May cause tingling (harmless). Split dose to reduce.",
    },
    {
      name: "Caffeine",
      dose: "3-6mg/kg bodyweight",
      timing: "30-60 min before game",
      icon: "☕",
      category: "performance",
      evidence: "Strong",
      reason: "Enhances alertness, reaction time, and reduces perceived effort",
      notes: "Don't exceed 400mg/day. Avoid if sensitive or late games.",
    },
    {
      name: "Magnesium",
      dose: "200-400mg",
      timing: "With breakfast & evening",
      icon: "🧲",
      category: "recovery",
      evidence: "Strong",
      reason:
        "Prevents cramps, supports muscle function, improves sleep quality",
      notes: "Glycinate or citrate forms best absorbed. Essential on hot days.",
    },
    {
      name: "Iron",
      dose: "18-27mg (if deficient)",
      timing: "With vitamin C, away from calcium",
      icon: "🩸",
      category: "endurance",
      evidence: "Conditional",
      reason:
        "Supports oxygen transport - critical for endurance. Test levels first.",
      notes: "Only supplement if blood test shows deficiency. Take with OJ.",
    },
    {
      name: "Vitamin D3",
      dose: "2000-5000 IU",
      timing: "With fatty meal",
      icon: "☀️",
      category: "recovery",
      evidence: "Strong",
      reason: "Muscle function, bone health, immune support, injury prevention",
      notes: "Most athletes are deficient. Get levels tested.",
    },
    {
      name: "Omega-3 (EPA/DHA)",
      dose: "2-3g combined",
      timing: "With meals",
      icon: "🐟",
      category: "recovery",
      evidence: "Strong",
      reason: "Reduces inflammation, supports joint health and recovery",
      notes: "Choose high-quality fish oil. Helps with post-game soreness.",
    },
    {
      name: "Electrolyte Tabs",
      dose: "1-2 tabs per hour of play",
      timing: "Before, during, after games",
      icon: "🧂",
      category: "hydration",
      evidence: "Strong",
      reason:
        "Replaces sodium, potassium, magnesium lost in sweat. Prevents cramps.",
      notes: "Essential in hot weather. More important than plain water.",
    },
  ];

  // Computed values
  dailyHydrationTarget = computed(() => {
    // Base: 3L + 500ml per game
    return 3000 + this.games().length * 500;
  });

  totalHydration = computed(() => {
    return this.hydrationLogs().reduce((sum, log) => sum + log.amount, 0);
  });

  hydrationProgress = computed(() => {
    const target = this.dailyHydrationTarget();
    const current = this.totalHydration();
    return Math.min(100, Math.round((current / target) * 100));
  });

  completedWindows = computed(() => {
    return this.nutritionWindows().filter((w) => w.completed).length;
  });

  tournamentDuration = computed(() => {
    const gameList = this.games();
    if (gameList.length === 0) return "No games scheduled";
    const first = gameList[0].time;
    const last = gameList[gameList.length - 1].time;
    return `${first} - ${last}`;
  });

  nextGameIn = computed(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const game of this.games()) {
      const [hours, minutes] = game.time.split(":").map(Number);
      const gameTime = hours * 60 + minutes;

      if (gameTime > currentTime && !game.completed) {
        const diff = gameTime - currentTime;
        if (diff < 60) return `${diff}min`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
      }
    }
    return "Done!";
  });

  hasRefereeDuty = computed(() => {
    return this.games().some((g) => g.isReferee);
  });

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadSavedSchedule();

    // Auto-refresh every minute to update "next game" countdown
    this.refreshInterval = setInterval(() => {
      // Trigger reactivity
      this.games.update((g) => [...g]);
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private async loadSavedSchedule(): Promise<void> {
    // Try to load from localStorage first (for quick access)
    const saved = localStorage.getItem("tournament_schedule");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.tournamentName.set(data.name || "Tournament Day");
        this.games.set(data.games || []);
        this.editTournamentName = data.name || "Tournament Day";
        this.editGames = [...(data.games || [])];

        if (data.games?.length > 0) {
          this.generateNutritionPlan();
        }
      } catch (_e) {
        this.logger.warn(
          "[TournamentNutrition] Could not parse saved schedule",
        );
      }
    }

    // Load hydration logs for today
    const todayLogs = localStorage.getItem(
      "hydration_logs_" + new Date().toDateString(),
    );
    if (todayLogs) {
      try {
        this.hydrationLogs.set(JSON.parse(todayLogs));
      } catch (_e) {
        // Ignore
      }
    }

    // If no schedule, show empty state - user must create their own schedule
    // No default example games to avoid misleading calculations
  }

  addGame(): void {
    const lastGame = this.editGames[this.editGames.length - 1];
    let nextTime = "09:00";

    if (lastGame) {
      const [hours, minutes] = lastGame.time.split(":").map(Number);
      const nextHours = hours + 2;
      nextTime = `${nextHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    this.editGames.push({
      id: Date.now().toString(),
      time: nextTime,
      opponent: "",
      isReferee: false,
    });
  }

  removeGame(index: number): void {
    this.editGames.splice(index, 1);
  }

  generateNutritionPlan(): void {
    // Sort games by time
    const sortedGames = [...this.editGames].sort((a, b) =>
      a.time.localeCompare(b.time),
    );

    this.games.set(sortedGames);
    this.tournamentName.set(this.editTournamentName);
    this.showScheduleEditor = false;

    // Save to localStorage
    localStorage.setItem(
      "tournament_schedule",
      JSON.stringify({
        name: this.editTournamentName,
        games: sortedGames,
      }),
    );

    // Generate nutrition windows
    const windows: NutritionWindow[] = [];

    // Morning nutrition (if first game is after 7am)
    const firstGameTime = sortedGames[0]?.time;
    if (firstGameTime) {
      const [firstHour] = firstGameTime.split(":").map(Number);

      if (firstHour >= 7) {
        const wakeUpTime = this.subtractMinutes(firstGameTime, 180); // 3 hours before
        windows.push(this.createMorningWindow(wakeUpTime, firstGameTime));
      }
    }

    // Pre-game, halftime, and post-game windows for each game
    sortedGames.forEach((game, index) => {
      const _isLastGame = index === sortedGames.length - 1;
      const nextGame = sortedGames[index + 1];

      // Pre-game (45-60 min before)
      windows.push(this.createPreGameWindow(game, index + 1));

      // Halftime
      windows.push(this.createHalftimeWindow(game, index + 1));

      // Post-game / Between games
      if (nextGame) {
        const timeBetween = this.getMinutesBetween(game.time, nextGame.time);

        if (game.isReferee || nextGame.isReferee) {
          windows.push(this.createRefereeDutyWindow(game, nextGame, index + 1));
        } else if (timeBetween >= 120) {
          windows.push(
            this.createBetweenGamesWindow(
              game,
              nextGame,
              index + 1,
              timeBetween,
            ),
          );
        } else {
          windows.push(
            this.createQuickRecoveryWindow(game, nextGame, index + 1),
          );
        }
      } else {
        // Final post-game recovery
        windows.push(this.createFinalRecoveryWindow(game, index + 1));
      }
    });

    this.nutritionWindows.set(windows);
    this.toastService.success(
      `Nutrition plan generated for ${sortedGames.length} games!`,
    );
  }

  private createMorningWindow(
    wakeTime: string,
    firstGameTime: string,
  ): NutritionWindow {
    return {
      id: "morning",
      type: "morning",
      startTime: wakeTime,
      endTime: this.subtractMinutes(firstGameTime, 90),
      title: "🌅 Tournament Morning Fuel",
      priority: "critical",
      hydrationTarget: 500,
      recommendations: [
        {
          category: "food",
          item: "Complex Carbs Breakfast",
          amount: "300-400 calories",
          timing: "2-3 hours before first game",
          reason: "Slow-release energy for sustained performance",
          icon: "🥣",
          alternatives: [
            "Oatmeal with banana",
            "Whole grain toast with PB",
            "Rice with eggs",
          ],
        },
        {
          category: "drink",
          item: "Water + Electrolytes",
          amount: "500ml",
          timing: "With breakfast",
          reason: "Start hydrated - you'll sweat a lot today",
          icon: "💧",
        },
        {
          category: "food",
          item: "Banana",
          amount: "1 medium",
          timing: "1 hour before game",
          reason: "Quick potassium boost for muscle function",
          icon: "🍌",
        },
        {
          category: "action",
          item: "Light Dynamic Stretching",
          timing: "30 min before game",
          reason: "Activate muscles without depleting energy",
          icon: "🧘",
        },
      ],
    };
  }

  private createPreGameWindow(
    game: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const startTime = this.subtractMinutes(game.time, 45);
    return {
      id: `pre-game-${gameNum}`,
      type: "pre-game",
      startTime,
      endTime: this.subtractMinutes(game.time, 15),
      title: `⚡ Pre-Game ${gameNum}${game.opponent ? ` vs ${game.opponent}` : ""}`,
      priority: "critical",
      hydrationTarget: 300,
      relatedGameId: game.id,
      recommendations: [
        {
          category: "drink",
          item: "Water or Sports Drink",
          amount: "200-300ml",
          timing: "30-45 min before",
          reason: "Final hydration before intense activity",
          icon: "💧",
        },
        {
          category: "food",
          item: "Quick Energy Snack",
          amount: "100-150 calories",
          timing: "30 min before",
          reason: "Fast-absorbing carbs for immediate energy",
          icon: "⚡",
          alternatives: [
            "Energy gel",
            "Rice cake with honey",
            "Half banana",
            "Sports chews",
          ],
        },
        {
          category: "supplement",
          item: "Electrolyte Tab",
          amount: "1 tab in water",
          timing: "30 min before",
          reason: "Pre-load sodium to prevent cramping",
          icon: "🧂",
        },
      ],
    };
  }

  private createHalftimeWindow(
    game: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const halftimeStart = this.addMinutes(game.time, 20); // ~20 min into game
    return {
      id: `halftime-${gameNum}`,
      type: "halftime",
      startTime: halftimeStart,
      endTime: this.addMinutes(halftimeStart, 10),
      title: `Halftime - Game ${gameNum}`,
      priority: "high",
      hydrationTarget: 200,
      relatedGameId: game.id,
      recommendations: [
        {
          category: "drink",
          item: "Electrolyte Drink",
          amount: "150-200ml",
          timing: "Immediately",
          reason: "Replace sweat losses, prevent second-half cramping",
          icon: "⚡",
        },
        {
          category: "food",
          item: "Quick Sugar Hit",
          amount: "50-75 calories",
          reason: "Instant energy for second half push",
          icon: "🍬",
          alternatives: ["Orange slices", "Sports chews", "Honey packet"],
        },
        {
          category: "action",
          item: "Ice Towel on Neck",
          reason: "Cool core temperature, reduce fatigue",
          icon: "🧊",
        },
      ],
    };
  }

  private createBetweenGamesWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number,
    minutesBetween: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45); // ~45 min after game starts (post-game)
    return {
      id: `between-${gameNum}`,
      type: "between-games",
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 45),
      title: `🔄 Recovery Window (${Math.round(minutesBetween / 60)}h gap)`,
      priority: "high",
      hydrationTarget: 600,
      recommendations: [
        {
          category: "drink",
          item: "Protein Shake + Carbs",
          amount: "300ml shake + banana",
          timing: "Within 30 min of game end",
          reason: "Critical recovery window - muscle repair starts now",
          icon: "🥛",
        },
        {
          category: "drink",
          item: "Electrolyte Water",
          amount: "500ml",
          timing: "Sip continuously",
          reason: "Replace all sweat losses before next game",
          icon: "💧",
        },
        {
          category: "food",
          item: "Light Meal",
          amount: "300-400 calories",
          timing: "60-90 min before next game",
          reason: "Refuel glycogen stores without feeling heavy",
          icon: "🍚",
          alternatives: [
            "Rice + chicken",
            "Pasta salad",
            "PB&J sandwich",
            "Smoothie bowl",
          ],
        },
        {
          category: "action",
          item: "Legs Up / Light Stretch",
          timing: "10-15 min",
          reason: "Promote blood flow and recovery",
          icon: "🦵",
        },
      ],
    };
  }

  private createQuickRecoveryWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45);
    return {
      id: `quick-${gameNum}`,
      type: "between-games",
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 20),
      title: `⏱️ Quick Turnaround (Short gap!)`,
      priority: "critical",
      hydrationTarget: 400,
      recommendations: [
        {
          category: "drink",
          item: "Sports Drink",
          amount: "300-400ml",
          timing: "Immediately after game",
          reason: "Fast carbs + electrolytes - no time for solid food",
          icon: "🥤",
        },
        {
          category: "food",
          item: "Energy Gel or Chews",
          amount: "1-2 servings",
          timing: "15 min before next game",
          reason: "Quick energy without digestion burden",
          icon: "⚡",
        },
        {
          category: "action",
          item: "Stay Moving Lightly",
          reason: "Don't sit down - keep blood flowing",
          icon: "🚶",
        },
      ],
    };
  }

  private createRefereeDutyWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45);
    return {
      id: `referee-${gameNum}`,
      type: "referee-duty",
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 30),
      title: `🏁 Referee Duty Period`,
      priority: "high",
      hydrationTarget: 500,
      recommendations: [
        {
          category: "drink",
          item: "Water + Electrolytes",
          amount: "500ml",
          timing: "Sip throughout",
          reason: "You're still active - stay hydrated",
          icon: "💧",
        },
        {
          category: "food",
          item: "Light Snacks Only",
          amount: "100-200 calories",
          reason: "Avoid heavy food while on your feet",
          icon: "🍎",
          alternatives: ["Energy bar", "Trail mix (small)", "Rice cake"],
        },
        {
          category: "action",
          item: "Shade Breaks",
          reason: "Conserve energy for your next game",
          icon: "🌴",
        },
      ],
    };
  }

  private createFinalRecoveryWindow(
    game: GameSchedule,
    _gameNum: number,
  ): NutritionWindow {
    const startTime = this.addMinutes(game.time, 45);
    return {
      id: `final-recovery`,
      type: "post-game",
      startTime,
      endTime: this.addMinutes(startTime, 120),
      title: `Post-Tournament Recovery`,
      priority: "high",
      hydrationTarget: 750,
      recommendations: [
        {
          category: "drink",
          item: "Protein Shake",
          amount: "25-30g protein",
          timing: "Within 30 min",
          reason: "Critical for muscle repair after intense day",
          icon: "🥛",
        },
        {
          category: "drink",
          item: "Chocolate Milk",
          amount: "500ml",
          timing: "Great alternative",
          reason: "Perfect 3:1 carb-to-protein ratio for recovery",
          icon: "🥛",
          alternatives: ["Recovery shake", "Smoothie with protein"],
        },
        {
          category: "food",
          item: "Full Meal",
          amount: "500-700 calories",
          timing: "Within 2 hours",
          reason: "Replenish all energy stores",
          icon: "🍽️",
          alternatives: [
            "Grilled chicken + rice + veggies",
            "Salmon + sweet potato",
            "Pasta with lean protein",
          ],
        },
        {
          category: "action",
          item: "Foam Roll + Stretch",
          timing: "15-20 min",
          reason: "Reduce next-day soreness significantly",
          icon: "🧘",
        },
        {
          category: "supplement",
          item: "Magnesium",
          amount: "200-400mg",
          timing: "Before bed",
          reason: "Muscle relaxation and sleep quality",
          icon: "💊",
        },
      ],
    };
  }

  // Time utility methods
  private subtractMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const totalMins = hours * 60 + mins - minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  }

  private getMinutesBetween(time1: string, time2: string): number {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    return h2 * 60 + m2 - (h1 * 60 + m1);
  }

  isCurrentWindow(window: NutritionWindow): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    return currentTime >= window.startTime && currentTime <= window.endTime;
  }

  logHydration(type: string, amount: number): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const log: HydrationLog = {
      time: timeStr,
      amount,
      type: type as HydrationLog["type"],
    };

    this.hydrationLogs.update((logs) => [...logs, log]);
    this.selectedHydration = type;

    // Save to localStorage
    localStorage.setItem(
      "hydration_logs_" + new Date().toDateString(),
      JSON.stringify(this.hydrationLogs()),
    );

    // Visual feedback
    setTimeout(() => {
      this.selectedHydration = null;
    }, 500);

    this.toastService.success(`+${amount}ml logged! 💧`);
  }

  completeWindow(window: NutritionWindow): void {
    this.nutritionWindows.update((windows) =>
      windows.map((w) => (w.id === window.id ? { ...w, completed: true } : w)),
    );
    // Auto-collapse when completed
    this.expandedWindows.delete(window.id);
    this.toastService.success(TOAST.SUCCESS.WINDOW_COMPLETED);
  }

  toggleWindowExpanded(windowId: string): void {
    if (this.expandedWindows.has(windowId)) {
      this.expandedWindows.delete(windowId);
    } else {
      this.expandedWindows.add(windowId);
    }
  }

  isWindowExpanded(windowId: string): boolean {
    return this.expandedWindows.has(windowId);
  }

  clearAllData(): void {
    if (
      confirm(
        "Are you sure you want to clear all tournament data? This will remove your schedule, nutrition windows, and hydration logs.",
      )
    ) {
      // Clear all data
      this.games.set([]);
      this.nutritionWindows.set([]);
      this.hydrationLogs.set([]);
      this.tournamentName.set("Tournament Day");
      this.editGames = [];
      this.editTournamentName = "Tournament Day";
      this.expandedWindows.clear();

      // Clear localStorage
      localStorage.removeItem("tournament_schedule");
      localStorage.removeItem("hydration_logs_" + new Date().toDateString());

      this.toastService.success("All tournament data cleared successfully!");
    }
  }
}
