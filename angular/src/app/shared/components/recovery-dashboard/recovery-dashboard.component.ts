import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DialogModule } from "primeng/dialog";
import { KnobModule } from "primeng/knob";
import { ProgressBarModule } from "primeng/progressbar";
import { SelectButton } from "primeng/selectbutton";
import { Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TimelineModule } from "primeng/timeline";
import { TooltipModule } from "primeng/tooltip";
import { firstValueFrom, Subscription, timer } from "rxjs";
import { COLORS } from "../../../core/constants/app.constants";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";
import {
  AthleteRecoveryProfile,
  RecoveryService,
  RecoveryProtocol as ServiceRecoveryProtocol,
  RecoverySession as ServiceRecoverySession,
} from "../../../core/services/recovery.service";
import { ButtonComponent } from "../button/button.component";
import { CountdownTimerComponent } from "../countdown-timer/countdown-timer.component";

interface RecoveryMetric {
  name: string;
  value: number | string;
  unit: string;
  percentage: number;
  icon: string;
  color: string;
}

// Using RecoveryProtocol and RecoverySession from recovery.service.ts
// Aliased as ServiceRecoveryProtocol and ServiceRecoverySession

interface ProtocolStep {
  title: string;
  description: string;
  duration: number;
  icon: string;
  completed?: boolean;
  active?: boolean;
}

interface ResearchInsight {
  title: string;
  journal: string;
  summary: string;
  authors: string;
  year: number;
  doi: string;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor: string | string[];
}

interface ChartOptions {
  responsive: boolean;
  scales?: {
    y?: { beginAtZero: boolean; max: number };
  };
}

