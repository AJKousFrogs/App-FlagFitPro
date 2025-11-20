import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { KnobModule } from 'primeng/knob';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabViewModule } from 'primeng/tabview';
import { TimelineModule } from 'primeng/timeline';
import { RecoveryService } from '../../../core/services/recovery.service';
import { firstValueFrom } from 'rxjs';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recovery-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TagModule,
    KnobModule,
    ProgressBarModule,
    TabViewModule,
    TimelineModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="recovery-dashboard">
      <!-- Recovery Status Overview -->
      <p-card header="Recovery Status" class="recovery-status-card">
        <div class="status-overview">
          <div class="recovery-score">
            <p-knob
              [(ngModel)]="recoveryScoreValue"
              [min]="0"
              [max]="100"
              [size]="150"
              [strokeWidth]="12"
              [valueColor]="getRecoveryColor()"
              [rangeColor]="'#e5e7eb'"
              [readonly]="true">
            </p-knob>
            <div class="score-label">
              <span class="score-text">Recovery Score</span>
              <span class="score-status">{{ getRecoveryStatus() }}</span>
            </div>
          </div>

          <div class="recovery-metrics">
            <div class="metric" *ngFor="let metric of recoveryMetrics()">
              <div class="metric-header">
                <i [class]="metric.icon" [style.color]="metric.color"></i>
                <span class="metric-name">{{ metric.name }}</span>
              </div>
              <div class="metric-value">
                <span class="value">{{ metric.value }}</span>
                <span class="unit">{{ metric.unit }}</span>
              </div>
              <p-progressBar
                [value]="metric.percentage"
                [showValue]="false"
                [style]="{'--p-progressbar-value-bg': metric.color}">
              </p-progressBar>
            </div>
          </div>
        </div>
      </p-card>

      <!-- Evidence-Based Recovery Protocols -->
      <p-card header="Recommended Recovery Protocols" class="protocols-card">
        <div class="protocols-grid">
          <div
            *ngFor="let protocol of recommendedProtocols()"
            class="protocol-card"
            [class.priority]="protocol.priority === 'high'"
            (click)="selectProtocol(protocol)">
            <div class="protocol-header">
              <div class="protocol-info">
                <h4>{{ protocol.name }}</h4>
                <p-tag
                  [value]="protocol.category"
                  [severity]="getProtocolSeverity(protocol.category)">
                </p-tag>
              </div>
              <div class="protocol-meta">
                <span class="duration">{{ protocol.duration }} min</span>
                <i class="pi pi-chevron-right"></i>
              </div>
            </div>

            <p class="protocol-description">{{ protocol.description }}</p>

            <!-- Research Evidence Badge -->
            <div class="evidence-badge" *ngIf="protocol.evidenceLevel">
              <i class="pi pi-verified"></i>
              <span>{{ protocol.evidenceLevel }} Evidence</span>
              <small>({{ protocol.studyCount }} studies)</small>
            </div>

            <!-- Expected Benefits -->
            <div class="benefits">
              <h5>Expected Benefits:</h5>
              <ul>
                <li *ngFor="let benefit of protocol.benefits">{{ benefit }}</li>
              </ul>
            </div>

            <div class="protocol-actions">
              <p-button
                label="Start Protocol"
                icon="pi pi-play"
                size="small"
                (onClick)="startProtocol(protocol)">
              </p-button>

              <p-button
                label="Learn More"
                icon="pi pi-info-circle"
                [outlined]="true"
                size="small"
                (onClick)="showProtocolDetails(protocol)">
              </p-button>
            </div>
          </div>
        </div>
      </p-card>

      <!-- Active Recovery Sessions -->
      <p-card
        header="Active Recovery Session"
        class="active-session-card"
        *ngIf="activeSession()">
        <div class="session-content">
          <div class="session-info">
            <h3>{{ activeSession()?.protocol.name }}</h3>
            <p>{{ activeSession()?.protocol.description }}</p>
          </div>

          <!-- Session Timer -->
          <div class="session-timer">
            <p-knob
              [(ngModel)]="sessionProgressValue"
              [min]="0"
              [max]="100"
              [size]="120"
              [strokeWidth]="8"
              [valueColor]="'#10c96b'"
              [rangeColor]="'#e5e7eb'"
              [readonly]="true">
            </p-knob>
            <div class="timer-text">
              <span class="time-remaining">{{ formatTime(timeRemaining()) }}</span>
              <span class="total-time">/ {{ formatTime(totalTime()) }}</span>
            </div>
          </div>

          <!-- Session Steps -->
          <div class="session-steps">
            <h4>Protocol Steps:</h4>
            <p-timeline [value]="sessionSteps()" layout="vertical" class="session-timeline">
              <ng-template pTemplate="marker" let-step>
                <div
                  class="step-marker"
                  [class.completed]="step.completed"
                  [class.active]="step.active">
                  <i [class]="step.completed ? 'pi pi-check' : step.icon"></i>
                </div>
              </ng-template>

              <ng-template pTemplate="content" let-step>
                <div class="step-content">
                  <h5>{{ step.title }}</h5>
                  <p>{{ step.description }}</p>
                  <span class="step-duration">{{ step.duration }} minutes</span>
                </div>
              </ng-template>
            </p-timeline>
          </div>

          <div class="session-controls">
            <p-button
              [label]="sessionPaused() ? 'Resume' : 'Pause'"
              [icon]="sessionPaused() ? 'pi pi-play' : 'pi pi-pause'"
              (onClick)="toggleSession()">
            </p-button>

            <p-button
              label="Complete Session"
              icon="pi pi-check"
              severity="success"
              (onClick)="completeSession()">
            </p-button>

            <p-button
              label="Stop Session"
              icon="pi pi-stop"
              severity="danger"
              [outlined]="true"
              (onClick)="stopSession()">
            </p-button>
          </div>
        </div>
      </p-card>

      <!-- Recovery History & Analytics -->
      <p-card header="Recovery Analytics" class="analytics-card">
        <p-tabView>
          <p-tabPanel header="Weekly Trends" leftIcon="pi pi-chart-line">
            <p-chart type="line" [data]="weeklyRecoveryData" [options]="chartOptions">
            </p-chart>
          </p-tabPanel>

          <p-tabPanel header="Protocol Effectiveness" leftIcon="pi pi-star">
            <p-chart
              type="bar"
              [data]="protocolEffectivenessData"
              [options]="barChartOptions">
            </p-chart>
          </p-tabPanel>

          <p-tabPanel header="Research Insights" leftIcon="pi pi-book">
            <div class="research-insights">
              <div *ngFor="let insight of researchInsights()" class="research-item">
                <div class="research-header">
                  <h4>{{ insight.title }}</h4>
                  <p-tag [value]="insight.journal" severity="info"></p-tag>
                </div>
                <p>{{ insight.summary }}</p>
                <div class="research-meta">
                  <span>{{ insight.authors }} ({{ insight.year }})</span>
                  <p-button
                    label="Read Study"
                    icon="pi pi-external-link"
                    [text]="true"
                    size="small"
                    (onClick)="openStudy(insight.doi)">
                  </p-button>
                </div>
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>
      </p-card>
    </div>
  `,
  styles: [
    `
      .recovery-dashboard {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .status-overview {
        display: flex;
        gap: 2rem;
        align-items: center;
      }

      .recovery-score {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .score-label {
        text-align: center;
      }

      .score-text {
        display: block;
        font-weight: 600;
        color: var(--p-text-color);
      }

      .score-status {
        display: block;
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .recovery-metrics {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .metric {
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
      }

      .metric-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .metric-name {
        font-weight: 500;
        color: var(--p-text-color);
      }

      .metric-value {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
      }

      .value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--p-text-color);
      }

      .unit {
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .protocols-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1rem;
      }

      .protocol-card {
        padding: 1.5rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .protocol-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .protocol-card.priority {
        border-color: var(--p-orange-500);
        background: var(--p-orange-50);
      }

      .protocol-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .protocol-info h4 {
        margin: 0 0 0.25rem 0;
        color: var(--p-text-color);
      }

      .protocol-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .duration {
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .protocol-description {
        margin: 0 0 1rem 0;
        color: var(--p-text-color-secondary);
      }

      .evidence-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--p-green-50);
        border: 1px solid var(--p-green-200);
        border-radius: var(--p-border-radius);
        margin-bottom: 1rem;
      }

      .evidence-badge i {
        color: var(--p-green-600);
      }

      .evidence-badge small {
        color: var(--p-text-color-secondary);
        font-size: 0.75rem;
      }

      .benefits {
        margin: 1rem 0;
      }

      .benefits h5 {
        margin: 0 0 0.5rem 0;
        color: var(--p-text-color);
      }

      .benefits ul {
        margin: 0;
        padding-left: 1.25rem;
      }

      .benefits li {
        margin: 0.25rem 0;
        color: var(--p-text-color-secondary);
      }

      .protocol-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .session-content {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto auto;
        gap: 1.5rem;
      }

      .session-info {
        grid-column: 1;
        grid-row: 1;
      }

      .session-info h3 {
        margin: 0 0 0.5rem 0;
        color: var(--p-text-color);
      }

      .session-info p {
        margin: 0;
        color: var(--p-text-color-secondary);
      }

      .session-timer {
        grid-column: 2;
        grid-row: 1 / 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .timer-text {
        text-align: center;
      }

      .time-remaining {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-text-color);
      }

      .total-time {
        color: var(--p-text-color-secondary);
      }

      .session-steps {
        grid-column: 1;
        grid-row: 2;
      }

      .session-steps h4 {
        margin: 0 0 1rem 0;
        color: var(--p-text-color);
      }

      .session-controls {
        grid-column: 1 / -1;
        grid-row: 3;
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .step-marker {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-300);
        color: white;
      }

      .step-marker.completed {
        background: var(--p-green-500);
      }

      .step-marker.active {
        background: var(--p-primary-color);
      }

      .step-content h5 {
        margin: 0 0 0.5rem 0;
        color: var(--p-text-color);
      }

      .step-content p {
        margin: 0 0 0.5rem 0;
        color: var(--p-text-color-secondary);
      }

      .step-duration {
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .research-insights {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .research-item {
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
      }

      .research-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .research-header h4 {
        margin: 0;
        color: var(--p-text-color);
      }

      .research-item p {
        margin: 0;
        color: var(--p-text-color-secondary);
      }

      .research-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--p-surface-border);
      }

      .research-meta span {
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class RecoveryDashboardComponent implements OnInit, OnDestroy {
  private recoveryService = inject(RecoveryService);
  private destroy$ = new Subject<void>();
  private timerInterval?: any;

  recoveryScoreValue = 78;
  recoveryMetrics = signal<any[]>([]);
  recommendedProtocols = signal<any[]>([]);
  activeSession = signal<any>(null);
  sessionPaused = signal(false);
  sessionProgressValue = 0;
  timeRemaining = signal(0);
  totalTime = signal(0);
  sessionSteps = signal<any[]>([]);
  researchInsights = signal<any[]>([]);

  // Chart data
  weeklyRecoveryData: any = {};
  protocolEffectivenessData: any = {};
  chartOptions: any = {};
  barChartOptions: any = {};

  ngOnInit() {
    this.loadRecoveryData();
    this.loadRecommendedProtocols();
    this.loadResearchInsights();
    this.setupChartData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  getRecoveryColor(): string {
    const score = this.recoveryScoreValue;
    if (score >= 80) return '#10c96b';
    if (score >= 60) return '#f1c40f';
    return '#ef4444';
  }

  getRecoveryStatus(): string {
    const score = this.recoveryScoreValue;
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  getProtocolSeverity(category: string): string {
    const severityMap: Record<string, string> = {
      Cryotherapy: 'info',
      Compression: 'success',
      'Manual Therapy': 'warn',
      'Heat Therapy': 'danger',
      Sleep: 'help',
    };
    return severityMap[category] || 'info';
  }

  selectProtocol(protocol: any) {
    console.log('Selected protocol:', protocol);
  }

  async startProtocol(protocol: any) {
    const session = await firstValueFrom(
      this.recoveryService.startRecoverySession(protocol)
    );
    this.activeSession.set(session);
    this.setupSessionTimer(session);
  }

  showProtocolDetails(protocol: any) {
    // Open protocol details modal with research evidence
    console.log('Show details for:', protocol);
  }

  toggleSession() {
    this.sessionPaused.update((paused) => !paused);
    if (this.sessionPaused()) {
      this.pauseSessionTimer();
    } else {
      this.resumeSessionTimer();
    }
  }

  async completeSession() {
    await firstValueFrom(this.recoveryService.completeRecoverySession());
    this.activeSession.set(null);
    this.loadRecoveryData(); // Refresh recovery metrics
  }

  async stopSession() {
    await firstValueFrom(this.recoveryService.stopRecoverySession());
    this.activeSession.set(null);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  openStudy(doi: string) {
    window.open(`https://doi.org/${doi}`, '_blank');
  }

  private async loadRecoveryData() {
    const data = await firstValueFrom(
      this.recoveryService.getRecoveryMetrics()
    );
    this.recoveryScoreValue = data.overallScore;
    this.recoveryMetrics.set(data.metrics);
  }

  private async loadRecommendedProtocols() {
    const protocols = await firstValueFrom(
      this.recoveryService.getRecommendedProtocols()
    );
    this.recommendedProtocols.set(protocols);
  }

  private async loadResearchInsights() {
    const insights = await firstValueFrom(
      this.recoveryService.getResearchInsights()
    );
    this.researchInsights.set(insights);
  }

  private setupChartData() {
    // Setup chart data for analytics
    this.weeklyRecoveryData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Recovery Score',
          data: [75, 78, 72, 85, 80, 77, 82],
          borderColor: '#10c96b',
          backgroundColor: 'rgba(16, 201, 107, 0.1)',
        },
      ],
    };

    this.protocolEffectivenessData = {
      labels: ['Cryotherapy', 'Compression', 'Manual Therapy', 'Heat Therapy'],
      datasets: [
        {
          label: 'Effectiveness Rating',
          data: [8.5, 7.8, 8.2, 7.5],
          backgroundColor: ['#10c96b', '#f1c40f', '#ef4444', '#8b5cf6'],
        },
      ],
    };

    this.chartOptions = {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 },
      },
    };

    this.barChartOptions = {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 10 },
      },
    };
  }

  private setupSessionTimer(session: any) {
    // Setup session timer and steps
    this.totalTime.set(session.duration); // Already in seconds
    this.timeRemaining.set(this.totalTime());
    this.sessionSteps.set(
      session.protocol.steps.map((step: any, index: number) => ({
        ...step,
        completed: false,
        active: index === 0,
      }))
    );

    // Start timer
    this.resumeSessionTimer();
  }

  private pauseSessionTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private resumeSessionTimer() {
    if (this.timerInterval) return;

    this.timerInterval = setInterval(() => {
      if (!this.sessionPaused()) {
        const remaining = this.timeRemaining();
        if (remaining > 0) {
          this.timeRemaining.set(remaining - 1);
          const progress =
            ((this.totalTime() - remaining) / this.totalTime()) * 100;
          this.sessionProgressValue = progress;
        } else {
          this.completeSession();
        }
      }
    }, 1000);
  }
}

