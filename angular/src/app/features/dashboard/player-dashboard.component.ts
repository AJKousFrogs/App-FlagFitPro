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
    /* ==========================================
       BASE LAYOUT - Improved spacing & rhythm
       ========================================== */
    .player-dashboard {
      display: flex;
      flex-direction: column;
      gap: var(--space-6); /* 24px between major sections */
      padding: var(--space-5) var(--space-4);
      max-width: 1400px; /* Standard container width - matches page-container--wide pattern */
      margin: 0 auto;
    }

    /* ==========================================
       SECTION 1: Announcement Banner - Compact
       ========================================== */
    .announcement-section {
      margin-bottom: 0;
    }

    :host ::ng-deep .announcement-banner {
      border-radius: var(--radius-lg);
    }

    :host ::ng-deep .announcement-banner .p-message-content {
      width: 100%;
      padding: var(--space-3) var(--space-4); /* Reduced padding */
    }

    :host ::ng-deep .announcement-banner .p-message-close-button {
      align-self: center; /* Vertically center dismiss icon */
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
      font-size: var(--font-body-md); /* Use design token */
      flex-shrink: 0;
      opacity: 0.9;
    }

    .announcement-message {
      font-weight: var(--font-weight-medium);
      font-size: var(--font-body-sm);
    }

    .announcement-meta {
      font-size: var(--font-body-xs); /* Smaller timestamp */
      opacity: 0.65; /* Reduced opacity for visual calm */
      margin-left: 0;
      white-space: nowrap;
    }

    /* ==========================================
       SECTION 2: Welcome Section - Softer gradient
       ========================================== */
    .welcome-section {
      margin-bottom: 0;
    }

    :host ::ng-deep .welcome-card {
      background: linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface-primary) 50%); /* Softer gradient */
      border: 1px solid var(--color-border-secondary);
      border-radius: var(--radius-lg); /* Consistent radius */
      box-shadow: var(--shadow-sm); /* Consistent shadow */
    }

    :host ::ng-deep .welcome-card .p-card-body {
      padding: var(--space-4); /* 16px internal padding */
    }

    :host ::ng-deep .welcome-card .p-card-content {
      padding: 0;
    }

    .welcome-wrapper {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
    }

    .merlin-avatar {
      width: var(--space-12); /* 48px - Use design token */
      height: var(--space-12);
      min-width: var(--space-12);
      border-radius: 50%;
      background: var(--color-brand-primary); /* Solid color, less gradient */
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-heading-md); /* Use design token */
      color: var(--color-text-on-primary);
      flex-shrink: 0;
    }

    .welcome-content {
      flex: 1;
      min-width: 0;
    }

    .welcome-greeting {
      margin: 0 0 var(--space-1);
      font-size: var(--font-size-h1); /* H1: Page greeting - 28px */
      font-weight: var(--font-weight-semibold); /* H1: Semibold (600) - reduced from 700 */
      color: var(--color-text-primary);
      line-height: var(--line-height-tight); /* H1: 1.2 */
    }

    .merlin-insight {
      margin: 0 0 var(--space-3);
      color: var(--color-text-muted); /* Muted color for informational text */
      font-size: var(--font-body-sm);
      line-height: var(--line-height-base);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .welcome-actions {
      display: flex;
      gap: var(--space-2); /* Tighter gap */
      flex-wrap: wrap;
      align-items: center;
    }

    :host ::ng-deep .start-training-btn {
      /* Primary CTA - default styling */
    }

    /* Ask Merlin button - ensure always visible */
    :host ::ng-deep .welcome-actions .p-button.p-button-text,
    :host ::ng-deep .welcome-actions a[routerlink="/chat"],
    :host ::ng-deep .welcome-actions .p-button[routerlink="/chat"] {
      opacity: 1 !important;
      padding: var(--space-2) var(--space-4) !important;
      color: var(--ds-primary-green) !important;
    }

    :host ::ng-deep .welcome-actions .p-button.p-button-text .p-button-label,
    :host ::ng-deep .welcome-actions .p-button.p-button-text .p-button-icon,
    :host ::ng-deep .welcome-actions a[routerlink="/chat"] .p-button-label,
    :host ::ng-deep .welcome-actions a[routerlink="/chat"] .p-button-icon,
    :host ::ng-deep .welcome-actions a[routerlink="/chat"] span,
    :host ::ng-deep .welcome-actions a[routerlink="/chat"] i {
      color: var(--ds-primary-green) !important;
      opacity: 1 !important;
    }

    /* ==========================================
       SECTION 3: Stats Overview - Tighter layout
       ========================================== */
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-3); /* Tighter gap */
    }

    :host ::ng-deep .stat-card {
      border-radius: var(--radius-lg); /* Consistent radius */
      box-shadow: var(--shadow-sm); /* Consistent shadow */
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    :host ::ng-deep .stat-card:hover {
      transform: translateY(-1px); /* Subtler lift */
      box-shadow: var(--shadow-md);
    }

    :host ::ng-deep .stat-card .p-card-body {
      padding: var(--space-3); /* Reduced padding */
    }

    :host ::ng-deep .stat-card .p-card-content {
      padding: 0;
    }

    .stat-card-content {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .stat-icon {
      width: var(--space-10); /* 40px - Use design token */
      height: var(--space-10);
      min-width: var(--space-10);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-body-md); /* Use design token */
    }

    .readiness-icon {
      background: var(--color-status-error-subtle); /* Use design token */
      color: var(--primitive-error-500);
    }

    .acwr-icon {
      background: var(--color-status-info-subtle); /* Use design token */
      color: var(--color-status-info);
    }

    .streak-icon {
      background: var(--color-status-warning-subtle); /* Use design token */
      color: var(--primitive-success-500);
    }

    .sessions-icon {
      background: rgba(8, 153, 73, 0.08);
      color: var(--color-brand-primary);
    }

    .stat-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      gap: var(--space-1); /* Use design token */
    }

    .stat-value {
      font-size: var(--font-size-metric-md); /* Metric: KPI numbers - 24px */
      font-weight: var(--font-weight-bold); /* Metric: Bold (700) */
      color: var(--color-text-primary);
      line-height: var(--line-height-tight); /* Metric: 1.2 */
    }

    .stat-label {
      font-size: var(--font-size-caption); /* Caption: Helper text - 13px */
      font-weight: var(--font-weight-regular); /* Caption: Regular (400) */
      color: var(--color-text-muted);
      line-height: var(--line-height-base); /* Caption: 1.5 */
      letter-spacing: var(--letter-spacing-caption); /* 0.04em for labels like READINESS, ACWR */
      text-transform: uppercase;
    }

    :host ::ng-deep .stat-tag {
      font-size: var(--font-body-xs); /* Use design token */
      padding: var(--space-1) var(--space-2);
      line-height: 1.2;
    }

    /* ==========================================
       SECTION 4-7: Dashboard Grid - Consistent cards
       ========================================== */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-5); /* 20px gap */
    }

    /* Unified card styling */
    :host ::ng-deep .progress-card,
    :host ::ng-deep .schedule-card,
    :host ::ng-deep .actions-card,
    :host ::ng-deep .trend-card {
      border-radius: var(--radius-lg); /* Consistent radius */
      box-shadow: var(--shadow-sm); /* Consistent shadow */
    }

    .card-header-custom {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4) var(--space-2); /* Tighter header */
    }

    .card-header-icon {
      font-size: var(--font-body-md); /* Use design token */
      color: var(--color-brand-primary);
      opacity: 0.85;
    }

    .card-header-title {
      font-size: var(--font-size-h2); /* H2: Card titles - 18px */
      font-weight: var(--font-weight-semibold); /* H2: Semibold (600) */
      color: var(--color-text-primary);
      line-height: var(--line-height-tight); /* H2: 1.2 */
      margin-bottom: var(--space-3); /* 12px consistent margin */
    }

    :host ::ng-deep .progress-card .p-card-header,
    :host ::ng-deep .schedule-card .p-card-header,
    :host ::ng-deep .actions-card .p-card-header,
    :host ::ng-deep .trend-card .p-card-header {
      padding: 0;
    }

    :host ::ng-deep .progress-card .p-card-body,
    :host ::ng-deep .schedule-card .p-card-body,
    :host ::ng-deep .actions-card .p-card-body,
    :host ::ng-deep .trend-card .p-card-body {
      padding: var(--space-4); /* 16px internal padding */
    }

    :host ::ng-deep .progress-card .p-card-content,
    :host ::ng-deep .schedule-card .p-card-content,
    :host ::ng-deep .actions-card .p-card-content,
    :host ::ng-deep .trend-card .p-card-content {
      padding: 0;
    }

    /* ==========================================
       Weekly Progress - Tighter spacing
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
      gap: var(--space-1); /* Tighter */
    }

    .day-indicator {
      width: var(--space-8); /* 32px - Use design token */
      height: var(--space-8);
      min-width: var(--space-8);
      min-height: var(--space-8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-body-xs); /* Use design token */
      background: var(--surface-tertiary);
      color: var(--color-text-muted);
      border: var(--space-1) solid transparent; /* Use design token */
      transition: all 0.15s ease;
    }

    .day-indicator.completed {
      background: var(--color-brand-primary);
      color: white;
    }

    .day-indicator.today {
      border-color: var(--color-brand-primary);
      color: var(--color-brand-primary);
      background: var(--ds-primary-green-ultra-subtle); /* Softer background */
    }

    .day-indicator.future {
      opacity: 0.4; /* More muted */
    }

    .day-name {
      font-size: var(--font-body-xs); /* Use design token */
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

    :host ::ng-deep .custom-progress {
      height: var(--space-1); /* Use design token */
      border-radius: var(--radius-full);
    }

    :host ::ng-deep .custom-progress .p-progressbar-value {
      background: var(--color-brand-primary);
      border-radius: var(--radius-full);
    }

    .progress-text {
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
      text-align: center;
      opacity: 0.75;
    }

    /* ==========================================
       Schedule Timeline - Tighter list items
       ========================================== */
    :host ::ng-deep .schedule-timeline {
      margin-bottom: var(--space-2);
    }

    :host ::ng-deep .schedule-timeline .p-timeline-event-opposite {
      display: none;
    }

    :host ::ng-deep .schedule-timeline .p-timeline-event-content {
      padding-left: var(--space-2);
    }

    :host ::ng-deep .schedule-timeline .p-timeline-event {
      min-height: auto;
    }

    :host ::ng-deep .schedule-timeline .p-timeline-event-separator {
      flex: 0;
    }

    .timeline-marker {
      width: var(--space-6); /* 24px - Use design token */
      height: var(--space-6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-tertiary);
      color: var(--color-text-muted);
      font-size: var(--font-body-xs); /* Use design token */
    }

    .timeline-marker.completed {
      background: var(--color-brand-primary);
      color: white;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) 0; /* Reduced vertical padding */
    }

    .schedule-item.completed {
      opacity: 0.55;
    }

    .item-time {
      font-size: var(--font-body-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-brand-primary);
      min-width: calc(var(--space-10) + var(--space-1)); /* 44px - Touch target standard */
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
      font-size: var(--font-body-sm);
      line-height: 1.3;
    }

    .item-duration {
      font-size: var(--font-body-xs); /* Use design token */
      color: var(--color-text-secondary);
      opacity: 0.7;
    }

    .more-items {
      font-size: var(--font-body-xs);
      color: var(--color-text-muted);
      text-align: center;
      margin: var(--space-1) 0;
      opacity: 0.7;
    }

    .card-footer-action {
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--color-border-secondary);
      text-align: center;
    }

    :host ::ng-deep .footer-link-btn {
      width: 100%;
      justify-content: center;
      font-size: var(--font-body-sm);
      padding: var(--space-2) !important; /* Use design token */
    }

    .empty-schedule,
    .empty-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
    }

    :host ::ng-deep .empty-message {
      width: 100%;
    }

    .empty-content {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-body-sm);
    }

    .empty-icon {
      font-size: var(--font-body-md); /* Use design token */
      opacity: 0.7;
    }

    /* ==========================================
       Quick Actions Grid - Equal sizing
       ========================================== */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
    }

    /* Make app-button stretch to fill grid cell */
    .quick-actions-grid app-button {
      display: block;
      width: 100%;
    }

    /* Make the inner button fill the host */
    :host ::ng-deep .quick-actions-grid .btn {
      width: 100%;
    }

    /* ==========================================
       Performance Chart
       ========================================== */
    .chart-container {
      height: calc(var(--space-8) * 5); /* 160px - Use design tokens (32px * 5) */
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
      font-size: var(--font-body-md);
      font-weight: var(--font-weight-medium); /* Not too heavy */
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

    :host ::ng-deep .event-card {
      border-radius: var(--radius-lg);
      border-left: var(--space-1) solid var(--color-brand-primary); /* Use design token */
      box-shadow: var(--shadow-sm);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    :host ::ng-deep .event-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    :host ::ng-deep .event-card.event-game {
      border-left-color: var(--primitive-error-500);
    }

    :host ::ng-deep .event-card.event-tournament {
      border-left-color: var(--primitive-warning-500);
    }

    :host ::ng-deep .event-card .p-card-body {
      padding: var(--space-3);
    }

    :host ::ng-deep .event-card .p-card-content {
      padding: 0;
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
      min-width: calc(var(--space-4) + var(--space-1)); /* 36px - Use design tokens */
    }

    .date-day {
      font-size: var(--font-heading-sm);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: 1;
    }

    .date-month {
      font-size: var(--font-body-2xs); /* 10px - micro label */
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
      font-size: var(--font-body-sm);
      line-height: 1.3;
    }

    :host ::ng-deep .event-type-tag {
      font-size: var(--font-body-xs); /* Use design token */
      padding: var(--space-1) var(--space-2);
      line-height: 1.2;
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
