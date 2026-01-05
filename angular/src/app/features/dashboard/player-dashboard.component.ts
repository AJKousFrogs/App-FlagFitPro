/**
 * Player Dashboard Component
 *
 * The main overview page for athletes showing:
 * - Announcement banner (important team messages)
 * - Today's readiness and wellness status
 * - Weekly training progress
 * - Upcoming schedule highlights
 * - Quick access to key features
 * - AI Coach Merlin insights
 */

import { CommonModule, DecimalPipe } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { MessageModule } from "primeng/message";
import { ProgressBar } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { TimelineModule } from "primeng/timeline";
import { TooltipModule } from "primeng/tooltip";
import { of } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { TrainingStatsCalculationService } from "../../core/services/training-stats-calculation.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { AppLoadingComponent } from "../../shared/components/ui-components";
import { LINE_CHART_OPTIONS } from "../../shared/config/chart.config";

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  description: string;
}

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  duration: number;
  completed: boolean;
  icon?: string;
}

interface AnnouncementBanner {
  message: string | null;      // From backend
  coachName: string | null;    // From backend
  postedAt: Date | null;       // From backend
  priority: 'info' | 'important';
}

@Component({
  selector: "app-player-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DecimalPipe,
    CardModule,
    TagModule,
    ButtonComponent,
    ChartModule,
    TooltipModule,
    ProgressBar,
    MessageModule,
    TimelineModule,
    AppLoadingComponent,
    MainLayoutComponent,
    PageErrorStateComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      <app-loading
        [visible]="isLoading()"
        variant="skeleton"
        message="Loading your dashboard..."
      ></app-loading>

      <!-- Error State -->
      @if (hasError()) {
        <app-page-error-state
          title="Unable to load dashboard"
          [message]="errorMessage()"
          (retry)="loadData()"
        ></app-page-error-state>
      }

      <!-- Dashboard Content -->
      @if (!isLoading() && !hasError()) {
        <div class="player-dashboard section-stack">
          <!-- SECTION 1: Announcement Banner -->
          <!-- Only shows when message content exists (from backend) -->
          @if (announcement()?.message && !announcementDismissed()) {
            <section class="announcement-section">
              <p-message
                [severity]="announcement()?.priority === 'important' ? 'warn' : 'info'"
                [closable]="true"
                (onClose)="dismissAnnouncement()"
                styleClass="announcement-banner"
              >
                <div class="announcement-content">
                  <div class="announcement-text">
                    <i [class]="announcement()?.priority === 'important' ? 'pi pi-exclamation-triangle' : 'pi pi-megaphone'" class="announcement-icon"></i>
                    <span class="announcement-message">{{ announcement()?.message }}</span>
                  </div>
                  <span class="announcement-meta">
                    — {{ announcement()?.coachName }} · {{ getTimeAgo(announcement()?.postedAt) }}
                  </span>
                </div>
              </p-message>
            </section>
          }

          <!-- SECTION 2: Welcome Header with Merlin AI Insight -->
          <section class="welcome-section">
            <p-card styleClass="welcome-card">
              <div class="welcome-wrapper">
                <div class="merlin-avatar" aria-hidden="true">
                  <i class="pi pi-sparkles"></i>
                </div>
                <div class="welcome-content">
                  <h2 class="welcome-greeting">{{ greeting() }}, {{ userName() }}!</h2>
                  <p class="merlin-insight">{{ merlinInsight() }}</p>
                  <div class="welcome-actions">
                    <app-button
                      iconLeft="pi-play"
                      routerLink="/todays-practice"
                    >Start Training</app-button>
                    <app-button
                      iconLeft="pi-comments"
                      variant="text"
                      routerLink="/chat"
                    >Ask Merlin</app-button>
                  </div>
                </div>
              </div>
            </p-card>
          </section>

          <!-- SECTION 3: Key Stats Overview (4 Cards) -->
          <section class="stats-overview" aria-label="Key statistics">
            <!-- Readiness Card -->
            <p-card styleClass="stat-card stat-readiness" [style]="{ cursor: 'pointer' }">
              <div class="stat-card-content">
                <div class="stat-icon readiness-icon">
                  <i class="pi pi-heart"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ readinessScore() }}%</span>
                  <span class="stat-label">Readiness</span>
                </div>
                <p-tag
                  [value]="getReadinessStatus()"
                  [severity]="getReadinessSeverity()"
                  styleClass="stat-tag"
                ></p-tag>
              </div>
            </p-card>

            <!-- ACWR Card -->
            <p-card styleClass="stat-card stat-acwr" [style]="{ cursor: 'pointer' }">
              <div class="stat-card-content">
                <div class="stat-icon acwr-icon">
                  <i class="pi pi-chart-line"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ acwr() | number: '1.2-2' }}</span>
                  <span class="stat-label">ACWR</span>
                </div>
                <p-tag
                  [value]="getAcwrStatus()"
                  [severity]="getAcwrSeverity()"
                  styleClass="stat-tag"
                ></p-tag>
              </div>
            </p-card>

            <!-- Streak Card -->
            <p-card styleClass="stat-card stat-streak" [style]="{ cursor: 'pointer' }">
              <div class="stat-card-content">
                <div class="stat-icon streak-icon">
                  <i class="pi pi-bolt"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ currentStreak() }}</span>
                  <span class="stat-label">Day Streak</span>
                </div>
              </div>
            </p-card>

            <!-- Weekly Sessions Card -->
            <p-card styleClass="stat-card stat-sessions" [style]="{ cursor: 'pointer' }">
              <div class="stat-card-content">
                <div class="stat-icon sessions-icon">
                  <i class="pi pi-calendar-plus"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ weeklySessionsCompleted() }}/{{ weeklySessionsPlanned() }}</span>
                  <span class="stat-label">This Week</span>
                </div>
              </div>
            </p-card>
          </section>

          <!-- Main Content Grid -->
          <div class="dashboard-grid">
            <!-- SECTION 4: Weekly Progress -->
            <p-card styleClass="progress-card">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-chart-bar card-header-icon"></i>
                  <span class="card-header-title">Weekly Progress</span>
                </div>
              </ng-template>
              <div class="week-progress">
                @for (day of weekDays(); track day.name) {
                  <div class="day-column">
                    <div
                      class="day-indicator"
                      [class.completed]="day.completed"
                      [class.today]="day.isToday"
                      [class.future]="day.isFuture"
                      [attr.aria-label]="day.name + (day.completed ? ', completed' : day.isToday ? ', today' : '')"
                    >
                      @if (day.completed) {
                        <i class="pi pi-check"></i>
                      } @else if (day.isToday) {
                        <i class="pi pi-circle"></i>
                      }
                    </div>
                    <span class="day-name">{{ day.short }}</span>
                  </div>
                }
              </div>
              <div class="progress-summary">
                <p-progressBar
                  [value]="weeklyProgress()"
                  [showValue]="false"
                  styleClass="custom-progress"
                ></p-progressBar>
                <span class="progress-text">{{ weeklyProgress() }}% completed</span>
              </div>
            </p-card>

            <!-- SECTION 5: Today's Schedule Preview (using p-timeline) -->
            <p-card styleClass="schedule-card">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-clock card-header-icon"></i>
                  <span class="card-header-title">Today's Schedule</span>
                </div>
              </ng-template>
              @if (todaySchedule().length > 0) {
                <p-timeline [value]="todaySchedule().slice(0, 3)" styleClass="schedule-timeline">
                  <ng-template pTemplate="marker" let-item>
                    <span
                      class="timeline-marker"
                      [class.completed]="item.completed"
                      [attr.aria-hidden]="true"
                    >
                      @if (item.completed) {
                        <i class="pi pi-check"></i>
                      } @else {
                        <i class="pi pi-circle"></i>
                      }
                    </span>
                  </ng-template>
                  <ng-template pTemplate="content" let-item>
                    <div class="schedule-item" [class.completed]="item.completed">
                      <div class="item-time">{{ item.time }}</div>
                      <div class="item-info">
                        <span class="item-title">{{ item.title }}</span>
                        <span class="item-duration">{{ item.duration }} min</span>
                      </div>
                    </div>
                  </ng-template>
                </p-timeline>
                @if (todaySchedule().length > 3) {
                  <p class="more-items">+{{ todaySchedule().length - 3 }} more items</p>
                }
                <div class="card-footer-action">
                  <app-button
                    variant="text"
                    iconRight="pi-arrow-right"
                    routerLink="/todays-practice"
                  >View Full Day</app-button>
                </div>
              } @else {
                <div class="empty-schedule">
                  <p-message severity="info" styleClass="empty-message">
                    <div class="empty-content">
                      <i class="pi pi-calendar empty-icon"></i>
                      <span>No training scheduled for today</span>
                    </div>
                  </p-message>
                  <app-button
                    variant="text"
                    routerLink="/training"
                  >View Full Schedule</app-button>
                </div>
              }
            </p-card>

            <!-- SECTION 6: Quick Actions Grid -->
            <p-card styleClass="actions-card">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-bolt card-header-icon"></i>
                  <span class="card-header-title">Quick Actions</span>
                </div>
              </ng-template>
              <div class="quick-actions-grid">
                @for (action of quickActions; track action.route) {
                  <app-button
                    variant="outlined"
                    [iconLeft]="action.icon"
                    [routerLink]="action.route"
                    [tooltip]="action.description"
                    [ariaLabel]="action.description"
                  >{{ action.label }}</app-button>
                }
              </div>
            </p-card>

            <!-- SECTION 7: Performance Trend -->
            <p-card styleClass="trend-card">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-trending-up card-header-icon"></i>
                  <span class="card-header-title">Performance Trend</span>
                </div>
              </ng-template>
              @if (performanceChartData()) {
                <div class="chart-container">
                  <p-chart
                    type="line"
                    [data]="performanceChartData()"
                    [options]="chartOptions"
                    [style]="{ height: '180px' }"
                  ></p-chart>
                </div>
                <div class="card-footer-action">
                  <app-button
                    variant="text"
                    iconRight="pi-arrow-right"
                    routerLink="/analytics"
                  >View Detailed Analytics</app-button>
                </div>
              } @else {
                <div class="empty-chart">
                  <p-message severity="info" styleClass="empty-message">
                    <div class="empty-content">
                      <i class="pi pi-chart-line empty-icon"></i>
                      <span>Complete more sessions to see your trend</span>
                    </div>
                  </p-message>
                </div>
              }
            </p-card>
          </div>

          <!-- SECTION 8: Upcoming Events -->
          @if (upcomingEvents().length > 0) {
            <section class="upcoming-section" aria-label="Upcoming events">
              <h3 class="section-title">
                <i class="pi pi-calendar" aria-hidden="true"></i>
                Coming Up
              </h3>
              <div class="events-strip">
                @for (event of upcomingEvents().slice(0, 4); track event.id) {
                  <p-card styleClass="event-card" [ngClass]="'event-' + event.type">
                    <div class="event-card-content">
                      <div class="event-date">
                        <span class="date-day">{{ event.day }}</span>
                        <span class="date-month">{{ event.month }}</span>
                      </div>
                      <div class="event-info">
                        <span class="event-title">{{ event.title }}</span>
                        <p-tag
                          [value]="event.typeLabel"
                          [severity]="getEventSeverity(event.type)"
                          styleClass="event-type-tag"
                        ></p-tag>
                      </div>
                    </div>
                  </p-card>
                }
              </div>
            </section>
          }
        </div>
      }
    </app-main-layout>
  `,
  styles: [`
    /**
     * Player Dashboard Styles
     * =======================
     * Design System Compliant - All tokens from design-system-tokens.scss
     * PrimeNG overrides moved to primeng/_brand-overrides.scss
     * 
     * NOTE: ::ng-deep and !important removed per DESIGN_SYSTEM_RULES.md
     * PrimeNG component styling is handled globally via styleClass bindings
     */

    /* ==========================================
       BASE LAYOUT - 8-point grid spacing
       ========================================== */
    .player-dashboard {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-5) var(--space-4);
      max-width: var(--container-max);
      margin: 0 auto;
    }

    /* ==========================================
       SECTION 1: Announcement Banner
       ========================================== */
    .announcement-section {
      margin-bottom: 0;
    }

    .announcement-content {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      flex-wrap: wrap;
    }

    .announcement-text {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
    }

    .announcement-icon {
      font-size: var(--font-body-size);
      flex-shrink: 0;
      opacity: 0.9;
    }

    .announcement-message {
      font-weight: var(--font-weight-medium);
      font-size: var(--font-body-sm-size);
    }

    .announcement-meta {
      font-size: var(--font-caption-size);
      opacity: 0.65;
      margin-left: 0;
      white-space: nowrap;
    }

    /* ==========================================
       SECTION 2: Welcome Section
       ========================================== */
    .welcome-section {
      margin-bottom: 0;
    }

    .welcome-wrapper {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
    }

    .merlin-avatar {
      width: var(--space-12);
      height: var(--space-12);
      min-width: var(--space-12);
      border-radius: var(--radius-full);
      background: var(--color-brand-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-h2-size);
      color: var(--color-text-on-primary);
      flex-shrink: 0;
    }

    .welcome-content {
      flex: 1;
      min-width: 0;
    }

    .welcome-greeting {
      margin: 0 0 var(--space-1);
      font-size: var(--font-h1-size);
      font-weight: var(--font-h1-weight);
      color: var(--color-text-primary);
      line-height: var(--font-h1-line-height);
    }

    .merlin-insight {
      margin: 0 0 var(--space-3);
      color: var(--color-text-muted);
      font-size: var(--font-body-sm-size);
      line-height: var(--font-body-sm-line-height);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .welcome-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      align-items: center;
    }

    /* ==========================================
       SECTION 3: Stats Overview - 4-column grid
       ========================================== */
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-3);
    }

    .stat-card-content {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .stat-icon {
      width: var(--space-10);
      height: var(--space-10);
      min-width: var(--space-10);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-body-size);
    }

    .readiness-icon {
      background: var(--color-status-error-subtle);
      color: var(--primitive-error-500);
    }

    .acwr-icon {
      background: var(--color-status-info-subtle);
      color: var(--color-status-info);
    }

    .streak-icon {
      background: var(--color-status-warning-subtle);
      color: var(--primitive-success-500);
    }

    .sessions-icon {
      background: var(--ds-primary-green-ultra-subtle);
      color: var(--color-brand-primary);
    }

    .stat-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      gap: var(--space-1);
    }

    .stat-value {
      font-size: var(--font-size-metric-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .stat-label {
      font-size: var(--font-caption-size);
      font-weight: var(--font-caption-weight);
      color: var(--color-text-muted);
      line-height: var(--font-caption-line-height);
      letter-spacing: var(--letter-spacing-caption);
      text-transform: uppercase;
    }

    /* ==========================================
       SECTION 4-7: Dashboard Grid
       ========================================== */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-5);
    }

    .card-header-custom {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4) var(--space-2);
    }

    .card-header-icon {
      font-size: var(--font-body-size);
      color: var(--color-brand-primary);
      opacity: 0.85;
    }

    .card-header-title {
      font-size: var(--font-h3-size);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: var(--font-h3-line-height);
      margin-bottom: var(--space-3);
    }

    /* ==========================================
       Weekly Progress
       ========================================== */
    .week-progress {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    }

    .day-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
    }

    .day-indicator {
      width: var(--space-8);
      height: var(--space-8);
      min-width: var(--space-8);
      min-height: var(--space-8);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-caption-size);
      background: var(--surface-tertiary);
      color: var(--color-text-muted);
      border: 2px solid transparent;
      transition: 
        background-color var(--motion-fast) var(--ease-standard),
        border-color var(--motion-fast) var(--ease-standard);
    }

    .day-indicator.completed {
      background: var(--color-brand-primary);
      color: var(--color-text-on-primary);
    }

    .day-indicator.today {
      border-color: var(--color-brand-primary);
      color: var(--color-brand-primary);
      background: var(--ds-primary-green-ultra-subtle);
    }

    .day-indicator.future {
      opacity: 0.4;
    }

    .day-name {
      font-size: var(--font-caption-size);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      font-weight: var(--font-weight-medium);
      opacity: 0.75;
    }

    .progress-summary {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .progress-text {
      font-size: var(--font-caption-size);
      color: var(--color-text-secondary);
      text-align: center;
      opacity: 0.75;
    }

    /* ==========================================
       Schedule Timeline
       ========================================== */
    .timeline-marker {
      width: var(--space-6);
      height: var(--space-6);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-tertiary);
      color: var(--color-text-muted);
      font-size: var(--font-caption-size);
    }

    .timeline-marker.completed {
      background: var(--color-brand-primary);
      color: var(--color-text-on-primary);
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) 0;
    }

    .schedule-item.completed {
      opacity: 0.55;
    }

    .item-time {
      font-size: var(--font-caption-size);
      font-weight: var(--font-weight-semibold);
      color: var(--color-brand-primary);
      min-width: var(--touch-target-min);
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .item-title {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      font-size: var(--font-body-sm-size);
      line-height: 1.3;
    }

    .item-duration {
      font-size: var(--font-caption-size);
      color: var(--color-text-secondary);
      opacity: 0.7;
    }

    .more-items {
      font-size: var(--font-caption-size);
      color: var(--color-text-muted);
      text-align: center;
      margin: var(--space-1) 0;
      opacity: 0.7;
    }

    .card-footer-action {
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: var(--border-1) solid var(--color-border-secondary);
      text-align: center;
    }

    .empty-schedule,
    .empty-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
    }

    .empty-content {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-body-sm-size);
    }

    .empty-icon {
      font-size: var(--font-body-size);
      opacity: 0.7;
    }

    /* ==========================================
       Quick Actions Grid
       ========================================== */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
    }

    .quick-actions-grid app-button {
      display: block;
      width: 100%;
    }

    /* ==========================================
       Performance Chart
       ========================================== */
    .chart-container {
      height: 160px;
    }

    /* ==========================================
       SECTION 8: Upcoming Events
       ========================================== */
    .upcoming-section {
      margin-top: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
      font-size: var(--font-body-size);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .section-title i {
      opacity: 0.7;
    }

    .events-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-3);
    }

    .event-card-content {
      display: flex;
      gap: var(--space-2);
      align-items: flex-start;
    }

    .event-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: var(--icon-container-sm);
    }

    .date-day {
      font-size: var(--font-h3-size);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: 1;
    }

    .date-month {
      font-size: var(--font-compact-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .event-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex: 1;
      min-width: 0;
    }

    .event-title {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      font-size: var(--font-body-sm-size);
      line-height: 1.3;
    }

    /* ==========================================
       Responsive Styles
       ========================================== */
    @media (max-width: 1024px) {
      .stats-overview {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .events-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .player-dashboard {
        padding: var(--space-3);
        gap: var(--space-5);
      }

      .stats-overview {
        grid-template-columns: 1fr;
        gap: var(--space-2);
      }

      .welcome-wrapper {
        flex-direction: column;
        text-align: center;
      }

      .merlin-avatar {
        margin: 0 auto;
      }

      .welcome-actions {
        justify-content: center;
      }

      .quick-actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .events-strip {
        grid-template-columns: 1fr;
      }

      .announcement-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .announcement-meta {
        margin-left: var(--space-5);
      }
    }
  `],
})
export class PlayerDashboardComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly headerService = inject(HeaderService);
  private readonly trainingStatsService = inject(TrainingStatsCalculationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  // Loading state
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal("Failed to load dashboard. Please try again.");

  // User info
  userName = signal("Athlete");

  // Announcement
  announcement = signal<AnnouncementBanner | null>(null);
  announcementDismissed = signal(false);

  // Stats
  readinessScore = signal(0);
  acwr = signal(0);
  currentStreak = signal(0);
  weeklySessionsCompleted = signal(0);
  weeklySessionsPlanned = signal(7);

  // Week days
  weekDays = signal<Array<{
    name: string;
    short: string;
    completed: boolean;
    isToday: boolean;
    isFuture: boolean;
  }>>([]);

  // Schedule
  todaySchedule = signal<ScheduleItem[]>([]);

  // Events
  upcomingEvents = signal<Array<{
    id: string;
    day: string;
    month: string;
    title: string;
    type: string;
    typeLabel: string;
  }>>([]);

  // Performance chart
  performanceChartData = signal<any>(null);

  // Quick actions (order preserved from wireframe)
  quickActions: QuickAction[] = [
    { label: "Log Training", icon: "pi pi-plus", route: "/training/log", description: "Log a new training session" },
    { label: "Videos", icon: "pi pi-video", route: "/training/videos", description: "Watch training videos" },
    { label: "Wellness", icon: "pi pi-heart", route: "/wellness", description: "Check your wellness" },
    { label: "Schedule", icon: "pi pi-calendar", route: "/training", description: "View full schedule" },
    { label: "Analytics", icon: "pi pi-chart-bar", route: "/analytics", description: "Performance analytics" },
    { label: "AI Coach", icon: "pi pi-sparkles", route: "/chat", description: "Talk to Merlin" },
  ];

  chartOptions = {
    ...LINE_CHART_OPTIONS,
    plugins: {
      ...LINE_CHART_OPTIONS.plugins,
      legend: { display: false },
    },
    scales: {
      y: { display: false },
      x: { display: false },
    },
  };

  // Computed
  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  });

  merlinInsight = computed(() => {
    const readiness = this.readinessScore();
    const acwrVal = this.acwr();

    if (readiness < 50) {
      return "Your readiness is low today. Consider a lighter session focused on recovery and mobility.";
    }
    if (acwrVal > 1.3) {
      return "Your training load is elevated. Take it easy today to avoid overtraining and reduce injury risk.";
    }
    if (readiness >= 80 && acwrVal <= 1.0) {
      return "You're in great shape! Today is perfect for a high-intensity session. Let's push it!";
    }
    return "Solid day ahead! Stick to your plan and focus on quality over quantity in today's session.";
  });

  weeklyProgress = computed(() => {
    const completed = this.weeklySessionsCompleted();
    const planned = this.weeklySessionsPlanned();
    return planned > 0 ? Math.round((completed / planned) * 100) : 0;
  });

  constructor() {
    this.headerService.setDashboardHeader();
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Load user info
    const user = this.authService.getUser();
    if (user?.name) {
      this.userName.set(user.name.split(" ")[0]);
    }

    // Initialize week days
    this.initializeWeekDays();

    // TODO: Replace with real API call when backend is ready
    // this.announcementService.getLatestAnnouncement().subscribe(announcement => this.announcement.set(announcement));
    // For now, set structure with null values - will be populated from backend
    this.announcement.set({
      message: null,      // From backend: e.g., "Practice tomorrow moved to 6PM due to field availability."
      coachName: null,    // From backend: e.g., "Coach Smith"
      postedAt: null,     // From backend: e.g., new Date()
      priority: 'info',   // From backend: 'info' | 'important'
    });

    // Load training stats
    this.trainingStatsService
      .getTrainingStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.logger.error("Failed to load training stats:", error);
          return of(null);
        })
      )
      .subscribe((stats) => {
        // Use stats if available, otherwise use defaults
        // TrainingStatsData uses weeklySessions, not weeklyCompleted
        const acwrValue = stats?.acwr ?? 0.85;
        this.readinessScore.set(75); // Readiness comes from wellness service, not training stats
        this.acwr.set(typeof acwrValue === 'number' ? acwrValue : 0.85);
        this.currentStreak.set(stats?.currentStreak ?? 0);
        this.weeklySessionsCompleted.set(stats?.weeklySessions ?? 0);

        // TODO: Load performance chart data from backend service
        // The chart data (weeklyData with label/value) will come from the API
        // this.performanceService.getWeeklyTrend().subscribe(...)
        // For now, performanceChartData remains null (shows empty state)

        // TODO: Load today's schedule from backend service
        // The schedule data (time, title, duration, completed) will come from the API
        // this.scheduleService.getTodaySchedule().subscribe(...)
        // For now, todaySchedule remains empty (shows empty state)

        // TODO: Load upcoming events from backend service
        // The events data (day, month, title, type, typeLabel) will come from the API
        // this.eventsService.getUpcomingEvents().subscribe(...)
        // For now, upcomingEvents remains empty (section hidden)

        this.isLoading.set(false);
      });
  }

  private initializeWeekDays(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const weekDays = days.map((short, index) => ({
      name: fullDays[index],
      short,
      completed: index < dayOfWeek,
      isToday: index === dayOfWeek,
      isFuture: index > dayOfWeek,
    }));

    this.weekDays.set(weekDays);
  }

  dismissAnnouncement(): void {
    this.announcementDismissed.set(true);
  }

  getTimeAgo(date: Date | null | undefined): string {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  getReadinessStatus(): string {
    const score = this.readinessScore();
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Moderate';
    return 'Low';
  }

  getReadinessSeverity(): "success" | "warn" | "danger" | "info" | "secondary" | "contrast" {
    const score = this.readinessScore();
    if (score >= 70) return 'success';
    if (score >= 50) return 'warn';
    return 'danger';
  }

  getAcwrStatus(): string {
    const value = this.acwr();
    if (value <= 1.0) return 'Optimal';
    if (value <= 1.3) return 'Elevated';
    return 'High';
  }

  getAcwrSeverity(): "success" | "warn" | "danger" | "info" | "secondary" | "contrast" {
    const value = this.acwr();
    if (value <= 1.0) return 'success';
    if (value <= 1.3) return 'warn';
    return 'danger';
  }

  getEventSeverity(type: string): "success" | "warn" | "danger" | "info" | "secondary" | "contrast" {
    switch (type) {
      case 'game':
        return 'danger';
      case 'tournament':
        return 'warn';
      default:
        return 'success';
    }
  }
}
