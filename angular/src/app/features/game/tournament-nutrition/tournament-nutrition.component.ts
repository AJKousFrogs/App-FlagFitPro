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
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

// PrimeNG Components
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { DividerModule } from "primeng/divider";
import { InputNumberModule } from "primeng/inputnumber";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

// App Components & Services
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { NutritionService } from "../../../core/services/nutrition.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
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
    CardModule,
    ButtonModule,
    InputNumberModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    ProgressBarModule,
    DividerModule,
    BadgeModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="tournament-nutrition-page">
        <app-page-header
          title="Tournament Nutrition"
          subtitle="Fuel your performance across all games"
          icon="pi-heart"
        >
          <p-button
            label="Edit Schedule"
            icon="pi pi-calendar"
            [outlined]="true"
            (onClick)="showScheduleEditor = true"
          ></p-button>
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
            <div class="stat">
              <span class="stat-value"
                >{{ totalHydration() | number: "1.0-0" }}ml</span
              >
              <span class="stat-label">Hydration Today</span>
            </div>
            <div class="stat">
              <span class="stat-value"
                >{{ completedWindows() }}/{{ nutritionWindows().length }}</span
              >
              <span class="stat-label">Nutrition Windows</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ nextGameIn() }}</span>
              <span class="stat-label">Next Game</span>
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
                  [style]="{ height: '8px', width: '120px' }"
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
                <p-button
                  icon="pi pi-times"
                  [rounded]="true"
                  [text]="true"
                  (onClick)="showScheduleEditor = false"
                ></p-button>
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
                      ></p-checkbox>
                      <span>Referee</span>
                    </label>
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                      [rounded]="true"
                      (onClick)="removeGame(i)"
                      [disabled]="editGames.length <= 1"
                    ></p-button>
                  </div>
                }
              </div>

              <div class="schedule-actions">
                <p-button
                  label="Add Game"
                  icon="pi pi-plus"
                  [outlined]="true"
                  (onClick)="addGame()"
                ></p-button>
                <p-button
                  label="Generate Plan"
                  icon="pi pi-bolt"
                  (onClick)="generateNutritionPlan()"
                ></p-button>
              </div>
            </div>
          </p-card>
        }

        <!-- Timeline View -->
        <div class="nutrition-timeline">
          <h3 class="timeline-title">
            <i class="pi pi-clock"></i> Your Nutrition Timeline
          </h3>

          @for (window of nutritionWindows(); track window.id) {
            <div
              class="timeline-item"
              [class.completed]="window.completed"
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
                <div class="window-header">
                  <div class="window-time">
                    <span class="time"
                      >{{ window.startTime }} - {{ window.endTime }}</span
                    >
                    @if (window.priority === "critical") {
                      <p-tag value="Critical" severity="danger"></p-tag>
                    }
                  </div>
                  <h4>{{ window.title }}</h4>
                </div>

                <div class="recommendations-grid">
                  @for (rec of window.recommendations; track rec.item) {
                    <div class="recommendation-card" [class]="rec.category">
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
                        @if (rec.alternatives && rec.alternatives.length > 0) {
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
                    <p-button
                      label="Mark Complete"
                      icon="pi pi-check"
                      size="small"
                      [outlined]="true"
                      (onClick)="completeWindow(window)"
                    ></p-button>
                  } @else {
                    <span class="completed-badge">
                      <i class="pi pi-check-circle"></i> Completed
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>

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
                <div class="supp-header">
                  <span class="supp-icon">{{ supp.icon }}</span>
                  <div class="supp-meta">
                    <span class="supp-name">{{ supp.name }}</span>
                    <span
                      class="supp-evidence"
                      [class]="'evidence-' + supp.evidence.toLowerCase()"
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
  styles: [
    `
      @use "styles/animations" as *;

      .tournament-nutrition-page {
        padding: var(--space-6);
        max-width: 1200px;
        margin: 0 auto;
      }

      /* Tournament Banner - Theme Aware */
      .tournament-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 16px;
        margin-bottom: 1.5rem;
        position: relative;
        overflow: hidden;
      }

      .tournament-banner::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          135deg,
          rgba(8, 153, 73, 0.08) 0%,
          transparent 60%
        );
        pointer-events: none;
      }

      .banner-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;
        z-index: 1;
      }

      .banner-icon {
        font-size: 2.5rem;
      }

      .banner-icon .pi {
        color: var(--ds-primary-green);
      }

      .banner-info h2 {
        margin: 0 0 0.25rem 0;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--ds-primary-green);
      }

      .banner-info p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .banner-stats {
        display: flex;
        gap: 2.5rem;
        position: relative;
        z-index: 1;
      }

      .stat {
        text-align: center;
        padding: 0.5rem 1rem;
        background: rgba(8, 153, 73, 0.1);
        border-radius: var(--radius-lg);
      }

      .stat-value {
        display: block;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--ds-primary-green);
      }

      .stat-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        color: var(--text-secondary);
      }

      /* Hydration Card - Design System */
      .hydration-card {
        margin-bottom: 1.5rem;
        border-radius: 16px !important;
        border: 1px solid var(--color-border-secondary, #e5e7eb) !important;
        overflow: hidden;
      }

      .hydration-tracker {
        padding: 0.5rem;
      }

      .hydration-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0 0.5rem;
      }

      .hydration-header h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
      }

      .hydration-header h3 i {
        color: var(--ds-primary-green, #089949);
      }

      .hydration-progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--ds-primary-green, #089949);
      }

      .hydration-progress .target {
        color: var(--color-text-secondary, #6b7280);
        font-weight: 400;
      }

      ::ng-deep .hydration-progress .p-progressbar {
        background: var(--color-border-secondary, #e5e7eb) !important;
        border-radius: 9999px !important;
      }

      ::ng-deep .hydration-progress .p-progressbar-value {
        background: var(--ds-primary-green, #089949) !important;
        border-radius: 9999px !important;
      }

      .hydration-buttons {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.75rem;
      }

      .hydration-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem 0.75rem;
        background: var(--surface-secondary, #f8f9fa);
        border: 1px solid var(--color-border-secondary, #e5e7eb);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .hydration-btn:hover {
        border-color: var(--ds-primary-green, #089949);
        background: rgba(8, 153, 73, 0.05);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .hydration-btn.selected {
        border-color: var(--ds-primary-green, #089949);
        background: rgba(8, 153, 73, 0.1);
        box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.15);
      }

      .hydration-btn .btn-icon {
        font-size: 1.5rem;
        margin-bottom: 0.375rem;
      }

      .hydration-btn .btn-label {
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--color-text-primary, #1a1a1a);
        text-align: center;
      }

      .hydration-btn .btn-amount {
        font-size: 0.6875rem;
        color: var(--color-text-secondary, #6b7280);
        margin-top: 0.125rem;
      }

      /* Schedule Editor */
      .schedule-editor-card {
        margin-bottom: var(--space-6);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
      }

      .card-header h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .schedule-form {
        padding: var(--space-4);
      }

      .form-row {
        margin-bottom: var(--space-4);
      }

      .form-row label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: var(--font-weight-medium);
      }

      .form-row input[type="text"] {
        width: 100%;
      }

      .games-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .game-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--radius-md);
      }

      .game-number {
        font-weight: var(--font-weight-semibold);
        min-width: 70px;
      }

      .time-input {
        padding: var(--space-2);
        border: 1px solid var(--p-surface-300);
        border-radius: var(--radius-md);
      }

      .opponent-input {
        flex: 1;
      }

      .referee-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
      }

      .schedule-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      }

      /* Timeline - Design System */
      .nutrition-timeline {
        margin-bottom: 1.5rem;
      }

      .timeline-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
      }

      .timeline-title i {
        color: var(--ds-primary-green, #089949);
      }

      .timeline-item {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .timeline-marker {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 20px;
        flex-shrink: 0;
      }

      .marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--color-border-secondary, #e5e7eb);
        border: 2px solid var(--surface-primary, #ffffff);
        box-shadow: 0 0 0 2px var(--color-border-secondary, #e5e7eb);
        z-index: 1;
      }

      .timeline-item.current .marker-dot {
        background: var(--ds-primary-green, #089949);
        box-shadow: 0 0 0 2px var(--ds-primary-green, #089949);
      }

      .timeline-item.current .marker-dot.pulse {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          box-shadow:
            0 0 0 2px var(--ds-primary-green, #089949),
            0 0 0 4px rgba(8, 153, 73, 0.3);
        }
        50% {
          box-shadow:
            0 0 0 2px var(--ds-primary-green, #089949),
            0 0 0 10px rgba(8, 153, 73, 0);
        }
      }

      .timeline-item.completed .marker-dot {
        background: var(--ds-primary-green, #089949);
        box-shadow: 0 0 0 2px var(--ds-primary-green, #089949);
      }

      .timeline-item.critical .marker-dot {
        background: var(--primitive-error-500, #ef4444);
        box-shadow: 0 0 0 2px var(--primitive-error-500, #ef4444);
      }

      .marker-line {
        flex: 1;
        width: 2px;
        background: var(--color-border-secondary, #e5e7eb);
        margin-top: 0.25rem;
        min-height: 20px;
      }

      .timeline-content {
        flex: 1;
        background: var(--surface-primary, #ffffff);
        border: 1px solid var(--color-border-secondary, #e5e7eb);
        border-radius: 12px;
        padding: 1.25rem;
      }

      .timeline-item.current .timeline-content {
        border-color: var(--ds-primary-green, #089949);
        box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.1);
      }

      .timeline-item.critical .timeline-content {
        border-left: 3px solid var(--primitive-error-500, #ef4444);
        background: rgba(239, 68, 68, 0.02);
      }

      .window-header {
        margin-bottom: 1rem;
      }

      .window-time {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.375rem;
      }

      .window-time .time {
        font-size: 0.75rem;
        color: var(--color-text-secondary, #6b7280);
        font-weight: 500;
      }

      ::ng-deep .window-time .p-tag {
        font-size: 0.625rem !important;
        padding: 0.125rem 0.5rem !important;
        font-weight: 600 !important;
      }

      .window-header h4 {
        margin: 0;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
      }

      /* Recommendations Grid - Design System */
      .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .recommendation-card {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--surface-secondary, #f8f9fa);
        border-radius: 10px;
        border-left: 3px solid var(--color-border-secondary, #e5e7eb);
      }

      .recommendation-card.food {
        border-left-color: var(--primitive-amber-500, #f59e0b);
        background: rgba(245, 158, 11, 0.04);
      }

      .recommendation-card.drink {
        border-left-color: var(--ds-primary-green, #089949);
        background: rgba(8, 153, 73, 0.04);
      }

      .recommendation-card.supplement {
        border-left-color: var(--primitive-purple-500, #8b5cf6);
        background: rgba(139, 92, 246, 0.04);
      }

      .recommendation-card.action {
        border-left-color: var(--primitive-success-500, #10b981);
        background: rgba(16, 185, 129, 0.04);
      }

      .rec-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .rec-content {
        flex: 1;
        min-width: 0;
      }

      .rec-item {
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        margin-bottom: 0.25rem;
      }

      .rec-amount {
        font-size: 0.8125rem;
        color: var(--ds-primary-green, #089949);
        font-weight: 600;
      }

      .rec-timing {
        font-size: 0.6875rem;
        color: var(--color-text-secondary, #6b7280);
        font-style: italic;
      }

      .rec-reason {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
        margin-top: 0.375rem;
        line-height: 1.4;
      }

      .rec-alternatives {
        font-size: 0.6875rem;
        color: var(--color-text-muted, #9ca3af);
        margin-top: 0.375rem;
      }

      .alt-label {
        font-weight: 600;
        color: var(--color-text-secondary, #6b7280);
      }

      .window-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border-secondary, #e5e7eb);
      }

      .hydration-target {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        color: var(--ds-primary-green, #089949);
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .hydration-target i {
        font-size: 0.875rem;
      }

      .completed-badge {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: var(--ds-primary-green, #089949);
        font-size: 0.8125rem;
        font-weight: 600;
      }

      ::ng-deep .window-footer .p-button {
        font-size: 0.8125rem !important;
      }

      /* Section Cards - Unified Design */
      .section-card {
        background: var(--surface-primary, #ffffff);
        border: 1px solid var(--color-border-secondary, #e5e7eb);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .section-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--color-border-secondary, #e5e7eb);
      }

      .section-icon {
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(8, 153, 73, 0.1);
        border-radius: 10px;
        flex-shrink: 0;
      }

      .section-icon i {
        font-size: 1.125rem;
        color: var(--ds-primary-green, #089949);
      }

      .section-icon.warning {
        background: rgba(245, 158, 11, 0.1);
      }

      .section-icon.warning i {
        color: var(--primitive-amber-500, #f59e0b);
      }

      .section-title h3 {
        margin: 0 0 0.25rem 0;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
      }

      .section-title p {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
      }

      /* Supplements Grid */
      .supplements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-5);
      }

      .supplement-card {
        background: var(--surface-card);
        border: 2px solid var(--color-border-secondary, #e5e7eb);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        transition: all var(--transition-fast);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        animation: fadeInUp 400ms ease-out backwards;
        position: relative;
        overflow: hidden;
      }

      @for $i from 1 through 24 {
        .supplement-card:nth-child(#{$i}) {
          animation-delay: #{$i * 80}ms;
        }
      }

      .supplement-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--ds-primary-green);
        transform: scaleX(0);
        transition: transform var(--transition-fast);
        transform-origin: left;
      }

      .supplement-card:hover {
        border-color: var(--ds-primary-green, #089949);
        box-shadow:
          0 8px 24px rgba(8, 153, 73, 0.15),
          0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-4px);
      }

      .supplement-card:hover::before {
        transform: scaleX(1);
      }

      .supplement-card[data-category="performance"] {
        border-left: 3px solid var(--ds-primary-green, #089949);
      }

      .supplement-card[data-category="endurance"] {
        border-left: 3px solid var(--primitive-blue-500, #3b82f6);
      }

      .supplement-card[data-category="recovery"] {
        border-left: 3px solid var(--primitive-purple-500, #8b5cf6);
      }

      .supplement-card[data-category="hydration"] {
        border-left: 3px solid var(--primitive-cyan-500, #06b6d4);
      }

      .supp-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .supp-icon {
        font-size: 2.5rem;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-tertiary);
        border-radius: var(--radius-lg);
        flex-shrink: 0;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
        transition: transform var(--transition-fast);
      }

      .supplement-card:hover .supp-icon {
        transform: scale(1.1);
      }

      .supp-meta {
        flex: 1;
      }

      .supp-name {
        display: block;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary, #1a1a1a);
        margin-bottom: var(--space-2);
      }

      .supp-evidence {
        display: inline-flex;
        align-items: center;
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .supp-evidence.evidence-strong {
        background: var(--ds-primary-green);
        color: white; /* CRITICAL: White text on green */
        font-weight: var(--font-weight-bold);
      }

      .supp-evidence.evidence-conditional {
        background: var(--primitive-orange-500, #f97316);
        color: white; /* White text on orange */
        font-weight: var(--font-weight-bold);
      }

      .supp-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
      }

      .supp-row {
        display: flex;
        gap: 0.5rem;
        font-size: 0.8125rem;
      }

      .supp-label {
        color: var(--color-text-secondary, #6b7280);
        min-width: 50px;
      }

      .supp-value {
        color: var(--color-text-primary, #1a1a1a);
        font-weight: 500;
      }

      .supp-reason {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
        margin: 0.5rem 0;
        line-height: 1.4;
      }

      .supp-notes {
        display: flex;
        align-items: flex-start;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: var(--color-text-muted, #9ca3af);
        margin: 0;
        padding-top: 0.5rem;
        border-top: 1px dashed var(--color-border-secondary, #e5e7eb);
      }

      .supp-notes i {
        font-size: 0.75rem;
        margin-top: 0.125rem;
        flex-shrink: 0;
      }

      /* Tips Grid */
      .tips-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--space-4);
      }

      .tip-item {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-5);
        background: var(--surface-card);
        border-radius: var(--radius-xl);
        border: 2px solid var(--color-border-secondary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: all var(--transition-fast);
        animation: scaleIn 400ms ease-out backwards;
      }

      @for $i from 1 through 8 {
        .tip-item:nth-child(#{$i}) {
          animation-delay: #{$i * 100}ms;
        }
      }

      .tip-item:hover {
        border-color: var(--ds-primary-green);
        box-shadow: 0 6px 20px rgba(8, 153, 73, 0.12);
        transform: translateY(-3px);
      }

      .tip-icon {
        font-size: 2.5rem;
        flex-shrink: 0;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-tertiary);
        border-radius: var(--radius-lg);
        transition: transform var(--transition-fast);
      }

      .tip-item:hover .tip-icon {
        transform: scale(1.1) rotate(5deg);
      }

      .tip-content h4 {
        margin: 0 0 var(--space-2) 0;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary, #1a1a1a);
      }

      .tip-content p {
        margin: 0;
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary, #6b7280);
        line-height: 1.5;
      }

      /* Referee Alert */
      .referee-alert-card {
        margin-bottom: 1.5rem;
        border-left: 4px solid #f59e0b;
      }

      .referee-alert {
        display: flex;
        gap: 1rem;
        padding: 0.5rem;
      }

      .alert-icon {
        font-size: 2rem;
      }

      .alert-content h4 {
        margin: 0 0 0.25rem 0;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--primitive-orange-700, #b45309);
      }

      .alert-content p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #6b7280);
        line-height: 1.5;
      }

      /* Quick Reference */
      .quick-ref-card {
        margin-bottom: 1.5rem;
      }

      ::ng-deep .quick-ref-card .p-card-header {
        padding: 0 !important;
        background: transparent !important;
        border: none !important;
      }

      ::ng-deep .quick-ref-card .p-card-header h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        padding: 1rem 1.25rem;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        background: linear-gradient(
          to right,
          var(--surface-secondary, #f8f9fa),
          transparent
        );
        border-bottom: 1px solid var(--color-border-secondary, #e5e7eb);
      }

      ::ng-deep .quick-ref-card .p-card-header h3::before {
        content: "";
        display: block;
        width: 4px;
        height: 1.25rem;
        background: var(--ds-primary-green, #089949);
        border-radius: 2px;
      }

      ::ng-deep .quick-ref-card .p-card-header h3 i {
        display: none;
      }

      .packing-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-6);
        padding: var(--space-6);
      }

      .pack-category {
        animation: fadeInUp 500ms ease-out backwards;
      }

      @for $i from 1 through 4 {
        .pack-category:nth-child(#{$i}) {
          animation-delay: #{$i * 150}ms;
        }
      }

      .pack-category h4 {
        margin: 0 0 var(--space-4) 0;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary, #1a1a1a);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding-bottom: var(--space-3);
        border-bottom: 3px solid var(--ds-primary-green);
      }

      .pack-category ul {
        margin: 0;
        padding-left: var(--space-5);
        list-style-type: none;
      }

      .pack-category li {
        margin-bottom: var(--space-3);
        font-size: var(--font-body-md);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
        position: relative;
        padding-left: var(--space-3);
      }

      .pack-category li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        background: var(--ds-primary-green);
        border-radius: 50%;
      }

      /* ===== REDUCED MOTION ===== */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }

        .tip-item:hover .tip-icon,
        .supplement-card:hover .supp-icon {
          transform: none !important;
        }
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 1024px) {
        .packing-list {
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-5);
        }

        .hydration-buttons {
          grid-template-columns: repeat(3, 1fr);
        }

        .supplements-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .tips-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .tournament-nutrition-page {
          padding: var(--space-4);
        }

        .tournament-banner {
          flex-direction: column;
          gap: var(--space-4);
          text-align: center;
          padding: var(--space-5);
        }

        .banner-stats {
          width: 100%;
          justify-content: space-around;
          gap: var(--space-4);
        }

        .game-row {
          flex-wrap: wrap;
        }

        .opponent-input {
          width: 100%;
          order: 3;
        }

        .recommendations-grid {
          grid-template-columns: 1fr;
        }

        .hydration-buttons {
          grid-template-columns: repeat(2, 1fr);
        }

        .supplements-grid {
          grid-template-columns: 1fr;
        }

        .tips-grid {
          grid-template-columns: 1fr;
        }

        .packing-list {
          grid-template-columns: 1fr;
          padding: var(--space-4);
        }

        .supp-icon {
          width: 48px;
          height: 48px;
          font-size: 2rem;
        }

        .tip-icon {
          width: 48px;
          height: 48px;
          font-size: 2rem;
        }
      }

      @media (max-width: 480px) {
        .hydration-buttons {
          grid-template-columns: repeat(2, 1fr);
        }

        .banner-stats {
          flex-direction: column;
          gap: var(--space-3);
        }
      }
    `,
  ],
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
      } catch (e) {
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
      } catch (e) {
        // Ignore
      }
    }

    // If no schedule, show default example
    if (this.games().length === 0) {
      this.editGames = [
        { id: "1", time: "08:00", opponent: "", isReferee: false },
        { id: "2", time: "11:00", opponent: "", isReferee: false },
        { id: "3", time: "15:00", opponent: "", isReferee: true },
        { id: "4", time: "17:00", opponent: "", isReferee: false },
      ];
      this.showScheduleEditor = true;
    }
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
      const isLastGame = index === sortedGames.length - 1;
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
    gameNum: number,
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
    this.toastService.success("Window completed! Keep it up! 💪");
  }
}
