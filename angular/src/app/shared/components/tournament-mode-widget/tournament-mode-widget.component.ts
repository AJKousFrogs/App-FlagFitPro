/**
 * Tournament Mode Widget
 *
 * Persistent widget showing active tournament status:
 * - Current day/game progress
 * - Next game countdown
 * - Hydration tracking
 * - Quick nutrition logging
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  inject,
  computed,
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
import { BadgeModule } from "primeng/badge";

// Services
import { TournamentModeService } from "../../../core/services/tournament-mode.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-tournament-mode-widget",
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
    BadgeModule,
  ],
  template: `
    @if (isInTournament()) {
      <div class="tournament-widget">
        <!-- Header -->
        <div class="widget-header">
          <div class="header-content">
            <div class="trophy-icon">
              <i class="pi pi-trophy"></i>
            </div>
            <div class="header-text">
              <h3>{{ tournament()!.name }}</h3>
              <span class="day-indicator">
                Day {{ tournament()!.currentDay }} of {{ tournament()!.totalDays }}
              </span>
            </div>
          </div>
          <p-tag value="ACTIVE" severity="success"></p-tag>
        </div>

        <!-- Game Progress -->
        <div class="game-progress">
          <div class="progress-header">
            <span class="progress-label">Games</span>
            <span class="progress-count">
              {{ stats()?.gamesPlayed || 0 }} / {{ tournament()!.totalGames }}
            </span>
          </div>
          <div class="game-dots">
            @for (game of tournament()!.games; track game.id) {
              <div
                class="game-dot"
                [class.completed]="game.status === 'completed'"
                [class.won]="game.result?.won"
                [class.lost]="game.result && !game.result.won"
                [class.current]="game.status === 'in_progress'"
                [class.upcoming]="game.status === 'upcoming'"
                [pTooltip]="getGameTooltip(game)"
              >
                @if (game.status === 'completed') {
                  @if (game.result?.won) {
                    <i class="pi pi-check"></i>
                  } @else {
                    <i class="pi pi-times"></i>
                  }
                } @else if (game.status === 'in_progress') {
                  <i class="pi pi-play"></i>
                } @else {
                  <span>{{ game.gameNumber }}</span>
                }
              </div>
            }
          </div>
          <div class="record">
            <span class="wins">{{ stats()?.gamesWon || 0 }}W</span>
            <span class="separator">-</span>
            <span class="losses">{{ stats()?.gamesLost || 0 }}L</span>
          </div>
        </div>

        <!-- Next Game -->
        @if (nextGame()) {
          <div class="next-game-section">
            <div class="next-game-header">
              <span class="section-label">Next Game</span>
              <span class="time-until" [class.urgent]="(stats()?.hoursUntilNextGame || 0) < 2">
                @if ((stats()?.hoursUntilNextGame || 0) < 1) {
                  {{ getMinutesUntilNextGame() }} min
                } @else {
                  {{ stats()?.hoursUntilNextGame | number: "1.0-0" }}h
                }
              </span>
            </div>
            <div class="next-game-info">
              <span class="opponent">vs {{ nextGame()!.opponent }}</span>
              <span class="time">{{ nextGame()!.scheduledTime | date: "shortTime" }}</span>
            </div>
          </div>
        }

        <!-- Hydration Tracker -->
        <div class="hydration-section">
          <div class="hydration-header">
            <div class="hydration-label">
              <i class="pi pi-tint"></i>
              <span>Hydration</span>
            </div>
            <span
              class="hydration-status"
              [class.on-track]="stats()?.isOnTrack"
              [class.behind]="!stats()?.isOnTrack"
            >
              {{ stats()?.isOnTrack ? "On Track" : "Drink More!" }}
            </span>
          </div>
          <p-progressBar
            [value]="stats()?.hydrationProgress || 0"
            [showValue]="false"
            [style]="{ height: '8px' }"
            [styleClass]="getHydrationClass()"
          ></p-progressBar>
          <div class="hydration-details">
            <span>{{ tournament()!.hydrationConsumed }}ml</span>
            <span class="target">/ {{ tournament()!.hydrationTarget }}ml</span>
          </div>
          
          <!-- Quick Hydration Buttons -->
          <div class="quick-hydration">
            <button
              class="hydration-btn"
              (click)="logQuickHydration(250)"
              pTooltip="Log 250ml"
            >
              <i class="pi pi-plus"></i>
              250ml
            </button>
            <button
              class="hydration-btn"
              (click)="logQuickHydration(500)"
              pTooltip="Log 500ml"
            >
              <i class="pi pi-plus"></i>
              500ml
            </button>
            <button
              class="hydration-btn sports"
              (click)="logQuickHydration(500, 'Sports Drink')"
              pTooltip="Log sports drink"
            >
              <i class="pi pi-bolt"></i>
              Sports
            </button>
          </div>
        </div>

        <!-- Nutrition Suggestion -->
        <div class="nutrition-suggestion">
          <div class="suggestion-header">
            <i class="pi pi-apple"></i>
            <span class="phase-badge" [class]="'phase-' + nutritionSuggestion().phase">
              {{ nutritionSuggestion().phase | titlecase }}
            </span>
          </div>
          <p class="suggestion-text">{{ nutritionSuggestion().suggestion }}</p>
          <div class="suggested-foods">
            @for (food of nutritionSuggestion().foods.slice(0, 3); track food) {
              <span class="food-chip">{{ food }}</span>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="widget-actions">
          <p-button
            label="Nutrition Plan"
            icon="pi pi-apple"
            styleClass="p-button-sm"
            routerLink="/game/nutrition"
          ></p-button>
          <p-button
            label="End Tournament"
            icon="pi pi-stop"
            styleClass="p-button-sm p-button-text p-button-danger"
            (onClick)="confirmEndTournament()"
          ></p-button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .tournament-widget {
        background: linear-gradient(
          135deg,
          var(--surface-primary) 0%,
          var(--p-yellow-50) 100%
        );
        border: 2px solid var(--p-yellow-300);
        border-radius: 16px;
        padding: var(--space-5);
        margin-bottom: var(--space-4);
      }

      /* Header */
      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-4);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .trophy-icon {
        width: 44px;
        height: 44px;
        background: var(--p-yellow-100);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .trophy-icon i {
        font-size: 1.5rem;
        color: var(--p-yellow-600);
      }

      .header-text h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .day-indicator {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      /* Game Progress */
      .game-progress {
        background: white;
        border-radius: 12px;
        padding: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-3);
      }

      .progress-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .progress-count {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .game-dots {
        display: flex;
        gap: var(--space-2);
        justify-content: center;
        margin-bottom: var(--space-3);
      }

      .game-dot {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        background: var(--p-surface-100);
        color: var(--text-secondary);
        transition: all 0.2s;
      }

      .game-dot.upcoming {
        border: 2px dashed var(--p-surface-300);
        background: transparent;
      }

      .game-dot.current {
        background: var(--p-blue-500);
        color: white;
        animation: pulse 1.5s infinite;
      }

      .game-dot.won {
        background: var(--p-green-500);
        color: white;
      }

      .game-dot.lost {
        background: var(--p-red-400);
        color: white;
      }

      .game-dot i {
        font-size: 0.875rem;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }

      .record {
        display: flex;
        justify-content: center;
        gap: var(--space-2);
        font-size: 1rem;
        font-weight: 700;
      }

      .wins {
        color: var(--p-green-600);
      }

      .losses {
        color: var(--p-red-500);
      }

      .separator {
        color: var(--text-secondary);
      }

      /* Next Game */
      .next-game-section {
        background: var(--p-orange-50);
        border-radius: 8px;
        padding: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .next-game-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .section-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .time-until {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--p-orange-600);
      }

      .time-until.urgent {
        color: var(--p-red-600);
        animation: blink 1s infinite;
      }

      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .next-game-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .opponent {
        font-weight: 600;
        color: var(--text-primary);
      }

      .time {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      /* Hydration */
      .hydration-section {
        margin-bottom: var(--space-4);
      }

      .hydration-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .hydration-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .hydration-label i {
        color: var(--p-blue-500);
      }

      .hydration-status {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
      }

      .hydration-status.on-track {
        background: var(--p-green-100);
        color: var(--p-green-700);
      }

      .hydration-status.behind {
        background: var(--p-red-100);
        color: var(--p-red-700);
      }

      :host ::ng-deep .hydration-green .p-progressbar-value {
        background: var(--p-blue-500);
      }

      :host ::ng-deep .hydration-orange .p-progressbar-value {
        background: var(--p-orange-500);
      }

      :host ::ng-deep .hydration-red .p-progressbar-value {
        background: var(--p-red-500);
      }

      .hydration-details {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-1);
        font-size: 0.75rem;
        margin-top: var(--space-1);
        margin-bottom: var(--space-3);
      }

      .hydration-details .target {
        color: var(--text-secondary);
      }

      .quick-hydration {
        display: flex;
        gap: var(--space-2);
      }

      .hydration-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-1);
        padding: var(--space-2);
        background: var(--p-blue-50);
        border: 1px solid var(--p-blue-200);
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--p-blue-700);
        cursor: pointer;
        transition: all 0.2s;
      }

      .hydration-btn:hover {
        background: var(--p-blue-100);
      }

      .hydration-btn.sports {
        background: var(--p-yellow-50);
        border-color: var(--p-yellow-300);
        color: var(--p-yellow-700);
      }

      .hydration-btn.sports:hover {
        background: var(--p-yellow-100);
      }

      /* Nutrition Suggestion */
      .nutrition-suggestion {
        background: var(--p-green-50);
        border-radius: 8px;
        padding: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .suggestion-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .suggestion-header i {
        color: var(--p-green-600);
      }

      .phase-badge {
        font-size: 0.625rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .phase-badge.phase-pre-game {
        background: var(--p-orange-100);
        color: var(--p-orange-700);
      }

      .phase-badge.phase-during {
        background: var(--p-red-100);
        color: var(--p-red-700);
      }

      .phase-badge.phase-post-game {
        background: var(--p-blue-100);
        color: var(--p-blue-700);
      }

      .phase-badge.phase-recovery {
        background: var(--p-green-100);
        color: var(--p-green-700);
      }

      .suggestion-text {
        margin: 0 0 var(--space-2) 0;
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .suggested-foods {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }

      .food-chip {
        font-size: 0.75rem;
        padding: 2px 8px;
        background: white;
        border-radius: 12px;
        color: var(--p-green-700);
      }

      /* Actions */
      .widget-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .game-dots {
          flex-wrap: wrap;
        }

        .game-dot {
          width: 28px;
          height: 28px;
          font-size: 0.625rem;
        }

        .quick-hydration {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class TournamentModeWidgetComponent {
  private tournamentService = inject(TournamentModeService);
  private toastService = inject(ToastService);

  // Computed values
  isInTournament = this.tournamentService.isInTournament;
  tournament = this.tournamentService.activeTournament;
  stats = this.tournamentService.tournamentStats;
  nextGame = this.tournamentService.nextGame;

  nutritionSuggestion = computed(() =>
    this.tournamentService.getNutritionSuggestion()
  );

  getGameTooltip(game: {
    opponent: string;
    status: string;
    result?: { ourScore: number; theirScore: number };
  }): string {
    if (game.status === "completed" && game.result) {
      return `${game.opponent}: ${game.result.ourScore}-${game.result.theirScore}`;
    }
    if (game.status === "in_progress") {
      return `Playing: ${game.opponent}`;
    }
    return `vs ${game.opponent}`;
  }

  getMinutesUntilNextGame(): number {
    const hours = this.stats()?.hoursUntilNextGame || 0;
    return Math.round(hours * 60);
  }

  getHydrationClass(): string {
    const progress = this.stats()?.hydrationProgress || 0;
    if (progress >= 70) return "hydration-green";
    if (progress >= 40) return "hydration-orange";
    return "hydration-red";
  }

  logQuickHydration(ml: number, description: string = "Water"): void {
    this.tournamentService.logHydration(ml, description);
    this.toastService.success(`+${ml}ml logged! 💧`);
  }

  confirmEndTournament(): void {
    if (
      confirm(
        "Are you sure you want to end this tournament? This action cannot be undone."
      )
    ) {
      this.tournamentService.endTournament();
      this.toastService.info("Tournament ended. Great job!");
    }
  }
}
