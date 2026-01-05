import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// Interfaces based on FEATURE_DOCUMENTATION.md §32
interface MentalWellnessReport {
  reportPeriod: { start: Date; end: Date };
  generatedBy: "athlete";
  athlete: {
    name: string;
    age: number;
    position: string;
    teamRole: string;
  };
  wellnessTrends: {
    avgMoodScore: number;
    moodTrend: "improving" | "stable" | "declining";
    avgStressLevel: number;
    stressTrend: "improving" | "stable" | "declining";
    avgMotivation: number;
    avgConfidence: number;
    anxietyIndicators: number;
  };
  sleepPatterns: {
    avgSleepHours: number;
    sleepQualityAvg: number;
    consistentBedtime: boolean;
    sleepDebtDays: number;
    weekendOversleep: boolean;
  };
  trainingContext: {
    avgTrainingLoad: number;
    highLoadDays: number;
    restDays: number;
    upcomingCompetitions: { name: string; daysUntil: number }[];
    recentGamePerformance: "good" | "average" | "poor" | "no_games";
  };
  recoveryBehaviors: {
    avgRecoveryScore: number;
    recoveryActivitiesLogged: string[];
    socialRecoveryActivities: number;
    screenTimeBeforeBed: "low" | "moderate" | "high";
  };
  significantEvents: {
    injuries: { date: Date; type: string; impact: string }[];
    performanceHighlights: { date: Date; description: string }[];
    performanceChallenges: { date: Date; description: string }[];
    lifeEvents: { date: Date; description: string }[];
  };
  observedPatterns: {
    stressTriggers: string[];
    positiveCorrelations: string[];
    concerningPatterns: string[];
  };
  athleteNotes: string;
}

interface PreCompetitionReport {
  competition: {
    name: string;
    date: Date;
    significance: "regular" | "important" | "championship";
  };
  leadUpPeriod: {
    avgConfidence: number;
    confidenceTrend: "rising" | "stable" | "falling";
    avgAnxiety: number;
    anxietyTrend: "rising" | "stable" | "falling";
    avgSleep: number;
    sleepQuality: number;
    appetiteChanges: boolean;
    focusRating: number;
  };
  historicalComparison: {
    previousSimilarEvents: number;
    avgPerformanceInSimilar: string;
    mentalStateCorrelation: string;
  };
  selfAssessment: {
    readinessRating: number;
    biggestConcern: string;
    copingStrategies: string[];
    supportNeeded: string[];
  };
}

interface ReportPrivacySettings {
  includeWellnessScores: boolean;
  includeSleepData: boolean;
  includeTrainingLoad: boolean;
  includePerformanceData: boolean;
  includeInjuryHistory: boolean;
  includeAINotes: boolean;
  includePersonalNotes: boolean;
  anonymizeTeamName: boolean;
  anonymizeCoachNames: boolean;
  removeDates: boolean;
}

