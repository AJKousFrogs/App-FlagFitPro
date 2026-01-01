import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { KnobModule } from "primeng/knob";
import { ProgressBarModule } from "primeng/progressbar";
import { Tabs } from "primeng/tabs";
import { TimelineModule } from "primeng/timeline";
import { SelectButtonModule } from "primeng/selectbutton";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import {
  RecoveryService,
  RecoveryProtocol as ServiceRecoveryProtocol,
  RecoverySession as ServiceRecoverySession,
  AthleteRecoveryProfile,
} from "../../../core/services/recovery.service";
import { firstValueFrom, timer, Subscription } from "rxjs";
import { LoggerService } from "../../../core/services/logger.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
    ButtonModule,
    TagModule,
    KnobModule,
    ProgressBarModule,
    Tabs,
    TimelineModule,
    SelectButtonModule,
    DialogModule,
    TooltipModule,
    CountdownTimerComponent,
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
                        benefit of protocol.benefits.slice(0, 4);
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
                      >{{ protocol.equipment.slice(0, 2).join(", ")
                      }}{{ protocol.equipment.length > 2 ? "..." : "" }}</span
                    >
                  </div>
                }

                <div class="protocol-actions">
                  <p-button
                    label="Start Protocol"
                    icon="pi pi-play"
                    size="small"
                    (onClick)="
                      startProtocol(protocol); $event.stopPropagation()
                    "
                  >
                  </p-button>

                  <p-button
                    label="Details"
                    icon="pi pi-info-circle"
                    [outlined]="true"
                    size="small"
                    (onClick)="
                      showProtocolDetails(protocol); $event.stopPropagation()
                    "
                  >
                  </p-button>
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
              <p-button
                label="Start This Protocol"
                icon="pi pi-play"
                (onClick)="
                  startProtocol(selectedProtocolDetails()!);
                  showProtocolDialog = false
                "
              >
              </p-button>
              <p-button
                label="Close"
                [outlined]="true"
                (onClick)="showProtocolDialog = false"
              >
              </p-button>
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
              <p-button
                [label]="sessionPaused() ? 'Resume' : 'Pause'"
                [icon]="sessionPaused() ? 'pi pi-play' : 'pi pi-pause'"
                (onClick)="toggleSession()"
              >
              </p-button>

              <p-button
                label="Complete Session"
                icon="pi pi-check"
                severity="success"
                (onClick)="completeSession()"
              >
              </p-button>

              <p-button
                label="Stop Session"
                icon="pi pi-stop"
                severity="danger"
                [outlined]="true"
                (onClick)="stopSession()"
              >
              </p-button>
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
                    <p-button
                      label="Read Study"
                      icon="pi pi-external-link"
                      [text]="true"
                      size="small"
                      (onClick)="openStudy(insight.doi)"
                    >
                    </p-button>
                  </div>
                </div>
              }
            </div>
          </p-tabpanel>
        </p-tabs>
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

      /* Category Filter */
      .category-filter {
        margin-bottom: 1.5rem;
        display: flex;
        justify-content: center;
      }

      .category-filter :deep(.p-selectbutton) {
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      /* Loading and Empty States */
      .loading-protocols,
      .no-protocols {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
        color: var(--p-text-color-secondary);
      }

      .loading-protocols i,
      .no-protocols i {
        font-size: 2rem;
      }

      /* Protocol Card Enhancements */
      .protocol-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-100);
        margin-right: 0.75rem;
      }

      .protocol-icon i {
        font-size: 1.5rem;
        color: var(--p-primary-color);
      }

      .protocol-info {
        display: flex;
        align-items: center;
      }

      .protocol-card.category-cryotherapy .protocol-icon {
        background: rgba(59, 130, 246, 0.1);
      }
      .protocol-card.category-cryotherapy .protocol-icon i {
        color: #3b82f6;
      }

      .protocol-card.category-compression .protocol-icon {
        background: rgba(16, 185, 129, 0.1);
      }
      .protocol-card.category-compression .protocol-icon i {
        color: #10b981;
      }

      .protocol-card.category-manual .protocol-icon {
        background: rgba(245, 158, 11, 0.1);
      }
      .protocol-card.category-manual .protocol-icon i {
        color: #f59e0b;
      }

      .protocol-card.category-heat .protocol-icon {
        background: rgba(239, 68, 68, 0.1);
      }
      .protocol-card.category-heat .protocol-icon i {
        color: #ef4444;
      }

      .protocol-card.priority-high {
        border-left: 4px solid var(--p-orange-500);
      }

      .priority-badge {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: var(--p-orange-100);
        color: var(--p-orange-700);
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .priority-badge i {
        font-size: 0.625rem;
      }

      .duration {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .evidence-badge.evidence-strong {
        background: var(--p-green-100);
        border-color: var(--p-green-300);
      }

      .more-benefits {
        color: var(--p-primary-color);
        font-style: italic;
      }

      .equipment-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--p-surface-50);
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      /* Protocol Details Dialog */
      .protocol-details {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .detail-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-100);
      }

      .detail-icon i {
        font-size: 2rem;
        color: var(--p-primary-color);
      }

      .detail-icon.category-cryotherapy {
        background: rgba(59, 130, 246, 0.1);
      }
      .detail-icon.category-cryotherapy i {
        color: #3b82f6;
      }

      .detail-icon.category-compression {
        background: rgba(16, 185, 129, 0.1);
      }
      .detail-icon.category-compression i {
        color: #10b981;
      }

      .detail-icon.category-manual-therapy {
        background: rgba(245, 158, 11, 0.1);
      }
      .detail-icon.category-manual-therapy i {
        color: #f59e0b;
      }

      .detail-icon.category-heat-therapy {
        background: rgba(239, 68, 68, 0.1);
      }
      .detail-icon.category-heat-therapy i {
        color: #ef4444;
      }

      .detail-header h2 {
        margin: 0 0 0.5rem 0;
        color: var(--p-text-color);
      }

      .detail-description {
        margin: 0;
        color: var(--p-text-color-secondary);
        line-height: 1.6;
      }

      .detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1rem;
        background: var(--p-surface-50);
        border-radius: 8px;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--p-text-color-secondary);
      }

      .meta-item i {
        color: var(--p-primary-color);
      }

      .detail-section {
        border-top: 1px solid var(--p-surface-border);
        padding-top: 1rem;
      }

      .detail-section h4 {
        margin: 0 0 0.75rem 0;
        color: var(--p-text-color);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .detail-section h4 i {
        color: var(--p-primary-color);
      }

      .detail-section ul {
        margin: 0;
        padding-left: 1.25rem;
      }

      .detail-section li {
        margin: 0.25rem 0;
        color: var(--p-text-color-secondary);
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .steps-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .step-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: var(--p-surface-50);
        border-radius: 8px;
      }

      .step-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--p-primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      }

      .step-info {
        flex: 1;
      }

      .step-info strong {
        display: block;
        color: var(--p-text-color);
        margin-bottom: 0.25rem;
      }

      .step-info p {
        margin: 0 0 0.5rem 0;
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
      }

      .step-info .step-duration {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: var(--p-text-color-secondary);
      }

      .detail-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding-top: 1rem;
        border-top: 1px solid var(--p-surface-border);
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .status-overview {
          flex-direction: column;
        }

        .protocols-grid {
          grid-template-columns: 1fr;
        }

        .session-content {
          grid-template-columns: 1fr;
        }

        .session-timer {
          grid-column: 1;
          grid-row: 2;
        }

        .session-steps {
          grid-row: 3;
        }

        .session-controls {
          grid-row: 4;
          flex-wrap: wrap;
        }

        .category-filter :deep(.p-selectbutton) {
          justify-content: center;
        }

        .detail-meta {
          flex-direction: column;
        }
      }
    `,
  ],
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
    if (score >= 80) return "#10c96b";
    if (score >= 60) return "#f1c40f";
    return "#ef4444";
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
    this.logger.debug("Selected protocol:", protocol);
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
          borderColor: "#10c96b",
          backgroundColor: "rgba(16, 201, 107, 0.1)",
        },
      ],
    };

    this.protocolEffectivenessData = {
      labels: ["Cryotherapy", "Compression", "Manual Therapy", "Heat Therapy"],
      datasets: [
        {
          label: "Effectiveness Rating",
          data: [8.5, 7.8, 8.2, 7.5],
          backgroundColor: ["#10c96b", "#f1c40f", "#ef4444", "#8b5cf6"],
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
