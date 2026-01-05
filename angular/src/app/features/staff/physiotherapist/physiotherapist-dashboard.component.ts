import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { TimelineModule } from "primeng/timeline";
import { ApiService } from "../../../core/services/api.service";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// Interfaces based on FEATURE_DOCUMENTATION.md §31
interface Injury {
  id: string;
  type: string;
  dateOccurred: Date;
  severity: "mild" | "moderate" | "severe";
  recoveryTimeWeeks: number;
  status: "active" | "recovered" | "chronic";
  bodyArea: string;
}

interface AthletePhysioData {
  id: string;
  name: string;
  position: string;
  age: number;
  yearsPlaying: number;
  activeInjuries: Injury[];
  restrictions: string[];
  clearanceStatus: "full" | "limited" | "not_cleared";
}

interface InjuryHistory {
  athleteId: string;
  totalInjuries: number;
  injuriesByType: { type: string; count: number; avgRecoveryDays: number }[];
  recurrentInjuries: string[];
  lastInjuryDate: Date | null;
  daysSinceLastInjury: number | null;
}

interface RiskIndicators {
  athleteId: string;
  acwrRisk: "low" | "moderate" | "high";
  acwrValue: number;
  trainingLoadSpike: boolean;
  sleepDeficit: boolean;
  weightFluctuation: boolean;
  soreness: number;
  asymmetries: { test: string; leftRight: string; concern: boolean }[];
}

interface ReturnToPlayData {
  athleteId: string;
  injury: Injury;
  currentPhase: {
    phase: number;
    phaseName: string;
    startDate: Date;
    daysInPhase: number;
    criteria: { requirement: string; met: boolean }[];
  };
  progressMetrics: {
    painLevel: number[];
    functionScore: number;
    strengthRecovery: number;
    confidenceLevel: number;
  };
  clearanceRecommendation: {
    status: "not_ready" | "limited_return" | "full_clearance";
    rationale: string[];
    restrictions: string[];
    followUpDate: Date;
  };
}

const POSITION_INJURY_RISK: Record<
  string,
  { commonInjuries: string[]; riskFactors: string[]; screeningFocus: string[] }
> = {
  QB: {
    commonInjuries: [
      "Shoulder strain",
      "Elbow tendinitis",
      "Hip flexor strain",
      "Oblique strain",
    ],
    riskFactors: [
      "High throw volume",
      "Poor arm care compliance",
      "Throwing through fatigue",
    ],
    screeningFocus: [
      "Shoulder ROM",
      "Thoracic mobility",
      "Hip internal rotation",
    ],
  },
  WR: {
    commonInjuries: [
      "Hamstring strain",
      "Ankle sprain",
      "Knee ligament",
      "Hip flexor",
    ],
    riskFactors: [
      "Sprint volume spikes",
      "Inadequate warm-up",
      "Surface changes",
    ],
    screeningFocus: [
      "Hamstring flexibility",
      "Single-leg balance",
      "Hip mobility",
    ],
  },
  DB: {
    commonInjuries: [
      "Hamstring strain",
      "Hip flexor",
      "Ankle sprain",
      "Groin strain",
    ],
    riskFactors: [
      "High backpedal volume",
      "Sudden direction changes",
      "Reactive movements",
    ],
    screeningFocus: ["Hip mobility", "Ankle stability", "Core stability"],
  },
  Rusher: {
    commonInjuries: ["Shoulder strain", "Knee ligament", "Ankle sprain"],
    riskFactors: ["Explosive starts", "Contact frequency", "Lateral movements"],
    screeningFocus: [
      "Shoulder stability",
      "Knee stability",
      "First-step mechanics",
    ],
  },
};

const RTP_PHASES = [
  {
    phase: 1,
    name: "Rest & Protect",
    description: "Pain-free daily activities",
  },
  {
    phase: 2,
    name: "Light Activity",
    description: "Walking, light stretching",
  },
  {
    phase: 3,
    name: "Sport-Specific",
    description: "Running, agility without contact",
  },
  {
    phase: 4,
    name: "Non-Contact Practice",
    description: "Full practice, no live play",
  },
  { phase: 5, name: "Full Clearance", description: "Return to competition" },
];

