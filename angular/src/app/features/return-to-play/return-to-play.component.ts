/**
 * Return-to-Play Protocol Component
 *
 * Evidence-based graduated protocols for athletes returning from injury.
 * Implements 7-stage protocol with daily tracking and progression criteria.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { Component, inject, signal,  OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardModule } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { ChartModule } from 'primeng/chart';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButton } from 'primeng/radiobutton';
import { Select } from 'primeng/select';
import { Slider } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ApiService } from '../../core/services/api.service';
import { LoggerService } from '../../core/services/logger.service';
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

// ===== Interfaces =====
interface ProtocolStage {
  stage: number;
  name: string;
  shortName: string;
  loadPercentage: number;
  minimumDays: number;
  activities: string[];
  restrictions: string[];
  progressionCriteria: string[];
}

interface ActiveProtocol {
  id: string;
  injuryType: string;
  injuryLocation: string;
  severity: string;
  startDate: string;
  targetReturnDate: string;
  currentStage: number;
  daysInRecovery: number;
  daysInCurrentStage: number;
  progressPercentage: number;
  criteriaCompleted: boolean[];
  medicalNotes?: string;
}

interface DailyCheckin {
  id: string;
  date: string;
  painLevel: number;
  functionScore: number;
  confidenceLevel: number;
  activitiesCompleted: string[];
  notes?: string;
}

// RecoveryChartData reserved for future use
// interface RecoveryChartData {
//   labels: string[];
//   painLevels: number[];
//   functionScores: number[];
// }

// ===== Constants =====
const PROTOCOL_STAGES: ProtocolStage[] = [
  {
    stage: 1,
    name: 'Initial Rest',
    shortName: 'Rest',
    loadPercentage: 0,
    minimumDays: 2,
    activities: ['Complete rest', 'Ice application', 'Compression', 'Elevation', 'Medical treatment'],
    restrictions: ['No running', 'No sport activity', 'No weight bearing (if applicable)'],
    progressionCriteria: ['Pain at rest < 2/10', 'Swelling significantly reduced', 'Able to perform daily activities']
  },
  {
    stage: 2,
    name: 'Light Activity',
    shortName: 'Light Activ',
    loadPercentage: 20,
    minimumDays: 3,
    activities: ['Walking', 'Gentle stretching', 'Pool walking/swimming', 'Light mobility work'],
    restrictions: ['No sprinting', 'No cutting movements', 'No sport-specific drills'],
    progressionCriteria: ['Pain-free walking', 'ROM 90% of normal', 'No swelling after activity']
  },
  {
    stage: 3,
    name: 'Sport-Specific Low',
    shortName: 'Sport Low',
    loadPercentage: 40,
    minimumDays: 3,
    activities: ['Position drills at low intensity', 'Light jogging', 'Basic footwork', 'Throwing/catching (if applicable)'],
    restrictions: ['No full-speed running', 'No contact', 'No explosive movements'],
    progressionCriteria: ['Pain-free at 40% intensity', 'Light jogging without discomfort', 'No next-day soreness']
  },
  {
    stage: 4,
    name: 'Sport-Specific Moderate',
    shortName: 'Sport Med',
    loadPercentage: 60,
    minimumDays: 3,
    activities: ['Position-specific drills at 60% intensity', 'Jogging with direction changes', 'Non-contact team drills', 'Controlled agility work'],
    restrictions: ['No full-speed sprinting', 'No competition/scrimmage', 'No explosive cutting', 'No plyometrics'],
    progressionCriteria: ['Pain-free during all Stage 4 activities', 'No swelling or tenderness', '3 consecutive pain-free sessions', 'ROM > 90% of uninjured side', 'Strength > 80% of uninjured side']
  },
  {
    stage: 5,
    name: 'Sport-Specific High',
    shortName: 'Sport High',
    loadPercentage: 80,
    minimumDays: 3,
    activities: ['Full drills at 80% intensity', 'Sprint work', 'Agility drills', 'Non-contact scrimmage participation'],
    restrictions: ['No full competition', 'Limited contact'],
    progressionCriteria: ['Sprint pain-free', 'Strength > 90% of uninjured side', 'Full confidence in movements', 'No compensation patterns']
  },
  {
    stage: 6,
    name: 'Full Training',
    shortName: 'Full Train',
    loadPercentage: 100,
    minimumDays: 2,
    activities: ['Full team training', 'Complete practice participation', 'Contact drills (if applicable)', 'Game-speed activities'],
    restrictions: ['Monitor closely', 'May limit full game minutes initially'],
    progressionCriteria: ['Complete full practice without issues', 'No pain or swelling', 'Full strength and ROM', 'Coach approval']
  },
  {
    stage: 7,
    name: 'Full Competition',
    shortName: 'Full Comp',
    loadPercentage: 100,
    minimumDays: 0,
    activities: ['Full game participation', 'No restrictions'],
    restrictions: [],
    progressionCriteria: ['Medical clearance', 'Coach clearance', 'Player confidence']
  }
];

const INJURY_TYPES = [
  { label: 'Muscle Strain', value: 'muscle_strain' },
  { label: 'Ligament Sprain', value: 'ligament_sprain' },
  { label: 'Tendinopathy', value: 'tendinopathy' },
  { label: 'Bone Stress', value: 'bone_stress' },
  { label: 'Concussion', value: 'concussion' },
  { label: 'Illness', value: 'illness' },
  { label: 'General Absence (2+ weeks)', value: 'general_absence' }
];

const INJURY_LOCATIONS = [
  { label: 'Left Hamstring', value: 'left_hamstring' },
  { label: 'Right Hamstring', value: 'right_hamstring' },
  { label: 'Left Quad', value: 'left_quad' },
  { label: 'Right Quad', value: 'right_quad' },
  { label: 'Left Ankle', value: 'left_ankle' },
  { label: 'Right Ankle', value: 'right_ankle' },
  { label: 'Left Knee', value: 'left_knee' },
  { label: 'Right Knee', value: 'right_knee' },
  { label: 'Lower Back', value: 'lower_back' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Groin', value: 'groin' },
  { label: 'Calf', value: 'calf' },
  { label: 'Head/Neck', value: 'head_neck' },
  { label: 'Other', value: 'other' }
];

const SEVERITY_LEVELS = [
  { label: 'Mild (Grade I)', value: 'mild', days: 7 },
  { label: 'Moderate (Grade II)', value: 'moderate', days: 14 },
  { label: 'Severe (Grade III)', value: 'severe', days: 28 }
];

@Component({
  selector: 'app-return-to-play',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    Checkbox,
    ChartModule,
    DatePicker,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    ProgressBarModule,
    RadioButton,
    Select,
    Slider,
    TableModule,
    TagModule,
    TextareaModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent
  ,
    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="return-to-play-page">
        <app-page-header
          title="Return-to-Play Protocol"
          subtitle="Guided recovery from injury"
          icon="pi-heart-pulse"
        ></app-page-header>

        <!-- No Active Protocol State -->
        @if (!activeProtocol()) {
          <p-card styleClass="no-protocol-card">
            <div class="empty-state">
              <i class="pi pi-heart-pulse empty-icon"></i>
              <h3>No Active Recovery Protocol</h3>
              <p>Start a return-to-play protocol if you're recovering from an injury or extended absence.</p>
              <app-button iconLeft="pi-plus" (clicked)="openStartDialog()">Start Protocol</app-button>
            </div>
          </p-card>
        }

        <!-- Active Protocol Display -->
        @if (activeProtocol(); as protocol) {
          <!-- Protocol Overview Card -->
          <p-card styleClass="protocol-overview-card">
            <div class="protocol-header">
              <div class="injury-info">
                <div class="injury-badge">
                  <i class="pi pi-exclamation-triangle"></i>
                  {{ formatInjuryLocation(protocol.injuryLocation) }}
                </div>
                <span class="injury-type">{{ formatInjuryType(protocol.injuryType) }}</span>
              </div>
              <div class="date-info">
                <span>Started: {{ protocol.startDate | date:'MMM d, y' }}</span>
              </div>
            </div>

            <div class="protocol-stats">
              <div class="stat">
                <span class="stat-label">Severity</span>
                <p-tag 
                  [value]="formatSeverity(protocol.severity)" 
                  [severity]="getSeverityColor(protocol.severity)"
                ></p-tag>
              </div>
              <div class="stat">
                <span class="stat-label">Day of Recovery</span>
                <span class="stat-value">{{ protocol.daysInRecovery }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Est. Recovery</span>
                <span class="stat-value">{{ getEstimatedDays(protocol.severity) }} days</span>
              </div>
              <div class="stat">
                <span class="stat-label">Target Return</span>
                <span class="stat-value">{{ protocol.targetReturnDate | date:'MMM d' }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-label">
                <span>Overall Progress</span>
                <span>{{ protocol.progressPercentage }}% Complete</span>
              </div>
              <p-progressBar 
                [value]="protocol.progressPercentage" 
                [showValue]="false"
              ></p-progressBar>
            </div>
          </p-card>

          <!-- 7-Stage Protocol Progress -->
          <p-card header="7-Stage Protocol Progress" styleClass="stages-card">
            <div class="stages-visual">
              @for (stage of protocolStages; track stage.stage) {
                <div 
                  class="stage-box" 
                  [class.completed]="stage.stage < protocol.currentStage"
                  [class.current]="stage.stage === protocol.currentStage"
                  [class.upcoming]="stage.stage > protocol.currentStage"
                >
                  <div class="stage-number">{{ stage.stage }}</div>
                  <div class="stage-icon">
                    @if (stage.stage < protocol.currentStage) {
                      <i class="pi pi-check"></i>
                    } @else if (stage.stage === protocol.currentStage) {
                      <i class="pi pi-circle-fill"></i>
                    }
                  </div>
                  <div class="stage-name">{{ stage.shortName }}</div>
                  <div class="stage-load">{{ stage.loadPercentage }}%</div>
                </div>
                @if (stage.stage < 7) {
                  <div class="stage-connector" [class.active]="stage.stage < protocol.currentStage"></div>
                }
              }
            </div>
            <div class="current-indicator">
              <i class="pi pi-arrow-up"></i>
              <span>CURRENT</span>
            </div>
          </p-card>

          <!-- Current Stage Details -->
          <p-card styleClass="current-stage-card">
            <ng-template pTemplate="header">
              <div class="stage-detail-header">
                <div class="stage-title">
                  <span>Stage {{ protocol.currentStage }}: {{ getCurrentStage().name }}</span>
                </div>
                <p-tag [value]="'Load: ' + getCurrentStage().loadPercentage + '%'" severity="info"></p-tag>
              </div>
            </ng-template>

            <div class="stage-day-info">
              <i class="pi pi-calendar"></i>
              <span>Day {{ protocol.daysInCurrentStage }} of Stage {{ protocol.currentStage }}</span>
              <span class="min-days">(Minimum: {{ getCurrentStage().minimumDays }} days)</span>
            </div>

            <div class="activities-section">
              <h4><i class="pi pi-check-circle"></i> ALLOWED ACTIVITIES</h4>
              <div class="activities-list allowed">
                @for (activity of getCurrentStage().activities; track activity) {
                  <div class="activity-item">• {{ activity }}</div>
                }
              </div>
            </div>

            @if (getCurrentStage().restrictions.length > 0) {
              <div class="activities-section">
                <h4><i class="pi pi-times-circle"></i> RESTRICTIONS</h4>
                <div class="activities-list restricted">
                  @for (restriction of getCurrentStage().restrictions; track restriction) {
                    <div class="activity-item">• {{ restriction }}</div>
                  }
                </div>
              </div>
            }

            <div class="progression-criteria">
              <h4><i class="pi pi-flag"></i> PROGRESSION CRITERIA (Complete ALL to advance)</h4>
              <div class="criteria-list">
                @for (criterion of getCurrentStage().progressionCriteria; track criterion; let i = $index) {
                  <div class="criterion-item">
                    <p-checkbox 
                      [(ngModel)]="protocol.criteriaCompleted[i]" 
                      [binary]="true"
                      [inputId]="'criterion-' + i"
                      (onChange)="updateCriterion(i, $event)"
                    ></p-checkbox>
                    <label [for]="'criterion-' + i">{{ criterion }}</label>
                  </div>
                }
              </div>
            </div>

            <div class="advance-section">
              <app-button iconLeft="pi-arrow-right" [disabled]="!canAdvanceStage()" (clicked)="advanceStage()">Ready to Advance</app-button>
              @if (!canAdvanceStage()) {
                <small class="advance-hint">
                  Complete all criteria and minimum {{ getCurrentStage().minimumDays }} days to advance
                </small>
              }
            </div>
          </p-card>

          <!-- Daily Tracking Section -->
          <p-card header="Daily Tracking" styleClass="daily-tracking-card">
            <div class="checkin-form">
              <h4><i class="pi pi-pencil"></i> Today's Check-in</h4>

              <div class="metrics-row">
                <div class="metric-input">
                  <label>Pain Level (0-10)</label>
                  <small>0 = No pain, 10 = Severe</small>
                  <p-slider 
                    [(ngModel)]="todayCheckin.painLevel" 
                    [min]="0" 
                    [max]="10" 
                    [step]="1"
                  ></p-slider>
                  <div class="slider-value" [class.good]="todayCheckin.painLevel <= 3" [class.moderate]="todayCheckin.painLevel > 3 && todayCheckin.painLevel <= 6" [class.bad]="todayCheckin.painLevel > 6">
                    {{ todayCheckin.painLevel }}/10
                  </div>
                </div>

                <div class="metric-input">
                  <label>Function Score (%)</label>
                  <small>Compared to pre-injury baseline</small>
                  <p-slider 
                    [(ngModel)]="todayCheckin.functionScore" 
                    [min]="0" 
                    [max]="100" 
                    [step]="5"
                  ></p-slider>
                  <div class="slider-value">{{ todayCheckin.functionScore }}%</div>
                </div>
              </div>

              <div class="metrics-row">
                <div class="metric-input">
                  <label>Confidence Level (1-10)</label>
                  <small>Trust in injured area</small>
                  <p-slider 
                    [(ngModel)]="todayCheckin.confidenceLevel" 
                    [min]="1" 
                    [max]="10" 
                    [step]="1"
                  ></p-slider>
                  <div class="slider-value">{{ todayCheckin.confidenceLevel }}/10</div>
                </div>

                <div class="activities-checklist">
                  <label>Activities Completed Today</label>
                  @for (activity of getCurrentStage().activities.slice(0, 4); track activity; let i = $index) {
                    <div class="activity-check">
                      <p-checkbox 
                        [value]="activity"
                        [(ngModel)]="todayCheckin.activitiesCompleted"
                        [inputId]="'activity-' + i"
                      ></p-checkbox>
                      <label [for]="'activity-' + i">{{ activity }}</label>
                    </div>
                  }
                </div>
              </div>

              <div class="notes-section">
                <label for="checkin-notes">Notes</label>
                <textarea 
                  pInputTextarea 
                  id="checkin-notes"
                  [(ngModel)]="todayCheckin.notes" 
                  rows="2"
                  placeholder="Any observations, tightness, or concerns..."
                ></textarea>
              </div>

              <app-button iconLeft="pi-check" [loading]="isSavingCheckin()" (clicked)="saveCheckin()">Save Check-in</app-button>
            </div>
          </p-card>

          <!-- Recovery Progress Chart -->
          <p-card header="Recovery Progress Chart" styleClass="chart-card">
            @if (chartData()) {
              <p-chart type="line" [data]="chartData()" [options]="chartOptions"></p-chart>
            } @else {
              <div class="empty-state small">
                <i class="pi pi-chart-line"></i>
                <p>Log check-ins to see your recovery progress</p>
              </div>
            }
          </p-card>

          <!-- Recent Check-ins -->
          @if (recentCheckins().length > 0) {
            <p-card header="Recent Check-ins" styleClass="checkins-card">
              <p-table [value]="recentCheckins()" [rows]="5" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Date</th>
                    <th>Pain</th>
                    <th>Function</th>
                    <th>Confidence</th>
                    <th>Notes</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-checkin>
                  <tr>
                    <td>{{ checkin.date | date:'EEE, MMM d' }}</td>
                    <td>
                      <span [class]="getPainClass(checkin.painLevel)">{{ checkin.painLevel }}/10</span>
                    </td>
                    <td>{{ checkin.functionScore }}%</td>
                    <td>{{ checkin.confidenceLevel }}/10</td>
                    <td class="notes-cell">{{ checkin.notes || '-' }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-card>
          }
        }
      </div>

      <!-- Start Protocol Dialog -->
      <p-dialog
        header="Start Return-to-Play Protocol"
        [modal]="true"
        [visible]="showStartDialog()"
        (visibleChange)="showStartDialog.set($event)"
        [style]="{ width: '550px' }"
        [breakpoints]="{ '640px': '95vw' }"
        [draggable]="false"
      >
        <div class="start-form">
          <!-- Injury Type -->
          <div class="form-field">
            <label>Injury Type *</label>
            <div class="injury-type-options">
              @for (type of injuryTypes; track type.value) {
                <div class="type-option">
                  <p-radioButton 
                    [value]="type.value" 
                    [(ngModel)]="newProtocol.injuryType"
                    [inputId]="'type-' + type.value"
                  ></p-radioButton>
                  <label [for]="'type-' + type.value">{{ type.label }}</label>
                </div>
              }
            </div>
          </div>

          <!-- Location & Severity Row -->
          <div class="form-row">
            <div class="form-field">
              <label for="injury-location">Injury Location *</label>
              <p-select
                id="injury-location"
                [options]="injuryLocations"
                [(ngModel)]="newProtocol.injuryLocation"
                optionLabel="label"
                optionValue="value"
                placeholder="Select location"
                [style]="{ width: '100%' }"
              ></p-select>
            </div>
            <div class="form-field">
              <label for="severity">Severity *</label>
              <p-select
                id="severity"
                [options]="severityLevels"
                [(ngModel)]="newProtocol.severity"
                optionLabel="label"
                optionValue="value"
                placeholder="Select severity"
                [style]="{ width: '100%' }"
                (onChange)="onSeverityChange()"
              ></p-select>
            </div>
          </div>

          <!-- Date Row -->
          <div class="form-row">
            <div class="form-field">
              <label for="injury-date">Injury Date *</label>
              <p-datepicker
                id="injury-date"
                [(ngModel)]="newProtocol.injuryDate"
                [maxDate]="today"
                dateFormat="M dd, yy"
                [showIcon]="true"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>
            <div class="form-field">
              <label for="return-date">Expected Return Date</label>
              <p-datepicker
                id="return-date"
                [(ngModel)]="newProtocol.targetReturnDate"
                [minDate]="today"
                dateFormat="M dd, yy"
                [showIcon]="true"
                [style]="{ width: '100%' }"
                placeholder="Auto-calculated"
              ></p-datepicker>
            </div>
          </div>

          <!-- Medical Notes -->
          <div class="form-field">
            <label for="medical-notes">Medical Professional Notes (optional)</label>
            <textarea 
              pInputTextarea 
              id="medical-notes"
              [(ngModel)]="newProtocol.medicalNotes" 
              rows="2"
              placeholder="Diagnosed by team physio. MRI confirmed..."
            ></textarea>
          </div>

          <!-- Acknowledgments -->
          <div class="acknowledgments">
            <div class="ack-item">
              <p-checkbox 
                [(ngModel)]="newProtocol.understandProtocol" 
                [binary]="true"
                inputId="understand"
              ></p-checkbox>
              <label for="understand">I understand this protocol and will follow it responsibly</label>
            </div>
            <div class="ack-item">
              <p-checkbox 
                [(ngModel)]="newProtocol.notifyCoach" 
                [binary]="true"
                inputId="notify"
              ></p-checkbox>
              <label for="notify">Coach will be notified of my recovery status</label>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="outlined" (clicked)="closeStartDialog()">Cancel</app-button>
          <app-button iconLeft="pi-check" [loading]="isStartingProtocol()" [disabled]="!isStartFormValid()" (clicked)="startProtocol()">Start Protocol</app-button>
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: './return-to-play.component.scss'
})
export class ReturnToPlayComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly activeProtocol = signal<ActiveProtocol | null>(null);
  readonly recentCheckins = signal<DailyCheckin[]>([]);
  readonly showStartDialog = signal(false);
  readonly isStartingProtocol = signal(false);
  readonly isSavingCheckin = signal(false);
  readonly chartData = signal<object | null>(null);

  // Constants
  readonly protocolStages = PROTOCOL_STAGES;
  readonly injuryTypes = INJURY_TYPES;
  readonly injuryLocations = INJURY_LOCATIONS;
  readonly severityLevels = SEVERITY_LEVELS;
  readonly today = new Date();

  // Form data
  newProtocol = this.getEmptyProtocolForm();
  todayCheckin = this.getEmptyCheckinForm();

  // Chart options
  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  };

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(this.api.get('/api/return-to-play'));
      if (response?.success && response.data) {
        if (response.data.activeProtocol) {
          this.activeProtocol.set(response.data.activeProtocol);
        }
        if (response.data.checkins) {
          this.recentCheckins.set(response.data.checkins);
          this.updateChartData(response.data.checkins);
        }
      }
    } catch (err) {
      this.logger.error('Failed to load return-to-play data', err);
      // No active protocol - user hasn't started one
      this.activeProtocol.set(null);
      this.recentCheckins.set([]);
    }
  }

  private updateChartData(checkins: DailyCheckin[]): void {
    if (checkins.length === 0) {
      this.chartData.set(null);
      return;
    }

    const reversed = [...checkins].reverse();
    this.chartData.set({
      labels: reversed.map(c => new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Pain Level',
          data: reversed.map(c => c.painLevel),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3
        },
        {
          label: 'Function Score (÷10)',
          data: reversed.map(c => c.functionScore / 10),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3
        }
      ]
    });
  }

  getCurrentStage(): ProtocolStage {
    const protocol = this.activeProtocol();
    if (!protocol) return PROTOCOL_STAGES[0];
    return PROTOCOL_STAGES[protocol.currentStage - 1] || PROTOCOL_STAGES[0];
  }

  canAdvanceStage(): boolean {
    const protocol = this.activeProtocol();
    if (!protocol) return false;

    const currentStage = this.getCurrentStage();
    const allCriteriaComplete = protocol.criteriaCompleted.every(c => c);
    const minDaysMet = protocol.daysInCurrentStage >= currentStage.minimumDays;

    return allCriteriaComplete && minDaysMet && protocol.currentStage < 7;
  }

  async advanceStage(): Promise<void> {
    const protocol = this.activeProtocol();
    if (!protocol || !this.canAdvanceStage()) return;

    try {
      await firstValueFrom(this.api.post('/api/return-to-play/advance', {
        protocolId: protocol.id
      }));

      // Update local state
      this.activeProtocol.update(p => {
        if (!p) return p;
        return {
          ...p,
          currentStage: p.currentStage + 1,
          daysInCurrentStage: 0,
          criteriaCompleted: new Array(PROTOCOL_STAGES[p.currentStage].progressionCriteria.length).fill(false),
          progressPercentage: Math.round((p.currentStage / 7) * 100)
        };
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Stage Advanced',
        detail: `Congratulations! You've progressed to Stage ${protocol.currentStage + 1}`,
        life: 4000
      });
    } catch (err) {
      this.logger.error('Failed to advance stage', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to advance stage. Please try again.'
      });
    }
  }

  updateCriterion(index: number, event: { checked?: boolean }): void {
    const protocol = this.activeProtocol();
    if (!protocol) return;

    // Update local state immediately for responsiveness
    this.activeProtocol.update(p => {
      if (!p) return p;
      const newCriteria = [...p.criteriaCompleted];
      newCriteria[index] = event.checked ?? false;
      return { ...p, criteriaCompleted: newCriteria };
    });

    // Save to backend
    this.api.post('/api/return-to-play/criterion', {
      protocolId: protocol.id,
      criterionIndex: index,
      completed: event.checked
    }).subscribe({
      error: (err) => this.logger.error('Failed to update criterion', err)
    });
  }

  async saveCheckin(): Promise<void> {
    this.isSavingCheckin.set(true);

    try {
      await firstValueFrom(this.api.post('/api/return-to-play/checkin', {
        protocolId: this.activeProtocol()?.id,
        ...this.todayCheckin
      }));

      // Add to local checkins
      const newCheckin: DailyCheckin = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...this.todayCheckin
      };
      this.recentCheckins.update(checkins => [newCheckin, ...checkins]);
      this.updateChartData([newCheckin, ...this.recentCheckins()]);

      // Reset form
      this.todayCheckin = this.getEmptyCheckinForm();

      this.messageService.add({
        severity: 'success',
        summary: 'Check-in Saved',
        detail: 'Your daily recovery check-in has been recorded.',
        life: 3000
      });
    } catch (err) {
      this.logger.error('Failed to save checkin', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save check-in. Please try again.'
      });
    } finally {
      this.isSavingCheckin.set(false);
    }
  }

  openStartDialog(): void {
    this.newProtocol = this.getEmptyProtocolForm();
    this.showStartDialog.set(true);
  }

  closeStartDialog(): void {
    this.showStartDialog.set(false);
  }

  onSeverityChange(): void {
    // Auto-calculate target return date based on severity
    const severity = SEVERITY_LEVELS.find(s => s.value === this.newProtocol.severity);
    if (severity && this.newProtocol.injuryDate) {
      const targetDate = new Date(this.newProtocol.injuryDate);
      targetDate.setDate(targetDate.getDate() + severity.days);
      this.newProtocol.targetReturnDate = targetDate;
    }
  }

  isStartFormValid(): boolean {
    return !!(
      this.newProtocol.injuryType &&
      this.newProtocol.injuryLocation &&
      this.newProtocol.severity &&
      this.newProtocol.injuryDate &&
      this.newProtocol.understandProtocol
    );
  }

  async startProtocol(): Promise<void> {
    if (!this.isStartFormValid()) return;

    this.isStartingProtocol.set(true);

    try {
      const response = await firstValueFrom(this.api.post('/api/return-to-play/start', this.newProtocol));

      // Create local protocol
      const _severity = SEVERITY_LEVELS.find(s => s.value === this.newProtocol.severity);
      const proto = this.newProtocol;
      const newProtocol: ActiveProtocol = {
        id: (response as { data?: { id: string } })?.data?.id || Date.now().toString(),
        injuryType: proto.injuryType ?? '',
        injuryLocation: proto.injuryLocation ?? '',
        severity: proto.severity ?? 'mild',
        startDate: proto.injuryDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0],
        targetReturnDate: this.newProtocol.targetReturnDate?.toISOString().split('T')[0] || '',
        currentStage: 1,
        daysInRecovery: 1,
        daysInCurrentStage: 1,
        progressPercentage: 5,
        criteriaCompleted: new Array(PROTOCOL_STAGES[0].progressionCriteria.length).fill(false),
        medicalNotes: this.newProtocol.medicalNotes
      };

      this.activeProtocol.set(newProtocol);
      this.closeStartDialog();

      this.messageService.add({
        severity: 'success',
        summary: 'Protocol Started',
        detail: `Your ${_severity?.days || 14}-day recovery protocol has begun. Follow the stages carefully.`,
        life: 5000
      });
    } catch (err) {
      this.logger.error('Failed to start protocol', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to start protocol. Please try again.'
      });
    } finally {
      this.isStartingProtocol.set(false);
    }
  }

  // Helper methods
  formatInjuryType(type: string): string {
    return INJURY_TYPES.find(t => t.value === type)?.label || type;
  }

  formatInjuryLocation(location: string): string {
    return INJURY_LOCATIONS.find(l => l.value === location)?.label || location;
  }

  formatSeverity(severity: string): string {
    return SEVERITY_LEVELS.find(s => s.value === severity)?.label || severity;
  }

  getSeverityColor(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const colors: Record<string, 'success' | 'warn' | 'danger'> = {
      mild: 'success',
      moderate: 'warn',
      severe: 'danger'
    };
    return colors[severity] || 'info';
  }

  getEstimatedDays(severity: string): number {
    return SEVERITY_LEVELS.find(s => s.value === severity)?.days || 14;
  }

  getPainClass(painLevel: number): string {
    if (painLevel <= 3) return 'pain-good';
    if (painLevel <= 6) return 'pain-moderate';
    return 'pain-bad';
  }

  private getEmptyProtocolForm() {
    return {
      injuryType: null as string | null,
      injuryLocation: null as string | null,
      severity: null as string | null,
      injuryDate: new Date() as Date | null,
      targetReturnDate: null as Date | null,
      medicalNotes: '',
      understandProtocol: false,
      notifyCoach: true
    };
  }

  private getEmptyCheckinForm() {
    return {
      painLevel: 3,
      functionScore: 50,
      confidenceLevel: 5,
      activitiesCompleted: [] as string[],
      notes: ''
    };
  }
}
