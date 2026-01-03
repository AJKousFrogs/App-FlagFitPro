import { animate, style, transition, trigger } from "@angular/animations";
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    effect,
    inject,
    signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";

// Layout & Components
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PostTrainingRecoveryComponent } from "../../shared/components/post-training-recovery/post-training-recovery.component";
import { TodaysScheduleComponent } from "../../shared/components/todays-schedule/todays-schedule.component";
import { ProtocolBlockComponent } from "../training/daily-protocol/components/protocol-block.component";
import { WellnessCheckinComponent } from "../training/daily-protocol/components/wellness-checkin.component";
import { WeekProgressStripComponent, WeekDay } from "../training/daily-protocol/components/week-progress-strip.component";

// Services
import { DataSourceService } from "../../core/services/data-source.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";

import {
    AppLoadingComponent,
    ButtonComponent,
    CardComponent,
} from "../../shared/components/ui-components";

@Component({
  selector: "app-today",
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("slideDown", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(-20px)" }),
        animate("400ms ease-out", style({ opacity: 1, transform: "translateY(0)" })),
      ]),
    ]),
  ],
  imports: [
    RouterModule,
    ButtonModule,
    CardModule,
    ToastModule,
    TagModule,
    MainLayoutComponent,
    TodaysScheduleComponent,
    WellnessCheckinComponent,
    ProtocolBlockComponent,
    PostTrainingRecoveryComponent,
    WeekProgressStripComponent,
    AppLoadingComponent,
    ButtonComponent,
    CardComponent
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>
      
      <app-loading [visible]="isLoading()" variant="skeleton" message="Optimizing your day..."></app-loading>

      <!-- Smart Onboarding Overlay for New Users -->
      @if (isFirstTimeUser() && !hasCheckedInToday()) {
        <div class="onboarding-overlay" @slideDown>
          <div class="onboarding-card">
            <div class="merlin-welcome">
              <div class="avatar-ring">
                <i class="pi pi-sparkles"></i>
              </div>
              <div class="welcome-text">
                <h2>Welcome, {{ userName() || 'Athlete' }}!</h2>
                <p>I'm Merlin, your AI coach. To build your optimized training plan for today, I need to know how you're feeling.</p>
              </div>
            </div>
            <div class="onboarding-action">
              <app-button icon="arrow-down" (clicked)="scrollToWellness()">Start Your First Check-in</app-button>
            </div>
          </div>
        </div>
      }

      @if (!isLoading()) {
      <div class="today-container">
        <!-- Smart Greeting -->
        <header class="today-header">
          <div class="greeting-section">
            <span class="greeting-label">{{ greetingPrefix() }}</span>
            <h1 class="user-name">{{ userName() || 'Athlete' }}!</h1>
            <p class="day-hint">{{ dayPhaseMessage() }}</p>
          </div>
          
          <div class="status-summary-bar">
            <div class="metric-summary" [routerLink]="['/acwr']">
              <span class="label">ACWR</span>
              <span class="value" [class]="acwrRiskZone()">{{ acwrValue().toFixed(2) }}</span>
              <i class="pi pi-chevron-right"></i>
            </div>
            <div class="metric-summary" [routerLink]="['/wellness']">
              <span class="label">Readiness</span>
              <span class="value" [class]="readinessLevel()">{{ readinessScore() }}%</span>
              <i class="pi pi-chevron-right"></i>
            </div>
          </div>
        </header>

        <!-- Week Progress (Collapsible) -->
        <div class="week-summary-container">
          <app-week-progress-strip
            [weekDays]="weekDays()"
            [stats]="weekStats()"
          ></app-week-progress-strip>
        </div>

        <!-- Dynamic Content Based on Phase -->
        <main class="today-content">
          
          <!-- PHASE 1: Morning / Needs Check-in -->
          @if (activeFocus() === 'checkin') {
            <section class="action-section highlight">
              <div class="section-header">
                <h2 class="section-title">Morning Check-in</h2>
                <span class="priority-badge">Required</span>
              </div>
              <p class="section-desc">Start your day by logging your readiness. This optimizes your training protocol.</p>
              <app-wellness-checkin
                [date]="currentDate()"
                (checkinComplete)="onWellnessComplete($event)"
              ></app-wellness-checkin>
            </section>
          }

          <!-- Merlin's Insight (Always present but contextual) -->
          @if (aiInsight()) {
          <div class="ai-companion-card">
            <div class="ai-avatar">
              <i class="pi pi-sparkles"></i>
            </div>
            <div class="ai-content">
              <h3 class="ai-title">Merlin's Insight</h3>
              <p class="ai-message">{{ aiInsight() }}</p>
              <div class="ai-actions">
                <button pButton 
                        label="Discuss with Merlin" 
                        icon="pi pi-comments"
                        class="p-button-sm p-button-outlined"
                        [routerLink]="['/chat']"
                        [queryParams]="{ query: 'Tell me more about: ' + aiInsight() }"></button>
              </div>
            </div>
          </div>
          }

          <!-- PHASE 2: Midday / Training Focus -->
          @if (activeFocus() === 'protocol') {
            <section class="action-section">
              <div class="section-header">
                <h2 class="section-title">Today's Protocol</h2>
                @if (protocol()?.overallProgress === 100) {
                  <p-tag severity="success" value="Done" icon="pi pi-check"></p-tag>
                }
              </div>
              
              @if (protocol()) {
              <div class="protocol-progress">
                <div class="progress-bar-container">
                  <div class="progress-fill" [style.width.%]="protocol()?.overallProgress"></div>
                </div>
                <div class="progress-meta">
                  <span class="progress-text">{{ protocol()?.completedExercises }}/{{ protocol()?.totalExercises }} Exercises</span>
                  <span class="progress-percent">{{ protocol()?.overallProgress }}%</span>
                </div>
              </div>
              }

              @if (protocol()) {
              <div class="protocol-blocks">
                 <app-protocol-block
                  [block]="protocol()!.morningMobility"
                  (exerciseComplete)="loadProtocol()"
                ></app-protocol-block>

                @if (protocol()!.foamRoll?.totalCount > 0) {
                  <app-protocol-block
                    [block]="protocol()!.foamRoll"
                    (exerciseComplete)="loadProtocol()"
                  ></app-protocol-block>
                }
                
                <app-protocol-block
                  [block]="protocol()!.mainSession"
                  (exerciseComplete)="loadProtocol()"
                ></app-protocol-block>

                @if (protocol()!.eveningRecovery?.totalCount > 0) {
                  <app-protocol-block
                    [block]="protocol()!.eveningRecovery"
                    (exerciseComplete)="loadProtocol()"
                  ></app-protocol-block>
                }
                
                <div class="section-footer">
                  <button pButton label="Advanced Training Workspace" icon="pi pi-external-link" class="p-button-text" routerLink="/training/advanced"></button>
                </div>
              </div>
              }

              @if (!protocol() && !isLoading()) {
              <div class="empty-state-card">
                <i class="pi pi-calendar-plus"></i>
                <h3>No Training Plan Yet</h3>
                <p>We're still calculating your optimized path for today.</p>
                <button pButton label="Refresh Protocol" icon="pi pi-refresh" (click)="loadProtocol()"></button>
              </div>
              }
            </section>
          }

          <!-- PHASE 3: Evening / Wrap-up Focus -->
          @if (activeFocus() === 'wrapup') {
            <section class="action-section highlight">
              <div class="section-header">
                <h2 class="section-title">Evening Wrap-up</h2>
                <p-tag severity="info" value="Recovery Time"></p-tag>
              </div>
              <p class="section-desc">Great job today! How did your training feel? Log your effort to keep your ACWR accurate.</p>
              
              <div class="wrapup-card">
                <div class="wrapup-item" (click)="openRecoveryDialog()">
                  <div class="item-icon"><i class="pi pi-book"></i></div>
                  <div class="item-text">
                    <h4>Log Session Effort (RPE)</h4>
                    <p>Tell Merlin how hard you worked.</p>
                  </div>
                  <i class="pi pi-chevron-right"></i>
                </div>
                <div class="wrapup-item" routerLink="/wellness">
                  <div class="item-icon"><i class="pi pi-heart"></i></div>
                  <div class="item-text">
                    <h4>Review Recovery Stats</h4>
                    <p>Check your trends and sleep debt.</p>
                  </div>
                  <i class="pi pi-chevron-right"></i>
                </div>
              </div>
            </section>
          }

          <!-- Global Secondary: Today schedule -->
          <section class="action-section secondary">
            <h2 class="section-title">Today schedule</h2>
            <app-todays-schedule></app-todays-schedule>
          </section>
        </main>
      </div>
      }

      <!-- Recovery Dialog (Triggered manually or via wrap-up) -->
      @if (showRecoveryDialog()) {
        <app-post-training-recovery
          [sessionName]="'Today\'s Training'"
          (closed)="closeRecoveryDialog()"
          (saved)="onRecoverySaved($event)"
        ></app-post-training-recovery>
      }
    </app-main-layout>
  `,
  styles: [`
    .today-container {
      padding: var(--spacing-4);
      max-width: 800px;
      margin: 0 auto;
    }
    .today-header {
      margin-bottom: var(--spacing-8);
    }
    .greeting-section {
      margin-bottom: var(--spacing-6);
    }
    .greeting-label {
      font-size: var(--font-size-sm);
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .user-name {
      font-size: var(--font-size-3xl);
      font-weight: 800;
      margin: 0;
      color: var(--text-primary);
    }
    .day-hint {
      color: var(--text-color-secondary);
      margin-top: var(--spacing-1);
      font-size: var(--font-size-md);
    }
    .status-summary-bar {
      display: flex;
      gap: var(--spacing-4);
      margin-top: var(--spacing-6);
    }
    .metric-summary {
      flex: 1;
      background: var(--surface-card);
      padding: var(--spacing-4);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      border: 1px solid var(--surface-border);
      transition: border-color var(--transition-fast), transform var(--transition-fast);
    }
    .metric-summary:hover {
      border-color: var(--ds-primary-green);
      transform: translateY(-2px);
    }
    .metric-summary .label {
      font-size: var(--font-size-xs);
      color: var(--text-color-secondary);
    }
    .metric-summary .value {
      font-weight: 700;
      font-size: var(--font-size-lg);
    }
    .ai-companion-card {
      background: var(--ds-primary-green-gradient, linear-gradient(135deg, #089949 0%, #036d35 100%));
      color: white;
      padding: var(--spacing-6);
      border-radius: var(--radius-xl);
      display: flex;
      gap: var(--spacing-4);
      margin-bottom: var(--spacing-8);
      box-shadow: var(--shadow-md);
    }
    .ai-avatar {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.2);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .ai-title {
      margin: 0 0 var(--spacing-2) 0;
      font-size: var(--font-size-md);
      font-weight: 700;
    }
    .ai-message {
      margin: 0 0 var(--spacing-4) 0;
      font-size: var(--font-size-sm);
      line-height: 1.6;
      opacity: 0.95;
    }
    .action-section {
      margin-bottom: var(--spacing-6);
      background: var(--surface-card);
      padding: var(--spacing-4);
      border-radius: var(--radius-xl);
      border: 1px solid var(--surface-border);
    }
    .action-section.highlight {
      border-left: 4px solid var(--ds-primary-green);
      background: var(--surface-primary);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-4);
    }
    .section-title {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 700;
    }
    .section-desc {
      color: var(--text-color-secondary);
      margin-bottom: var(--spacing-6);
      font-size: var(--font-size-sm);
    }
    .priority-badge {
      background: var(--color-status-error-subtle);
      color: var(--color-status-error);
      padding: var(--spacing-1) var(--spacing-3);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
    }
    .protocol-progress {
      margin-bottom: var(--spacing-6);
      background: var(--surface-ground);
      padding: var(--spacing-4);
      border-radius: var(--radius-lg);
    }
    .progress-bar-container {
      height: 10px;
      background: var(--surface-200);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--spacing-3);
    }
    .progress-fill {
      height: 100%;
      background: var(--ds-primary-green);
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .progress-meta {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--text-color-secondary);
    }
    .wrapup-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
    }
    .wrapup-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      padding: var(--spacing-4);
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
      border: 1px solid transparent;
    }
    .wrapup-item:hover {
      background: var(--surface-hover);
      border-color: var(--ds-primary-green);
    }
    .item-icon {
      width: 40px;
      height: 40px;
      background: var(--ds-primary-green-subtle);
      color: var(--ds-primary-green);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .item-text {
      flex: 1;
    }
    .item-text h4 {
      margin: 0;
      font-size: var(--font-size-sm);
      font-weight: 700;
    }
    .item-text p {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--text-color-secondary);
    }
    .empty-state-card {
      text-align: center;
      padding: var(--spacing-12) var(--spacing-4);
      background: var(--surface-ground);
      border: 2px dashed var(--surface-border);
      border-radius: var(--radius-lg);
    }
    .section-footer {
      margin-top: var(--spacing-6);
      padding-top: var(--spacing-4);
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: center;
    }
    
    /* Onboarding Styles */
    .onboarding-overlay {
      background: var(--surface-primary);
      padding: var(--spacing-6);
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      justify-content: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-md);
    }
    .onboarding-card {
      max-width: 600px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-6);
      
      @media (max-width: 640px) {
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-4);
      }
    }
    .merlin-welcome {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      
      @media (max-width: 640px) {
        flex-direction: column;
      }
    }
    .avatar-ring {
      width: 56px;
      height: 56px;
      background: var(--ds-primary-green-gradient);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      flex-shrink: 0;
      animation: pulse 2s infinite;
    }
    .welcome-text h2 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: 800;
    }
    .welcome-text p {
      margin: var(--spacing-1) 0 0 0;
      font-size: var(--font-size-sm);
      color: var(--text-color-secondary);
      line-height: 1.4;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(8, 153, 73, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(8, 153, 73, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(8, 153, 73, 0); }
    }
  `]
})
export class TodayComponent {
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly headerService = inject(HeaderService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);
  private readonly dataSourceService = inject(DataSourceService);
  private readonly destroyRef = inject(DestroyRef);

  // State Signals
  readonly protocol = signal<any>(null);
  readonly wellnessCompleted = signal(false);
  readonly currentDate = signal(new Date().toISOString().split('T')[0]);
  readonly showRecoveryDialog = signal(false);

  // Week data logic
  readonly weekDays = computed(() => {
    const schedule = this.trainingService.weeklySchedule();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      const daySchedule = schedule.find(s => s.date && new Date(s.date).toISOString().split('T')[0] === dateStr);
      
      let status: WeekDay['status'] = 'empty';
      if (daySchedule) {
        status = daySchedule.sessions.length > 0 ? 'planned' : 'rest';
      }

      days.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        status,
        isToday,
      });
    }
    return days;
  });
  
  readonly weekStats = computed(() => {
    const stats = this.trainingService.trainingStats();
    const streak = stats.find(s => s.label === 'Current Streak')?.value || '0';
    const compliance = stats.find(s => s.label === 'This Week')?.value || '0';
    
    return {
      completedDays: parseInt(compliance),
      totalTrainingDays: 7,
      weeklyLoadAu: 0,
      targetLoadAu: 2000,
      currentStreak: parseInt(streak),
    };
  });
  
  // Facade Signals from Unified Service
  readonly userName = this.trainingService.userName;
  readonly acwrValue = this.trainingService.acwrRatio;
  readonly acwrRiskZone = this.trainingService.acwrRiskZone;
  readonly readinessScore = this.trainingService.readinessScore;
  readonly readinessLevel = this.trainingService.readinessLevel;
  readonly aiInsight = this.trainingService.aiInsight;
  readonly isLoading = this.trainingService.isRefreshing;
  readonly hasCheckedInToday = this.trainingService.hasCheckedInToday;
  
  readonly isFirstTimeUser = computed(() => this.dataSourceService.isFirstTimeUser());

  // Time-of-day logic
  readonly currentTime = signal(new Date());
  readonly dayPhase = computed(() => {
    const hour = this.currentTime().getHours();
    if (hour < 11) return 'morning';
    if (hour < 17) return 'midday';
    return 'evening';
  });

  readonly greetingPrefix = computed(() => {
    switch(this.dayPhase()) {
      case 'morning': return 'Good Morning,';
      case 'midday': return 'Time to Train,';
      case 'evening': return 'Good Evening,';
      default: return 'Hello,';
    }
  });

  readonly dayPhaseMessage = computed(() => {
    if (!this.hasCheckedInToday()) return 'Let\'s start with your readiness check.';
    if (this.dayPhase() === 'evening') return 'Time to review and recover.';
    return 'Follow your personalized protocol below.';
  });

  // Smart focus logic
  readonly activeFocus = computed(() => {
    if (!this.hasCheckedInToday()) return 'checkin';
    if (this.dayPhase() === 'evening') return 'wrapup';
    return 'protocol';
  });

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.headerService.setDashboardHeader();
    this.loadTodayData();
    
    // Update time every minute using effect for cleanup
    const interval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000);
    
    this.destroyRef.onDestroy(() => clearInterval(interval));
  }

  private loadTodayData() {
    this.trainingService.getTodayOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (data) {
          this.protocol.set(data.protocol?.data);
        }
      });
  }

  loadProtocol() {
    this.loadTodayData();
  }

  onWellnessComplete(result: any) {
    this.wellnessCompleted.set(true);
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Wellness Logged', 
      detail: `Readiness: ${result.readinessScore}. Let's optimize your session.` 
    });
    this.loadProtocol();
  }

  async generateProtocol() {
    this.trainingService.getTodayOverview().subscribe();
  }

  openRecoveryDialog() {
    this.showRecoveryDialog.set(true);
  }

  closeRecoveryDialog() {
    this.showRecoveryDialog.set(false);
  }

  onRecoverySaved(data: any) {
    this.showRecoveryDialog.set(false);
    this.loadTodayData(); // Refresh to update ACWR after logging
  }

  scrollToWellness() {
    const el = document.getElementById('wellness-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}
