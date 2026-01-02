/**
 * Daily Protocol Component
 *
 * Main page for the Daily Training Protocol system.
 * Shows the complete daily training prescription:
 * - Morning Mobility
 * - Pre-Training Foam Roll
 * - Main Session (with AI-calculated progressions)
 * - Evening Recovery
 *
 * Each exercise has video, prescription, and HOW/FEEL/COMPENSATION text.
 * Completions are tracked and logged to ACWR and Wellness.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { ApiService } from '../../../core/services/api.service';
import { LoggerService } from '../../../core/services/logger.service';

import {
  BLOCK_CONFIG,
  BlockType,
  DailyProtocol,
  PrescribedExercise,
  ProtocolBlock,
} from './daily-protocol.models';

import { AchievementsPanelComponent } from './components/achievements-panel.component';
import { La28RoadmapComponent } from './components/la28-roadmap.component';
import {
  PlayerSettings,
  PlayerSettingsDialogComponent,
} from './components/player-settings-dialog.component';
import { ProtocolBlockComponent } from './components/protocol-block.component';
import {
  SessionLogData,
  SessionLogFormComponent,
} from './components/session-log-form.component';
import { TournamentCalendarComponent } from './components/tournament-calendar.component';
import {
  WeekDay,
  WeekProgressStripComponent,
  WeekStats,
} from './components/week-progress-strip.component';
import { WellnessCheckinComponent } from './components/wellness-checkin.component';

@Component({
  selector: 'app-daily-protocol',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    ProtocolBlockComponent,
    WeekProgressStripComponent,
    SessionLogFormComponent,
    PlayerSettingsDialogComponent,
    TournamentCalendarComponent,
    AchievementsPanelComponent,
    La28RoadmapComponent,
    WellnessCheckinComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Settings Dialog -->
    <app-player-settings-dialog
      [visible]="showSettingsDialog()"
      (visibleChange)="showSettingsDialog.set($event)"
      (settingsSaved)="onSettingsSaved($event)"
    ></app-player-settings-dialog>

    <div class="daily-protocol-page">
      <!-- Header -->
      <header class="protocol-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">Daily Training Protocol</h1>
            <p class="page-subtitle">{{ formattedDate() }}</p>
          </div>
          <div class="header-right">
            <!-- Settings Button -->
            <p-button
              icon="pi pi-cog"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              (onClick)="showSettingsDialog.set(true)"
              pTooltip="Training Settings"
              tooltipPosition="bottom"
            ></p-button>
            @if (protocol()) {
              <div class="readiness-badge" [class]="getReadinessClass()">
                <span class="readiness-value">{{ protocol()!.readinessScore ?? '--' }}</span>
                <span class="readiness-label">Readiness</span>
              </div>
              @if (protocol()!.acwrValue) {
                <div class="acwr-badge">
                  <span class="acwr-value">{{ protocol()!.acwrValue?.toFixed(2) }}</span>
                  <span class="acwr-label">ACWR</span>
                </div>
              }
            }
          </div>
        </div>

        <!-- AI Context Message -->
        @if (protocol()?.aiRationale) {
          <div class="ai-context-banner">
            <i class="pi pi-sparkles"></i>
            <span>{{ protocol()!.aiRationale }}</span>
          </div>
        }
      </header>

      <!-- Week Progress Strip -->
      @if (weekDays().length > 0) {
        <app-week-progress-strip
          [weekDays]="weekDays()"
          [stats]="weekStats()"
        ></app-week-progress-strip>
      }

      <!-- Tournament Calendar (collapsed by default) -->
      @if (showTournamentCalendar()) {
        <app-tournament-calendar
          [isCoach]="false"
          (tournamentChanged)="onTournamentChanged()"
        ></app-tournament-calendar>
      }

      <!-- Toggle Tournament Calendar Button -->
      <div class="calendar-toggle">
        <p-button
          [label]="showTournamentCalendar() ? 'Hide Tournaments' : 'Show Tournaments'"
          [icon]="showTournamentCalendar() ? 'pi pi-chevron-up' : 'pi pi-trophy'"
          [text]="true"
          size="small"
          (onClick)="showTournamentCalendar.set(!showTournamentCalendar())"
        ></p-button>
      </div>

      <!-- Main Content -->
      <main class="protocol-content">
        @if (isLoading()) {
          <!-- Loading State -->
          <div class="loading-state">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="skeleton-block">
                <p-skeleton width="100%" height="80px" styleClass="mb-3"></p-skeleton>
              </div>
            }
          </div>
        } @else if (error()) {
          <!-- Error State -->
          <div class="error-state">
            <i class="pi pi-exclamation-circle"></i>
            <h3>Unable to load protocol</h3>
            <p>{{ error() }}</p>
            <p-button
              label="Retry"
              icon="pi pi-refresh"
              (onClick)="loadProtocol()"
            ></p-button>
          </div>
        } @else if (protocol()) {
          <!-- Wellness Check-in -->
          <app-wellness-checkin
            [date]="currentDate()"
            (checkinComplete)="onWellnessCheckinComplete($event)"
          ></app-wellness-checkin>

          <!-- Overall Progress -->
          <div class="overall-progress">
            <div class="progress-header">
              <span class="progress-label">Today's Progress</span>
              <span class="progress-value">{{ protocol()!.overallProgress }}%</span>
            </div>
            <div class="progress-bar-track">
              <div
                class="progress-bar-fill"
                [style.width.%]="protocol()!.overallProgress"
              ></div>
            </div>
            <span class="progress-detail">
              {{ protocol()!.completedExercises }}/{{ protocol()!.totalExercises }} exercises
            </span>
          </div>

          <!-- Protocol Blocks -->
          <div class="protocol-blocks">
            <!-- Morning Mobility -->
            <app-protocol-block
              [block]="protocol()!.morningMobility"
              [defaultExpanded]="shouldExpandBlock('morning_mobility')"
              (exerciseComplete)="onExerciseComplete($event)"
              (exerciseSkip)="onExerciseSkip($event)"
              (markAllComplete)="onMarkAllComplete($event)"
              (skipBlock)="onSkipBlock($event)"
            ></app-protocol-block>

            <!-- Pre-Training Foam Roll -->
            <app-protocol-block
              [block]="protocol()!.foamRoll"
              [defaultExpanded]="shouldExpandBlock('foam_roll')"
              (exerciseComplete)="onExerciseComplete($event)"
              (exerciseSkip)="onExerciseSkip($event)"
              (markAllComplete)="onMarkAllComplete($event)"
              (skipBlock)="onSkipBlock($event)"
            ></app-protocol-block>

            <!-- Main Session -->
            <app-protocol-block
              [block]="protocol()!.mainSession"
              [defaultExpanded]="shouldExpandBlock('main_session')"
              (exerciseComplete)="onExerciseComplete($event)"
              (exerciseSkip)="onExerciseSkip($event)"
              (markAllComplete)="onMarkAllComplete($event)"
              (skipBlock)="onSkipBlock($event)"
            ></app-protocol-block>

            <!-- Session Log Form (appears after main session) -->
            @if (showSessionLogForm()) {
              <app-session-log-form
                [protocolId]="protocol()!.id"
                [expectedDuration]="protocol()!.mainSession.estimatedDurationMinutes"
                (submit)="onSessionLogSubmit($event)"
              ></app-session-log-form>
            }

            <!-- Evening Recovery -->
            <app-protocol-block
              [block]="protocol()!.eveningRecovery"
              [defaultExpanded]="shouldExpandBlock('evening_recovery')"
              (exerciseComplete)="onExerciseComplete($event)"
              (exerciseSkip)="onExerciseSkip($event)"
              (markAllComplete)="onMarkAllComplete($event)"
              (skipBlock)="onSkipBlock($event)"
            ></app-protocol-block>
          </div>

          <!-- Day Complete Celebration -->
          @if (protocol()!.overallProgress >= 100) {
            <div class="day-complete-banner">
              <div class="celebration-icon">🎉</div>
              <h3>Protocol Complete!</h3>
              <p>Great work today. Your progress has been logged.</p>
              @if (protocol()!.actualLoadAu) {
                <div class="final-stats">
                  <div class="stat">
                    <span class="stat-value">{{ protocol()!.actualLoadAu }}</span>
                    <span class="stat-label">Total Load (AU)</span>
                  </div>
                  @if (protocol()!.actualRpe) {
                    <div class="stat">
                      <span class="stat-value">{{ protocol()!.actualRpe }}</span>
                      <span class="stat-label">Session RPE</span>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Achievements & Roadmap Row -->
          <div class="gamification-row">
            <app-achievements-panel></app-achievements-panel>
            <app-la28-roadmap></app-la28-roadmap>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="empty-state">
            <i class="pi pi-calendar"></i>
            <h3>No protocol for today</h3>
            <p>Your training protocol will be generated based on your readiness and goals.</p>
            <p-button
              label="Generate Protocol"
              icon="pi pi-sparkles"
              (onClick)="generateProtocol()"
            ></p-button>
          </div>
        }
      </main>

      <!-- Navigation -->
      <footer class="protocol-footer">
        <p-button
          label="Previous Day"
          icon="pi pi-chevron-left"
          [outlined]="true"
          (onClick)="navigateDay(-1)"
        ></p-button>
        @if (!isToday()) {
          <p-button
            label="Today"
            icon="pi pi-calendar"
            (onClick)="goToToday()"
          ></p-button>
        }
        <p-button
          label="Next Day"
          icon="pi pi-chevron-right"
          iconPos="right"
          [outlined]="true"
          (onClick)="navigateDay(1)"
          [disabled]="isToday()"
        ></p-button>
      </footer>
    </div>
  `,
  styleUrl: './daily-protocol.component.scss',
})
export class DailyProtocolComponent implements OnInit {
  // Services
  private api = inject(ApiService);
  private logger = inject(LoggerService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // State
  protocol = signal<DailyProtocol | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentDate = signal(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  showSettingsDialog = signal(false);
  showTournamentCalendar = signal(false);

  // Week data
  weekDays = signal<WeekDay[]>([]);
  weekStats = signal<WeekStats>({
    completedDays: 0,
    totalTrainingDays: 5,
    weeklyLoadAu: 0,
    targetLoadAu: 2000,
    currentStreak: 0,
  });

  // Computed
  formattedDate = computed(() => {
    const date = new Date(this.currentDate());
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  isToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.currentDate() === today;
  });

  showSessionLogForm = computed(() => {
    const p = this.protocol();
    if (!p) return false;
    // Show form when main session is complete but no RPE logged yet
    return (
      p.mainSession.status === 'complete' &&
      !p.actualRpe &&
      p.overallProgress < 100
    );
  });

  ngOnInit(): void {
    // Check for date in route params
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['date']) {
        this.currentDate.set(params['date']);
      }
      this.loadProtocol();
      this.loadWeekData();
    });
  }

  // Data Loading
  async loadProtocol(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await this.api
        .get(`/api/daily-protocol?date=${this.currentDate()}`)
        .toPromise();

      if (response?.success && response.data) {
        this.protocol.set(this.transformProtocol(response.data));
      } else {
        this.protocol.set(null);
      }
    } catch (err: unknown) {
      this.logger.error('Failed to load daily protocol', err);
      this.error.set('Failed to load your daily protocol. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadWeekData(): Promise<void> {
    // Generate week days (Mon-Sun)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days: WeekDay[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        status: isToday ? 'planned' : i < dayOfWeek - 1 ? 'empty' : 'empty',
        isToday,
      });
    }

    this.weekDays.set(days);

    // TODO: Fetch actual week stats from API
    this.weekStats.set({
      completedDays: 0,
      totalTrainingDays: 5,
      weeklyLoadAu: 0,
      targetLoadAu: 2000,
      currentStreak: 0,
    });
  }

  // Transform API response to match our interface
  private transformProtocol(data: DailyProtocol): DailyProtocol {
    // Ensure blocks have proper structure
    const ensureBlock = (
      block: ProtocolBlock | undefined,
      type: BlockType
    ): ProtocolBlock => {
      const config = BLOCK_CONFIG[type];
      const exercises = block?.exercises || [];

      return {
        type,
        title: config.title,
        icon: config.icon,
        status: block?.status || 'pending',
        exercises,
        completedCount:
          exercises.filter((e) => e.status === 'complete').length,
        totalCount: exercises.length,
        progressPercent:
          exercises.length > 0
            ? Math.round(
                (exercises.filter((e) => e.status === 'complete').length /
                  exercises.length) *
                  100
              )
            : 0,
        completedAt: block?.completedAt,
        estimatedDurationMinutes: block?.estimatedDurationMinutes,
        aiNote: block?.aiNote,
      };
    };

    return {
      ...data,
      morningMobility: ensureBlock(data.morningMobility, 'morning_mobility'),
      foamRoll: ensureBlock(data.foamRoll, 'foam_roll'),
      mainSession: ensureBlock(data.mainSession, 'main_session'),
      eveningRecovery: ensureBlock(data.eveningRecovery, 'evening_recovery'),
    };
  }

  // Event Handlers
  async onExerciseComplete(exercise: PrescribedExercise): Promise<void> {
    try {
      await this.api
        .post('/api/daily-protocol/complete', {
          protocolExerciseId: exercise.id,
        })
        .toPromise();

      // Update local state
      this.updateExerciseStatus(exercise.id, 'complete');

      this.messageService.add({
        severity: 'success',
        summary: 'Exercise Complete',
        detail: `${exercise.exercise.name} marked as done!`,
        life: 2000,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to complete exercise', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save progress. Please try again.',
      });
    }
  }

  async onExerciseSkip(exercise: PrescribedExercise): Promise<void> {
    try {
      await this.api
        .post('/api/daily-protocol/skip', {
          protocolExerciseId: exercise.id,
        })
        .toPromise();

      this.updateExerciseStatus(exercise.id, 'skipped');
    } catch (err: unknown) {
      this.logger.error('Failed to skip exercise', err);
    }
  }

  async onMarkAllComplete(block: ProtocolBlock): Promise<void> {
    try {
      await this.api
        .post('/api/daily-protocol/complete-block', {
          protocolId: this.protocol()!.id,
          blockType: block.type,
        })
        .toPromise();

      // Reload protocol to get updated state
      await this.loadProtocol();

      this.messageService.add({
        severity: 'success',
        summary: 'Block Complete',
        detail: `${block.title} completed!`,
        life: 2000,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to complete block', err);
    }
  }

  async onSkipBlock(block: ProtocolBlock): Promise<void> {
    try {
      await this.api
        .post('/api/daily-protocol/skip-block', {
          protocolId: this.protocol()!.id,
          blockType: block.type,
        })
        .toPromise();

      await this.loadProtocol();
    } catch (err: unknown) {
      this.logger.error('Failed to skip block', err);
    }
  }

  async onSessionLogSubmit(logData: SessionLogData): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await this.api
        .post('/api/daily-protocol/log-session', {
          protocolId: this.protocol()!.id,
          ...logData,
        })
        .toPromise();

      await this.loadProtocol();

      // Show session logged message
      this.messageService.add({
        severity: 'success',
        summary: 'Session Logged',
        detail: 'Your training session has been recorded!',
        life: 3000,
      });

      // Show streak update if available
      const streak = response?.streak || response?.data?.streak;
      if (streak) {
        const streakMsg = streak.isNewRecord
          ? `🔥 New streak record: ${streak.newStreak} days!`
          : `🔥 Training streak: ${streak.newStreak} days`;
        
        this.messageService.add({
          severity: streak.isNewRecord ? 'warn' : 'info',
          summary: 'Streak Updated',
          detail: streakMsg,
          life: 5000,
        });
      }
    } catch (err: unknown) {
      this.logger.error('Failed to log session', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to log session. Please try again.',
      });
    }
  }

  async generateProtocol(): Promise<void> {
    this.isLoading.set(true);

    try {
      await this.api
        .post('/api/daily-protocol/generate', {
          date: this.currentDate(),
        })
        .toPromise();

      await this.loadProtocol();

      this.messageService.add({
        severity: 'success',
        summary: 'Protocol Generated',
        detail: 'Your daily training protocol is ready!',
        life: 3000,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to generate protocol', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate protocol. Please try again.',
      });
      this.isLoading.set(false);
    }
  }

  // Helpers
  private updateExerciseStatus(
    exerciseId: string,
    status: 'complete' | 'skipped'
  ): void {
    const p = this.protocol();
    if (!p) return;

    // Update exercise in all blocks
    const updateBlock = (block: ProtocolBlock) => {
      const updated = block.exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, status, completedAt: status === 'complete' ? new Date() : undefined }
          : e
      );
      const completedCount = updated.filter(
        (e) => e.status === 'complete'
      ).length;

      return {
        ...block,
        exercises: updated,
        completedCount,
        progressPercent:
          updated.length > 0
            ? Math.round((completedCount / updated.length) * 100)
            : 0,
      };
    };

    const updatedProtocol: DailyProtocol = {
      ...p,
      morningMobility: updateBlock(p.morningMobility),
      foamRoll: updateBlock(p.foamRoll),
      mainSession: updateBlock(p.mainSession),
      eveningRecovery: updateBlock(p.eveningRecovery),
    };

    // Recalculate overall progress
    const totalExercises =
      updatedProtocol.morningMobility.totalCount +
      updatedProtocol.foamRoll.totalCount +
      updatedProtocol.mainSession.totalCount +
      updatedProtocol.eveningRecovery.totalCount;

    const completedExercises =
      updatedProtocol.morningMobility.completedCount +
      updatedProtocol.foamRoll.completedCount +
      updatedProtocol.mainSession.completedCount +
      updatedProtocol.eveningRecovery.completedCount;

    updatedProtocol.totalExercises = totalExercises;
    updatedProtocol.completedExercises = completedExercises;
    updatedProtocol.overallProgress =
      totalExercises > 0
        ? Math.round((completedExercises / totalExercises) * 100)
        : 0;

    this.protocol.set(updatedProtocol);
  }

  shouldExpandBlock(type: BlockType): boolean {
    const p = this.protocol();
    if (!p) return type === 'morning_mobility';

    // Expand the first incomplete block, or the first one if all complete
    const blocks = [
      p.morningMobility,
      p.foamRoll,
      p.mainSession,
      p.eveningRecovery,
    ];

    const firstIncomplete = blocks.find(
      (b) => b.status !== 'complete' && b.status !== 'skipped'
    );

    if (firstIncomplete) {
      return firstIncomplete.type === type;
    }

    return type === 'morning_mobility';
  }

  getReadinessClass(): string {
    const score = this.protocol()?.readinessScore;
    if (!score) return '';
    if (score >= 70) return '';
    if (score >= 40) return 'moderate';
    return 'low';
  }

  // Navigation
  navigateDay(delta: number): void {
    const current = new Date(this.currentDate());
    current.setDate(current.getDate() + delta);
    const newDate = current.toISOString().split('T')[0];

    this.currentDate.set(newDate);
    this.router.navigate(['/training/protocol', newDate]);
  }

  goToToday(): void {
    const today = new Date().toISOString().split('T')[0];
    this.currentDate.set(today);
    this.router.navigate(['/training']);
  }

  // Settings
  onSettingsSaved(settings: PlayerSettings): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Settings Saved',
      detail: 'Your training settings have been updated. Regenerate protocol to apply changes.',
      life: 4000,
    });
  }

  // Tournament Calendar
  onTournamentChanged(): void {
    // Reload protocol to pick up any taper changes
    this.loadProtocol();
  }

  // Wellness Check-in
  onWellnessCheckinComplete(result: { readinessScore: number; recommendation: string }): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Wellness Logged',
      detail: `Readiness: ${result.readinessScore}. ${result.recommendation}`,
      life: 4000,
    });
    
    // Reload protocol to update with new readiness data
    this.loadProtocol();
  }
}
