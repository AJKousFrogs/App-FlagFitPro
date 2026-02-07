/**
 * Player Dashboard Component
 *
 * ⭐ CANONICAL PAGE — Design System Exemplar
 * ==========================================
 * This page is FROZEN as a design system exemplar.
 *
 * RULES:
 * - Future refactors copy FROM this page, never INTO it
 * - Changes require design system curator approval
 * - This page demonstrates correct design system usage
 *
 * See docs/CANONICAL_PAGES.md for full documentation.
 *
 * The main overview page for athletes showing:
 * - Announcement banner (important team messages)
 * - Today's readiness and wellness status
 * - Weekly training progress
 * - Upcoming schedule highlights
 * - Quick access to key features
 * - Merlin AI Merlin insights
 */

import { CommonModule, DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterModule } from "@angular/router";
import { Card } from "primeng/card";
import { Message } from "primeng/message";
import { ProgressBar } from "primeng/progressbar";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Timeline } from "primeng/timeline";
import { Tooltip } from "primeng/tooltip";
import { of } from "rxjs";
import { catchError } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { TrainingStatsCalculationService } from "../../core/services/training-stats-calculation.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { WellnessService } from "../../core/services/wellness.service";
import { ChannelService } from "../../core/services/channel.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { DataConfidenceService } from "../../core/services/data-confidence.service";
import { ContinuityIndicatorsService } from "../../core/services/continuity-indicators.service";
import { AcwrSpikeDetectionService } from "../../core/services/acwr-spike-detection.service";
import {
  PrivacySettingsService,
  METRIC_CATEGORIES,
} from "../../core/services/privacy-settings.service";
import { ConfidenceIndicatorComponent } from "../../shared/components/confidence-indicator/confidence-indicator.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { LINE_CHART_OPTIONS } from "../../shared/config/chart.config";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { ChartSkeletonComponent } from "../../shared/components/chart-skeleton/chart-skeleton.component";
import { DashboardSkeletonComponent } from "../../shared/components/dashboard-skeleton/dashboard-skeleton.component";
import { CoachOverrideNotificationComponent } from "../../shared/components/coach-override-notification/coach-override-notification.component";
import {
  OverrideLoggingService,
  CoachOverride,
} from "../../core/services/override-logging.service";
import { OwnershipTransitionBadgeComponent } from "../../shared/components/ownership-transition-badge/ownership-transition-badge.component";
import {
  OwnershipTransitionService,
  OwnershipTransition,
} from "../../core/services/ownership-transition.service";
import { MissingDataExplanationComponent } from "../../shared/components/missing-data-explanation/missing-data-explanation.component";
import {
  MissingDataDetectionService,
  MissingDataStatus,
} from "../../core/services/missing-data-detection.service";
import { SemanticMeaningRendererComponent } from "../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import {
  CoachOverrideMeaning,
  IncompleteDataMeaning,
  ActionRequiredMeaning,
} from "../../core/semantics/semantic-meaning.types";
import { ProfileCompletionService } from "../../core/services/profile-completion.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { FeatureFlagsService } from "../../core/services/feature-flags.service";
import { NextGenMetricsService } from "../../core/services/next-gen-metrics.service";
import { TRAINING, UI_LIMITS } from "../../core/constants/app.constants";
import { getReadinessLevel } from "../../core/constants/wellness.constants";
import { getTimeAgo } from "../../shared/utils/date.utils";
import { PlayerDashboardDataService } from "./services/player-dashboard-data.service";
import type { SimpleChartData } from "../../core/models/chart.models";

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  description: string;
}

interface _ScheduleItem {
  id: string;
  time: string;
  title: string;
  duration: number;
  completed: boolean;
  icon?: string;
}

interface AnnouncementBanner {
  message: string | null; // From backend
  coachName: string | null; // From backend
  postedAt: Date | null; // From backend
  priority: "info" | "important";
}

