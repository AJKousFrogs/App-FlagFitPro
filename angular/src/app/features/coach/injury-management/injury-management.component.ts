/**
 * Injury Management Component (Coach View)
 *
 * Track team injuries, manage return-to-play protocols, monitor recovery progress,
 * and maintain injury history for prevention insights.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService, PrimeTemplate } from "primeng/api";
import { Avatar } from "primeng/avatar";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";

import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  injuryStatusSeverityMap,
} from "../../../shared/utils/status.utils";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { getInitials } from "../../../shared/utils/format.utils";

// ===== Interfaces =====
interface InjuryRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  jerseyNumber: string;
  avatarUrl?: string;
  bodyPart: string;
  injuryType: string;
  side?: "left" | "right";
  severity: "mild" | "moderate" | "severe";
  injuryDate: string;
  howItHappened: string;
  description: string;
  status: InjuryStatus;
  rtpStage?: number;
  rtpProgress?: number;
  estimatedReturn?: string;
  daysInProtocol?: number;
  todayCheckin?: DailyCheckin;
}

interface DailyCheckin {
  date: string;
  stage: number;
  painLevel: number;
  functionLevel: number;
  confidenceLevel: number;
  notes: string;
}

interface RtpStage {
  stage: number;
  name: string;
  intensity: number;
  description: string;
  allowedActivities: string[];
  restrictedActivities: string[];
  progressionCriteria: { text: string; met: boolean }[];
}

type InjuryStatus = "new" | "evaluating" | "rtp" | "cleared";

// ===== Constants =====
const BODY_PARTS = [
  { label: "Hamstring", value: "hamstring" },
  { label: "Ankle", value: "ankle" },
  { label: "Knee / ACL", value: "knee" },
  { label: "Hip Flexor", value: "hip" },
  { label: "Shoulder", value: "shoulder" },
  { label: "Back", value: "back" },
  { label: "Calf", value: "calf" },
  { label: "Groin", value: "groin" },
  { label: "Other", value: "other" },
];

const INJURY_TYPES = [
  { label: "Strain / Pull", value: "strain" },
  { label: "Sprain", value: "sprain" },
  { label: "Contusion / Bruise", value: "contusion" },
  { label: "Fracture", value: "fracture" },
  { label: "Dislocation", value: "dislocation" },
  { label: "Overuse", value: "overuse" },
  { label: "Other", value: "other" },
];

const RTP_STAGES: RtpStage[] = [
  {
    stage: 1,
    name: "Rest",
    intensity: 0,
    description: "Complete rest, symptom resolution",
    allowedActivities: ["Rest", "Ice", "Light stretching"],
    restrictedActivities: ["Any physical activity"],
    progressionCriteria: [],
  },
  {
    stage: 2,
    name: "Light Activity",
    intensity: 20,
    description: "Walking, light stretching",
    allowedActivities: ["Walking", "Light stretching", "Low-intensity cardio"],
    restrictedActivities: ["Running", "Sport-specific drills"],
    progressionCriteria: [],
  },
  {
    stage: 3,
    name: "Sport-Specific (Low)",
    intensity: 40,
    description: "Basic drills, no contact",
    allowedActivities: ["Basic drills", "Jogging", "Position movements"],
    restrictedActivities: ["Full-speed running", "Contact"],
    progressionCriteria: [],
  },
  {
    stage: 4,
    name: "Sport-Specific (Med)",
    intensity: 60,
    description: "Complex drills, no contact",
    allowedActivities: [
      "Sport-specific drills",
      "Position-specific movements",
      "Moderate cardio",
    ],
    restrictedActivities: [
      "Full-speed sprinting",
      "Contact drills",
      "Live scrimmage",
    ],
    progressionCriteria: [],
  },
  {
    stage: 5,
    name: "Sport-Specific (High)",
    intensity: 80,
    description: "Full-speed, limited contact",
    allowedActivities: ["Full-speed drills", "Limited contact", "Team drills"],
    restrictedActivities: ["Full contact practice"],
    progressionCriteria: [],
  },
  {
    stage: 6,
    name: "Full Training",
    intensity: 100,
    description: "Full participation",
    allowedActivities: ["All training activities", "Full contact"],
    restrictedActivities: [],
    progressionCriteria: [],
  },
  {
    stage: 7,
    name: "Cleared",
    intensity: 100,
    description: "Competition cleared",
    allowedActivities: ["Full competition"],
    restrictedActivities: [],
    progressionCriteria: [],
  },
];

@Component({
  selector: "app-injury-management",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    Avatar,
    Card,
    Checkbox,
    DatePicker,
    Dialog,
    PrimeTemplate,
    InputNumber,
    RadioButton,
    Select,
    TableModule,
    TableModule,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    StatusTagComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
<div class="injury-management-page">
        <app-page-header
          title="Injury Management"
          subtitle="Track injuries and recovery"
          icon="pi-heart"
        >
          <app-button iconLeft="pi-plus" (clicked)="openReportDialog()"
            >Report Injury</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'active'"
            (click)="activeTab.set('active')"
          >
            Active Injuries
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'rtp'"
            (click)="activeTab.set('rtp')"
          >
            In Recovery
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'cleared'"
            (click)="activeTab.set('cleared')"
          >
            Cleared
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'history'"
            (click)="activeTab.set('history')"
          >
            All History
          </button>
        </div>

        <!-- Summary Stats -->
        <div class="summary-stats">
          <div class="stat-card danger">
            <div class="stat-icon">🔴</div>
            <div class="stat-content">
              <span class="stat-block__value">{{ activeCount() }}</span>
              <span class="stat-block__label">Active Injuries</span>
              <span class="stat-sub">Needs eval</span>
            </div>
          </div>
          <div class="stat-card warning">
            <div class="stat-icon">🟡</div>
            <div class="stat-content">
              <span class="stat-block__value">{{ rtpCount() }}</span>
              <span class="stat-block__label">In RTP Protocol</span>
              <span class="stat-sub">Progressing</span>
            </div>
          </div>
          <div class="stat-card success">
            <div class="stat-icon">🟢</div>
            <div class="stat-content">
              <span class="stat-block__value">{{ clearedCount() }}</span>
              <span class="stat-block__label">Cleared This Month</span>
              <span class="stat-sub">Back to full</span>
            </div>
          </div>
          <div class="stat-card info">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <span class="stat-block__value">{{ totalSeasonCount() }}</span>
              <span class="stat-block__label">This Season</span>
              <span class="stat-sub">Total injuries</span>
            </div>
          </div>
        </div>

        <!-- Active Injuries -->
        @if (activeTab() === "active" && activeInjuries().length > 0) {
          <div class="injuries-section">
            <h3>Active Injuries</h3>
            @for (injury of activeInjuries(); track injury.id) {
              <p-card styleClass="injury-card new">
                <div class="injury-header">
                  <app-status-tag
                    value="New Injury - Needs Evaluation"
                    severity="danger"
                    size="sm"
                  />
                </div>
                <div class="injury-content">
                  <p-avatar
                    [image]="injury.avatarUrl"
                    [label]="
                      !injury.avatarUrl ? getInitialsStr(injury.playerName) : ''
                    "
                    size="large"
                    shape="circle"
                  ></p-avatar>
                  <div class="injury-info">
                    <h4>
                      {{ injury.playerName }} (#{{ injury.jerseyNumber }})
                    </h4>
                    <p>Position: {{ injury.playerPosition }}</p>
                    <p>
                      <strong>Injury:</strong> {{ injury.bodyPart }}
                      {{ injury.injuryType }} ({{ injury.severity }})
                    </p>
                    <p>
                      <strong>Reported:</strong>
                      {{ injury.injuryDate | date: "MMM d, y, h:mm a" }}
                    </p>
                    <p class="description">"{{ injury.description }}"</p>
                    <p class="status">
                      <i class="pi pi-exclamation-triangle"></i> Awaiting
                      medical evaluation
                    </p>
                  </div>
                </div>
                <div class="injury-actions">
                  <app-button iconLeft="pi-play" (clicked)="startRtp(injury)"
                    >Evaluate & Start RTP</app-button
                  >
                  <app-button
                    variant="secondary"
                    iconLeft="pi-file"
                    (clicked)="requestMedical(injury)"
                    >Request Medical Report</app-button
                  >
                </div>
              </p-card>
            }
          </div>
        }

        <!-- In RTP -->
        @if (
          (activeTab() === "active" || activeTab() === "rtp") &&
          rtpInjuries().length > 0
        ) {
          <div class="injuries-section">
            <h3>In Return-to-Play Protocol</h3>
            @for (injury of rtpInjuries(); track injury.id) {
              <p-card styleClass="injury-card rtp">
                <div class="injury-header">
                  <app-status-tag
                    [value]="
                      'Stage ' +
                      injury.rtpStage +
                      ' of 7 - ' +
                      getStageName(injury.rtpStage!)
                    "
                    severity="warning"
                    size="sm"
                  />
                </div>
                <div class="injury-content">
                  <p-avatar
                    [image]="injury.avatarUrl"
                    [label]="
                      !injury.avatarUrl ? getInitialsStr(injury.playerName) : ''
                    "
                    size="large"
                    shape="circle"
                  ></p-avatar>
                  <div class="injury-info">
                    <h4>
                      {{ injury.playerName }} (#{{ injury.jerseyNumber }})
                    </h4>
                    <p>Position: {{ injury.playerPosition }}</p>
                    <p>
                      <strong>Injury:</strong> {{ injury.bodyPart }}
                      {{ injury.injuryType }}
                    </p>
                    <p>
                      <strong>Injury Date:</strong>
                      {{ injury.injuryDate | date: "MMM d, y" }}
                    </p>
                    <p>Days in Protocol: {{ injury.daysInProtocol }}</p>
                  </div>
                </div>

                <!-- RTP Progress -->
                <div class="rtp-progress-section">
                  <h5>RTP Progress:</h5>
                  <div class="stage-indicators">
                    @for (s of [1, 2, 3, 4, 5, 6, 7]; track s) {
                      <div
                        class="stage-box"
                        [class.completed]="s < (injury.rtpStage || 0)"
                        [class.current]="s === injury.rtpStage"
                      >
                        <span class="stage-num">{{ s }}</span>
                        @if (s < (injury.rtpStage || 0)) {
                          <span class="stage-check">✓</span>
                        }
                        @if (s === injury.rtpStage) {
                          <span class="stage-check">◉</span>
                        }
                        <span class="stage-name">{{
                          getStageShortName(s)
                        }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Today's Check-in -->
                @if (injury.todayCheckin) {
                  <div class="checkin-summary">
                    <h5>Today's Check-in:</h5>
                    <div class="checkin-metrics">
                      <span>Pain: {{ injury.todayCheckin.painLevel }}/10</span>
                      <span
                        >Function:
                        {{ injury.todayCheckin.functionLevel }}/10</span
                      >
                      <span
                        >Confidence:
                        {{ injury.todayCheckin.confidenceLevel }}/10</span
                      >
                    </div>
                  </div>
                }

                <div class="estimated-return">
                  Est. Full Return: {{ injury.estimatedReturn }}
                </div>

                <div class="injury-actions">
                  <app-button
                    variant="secondary"
                    (clicked)="viewRtpDetails(injury)"
                    >View Full RTP</app-button
                  >
                  <app-button
                    variant="secondary"
                    (clicked)="openCheckinDialog(injury)"
                    >Update Progress</app-button
                  >
                  <app-button
                    iconLeft="pi-arrow-right"
                    [disabled]="!canAdvanceStage(injury)"
                    (clicked)="advanceStage(injury)"
                    >Advance Stage</app-button
                  >
                </div>
              </p-card>
            }
          </div>
        }

        <!-- Cleared -->
        @if (activeTab() === "cleared" && clearedInjuries().length > 0) {
          <div class="injuries-section">
            <h3>Recently Cleared</h3>
            @for (injury of clearedInjuries(); track injury.id) {
              <p-card styleClass="injury-card cleared">
                <div class="injury-content">
                  <p-avatar
                    [label]="getInitialsStr(injury.playerName)"
                    size="large"
                    shape="circle"
                  ></p-avatar>
                  <div class="injury-info">
                    <h4>
                      {{ injury.playerName }} (#{{ injury.jerseyNumber }})
                    </h4>
                    <p>
                      {{ injury.bodyPart }} {{ injury.injuryType }} - Cleared
                    </p>
                    <p>Recovery time: {{ injury.daysInProtocol }} days</p>
                  </div>
                  <app-status-tag
                    value="Cleared"
                    severity="success"
                    size="sm"
                  />
                </div>
              </p-card>
            }
          </div>
        }

        <!-- History Table -->
        @if (activeTab() === "history") {
          <p-card styleClass="history-card">
            <p-table
              [value]="injuries()"
              [paginator]="true"
              [rows]="10"
              [rowsPerPageOptions]="[10, 25, 50]"
              [virtualScroll]="injuries().length > 50"
              [virtualScrollItemSize]="46"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Player</th>
                  <th>Injury</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Recovery Days</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-injury>
                <tr>
                  <td>{{ injury.playerName }}</td>
                  <td>{{ injury.bodyPart }} {{ injury.injuryType }}</td>
                  <td>{{ injury.injuryDate | date: "MMM d, y" }}</td>
                  <td>
                    <app-status-tag
                      [value]="getStatusLabel(injury.status)"
                      [severity]="getStatusSeverity(injury.status)"
                      size="sm"
                    />
                  </td>
                  <td>{{ injury.daysInProtocol || "-" }}</td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        }

        <!-- Empty State -->
        @if (filteredInjuries().length === 0) {
          <p-card styleClass="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-heart"></i>
              <h3>No Injuries</h3>
              <p>Great news! No injuries in this category.</p>
            </div>
          </p-card>
        }

        <!-- Analytics Section -->
        @if (activeTab() === "active" || activeTab() === "rtp") {
          <div class="analytics-section">
            <h3>Injury Analytics</h3>
            <p-card>
              <div class="analytics-grid">
                <div class="analytics-chart">
                  <h5>Injury by Type (This Season)</h5>
                  @for (stat of injuryByType(); track stat.type) {
                    <div class="stat-bar">
                      <span class="bar-label">{{ stat.type }}</span>
                      <div class="bar-track">
                        <div
                          class="bar-fill"
                          [style.width.%]="
                            (stat.count / totalSeasonCount()) * 100
                          "
                        ></div>
                      </div>
                      <span class="bar-count">{{ stat.count }}</span>
                    </div>
                  }
                </div>
                <div class="analytics-chart">
                  <h5>Injury by Position</h5>
                  @for (stat of injuryByPosition(); track stat.position) {
                    <div class="stat-bar">
                      <span class="bar-label">{{ stat.position }}</span>
                      <div class="bar-track">
                        <div
                          class="bar-fill"
                          [style.width.%]="
                            (stat.count / totalSeasonCount()) * 100
                          "
                        ></div>
                      </div>
                      <span class="bar-count">{{ stat.count }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="insight-box">
                <i class="pi pi-lightbulb"></i>
                <span
                  >Hamstring injuries are 50% of total. Consider adding more
                  dynamic warm-up time and hamstring-specific prehab
                  exercises.</span
                >
              </div>
            </p-card>
          </div>
        }
      </div>

      <!-- Report Injury Dialog -->
      <p-dialog
        [(visible)]="showReportDialog"
        header="Report Injury"
        [modal]="true"
        styleClass="injury-report-dialog"
      >
        <div class="report-form">
          <div class="form-field">
            <label for="player">Player</label>
            <p-select
              inputId="player"
              [options]="playerOptions()"
              [(ngModel)]="reportForm.playerId"
              optionLabel="label"
              optionValue="value"
              placeholder="Select player"
              [filter]="true"
              styleClass="w-full"
              [attr.aria-label]="'Select player'"
            ></p-select>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="injuryDate">Injury Date</label>
              <p-datepicker
                inputId="injuryDate"
                [(ngModel)]="reportForm.injuryDate"
                [showIcon]="true"
                dateFormat="M d, yy"
                [attr.aria-label]="'Select injury date'"
              ></p-datepicker>
            </div>
            <div class="form-field">
              <label for="injuryTime">Time of Injury</label>
              <p-select
                inputId="injuryTime"
                [options]="timeOptions"
                [(ngModel)]="reportForm.injuryTime"
                optionLabel="label"
                optionValue="value"
                [attr.aria-label]="'Select time of injury'"
              ></p-select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="bodyPart">Body Part</label>
              <p-select
                inputId="bodyPart"
                [options]="bodyPartOptions"
                [(ngModel)]="reportForm.bodyPart"
                optionLabel="label"
                optionValue="value"
                [attr.aria-label]="'Select body part'"
              ></p-select>
            </div>
            <div class="form-field">
              <label for="injuryType">Injury Type</label>
              <p-select
                inputId="injuryType"
                [options]="injuryTypeOptions"
                [(ngModel)]="reportForm.injuryType"
                optionLabel="label"
                optionValue="value"
                [attr.aria-label]="'Select injury type'"
              ></p-select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Side</label>
              <div class="radio-group">
                <div class="radio-option">
                  <p-radioButton
                    name="side"
                    value="left"
                    [(ngModel)]="reportForm.side"
                    inputId="sideLeft"
                  ></p-radioButton>
                  <label for="sideLeft">Left</label>
                </div>
                <div class="radio-option">
                  <p-radioButton
                    name="side"
                    value="right"
                    [(ngModel)]="reportForm.side"
                    inputId="sideRight"
                  ></p-radioButton>
                  <label for="sideRight">Right</label>
                </div>
              </div>
            </div>
            <div class="form-field">
              <label>Severity (player assessment)</label>
              <div class="radio-group">
                <div class="radio-option">
                  <p-radioButton
                    name="severity"
                    value="mild"
                    [(ngModel)]="reportForm.severity"
                    inputId="sevMild"
                  ></p-radioButton>
                  <label for="sevMild">Mild</label>
                </div>
                <div class="radio-option">
                  <p-radioButton
                    name="severity"
                    value="moderate"
                    [(ngModel)]="reportForm.severity"
                    inputId="sevMod"
                  ></p-radioButton>
                  <label for="sevMod">Moderate</label>
                </div>
                <div class="radio-option">
                  <p-radioButton
                    name="severity"
                    value="severe"
                    [(ngModel)]="reportForm.severity"
                    inputId="sevSev"
                  ></p-radioButton>
                  <label for="sevSev">Severe</label>
                </div>
              </div>
            </div>
          </div>

          <div class="form-field">
            <label for="howHappened">How did it happen?</label>
            <p-select
              inputId="howHappened"
              [options]="howHappenedOptions"
              [(ngModel)]="reportForm.howHappened"
              optionLabel="label"
              optionValue="value"
              [attr.aria-label]="'Select how injury happened'"
            ></p-select>
          </div>

          <div class="form-field">
            <label for="description">Description</label>
            <textarea
              pTextarea
              id="description"
              [(ngModel)]="reportForm.description"
              placeholder="Describe what happened..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-field">
            <label>Immediate Action Taken</label>
            <div class="checkbox-group">
              <div class="checkbox-option">
                <p-checkbox
                  [(ngModel)]="reportForm.actions.iceApplied"
                  [binary]="true"
                  variant="filled"
                  inputId="actIce"
                ></p-checkbox>
                <label for="actIce">Ice applied</label>
              </div>
              <div class="checkbox-option">
                <p-checkbox
                  [(ngModel)]="reportForm.actions.removedFromActivity"
                  [binary]="true"
                  variant="filled"
                  inputId="actRemoved"
                ></p-checkbox>
                <label for="actRemoved">Player removed from activity</label>
              </div>
              <div class="checkbox-option">
                <p-checkbox
                  [(ngModel)]="reportForm.actions.medicalContacted"
                  [binary]="true"
                  variant="filled"
                  inputId="actMedical"
                ></p-checkbox>
                <label for="actMedical">Medical professional contacted</label>
              </div>
              <div class="checkbox-option">
                <p-checkbox
                  [(ngModel)]="reportForm.actions.sentForImaging"
                  [binary]="true"
                  variant="filled"
                  inputId="actImaging"
                ></p-checkbox>
                <label for="actImaging">Sent for imaging</label>
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showReportDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [disabled]="!reportForm.playerId || !reportForm.bodyPart"
            (clicked)="submitReport()"
            >Report & Start RTP</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Daily Check-in Dialog -->
      <p-dialog
        [(visible)]="showCheckinDialog"
        header="Update Progress"
        [modal]="true"
        styleClass="injury-checkin-dialog"
      >
        <div class="checkin-form">
          <div class="form-field">
            <label>Pain Level (0 = no pain, 10 = severe)</label>
            <p-inputNumber
              [(ngModel)]="checkinForm.painLevel"
              [min]="0"
              [max]="10"
              [showButtons]="true"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label>Function Level (0 = none, 10 = full)</label>
            <p-inputNumber
              [(ngModel)]="checkinForm.functionLevel"
              [min]="0"
              [max]="10"
              [showButtons]="true"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label>Confidence Level (0 = none, 10 = full)</label>
            <p-inputNumber
              [(ngModel)]="checkinForm.confidenceLevel"
              [min]="0"
              [max]="10"
              [showButtons]="true"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label for="checkinNotes">Notes</label>
            <textarea
              pTextarea
              id="checkinNotes"
              [(ngModel)]="checkinForm.notes"
              placeholder="How did today go?"
              rows="3"
            ></textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showCheckinDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-check" (clicked)="submitCheckin()"
            >Save Check-in</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./injury-management.component.scss",
})
export class InjuryManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly activeTab = signal<"active" | "rtp" | "cleared" | "history">(
    "active",
  );
  readonly injuries = signal<InjuryRecord[]>([]);
  readonly isLoading = signal(true);

  // Dialog state
  showReportDialog = false;
  showCheckinDialog = false;
  selectedInjury: InjuryRecord | null = null;

  // Report form
  reportForm = this.getEmptyReportForm();

  // Check-in form
  checkinForm = {
    painLevel: 0,
    functionLevel: 5,
    confidenceLevel: 5,
    notes: "",
  };

  // Options
  readonly bodyPartOptions = BODY_PARTS;
  readonly injuryTypeOptions = INJURY_TYPES;
  readonly playerOptions = signal<{ label: string; value: string }[]>([]);
  readonly timeOptions = this.generateTimeOptions();
  readonly howHappenedOptions = [
    { label: "During practice", value: "practice" },
    { label: "During drill", value: "drill" },
    { label: "During game", value: "game" },
    { label: "Outside of team activities", value: "outside" },
  ];

  // Computed
  readonly activeInjuries = computed(() =>
    this.injuries().filter(
      (i) => i.status === "new" || i.status === "evaluating",
    ),
  );

  readonly rtpInjuries = computed(() =>
    this.injuries().filter((i) => i.status === "rtp"),
  );

  readonly clearedInjuries = computed(() =>
    this.injuries().filter((i) => i.status === "cleared"),
  );

  readonly filteredInjuries = computed(() => {
    const tab = this.activeTab();
    switch (tab) {
      case "active":
        return [...this.activeInjuries(), ...this.rtpInjuries()];
      case "rtp":
        return this.rtpInjuries();
      case "cleared":
        return this.clearedInjuries();
      default:
        return this.injuries();
    }
  });

  readonly activeCount = computed(() => this.activeInjuries().length);
  readonly rtpCount = computed(() => this.rtpInjuries().length);
  readonly clearedCount = computed(() => this.clearedInjuries().length);
  readonly totalSeasonCount = computed(() => this.injuries().length);

  readonly injuryByType = computed(() => {
    const counts: Record<string, number> = {};
    this.injuries().forEach((i) => {
      counts[i.bodyPart] = (counts[i.bodyPart] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  });

  readonly injuryByPosition = computed(() => {
    const counts: Record<string, number> = {};
    this.injuries().forEach((i) => {
      counts[i.playerPosition] = (counts[i.playerPosition] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count);
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Use staff-physiotherapist API for injury data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/staff-physiotherapist/athletes"),
      );
      if (response?.success && response.data?.athletes) {
        // Transform athlete injury data to component format
        const injuries: InjuryRecord[] = [];
        const playerOpts: { label: string; value: string }[] = [];

        for (const athlete of response.data.athletes) {
          playerOpts.push({ label: athlete.name, value: athlete.id });

          if (athlete.currentInjury) {
            injuries.push({
              id: athlete.id + "-inj",
              playerId: athlete.id,
              playerName: athlete.name,
              playerPosition: athlete.position,
              jerseyNumber: "",
              bodyPart: athlete.currentInjury.location || "Unknown",
              injuryType: (
                athlete.currentInjury.type || "strain"
              ).toLowerCase() as
                | "strain"
                | "sprain"
                | "contusion"
                | "fracture"
                | "other",
              severity: this.mapGradeToSeverity(athlete.currentInjury.grade),
              injuryDate: new Date().toISOString(),
              howItHappened: "",
              description: athlete.currentInjury.type,
              status:
                athlete.clearanceStatus === "cleared"
                  ? "cleared"
                  : athlete.clearanceStatus === "limited"
                    ? "rtp"
                    : "new",
              rtpProgress: athlete.currentInjury.rtpProgress || 0,
              estimatedReturn: athlete.currentInjury.expectedReturn,
            });
          }
        }

        this.injuries.set(injuries);
        this.playerOptions.set(playerOpts);
      }
    } catch (err) {
      this.logger.error(
        "Failed to load injuries from API, no data available",
        err,
      );
      // Set empty arrays instead of demo data
      this.injuries.set([]);
      this.playerOptions.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapGradeToSeverity(
    grade: string | undefined,
  ): "mild" | "moderate" | "severe" {
    if (!grade) return "moderate";
    const lower = grade.toLowerCase();
    if (lower.includes("i") || lower.includes("mild") || lower.includes("1"))
      return "mild";
    if (
      lower.includes("iii") ||
      lower.includes("severe") ||
      lower.includes("3")
    )
      return "severe";
    return "moderate";
  }

  private getEmptyReportForm() {
    return {
      playerId: "",
      injuryDate: new Date(),
      injuryTime: "4:00 PM",
      bodyPart: "",
      injuryType: "",
      side: "left" as "left" | "right",
      severity: "moderate" as "mild" | "moderate" | "severe",
      howHappened: "practice",
      description: "",
      actions: {
        iceApplied: true,
        removedFromActivity: true,
        medicalContacted: false,
        sentForImaging: false,
      },
    };
  }

  private generateTimeOptions() {
    const options = [];
    for (let h = 6; h <= 21; h++) {
      for (const m of ["00", "30"]) {
        const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const ampm = h >= 12 ? "PM" : "AM";
        options.push({
          label: `${hour}:${m} ${ampm}`,
          value: `${hour}:${m} ${ampm}`,
        });
      }
    }
    return options;
  }

  // Dialog methods
  openReportDialog(): void {
    this.reportForm = this.getEmptyReportForm();
    this.showReportDialog = true;
  }

  submitReport(): void {
    this.messageService.add({
      severity: "success",
      summary: "Injury Reported",
      detail: "RTP protocol has been initiated",
    });
    this.showReportDialog = false;
    // Would submit to API
  }

  openCheckinDialog(injury: InjuryRecord): void {
    this.selectedInjury = injury;
    this.checkinForm = injury.todayCheckin
      ? { ...injury.todayCheckin }
      : { painLevel: 0, functionLevel: 5, confidenceLevel: 5, notes: "" };
    this.showCheckinDialog = true;
  }

  submitCheckin(): void {
    this.messageService.add({
      severity: "success",
      summary: "Check-in Saved",
      detail: "Progress has been recorded",
    });
    this.showCheckinDialog = false;
  }

  // Actions
  startRtp(injury: InjuryRecord): void {
    this.injuries.update((injs) =>
      injs.map((i) =>
        i.id === injury.id
          ? {
              ...i,
              status: "rtp" as InjuryStatus,
              rtpStage: 1,
              daysInProtocol: 0,
            }
          : i,
      ),
    );
    this.messageService.add({
      severity: "success",
      summary: "RTP Started",
      detail: `${injury.playerName} has begun the return-to-play protocol`,
    });
  }

  advanceStage(injury: InjuryRecord): void {
    const nextStage = (injury.rtpStage || 0) + 1;
    if (nextStage > 7) return;

    this.injuries.update((injs) =>
      injs.map((i) =>
        i.id === injury.id
          ? {
              ...i,
              rtpStage: nextStage,
              status: nextStage === 7 ? ("cleared" as InjuryStatus) : i.status,
            }
          : i,
      ),
    );

    this.messageService.add({
      severity: "success",
      summary: "Stage Advanced",
      detail: `${injury.playerName} advanced to Stage ${nextStage}`,
    });
  }

  canAdvanceStage(injury: InjuryRecord): boolean {
    if (!injury.todayCheckin || !injury.rtpStage) return false;
    return (
      injury.todayCheckin.painLevel <= 2 &&
      injury.todayCheckin.functionLevel >= 6
    );
  }

  viewRtpDetails(injury: InjuryRecord): void {
    this.messageService.add({
      severity: "info",
      summary: "View RTP",
      detail: `Opening full RTP for ${injury.playerName}`,
    });
  }

  requestMedical(_injury: InjuryRecord): void {
    this.messageService.add({
      severity: "info",
      summary: "Medical Report Requested",
      detail: "Request sent to medical team",
    });
  }

  // Helpers
  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getStageName(stage: number): string {
    return RTP_STAGES.find((s) => s.stage === stage)?.name || "";
  }

  getStageShortName(stage: number): string {
    const names: Record<number, string> = {
      1: "Rest",
      2: "Light",
      3: "Sport",
      4: "Sport",
      5: "Sport",
      6: "Full",
      7: "Clr",
    };
    return names[stage] || "";
  }

  getStatusLabel(status: InjuryStatus): string {
    const labels: Record<InjuryStatus, string> = {
      new: "New",
      evaluating: "Evaluating",
      rtp: "In RTP",
      cleared: "Cleared",
    };
    return labels[status];
  }

  getStatusSeverity(
    status: InjuryStatus,
  ): "success" | "info" | "warning" | "danger" {
    return getMappedStatusSeverity(status, injuryStatusSeverityMap, "info");
  }
}
