import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { TrafficLightIndicatorComponent, TrafficLightStatus } from "../../shared/components/traffic-light-indicator/traffic-light-indicator.component";
import { TrendCardComponent, TrendData } from "../../shared/components/trend-card/trend-card.component";
import { ReadinessWidgetComponent } from "../../shared/components/readiness-widget/readiness-widget.component";
import { LiveIndicatorComponent } from "../../shared/components/live-indicator/live-indicator.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { AcwrService } from "../../core/services/acwr.service";
import { ReadinessService } from "../../core/services/readiness.service";
import { TrendsService } from "../../core/services/trends.service";
import { HeaderService } from "../../core/services/header.service";
import { TrainingDataService } from "../../core/services/training-data.service";
import { RealtimeBaseComponent } from "../../shared/components/realtime-base.component";

@Component({
  selector: "app-athlete-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ButtonModule,
    MainLayoutComponent,
    PageHeaderComponent,
    TrafficLightIndicatorComponent,
    TrendCardComponent,
    ReadinessWidgetComponent,
    LiveIndicatorComponent,
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <app-page-header
          title="Athlete Dashboard"
          subtitle="Your performance overview for today"
        >
          <div class="flex items-center gap-3">
            <app-live-indicator [isLive]="realtimeService.isConnected()"></app-live-indicator>
          </div>
        </app-page-header>

        <!-- Key Metrics Row -->
        <div class="metrics-row">
          <!-- Today's Workload -->
          <p-card class="metric-card">
            <div class="metric-content">
              <div class="metric-header">
                <h3>Today's Workload</h3>
                <i class="pi pi-calendar"></i>
              </div>
              <div class="metric-value">{{ todayWorkload() }} AU</div>
              <div class="metric-subtitle">Session-RPE × Duration</div>
            </div>
          </p-card>

          <!-- ACWR with Traffic Light -->
          <p-card class="metric-card">
            <div class="metric-content">
              <div class="metric-header">
                <h3>ACWR</h3>
                <app-traffic-light-indicator
                  [status]="acwrStatus()"
                  [showLabel]="true"
                ></app-traffic-light-indicator>
              </div>
              <div class="metric-value">{{ acwrValue() | number:'1.2-2' }}</div>
              <div class="metric-subtitle">{{ acwrRiskZone() }}</div>
            </div>
          </p-card>

          <!-- Readiness with Traffic Light -->
          <p-card class="metric-card">
            <div class="metric-content">
              <div class="metric-header">
                <h3>Readiness</h3>
                <app-traffic-light-indicator
                  [status]="readinessStatus()"
                  [showLabel]="true"
                ></app-traffic-light-indicator>
              </div>
              <div class="metric-value">{{ readinessScore() }}/100</div>
              <div class="metric-subtitle">{{ readinessLevel() }}</div>
            </div>
          </p-card>

          <!-- Next Session -->
          <p-card class="metric-card">
            <div class="metric-content">
              <div class="metric-header">
                <h3>Next Session</h3>
                <i class="pi pi-clock"></i>
              </div>
              @if (nextSession()) {
                <div class="metric-value">{{ nextSession()?.title }}</div>
                <div class="metric-subtitle">{{ nextSession()?.date | date:'short' }}</div>
              } @else {
                <div class="metric-value">No sessions</div>
                <div class="metric-subtitle">Scheduled</div>
              }
            </div>
          </p-card>
        </div>

        <!-- Readiness Widget -->
        <div class="readiness-section">
          @if (athleteId()) {
            <app-readiness-widget [athleteId]="athleteId()!"></app-readiness-widget>
          }
        </div>

        <!-- Trend Cards -->
        <div class="trends-section">
          <h2 class="section-title">Performance Trends</h2>
          <div class="trends-grid">
            @for (trend of trendCards(); track trend.title) {
              <app-trend-card [data]="trend"></app-trend-card>
            }
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .dashboard-content {
        padding: var(--space-6);
      }

      .metrics-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .metric-card {
        min-height: 150px;
      }

      .metric-content {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .metric-header h3 {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin: 0;
      }

      .metric-header i {
        font-size: 1.25rem;
        color: var(--p-primary-600);
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .metric-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .readiness-section {
        margin-bottom: var(--space-6);
      }

      .trends-section {
        margin-top: var(--space-6);
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-4);
      }

      .trends-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-4);
      }

      @media (max-width: 768px) {
        .metrics-row {
          grid-template-columns: 1fr;
        }

        .trends-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AthleteDashboardComponent extends RealtimeBaseComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private acwrService = inject(AcwrService);
  private readinessService = inject(ReadinessService);
  private trendsService = inject(TrendsService);
  private headerService = inject(HeaderService);
  private trainingDataService = inject(TrainingDataService);

  athleteId = signal<string | undefined>(undefined);
  todayWorkload = signal<number>(0);
  nextSession = signal<any>(null);
  trendCards = signal<TrendData[]>([]);

  acwrValue = computed(() => this.acwrService.acwrRatio());
  acwrRiskZone = computed(() => this.acwrService.riskZone().label);
  
  acwrStatus = computed<TrafficLightStatus>(() => {
    const ratio = this.acwrValue();
    if (ratio === 0) return 'yellow';
    if (ratio < 0.8) return 'orange';
    if (ratio <= 1.3) return 'green';
    if (ratio <= 1.5) return 'yellow';
    return 'red';
  });

  readinessScore = computed(() => this.readinessService.current()?.score || 0);
  readinessLevel = computed(() => this.readinessService.current()?.level || 'moderate');
  
  readinessStatus = computed<TrafficLightStatus>(() => {
    const score = this.readinessScore();
    if (score >= 75) return 'green';
    if (score >= 55) return 'yellow';
    return 'red';
  });

  ngOnInit(): void {
    this.headerService.setDashboardHeader();
    this.loadDashboardData();
    this.setupRealtimeSubscriptions();
  }

  /**
   * Set up real-time subscriptions for live data updates
   */
  private setupRealtimeSubscriptions(): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    // Subscribe to training sessions updates
    const trainingUnsub = this.realtimeService.subscribeToTrainingSessions((event) => {
      console.log('🔴 LIVE: Training session updated', event);
      // Reload today's workload when training data changes
      this.loadTodayWorkload(userId);
      this.loadNextSession(userId);
    });
    this.addSubscription(trainingUnsub);

    // Subscribe to readiness updates
    const readinessUnsub = this.realtimeService.subscribeToReadiness((event) => {
      console.log('🔴 LIVE: Readiness updated', event);
      // Reload readiness when it changes
      this.readinessService.calculateToday(userId).pipe(
        takeUntilDestroyed()
      ).subscribe();
    });
    this.addSubscription(readinessUnsub);

    // Subscribe to performance metrics updates
    const performanceUnsub = this.realtimeService.subscribeToPerformance((event) => {
      console.log('🔴 LIVE: Performance metrics updated', event);
      // Reload trends when performance data changes
      this.loadTrends(userId);
    });
    this.addSubscription(performanceUnsub);

    console.log('✅ Real-time subscriptions active for athlete dashboard');
  }

  loadDashboardData(): void {
    const user = this.authService.getUser();
    const userId = user?.id;
    
    if (!userId) return;

    this.athleteId.set(userId);

    // Load today's workload
    this.loadTodayWorkload(userId);

    // Load next session
    this.loadNextSession(userId);

    // Load readiness
    this.readinessService.calculateToday(userId).pipe(
      takeUntilDestroyed()
    ).subscribe();

    // Load trend data
    this.loadTrends(userId);
  }

  loadTodayWorkload(userId: string): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Use TrainingDataService for consistent data access
    this.trainingDataService.getTrainingSessions({
      startDate: todayStr,
      endDate: todayStr,
      limit: 50
    }).pipe(takeUntilDestroyed()).subscribe({
      next: (sessions) => {
        const workload = sessions.reduce((sum: number, session: any) => {
          const rpe = session.rpe || session.intensity_level || 0;
          const duration = session.duration_minutes || session.duration || 0;
          return sum + (rpe * duration);
        }, 0);
        this.todayWorkload.set(workload);
      },
      error: () => {
        this.todayWorkload.set(0);
      }
    });
  }

  loadNextSession(userId: string): void {
    // Use TrainingDataService with includeUpcoming flag
    this.trainingDataService.getTrainingSessions({
      includeUpcoming: true,
      limit: 1
    }).pipe(takeUntilDestroyed()).subscribe({
      next: (sessions) => {
        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          const sessionDate = session.session_date || session.date;
          if (sessionDate) {
            this.nextSession.set({
              title: session.session_type || session.type || 'Training Session',
              date: new Date(sessionDate)
            });
          }
        }
      },
      error: () => {
        this.nextSession.set(null);
      }
    });
  }

  loadTrends(userId: string): void {
    const trends: TrendData[] = [];

    // Load change of direction trend
    this.trendsService.getChangeOfDirectionTrend(userId).pipe(
      takeUntilDestroyed()
    ).subscribe({
      next: (data) => {
        trends.push({
          title: 'Change of Direction Sessions',
          subtitle: 'Last 4 weeks',
          value: data.current,
          change: this.trendsService.calculateChange(data.current, data.previous),
          changeLabel: 'vs previous 4 weeks',
          icon: 'pi-sync'
        });
        this.trendCards.set([...trends]);
      },
      error: () => {
        // Mock data on error
        trends.push({
          title: 'Change of Direction Sessions',
          subtitle: 'Last 4 weeks',
          value: 12,
          change: 8.3,
          changeLabel: 'vs previous 4 weeks',
          icon: 'pi-sync'
        });
        this.trendCards.set([...trends]);
      }
    });

    // Load sprint volume trend
    this.trendsService.getSprintVolumeTrend(userId).pipe(
      takeUntilDestroyed()
    ).subscribe({
      next: (data) => {
        trends.push({
          title: 'Sprint Volume',
          subtitle: 'Last 4 weeks',
          value: data.current,
          change: this.trendsService.calculateChange(data.current, data.previous),
          changeLabel: 'vs previous 4 weeks',
          icon: 'pi-bolt'
        });
        this.trendCards.set([...trends]);
      },
      error: () => {
        trends.push({
          title: 'Sprint Volume',
          subtitle: 'Last 4 weeks',
          value: 450,
          change: 12.5,
          changeLabel: 'vs previous 4 weeks',
          icon: 'pi-bolt'
        });
        this.trendCards.set([...trends]);
      }
    });

    // Load game performance trend
    this.trendsService.getGamePerformanceTrend(userId, 5).pipe(
      takeUntilDestroyed()
    ).subscribe({
      next: (data) => {
        trends.push({
          title: 'Game Performance',
          subtitle: 'Last 5 games',
          value: `${data.averagePerformance.toFixed(1)}%`,
          change: data.trend === 'improving' ? 5.2 : data.trend === 'declining' ? -3.1 : 0,
          changeLabel: 'average',
          icon: 'pi-chart-line'
        });
        this.trendCards.set([...trends]);
      },
      error: () => {
        trends.push({
          title: 'Game Performance',
          subtitle: 'Last 5 games',
          value: '85.2%',
          change: 5.2,
          changeLabel: 'average',
          icon: 'pi-chart-line'
        });
        this.trendCards.set([...trends]);
      }
    });
  }
}

