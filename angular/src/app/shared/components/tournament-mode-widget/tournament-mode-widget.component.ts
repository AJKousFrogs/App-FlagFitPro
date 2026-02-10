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

import { ButtonComponent } from "../button/button.component";
import { ProgressBar } from "primeng/progressbar";
import { Tooltip } from "primeng/tooltip";

import { StatusTagComponent } from "../status-tag/status-tag.component";

// Services
import { TournamentModeService } from "../../../core/services/tournament-mode.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { DialogService } from "../../../core/ui/dialog.service";

@Component({
  selector: "app-tournament-mode-widget",
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
                Day {{ tournament()!.currentDay }} of
                {{ tournament()!.totalDays }}
              </span>
            </div>
          </div>
          <app-status-tag value="ACTIVE" severity="success" size="sm" />
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
                @if (game.status === "completed") {
                  @if (game.result?.won) {
                    <i class="pi pi-check"></i>
                  } @else {
                    <i class="pi pi-times"></i>
                  }
                } @else if (game.status === "in_progress") {
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
              <span
                class="time-until"
                [class.urgent]="(stats()?.hoursUntilNextGame || 0) < 2"
              >
                @if ((stats()?.hoursUntilNextGame || 0) < 1) {
                  {{ getMinutesUntilNextGame() }} min
                } @else {
                  {{ stats()?.hoursUntilNextGame | number: "1.0-0" }}h
                }
              </span>
            </div>
            <div class="next-game-info">
              <span class="opponent">vs {{ nextGame()!.opponent }}</span>
              <span class="item-time">{{
                nextGame()!.scheduledTime | date: "shortTime"
              }}</span>
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
            [class]="getHydrationClass() + ' progressbar-height-sm'"
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
            <span
              class="phase-badge"
              [class]="'phase-' + nutritionSuggestion().phase"
            >
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
          <app-button iconLeft="pi-apple" routerLink="/game/nutrition"
            >Nutrition Plan</app-button
          >
          <app-button iconLeft="pi-stop" (clicked)="confirmEndTournament()"
            >End Tournament</app-button
          >
        </div>
      </div>
    }
  `,
  styleUrl: "./tournament-mode-widget.component.scss",
})
export class TournamentModeWidgetComponent {
  private tournamentService = inject(TournamentModeService);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);

  // Computed values
  isInTournament = this.tournamentService.isInTournament;
  tournament = this.tournamentService.activeTournament;
  stats = this.tournamentService.tournamentStats;
  nextGame = this.tournamentService.nextGame;

  nutritionSuggestion = computed(() =>
    this.tournamentService.getNutritionSuggestion(),
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

  async confirmEndTournament(): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      "Are you sure you want to end this tournament? This action cannot be undone.",
      "End Tournament",
    );
    if (!confirmed) return;

    this.tournamentService.endTournament();
    this.toastService.info(TOAST.INFO.TOURNAMENT_ENDED);
  }
}