@Component({
  selector: "app-psychology-reports",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    CheckboxModule,
    ChartModule,
    DialogModule,
    InputTextModule,
    ProgressBarModule,
    Select,
    TabsModule,
    TagModule,
    TextareaModule,
    TooltipModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="psychology-reports">
        <app-page-header
          title="Mental Performance Reports"
          subtitle="Generate reports to share with sports psychologists or mental performance coaches"
          icon="pi-heart"
        >
          <app-button
            iconLeft="pi-plus"
            (clicked)="showGenerateDialog.set(true)"
            >Generate New Report</app-button
          >
        </app-page-header>

        <div class="privacy-notice">
          <i class="pi pi-shield"></i>
          <div class="notice-content">
            <strong>Privacy First</strong>
            <p>
              You control exactly what data is included in your reports. Reports
              are generated for you to download and share externally - they are
              never automatically shared with coaches or staff.
            </p>
          </div>
        </div>

        <p-tabs [value]="0">
          <p-tablist>
            <p-tab [value]="0">
              <i class="pi pi-file"></i>
              My Reports
            </p-tab>
            <p-tab [value]="1">
              <i class="pi pi-chart-line"></i>
              Wellness Overview
            </p-tab>
            <p-tab [value]="2">
              <i class="pi pi-calendar"></i>
              Pre-Competition
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- My Reports -->
            <p-tabpanel [value]="0">
              <div class="reports-section">
                <div class="section-header">
                  <h3>Generated Reports</h3>
                </div>

                @if (generatedReports().length > 0) {
                  <div class="reports-grid">
                    @for (report of generatedReports(); track $index) {
                      <p-card styleClass="report-card">
                        <ng-template #header>
                          <div class="report-header">
                            <i
                              [class]="getReportIcon(report.type)"
                              class="report-icon"
                            ></i>
                            <div class="report-info">
                              <span class="report-type">{{
                                getReportTypeLabel(report.type)
                              }}</span>
                              <span class="report-date">{{
                                report.generatedDate | date: "medium"
                              }}</span>
                            </div>
                          </div>
                        </ng-template>
                        <div class="report-details">
                          <p class="report-period">
                            Period:
                            {{ report.periodStart | date: "shortDate" }} -
                            {{ report.periodEnd | date: "shortDate" }}
                          </p>
                          <div class="included-sections">
                            <span class="section-label"
                              >Included sections:</span
                            >
                            <div class="section-tags">
                              @for (
                                section of report.includedSections;
                                track $index
                              ) {
                                <span class="section-tag">{{ section }}</span>
                              }
                            </div>
                          </div>
                        </div>
                        <ng-template #footer>
                          <app-button
                            variant="text"
                            iconLeft="pi-download"
                            (clicked)="downloadReport(report, 'pdf')"
                            >Download PDF</app-button
                          >
                          <app-button
                            variant="text"
                            iconLeft="pi-file-excel"
                            (clicked)="downloadReport(report, 'csv')"
                            >Download CSV</app-button
                          >
                          <app-icon-button
                            icon="pi-trash"
                            variant="text"
                            (clicked)="deleteReport(report)"
                            ariaLabel="trash"
                          />
                        </ng-template>
                      </p-card>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <i class="pi pi-file"></i>
                    <h4>No Reports Generated</h4>
                    <p>
                      Generate a report to share your mental wellness data with
                      your sports psychologist or counselor.
                    </p>
                    <app-button
                      iconLeft="pi-plus"
                      (clicked)="showGenerateDialog.set(true)"
                      >Generate Report</app-button
                    >
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- Wellness Overview -->
            <p-tabpanel [value]="1">
              <div class="wellness-section">
                <div class="section-header">
                  <h3>Mental Wellness Trends</h3>
                  <p-select
                    [options]="timePeriods"
                    [(ngModel)]="selectedPeriod"
                    (onChange)="loadWellnessData()"
                  ></p-select>
                </div>

                @if (currentWellnessData()) {
                  <div class="wellness-content">
                    <!-- Key Metrics -->
                    <div class="metrics-grid">
                      <div class="metric-card">
                        <div class="metric-header">
                          <span class="metric-label">Mood</span>
                          <p-tag
                            [value]="
                              currentWellnessData()!.wellnessTrends.moodTrend
                            "
                            [severity]="
                              getTrendSeverity(
                                currentWellnessData()!.wellnessTrends.moodTrend
                              )
                            "
                          ></p-tag>
                        </div>
                        <span class="metric-value"
                          >{{
                            currentWellnessData()!.wellnessTrends.avgMoodScore.toFixed(
                              1
                            )
                          }}/10</span
                        >
                        <p-progressBar
                          [value]="
                            currentWellnessData()!.wellnessTrends.avgMoodScore *
                            10
                          "
                          [showValue]="false"
                        ></p-progressBar>
                      </div>

                      <div class="metric-card">
                        <div class="metric-header">
                          <span class="metric-label">Stress Level</span>
                          <p-tag
                            [value]="
                              currentWellnessData()!.wellnessTrends.stressTrend
                            "
                            [severity]="
                              getTrendSeverity(
                                currentWellnessData()!.wellnessTrends
                                  .stressTrend,
                                true
                              )
                            "
                          ></p-tag>
                        </div>
                        <span class="metric-value"
                          >{{
                            currentWellnessData()!.wellnessTrends.avgStressLevel.toFixed(
                              1
                            )
                          }}/10</span
                        >
                        <p-progressBar
                          [value]="
                            currentWellnessData()!.wellnessTrends
                              .avgStressLevel * 10
                          "
                          [showValue]="false"
                          styleClass="stress-bar"
                        ></p-progressBar>
                      </div>

                      <div class="metric-card">
                        <div class="metric-header">
                          <span class="metric-label">Motivation</span>
                        </div>
                        <span class="metric-value"
                          >{{
                            currentWellnessData()!.wellnessTrends.avgMotivation.toFixed(
                              1
                            )
                          }}/10</span
                        >
                        <p-progressBar
                          [value]="
                            currentWellnessData()!.wellnessTrends
                              .avgMotivation * 10
                          "
                          [showValue]="false"
                        ></p-progressBar>
                      </div>

                      <div class="metric-card">
                        <div class="metric-header">
                          <span class="metric-label">Confidence</span>
                        </div>
                        <span class="metric-value"
                          >{{
                            currentWellnessData()!.wellnessTrends.avgConfidence.toFixed(
                              1
                            )
                          }}/10</span
                        >
                        <p-progressBar
                          [value]="
                            currentWellnessData()!.wellnessTrends
                              .avgConfidence * 10
                          "
                          [showValue]="false"
                        ></p-progressBar>
                      </div>
                    </div>

                    <!-- Trends Chart -->
                    <p-card header="Wellness Trends Over Time">
                      <p-chart
                        type="line"
                        [data]="wellnessChartData()"
                        [options]="chartOptions"
                      ></p-chart>
                    </p-card>

                    <!-- Sleep & Recovery -->
                    <div class="dual-cards">
                      <p-card header="Sleep Patterns">
                        <div class="sleep-stats">
                          <div class="sleep-stat">
                            <span class="stat-value"
                              >{{
                                currentWellnessData()!.sleepPatterns.avgSleepHours.toFixed(
                                  1
                                )
                              }}h</span
                            >
                            <span class="stat-label">Avg Sleep</span>
                          </div>
                          <div class="sleep-stat">
                            <span class="stat-value"
                              >{{
                                currentWellnessData()!.sleepPatterns.sleepQualityAvg.toFixed(
                                  1
                                )
                              }}/10</span
                            >
                            <span class="stat-label">Quality</span>
                          </div>
                          <div class="sleep-stat">
                            <span class="stat-value">{{
                              currentWellnessData()!.sleepPatterns.sleepDebtDays
                            }}</span>
                            <span class="stat-label">Debt Days</span>
                          </div>
                        </div>
                        <div class="sleep-indicators">
                          <div
                            class="indicator"
                            [class.positive]="
                              currentWellnessData()!.sleepPatterns
                                .consistentBedtime
                            "
                          >
                            <i
                              [class]="
                                currentWellnessData()!.sleepPatterns
                                  .consistentBedtime
                                  ? 'pi pi-check-circle'
                                  : 'pi pi-times-circle'
                              "
                            ></i>
                            <span>Consistent bedtime</span>
                          </div>
                          <div
                            class="indicator"
                            [class.negative]="
                              currentWellnessData()!.sleepPatterns
                                .weekendOversleep
                            "
                          >
                            <i
                              [class]="
                                currentWellnessData()!.sleepPatterns
                                  .weekendOversleep
                                  ? 'pi pi-exclamation-circle'
                                  : 'pi pi-check-circle'
                              "
                            ></i>
                            <span>{{
                              currentWellnessData()!.sleepPatterns
                                .weekendOversleep
                                ? "Weekend oversleep detected"
                                : "No weekend compensation"
                            }}</span>
                          </div>
                        </div>
                      </p-card>

                      <p-card header="Recovery Behaviors">
                        <div class="recovery-stats">
                          <div class="recovery-stat">
                            <span class="stat-value"
                              >{{
                                currentWellnessData()!.recoveryBehaviors.avgRecoveryScore.toFixed(
                                  1
                                )
                              }}/10</span
                            >
                            <span class="stat-label">Avg Recovery Score</span>
                          </div>
                          <div class="recovery-stat">
                            <span class="stat-value">{{
                              currentWellnessData()!.recoveryBehaviors
                                .socialRecoveryActivities
                            }}</span>
                            <span class="stat-label">Social Activities</span>
                          </div>
                        </div>
                        <div class="screen-time">
                          <span>Screen time before bed:</span>
                          <p-tag
                            [value]="
                              currentWellnessData()!.recoveryBehaviors
                                .screenTimeBeforeBed
                            "
                            [severity]="
                              getScreenTimeSeverity(
                                currentWellnessData()!.recoveryBehaviors
                                  .screenTimeBeforeBed
                              )
                            "
                          ></p-tag>
                        </div>
                        <div class="activities-list">
                          <span class="list-label"
                            >Logged recovery activities:</span
                          >
                          <div class="activity-tags">
                            @for (
                              activity of currentWellnessData()!
                                .recoveryBehaviors.recoveryActivitiesLogged;
                              track $index
                            ) {
                              <span class="activity-tag">{{ activity }}</span>
                            }
                          </div>
                        </div>
                      </p-card>
                    </div>

                    <!-- Observed Patterns -->
                    <p-card header="AI-Observed Patterns">
                      <div class="patterns-grid">
                        @if (
                          currentWellnessData()!.observedPatterns.stressTriggers
                            .length > 0
                        ) {
                          <div class="pattern-section">
                            <h5>
                              <i class="pi pi-exclamation-triangle"></i> Stress
                              Triggers
                            </h5>
                            <ul>
                              @for (
                                trigger of currentWellnessData()!
                                  .observedPatterns.stressTriggers;
                                track $index
                              ) {
                                <li>{{ trigger }}</li>
                              }
                            </ul>
                          </div>
                        }
                        @if (
                          currentWellnessData()!.observedPatterns
                            .positiveCorrelations.length > 0
                        ) {
                          <div class="pattern-section positive">
                            <h5>
                              <i class="pi pi-thumbs-up"></i> Positive
                              Correlations
                            </h5>
                            <ul>
                              @for (
                                correlation of currentWellnessData()!
                                  .observedPatterns.positiveCorrelations;
                                track $index
                              ) {
                                <li>{{ correlation }}</li>
                              }
                            </ul>
                          </div>
                        }
                        @if (
                          currentWellnessData()!.observedPatterns
                            .concerningPatterns.length > 0
                        ) {
                          <div class="pattern-section concerning">
                            <h5>
                              <i class="pi pi-info-circle"></i> Patterns to
                              Discuss
                            </h5>
                            <ul>
                              @for (
                                pattern of currentWellnessData()!
                                  .observedPatterns.concerningPatterns;
                                track $index
                              ) {
                                <li>{{ pattern }}</li>
                              }
                            </ul>
                          </div>
                        }
                      </div>
                    </p-card>
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- Pre-Competition -->
            <p-tabpanel [value]="2">
              <div class="precomp-section">
                <div class="section-header">
                  <h3>Pre-Competition Mental State</h3>
                  <app-button
                    variant="outlined"
                    iconLeft="pi-plus"
                    (clicked)="showPreCompDialog.set(true)"
                    >New Assessment</app-button
                  >
                </div>

                @if (preCompReports().length > 0) {
                  <div class="precomp-grid">
                    @for (report of preCompReports(); track $index) {
                      <p-card styleClass="precomp-card">
                        <ng-template #header>
                          <div class="precomp-header">
                            <div class="comp-info">
                              <span class="comp-name">{{
                                report.competition.name
                              }}</span>
                              <span class="comp-date">{{
                                report.competition.date | date: "mediumDate"
                              }}</span>
                            </div>
                            <p-tag
                              [value]="report.competition.significance"
                              [severity]="
                                getSignificanceSeverity(
                                  report.competition.significance
                                )
                              "
                            ></p-tag>
                          </div>
                        </ng-template>

                        <div class="precomp-content">
                          <div class="mental-state">
                            <h5>7-Day Lead-Up</h5>
                            <div class="state-metrics">
                              <div class="state-metric">
                                <span class="metric-label">Confidence</span>
                                <div class="metric-with-trend">
                                  <span class="metric-value"
                                    >{{
                                      report.leadUpPeriod.avgConfidence.toFixed(
                                        1
                                      )
                                    }}/10</span
                                  >
                                  <i
                                    [class]="
                                      getTrendIcon(
                                        report.leadUpPeriod.confidenceTrend
                                      )
                                    "
                                    [ngClass]="{
                                      positive:
                                        report.leadUpPeriod.confidenceTrend ===
                                        'rising',
                                      negative:
                                        report.leadUpPeriod.confidenceTrend ===
                                        'falling',
                                    }"
                                  ></i>
                                </div>
                              </div>
                              <div class="state-metric">
                                <span class="metric-label">Anxiety</span>
                                <div class="metric-with-trend">
                                  <span class="metric-value"
                                    >{{
                                      report.leadUpPeriod.avgAnxiety.toFixed(1)
                                    }}/10</span
                                  >
                                  <i
                                    [class]="
                                      getTrendIcon(
                                        report.leadUpPeriod.anxietyTrend,
                                        true
                                      )
                                    "
                                    [ngClass]="{
                                      negative:
                                        report.leadUpPeriod.anxietyTrend ===
                                        'rising',
                                      positive:
                                        report.leadUpPeriod.anxietyTrend ===
                                        'falling',
                                    }"
                                  ></i>
                                </div>
                              </div>
                              <div class="state-metric">
                                <span class="metric-label">Sleep</span>
                                <span class="metric-value"
                                  >{{
                                    report.leadUpPeriod.avgSleep.toFixed(1)
                                  }}h</span
                                >
                              </div>
                              <div class="state-metric">
                                <span class="metric-label">Focus</span>
                                <span class="metric-value"
                                  >{{
                                    report.leadUpPeriod.focusRating.toFixed(1)
                                  }}/10</span
                                >
                              </div>
                            </div>
                          </div>

                          <div class="self-assessment">
                            <h5>Self Assessment</h5>
                            <div class="readiness">
                              <span>Readiness:</span>
                              <div class="readiness-bar">
                                <p-progressBar
                                  [value]="
                                    report.selfAssessment.readinessRating * 10
                                  "
                                  [showValue]="false"
                                ></p-progressBar>
                                <span
                                  >{{
                                    report.selfAssessment.readinessRating
                                  }}/10</span
                                >
                              </div>
                            </div>
                            @if (report.selfAssessment.biggestConcern) {
                              <div class="concern">
                                <strong>Biggest concern:</strong>
                                {{ report.selfAssessment.biggestConcern }}
                              </div>
                            }
                          </div>
                        </div>

                        <ng-template #footer>
                          <app-button
                            variant="text"
                            iconLeft="pi-eye"
                            (clicked)="viewPreCompReport(report)"
                            >View Full Report</app-button
                          >
                          <app-button
                            variant="text"
                            iconLeft="pi-download"
                            (clicked)="downloadPreCompReport(report)"
                            >Download</app-button
                          >
                        </ng-template>
                      </p-card>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <i class="pi pi-calendar"></i>
                    <h4>No Pre-Competition Assessments</h4>
                    <p>
                      Create a pre-competition assessment to track your mental
                      state before important events.
                    </p>
                    <app-button
                      iconLeft="pi-plus"
                      (clicked)="showPreCompDialog.set(true)"
                      >New Assessment</app-button
                    >
                  </div>
                }
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>

        <!-- Generate Report Dialog -->
        <p-dialog
          header="Generate Mental Wellness Report"
          [(visible)]="showGenerateDialog"
          [modal]="true"
          [style]="{ width: '600px' }"
          [dismissableMask]="true"
        >
          <div class="generate-form">
            <div class="form-group">
              <label>Report Type</label>
              <p-select
                [options]="reportTypeOptions"
                [(ngModel)]="newReport.type"
                placeholder="Select report type"
                styleClass="w-full"
              ></p-select>
            </div>

            <div class="form-group">
              <label>Time Period</label>
              <p-select
                [options]="timePeriods"
                [(ngModel)]="newReport.period"
                placeholder="Select period"
                styleClass="w-full"
              ></p-select>
            </div>

            <div class="privacy-settings">
              <h4><i class="pi pi-shield"></i> Privacy Settings</h4>
              <p class="privacy-hint">
                Select what data to include in your report:
              </p>

              <div class="checkbox-grid">
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.includeWellnessScores"
                    [binary]="true"
                    inputId="wellness"
                  ></p-checkbox>
                  <label for="wellness">Wellness scores</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.includeSleepData"
                    [binary]="true"
                    inputId="sleep"
                  ></p-checkbox>
                  <label for="sleep">Sleep data</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.includeTrainingLoad"
                    [binary]="true"
                    inputId="training"
                  ></p-checkbox>
                  <label for="training">Training load</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.includePerformanceData"
                    [binary]="true"
                    inputId="performance"
                  ></p-checkbox>
                  <label for="performance">Performance data</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.includeInjuryHistory"
                    [binary]="true"
                    inputId="injuries"
                  ></p-checkbox>
                  <label for="injuries">Injury history</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.includeAINotes"
                    [binary]="true"
                    inputId="ai"
                  ></p-checkbox>
                  <label for="ai">AI-generated patterns</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.includePersonalNotes"
                    [binary]="true"
                    inputId="personal"
                  ></p-checkbox>
                  <label for="personal">Personal notes</label>
                </div>
              </div>

              <div class="anonymization-options">
                <h5>Anonymization Options</h5>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.anonymizeTeamName"
                    [binary]="true"
                    inputId="anonTeam"
                  ></p-checkbox>
                  <label for="anonTeam">Hide team name</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.anonymizeCoachNames"
                    [binary]="true"
                    inputId="anonCoach"
                  ></p-checkbox>
                  <label for="anonCoach">Hide coach names</label>
                </div>
                <div class="checkbox-item">
                  <p-checkbox
                    [(ngModel)]="privacySettings.removeDates"
                    [binary]="true"
                    inputId="removeDates"
                  ></p-checkbox>
                  <label for="removeDates">Show relative dates only</label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="notes">Personal Notes (optional)</label>
              <textarea
                id="notes"
                pInputTextarea
                [(ngModel)]="newReport.notes"
                rows="3"
                placeholder="Add any context or notes for your psychologist..."
                class="w-full"
              ></textarea>
            </div>
          </div>
          <ng-template #footer>
            <app-button variant="text" (clicked)="showGenerateDialog.set(false)"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-file-pdf" (clicked)="generateReport()"
              >Generate Report</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Pre-Competition Dialog -->
        <p-dialog
          header="Pre-Competition Assessment"
          [(visible)]="showPreCompDialog"
          [modal]="true"
          [style]="{ width: '500px' }"
          [dismissableMask]="true"
        >
          <div class="precomp-form">
            <div class="form-group">
              <label>Competition Name</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="newPreComp.name"
                placeholder="e.g., Regional Championships"
                class="w-full"
              />
            </div>
            <div class="form-group">
              <label>Significance</label>
              <p-select
                [options]="significanceOptions"
                [(ngModel)]="newPreComp.significance"
                placeholder="Select importance"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-group">
              <label>Readiness Rating (1-10)</label>
              <input
                type="number"
                pInputText
                [(ngModel)]="newPreComp.readiness"
                min="1"
                max="10"
                class="w-full"
              />
            </div>
            <div class="form-group">
              <label>Biggest Concern (optional)</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="newPreComp.concern"
                placeholder="What's on your mind?"
                class="w-full"
              />
            </div>
          </div>
          <ng-template #footer>
            <app-button variant="text" (clicked)="showPreCompDialog.set(false)"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-check"
              (clicked)="createPreCompAssessment()"
              >Create Assessment</app-button
            >
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrls: ["./psychology-reports.component.scss"],
})
export class PsychologyReportsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // State
  loading = signal(false);
  generatedReports = signal<
    {
      type: string;
      generatedDate: Date;
      periodStart: Date;
      periodEnd: Date;
      includedSections: string[];
    }[]
  >([]);
  currentWellnessData = signal<MentalWellnessReport | null>(null);
  preCompReports = signal<PreCompetitionReport[]>([]);

  // UI State
  selectedPeriod = "30days";
  showGenerateDialog = signal(false);
  showPreCompDialog = signal(false);

  // Form data
  newReport = {
    type: "weekly",
    period: "7days",
    notes: "",
  };

  privacySettings: ReportPrivacySettings = {
    includeWellnessScores: true,
    includeSleepData: true,
    includeTrainingLoad: true,
    includePerformanceData: false,
    includeInjuryHistory: false,
    includeAINotes: true,
    includePersonalNotes: true,
    anonymizeTeamName: false,
    anonymizeCoachNames: false,
    removeDates: false,
  };

  newPreComp = {
    name: "",
    significance: "regular" as "regular" | "important" | "championship",
    readiness: 7,
    concern: "",
  };

  // Options
  reportTypeOptions = [
    { label: "Weekly Wellness Report", value: "weekly" },
    { label: "Monthly Summary", value: "monthly" },
    { label: "Season Overview", value: "season" },
    { label: "Custom Period", value: "custom" },
  ];

  timePeriods = [
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 14 Days", value: "14days" },
    { label: "Last 30 Days", value: "30days" },
    { label: "Last 90 Days", value: "90days" },
  ];

  significanceOptions = [
    { label: "Regular Game/Tournament", value: "regular" },
    { label: "Important Match", value: "important" },
    { label: "Championship/Finals", value: "championship" },
  ];

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" as const },
    },
    scales: {
      y: { min: 0, max: 10 },
    },
  };

  // Computed
  wellnessChartData = computed(() => {
    const data = this.currentWellnessData();
    if (!data) return { labels: [], datasets: [] };

    const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    return {
      labels,
      datasets: [
        {
          label: "Mood",
          data: [6.5, 7.2, 6.8, data.wellnessTrends.avgMoodScore],
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Stress",
          data: [5.5, 4.8, 5.2, data.wellnessTrends.avgStressLevel],
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Confidence",
          data: [7.0, 7.5, 7.2, data.wellnessTrends.avgConfidence],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadWellnessData(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Load wellness data from API
      const response = await firstValueFrom(
        this.api.get<{
          mentalLogs: Array<{
            log_date: string;
            confidence_level: number;
            focus_level: number;
            motivation_level: number;
            anxiety_level: number;
          }>;
          wellness: Array<{
            date: string;
            mood: number;
            stress_level: number;
            sleep_quality: number;
            motivation_level: number;
            energy_level: number;
          }>;
          assessments: Array<{
            assessment_type: string;
            score: number;
            created_at: string;
            requires_professional_review: boolean;
          }>;
        }>("/api/staff-psychology/my-data"),
      );

      if (response?.data) {
        this.processWellnessData(response.data);
      }
    } catch (error) {
      console.error("Failed to load psychology data:", error);
      this.toast.error("Failed to load psychology data");
    } finally {
      this.loading.set(false);
    }
  }

  private processWellnessData(data: {
    mentalLogs: Array<{
      log_date: string;
      confidence_level: number;
      focus_level: number;
      motivation_level: number;
      anxiety_level: number;
    }>;
    wellness: Array<{
      date: string;
      mood: number;
      stress_level: number;
      sleep_quality: number;
      motivation_level: number;
      energy_level: number;
    }>;
    assessments: Array<{
      assessment_type: string;
      score: number;
      created_at: string;
      requires_professional_review: boolean;
    }>;
  }): void {
    const mentalLogs = data.mentalLogs || [];
    const wellness = data.wellness || [];

    // Calculate averages
    const avgMood = this.calcAverage(wellness, "mood");
    const avgStress = this.calcAverage(wellness, "stress_level");
    const avgSleep = this.calcAverage(wellness, "sleep_quality");
    const avgMotivation =
      this.calcAverage(mentalLogs, "motivation_level") ||
      this.calcAverage(wellness, "motivation_level");
    const avgConfidence = this.calcAverage(mentalLogs, "confidence_level");
    const avgAnxiety = this.calcAverage(mentalLogs, "anxiety_level");

    const wellnessData: MentalWellnessReport = {
      reportPeriod: {
        start: new Date(Date.now() - 30 * 86400000),
        end: new Date(),
      },
      generatedBy: "athlete",
      athlete: {
        name: "Current User",
        age: 0,
        position: "",
        teamRole: "",
      },
      wellnessTrends: {
        avgMoodScore: avgMood || 5,
        moodTrend: this.calculateTrend(wellness.map((w) => w.mood)),
        avgStressLevel: avgStress || 5,
        stressTrend: this.calculateTrend(
          wellness.map((w) => w.stress_level),
          true,
        ),
        avgMotivation: avgMotivation || 5,
        avgConfidence: avgConfidence || 5,
        anxietyIndicators: avgAnxiety || 5,
      },
      sleepPatterns: {
        avgSleepHours: 7,
        sleepQualityAvg: avgSleep || 5,
        consistentBedtime: true,
        sleepDebtDays: wellness.filter((w) => w.sleep_quality < 5).length,
        weekendOversleep: false,
      },
      trainingContext: {
        avgTrainingLoad: 400,
        highLoadDays: 0,
        restDays: 0,
        upcomingCompetitions: [],
        recentGamePerformance: "average",
      },
      recoveryBehaviors: {
        avgRecoveryScore: 7,
        recoveryActivitiesLogged: [],
        socialRecoveryActivities: 0,
        screenTimeBeforeBed: "moderate",
      },
      significantEvents: {
        injuries: [],
        performanceHighlights: [],
        performanceChallenges: [],
        lifeEvents: [],
      },
      observedPatterns: {
        stressTriggers: this.identifyStressTriggers(wellness, mentalLogs),
        positiveCorrelations: this.identifyPositiveCorrelations(
          wellness,
          mentalLogs,
        ),
        concerningPatterns: this.identifyConcerns(wellness, mentalLogs),
      },
      athleteNotes: "",
    };

    this.currentWellnessData.set(wellnessData);

    // Set empty reports (will be populated when user generates)
    this.generatedReports.set([]);
    this.preCompReports.set([]);
  }

  private calcAverage(
    data: Array<Record<string, unknown>>,
    field: string,
  ): number | null {
    const values = data
      .map((d) => d[field] as number)
      .filter((v) => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return (
      Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) /
      10
    );
  }

  private calculateTrend(
    values: (number | undefined)[],
    invertForStress = false,
  ): "improving" | "stable" | "declining" {
    const filtered = values.filter((v): v is number => v !== undefined);
    if (filtered.length < 3) return "stable";

    const recent = filtered.slice(-7);
    const older = filtered.slice(-14, -7);
    if (older.length === 0) return "stable";

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const diff = recentAvg - olderAvg;

    if (invertForStress) {
      if (diff < -0.5) return "improving";
      if (diff > 0.5) return "declining";
    } else {
      if (diff > 0.5) return "improving";
      if (diff < -0.5) return "declining";
    }
    return "stable";
  }

  private identifyStressTriggers(
    wellness: Array<{ stress_level: number; sleep_quality: number }>,
    _mentalLogs: Array<{ anxiety_level: number }>,
  ): string[] {
    const triggers: string[] = [];
    const highStressDays = wellness.filter((w) => w.stress_level >= 7);
    const lowSleepDays = wellness.filter((w) => w.sleep_quality <= 4);

    if (highStressDays.length > 3) {
      triggers.push("Elevated stress levels observed multiple times");
    }
    if (lowSleepDays.length > 2) {
      triggers.push("Higher stress correlates with poor sleep quality");
    }
    return triggers;
  }

  private identifyPositiveCorrelations(
    wellness: Array<{ mood: number; sleep_quality: number }>,
    _mentalLogs: Array<{ confidence_level: number }>,
  ): string[] {
    const correlations: string[] = [];
    const goodSleepGoodMood = wellness.filter(
      (w) => w.sleep_quality >= 7 && w.mood >= 7,
    );
    if (goodSleepGoodMood.length > 3) {
      correlations.push("Better mood correlates with quality sleep (7+ hours)");
    }
    return correlations;
  }

  private identifyConcerns(
    wellness: Array<{ stress_level: number; mood: number }>,
    mentalLogs: Array<{ anxiety_level: number }>,
  ): string[] {
    const concerns: string[] = [];
    const avgStress = this.calcAverage(
      wellness as Array<Record<string, unknown>>,
      "stress_level",
    );
    const avgAnxiety = this.calcAverage(
      mentalLogs as Array<Record<string, unknown>>,
      "anxiety_level",
    );

    if (avgStress && avgStress > 6) {
      concerns.push("Consistently elevated stress levels");
    }
    if (avgAnxiety && avgAnxiety > 6) {
      concerns.push("Elevated anxiety indicators");
    }
    return concerns;
  }

  getReportIcon(type: string): string {
    const icons: Record<string, string> = {
      weekly: "pi pi-calendar",
      monthly: "pi pi-calendar-plus",
      season: "pi pi-chart-line",
      custom: "pi pi-sliders-h",
    };
    return icons[type] || "pi pi-file";
  }

  getReportTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      weekly: "Weekly Wellness Report",
      monthly: "Monthly Summary",
      season: "Season Overview",
      custom: "Custom Report",
    };
    return labels[type] || type;
  }

  getTrendSeverity(
    trend: string,
    invertForStress = false,
  ): "success" | "warn" | "danger" | "info" | "secondary" {
    if (invertForStress) {
      return trend === "declining"
        ? "success"
        : trend === "improving"
          ? "warn"
          : "info";
    }
    return trend === "improving"
      ? "success"
      : trend === "declining"
        ? "warn"
        : "info";
  }

  getScreenTimeSeverity(
    level: string,
  ): "success" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warn" | "danger" | "secondary"
    > = {
      low: "success",
      moderate: "warn",
      high: "danger",
    };
    return severities[level] || "secondary";
  }

  getSignificanceSeverity(
    significance: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      regular: "info",
      important: "warn",
      championship: "danger",
    };
    return severities[significance] || "info";
  }

  getTrendIcon(trend: string, invertForAnxiety = false): string {
    if (invertForAnxiety) {
      return trend === "rising"
        ? "pi pi-arrow-up"
        : trend === "falling"
          ? "pi pi-arrow-down"
          : "pi pi-minus";
    }
    return trend === "rising"
      ? "pi pi-arrow-up"
      : trend === "falling"
        ? "pi pi-arrow-down"
        : "pi pi-minus";
  }

  downloadReport(
    report: { type: string; generatedDate: Date },
    format: string,
  ): void {
    this.toast.success(`Downloading ${format.toUpperCase()} report...`);
  }

  deleteReport(report: { type: string }): void {
    const reports = this.generatedReports();
    this.generatedReports.set(reports.filter((r) => r !== report));
    this.toast.success("Report deleted");
  }

  generateReport(): void {
    const selectedSections: string[] = [];
    if (this.privacySettings.includeWellnessScores)
      selectedSections.push("Wellness");
    if (this.privacySettings.includeSleepData) selectedSections.push("Sleep");
    if (this.privacySettings.includeTrainingLoad)
      selectedSections.push("Training");
    if (this.privacySettings.includePerformanceData)
      selectedSections.push("Performance");
    if (this.privacySettings.includeInjuryHistory)
      selectedSections.push("Injuries");
    if (this.privacySettings.includeAINotes)
      selectedSections.push("AI Patterns");
    if (this.privacySettings.includePersonalNotes)
      selectedSections.push("Notes");

    const periodDays =
      parseInt(this.newReport.period.replace("days", ""), 10) || 30;

    const newReport = {
      type: this.newReport.type,
      generatedDate: new Date(),
      periodStart: new Date(Date.now() - periodDays * 86400000),
      periodEnd: new Date(),
      includedSections: selectedSections,
    };

    this.generatedReports.set([newReport, ...this.generatedReports()]);
    this.toast.success("Report generated successfully!");
    this.showGenerateDialog.set(false);
  }

  viewPreCompReport(report: PreCompetitionReport): void {
    this.toast.info(`Viewing report for ${report.competition.name}`);
  }

  downloadPreCompReport(report: PreCompetitionReport): void {
    this.toast.success(
      `Downloading pre-competition report for ${report.competition.name}...`,
    );
  }

  createPreCompAssessment(): void {
    if (!this.newPreComp.name) {
      this.toast.warn("Please enter competition name");
      return;
    }

    const newReport: PreCompetitionReport = {
      competition: {
        name: this.newPreComp.name,
        date: new Date(Date.now() + 7 * 86400000),
        significance: this.newPreComp.significance,
      },
      leadUpPeriod: {
        avgConfidence: 7.0,
        confidenceTrend: "stable",
        avgAnxiety: 4.5,
        anxietyTrend: "stable",
        avgSleep: 7.2,
        sleepQuality: 7.0,
        appetiteChanges: false,
        focusRating: 7.5,
      },
      historicalComparison: {
        previousSimilarEvents: 0,
        avgPerformanceInSimilar: "N/A",
        mentalStateCorrelation: "Insufficient data",
      },
      selfAssessment: {
        readinessRating: this.newPreComp.readiness,
        biggestConcern: this.newPreComp.concern,
        copingStrategies: [],
        supportNeeded: [],
      },
    };

    this.preCompReports.set([newReport, ...this.preCompReports()]);
    this.toast.success("Assessment created!");
    this.showPreCompDialog.set(false);
    this.newPreComp = {
      name: "",
      significance: "regular",
      readiness: 7,
      concern: "",
    };
  }
}
