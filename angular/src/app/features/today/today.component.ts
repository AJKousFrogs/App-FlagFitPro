/**
 * Today's Practice Component
 *
 * The primary daily training hub for athletes. Displays:
 * - Personalized greeting based on time of day
 * - Key metrics (ACWR, Readiness)
 * - Weekly progress overview
 * - Phase-aware content (check-in → protocol → wrap-up)
 * - Daily schedule timeline
 *
 * Design System: PrimeNG 21+ with Aura preset
 * @see docs/PRIMENG_DESIGN_SYSTEM_RULES.md
 *
 * @author FlagFit Pro Team
 * @version 2.0.0 - Angular 21 Signals Architecture
 */

import { animate, style, transition, trigger } from '@angular/animations';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

// Layout & Components
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { PostTrainingRecoveryComponent } from '../../shared/components/post-training-recovery/post-training-recovery.component';
import { TodaysScheduleComponent } from '../../shared/components/todays-schedule/todays-schedule.component';
import { ProtocolBlockComponent } from '../training/daily-protocol/components/protocol-block.component';
import {
    WeekDay,
    WeekProgressStripComponent,
} from '../training/daily-protocol/components/week-progress-strip.component';
import { WellnessCheckinComponent } from '../training/daily-protocol/components/wellness-checkin.component';
import { DailyProtocol } from '../training/daily-protocol/daily-protocol.models';

// Services
import { DataSourceService } from '../../core/services/data-source.service';
import { HeaderService } from '../../core/services/header.service';
import { LoggerService } from '../../core/services/logger.service';
import { UnifiedTrainingService } from '../../core/services/unified-training.service';

// Types
type DayPhase = 'morning' | 'midday' | 'evening';
type ActiveFocus = 'checkin' | 'protocol' | 'wrapup';
type TagSeverity = 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast';