@Component({
  selector: "app-recovery-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    TagModule,
    KnobModule,
    ProgressBarModule,
    Tabs,
    TimelineModule,
    SelectButton,
    DialogModule,
    TooltipModule,
    CountdownTimerComponent,
    ButtonComponent,
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
              [rangeColor]="'var(--p-surface-200)'"
              [readonly]="true"
            >
            </p-knob>
            <div class="score-label">
              <span class="score-text">Recovery Score</span>
              <span class="score-status">{{ getRecoveryStatus() }}</span>
            </div>
          </div>

          <div class="recovery-metrics">
            @for (metric of recoveryMetrics(); track metric.name) {
              <div class="metric">
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
                  [style]="{ '--p-progressbar-value-bg': metric.color }"
                >
                </p-progressBar>
              </div>
            }
          </div>
        </div>
      </p-card>

      <!-- Evidence-Based Recovery Protocols -->
      <p-card header="Recovery Protocols" class="protocols-card">
        <!-- Category Filter -->
        <div class="category-filter">
          <p-selectButton
            [options]="categoryOptions"
            [(ngModel)]="selectedCategory"
            (onChange)="onCategoryChange($event)"
            optionLabel="label"
            optionValue="value"
          >
          </p-selectButton>
        </div>

        <!-- Loading State -->
        @if (loadingProtocols()) {
          <div class="loading-protocols">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading protocols...</span>
          </div>
        } @else if (filteredProtocols().length === 0) {
          <div class="no-protocols">
            <i class="pi pi-info-circle"></i>
            <span>No protocols found for this category</span>
          </div>
        } @else {
          <div class="protocols-grid">
            @for (protocol of filteredProtocols(); track protocol.id) {
              <div
                class="protocol-card"
                [class.priority-high]="protocol.priority === 'high'"
                [class.priority-medium]="protocol.priority === 'medium'"
                [class.category-cryotherapy]="
                  protocol.category === 'Cryotherapy'
                "
                [class.category-compression]="
                  protocol.category === 'Compression'
                "
                [class.category-manual]="protocol.category === 'Manual Therapy'"
                [class.category-heat]="protocol.category === 'Heat Therapy'"
                (click)="selectProtocol(protocol)"
              >
                <div class="protocol-header">
                  <div class="protocol-info">
                    <div class="protocol-icon">
                      <i
                        [class]="protocol.icon || 'pi pi-heart'"
                        [pTooltip]="protocol.category"
                      ></i>
                    </div>
                    <div>
                      <h4>{{ protocol.name }}</h4>
                      <p-tag
                        [value]="protocol.category"
                        [severity]="getProtocolSeverity(protocol.category)"
                      >
                      </p-tag>
                    </div>
                  </div>
                  <div class="protocol-meta">
                    <span class="duration">
                      <i class="pi pi-clock"></i>
                      {{ protocol.duration }} min
                    </span>
                    @if (protocol.priority === "high") {
                      <span class="priority-badge">
                        <i class="pi pi-star-fill"></i>
                        Recommended
                      </span>
                    }
                  </div>
                </div>

                <p class="protocol-description">{{ protocol.description }}</p>

                <!-- Research Evidence Badge -->
                @if (protocol.evidenceLevel) {
                  <div
                    class="evidence-badge"
                    [class.evidence-strong]="
                      protocol.evidenceLevel === 'Strong'
                    "
                  >
                    <i class="pi pi-verified"></i>
                    <span>{{ protocol.evidenceLevel }} Evidence</span>
                    <small>({{ protocol.studyCount }} studies)</small>
                  </div>
                }

                <!-- Expected Benefits -->
                @if (protocol.benefits && protocol.benefits.length > 0) {
                  <div class="benefits">
                    <h5>Expected Benefits:</h5>
                    <ul>
                      @for (
                        benefit of protocol.benefits.slice(
                          0,
                          UI_LIMITS.BENEFITS_PREVIEW
                        );
                        track benefit
                      ) {
                        <li>{{ benefit }}</li>
                      }
                      @if (protocol.benefits.length > 4) {
                        <li class="more-benefits">
                          +{{ protocol.benefits.length - 4 }} more
                        </li>
                      }
                    </ul>
                  </div>
                }

                <!-- Equipment Required -->
                @if (protocol.equipment && protocol.equipment.length > 0) {
                  <div class="equipment-info">
                    <i class="pi pi-box"></i>
                    <span
                      >{{
                        protocol.equipment
                          .slice(0, UI_LIMITS.EQUIPMENT_PREVIEW)
                          .join(", ")
                      }}{{ protocol.equipment.length > 2 ? "..." : "" }}</span
                    >
                  </div>
                }

                <div class="protocol-actions">
                  <app-button
                    size="sm"
                    iconLeft="pi-play"
                    (clicked)="
                      startProtocol(protocol); $event.stopPropagation()
                    "
                    >Start Protocol</app-button
                  >

                  <app-button
                    variant="outlined"
                    size="sm"
                    iconLeft="pi-info-circle"
                    (clicked)="
                      showProtocolDetails(protocol); $event.stopPropagation()
                    "
                    >Details</app-button
                  >
                </div>
              </div>
            }
          </div>
        }
      </p-card>

      <!-- Protocol Details Dialog -->
      <p-dialog
        header="Protocol Details"
        [(visible)]="showProtocolDialog"
        [modal]="true"
        [style]="{ width: '600px', maxWidth: '95vw' }"
        [draggable]="false"
        [resizable]="false"
      >
        @if (selectedProtocolDetails()) {
          <div class="protocol-details">
            <div class="detail-header">
              <div
                class="detail-icon"
                [class]="
                  'category-' +
                  selectedProtocolDetails()
                    ?.category?.toLowerCase()
                    ?.replace(' ', '-')
                "
              >
                <i
                  [class]="selectedProtocolDetails()?.icon || 'pi pi-heart'"
                ></i>
              </div>
              <div>
                <h2>{{ selectedProtocolDetails()?.name }}</h2>
                <p-tag
                  [value]="selectedProtocolDetails()?.category || ''"
                  [severity]="
                    getProtocolSeverity(
                      selectedProtocolDetails()?.category || ''
                    )
                  "
                ></p-tag>
              </div>
            </div>

            <p class="detail-description">
              {{ selectedProtocolDetails()?.description }}
            </p>

            <div class="detail-meta">
              <div class="meta-item">
                <i class="pi pi-clock"></i>
                <span>{{ selectedProtocolDetails()?.duration }} minutes</span>
              </div>
              <div class="meta-item">
                <i class="pi pi-chart-bar"></i>
                <span
                  >{{ selectedProtocolDetails()?.intensity }} intensity</span
                >
              </div>
              <div class="meta-item">
                <i class="pi pi-verified"></i>
                <span
                  >{{ selectedProtocolDetails()?.evidenceLevel }} evidence ({{
                    selectedProtocolDetails()?.studyCount
                  }}
                  studies)</span
                >
              </div>
            </div>

            @if (
              selectedProtocolDetails()?.benefits &&
              selectedProtocolDetails()!.benefits.length > 0
            ) {
              <div class="detail-section">
                <h4><i class="pi pi-check-circle"></i> Benefits</h4>
                <ul>
                  @for (
                    benefit of selectedProtocolDetails()?.benefits;
                    track benefit
                  ) {
                    <li>{{ benefit }}</li>
                  }
                </ul>
              </div>
            }

            @if (
              selectedProtocolDetails()?.equipment &&
              selectedProtocolDetails()!.equipment!.length > 0
            ) {
              <div class="detail-section">
                <h4><i class="pi pi-box"></i> Equipment Required</h4>
                <ul>
                  @for (
                    item of selectedProtocolDetails()?.equipment;
                    track item
                  ) {
                    <li>{{ item }}</li>
                  }
                </ul>
              </div>
            }

            @if (
              selectedProtocolDetails()?.targetMuscles &&
              selectedProtocolDetails()!.targetMuscles!.length > 0
            ) {
              <div class="detail-section">
                <h4><i class="pi pi-user"></i> Target Areas</h4>
                <div class="tag-list">
                  @for (
                    muscle of selectedProtocolDetails()?.targetMuscles;
                    track muscle
                  ) {
                    <p-tag [value]="muscle" severity="secondary"></p-tag>
                  }
                </div>
              </div>
            }

            @if (
              selectedProtocolDetails()?.steps &&
              selectedProtocolDetails()!.steps.length > 0
            ) {
              <div class="detail-section">
                <h4><i class="pi pi-list"></i> Protocol Steps</h4>
                <div class="steps-list">
                  @for (
                    step of selectedProtocolDetails()?.steps;
                    track step.id;
                    let i = $index
                  ) {
                    <div class="step-item">
                      <div class="step-number">{{ i + 1 }}</div>
                      <div class="step-info">
                        <strong>{{ step.title }}</strong>
                        <p>{{ step.description }}</p>
                        <span class="step-duration"
                          ><i class="pi pi-clock"></i>
                          {{ step.duration }} min</span
                        >
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="detail-actions">
              <app-button
                iconLeft="pi-play"
                (clicked)="
                  startProtocol(selectedProtocolDetails()!);
                  showProtocolDialog = false
                "
                >Start This Protocol</app-button
              >
              <app-button
                variant="outlined"
                (clicked)="showProtocolDialog = false"
                >Close</app-button
              >
            </div>
          </div>
        }
      </p-dialog>

      <!-- Active Recovery Sessions -->
      @if (activeSession()) {
        <p-card header="Active Recovery Session" class="active-session-card">
          <div class="session-content">
            <div class="session-info">
              <h3>{{ activeSession()?.protocol.name }}</h3>
              <p>{{ activeSession()?.protocol.description }}</p>
            </div>

            <!-- Session Timer - Uses unified CountdownTimerComponent -->
            <div class="session-timer">
              <app-countdown-timer
                [initialSeconds]="totalTime()"
                [autoStart]="!sessionPaused()"
                size="lg"
                [showControls]="false"
                (complete)="completeSession()"
              ></app-countdown-timer>
            </div>

            <!-- Session Steps -->
            <div class="session-steps">
              <h4>Protocol Steps:</h4>
              <p-timeline
                [value]="sessionSteps()"
                layout="vertical"
                class="session-timeline"
              >
                <ng-template pTemplate="marker" let-step>
                  <div
                    class="step-marker"
                    [class.completed]="step.completed"
                    [class.active]="step.active"
                  >
                    <i [class]="step.completed ? 'pi pi-check' : step.icon"></i>
                  </div>
                </ng-template>

                <ng-template pTemplate="content" let-step>
                  <div class="step-content">
                    <h5>{{ step.title }}</h5>
                    <p>{{ step.description }}</p>
                    <span class="step-duration"
                      >{{ step.duration }} minutes</span
                    >
                  </div>
                </ng-template>
              </p-timeline>
            </div>

            <div class="session-controls">
              <app-button (clicked)="toggleSession()"></app-button>

              <app-button
                variant="success"
                iconLeft="pi-check"
                (clicked)="completeSession()"
                >Complete Session</app-button
              >

              <app-button
                variant="outlined"
                iconLeft="pi-stop"
                (clicked)="stopSession()"
                >Stop Session</app-button
              >
            </div>
          </div>
        </p-card>
      }

      <!-- Recovery History & Analytics -->
      <p-card header="Recovery Analytics" class="analytics-card">
        <p-tabs>
          <p-tabpanel header="Weekly Trends" leftIcon="pi pi-chart-line">
            <p-chart
              type="line"
              [data]="weeklyRecoveryData"
              [options]="chartOptions"
            >
            </p-chart>
          </p-tabpanel>

          <p-tabpanel header="Protocol Effectiveness" leftIcon="pi pi-star">
            <p-chart
              type="bar"
              [data]="protocolEffectivenessData"
              [options]="barChartOptions"
            >
            </p-chart>
          </p-tabpanel>

          <p-tabpanel header="Research Insights" leftIcon="pi pi-book">
            <div class="research-insights">
              @for (insight of researchInsights(); track insight.title) {
                <div class="research-item">
                  <div class="research-header">
                    <h4>{{ insight.title }}</h4>
                    <p-tag [value]="insight.journal" severity="info"></p-tag>
                  </div>
                  <p>{{ insight.summary }}</p>
                  <div class="research-meta">
                    <span>{{ insight.authors }} ({{ insight.year }})</span>
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-external-link"
                      (clicked)="openStudy(insight.doi)"
                      >Read Study</app-button
                    >
                  </div>
                </div>
              }
            </div>
          </p-tabpanel>
        </p-tabs>
      </p-card>
    </div>
  `,
  styleUrl: "./recovery-dashboard.component.scss",
})
export class RecoveryDashboardComponent implements OnInit, OnDestroy {
  private recoveryService = inject(RecoveryService);
  private destroyRef = inject(DestroyRef);
  private timerSubscription?: Subscription;
  private logger = inject(LoggerService);

  recoveryScoreValue = 78;
  recoveryMetrics = signal<RecoveryMetric[]>([]);
  recommendedProtocols = signal<ServiceRecoveryProtocol[]>([]);
  filteredProtocols = signal<ServiceRecoveryProtocol[]>([]);
  activeSession = signal<ServiceRecoverySession | null>(null);
  sessionPaused = signal(false);
  sessionProgressValue = 0;
  timeRemaining = signal(0);
  totalTime = signal(0);
  sessionSteps = signal<ProtocolStep[]>([]);
  researchInsights = signal<ResearchInsight[]>([]);
  loadingProtocols = signal(false);
  athleteProfile = signal<AthleteRecoveryProfile | null>(null);

  // Protocol details dialog
  showProtocolDialog = false;
  selectedProtocolDetails = signal<ServiceRecoveryProtocol | null>(null);

  // Category filter
  selectedCategory = "all";
  categoryOptions = [
    { label: "All", value: "all", icon: "pi pi-th-large" },
    { label: "Cryotherapy", value: "Cryotherapy", icon: "pi pi-snowflake" },
    { label: "Compression", value: "Compression", icon: "pi pi-arrows-v" },
    { label: "Manual Therapy", value: "Manual Therapy", icon: "pi pi-user" },
    { label: "Heat Therapy", value: "Heat Therapy", icon: "pi pi-sun" },
  ];

  // Chart data
  weeklyRecoveryData: ChartData = { labels: [], datasets: [] };
  protocolEffectivenessData: ChartData = { labels: [], datasets: [] };
  chartOptions: ChartOptions = { responsive: true };
  barChartOptions: ChartOptions = { responsive: true };

  ngOnInit() {
    this.loadRecoveryData();
    this.loadRecommendedProtocols();
    this.loadResearchInsights();
    this.loadAthleteProfile();
    this.setupChartData();
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  getRecoveryColor(): string {
    const score = this.recoveryScoreValue;
    if (score >= 80) return COLORS.PRIMARY_LIGHT;
    if (score >= 60) return COLORS.WARNING;
    return COLORS.ERROR;
  }

  getRecoveryStatus(): string {
    const score = this.recoveryScoreValue;
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  }

  getProtocolSeverity(
    category: string,
  ):
    | "success"
    | "info"
    | "warn"
    | "danger"
    | "secondary"
    | "contrast"
    | undefined {
    const severityMap: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary" | "contrast"
    > = {
      Cryotherapy: "info",
      Compression: "success",
      "Manual Therapy": "warn",
      "Heat Therapy": "danger",
      Sleep: "secondary",
      Mobility: "contrast",
      Breathing: "secondary",
    };
    return severityMap[category] || "info";
  }

  onCategoryChange(event: { value: string }) {
    this.filterProtocols(event.value);
  }

  private filterProtocols(category: string) {
    const all = this.recommendedProtocols();
    if (category === "all") {
      this.filteredProtocols.set(all);
    } else {
      this.filteredProtocols.set(all.filter((p) => p.category === category));
    }
  }

  selectProtocol(protocol: ServiceRecoveryProtocol) {
    this.logger.debug("Selected protocol:", toLogContext(protocol));
  }

  async startProtocol(protocol: ServiceRecoveryProtocol) {
    const session = await firstValueFrom(
      this.recoveryService.startRecoverySession(protocol),
    );
    this.activeSession.set(session);
    this.setupSessionTimer(session);
  }

  showProtocolDetails(protocol: ServiceRecoveryProtocol) {
    this.selectedProtocolDetails.set(protocol);
    this.showProtocolDialog = true;
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
    const session = this.activeSession();
    if (session) {
      await firstValueFrom(
        this.recoveryService.completeRecoverySession(session.id),
      );
      this.activeSession.set(null);
      this.loadRecoveryData(); // Refresh recovery metrics
    }
  }

  async stopSession() {
    const session = this.activeSession();
    if (session) {
      await firstValueFrom(
        this.recoveryService.stopRecoverySession(session.id),
      );
      this.activeSession.set(null);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  openStudy(doi: string) {
    window.open(`https://doi.org/${doi}`, "_blank");
  }

  private async loadRecoveryData() {
    const data = await firstValueFrom(
      this.recoveryService.getRecoveryMetrics(),
    );
    this.recoveryScoreValue = data.overallScore;
    this.recoveryMetrics.set(data.metrics);
  }

  private async loadRecommendedProtocols() {
    this.loadingProtocols.set(true);
    try {
      const protocols = await firstValueFrom(
        this.recoveryService.getRecommendedProtocols(),
      );
      this.recommendedProtocols.set(protocols);
      this.filteredProtocols.set(protocols);
      this.logger.success(`Loaded ${protocols.length} recovery protocols`);
    } finally {
      this.loadingProtocols.set(false);
    }
  }

  private async loadAthleteProfile() {
    const profile = await firstValueFrom(
      this.recoveryService.getAthleteRecoveryProfile(),
    );
    this.athleteProfile.set(profile);
  }

  private async loadResearchInsights() {
    const insights = await firstValueFrom(
      this.recoveryService.getResearchInsights(),
    );
    this.researchInsights.set(insights);
  }

  private setupChartData() {
    // Setup chart data for analytics
    this.weeklyRecoveryData = {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Recovery Score",
          data: [75, 78, 72, 85, 80, 77, 82],
          borderColor: COLORS.PRIMARY_LIGHT,
          backgroundColor: `${COLORS.PRIMARY_LIGHT}1a`,
        },
      ],
    };

    this.protocolEffectivenessData = {
      labels: ["Cryotherapy", "Compression", "Manual Therapy", "Heat Therapy"],
      datasets: [
        {
          label: "Effectiveness Rating",
          data: [8.5, 7.8, 8.2, 7.5],
          backgroundColor: [
            COLORS.PRIMARY_LIGHT,
            COLORS.WARNING,
            COLORS.ERROR,
            COLORS.PURPLE_LIGHT,
          ],
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

  private setupSessionTimer(session: ServiceRecoverySession) {
    // Setup session timer and steps
    this.totalTime.set(session.duration); // Already in seconds
    this.timeRemaining.set(this.totalTime());
    this.sessionSteps.set(
      session.protocol.steps.map((step: ProtocolStep, index: number) => ({
        ...step,
        completed: false,
        active: index === 0,
      })),
    );

    // Start timer
    this.resumeSessionTimer();
  }

  private pauseSessionTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  private resumeSessionTimer() {
    if (this.timerSubscription) return;

    this.timerSubscription = timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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
      });
  }
}
