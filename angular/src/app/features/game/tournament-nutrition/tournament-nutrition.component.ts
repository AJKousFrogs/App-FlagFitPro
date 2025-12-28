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

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';

// App Components & Services
import { MainLayoutComponent } from '../../../shared/components/layout/main-layout.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NutritionService } from '../../../core/services/nutrition.service';

interface GameSchedule {
  id: string;
  time: string; // HH:MM format
  opponent?: string;
  isReferee?: boolean;
  completed?: boolean;
}

interface NutritionWindow {
  id: string;
  type: 'pre-game' | 'halftime' | 'post-game' | 'between-games' | 'referee-duty' | 'morning';
  startTime: string;
  endTime: string;
  title: string;
  priority: 'critical' | 'high' | 'medium';
  recommendations: NutritionRecommendation[];
  hydrationTarget: number; // ml
  completed?: boolean;
  relatedGameId?: string;
}

interface NutritionRecommendation {
  category: 'food' | 'drink' | 'supplement' | 'action';
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
  type: 'water' | 'electrolyte' | 'sports-drink' | 'smoothie' | 'protein-shake';
}

@Component({
  selector: 'app-tournament-nutrition',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
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
            <div class="banner-icon">🏆</div>
            <div class="banner-info">
              <h2>{{ tournamentName() }}</h2>
              <p>{{ games().length }} Games · {{ tournamentDuration() }}</p>
            </div>
          </div>
          <div class="banner-stats">
            <div class="stat">
              <span class="stat-value">{{ totalHydration() | number:'1.0-0' }}ml</span>
              <span class="stat-label">Hydration Today</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ completedWindows() }}/{{ nutritionWindows().length }}</span>
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
                <div class="marker-dot" [class.pulse]="isCurrentWindow(window)"></div>
                <div class="marker-line"></div>
              </div>
              
              <div class="timeline-content">
                <div class="window-header">
                  <div class="window-time">
                    <span class="time">{{ window.startTime }} - {{ window.endTime }}</span>
                    @if (window.priority === 'critical') {
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
                            {{ rec.alternatives.join(', ') }}
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

        <!-- Cramp Prevention Tips -->
        <p-card class="tips-card">
          <ng-template pTemplate="header">
            <h3><i class="pi pi-exclamation-triangle"></i> Cramp Prevention Protocol</h3>
          </ng-template>
          <div class="tips-grid">
            <div class="tip-item">
              <div class="tip-icon">🧂</div>
              <div class="tip-content">
                <h4>Electrolyte Balance</h4>
                <p>Add electrolyte tabs to water between games. Sodium, potassium, and magnesium are key.</p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">🍌</div>
              <div class="tip-content">
                <h4>Potassium Boost</h4>
                <p>Banana or coconut water 30min before each game. Prevents muscle cramping.</p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">🧊</div>
              <div class="tip-content">
                <h4>Stay Cool</h4>
                <p>Use ice towels between games. Overheating accelerates electrolyte loss.</p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">🚫</div>
              <div class="tip-content">
                <h4>Avoid</h4>
                <p>No burgers, hot dogs, or heavy fried foods. They slow digestion and cause sluggishness.</p>
              </div>
            </div>
          </div>
        </p-card>

        <!-- Referee Duty Alert -->
        @if (hasRefereeDuty()) {
          <p-card class="referee-alert-card">
            <div class="referee-alert">
              <div class="alert-icon">🏁</div>
              <div class="alert-content">
                <h4>Referee Duty Detected</h4>
                <p>You're refereeing between games. Stay hydrated but avoid heavy eating. 
                   Light snacks and electrolytes only. Full recovery nutrition after your duty.</p>
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
  styles: [`
    .tournament-nutrition-page {
      padding: var(--space-6);
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Tournament Banner */
    .tournament-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: linear-gradient(135deg, var(--color-brand-primary) 0%, #065f2d 100%);
      border-radius: var(--radius-xl);
      margin-bottom: var(--space-6);
      color: white;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .banner-icon {
      font-size: 3rem;
    }

    .banner-info h2 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-bold);
    }

    .banner-info p {
      margin: 0;
      opacity: 0.9;
    }

    .banner-stats {
      display: flex;
      gap: var(--space-8);
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-bold);
    }

    .stat-label {
      font-size: var(--text-sm);
      opacity: 0.8;
    }

    /* Hydration Card */
    .hydration-card {
      margin-bottom: var(--space-6);
    }

    .hydration-tracker {
      padding: var(--space-2);
    }

    .hydration-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .hydration-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-lg);
      color: var(--color-text-primary);
    }

    .hydration-header h3 i {
      color: #3b82f6;
    }

    .hydration-progress {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-weight-semibold);
    }

    .hydration-progress .target {
      color: var(--color-text-secondary);
      font-weight: normal;
    }

    .hydration-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--space-3);
    }

    .hydration-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-4);
      background: var(--p-surface-50);
      border: 2px solid var(--p-surface-200);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s;
    }

    .hydration-btn:hover {
      border-color: var(--color-brand-primary);
      background: var(--p-surface-100);
    }

    .hydration-btn.selected {
      border-color: var(--color-brand-primary);
      background: rgba(8, 153, 73, 0.1);
    }

    .hydration-btn .btn-icon {
      font-size: 1.5rem;
      margin-bottom: var(--space-1);
    }

    .hydration-btn .btn-label {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .hydration-btn .btn-amount {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
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

    /* Timeline */
    .nutrition-timeline {
      margin-bottom: var(--space-6);
    }

    .timeline-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
      font-size: var(--text-xl);
      color: var(--color-text-primary);
    }

    .timeline-item {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .timeline-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 24px;
    }

    .marker-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--p-surface-300);
      border: 3px solid var(--p-surface-100);
      z-index: 1;
    }

    .timeline-item.current .marker-dot {
      background: var(--color-brand-primary);
    }

    .timeline-item.current .marker-dot.pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(8, 153, 73, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(8, 153, 73, 0); }
    }

    .timeline-item.completed .marker-dot {
      background: var(--color-brand-secondary);
    }

    .timeline-item.critical .marker-dot {
      background: #ef4444;
    }

    .marker-line {
      flex: 1;
      width: 2px;
      background: var(--p-surface-200);
      margin-top: var(--space-1);
    }

    .timeline-content {
      flex: 1;
      background: var(--p-surface-card);
      border: 1px solid var(--p-surface-200);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .timeline-item.current .timeline-content {
      border-color: var(--color-brand-primary);
      box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.1);
    }

    .timeline-item.critical .timeline-content {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.02);
    }

    .window-header {
      margin-bottom: var(--space-4);
    }

    .window-time {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .window-time .time {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .window-header h4 {
      margin: 0;
      font-size: var(--text-lg);
      color: var(--color-text-primary);
    }

    /* Recommendations Grid */
    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .recommendation-card {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--p-surface-50);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--p-surface-300);
    }

    .recommendation-card.food {
      border-left-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }

    .recommendation-card.drink {
      border-left-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }

    .recommendation-card.supplement {
      border-left-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.05);
    }

    .recommendation-card.action {
      border-left-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }

    .rec-icon {
      font-size: 1.5rem;
    }

    .rec-content {
      flex: 1;
    }

    .rec-item {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin-bottom: var(--space-1);
    }

    .rec-amount {
      font-size: var(--text-sm);
      color: var(--color-brand-primary);
      font-weight: var(--font-weight-medium);
    }

    .rec-timing {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      font-style: italic;
    }

    .rec-reason {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-top: var(--space-1);
    }

    .rec-alternatives {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
      margin-top: var(--space-1);
    }

    .alt-label {
      font-weight: var(--font-weight-medium);
    }

    .window-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--space-3);
      border-top: 1px solid var(--p-surface-200);
    }

    .hydration-target {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: #3b82f6;
      font-weight: var(--font-weight-medium);
    }

    .completed-badge {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--color-brand-primary);
      font-weight: var(--font-weight-medium);
    }

    /* Tips Card */
    .tips-card {
      margin-bottom: var(--space-6);
    }

    .tips-card h3 {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      padding: var(--space-4);
      color: #f59e0b;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
      padding: var(--space-4);
    }

    .tip-item {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--p-surface-50);
      border-radius: var(--radius-md);
    }

    .tip-icon {
      font-size: 1.5rem;
    }

    .tip-content h4 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-base);
      color: var(--color-text-primary);
    }

    .tip-content p {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    /* Referee Alert */
    .referee-alert-card {
      margin-bottom: var(--space-6);
      border-left: 4px solid #f59e0b;
    }

    .referee-alert {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-2);
    }

    .alert-icon {
      font-size: 2rem;
    }

    .alert-content h4 {
      margin: 0 0 var(--space-1) 0;
      color: #f59e0b;
    }

    .alert-content p {
      margin: 0;
      color: var(--color-text-secondary);
    }

    /* Quick Reference */
    .quick-ref-card h3 {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      padding: var(--space-4);
    }

    .packing-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-4);
      padding: var(--space-4);
    }

    .pack-category h4 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-base);
    }

    .pack-category ul {
      margin: 0;
      padding-left: var(--space-4);
    }

    .pack-category li {
      margin-bottom: var(--space-1);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .tournament-banner {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .banner-stats {
        width: 100%;
        justify-content: space-around;
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
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `],
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
  tournamentName = signal('Tournament Day');
  showScheduleEditor = false;
  selectedHydration: string | null = null;

  // Edit state
  editGames: GameSchedule[] = [];
  editTournamentName = 'Tournament Day';

  // Hydration options
  hydrationOptions = [
    { type: 'water', label: 'Water', amount: 250, icon: '💧', tooltip: 'Plain water' },
    { type: 'electrolyte', label: 'Electrolyte', amount: 500, icon: '⚡', tooltip: 'Electrolyte drink' },
    { type: 'sports-drink', label: 'Sports Drink', amount: 350, icon: '🥤', tooltip: 'Gatorade, Powerade, etc.' },
    { type: 'smoothie', label: 'Smoothie', amount: 400, icon: '🥤', tooltip: 'Fruit smoothie' },
    { type: 'protein-shake', label: 'Protein Shake', amount: 300, icon: '🥛', tooltip: 'Protein shake' },
    { type: 'coconut', label: 'Coconut Water', amount: 330, icon: '🥥', tooltip: 'Natural electrolytes' },
  ];

  // Computed values
  dailyHydrationTarget = computed(() => {
    // Base: 3L + 500ml per game
    return 3000 + (this.games().length * 500);
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
    return this.nutritionWindows().filter(w => w.completed).length;
  });

  tournamentDuration = computed(() => {
    const gameList = this.games();
    if (gameList.length === 0) return 'No games scheduled';
    const first = gameList[0].time;
    const last = gameList[gameList.length - 1].time;
    return `${first} - ${last}`;
  });

  nextGameIn = computed(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const game of this.games()) {
      const [hours, minutes] = game.time.split(':').map(Number);
      const gameTime = hours * 60 + minutes;
      
      if (gameTime > currentTime && !game.completed) {
        const diff = gameTime - currentTime;
        if (diff < 60) return `${diff}min`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
      }
    }
    return 'Done!';
  });

  hasRefereeDuty = computed(() => {
    return this.games().some(g => g.isReferee);
  });

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadSavedSchedule();
    
    // Auto-refresh every minute to update "next game" countdown
    this.refreshInterval = setInterval(() => {
      // Trigger reactivity
      this.games.update(g => [...g]);
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private async loadSavedSchedule(): Promise<void> {
    // Try to load from localStorage first (for quick access)
    const saved = localStorage.getItem('tournament_schedule');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.tournamentName.set(data.name || 'Tournament Day');
        this.games.set(data.games || []);
        this.editTournamentName = data.name || 'Tournament Day';
        this.editGames = [...(data.games || [])];
        
        if (data.games?.length > 0) {
          this.generateNutritionPlan();
        }
      } catch (e) {
        this.logger.warn('[TournamentNutrition] Could not parse saved schedule');
      }
    }

    // Load hydration logs for today
    const todayLogs = localStorage.getItem('hydration_logs_' + new Date().toDateString());
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
        { id: '1', time: '08:00', opponent: '', isReferee: false },
        { id: '2', time: '11:00', opponent: '', isReferee: false },
        { id: '3', time: '15:00', opponent: '', isReferee: true },
        { id: '4', time: '17:00', opponent: '', isReferee: false },
      ];
      this.showScheduleEditor = true;
    }
  }

  addGame(): void {
    const lastGame = this.editGames[this.editGames.length - 1];
    let nextTime = '09:00';
    
    if (lastGame) {
      const [hours, minutes] = lastGame.time.split(':').map(Number);
      const nextHours = hours + 2;
      nextTime = `${nextHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    this.editGames.push({
      id: Date.now().toString(),
      time: nextTime,
      opponent: '',
      isReferee: false,
    });
  }

  removeGame(index: number): void {
    this.editGames.splice(index, 1);
  }

  generateNutritionPlan(): void {
    // Sort games by time
    const sortedGames = [...this.editGames].sort((a, b) => a.time.localeCompare(b.time));
    
    this.games.set(sortedGames);
    this.tournamentName.set(this.editTournamentName);
    this.showScheduleEditor = false;

    // Save to localStorage
    localStorage.setItem('tournament_schedule', JSON.stringify({
      name: this.editTournamentName,
      games: sortedGames,
    }));

    // Generate nutrition windows
    const windows: NutritionWindow[] = [];
    
    // Morning nutrition (if first game is after 7am)
    const firstGameTime = sortedGames[0]?.time;
    if (firstGameTime) {
      const [firstHour] = firstGameTime.split(':').map(Number);
      
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
          windows.push(this.createBetweenGamesWindow(game, nextGame, index + 1, timeBetween));
        } else {
          windows.push(this.createQuickRecoveryWindow(game, nextGame, index + 1));
        }
      } else {
        // Final post-game recovery
        windows.push(this.createFinalRecoveryWindow(game, index + 1));
      }
    });

    this.nutritionWindows.set(windows);
    this.toastService.success(`Nutrition plan generated for ${sortedGames.length} games!`);
  }

  private createMorningWindow(wakeTime: string, firstGameTime: string): NutritionWindow {
    return {
      id: 'morning',
      type: 'morning',
      startTime: wakeTime,
      endTime: this.subtractMinutes(firstGameTime, 90),
      title: '🌅 Tournament Morning Fuel',
      priority: 'critical',
      hydrationTarget: 500,
      recommendations: [
        {
          category: 'food',
          item: 'Complex Carbs Breakfast',
          amount: '300-400 calories',
          timing: '2-3 hours before first game',
          reason: 'Slow-release energy for sustained performance',
          icon: '🥣',
          alternatives: ['Oatmeal with banana', 'Whole grain toast with PB', 'Rice with eggs'],
        },
        {
          category: 'drink',
          item: 'Water + Electrolytes',
          amount: '500ml',
          timing: 'With breakfast',
          reason: 'Start hydrated - you\'ll sweat a lot today',
          icon: '💧',
        },
        {
          category: 'food',
          item: 'Banana',
          amount: '1 medium',
          timing: '1 hour before game',
          reason: 'Quick potassium boost for muscle function',
          icon: '🍌',
        },
        {
          category: 'action',
          item: 'Light Dynamic Stretching',
          timing: '30 min before game',
          reason: 'Activate muscles without depleting energy',
          icon: '🧘',
        },
      ],
    };
  }

  private createPreGameWindow(game: GameSchedule, gameNum: number): NutritionWindow {
    const startTime = this.subtractMinutes(game.time, 45);
    return {
      id: `pre-game-${gameNum}`,
      type: 'pre-game',
      startTime,
      endTime: this.subtractMinutes(game.time, 15),
      title: `⚡ Pre-Game ${gameNum}${game.opponent ? ` vs ${game.opponent}` : ''}`,
      priority: 'critical',
      hydrationTarget: 300,
      relatedGameId: game.id,
      recommendations: [
        {
          category: 'drink',
          item: 'Water or Sports Drink',
          amount: '200-300ml',
          timing: '30-45 min before',
          reason: 'Final hydration before intense activity',
          icon: '💧',
        },
        {
          category: 'food',
          item: 'Quick Energy Snack',
          amount: '100-150 calories',
          timing: '30 min before',
          reason: 'Fast-absorbing carbs for immediate energy',
          icon: '⚡',
          alternatives: ['Energy gel', 'Rice cake with honey', 'Half banana', 'Sports chews'],
        },
        {
          category: 'supplement',
          item: 'Electrolyte Tab',
          amount: '1 tab in water',
          timing: '30 min before',
          reason: 'Pre-load sodium to prevent cramping',
          icon: '🧂',
        },
      ],
    };
  }

  private createHalftimeWindow(game: GameSchedule, gameNum: number): NutritionWindow {
    const halftimeStart = this.addMinutes(game.time, 20); // ~20 min into game
    return {
      id: `halftime-${gameNum}`,
      type: 'halftime',
      startTime: halftimeStart,
      endTime: this.addMinutes(halftimeStart, 10),
      title: `🏈 Halftime - Game ${gameNum}`,
      priority: 'high',
      hydrationTarget: 200,
      relatedGameId: game.id,
      recommendations: [
        {
          category: 'drink',
          item: 'Electrolyte Drink',
          amount: '150-200ml',
          timing: 'Immediately',
          reason: 'Replace sweat losses, prevent second-half cramping',
          icon: '⚡',
        },
        {
          category: 'food',
          item: 'Quick Sugar Hit',
          amount: '50-75 calories',
          reason: 'Instant energy for second half push',
          icon: '🍬',
          alternatives: ['Orange slices', 'Sports chews', 'Honey packet'],
        },
        {
          category: 'action',
          item: 'Ice Towel on Neck',
          reason: 'Cool core temperature, reduce fatigue',
          icon: '🧊',
        },
      ],
    };
  }

  private createBetweenGamesWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number,
    minutesBetween: number
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45); // ~45 min after game starts (post-game)
    return {
      id: `between-${gameNum}`,
      type: 'between-games',
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 45),
      title: `🔄 Recovery Window (${Math.round(minutesBetween / 60)}h gap)`,
      priority: 'high',
      hydrationTarget: 600,
      recommendations: [
        {
          category: 'drink',
          item: 'Protein Shake + Carbs',
          amount: '300ml shake + banana',
          timing: 'Within 30 min of game end',
          reason: 'Critical recovery window - muscle repair starts now',
          icon: '🥛',
        },
        {
          category: 'drink',
          item: 'Electrolyte Water',
          amount: '500ml',
          timing: 'Sip continuously',
          reason: 'Replace all sweat losses before next game',
          icon: '💧',
        },
        {
          category: 'food',
          item: 'Light Meal',
          amount: '300-400 calories',
          timing: '60-90 min before next game',
          reason: 'Refuel glycogen stores without feeling heavy',
          icon: '🍚',
          alternatives: ['Rice + chicken', 'Pasta salad', 'PB&J sandwich', 'Smoothie bowl'],
        },
        {
          category: 'action',
          item: 'Legs Up / Light Stretch',
          timing: '10-15 min',
          reason: 'Promote blood flow and recovery',
          icon: '🦵',
        },
      ],
    };
  }

  private createQuickRecoveryWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45);
    return {
      id: `quick-${gameNum}`,
      type: 'between-games',
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 20),
      title: `⏱️ Quick Turnaround (Short gap!)`,
      priority: 'critical',
      hydrationTarget: 400,
      recommendations: [
        {
          category: 'drink',
          item: 'Sports Drink',
          amount: '300-400ml',
          timing: 'Immediately after game',
          reason: 'Fast carbs + electrolytes - no time for solid food',
          icon: '🥤',
        },
        {
          category: 'food',
          item: 'Energy Gel or Chews',
          amount: '1-2 servings',
          timing: '15 min before next game',
          reason: 'Quick energy without digestion burden',
          icon: '⚡',
        },
        {
          category: 'action',
          item: 'Stay Moving Lightly',
          reason: 'Don\'t sit down - keep blood flowing',
          icon: '🚶',
        },
      ],
    };
  }

  private createRefereeDutyWindow(
    currentGame: GameSchedule,
    nextGame: GameSchedule,
    gameNum: number
  ): NutritionWindow {
    const startTime = this.addMinutes(currentGame.time, 45);
    return {
      id: `referee-${gameNum}`,
      type: 'referee-duty',
      startTime,
      endTime: this.subtractMinutes(nextGame.time, 30),
      title: `🏁 Referee Duty Period`,
      priority: 'high',
      hydrationTarget: 500,
      recommendations: [
        {
          category: 'drink',
          item: 'Water + Electrolytes',
          amount: '500ml',
          timing: 'Sip throughout',
          reason: 'You\'re still active - stay hydrated',
          icon: '💧',
        },
        {
          category: 'food',
          item: 'Light Snacks Only',
          amount: '100-200 calories',
          reason: 'Avoid heavy food while on your feet',
          icon: '🍎',
          alternatives: ['Energy bar', 'Trail mix (small)', 'Rice cake'],
        },
        {
          category: 'action',
          item: 'Shade Breaks',
          reason: 'Conserve energy for your next game',
          icon: '🌴',
        },
      ],
    };
  }

  private createFinalRecoveryWindow(game: GameSchedule, gameNum: number): NutritionWindow {
    const startTime = this.addMinutes(game.time, 45);
    return {
      id: `final-recovery`,
      type: 'post-game',
      startTime,
      endTime: this.addMinutes(startTime, 120),
      title: `🏆 Post-Tournament Recovery`,
      priority: 'high',
      hydrationTarget: 750,
      recommendations: [
        {
          category: 'drink',
          item: 'Protein Shake',
          amount: '25-30g protein',
          timing: 'Within 30 min',
          reason: 'Critical for muscle repair after intense day',
          icon: '🥛',
        },
        {
          category: 'drink',
          item: 'Chocolate Milk',
          amount: '500ml',
          timing: 'Great alternative',
          reason: 'Perfect 3:1 carb-to-protein ratio for recovery',
          icon: '🥛',
          alternatives: ['Recovery shake', 'Smoothie with protein'],
        },
        {
          category: 'food',
          item: 'Full Meal',
          amount: '500-700 calories',
          timing: 'Within 2 hours',
          reason: 'Replenish all energy stores',
          icon: '🍽️',
          alternatives: ['Grilled chicken + rice + veggies', 'Salmon + sweet potato', 'Pasta with lean protein'],
        },
        {
          category: 'action',
          item: 'Foam Roll + Stretch',
          timing: '15-20 min',
          reason: 'Reduce next-day soreness significantly',
          icon: '🧘',
        },
        {
          category: 'supplement',
          item: 'Magnesium',
          amount: '200-400mg',
          timing: 'Before bed',
          reason: 'Muscle relaxation and sleep quality',
          icon: '💊',
        },
      ],
    };
  }

  // Time utility methods
  private subtractMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins - minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private getMinutesBetween(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  }

  isCurrentWindow(window: NutritionWindow): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= window.startTime && currentTime <= window.endTime;
  }

  logHydration(type: string, amount: number): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const log: HydrationLog = {
      time: timeStr,
      amount,
      type: type as HydrationLog['type'],
    };

    this.hydrationLogs.update(logs => [...logs, log]);
    this.selectedHydration = type;

    // Save to localStorage
    localStorage.setItem(
      'hydration_logs_' + new Date().toDateString(),
      JSON.stringify(this.hydrationLogs())
    );

    // Visual feedback
    setTimeout(() => {
      this.selectedHydration = null;
    }, 500);

    this.toastService.success(`+${amount}ml logged! 💧`);
  }

  completeWindow(window: NutritionWindow): void {
    this.nutritionWindows.update(windows =>
      windows.map(w =>
        w.id === window.id ? { ...w, completed: true } : w
      )
    );
    this.toastService.success('Window completed! Keep it up! 💪');
  }
}