@Component({
  selector: 'app-today',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CardModule,
    MessageModule,
    ProgressBarModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    MainLayoutComponent,
    TodaysScheduleComponent,
    WellnessCheckinComponent,
    ProtocolBlockComponent,
    PostTrainingRecoveryComponent,
    WeekProgressStripComponent,
  
    ButtonComponent,
  ],
  providers: [MessageService],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  templateUrl: './today.component.html',
  styles: [`
    /* ==========================================================================
       TODAY'S PRACTICE - Design System Compliant Styles
       Uses tokens from: assets/styles/design-system-tokens.scss
       ========================================================================== */

    /* --------------------------------------------------------------------------
       LAYOUT CONTAINER
       -------------------------------------------------------------------------- */
    .today-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-5) var(--space-4);
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    /* --------------------------------------------------------------------------
       ONBOARDING BANNER (First-time users)
       -------------------------------------------------------------------------- */
    .onboarding-banner {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    :host ::ng-deep .onboarding-card {
      background: var(--color-brand-primary) !important;
      border: none;
      border-radius: var(--radius-lg);
    }

    :host ::ng-deep .onboarding-card .p-card-body {
      padding: var(--space-5);
    }

    :host ::ng-deep .onboarding-card .p-card-content {
      padding: 0;
    }

    .onboarding-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-6);
      color: var(--color-text-on-primary);
    }

    .onboarding-info {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .onboarding-avatar {
      width: 3rem;
      height: 3rem;
      min-width: 3rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-heading-sm);
    }

    .onboarding-text h2 {
      margin: 0;
      font-size: var(--font-heading-sm);
      font-weight: var(--font-weight-semibold);
    }

    .onboarding-text p {
      margin: var(--space-1) 0 0;
      font-size: var(--font-body-sm);
      opacity: 0.9;
    }

    /* --------------------------------------------------------------------------
       WELCOME CARD
       -------------------------------------------------------------------------- */
    :host ::ng-deep .welcome-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
    }

    :host ::ng-deep .welcome-card .p-card-body {
      padding: var(--space-4);
    }

    :host ::ng-deep .welcome-card .p-card-content {
      padding: 0;
    }

    .welcome-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .user-avatar {
      width: 3rem;
      height: 3rem;
      min-width: 3rem;
      background: var(--surface-tertiary);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      font-size: var(--font-heading-sm);
      border: 2px solid var(--color-border-secondary);
    }

    .welcome-text {
      flex: 1;
      min-width: 0;
    }

    .welcome-label {
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: var(--font-weight-medium);
    }

    .welcome-name {
      font-size: var(--font-heading-sm);
      font-weight: var(--font-weight-semibold);
      margin: 0;
      color: var(--color-text-primary);
    }

    .welcome-hint {
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
      margin: var(--space-1) 0 0;
    }

    /* --------------------------------------------------------------------------
       STATS GRID
       -------------------------------------------------------------------------- */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    :host ::ng-deep .stat-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
      cursor: pointer;
      transition: transform var(--hover-transition-fast), box-shadow var(--hover-transition-fast);
    }

    :host ::ng-deep .stat-card:hover {
      transform: var(--transform-hover-lift-subtle);
      box-shadow: var(--hover-shadow-sm);
    }

    :host ::ng-deep .stat-card .p-card-body {
      padding: var(--space-3);
    }

    :host ::ng-deep .stat-card .p-card-content {
      padding: 0;
    }

    .stat-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .stat-icon {
      width: 2.5rem;
      height: 2.5rem;
      min-width: 2.5rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .stat-icon.acwr {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .stat-icon.readiness {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .stat-info {
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      font-size: var(--font-heading-sm);
      font-weight: var(--font-weight-bold);
      line-height: 1.2;
      color: var(--color-text-primary);
    }

    .stat-value.optimal,
    .stat-value.high { color: var(--color-brand-primary); }
    .stat-value.moderate { color: var(--color-status-warning); }
    .stat-value.risk,
    .stat-value.low { color: var(--color-status-error); }

    .stat-label {
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.25px;
    }

    /* --------------------------------------------------------------------------
       WEEK PROGRESS CARD
       -------------------------------------------------------------------------- */
    :host ::ng-deep .week-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
    }

    :host ::ng-deep .week-card .p-card-body {
      padding: var(--space-3) var(--space-4);
    }

    :host ::ng-deep .week-card .p-card-content {
      padding: 0;
    }

    /* --------------------------------------------------------------------------
       CONTENT CARDS (Check-in, Protocol, Wrap-up)
       -------------------------------------------------------------------------- */
    .content-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    :host ::ng-deep .content-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
    }

    :host ::ng-deep .content-card .p-card-body {
      padding: var(--space-4);
    }

    :host ::ng-deep .content-card .p-card-content {
      padding: 0;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding-bottom: var(--space-3);
      margin-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-border-secondary);
    }

    .card-header-icon {
      font-size: 1rem;
      color: var(--color-brand-primary);
    }

    .card-header-title {
      flex: 1;
      font-size: var(--font-body-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .card-description {
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
      margin: 0 0 var(--space-4);
      line-height: 1.5;
    }

    /* --------------------------------------------------------------------------
       MERLIN INSIGHT CARD
       -------------------------------------------------------------------------- */
    :host ::ng-deep .insight-card {
      background: var(--color-brand-primary) !important;
      border: none;
      border-radius: var(--radius-lg);
    }

    :host ::ng-deep .insight-card .p-card-body {
      padding: var(--space-4);
    }

    :host ::ng-deep .insight-card .p-card-content {
      padding: 0;
    }

    :host ::ng-deep .insight-card .p-button-outlined {
      color: var(--color-text-on-primary);
      border-color: rgba(255, 255, 255, 0.5);
    }

    :host ::ng-deep .insight-card .p-button-outlined:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: white;
    }

    .insight-content {
      display: flex;
      gap: var(--space-4);
      color: var(--color-text-on-primary);
    }

    .insight-avatar {
      width: 2.75rem;
      height: 2.75rem;
      min-width: 2.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-heading-xs);
    }

    .insight-text {
      flex: 1;
    }

    .insight-title {
      margin: 0 0 var(--space-2);
      font-size: var(--font-body-md);
      font-weight: var(--font-weight-semibold);
    }

    .insight-message {
      margin: 0 0 var(--space-3);
      font-size: var(--font-body-sm);
      line-height: 1.6;
      opacity: 0.95;
    }

    /* --------------------------------------------------------------------------
       PROTOCOL SECTION
       -------------------------------------------------------------------------- */
    .protocol-progress-wrapper {
      background: var(--surface-tertiary);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
    }

    :host ::ng-deep .protocol-bar {
      height: 6px;
    }

    :host ::ng-deep .protocol-bar .p-progressbar-value {
      background: var(--color-brand-primary);
    }

    .protocol-meta {
      display: flex;
      justify-content: space-between;
      margin-top: var(--space-2);
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
    }

    .protocol-blocks {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .card-footer {
      margin-top: var(--space-4);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border-secondary);
      text-align: center;
    }

    /* --------------------------------------------------------------------------
       WRAP-UP ACTION CARDS
       -------------------------------------------------------------------------- */
    .action-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    :host ::ng-deep .action-card {
      cursor: pointer;
      border: 1px solid var(--color-border-secondary);
      border-radius: var(--radius-lg);
      box-shadow: none;
      transition: border-color var(--hover-transition-fast), background var(--hover-transition-fast);
    }

    :host ::ng-deep .action-card:hover {
      border-color: var(--color-brand-primary);
      background: var(--hover-bg-secondary);
    }

    :host ::ng-deep .action-card .p-card-body {
      padding: var(--space-3);
    }

    :host ::ng-deep .action-card .p-card-content {
      padding: 0;
    }

    .action-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .action-icon {
      width: 2.5rem;
      height: 2.5rem;
      min-width: 2.5rem;
      background: var(--ds-primary-green-ultra-subtle);
      color: var(--color-brand-primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .action-text {
      flex: 1;
    }

    .action-text h4 {
      margin: 0;
      font-size: var(--font-body-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .action-text p {
      margin: var(--space-1) 0 0;
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
    }

    .action-chevron {
      color: var(--color-text-muted);
      opacity: 0.5;
    }

    /* --------------------------------------------------------------------------
       EMPTY STATE
       -------------------------------------------------------------------------- */
    .empty-state {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      background: var(--surface-tertiary);
      border: 2px dashed var(--color-border-secondary);
      border-radius: var(--radius-lg);
    }

    .empty-state i {
      font-size: 2.5rem;
      color: var(--color-text-muted);
      opacity: 0.5;
      margin-bottom: var(--space-3);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2);
      font-size: var(--font-body-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .empty-state p {
      margin: 0 0 var(--space-4);
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
    }

    /* --------------------------------------------------------------------------
       SKELETON LOADING
       -------------------------------------------------------------------------- */
    .skeleton-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
      margin-top: var(--space-4);
    }

    /* --------------------------------------------------------------------------
       RESPONSIVE ADJUSTMENTS
       -------------------------------------------------------------------------- */
    @media (max-width: 640px) {
      .today-page {
        padding: var(--space-3);
        gap: var(--space-4);
      }

      .welcome-row {
        flex-direction: column;
        text-align: center;
      }

      .user-avatar {
        margin: 0 auto;
      }

      .welcome-cta {
        margin-top: var(--space-2);
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .onboarding-content {
        flex-direction: column;
        text-align: center;
      }

      .onboarding-info {
        flex-direction: column;
      }

      .insight-content {
        flex-direction: column;
        text-align: center;
      }

      .insight-avatar {
        margin: 0 auto;
      }
    }

    /* --------------------------------------------------------------------------
       ACCESSIBILITY - Reduced Motion
       -------------------------------------------------------------------------- */
    @media (prefers-reduced-motion: reduce) {
      :host ::ng-deep .stat-card,
      :host ::ng-deep .action-card {
        transition: none;
      }
    }
  `],
})
export class TodayComponent {
  // Dependency Injection (Angular 21 pattern)
  private readonly router = inject(Router);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly headerService = inject(HeaderService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);
  private readonly dataSourceService = inject(DataSourceService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // STATE SIGNALS
  // ============================================================================
  readonly protocol = signal<Partial<DailyProtocol> | null>(null);
  readonly showRecoveryDialog = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentTime = signal(new Date());

  // ============================================================================
  // DERIVED STATE FROM SERVICES
  // ============================================================================
  readonly userName = this.trainingService.userName;
  readonly acwrValue = this.trainingService.acwrRatio;
  readonly acwrRiskZone = this.trainingService.acwrRiskZone;
  readonly readinessScore = this.trainingService.readinessScore;
  readonly readinessLevel = this.trainingService.readinessLevel;
  readonly aiInsight = this.trainingService.aiInsight;
  readonly isLoading = this.trainingService.isRefreshing;
  readonly hasCheckedInToday = this.trainingService.hasCheckedInToday;
  readonly currentDate = signal(new Date().toISOString().split('T')[0]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  readonly isFirstTimeUser = computed(() => this.dataSourceService.isFirstTimeUser());

  readonly dayPhase = computed<DayPhase>(() => {
    const hour = this.currentTime().getHours();
    if (hour < 11) return 'morning';
    if (hour < 17) return 'midday';
    return 'evening';
  });

  readonly greetingPrefix = computed(() => {
    const greetings: Record<DayPhase, string> = {
      morning: 'Good Morning,',
      midday: 'Time to Train,',
      evening: 'Good Evening,',
    };
    return greetings[this.dayPhase()];
  });

  readonly dayPhaseMessage = computed(() => {
    if (!this.hasCheckedInToday()) return "Let's start with your readiness check.";
    if (this.dayPhase() === 'evening') return 'Time to review and recover.';
    return 'Follow your personalized protocol below.';
  });

  readonly activeFocus = computed<ActiveFocus>(() => {
    if (!this.hasCheckedInToday()) return 'checkin';
    if (this.dayPhase() === 'evening') return 'wrapup';
    return 'protocol';
  });

  readonly weekDays = computed<WeekDay[]>(() => {
    const schedule = this.trainingService.weeklySchedule();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return dayNames.map((dayName, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      const daySchedule = schedule.find(
        (s) => s.date && new Date(s.date).toISOString().split('T')[0] === dateStr
      );

      let status: WeekDay['status'] = 'empty';
      if (daySchedule) {
        status = daySchedule.sessions.length > 0 ? 'planned' : 'rest';
      }

      return {
        date: dateStr,
        dayName,
        dayNumber: date.getDate(),
        status,
        isToday,
      };
    });
  });

  readonly weekStats = computed(() => {
    const stats = this.trainingService.trainingStats();
    const streak = stats.find((s) => s.label === 'Current Streak')?.value || '0';
    const compliance = stats.find((s) => s.label === 'This Week')?.value || '0';

    return {
      completedDays: parseInt(compliance, 10),
      totalTrainingDays: 7,
      weeklyLoadAu: 0,
      targetLoadAu: 2000,
      currentStreak: parseInt(streak, 10),
    };
  });

  // ============================================================================
  // COMPUTED STATUS HELPERS
  // ============================================================================
  readonly acwrStatusLabel = computed(() => this.acwrRiskZone()?.label || 'Unknown');

  readonly acwrSeverity = computed<TagSeverity>(() => {
    const level = this.acwrRiskZone()?.level;
    const severityMap: Record<string, TagSeverity> = {
      'sweet-spot': 'success',
      'under-training': 'warn',
      'elevated-risk': 'warn',
      'danger-zone': 'danger',
      'no-data': 'secondary',
    };
    return severityMap[level ?? ''] ?? 'secondary';
  });

  readonly acwrClass = computed(() => {
    const level = this.acwrRiskZone()?.level;
    const classMap: Record<string, string> = {
      'sweet-spot': 'optimal',
      'under-training': 'moderate',
      'elevated-risk': 'moderate',
      'danger-zone': 'risk',
    };
    return classMap[level ?? ''] ?? '';
  });

  readonly readinessStatusLabel = computed(() => {
    const labelMap: Record<string, string> = {
      high: 'Great',
      moderate: 'Good',
      low: 'Low',
    };
    return labelMap[this.readinessLevel()] ?? 'Unknown';
  });

  readonly readinessSeverity = computed<TagSeverity>(() => {
    const severityMap: Record<string, TagSeverity> = {
      high: 'success',
      moderate: 'warn',
      low: 'danger',
    };
    return severityMap[this.readinessLevel()] ?? 'secondary';
  });

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================
  constructor() {
    this.headerService.setDashboardHeader();
    this.loadTodayData();

    // Update time every minute
    const interval = setInterval(() => this.currentTime.set(new Date()), 60000);
    this.destroyRef.onDestroy(() => clearInterval(interval));
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  private loadTodayData(): void {
    this.trainingService
      .getTodayOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.protocol.set((data?.protocol?.data as Partial<DailyProtocol>) ?? null);
          this.error.set(null);
        },
        error: (err) => {
          this.logger.error('Failed to load today data', err);
          this.error.set('Failed to load your training data. Please try again.');
        },
      });
  }

  refreshProtocol(): void {
    this.loadTodayData();
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  onWellnessComplete(result: { readinessScore: number }): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Wellness Logged',
      detail: `Readiness: ${result.readinessScore}. Let's optimize your session.`,
    });
    this.refreshProtocol();
  }

  openRecoveryDialog(): void {
    this.showRecoveryDialog.set(true);
  }

  closeRecoveryDialog(): void {
    this.showRecoveryDialog.set(false);
  }

  onRecoverySaved(): void {
    this.showRecoveryDialog.set(false);
    this.loadTodayData();
  }

  scrollToWellness(): void {
    document.getElementById('wellness-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  navigateToAcwr(): void {
    this.router.navigate(['/acwr']);
  }

  navigateToWellness(): void {
    this.router.navigate(['/wellness']);
  }
}