@Component({
  selector: "app-player-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DecimalPipe,
    Card,
    StatusTagComponent,
    ButtonComponent,

    LazyChartComponent,
    ChartSkeletonComponent,
    DashboardSkeletonComponent,
    Tooltip,
    ProgressBar,
    Message,
    Timeline,
    MainLayoutComponent,
    PageErrorStateComponent,
    ConfidenceIndicatorComponent,
    CoachOverrideNotificationComponent,
    OwnershipTransitionBadgeComponent,
    MissingDataExplanationComponent,
    SemanticMeaningRendererComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State - Dashboard-Specific Skeleton (Evidence-Based UX) -->
      @if (isLoading()) {
        <app-dashboard-skeleton></app-dashboard-skeleton>
      }

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
          <!-- NO PROGRAM ASSIGNED FALLBACK - Enhanced with Diagnostic Guidance (UX Audit Fix #3) -->
          @if (needsProgramAssignment()) {
            <section class="no-program-section">
              <p-card styleClass="no-program-card">
                <div class="no-program-content">
                  <div class="no-program-icon">
                    <i class="pi pi-calendar-times"></i>
                  </div>
                  <h3 class="no-program-title">Let's Get You Set Up!</h3>
                  <p class="no-program-message">
                    Your training program is almost ready. Let's check what's
                    needed:
                  </p>

                  <!-- Diagnostic Steps Checklist -->
                  <div class="setup-checklist">
                    <div class="checklist-item">
                      <div class="checklist-icon checklist-complete">
                        <i class="pi pi-check"></i>
                      </div>
                      <div class="checklist-content">
                        <span class="checklist-label">Account created</span>
                        <span class="checklist-status">Complete</span>
                      </div>
                    </div>

                    @if (!hasCompletedOnboarding()) {
                      <!-- Phase 3: Semantic Action Required Badge -->
                      @if (getOnboardingActionRequiredMeaning()) {
                        <app-semantic-meaning-renderer
                          [meaning]="getOnboardingActionRequiredMeaning()!"
                          [context]="{
                            container: 'inline',
                            priority: 'high',
                            dismissible: false,
                          }"
                        ></app-semantic-meaning-renderer>
                      }
                      <!-- Fallback checklist item for visual consistency -->
                      <div class="checklist-item checklist-action-needed">
                        <div class="checklist-icon checklist-warning">
                          <i class="pi pi-exclamation-circle"></i>
                        </div>
                        <div class="checklist-content">
                          <span class="checklist-label"
                            >Complete your profile</span
                          >
                          <span class="checklist-status">Action required</span>
                        </div>
                      </div>
                    } @else {
                      <div class="checklist-item">
                        <div class="checklist-icon checklist-complete">
                          <i class="pi pi-check"></i>
                        </div>
                        <div class="checklist-content">
                          <span class="checklist-label">Profile completed</span>
                          <span class="checklist-status">Complete</span>
                        </div>
                      </div>
                    }

                    <div class="checklist-item">
                      <div class="checklist-icon checklist-waiting">
                        <i class="pi pi-clock"></i>
                      </div>
                      <div class="checklist-content">
                        <span class="checklist-label"
                          >Coach program assignment</span
                        >
                        <span class="checklist-status"
                          >Usually 24-48 hours</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Next Steps -->
                  <div class="setup-next-steps">
                    <h4 class="next-steps-title">What happens next?</h4>
                    @if (!hasCompletedOnboarding()) {
                      <ol class="next-steps-list">
                        <li>
                          <strong>Complete your profile</strong> (2-3 minutes)
                        </li>
                        <li>
                          Your coach will review and assign a program (24-48
                          hours)
                        </li>
                        <li>Start training!</li>
                      </ol>
                    } @else {
                      <p class="next-steps-message">
                        Your profile looks great! Your coach will assign a
                        training program within 24-48 hours. You'll receive a
                        notification when it's ready.
                      </p>
                      <p class="next-steps-tip">
                        💡 <strong>In the meantime:</strong> Explore the
                        exercise library and watch training videos!
                      </p>
                    }
                  </div>

                  <!-- Action Buttons -->
                  <div class="no-program-actions">
                    @if (!hasCompletedOnboarding()) {
                      <app-button
                        iconLeft="pi-user-edit"
                        routerLink="/onboarding"
                      >
                        Complete Profile (2 min)
                      </app-button>
                    }
                    @if (hasCompletedOnboarding()) {
                      <app-button
                        iconLeft="pi-book"
                        routerLink="/exercise-library"
                      >
                        Browse Exercises
                      </app-button>
                      <app-button
                        iconLeft="pi-youtube"
                        variant="outlined"
                        routerLink="/training/videos"
                      >
                        Watch Videos
                      </app-button>
                    }
                    <app-button
                      iconLeft="pi-envelope"
                      variant="outlined"
                      (clicked)="contactCoach()"
                    >
                      Contact Coach
                    </app-button>
                  </div>

                  <!-- Expected Timeline -->
                  <div class="setup-timeline">
                    <i class="pi pi-info-circle"></i>
                    <span
                      >Most athletes get their program within 24 hours. Check
                      back tomorrow!</span
                    >
                  </div>
                </div>
              </p-card>
            </section>
          }

          <!-- SECTION 1: Announcement Banner -->
          <!-- Only shows when message content exists (from backend) -->
          @if (announcement()?.message && !announcementDismissed()) {
            <section class="announcement-section">
              <div class="announcement-banner">
                <div class="announcement-content">
                  <div class="announcement-text">
                    <i
                      [class]="
                        announcement()?.priority === 'important'
                          ? 'pi pi-exclamation-triangle'
                          : 'pi pi-megaphone'
                      "
                      class="announcement-icon"
                    ></i>
                    <span class="announcement-message">{{
                      announcement()?.message
                    }}</span>
                  </div>
                  <span class="announcement-meta">
                    — {{ announcement()?.coachName }} ·
                    {{ getTimeAgoStr(announcement()?.postedAt) }}
                  </span>
                </div>
                <button
                  type="button"
                  class="announcement-close-btn"
                  (click)="dismissAnnouncement()"
                  aria-label="Dismiss announcement"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </section>
          }

          <!-- SECTION 1.5: Coach Override Notifications (Phase 3 - Semantic Meaning) -->
          @if (recentOverrides().length > 0) {
            <section class="override-notifications-section">
              @for (override of recentOverrides(); track override.id) {
                <!-- Phase 3: Semantic Coach Override Meaning -->
                @if (getCoachOverrideMeaning(override)) {
                  <app-semantic-meaning-renderer
                    [meaning]="getCoachOverrideMeaning(override)!"
                    [context]="{
                      container: 'card',
                      priority: 'medium',
                      dismissible: false,
                    }"
                  ></app-semantic-meaning-renderer>
                }
                <!-- Fallback: Keep notification component for detailed view -->
                <app-coach-override-notification
                  [override]="override"
                  [coachName]="getCoachName(override.coachId)"
                  [playerId]="currentUserId()"
                ></app-coach-override-notification>
              }
            </section>
          }

          <!-- SECTION 1.6: Ownership Transitions (Phase 2.1 - Trust Repair) -->
          @if (activeTransitions().length > 0) {
            <section class="ownership-transitions-section">
              @for (transition of activeTransitions(); track transition.id) {
                <app-ownership-transition-badge
                  [transition]="transition"
                  [showDetails]="true"
                ></app-ownership-transition-badge>
              }
            </section>
          }

          <!-- SECTION 1.7: Missing Data Explanation (Phase 3 - Semantic Meaning) -->
          @if (missingWellnessStatus() && missingWellnessStatus()!.missing) {
            <section class="missing-data-section">
              <!-- Detailed explanation component (5-Question Contract style) -->
              <!-- NOTE: Semantic badge removed - MissingDataExplanation already shows severity -->
              <app-missing-data-explanation
                [missingStatus]="missingWellnessStatus()!"
                [showCoachLink]="true"
              ></app-missing-data-explanation>
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
                  <div class="welcome-header-row">
                    <h2 class="welcome-greeting">
                      {{ greeting() }}, {{ userName() }}!
                    </h2>
                    <!-- Privacy Status Badge -->
                    @if (privacySharingStatus().totalMetrics > 0) {
                      <app-status-tag
                        [value]="
                          'Sharing: ' +
                          privacySharingStatus().sharedMetrics +
                          '/' +
                          privacySharingStatus().totalMetrics +
                          ' metrics'
                        "
                        severity="info"
                        size="sm"
                        [pTooltip]="
                          'Manage your data sharing preferences in Settings'
                        "
                        tooltipPosition="bottom"
                        [routerLink]="['/settings/privacy']"
                        class="status-tag-link"
                      ></app-status-tag>
                    }
                  </div>
                  <p class="merlin-insight">{{ merlinInsight() }}</p>
                  <div class="welcome-actions">
                    <app-button iconLeft="pi-play" routerLink="/todays-practice"
                      >Start Training</app-button
                    >
                    <app-button
                      iconLeft="pi-comments"
                      variant="text"
                      routerLink="/chat"
                      >Ask Merlin</app-button
                    >
                  </div>
                </div>
              </div>
            </p-card>
          </section>

          <!-- SECTION 3: Key Stats Overview (4 Cards) -->
          <section class="stats-overview" aria-label="Key statistics">
            <!-- Readiness Card - Enhanced with Check-in Status (UX Audit Fix #4) -->
            <p-card
              styleClass="stat-card stat-readiness stat-card--clickable"
              (click)="navigateToWellness()"
              pTooltip="Your overall readiness to train today based on sleep, soreness, stress, and energy levels. Checked daily via wellness survey."
              tooltipPosition="bottom"
              [showDelay]="500"
            >
              @if (readinessScore() !== null) {
                <div class="stat-card-content">
                  <div class="stat-icon readiness-icon">
                    <i class="pi pi-heart"></i>
                  </div>
                  <div class="stat-details">
                    <span class="stat-block__value">
                      {{ readinessScore() }}%
                    </span>
                    <span class="stat-block__label">Readiness</span>
                  </div>
                  <app-status-tag
                    [value]="getReadinessStatus()"
                    [severity]="getReadinessSeverity()"
                    size="sm"
                  ></app-status-tag>
                  @if (nextGenEnabled()) {
                    <span class="next-gen-preview-tag">
                      Preview:
                      {{
                        nextGenReadinessScore() !== null
                          ? (nextGenReadinessScore() | number: "1.0-0")
                          : "N/A"
                      }}
                    </span>
                  }
                </div>
              } @else {
                <div class="stat-card-content">
                  <div class="stat-icon readiness-icon">
                    <i class="pi pi-heart"></i>
                  </div>
                  <div class="stat-details">
                    <span class="stat-block__value">--</span>
                    <span class="stat-block__label">Readiness</span>
                  </div>
                  <app-status-tag
                    value="No data"
                    severity="info"
                    size="sm"
                  ></app-status-tag>
                  @if (nextGenEnabled()) {
                    <span class="next-gen-preview-tag">Preview: N/A</span>
                  }
                </div>
              }

              <!-- Wellness Check-in Status Indicator -->
              <div class="wellness-checkin-status">
                @if (wellnessCheckedInToday()) {
                  <div class="checkin-status checkin-complete">
                    <i class="pi pi-check-circle"></i>
                    <span>Checked in today</span>
                  </div>
                  @if (checkinStreak() > 0) {
                    <div class="checkin-streak">
                      🔥 {{ checkinStreak() }}-day streak!
                    </div>
                  }
                } @else if (checkinOverdue()) {
                  <div class="checkin-status checkin-overdue">
                    <i class="pi pi-exclamation-circle"></i>
                    <span>Overdue ({{ daysSinceLastCheckin() }} days)</span>
                  </div>
                } @else {
                  <div class="checkin-status checkin-due">
                    <i class="pi pi-clock"></i>
                    <span>Due today • Takes 2 min</span>
                  </div>
                }
              </div>
            </p-card>

            <!-- ACWR Card - Enhanced with Progress Tracking (UX Audit Fix #5) -->
            <p-card
              styleClass="stat-card stat-acwr cursor-pointer"
              (click)="navigateToACWR()"
              [pTooltip]="
                acwrDataSufficient()
                  ? '📊 Acute:Chronic Workload Ratio tracks your injury risk by comparing recent training load (' +
                    TRAINING.ACUTE_LOAD_DAYS +
                    ' days) to long-term fitness (' +
                    TRAINING.CHRONIC_LOAD_DAYS +
                    ' days).

✅ Optimal range: ' +
                    TRAINING.ACWR_SAFE_RANGE_MIN +
                    '–' +
                    TRAINING.ACWR_SAFE_RANGE_MAX
                  : '💡 ACWR requires ' +
                    TRAINING.MIN_DAYS_FOR_CHRONIC +
                    ' days of training data to calculate.

Keep logging sessions to unlock this injury prevention metric!'
              "
              tooltipPosition="bottom"
              [showDelay]="500"
            >
              @if (acwr() !== null && acwrDataSufficient()) {
                <!-- Full ACWR Display (MIN_DAYS_FOR_CHRONIC+ days of data) -->
                <div class="stat-card-content">
                  <div class="stat-icon acwr-icon">
                    <i class="pi pi-chart-line"></i>
                  </div>
                  <div class="stat-details">
                    <span class="stat-block__value">{{
                      acwr() | number: "1.2-2"
                    }}</span>
                    <span class="stat-block__label">ACWR</span>
                  </div>
                  <app-status-tag
                    [value]="getAcwrStatus()"
                    [severity]="getAcwrSeverity()"
                    size="sm"
                  ></app-status-tag>
                </div>
              } @else if (trainingDaysLogged() !== null) {
                <!-- Progress Tracking (< MIN_DAYS_FOR_CHRONIC days) -->
                <div class="acwr-progress-content">
                  <div class="stat-icon acwr-icon-building">
                    <i class="pi pi-chart-line"></i>
                  </div>
                  <div class="acwr-progress-details">
                    <span class="acwr-progress-title">Load Monitoring</span>
                    <div class="acwr-progress-bar-container">
                      <div class="acwr-progress-bar">
                        <div
                          class="acwr-progress-fill"
                          [style.width.%]="
                            (trainingDaysLogged()! /
                              TRAINING.MIN_DAYS_FOR_CHRONIC) *
                            100
                          "
                        ></div>
                      </div>
                      <span class="acwr-progress-text">
                        {{ trainingDaysLogged() }}/{{
                          TRAINING.MIN_DAYS_FOR_CHRONIC
                        }}
                        days
                      </span>
                    </div>
                    @if (
                      trainingDaysLogged()! >= TRAINING.ACUTE_LOAD_DAYS &&
                      trainingDaysLogged()! < 14
                    ) {
                      <app-status-tag
                        value="7-day milestone! 🎉"
                        severity="success"
                        size="sm"
                        class="milestone-tag"
                      ></app-status-tag>
                    } @else if (
                      trainingDaysLogged()! >= 14 &&
                      trainingDaysLogged()! < TRAINING.MIN_DAYS_FOR_CHRONIC
                    ) {
                      <app-status-tag
                        value="Halfway there!"
                        severity="info"
                        size="sm"
                        class="milestone-tag"
                      ></app-status-tag>
                    } @else if (
                      trainingDaysLogged()! < TRAINING.ACUTE_LOAD_DAYS
                    ) {
                      <span class="acwr-help-text"
                        >Keep logging to unlock insights</span
                      >
                    }
                  </div>
                </div>
              } @else {
                <!-- No data -->
                <div class="stat-card-content">
                  <div class="stat-icon acwr-icon">
                    <i class="pi pi-chart-line"></i>
                  </div>
                  <div class="stat-details">
                    <span class="stat-block__value">--</span>
                    <span class="stat-block__label">ACWR</span>
                  </div>
                  <app-status-tag
                    value="Log training sessions"
                    severity="info"
                    size="sm"
                  ></app-status-tag>
                </div>
              }

              <!-- Data Confidence Indicator (Phase 3 - Semantic Meaning) -->
              @if (acwr() !== null || trainingDaysLogged() !== null) {
                <div class="confidence-indicator-wrapper">
                  <!-- Phase 3: Semantic Incomplete Data Badge when confidence is low -->
                  @if (
                    acwrConfidence().score < 0.9 &&
                    getACWRIncompleteDataMeaning()
                  ) {
                    <app-semantic-meaning-renderer
                      [meaning]="getACWRIncompleteDataMeaning()!"
                      [context]="{
                        container: 'inline',
                        priority:
                          acwrConfidence().score < 0.5 ? 'critical' : 'medium',
                        dismissible: false,
                      }"
                    ></app-semantic-meaning-renderer>
                  }
                  <!-- Detailed confidence indicator -->
                  <app-confidence-indicator
                    [score]="acwrConfidence().score"
                    [missingInputs]="acwrConfidence().missingInputs"
                    [showDetails]="false"
                  ></app-confidence-indicator>
                </div>
              }
            </p-card>

            <!-- Streak Card -->
            <p-card
              styleClass="stat-card stat-streak cursor-pointer"
              pTooltip="Consecutive days with training logged. Building a streak helps maintain consistency and prevents gaps in your progress tracking."
              tooltipPosition="bottom"
              [showDelay]="500"
            >
              <div class="stat-card-content">
                <div class="stat-icon streak-icon">
                  <i class="pi pi-bolt"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-block__value">{{ currentStreak() }}</span>
                  <span class="stat-block__label">Day Streak</span>
                </div>
              </div>
            </p-card>

            <!-- Weekly Sessions Card -->
            <p-card styleClass="stat-card stat-sessions cursor-pointer">
              <div class="stat-card-content">
                <div class="stat-icon sessions-icon">
                  <i class="pi pi-calendar-plus"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-block__value"
                    >{{ weeklySessionsCompleted() }}/{{
                      weeklySessionsPlanned()
                    }}</span
                  >
                  <span class="stat-block__label">This Week</span>
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
                      [attr.aria-label]="
                        day.name +
                        (day.completed
                          ? ', completed'
                          : day.isToday
                            ? ', today'
                            : '')
                      "
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
                <span class="progress-text"
                  >{{ weeklyProgress() }}% completed</span
                >
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
                <p-timeline
                  [value]="
                    todaySchedule().slice(0, UI_LIMITS.SCHEDULE_PREVIEW_COUNT)
                  "
                  styleClass="schedule-timeline"
                >
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
                    <div
                      class="schedule-item"
                      [class.completed]="item.completed"
                    >
                      <div class="item-time">{{ item.time }}</div>
                      <div class="item-info">
                        <span class="item-title">{{ item.title }}</span>
                        <span class="item-duration"
                          >{{ item.duration }} min</span
                        >
                      </div>
                    </div>
                  </ng-template>
                </p-timeline>
                @if (todaySchedule().length > 3) {
                  <p class="more-items">
                    +{{ todaySchedule().length - 3 }} more items
                  </p>
                }
                <div class="card-footer-action">
                  <app-button
                    variant="text"
                    iconRight="pi-arrow-right"
                    routerLink="/todays-practice"
                    >View Full Day</app-button
                  >
                </div>
              } @else {
                <div class="empty-schedule">
                  <p-message severity="info" styleClass="status-message">
                    <div class="empty-content">
                      <i class="pi pi-calendar empty-icon"></i>
                      <span>No training scheduled for today</span>
                    </div>
                  </p-message>
                  <app-button variant="text" routerLink="/training"
                    >View Full Schedule</app-button
                  >
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
                    >{{ action.label }}</app-button
                  >
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
                  @defer (on viewport; prefetch on idle) {
                    <app-lazy-chart
                      type="line"
                      [data]="performanceChartData()"
                      [options]="chartOptions"
                      height="calc(var(--space-6) * 7.5)"
                    ></app-lazy-chart>
                  } @placeholder {
                    <app-chart-skeleton
                      type="line"
                      height="calc(var(--space-6) * 7.5)"
                    />
                  } @loading (minimum 500ms) {
                    <app-chart-skeleton
                      type="line"
                      height="calc(var(--space-6) * 7.5)"
                    />
                  }
                </div>
                <div class="card-footer-action">
                  <app-button
                    variant="text"
                    iconRight="pi-arrow-right"
                    routerLink="/analytics"
                    >View Detailed Analytics</app-button
                  >
                </div>
              } @else {
                <div class="empty-chart">
                  <p-message severity="info" styleClass="status-message">
                    <div class="empty-content">
                      <i class="pi pi-chart-line empty-icon"></i>
                      <span>Complete more sessions to see your trend</span>
                    </div>
                  </p-message>
                </div>
              }
            </p-card>
          </div>

          <!-- SECTION 8: What's Next (Continuity Events) -->
          @if (continuityEvents().length > 0) {
            <section class="continuity-section" aria-label="What's next">
              <h3 class="section-title">
                <i class="pi pi-calendar-clock" aria-hidden="true"></i>
                What's Next
              </h3>
              <div class="continuity-events">
                @for (event of continuityEvents(); track event.type) {
                  <p-card styleClass="continuity-event-card">
                    <div class="continuity-event">
                      <span class="event-icon">{{
                        getEventIcon(event.type)
                      }}</span>
                      <div class="event-details">
                        <h4>{{ event.title }}</h4>
                        <p>{{ event.description }}</p>
                        @if (
                          event.daysRemaining !== undefined &&
                          event.daysRemaining > 0
                        ) {
                          <app-status-tag
                            [value]="event.daysRemaining + ' day(s) remaining'"
                            severity="info"
                            size="sm"
                            class="event-tag"
                          ></app-status-tag>
                        }
                        @if (event.sessionsRemaining !== undefined) {
                          <app-status-tag
                            [value]="
                              event.sessionsRemaining + ' sessions remaining'
                            "
                            severity="warning"
                            size="sm"
                            class="event-tag"
                          ></app-status-tag>
                        }
                      </div>
                    </div>
                  </p-card>
                }
              </div>
            </section>
          }

          <!-- SECTION 9: Tomorrow's Preview -->
          @if (tomorrowSchedule().length > 0) {
            <section class="tomorrow-section" aria-label="Tomorrow's schedule">
              <h3 class="section-title">
                <i class="pi pi-calendar-plus" aria-hidden="true"></i>
                Tomorrow's Preview
              </h3>
              <p-card styleClass="schedule-card">
                <p-timeline
                  [value]="
                    tomorrowSchedule().slice(
                      0,
                      UI_LIMITS.SCHEDULE_PREVIEW_COUNT
                    )
                  "
                  styleClass="schedule-timeline"
                >
                  <ng-template pTemplate="marker" let-item>
                    <span
                      class="timeline-marker upcoming"
                      [attr.aria-hidden]="true"
                    >
                      <i class="pi pi-circle"></i>
                    </span>
                  </ng-template>
                  <ng-template pTemplate="content" let-item>
                    <div class="schedule-item upcoming">
                      <div class="item-time">{{ item.time }}</div>
                      <div class="item-info">
                        <span class="item-title">{{ item.title }}</span>
                        <span class="item-duration"
                          >{{ item.duration }} min</span
                        >
                      </div>
                    </div>
                  </ng-template>
                </p-timeline>
                @if (tomorrowSchedule().length > 3) {
                  <p class="more-items">
                    +{{ tomorrowSchedule().length - 3 }} more items
                  </p>
                }
                <div class="card-footer-action">
                  <app-button
                    variant="text"
                    iconRight="pi-arrow-right"
                    routerLink="/calendar"
                    >View Full Schedule</app-button
                  >
                </div>
              </p-card>
            </section>
          }

          <!-- SECTION 10: Upcoming Events -->
          @if (upcomingEvents().length > 0) {
            <section class="upcoming-section" aria-label="Upcoming events">
              <h3 class="section-title">
                <i class="pi pi-calendar" aria-hidden="true"></i>
                Coming Up
              </h3>
              <div class="events-strip">
                @for (
                  event of upcomingEvents().slice(
                    0,
                    UI_LIMITS.EVENTS_PREVIEW_COUNT
                  );
                  track event.id
                ) {
                  <p-card
                    styleClass="event-card"
                    [ngClass]="'event-' + event.type"
                  >
                    <div class="event-card-content">
                      <div class="event-date">
                        <span class="date-day">{{ event.day }}</span>
                        <span class="date-month">{{ event.month }}</span>
                      </div>
                      <div class="event-info">
                        <span class="event-title">{{ event.title }}</span>
                        <app-status-tag
                          [value]="event.typeLabel"
                          [severity]="getEventSeverity(event.type)"
                          size="sm"
                          class="event-tag"
                        ></app-status-tag>
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
  styles: [
    `
      /**
     * Player Dashboard Styles
     * =======================
     * ⭐ CANONICAL PAGE — Design System Exemplar
     * 
     * This stylesheet is FROZEN as a design system exemplar.
     * All future pages should copy patterns FROM this file.
     * 
     * Design System Compliant - All tokens from design-system-tokens.scss
     * PrimeNG overrides moved to primeng/_brand-overrides.scss
     * 
     * NOTE: Encapsulation hacks and !important removed per DESIGN_SYSTEM_RULES.md
     * PrimeNG component styling is handled globally via styleClass bindings
     * 
     * See docs/CANONICAL_PAGES.md for usage guidelines.
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
       NO PROGRAM ASSIGNED FALLBACK
       ========================================== */
      .no-program-section {
        margin-bottom: 0;
      }

      .no-program-card {
        background: var(--surface-card);
        border: var(--border-2) dashed var(--surface-border);
        border-radius: var(--radius-lg);
      }

      .no-program-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--space-6);
        gap: var(--space-4);
      }

      .no-program-icon {
        width: var(--space-16);
        height: var(--space-16);
        border-radius: var(--radius-full);
        background: var(--surface-ground);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary);
      }

      .no-program-icon i {
        font-size: var(--ds-font-size-3xl);
      }

      .no-program-title {
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0;
      }

      .no-program-message {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
        max-width: var(--content-max-width-sm);
        margin: 0;
        line-height: var(--ds-line-height-body);
      }

      .no-program-actions {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
        justify-content: center;
        margin-top: var(--space-2);
      }

      /* Enhanced Diagnostic Checklist Styles (UX Audit Fix #3) */
      .setup-checklist {
        width: 100%;
        max-width: var(--content-max-width-sm);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin: var(--space-4) 0;
        text-align: left;
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--radius-md);
        border-left: var(--border-4) solid var(--color-border-primary);
      }

      .checklist-item.checklist-action-needed {
        background: var(--color-status-warning-bg);
        border-left-color: var(--color-status-warning);
      }

      .checklist-icon {
        width: var(--space-8);
        height: var(--space-8);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .checklist-icon.checklist-complete {
        background: var(--color-status-success);
        color: white;
      }

      .checklist-icon.checklist-warning {
        background: var(--color-status-warning);
        color: white;
      }

      .checklist-icon.checklist-waiting {
        background: var(--surface-border);
        color: var(--color-text-secondary);
      }

      .checklist-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .checklist-label {
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-primary);
        font-size: var(--ds-font-size-sm);
      }

      .checklist-status {
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
      }

      .setup-next-steps {
        width: 100%;
        max-width: var(--content-max-width-sm);
        text-align: left;
        background: var(--surface-ground);
        padding: var(--space-4);
        border-radius: var(--radius-md);
        margin: var(--space-2) 0;
      }

      .next-steps-title {
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        margin: 0 0 var(--space-3) 0;
        color: var(--color-text-primary);
      }

      .next-steps-list {
        margin: 0;
        padding-left: var(--space-5);
        list-style: decimal;
      }

      .next-steps-list li {
        margin-bottom: var(--space-2);
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-1-6);
      }

      .next-steps-message {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-3) 0;
        line-height: var(--ds-line-height-1-6);
      }

      .next-steps-tip {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
        margin: 0;
        padding: var(--space-3);
        background: var(--surface-card);
        border-radius: var(--radius-sm);
        border-left: var(--border-4) solid var(--ds-primary-green);
      }

      .setup-timeline {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--radius-md);
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
        margin-top: var(--space-4);
      }

      .setup-timeline i {
        color: var(--ds-primary-green);
      }

      /* ==========================================
       SECTION 1: Announcement Banner
       Design System: Green background, white text
       ========================================== */
      .announcement-section {
        margin-bottom: 0;
      }

      .announcement-banner {
        background: var(--ds-primary-green);
        border: none;
        border-radius: var(--radius-lg);
        padding: var(--space-3) var(--space-4);
        color: var(--color-text-on-primary);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
      }

      .announcement-close-btn {
        background: transparent;
        border: none;
        color: var(--color-text-on-primary);
        opacity: 0.9;
        cursor: pointer;
        padding: var(--space-2);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .announcement-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        opacity: 1;
      }

      .announcement-content {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--space-4);
        width: 100%;
        flex-wrap: wrap;
      }

      .announcement-text {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        flex: 1;
      }

      .announcement-icon {
        font-size: var(--ds-font-size-2xl);
        flex-shrink: 0;
        color: var(--color-text-on-primary);
        width: var(--space-10);
        height: var(--space-10);
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.15);
        border-radius: var(--radius-md);
      }

      .announcement-message {
        font-weight: var(--ds-font-weight-semibold);
        font-size: var(--ds-font-size-md);
        color: var(--color-text-on-primary);
      }

      .announcement-meta {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-on-primary);
        opacity: 0.9;
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
        font-size: var(--ds-font-size-2xl);
        color: var(--color-text-on-primary);
        flex-shrink: 0;
      }

      .welcome-content {
        flex: 1;
        min-width: 0;
      }

      .welcome-greeting {
        margin: 0 0 var(--space-1);
        font-size: var(--ds-font-size-3xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-h1);
      }

      .merlin-insight {
        margin: 0 0 var(--space-3);
        color: var(--color-text-muted);
        font-size: var(--ds-font-size-sm);
        line-height: var(--ds-line-height-body-sm);
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
        gap: var(--space-4); /* 16px gap for breathing room */
      }

      .stat-card-content {
        display: flex;
        align-items: center;
        gap: var(--space-4); /* 16px gap between icon and content */
      }

      /* PrimeNG Card padding override for stat cards */
      .stat-card .p-card-body {
        padding: var(--space-5); /* Align with stat-card padding */
      }
      .stat-card .p-card-content {
        padding: 0;
      }

      .stat-icon {
        width: var(--space-10);
        height: var(--space-10);
        min-width: var(--space-10);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ds-font-size-md);
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

      .stat-block__value {
        font-size: var(--ds-font-size-2xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-tight);
      }

      .stat-block__label {
        font-size: var(--ds-font-size-xs);
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-muted);
        line-height: var(--ds-line-height-caption);
        letter-spacing: var(--ds-letter-spacing-caption);
        text-transform: var(--ds-text-transform-uppercase);
      }

      .next-gen-preview-tag {
        margin-top: var(--space-1);
        display: inline-flex;
        align-items: center;
        padding: 0 var(--space-2);
        border-radius: var(--radius-pill);
        background: var(--surface-secondary);
        border: var(--border-1) solid var(--surface-border);
        color: var(--color-text-secondary);
        font-size: var(--ds-font-size-xs);
        font-weight: var(--ds-font-weight-medium);
        text-transform: uppercase;
        letter-spacing: var(--ds-letter-spacing-caption);
      }

      /* Wellness Check-in Status Styles (UX Audit Fix #4) */
      .wellness-checkin-status {
        margin-top: var(--space-3);
        padding-top: var(--space-3);
        border-top: var(--border-1) solid var(--color-border-secondary);
      }

      .checkin-status {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--ds-font-size-xs);
        padding: var(--space-2);
        border-radius: var(--radius-sm);
      }

      .checkin-status i {
        font-size: var(--ds-font-size-sm);
      }

      .checkin-complete {
        color: var(--color-status-success);
        background: var(--color-status-success-bg);
      }

      .checkin-due {
        color: var(--color-text-secondary);
        background: var(--surface-ground);
      }

      .checkin-overdue {
        color: var(--color-status-error);
        background: var(--color-status-error-bg);
      }

      .checkin-streak {
        margin-top: var(--space-2);
        font-size: var(--ds-font-size-xs);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--primitive-warning-600);
        padding: var(--space-1) var(--space-2);
        background: var(--color-status-warning-bg);
        border-radius: var(--radius-sm);
        display: inline-block;
      }

      /* Make readiness card clickable with hover effect */
      .stat-readiness {
        transition: transform var(--motion-fast) var(--ease-standard);
      }

      .stat-readiness:hover {
        transform: var(--transform-hover-lift);
        box-shadow: var(--shadow-2);
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
        padding: var(--space-3) var(--space-4);
      }

      .card-header-icon {
        font-size: var(--ds-font-size-md);
        color: var(--color-brand-primary);
        opacity: 0.9;
      }

      .card-header-title {
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-tight);
        margin: 0;
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
        font-size: var(--ds-font-size-xs);
        background: var(--surface-tertiary);
        color: var(--color-text-muted);
        border: var(--border-2) solid transparent;
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
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
        text-transform: var(--ds-text-transform-uppercase);
        font-weight: var(--ds-font-weight-medium);
        opacity: 0.75;
      }

      .progress-summary {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .progress-text {
        font-size: var(--ds-font-size-xs);
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
        font-size: var(--ds-font-size-xs);
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
        opacity: 0.6;
      }

      .item-time {
        font-size: var(--ds-font-size-xs);
        font-weight: var(--ds-font-weight-semibold);
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
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-primary);
        font-size: var(--ds-font-size-sm);
        line-height: var(--ds-line-height-h3);
      }

      .item-duration {
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
        opacity: 0.7;
      }

      .more-items {
        font-size: var(--ds-font-size-xs);
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
        gap: var(--space-3);
        padding: var(--space-6); /* 24px for breathing room */
      }

      .empty-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--ds-font-size-md);
        padding: var(--space-4) var(--space-5); /* Inner padding for the message */
      }

      .empty-icon {
        font-size: var(--ds-font-size-2xl);
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

      /* ==========================================
       Performance Chart
       ========================================== */
      .chart-container {
        height: calc(var(--space-8) * 5);
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
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-primary);
      }

      .section-title i {
        opacity: 0.7;
      }

      /* ==========================================
       Continuity Section
       ========================================== */
      .continuity-section {
        margin-top: 0;
      }

      .continuity-events {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .continuity-event-card {
        background: var(--surface-card);
      }

      .continuity-event {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
      }

      .event-icon {
        font-size: var(--ds-font-size-2xl);
        flex-shrink: 0;
      }

      .event-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .event-details h4 {
        margin: 0;
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
      }

      .event-details p {
        margin: 0;
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .event-tag {
        align-self: flex-start;
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
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-1);
      }

      .date-month {
        font-size: var(--ds-font-size-compact-md);
        color: var(--color-text-secondary);
        text-transform: var(--ds-text-transform-uppercase);
        letter-spacing: var(--ds-letter-spacing-wide);
      }

      .event-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        flex: 1;
        min-width: 0;
      }

      .event-title {
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-primary);
        font-size: var(--ds-font-size-sm);
        line-height: var(--ds-line-height-h3);
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
          flex-direction: row; /* Keep icon left on mobile */
          align-items: center;
        }

        .announcement-text {
          flex-wrap: wrap;
        }

        .announcement-meta {
          width: 100%;
          margin-left: calc(
            var(--space-10) + var(--space-3)
          ); /* Align with text */
          margin-top: var(--space-1);
        }
      }
    `,
  ],
})
export class PlayerDashboardComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly headerService = inject(HeaderService);
  private readonly trainingStatsService = inject(
    TrainingStatsCalculationService,
  );
  private readonly unifiedTrainingService = inject(UnifiedTrainingService);
  private readonly wellnessService = inject(WellnessService);
  private readonly dataConfidenceService = inject(DataConfidenceService);
  private readonly continuityService = inject(ContinuityIndicatorsService);
  private readonly acwrSpikeDetection = inject(AcwrSpikeDetectionService);
  private readonly privacySettingsService = inject(PrivacySettingsService);
  private readonly overrideLoggingService = inject(OverrideLoggingService);
  private readonly ownershipTransitionService = inject(
    OwnershipTransitionService,
  );
  private readonly missingDataDetectionService = inject(
    MissingDataDetectionService,
  );
  private readonly playerDashboardDataService = inject(PlayerDashboardDataService);
  private readonly channelService = inject(ChannelService);
  private readonly toastService = inject(ToastService);
  private readonly profileCompletionService = inject(ProfileCompletionService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly featureFlags = inject(FeatureFlagsService);
  private readonly nextGenMetricsService = inject(NextGenMetricsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  // Expose UI_LIMITS for template usage
  readonly UI_LIMITS = UI_LIMITS;

  // Loading state
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal("Failed to load dashboard. Please try again.");

  // User info
  userName = signal("Athlete");
  // Per audit: use currentUser() signal for reactivity, not getUser() method
  currentUserId = computed(() => this.authService.currentUser()?.id ?? "");

  // Announcement
  announcement = signal<AnnouncementBanner | null>(null);
  announcementDismissed = signal(false);

  // Phase 2.1 - Coach Override Notifications
  recentOverrides = signal<CoachOverride[]>([]);
  coachNamesCache = signal<Record<string, string>>({});

  // Phase 2.1 - Ownership Transitions
  activeTransitions = signal<OwnershipTransition[]>([]);

  // Phase 2.2 - Missing Data Status
  missingWellnessStatus = signal<MissingDataStatus | null>(null);

  // Program assignment state (from UnifiedTrainingService)
  needsProgramAssignment = computed(() =>
    this.unifiedTrainingService.needsProgramAssignment(),
  );

  // Stats - CRITICAL: No defaults - only real data
  readinessScore = signal<number | null>(null); // Load from wellness service
  acwr = signal<number | null>(null); // Load from training stats - no fallback
  currentStreak = signal(0);
  weeklySessionsCompleted = signal(0);
  weeklySessionsPlanned = signal(7);

  // Wellness check-in tracking (UX Audit Fix #4)
  wellnessCheckedInToday = signal(false);
  lastWellnessCheckin = signal<Date | null>(null);
  checkinStreak = signal(0);

  // Next-gen preview
  nextGenEnabled = this.featureFlags.nextGenMetricsPreview;
  nextGenPreview = this.nextGenMetricsService.loadPreview;
  nextGenReadinessScore = computed(() => {
    const preview = this.nextGenPreview();
    return preview?.readiness?.score ?? null;
  });

  // ACWR progress tracking (UX Audit Fix #5)
  trainingDaysLogged = signal<number | null>(null); // Calculate from real training sessions
  acwrDataSufficient = computed(() => {
    const days = this.trainingDaysLogged();
    return days !== null && days >= TRAINING.MIN_DAYS_FOR_CHRONIC;
  });

  // Expose TRAINING constant for template usage
  readonly TRAINING = TRAINING;

  // Week days
  weekDays = signal<
    Array<{
      name: string;
      short: string;
      completed: boolean;
      isToday: boolean;
      isFuture: boolean;
    }>
  >([]);

  // Schedule - use computed from UnifiedTrainingService
  todaySchedule = computed(() => {
    const items = this.unifiedTrainingService.todaysScheduleItems();
    // Transform TodayScheduleItem to ScheduleItem format for dashboard
    return items.map((item) => ({
      id: item.id,
      time: item.time,
      title: item.title,
      duration: item.duration || 60,
      completed: item.status === "completed",
      icon: item.icon,
    }));
  });

  tomorrowSchedule = computed(() => {
    const items = this.unifiedTrainingService.tomorrowScheduleItems();
    // Transform TodayScheduleItem to ScheduleItem format for dashboard
    return items.map((item) => ({
      id: item.id,
      time: item.time,
      title: item.title,
      duration: item.duration || 60,
      completed: false, // Tomorrow items are never completed
      icon: item.icon,
    }));
  });

  // Events
  upcomingEvents = signal<
    Array<{
      id: string;
      day: string;
      month: string;
      title: string;
      type: string;
      typeLabel: string;
    }>
  >([]);

  // Performance chart - uses Chart.js format
  performanceChartData = signal<SimpleChartData | null>(null);

  // Quick actions (order preserved from wireframe)
  quickActions: QuickAction[] = [
    {
      label: "Log Today’s Session",
      icon: "pi pi-plus",
      route: "/todays-practice",
      description: "Go to today’s practice and log your session",
    },
    {
      label: "Videos",
      icon: "pi pi-video",
      route: "/training/videos",
      description: "Watch training videos",
    },
    {
      label: "Wellness",
      icon: "pi pi-heart",
      route: "/wellness",
      description: "Check your wellness",
    },
    {
      label: "Schedule",
      icon: "pi pi-calendar",
      route: "/training",
      description: "View full schedule",
    },
    {
      label: "Analytics",
      icon: "pi pi-chart-bar",
      route: "/analytics",
      description: "Performance analytics",
    },
    {
      label: "Merlin AI",
      icon: "pi pi-sparkles",
      route: "/chat",
      description: "Talk to Merlin",
    },
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

    // CRITICAL: Only provide insights if we have real data
    if (readiness === null && acwrVal === null) {
      return "Complete a wellness check-in and log training sessions to get personalized insights.";
    }

    if (readiness !== null && readiness < 50) {
      return "Your readiness is low today. Consider a lighter session focused on recovery and mobility.";
    }
    if (acwrVal !== null && acwrVal > 1.3) {
      return "Your training load is elevated. Take it easy today to avoid overtraining and reduce injury risk.";
    }
    if (
      readiness !== null &&
      readiness >= 80 &&
      acwrVal !== null &&
      acwrVal <= 1.0
    ) {
      return "You're in great shape! Today is perfect for a high-intensity session. Let's push it!";
    }
    return "Solid day ahead! Stick to your plan and focus on quality over quantity in today's session.";
  });

  weeklyProgress = computed(() => {
    const completed = this.weeklySessionsCompleted();
    const planned = this.weeklySessionsPlanned();
    return planned > 0 ? Math.round((completed / planned) * 100) : 0;
  });

  // Data Confidence Calculations
  readinessConfidence = computed(() => {
    const wellnessData = this.wellnessService.wellnessData();
    if (!wellnessData || wellnessData.length === 0) {
      return {
        score: 0,
        missingInputs: ["wellness_data"],
        staleData: ["wellness"],
      };
    }
    // Map wellness data to format expected by confidence service
    const mappedData = wellnessData.map((w) => ({
      date: w.date,
      sleep: w.sleep,
      energy: w.energy,
      soreness: w.soreness,
      stress: w.stress,
      mood: w.mood,
    }));
    return this.dataConfidenceService.calculateWellnessConfidence(mappedData);
  });

  acwrConfidence = computed(() => {
    const daysLogged = this.trainingDaysLogged();
    return this.dataConfidenceService.calculateACWRConfidence(daysLogged || 0);
  });

  // Privacy Sharing Status
  privacySharingStatus = computed(() => {
    const teamSettings = this.privacySettingsService.teamSettings();
    const totalMetrics = METRIC_CATEGORIES.length; // 6 metrics

    if (teamSettings.length === 0) {
      return {
        sharedMetrics: 0,
        totalMetrics,
        sharingEnabled: false,
      };
    }

    // Count shared metrics across all teams
    // For simplicity, count metrics shared with at least one team
    const sharedCategories = new Set<string>();
    teamSettings.forEach((teamSetting) => {
      if (
        teamSetting.performanceSharingEnabled ||
        teamSetting.healthSharingEnabled
      ) {
        // Add all allowed metric categories
        teamSetting.allowedMetricCategories?.forEach((category) => {
          sharedCategories.add(category);
        });

        // If performance sharing is enabled, add performance and training_load
        if (teamSetting.performanceSharingEnabled) {
          sharedCategories.add("performance");
          sharedCategories.add("training_load");
        }

        // If health sharing is enabled, add wellness, readiness, injury_history
        if (teamSetting.healthSharingEnabled) {
          sharedCategories.add("wellness");
          sharedCategories.add("readiness");
          sharedCategories.add("injury_history");
        }
      }
    });

    return {
      sharedMetrics: sharedCategories.size,
      totalMetrics,
      sharingEnabled: sharedCategories.size > 0,
    };
  });

  // Continuity Events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  continuityEvents = signal<any[]>([]);

  constructor() {
    this.headerService.setDashboardHeader();

    // Load centralized services first (for consistent data across views)
    this.profileCompletionService.loadProfileData();
    this.teamMembershipService.loadMembership();

    this.loadData();

    effect(() => {
      if (this.nextGenEnabled()) {
        this.nextGenMetricsService.refreshLoadPreview();
      } else {
        this.nextGenMetricsService.clearPreview();
      }
    });

    effect(() => {
      const schedule = this.unifiedTrainingService.weeklySchedule();
      const planned = schedule.reduce(
        (sum, day) => sum + (day.sessions?.length || 0),
        0,
      );
      this.weeklySessionsPlanned.set(planned);
    });

    // Check if we need to refresh program assignment (e.g., after onboarding)
    const refreshProgramAssignment = sessionStorage.getItem(
      "refreshProgramAssignment",
    );
    if (refreshProgramAssignment === "true") {
      sessionStorage.removeItem("refreshProgramAssignment");
      // Force refresh program assignment check
      this.unifiedTrainingService.loadProgramAssignment();
    }

    // Trigger data loading in UnifiedTrainingService to populate schedule
    // This ensures today's schedule is available
    this.unifiedTrainingService.getTodayOverview().subscribe({
      next: () => {
        this.logger.info("[Dashboard] Today's overview data loaded");
      },
      error: (error) => {
        this.logger.error("[Dashboard] Error loading today's overview:", error);
      },
    });
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

    // this.announcementService.getLatestAnnouncement().subscribe(announcement => this.announcement.set(announcement));
    // For now, set structure with null values - will be populated from backend
    this.announcement.set({
      message: null, // From backend: e.g., "Practice tomorrow moved to 6PM due to field availability."
      coachName: null, // From backend: e.g., "Coach Smith"
      postedAt: null, // From backend: e.g., new Date()
      priority: "info", // From backend: 'info' | 'important'
    });

    // Load training stats
    this.trainingStatsService
      .getTrainingStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.logger.error("Failed to load training stats:", error);
          return of(null);
        }),
      )
      .subscribe((stats) => {
        // CRITICAL: Only set ACWR if we have real data - no fallback defaults
        if (stats?.acwr !== undefined && typeof stats.acwr === "number") {
          this.acwr.set(stats.acwr);
        } else {
          this.acwr.set(null); // No data - show empty state
        }

        this.currentStreak.set(stats?.currentStreak ?? 0);
        this.weeklySessionsCompleted.set(stats?.weeklySessions ?? 0);

        // Calculate training days logged from actual sessions
        // TODO: Get this from training stats service or calculate from sessions
        // For now, set to null if not available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statsAny = stats as any;
        this.trainingDaysLogged.set(statsAny?.trainingDaysLogged ?? null);

        // Load readiness score from wellness service
        this.loadReadinessScore();

        // Load continuity events
        this.loadContinuityEvents();

        // Load privacy settings
        // Note: loadTeamSettings is a private method, handled internally by the service

        // Load ACWR spike detection if ACWR is high
        this.checkAcwrSpike();

        // Phase 2.1 - Load recent coach override notifications
        this.loadRecentOverrides();

        // Phase 2.1 - Load active ownership transitions
        this.loadActiveTransitions();

        // Phase 2.2 - Load missing wellness data status
        this.loadMissingWellnessStatus();

        // The chart data (weeklyData with label/value) will come from the API
        // this.performanceService.getWeeklyTrend().subscribe(...)
        // For now, performanceChartData remains null (shows empty state)

        // Today's schedule is loaded via UnifiedTrainingService.todaysScheduleItems()
        // which is computed from weeklySchedule signal. Data is loaded by getTodayOverview()
        // or loadAllTrainingData() which is called during component initialization.

        // The events data (day, month, title, type, typeLabel) will come from the API
        // this.eventsService.getUpcomingEvents().subscribe(...)
        // For now, upcomingEvents remains empty (section hidden)

        this.isLoading.set(false);
      });
  }

  private loadReadinessScore(): void {
    // Load latest wellness entry and calculate readiness score
    const latestWellness = this.wellnessService.latestWellnessEntry();
    if (latestWellness) {
      const score = this.wellnessService.getWellnessScore(latestWellness);
      // Wellness score is 0-10; dashboard readiness uses 0-100 scale.
      const normalizedScore = Math.round(score * 10);
      this.readinessScore.set(normalizedScore);
    } else {
      // No wellness data - set to null (show empty state)
      this.readinessScore.set(null);
    }
  }

  private async loadContinuityEvents(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      const events = await this.continuityService.getPlayerContinuity(user.id);
      this.continuityEvents.set(events);
    } catch (error) {
      this.logger.error("[Dashboard] Error loading continuity events:", error);
    }
  }

  private async checkAcwrSpike(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    const acwrValue = this.acwr();
    if (acwrValue !== null && acwrValue > 1.5) {
      try {
        await this.acwrSpikeDetection.checkAndCapLoad(user.id, acwrValue);
        // Reload continuity events to show the new load cap
        await this.loadContinuityEvents();
      } catch (error) {
        this.logger.error("[Dashboard] Error checking ACWR spike:", error);
      }
    }
  }

  /**
   * Phase 2.1 - Trust Repair: Load recent coach override notifications
   */
  private async loadRecentOverrides(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      const overrides =
        await this.overrideLoggingService.getRecentUnreadOverrides(userId, 5);
      this.recentOverrides.set(overrides);

      // Load coach names for display
      if (overrides.length > 0) {
        await this.loadCoachNames(overrides);
      }
    } catch (error) {
      this.logger.error("[Dashboard] Error loading recent overrides:", error);
    }
  }

  /**
   * Phase 3: Convert MissingDataStatus to semantic IncompleteDataMeaning
   */
  getIncompleteDataMeaning(): IncompleteDataMeaning | null {
    const status = this.missingWellnessStatus();
    if (!status || !status.missing) {
      return null;
    }

    // Calculate confidence impact based on days missing
    let confidenceImpact = 0.1; // Base impact
    if (status.daysMissing >= 7) {
      confidenceImpact = 0.4; // Critical impact
    } else if (status.daysMissing >= 3) {
      confidenceImpact = 0.3; // High impact
    } else if (status.daysMissing >= 2) {
      confidenceImpact = 0.2; // Moderate impact
    }

    return {
      type: "incomplete-data",
      severity: status.severity === "critical" ? "critical" : "warning",
      dataType: "wellness",
      daysMissing: status.daysMissing,
      affectedMetric: "acwr",
      confidenceImpact,
      message: `Missing wellness data for ${status.daysMissing} day${status.daysMissing > 1 ? "s" : ""}. This reduces ACWR calculation accuracy.`,
    };
  }

  /**
   * Phase 3: Convert onboarding requirement to semantic ActionRequiredMeaning
   */
  getOnboardingActionRequiredMeaning(): ActionRequiredMeaning | null {
    if (this.hasCompletedOnboarding()) {
      return null; // No action required if onboarding is complete
    }

    return {
      type: "action-required",
      urgency: "high",
      actionType: "complete-profile",
      message: "Complete your profile to unlock your training program",
      actionLabel: "Complete Profile (2 min)",
      actionRoute: ["/onboarding"],
      blocking: true,
    };
  }

  /**
   * Phase 3: Convert ACWR confidence to semantic IncompleteDataMeaning
   */
  getACWRIncompleteDataMeaning(): IncompleteDataMeaning | null {
    const confidence = this.acwrConfidence();
    if (confidence.score >= 0.9) {
      return null; // No incomplete data if confidence is high
    }

    // Map confidence score to severity
    const severity = confidence.score < 0.5 ? "critical" : "warning";
    const confidenceImpact = 1.0 - confidence.score; // Inverse of confidence

    // Determine data type from missing inputs
    let dataType: IncompleteDataMeaning["dataType"] = "general";
    if (
      confidence.missingInputs.includes("wellness") ||
      confidence.missingInputs.includes("wellness_data")
    ) {
      dataType = "wellness";
    } else if (
      confidence.missingInputs.includes("training") ||
      confidence.missingInputs.includes("training_sessions")
    ) {
      dataType = "training";
    }

    return {
      type: "incomplete-data",
      severity,
      dataType,
      affectedMetric: "acwr",
      confidenceImpact,
      message: `ACWR calculation confidence is ${(confidence.score * 100).toFixed(0)}%. Missing: ${confidence.missingInputs.join(", ")}.`,
    };
  }

  /**
   * Phase 3: Convert CoachOverride to semantic CoachOverrideMeaning
   */
  getCoachOverrideMeaning(
    override: CoachOverride,
  ): CoachOverrideMeaning | null {
    if (!override.aiRecommendation || !override.coachDecision) {
      return null;
    }

    // Map override type to semantic override type
    const overrideTypeMap: Record<
      string,
      CoachOverrideMeaning["overrideType"]
    > = {
      training_load: "load-adjustment",
      session_modification: "session-modification",
      acwr_override: "threshold-override",
      recovery_protocol: "plan-change",
      other: "general",
    };

    return {
      type: "coach-override",
      overrideType: overrideTypeMap[override.overrideType] || "general",
      affectedEntity: `player-${override.playerId}`,
      aiRecommendation: override.aiRecommendation,
      coachDecision: override.coachDecision,
      coachId: override.coachId,
      coachName: this.getCoachName(override.coachId),
      reason: override.reason,
      timestamp: override.createdAt ? new Date(override.createdAt) : new Date(),
    };
  }

  /**
   * Load coach names for override notifications
   */
  private async loadCoachNames(overrides: CoachOverride[]): Promise<void> {
    const coachIds = [...new Set(overrides.map((o) => o.coachId))];
    const cache = { ...this.coachNamesCache() };

    // Only fetch names we don't have cached
    const missingIds = coachIds.filter((id) => !cache[id]);

    if (missingIds.length === 0) return;

    try {
      // Use 'users' table instead of 'profiles' (profiles table doesn't exist)
      const { profiles, error } =
        await this.playerDashboardDataService.fetchCoachProfiles(missingIds);

      if (error) {
        this.logger.error("[Dashboard] Error loading coach names:", error);
        return;
      }

      // Update cache
      profiles?.forEach((profile) => {
        cache[profile.id] = profile.full_name || "Your coach";
      });

      this.coachNamesCache.set(cache);
    } catch (error) {
      this.logger.error("[Dashboard] Error loading coach names:", error);
    }
  }

  /**
   * Get coach name from cache or return default
   */
  getCoachName(coachId: string): string {
    return this.coachNamesCache()[coachId] || "Your coach";
  }

  /**
   * Phase 2.1 - Load active ownership transitions for player
   */
  private async loadActiveTransitions(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      const transitions =
        await this.ownershipTransitionService.getPlayerTransitions(userId, 5);

      // Filter for active (pending or in_progress) transitions
      const active = transitions.filter(
        (t) => t.status === "pending" || t.status === "in_progress",
      );

      this.activeTransitions.set(active);
    } catch (error) {
      this.logger.error("[Dashboard] Error loading active transitions:", error);
    }
  }

  /**
   * Phase 2.2 - Load missing wellness data status
   */
  private async loadMissingWellnessStatus(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      const status =
        await this.missingDataDetectionService.checkMissingWellness(userId);
      this.missingWellnessStatus.set(status);
    } catch (error) {
      this.logger.error(
        "[Dashboard] Error loading missing wellness status:",
        error,
      );
    }
  }

  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      recovery_protocol: "🏈",
      load_cap: "⚠️",
      travel_recovery: "🛫",
      rtp_protocol: "🏥",
      wellness_focus: "💚",
    };
    return icons[type] || "📋";
  }

  private initializeWeekDays(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

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

  /**
   * Open direct message with the player's coach
   * Creates a 1:1 DM channel if it doesn't exist, then navigates to team chat
   * Uses TeamMembershipService for centralized team queries
   */
  async contactCoach(): Promise<void> {
    try {
      const teamId = this.teamMembershipService.teamId();
      if (!teamId) {
        this.toastService.warn(TOAST.WARN.NO_TEAM);
        this.router.navigate(["/team-chat"]);
        return;
      }

      // Get coach using centralized service
      const coach = await this.teamMembershipService.getTeamCoach();
      if (!coach?.userId) {
        this.toastService.warn(TOAST.WARN.NO_COACH);
        this.router.navigate(["/team-chat"]);
        return;
      }

      // Create or find existing DM channel with the coach
      const dmChannel = await this.channelService.createDirectMessage(
        coach.userId,
        teamId,
      );

      // Navigate to team chat with the DM channel selected
      this.router.navigate(["/team-chat"], {
        queryParams: { channel: dmChannel.id },
      });
    } catch (error) {
      this.logger.error("Error contacting coach:", error);
      this.toastService.error(TOAST.ERROR.CHAT_START_FAILED);
      // Fallback to team chat
      this.router.navigate(["/team-chat"]);
    }
  }

  /**
   * Check if user has completed onboarding/profile
   * Uses centralized ProfileCompletionService for consistency
   * UX Audit Fix #3
   */
  hasCompletedOnboarding(): boolean {
    // Use ProfileCompletionService for consistent calculation
    const status = this.profileCompletionService.completionStatus();
    // Profile is considered "complete" for onboarding if required fields are filled
    // or if percentage is >= 80% (allowing some optional fields to be missing)
    return status.missingRequired.length === 0 || status.percentage >= 80;
  }

  /**
   * Navigate to wellness check-in page
   * UX Audit Fix #4
   */
  navigateToWellness(): void {
    this.router.navigate(["/wellness"]);
  }

  /**
   * Navigate to ACWR details page
   * UX Audit Fix #5
   */
  navigateToACWR(): void {
    this.router.navigate(["/acwr"]);
  }

  /**
   * Check if wellness check-in is overdue (> 1 day since last check-in)
   * UX Audit Fix #4
   */
  checkinOverdue(): boolean {
    return this.daysSinceLastCheckin() > 1;
  }

  /**
   * Calculate days since last wellness check-in
   * UX Audit Fix #4
   */
  daysSinceLastCheckin(): number {
    const lastCheckin = this.lastWellnessCheckin();
    if (!lastCheckin) return 99; // Never checked in

    const now = new Date();
    const diffMs = now.getTime() - lastCheckin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(date: Date | null | undefined): string {
    return getTimeAgo(date);
  }

  getReadinessStatus(): string {
    const score = this.readinessScore();
    if (score === null) return "No data";
    return getReadinessLevel(score).label;
  }

  getReadinessSeverity():
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "secondary"
    | "primary" {
    const score = this.readinessScore();
    if (score === null) return "info";
    const severity = getReadinessLevel(score).severity;
    return severity === "warning" ? "warning" : severity;
  }

  getAcwrStatus(): string {
    const value = this.acwr();
    if (value === null) return "No data";
    if (value <= 1.0) return "Optimal";
    if (value <= 1.3) return "Elevated";
    return "High";
  }

  getAcwrSeverity():
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "secondary"
    | "primary" {
    const value = this.acwr();
    if (value === null) return "info";
    if (value <= 1.0) return "success";
    if (value <= 1.3) return "warning";
    return "danger";
  }

  getEventSeverity(
    type: string,
  ): "success" | "warning" | "danger" | "info" | "secondary" | "primary" {
    switch (type) {
      case "game":
        return "danger";
      case "tournament":
        return "warning";
      default:
        return "success";
    }
  }
}