@Component({
  selector: "app-physiotherapist-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ChartModule,
    DialogModule,
    InputTextModule,
    ProgressBarModule,
    Select,
    TableModule,
    TabsModule,
    TagModule,
    TextareaModule,
    TimelineModule,
    TooltipModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="physio-dashboard">
        <app-page-header
          title="Physiotherapist Dashboard"
          subtitle="Monitor injury status, return-to-play progress, and athlete risk factors"
          icon="pi-heart-fill"
        >
          <app-button
            iconLeft="pi-file-pdf"
            (clicked)="showReportDialog.set(true)"
            >Generate Report</app-button
          >
        </app-page-header>

        @if (loading()) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading physiotherapy data...</span>
          </div>
        } @else {
          <!-- Overview Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon athletes">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ athletes().length }}</span>
                <span class="stat-label">Athletes Monitored</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon injuries">
                <i class="pi pi-exclamation-circle"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ activeInjuryCount() }}</span>
                <span class="stat-label">Active Injuries</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon rtp">
                <i class="pi pi-sync"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ rtpCount() }}</span>
                <span class="stat-label">In RTP Protocol</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon risk">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ highRiskCount() }}</span>
                <span class="stat-label">High Risk Athletes</span>
              </div>
            </div>
          </div>

          <!-- Main Tabs -->
          <p-tabs [value]="0">
            <p-tablist>
              <p-tab [value]="0">
                <i class="pi pi-users"></i>
                Athletes Overview
              </p-tab>
              <p-tab [value]="1">
                <i class="pi pi-sync"></i>
                Return to Play
              </p-tab>
              <p-tab [value]="2">
                <i class="pi pi-exclamation-triangle"></i>
                Risk Assessment
              </p-tab>
              <p-tab [value]="3">
                <i class="pi pi-history"></i>
                Injury History
              </p-tab>
            </p-tablist>

            <p-tabpanels>
              <!-- Athletes Overview -->
              <p-tabpanel [value]="0">
                <div class="athletes-section">
                  <div class="section-header">
                    <h3>Athletes Under Care</h3>
                    <div class="filter-group">
                      <p-select
                        [options]="clearanceFilterOptions"
                        [(ngModel)]="clearanceFilter"
                        placeholder="Filter by status"
                        [showClear]="true"
                      ></p-select>
                    </div>
                  </div>

                  <p-table
                    [value]="filteredAthletes()"
                    [paginator]="true"
                    [rows]="10"
                    styleClass="p-datatable-sm"
                  >
                    <ng-template #header>
                      <tr>
                        <th>Athlete</th>
                        <th>Position</th>
                        <th>Clearance</th>
                        <th>Active Injuries</th>
                        <th>Restrictions</th>
                        <th>Risk Level</th>
                        <th>Actions</th>
                      </tr>
                    </ng-template>
                    <ng-template #body let-athlete>
                      <tr>
                        <td>
                          <div class="athlete-cell">
                            <span class="athlete-name">{{ athlete.name }}</span>
                            <span class="athlete-meta"
                              >{{ athlete.age }} yrs •
                              {{ athlete.yearsPlaying }} yrs playing</span
                            >
                          </div>
                        </td>
                        <td>
                          <p-tag
                            [value]="athlete.position"
                            severity="info"
                          ></p-tag>
                        </td>
                        <td>
                          <p-tag
                            [value]="getClearanceLabel(athlete.clearanceStatus)"
                            [severity]="
                              getClearanceSeverity(athlete.clearanceStatus)
                            "
                          ></p-tag>
                        </td>
                        <td>
                          @if (athlete.activeInjuries.length > 0) {
                            <div class="injuries-list">
                              @for (
                                injury of athlete.activeInjuries.slice(0, 2);
                                track injury.id
                              ) {
                                <span
                                  class="injury-badge"
                                  [class]="injury.severity"
                                >
                                  {{ injury.type }}
                                </span>
                              }
                              @if (athlete.activeInjuries.length > 2) {
                                <span class="more-badge"
                                  >+{{
                                    athlete.activeInjuries.length - 2
                                  }}</span
                                >
                              }
                            </div>
                          } @else {
                            <span class="no-injuries">None</span>
                          }
                        </td>
                        <td>
                          @if (athlete.restrictions.length > 0) {
                            <span class="restriction-count">
                              {{ athlete.restrictions.length }} restriction(s)
                            </span>
                          } @else {
                            <span class="no-restrictions">None</span>
                          }
                        </td>
                        <td>
                          <p-tag
                            [value]="getAthleteRiskLabel(athlete.id)"
                            [severity]="getAthleteRiskSeverity(athlete.id)"
                          ></p-tag>
                        </td>
                        <td>
                          <app-icon-button
                            icon="pi-eye"
                            variant="text"
                            (clicked)="viewAthleteDetails(athlete)"
                            ariaLabel="eye"
                          />
                          <app-icon-button
                            icon="pi-file"
                            variant="text"
                            (clicked)="generateAthleteReport(athlete)"
                            ariaLabel="file"
                          />
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

              <!-- Return to Play -->
              <p-tabpanel [value]="1">
                <div class="rtp-section">
                  <div class="section-header">
                    <h3>Return to Play Protocols</h3>
                  </div>

                  @if (rtpData().length > 0) {
                    <div class="rtp-grid">
                      @for (rtp of rtpData(); track rtp.athleteId) {
                        <p-card styleClass="rtp-card">
                          <ng-template #header>
                            <div class="rtp-header">
                              <div class="athlete-info">
                                <span class="athlete-name">{{
                                  getAthleteName(rtp.athleteId)
                                }}</span>
                                <span class="injury-info">{{
                                  rtp.injury.type
                                }}</span>
                              </div>
                              <p-tag
                                [value]="
                                  rtp.clearanceRecommendation.status.replace(
                                    '_',
                                    ' '
                                  )
                                "
                                [severity]="
                                  getRtpStatusSeverity(
                                    rtp.clearanceRecommendation.status
                                  )
                                "
                              ></p-tag>
                            </div>
                          </ng-template>

                          <div class="rtp-content">
                            <!-- Phase Progress -->
                            <div class="phase-progress">
                              <h5>
                                Current Phase: {{ rtp.currentPhase.phaseName }}
                              </h5>
                              <div class="phase-timeline">
                                @for (phase of rtpPhases; track phase.phase) {
                                  <div
                                    class="phase-step"
                                    [class.completed]="
                                      phase.phase < rtp.currentPhase.phase
                                    "
                                    [class.current]="
                                      phase.phase === rtp.currentPhase.phase
                                    "
                                  >
                                    <span class="phase-number">{{
                                      phase.phase
                                    }}</span>
                                    <span class="phase-name">{{
                                      phase.name
                                    }}</span>
                                  </div>
                                }
                              </div>
                              <p class="days-in-phase">
                                {{ rtp.currentPhase.daysInPhase }} days in
                                current phase
                              </p>
                            </div>

                            <!-- Progress Metrics -->
                            <div class="progress-metrics">
                              <div class="metric">
                                <span class="metric-label">Pain Level</span>
                                <div class="metric-bar">
                                  <p-progressBar
                                    [value]="getLatestPain(rtp) * 10"
                                    [showValue]="false"
                                  ></p-progressBar>
                                  <span>{{ getLatestPain(rtp) }}/10</span>
                                </div>
                              </div>
                              <div class="metric">
                                <span class="metric-label">Function Score</span>
                                <div class="metric-bar">
                                  <p-progressBar
                                    [value]="rtp.progressMetrics.functionScore"
                                    [showValue]="false"
                                  ></p-progressBar>
                                  <span
                                    >{{
                                      rtp.progressMetrics.functionScore
                                    }}%</span
                                  >
                                </div>
                              </div>
                              <div class="metric">
                                <span class="metric-label"
                                  >Strength Recovery</span
                                >
                                <div class="metric-bar">
                                  <p-progressBar
                                    [value]="
                                      rtp.progressMetrics.strengthRecovery
                                    "
                                    [showValue]="false"
                                  ></p-progressBar>
                                  <span
                                    >{{
                                      rtp.progressMetrics.strengthRecovery
                                    }}%</span
                                  >
                                </div>
                              </div>
                              <div class="metric">
                                <span class="metric-label">Confidence</span>
                                <div class="metric-bar">
                                  <p-progressBar
                                    [value]="
                                      rtp.progressMetrics.confidenceLevel * 10
                                    "
                                    [showValue]="false"
                                  ></p-progressBar>
                                  <span
                                    >{{
                                      rtp.progressMetrics.confidenceLevel
                                    }}/10</span
                                  >
                                </div>
                              </div>
                            </div>

                            <!-- Phase Criteria -->
                            <div class="phase-criteria">
                              <h5>Phase Criteria</h5>
                              <ul class="criteria-list">
                                @for (
                                  criterion of rtp.currentPhase.criteria;
                                  track criterion.requirement
                                ) {
                                  <li [class.met]="criterion.met">
                                    <i
                                      [class]="
                                        criterion.met
                                          ? 'pi pi-check-circle'
                                          : 'pi pi-circle'
                                      "
                                    ></i>
                                    {{ criterion.requirement }}
                                  </li>
                                }
                              </ul>
                            </div>
                          </div>

                          <ng-template #footer>
                            <app-button
                              variant="text"
                              iconLeft="pi-pencil"
                              (clicked)="updateRtpProgress(rtp)"
                              >Update Progress</app-button
                            >
                            <app-button
                              variant="text"
                              iconLeft="pi-file"
                              (clicked)="viewRtpReport(rtp)"
                              >View Full Report</app-button
                            >
                          </ng-template>
                        </p-card>
                      }
                    </div>
                  } @else {
                    <div class="empty-state">
                      <i class="pi pi-check-circle"></i>
                      <h4>No Active RTP Protocols</h4>
                      <p>
                        All athletes are currently cleared for full activity.
                      </p>
                    </div>
                  }
                </div>
              </p-tabpanel>

              <!-- Risk Assessment -->
              <p-tabpanel [value]="2">
                <div class="risk-section">
                  <div class="section-header">
                    <h3>Injury Risk Assessment</h3>
                  </div>

                  <div class="risk-grid">
                    @for (risk of riskIndicators(); track risk.athleteId) {
                      <p-card
                        styleClass="risk-card"
                        [class.high-risk]="risk.acwrRisk === 'high'"
                        [class.moderate-risk]="risk.acwrRisk === 'moderate'"
                      >
                        <ng-template #header>
                          <div class="risk-header">
                            <span class="athlete-name">{{
                              getAthleteName(risk.athleteId)
                            }}</span>
                            <p-tag
                              [value]="risk.acwrRisk.toUpperCase() + ' RISK'"
                              [severity]="getRiskSeverity(risk.acwrRisk)"
                            ></p-tag>
                          </div>
                        </ng-template>

                        <div class="risk-content">
                          <!-- ACWR -->
                          <div class="acwr-section">
                            <span class="acwr-label">ACWR Ratio</span>
                            <span
                              class="acwr-value"
                              [class.danger]="risk.acwrValue > 1.5"
                              [class.warning]="
                                risk.acwrValue > 1.3 && risk.acwrValue <= 1.5
                              "
                              >{{ risk.acwrValue.toFixed(2) }}</span
                            >
                          </div>

                          <!-- Risk Flags -->
                          <div class="risk-flags">
                            <div
                              class="flag"
                              [class.active]="risk.trainingLoadSpike"
                            >
                              <i class="pi pi-bolt"></i>
                              <span>Load Spike</span>
                            </div>
                            <div
                              class="flag"
                              [class.active]="risk.sleepDeficit"
                            >
                              <i class="pi pi-moon"></i>
                              <span>Sleep Deficit</span>
                            </div>
                            <div
                              class="flag"
                              [class.active]="risk.weightFluctuation"
                            >
                              <i class="pi pi-chart-line"></i>
                              <span>Weight Change</span>
                            </div>
                          </div>

                          <!-- Soreness -->
                          <div class="soreness-section">
                            <span class="soreness-label">Avg Soreness</span>
                            <div class="soreness-bar">
                              <p-progressBar
                                [value]="risk.soreness * 10"
                                [showValue]="false"
                              ></p-progressBar>
                              <span>{{ risk.soreness.toFixed(1) }}/10</span>
                            </div>
                          </div>

                          <!-- Asymmetries -->
                          @if (risk.asymmetries.length > 0) {
                            <div class="asymmetries">
                              <h5>Asymmetries</h5>
                              @for (asym of risk.asymmetries; track asym.test) {
                                <div
                                  class="asymmetry-item"
                                  [class.concern]="asym.concern"
                                >
                                  <span class="asym-test">{{ asym.test }}</span>
                                  <span class="asym-value">{{
                                    asym.leftRight
                                  }}</span>
                                </div>
                              }
                            </div>
                          }
                        </div>

                        <ng-template #footer>
                          <app-button
                            variant="text"
                            iconLeft="pi-info-circle"
                            (clicked)="viewPositionRisks(risk.athleteId)"
                            >View Position Risks</app-button
                          >
                        </ng-template>
                      </p-card>
                    }
                  </div>
                </div>
              </p-tabpanel>

              <!-- Injury History -->
              <p-tabpanel [value]="3">
                <div class="history-section">
                  <div class="section-header">
                    <h3>Injury History Analysis</h3>
                    <p-select
                      [options]="athleteSelectOptions()"
                      [(ngModel)]="selectedHistoryAthlete"
                      placeholder="Select athlete"
                      (onChange)="loadInjuryHistory()"
                    ></p-select>
                  </div>

                  @if (selectedHistoryAthlete && currentInjuryHistory()) {
                    <div class="history-content">
                      <div class="history-stats">
                        <div class="stat">
                          <span class="stat-value">{{
                            currentInjuryHistory()!.totalInjuries
                          }}</span>
                          <span class="stat-label">Total Injuries</span>
                        </div>
                        <div class="stat">
                          <span class="stat-value">{{
                            currentInjuryHistory()!.daysSinceLastInjury
                          }}</span>
                          <span class="stat-label">Days Since Last Injury</span>
                        </div>
                        <div class="stat">
                          <span class="stat-value">{{
                            currentInjuryHistory()!.recurrentInjuries.length
                          }}</span>
                          <span class="stat-label">Recurrent Issues</span>
                        </div>
                      </div>

                      <!-- Injuries by Type -->
                      <p-card header="Injuries by Type">
                        <div class="injury-types">
                          @for (
                            type of currentInjuryHistory()!.injuriesByType;
                            track type.type
                          ) {
                            <div class="injury-type-row">
                              <span class="type-name">{{ type.type }}</span>
                              <span class="type-count">{{ type.count }}x</span>
                              <span class="type-recovery"
                                >Avg {{ type.avgRecoveryDays }} days
                                recovery</span
                              >
                            </div>
                          }
                        </div>
                      </p-card>

                      <!-- Recurrent Injuries -->
                      @if (
                        currentInjuryHistory()!.recurrentInjuries.length > 0
                      ) {
                        <p-card
                          header="Recurrent Injuries"
                          styleClass="recurrent-card"
                        >
                          <ul class="recurrent-list">
                            @for (
                              injury of currentInjuryHistory()!
                                .recurrentInjuries;
                              track $index
                            ) {
                              <li>{{ injury }}</li>
                            }
                          </ul>
                        </p-card>
                      }
                    </div>
                  } @else {
                    <div class="select-prompt">
                      <i class="pi pi-user"></i>
                      <p>Select an athlete to view their injury history</p>
                    </div>
                  }
                </div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        }

        <!-- Athlete Details Dialog -->
        <p-dialog
          header="Athlete Physiotherapy Profile"
          [(visible)]="showAthleteDialog"
          [modal]="true"
          [style]="{ width: '700px' }"
          [dismissableMask]="true"
        >
          @if (selectedAthlete()) {
            <div class="athlete-profile">
              <div class="profile-header">
                <div class="profile-info">
                  <h3>{{ selectedAthlete()!.name }}</h3>
                  <p>
                    {{ selectedAthlete()!.position }} •
                    {{ selectedAthlete()!.age }} years •
                    {{ selectedAthlete()!.yearsPlaying }} years playing
                  </p>
                </div>
                <p-tag
                  [value]="
                    getClearanceLabel(selectedAthlete()!.clearanceStatus)
                  "
                  [severity]="
                    getClearanceSeverity(selectedAthlete()!.clearanceStatus)
                  "
                  styleClass="large-tag"
                ></p-tag>
              </div>

              <!-- Position Risk Profile -->
              @if (positionRiskProfile()) {
                <div class="risk-profile">
                  <h4>
                    Position Risk Profile ({{ selectedAthlete()!.position }})
                  </h4>
                  <div class="risk-sections">
                    <div class="risk-section">
                      <h5>Common Injuries</h5>
                      <ul>
                        @for (
                          injury of positionRiskProfile()!.commonInjuries;
                          track $index
                        ) {
                          <li>{{ injury }}</li>
                        }
                      </ul>
                    </div>
                    <div class="risk-section">
                      <h5>Risk Factors</h5>
                      <ul>
                        @for (
                          factor of positionRiskProfile()!.riskFactors;
                          track $index
                        ) {
                          <li>{{ factor }}</li>
                        }
                      </ul>
                    </div>
                    <div class="risk-section">
                      <h5>Screening Focus</h5>
                      <ul>
                        @for (
                          focus of positionRiskProfile()!.screeningFocus;
                          track $index
                        ) {
                          <li>{{ focus }}</li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              }

              <!-- Active Injuries -->
              @if (selectedAthlete()!.activeInjuries.length > 0) {
                <div class="active-injuries">
                  <h4>Active Injuries</h4>
                  @for (
                    injury of selectedAthlete()!.activeInjuries;
                    track injury.id
                  ) {
                    <div class="injury-card" [class]="injury.severity">
                      <div class="injury-header">
                        <span class="injury-type">{{ injury.type }}</span>
                        <p-tag
                          [value]="injury.severity"
                          [severity]="getInjurySeverity(injury.severity)"
                        ></p-tag>
                      </div>
                      <div class="injury-details">
                        <span>{{ injury.bodyArea }}</span>
                        <span
                          >Started:
                          {{ injury.dateOccurred | date: "mediumDate" }}</span
                        >
                        <span
                          >Expected recovery:
                          {{ injury.recoveryTimeWeeks }} weeks</span
                        >
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Restrictions -->
              @if (selectedAthlete()!.restrictions.length > 0) {
                <div class="restrictions">
                  <h4>Current Restrictions</h4>
                  <ul>
                    @for (
                      restriction of selectedAthlete()!.restrictions;
                      track $index
                    ) {
                      <li>{{ restriction }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
          <ng-template #footer>
            <app-button
              iconLeft="pi-file-pdf"
              (clicked)="generateAthleteReport(selectedAthlete()!)"
              >Generate Report</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Report Generation Dialog -->
        <p-dialog
          header="Generate Physiotherapy Report"
          [(visible)]="showReportDialog"
          [modal]="true"
          [style]="{ width: '500px' }"
          [dismissableMask]="true"
        >
          <div class="report-form">
            <div class="form-group">
              <label>Report Type</label>
              <p-select
                [options]="reportTypes"
                [(ngModel)]="selectedReportType"
                placeholder="Select report type"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-group">
              <label>Athlete</label>
              <p-select
                [options]="athleteSelectOptions()"
                [(ngModel)]="reportAthleteId"
                placeholder="Select athlete"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>
          <ng-template #footer>
            <app-button variant="text" (clicked)="showReportDialog.set(false)"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-file-pdf" (clicked)="generateReport()"
              >Generate</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Position Risk Dialog -->
        <p-dialog
          header="Position-Specific Risk Factors"
          [(visible)]="showPositionRiskDialog"
          [modal]="true"
          [style]="{ width: '600px' }"
          [dismissableMask]="true"
        >
          @if (viewingPositionRisk()) {
            <div class="position-risk-content">
              <h3>{{ viewingPositionRisk()!.position }}</h3>

              <div class="risk-category">
                <h4>
                  <i class="pi pi-exclamation-circle"></i> Common Injuries
                </h4>
                <ul>
                  @for (
                    injury of viewingPositionRisk()!.risks.commonInjuries;
                    track $index
                  ) {
                    <li>{{ injury }}</li>
                  }
                </ul>
              </div>

              <div class="risk-category">
                <h4><i class="pi pi-exclamation-triangle"></i> Risk Factors</h4>
                <ul>
                  @for (
                    factor of viewingPositionRisk()!.risks.riskFactors;
                    track $index
                  ) {
                    <li>{{ factor }}</li>
                  }
                </ul>
              </div>

              <div class="risk-category">
                <h4><i class="pi pi-search"></i> Screening Focus</h4>
                <ul>
                  @for (
                    focus of viewingPositionRisk()!.risks.screeningFocus;
                    track $index
                  ) {
                    <li>{{ focus }}</li>
                  }
                </ul>
              </div>
            </div>
          }
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrls: ["./physiotherapist-dashboard.component.scss"],
})
export class PhysiotherapistDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // State
  loading = signal(true);
  athletes = signal<AthletePhysioData[]>([]);
  riskIndicators = signal<RiskIndicators[]>([]);
  rtpData = signal<ReturnToPlayData[]>([]);
  injuryHistoryMap = signal<Map<string, InjuryHistory>>(new Map());

  // UI State
  clearanceFilter: string | null = null;
  selectedHistoryAthlete: string | null = null;
  showAthleteDialog = signal(false);
  showReportDialog = signal(false);
  showPositionRiskDialog = signal(false);
  selectedAthlete = signal<AthletePhysioData | null>(null);
  currentInjuryHistory = signal<InjuryHistory | null>(null);
  positionRiskProfile = signal<{
    commonInjuries: string[];
    riskFactors: string[];
    screeningFocus: string[];
  } | null>(null);
  viewingPositionRisk = signal<{
    position: string;
    risks: {
      commonInjuries: string[];
      riskFactors: string[];
      screeningFocus: string[];
    };
  } | null>(null);

  // Report form
  selectedReportType = "risk_assessment";
  reportAthleteId: string | null = null;

  // Constants
  rtpPhases = RTP_PHASES;

  clearanceFilterOptions = [
    { label: "Full Clearance", value: "full" },
    { label: "Limited", value: "limited" },
    { label: "Not Cleared", value: "not_cleared" },
  ];

  reportTypes = [
    { label: "Injury Risk Assessment", value: "risk_assessment" },
    { label: "Return to Play Progress", value: "rtp_progress" },
    { label: "Injury History Summary", value: "history" },
    { label: "Full Physiotherapy Report", value: "full" },
  ];

  // Computed
  filteredAthletes = computed(() => {
    if (!this.clearanceFilter) return this.athletes();
    return this.athletes().filter(
      (a) => a.clearanceStatus === this.clearanceFilter,
    );
  });

  athleteSelectOptions = computed(() =>
    this.athletes().map((a) => ({
      label: `${a.name} (${a.position})`,
      value: a.id,
    })),
  );

  activeInjuryCount = computed(() =>
    this.athletes().reduce((sum, a) => sum + a.activeInjuries.length, 0),
  );

  rtpCount = computed(() => this.rtpData().length);

  highRiskCount = computed(
    () => this.riskIndicators().filter((r) => r.acwrRisk === "high").length,
  );

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Load athletes with physio status from real API
      const response = await this.api
        .get<{
          athletes: Array<{
            id: string;
            name: string;
            position: string;
            avatarUrl: string;
            clearanceStatus: "cleared" | "limited" | "not_cleared";
            activeInjuries: number;
            currentInjury: {
              type: string;
              location: string;
              grade: string;
              phase: string;
              rtpProgress: number;
              expectedReturn: string;
            } | null;
            restrictions: string[];
            acwr: number | null;
            riskLevel: "low" | "medium" | "high" | "unknown";
          }>;
        }>("/api/staff-physiotherapist/athletes")
        .toPromise();

      if (response?.data?.athletes) {
        const athletes: AthletePhysioData[] = response.data.athletes.map(
          (a) => ({
            id: a.id,
            name: a.name,
            position: a.position,
            age: 0,
            yearsPlaying: 0,
            activeInjuries: a.currentInjury
              ? [
                  {
                    id: a.id + "-inj",
                    type: a.currentInjury.type,
                    dateOccurred: new Date(),
                    severity: this.mapGradeToSeverity(a.currentInjury.grade),
                    recoveryTimeWeeks: 2,
                    status: "active" as const,
                    bodyArea: a.currentInjury.location,
                  },
                ]
              : [],
            restrictions: a.restrictions,
            clearanceStatus: this.mapClearanceStatus(a.clearanceStatus),
          }),
        );
        this.athletes.set(athletes);

        // Build risk indicators from athlete data
        const risks: RiskIndicators[] = response.data.athletes.map((a) => ({
          athleteId: a.id,
          acwrRisk:
            a.riskLevel === "high"
              ? "high"
              : a.riskLevel === "medium"
                ? "moderate"
                : "low",
          acwrValue: a.acwr || 1.0,
          trainingLoadSpike: a.acwr !== null && a.acwr > 1.4,
          sleepDeficit: false,
          weightFluctuation: false,
          soreness: 3,
          asymmetries: [],
        }));
        this.riskIndicators.set(risks);
      }

      // Load RTP athletes
      await this.loadRTPData();

      // Load injury history for each athlete
      await this.loadAllInjuryHistory();
    } catch (error) {
      console.error("Failed to load physiotherapy data:", error);
      this.toast.error("Failed to load physiotherapy data");
    } finally {
      this.loading.set(false);
    }
  }

  private mapGradeToSeverity(grade: string): "mild" | "moderate" | "severe" {
    const gradeMap: Record<string, "mild" | "moderate" | "severe"> = {
      "Grade I": "mild",
      "Grade II": "moderate",
      "Grade III": "severe",
      mild: "mild",
      moderate: "moderate",
      severe: "severe",
    };
    return gradeMap[grade] || "moderate";
  }

  private mapClearanceStatus(
    status: string,
  ): "full" | "limited" | "not_cleared" {
    if (status === "cleared") return "full";
    if (status === "limited") return "limited";
    return "not_cleared";
  }

  private async loadRTPData(): Promise<void> {
    try {
      const response = await this.api
        .get<{
          athletes: Array<{
            athleteId: string;
            athleteName: string;
            position: string;
            injury: {
              type: string;
              location: string;
              grade: string;
              injuryDate: string;
            };
            currentPhase: string;
            rtpProgress: number;
            expectedReturn: string;
            daysRemaining: number | null;
          }>;
        }>("/api/staff-physiotherapist/rtp")
        .toPromise();

      if (response?.data?.athletes) {
        const rtpList: ReturnToPlayData[] = response.data.athletes.map(
          (rtp) => ({
            athleteId: rtp.athleteId,
            injury: {
              id: rtp.athleteId + "-inj",
              type: rtp.injury.type,
              dateOccurred: new Date(rtp.injury.injuryDate),
              severity: this.mapGradeToSeverity(rtp.injury.grade),
              recoveryTimeWeeks: Math.ceil((rtp.daysRemaining || 14) / 7),
              status: "active" as const,
              bodyArea: rtp.injury.location,
            },
            currentPhase: {
              phase: this.parsePhaseNumber(rtp.currentPhase),
              phaseName: rtp.currentPhase,
              startDate: new Date(),
              daysInPhase: 0,
              criteria: [],
            },
            progressMetrics: {
              painLevel: [5, 4, 3],
              functionScore: rtp.rtpProgress,
              strengthRecovery: rtp.rtpProgress,
              confidenceLevel: Math.round(rtp.rtpProgress / 10),
            },
            clearanceRecommendation: {
              status: rtp.rtpProgress >= 90 ? "full_clearance" : "not_ready",
              rationale: [],
              restrictions: [],
              followUpDate: rtp.expectedReturn
                ? new Date(rtp.expectedReturn)
                : new Date(),
            },
          }),
        );
        this.rtpData.set(rtpList);
      }
    } catch {
      this.rtpData.set([]);
    }
  }

  private parsePhaseNumber(phase: string): number {
    const match = phase.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  private async loadAllInjuryHistory(): Promise<void> {
    const historyMap = new Map<string, InjuryHistory>();

    for (const athlete of this.athletes()) {
      try {
        const response = await this.api
          .get<{
            activeInjuries: Array<{ injury_type: string; injury_date: string }>;
            injuryHistory: Array<{ injury_type: string; injury_date: string }>;
          }>(`/api/staff-physiotherapist/athletes/${athlete.id}`)
          .toPromise();

        if (response?.data) {
          const allInjuries = [...(response.data.injuryHistory || [])];
          const injuryTypes = new Map<string, number>();
          allInjuries.forEach((inj) => {
            injuryTypes.set(
              inj.injury_type,
              (injuryTypes.get(inj.injury_type) || 0) + 1,
            );
          });

          historyMap.set(athlete.id, {
            athleteId: athlete.id,
            totalInjuries: allInjuries.length,
            injuriesByType: Array.from(injuryTypes.entries()).map(
              ([type, count]) => ({
                type,
                count,
                avgRecoveryDays: 14,
              }),
            ),
            recurrentInjuries: this.findRecurrentInjuries(
              Array.from(injuryTypes.entries()),
            ),
            lastInjuryDate:
              allInjuries.length > 0
                ? new Date(allInjuries[0].injury_date)
                : null,
            daysSinceLastInjury:
              allInjuries.length > 0
                ? Math.floor(
                    (Date.now() -
                      new Date(allInjuries[0].injury_date).getTime()) /
                      86400000,
                  )
                : null,
          });
        }
      } catch {
        // Skip athletes with no injury data
      }
    }
    this.injuryHistoryMap.set(historyMap);
  }

  private findRecurrentInjuries(types: [string, number][]): string[] {
    return types
      .filter(([, count]) => count > 1)
      .map(([type, count]) => `${type} (${count}x)`);
  }

  getAthleteName(id: string): string {
    return this.athletes().find((a) => a.id === id)?.name || "Unknown";
  }

  getAthleteRiskLabel(id: string): string {
    const risk = this.riskIndicators().find((r) => r.athleteId === id);
    return risk
      ? risk.acwrRisk.charAt(0).toUpperCase() + risk.acwrRisk.slice(1)
      : "N/A";
  }

  getAthleteRiskSeverity(
    id: string,
  ): "success" | "warn" | "danger" | "secondary" {
    const risk = this.riskIndicators().find((r) => r.athleteId === id);
    if (!risk) return "secondary";
    return { low: "success", moderate: "warn", high: "danger" }[
      risk.acwrRisk
    ] as "success" | "warn" | "danger";
  }

  getClearanceLabel(status: string): string {
    const labels: Record<string, string> = {
      full: "Full Clearance",
      limited: "Limited",
      not_cleared: "Not Cleared",
    };
    return labels[status] || status;
  }

  getClearanceSeverity(
    status: string,
  ): "success" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warn" | "danger" | "secondary"
    > = {
      full: "success",
      limited: "warn",
      not_cleared: "danger",
    };
    return severities[status] || "secondary";
  }

  getInjurySeverity(
    severity: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      mild: "info",
      moderate: "warn",
      severe: "danger",
    };
    return severities[severity] || "secondary";
  }

  getRiskSeverity(risk: string): "success" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warn" | "danger" | "secondary"
    > = {
      low: "success",
      moderate: "warn",
      high: "danger",
    };
    return severities[risk] || "secondary";
  }

  getRtpStatusSeverity(
    status: string,
  ): "success" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warn" | "danger" | "secondary"
    > = {
      full_clearance: "success",
      limited_return: "warn",
      not_ready: "danger",
    };
    return severities[status] || "secondary";
  }

  getLatestPain(rtp: ReturnToPlayData): number {
    const painLevels = rtp.progressMetrics.painLevel;
    return painLevels[painLevels.length - 1] || 0;
  }

  viewAthleteDetails(athlete: AthletePhysioData): void {
    this.selectedAthlete.set(athlete);
    const riskProfile = POSITION_INJURY_RISK[athlete.position];
    this.positionRiskProfile.set(riskProfile || null);
    this.showAthleteDialog.set(true);
  }

  generateAthleteReport(athlete: AthletePhysioData): void {
    this.toast.success(
      `Generating physiotherapy report for ${athlete.name}...`,
    );
    this.showAthleteDialog.set(false);
  }

  viewPositionRisks(athleteId: string): void {
    const athlete = this.athletes().find((a) => a.id === athleteId);
    if (!athlete) return;

    const risks = POSITION_INJURY_RISK[athlete.position];
    if (risks) {
      this.viewingPositionRisk.set({ position: athlete.position, risks });
      this.showPositionRiskDialog.set(true);
    }
  }

  updateRtpProgress(rtp: ReturnToPlayData): void {
    this.toast.info(
      `Opening progress update for ${this.getAthleteName(rtp.athleteId)}`,
    );
  }

  viewRtpReport(rtp: ReturnToPlayData): void {
    this.toast.info(
      `Viewing RTP report for ${this.getAthleteName(rtp.athleteId)}`,
    );
  }

  loadInjuryHistory(): void {
    if (this.selectedHistoryAthlete) {
      const history = this.injuryHistoryMap().get(this.selectedHistoryAthlete);
      this.currentInjuryHistory.set(history || null);
    }
  }

  generateReport(): void {
    if (!this.reportAthleteId) {
      this.toast.warn("Please select an athlete");
      return;
    }
    this.toast.success("Generating report...");
    this.showReportDialog.set(false);
  }
}
