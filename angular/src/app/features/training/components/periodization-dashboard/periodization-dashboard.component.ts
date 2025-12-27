/**
 * Periodization Dashboard Component
 *
 * Displays evidence-based training recommendations for flag football athletes
 * based on current training phase, athlete profile, and load calculations.
 *
 * Features:
 * - Current phase display with description
 * - Weekly training template
 * - Sprint protocol recommendations
 * - Load targets and ACWR status
 * - Evidence-based research references
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { AccordionModule } from "primeng/accordion";
import { TabViewModule } from "primeng/tabview";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { ChipModule } from "primeng/chip";
import { TimelineModule } from "primeng/timeline";
import { BadgeModule } from "primeng/badge";

// Services
import {
  FlagFootballPeriodizationService,
  PhaseConfig,
  SeasonalRecommendation,
  WeeklyTrainingTemplate,
} from "../../../../core/services/flag-football-periodization.service";
import {
  SprintTrainingKnowledgeService,
  SprintPhaseGuidelines,
  SprintProtocol,
} from "../../../../core/services/sprint-training-knowledge.service";
import {
  PhaseLoadCalculatorService,
  LoadRecommendation,
  ACWRCalculation,
  WeeklyLoadTarget,
} from "../../../../core/services/phase-load-calculator.service";
import {
  FlagFootballAthleteProfileService,
  FlagFootballPosition,
} from "../../../../core/services/flag-football-athlete-profile.service";

interface TimelineEvent {
  phase: string;
  month: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: "app-periodization-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    AccordionModule,
    TabViewModule,
    TooltipModule,
    ButtonModule,
    DividerModule,
    ChipModule,
    TimelineModule,
    BadgeModule,
  ],
  template: `
    <div class="periodization-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>
          <i class="pi pi-calendar"></i>
          Training Periodization
        </h1>
        <p class="subtitle">Evidence-based annual training plan for flag football athletes</p>
      </div>

      <!-- Current Phase Card -->
      <p-card styleClass="phase-card">
        <ng-template pTemplate="header">
          <div class="phase-header">
            <div class="phase-info">
              <p-tag
                [value]="currentPhase()?.name || 'Loading...'"
                [severity]="getPhaseSeverity()"
                styleClass="phase-tag"
              ></p-tag>
              <span class="phase-week">Week {{ currentWeek() }} of {{ currentPhase()?.durationWeeks || 4 }}</span>
            </div>
            <div class="phase-date">
              {{ currentDate | date:'MMMM yyyy' }}
            </div>
          </div>
        </ng-template>

        <div class="phase-content">
          <p class="phase-description">{{ currentPhase()?.description }}</p>

          <div class="focus-areas">
            <h4>Primary Focus</h4>
            <div class="chips-container">
              @for (focus of currentPhase()?.primaryFocus || []; track focus) {
                <p-chip [label]="formatFocus(focus)" styleClass="focus-chip primary"></p-chip>
              }
            </div>

            <h4>Secondary Focus</h4>
            <div class="chips-container">
              @for (focus of currentPhase()?.secondaryFocus || []; track focus) {
                <p-chip [label]="formatFocus(focus)" styleClass="focus-chip secondary"></p-chip>
              }
            </div>
          </div>

          <!-- Load Targets -->
          <div class="load-targets">
            <h4>Weekly Load Target</h4>
            <div class="load-bar-container">
              <div class="load-info">
                <span>Target: {{ loadRecommendation()?.recommendedLoad || 0 }} AU</span>
                <span>Range: {{ loadRecommendation()?.loadRange?.[0] || 0 }} - {{ loadRecommendation()?.loadRange?.[1] || 0 }} AU</span>
              </div>
              <p-progressBar
                [value]="getLoadProgress()"
                [showValue]="false"
                styleClass="load-bar"
              ></p-progressBar>
            </div>
          </div>

          <!-- ACWR Status -->
          @if (acwrStatus()) {
            <div class="acwr-status" [class]="'acwr-' + acwrStatus()?.riskZone">
              <div class="acwr-header">
                <span class="acwr-label">ACWR</span>
                <span class="acwr-value">{{ acwrStatus()?.acwr }}</span>
                <p-tag
                  [value]="acwrStatus()?.riskZone || 'unknown'"
                  [severity]="getAcwrSeverity()"
                ></p-tag>
              </div>
              <p class="acwr-recommendation">{{ acwrStatus()?.recommendation }}</p>
            </div>
          }
        </div>
      </p-card>

      <!-- Tabs for different views -->
      <p-tabView styleClass="training-tabs">
        <!-- Weekly Schedule Tab -->
        <p-tabPanel header="Weekly Schedule">
          <div class="weekly-schedule">
            @if (weeklyTemplate()) {
              @for (day of weeklyTemplate()?.days || []; track day.dayName) {
                <div class="day-card" [class]="'session-' + day.sessionType">
                  <div class="day-header">
                    <span class="day-name">{{ day.dayName }}</span>
                    <p-tag
                      [value]="day.sessionType"
                      [severity]="getSessionSeverity(day.sessionType)"
                      size="small"
                    ></p-tag>
                  </div>
                  <div class="day-content">
                    <div class="day-focus">
                      <i class="pi pi-bolt"></i>
                      {{ formatFocus(day.primaryFocus) }}
                    </div>
                    @if (day.estimatedDuration > 0) {
                      <div class="day-duration">
                        <i class="pi pi-clock"></i>
                        {{ day.estimatedDuration }} min
                      </div>
                    }
                    <div class="day-rpe">
                      <i class="pi pi-chart-line"></i>
                      RPE: {{ day.targetRPE }}
                    </div>
                    @if (day.notes) {
                      <div class="day-notes">{{ day.notes }}</div>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Weekly Totals -->
          @if (weeklyTemplate()?.weeklyTotals) {
            <div class="weekly-totals">
              <h4>Weekly Totals</h4>
              <div class="totals-grid">
                <div class="total-item">
                  <span class="total-value">{{ weeklyTemplate()?.weeklyTotals?.totalSprints }}</span>
                  <span class="total-label">Sprints</span>
                </div>
                <div class="total-item">
                  <span class="total-value">{{ weeklyTemplate()?.weeklyTotals?.totalCuts }}</span>
                  <span class="total-label">Cuts</span>
                </div>
                <div class="total-item">
                  <span class="total-value">{{ weeklyTemplate()?.weeklyTotals?.totalPlyoContacts }}</span>
                  <span class="total-label">Plyo Contacts</span>
                </div>
                <div class="total-item">
                  <span class="total-value">{{ weeklyTemplate()?.weeklyTotals?.trainingDays }}</span>
                  <span class="total-label">Training Days</span>
                </div>
              </div>
            </div>
          }
        </p-tabPanel>

        <!-- Sprint Protocols Tab -->
        <p-tabPanel header="Sprint Training">
          <div class="sprint-protocols">
            @if (sprintGuidelines()) {
              <div class="sprint-header">
                <h3>{{ sprintGuidelines()?.phase }}</h3>
                <p>
                  Weekly Sprint Volume:
                  {{ sprintGuidelines()?.weeklySprintVolume?.[0] }} -
                  {{ sprintGuidelines()?.weeklySprintVolume?.[1] }} sprints
                </p>
              </div>

              <div class="sprint-features">
                <div class="feature" [class.active]="sprintGuidelines()?.accelerationWork">
                  <i class="pi" [class.pi-check]="sprintGuidelines()?.accelerationWork" [class.pi-times]="!sprintGuidelines()?.accelerationWork"></i>
                  Acceleration Work
                </div>
                <div class="feature" [class.active]="sprintGuidelines()?.maxVelocityWork">
                  <i class="pi" [class.pi-check]="sprintGuidelines()?.maxVelocityWork" [class.pi-times]="!sprintGuidelines()?.maxVelocityWork"></i>
                  Max Velocity
                </div>
                <div class="feature" [class.active]="sprintGuidelines()?.resistedSprints">
                  <i class="pi" [class.pi-check]="sprintGuidelines()?.resistedSprints" [class.pi-times]="!sprintGuidelines()?.resistedSprints"></i>
                  Resisted Sprints
                </div>
                <div class="feature" [class.active]="sprintGuidelines()?.flyingSprints">
                  <i class="pi" [class.pi-check]="sprintGuidelines()?.flyingSprints" [class.pi-times]="!sprintGuidelines()?.flyingSprints"></i>
                  Flying Sprints
                </div>
              </div>

              <h4>Recommended Protocols</h4>
              <div class="protocols-list">
                @for (protocol of sprintGuidelines()?.recommendedProtocols || []; track protocol) {
                  <p-chip [label]="formatProtocol(protocol)" styleClass="protocol-chip"></p-chip>
                }
              </div>

              @if (sprintGuidelines()?.avoidProtocols?.length) {
                <h4>Avoid This Phase</h4>
                <div class="protocols-list avoid">
                  @for (protocol of sprintGuidelines()?.avoidProtocols || []; track protocol) {
                    <p-chip [label]="formatProtocol(protocol)" styleClass="protocol-chip avoid"></p-chip>
                  }
                </div>
              }
            }

            <!-- Flag Football Sprint Tips -->
            <div class="sprint-tips">
              <h4>🏈 Flag Football Sprint Tips</h4>
              <ul>
                @for (tip of sprintRecommendations(); track tip) {
                  <li>{{ tip }}</li>
                }
              </ul>
            </div>
          </div>
        </p-tabPanel>

        <!-- Annual Timeline Tab -->
        <p-tabPanel header="Annual Plan">
          <div class="annual-timeline">
            <p-timeline [value]="annualTimeline()" layout="horizontal" styleClass="phase-timeline">
              <ng-template pTemplate="marker" let-event>
                <span class="timeline-marker" [style.background-color]="event.color">
                  <i [class]="event.icon"></i>
                </span>
              </ng-template>
              <ng-template pTemplate="content" let-event>
                <div class="timeline-content">
                  <span class="timeline-month">{{ event.month }}</span>
                  <span class="timeline-phase">{{ event.phase }}</span>
                </div>
              </ng-template>
            </p-timeline>
          </div>

          <p-divider></p-divider>

          <!-- Phase Details Accordion -->
          <p-accordion [multiple]="true">
            @for (phase of allPhases(); track phase.type) {
              <p-accordionTab [header]="phase.name">
                <div class="phase-detail">
                  <p>{{ phase.description }}</p>

                  <div class="phase-metrics">
                    <div class="metric">
                      <span class="metric-label">Duration</span>
                      <span class="metric-value">{{ phase.durationWeeks }} weeks</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Volume</span>
                      <span class="metric-value">{{ (phase.volumeMultiplier * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Intensity</span>
                      <span class="metric-value">{{ (phase.intensityMultiplier * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Recovery Priority</span>
                      <span class="metric-value">{{ phase.recoveryPriority }}</span>
                    </div>
                  </div>

                  <h5>Injury Prevention Focus</h5>
                  <ul>
                    @for (focus of phase.injuryPreventionFocus; track focus) {
                      <li>{{ focus }}</li>
                    }
                  </ul>
                </div>
              </p-accordionTab>
            }
          </p-accordion>
        </p-tabPanel>

        <!-- Evidence Base Tab -->
        <p-tabPanel header="Research">
          <div class="evidence-section">
            <h3>📚 Evidence-Based Training</h3>
            <p class="evidence-intro">
              All training recommendations are based on peer-reviewed research.
              Below are the key studies informing our periodization model.
            </p>

            <div class="research-cards">
              @for (ref of evidenceReferences(); track ref.title) {
                <div class="research-card">
                  <div class="research-header">
                    <span class="research-authors">{{ ref.authors }}</span>
                    <span class="research-year">({{ ref.year }})</span>
                  </div>
                  <h4 class="research-title">{{ ref.title }}</h4>
                  @if (ref.journal) {
                    <span class="research-journal">{{ ref.journal }}</span>
                  }
                  <div class="research-finding">
                    <strong>Key Finding:</strong> {{ ref.keyFinding }}
                  </div>
                  <div class="research-application">
                    <strong>Application:</strong> {{ ref.applicationToFlagFootball }}
                  </div>
                </div>
              }
            </div>
          </div>
        </p-tabPanel>
      </p-tabView>

      <!-- Personalized Adjustments -->
      @if (seasonalRecommendation()?.personalizedAdjustments?.length) {
        <p-card header="Personalized Recommendations" styleClass="adjustments-card">
          <ul class="adjustments-list">
            @for (adjustment of seasonalRecommendation()?.personalizedAdjustments || []; track adjustment) {
              <li>{{ adjustment }}</li>
            }
          </ul>
        </p-card>
      }

      <!-- Warnings -->
      @if (loadRecommendation()?.warnings?.length) {
        <div class="warnings-section">
          @for (warning of loadRecommendation()?.warnings || []; track warning) {
            <div class="warning-item">
              <i class="pi pi-exclamation-triangle"></i>
              {{ warning }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .periodization-dashboard {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;

        i {
          color: var(--primary-color);
        }
      }

      .subtitle {
        color: var(--text-color-secondary);
        font-size: 1.1rem;
      }
    }

    :host ::ng-deep .phase-card {
      margin-bottom: 2rem;

      .p-card-header {
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-700));
        border-radius: 6px 6px 0 0;
      }
    }

    .phase-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;

      .phase-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .phase-week {
        font-size: 0.9rem;
        opacity: 0.9;
      }

      .phase-date {
        font-size: 1.1rem;
        font-weight: 500;
      }
    }

    :host ::ng-deep .phase-tag {
      font-size: 1rem;
      padding: 0.5rem 1rem;
    }

    .phase-content {
      .phase-description {
        font-size: 1.05rem;
        line-height: 1.6;
        color: var(--text-color-secondary);
        margin-bottom: 1.5rem;
      }
    }

    .focus-areas {
      margin-bottom: 1.5rem;

      h4 {
        font-size: 0.9rem;
        text-transform: uppercase;
        color: var(--text-color-secondary);
        margin-bottom: 0.5rem;
      }

      .chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
    }

    :host ::ng-deep .focus-chip {
      &.primary {
        background: var(--primary-100);
        color: var(--primary-700);
      }

      &.secondary {
        background: var(--surface-200);
        color: var(--text-color-secondary);
      }
    }

    .load-targets {
      margin-bottom: 1.5rem;

      h4 {
        font-size: 0.9rem;
        text-transform: uppercase;
        color: var(--text-color-secondary);
        margin-bottom: 0.5rem;
      }

      .load-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }
    }

    :host ::ng-deep .load-bar {
      height: 8px;
      border-radius: 4px;
    }

    .acwr-status {
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;

      &.acwr-optimal {
        background: var(--green-50);
        border: 1px solid var(--green-200);
      }

      &.acwr-caution {
        background: var(--yellow-50);
        border: 1px solid var(--yellow-200);
      }

      &.acwr-danger {
        background: var(--red-50);
        border: 1px solid var(--red-200);
      }

      .acwr-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;

        .acwr-label {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.8rem;
        }

        .acwr-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
      }

      .acwr-recommendation {
        font-size: 0.9rem;
        color: var(--text-color-secondary);
      }
    }

    :host ::ng-deep .training-tabs {
      margin-bottom: 2rem;
    }

    .weekly-schedule {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .day-card {
      padding: 1rem;
      border-radius: 8px;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);

      &.session-training {
        border-left: 4px solid var(--primary-color);
      }

      &.session-game {
        border-left: 4px solid var(--orange-500);
        background: var(--orange-50);
      }

      &.session-recovery {
        border-left: 4px solid var(--green-500);
        background: var(--green-50);
      }

      &.session-rest {
        border-left: 4px solid var(--gray-400);
        background: var(--surface-100);
      }

      .day-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;

        .day-name {
          font-weight: 600;
        }
      }

      .day-content {
        font-size: 0.85rem;
        color: var(--text-color-secondary);

        > div {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;

          i {
            font-size: 0.8rem;
          }
        }

        .day-notes {
          margin-top: 0.5rem;
          font-style: italic;
        }
      }
    }

    .weekly-totals {
      background: var(--surface-50);
      padding: 1.5rem;
      border-radius: 8px;

      h4 {
        margin-bottom: 1rem;
        font-size: 1rem;
      }

      .totals-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        text-align: center;

        .total-item {
          .total-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color);
          }

          .total-label {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
          }
        }
      }
    }

    .sprint-protocols {
      .sprint-header {
        margin-bottom: 1.5rem;

        h3 {
          margin-bottom: 0.5rem;
        }

        p {
          color: var(--text-color-secondary);
        }
      }

      .sprint-features {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.5rem;

        .feature {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          background: var(--surface-100);
          color: var(--text-color-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &.active {
            background: var(--green-100);
            color: var(--green-700);
          }

          i {
            font-size: 0.8rem;
          }
        }
      }

      h4 {
        margin: 1rem 0 0.5rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        color: var(--text-color-secondary);
      }

      .protocols-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        &.avoid :host ::ng-deep .protocol-chip {
          background: var(--red-100);
          color: var(--red-700);
        }
      }
    }

    :host ::ng-deep .protocol-chip {
      background: var(--primary-100);
      color: var(--primary-700);
    }

    .sprint-tips {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--surface-50);
      border-radius: 8px;

      h4 {
        margin-bottom: 1rem;
        font-size: 1.1rem;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--surface-200);

          &:last-child {
            border-bottom: none;
          }
        }
      }
    }

    .annual-timeline {
      padding: 2rem 0;
      overflow-x: auto;
    }

    :host ::ng-deep .phase-timeline {
      .p-timeline-event-content {
        text-align: center;
      }
    }

    .timeline-marker {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      i {
        font-size: 1rem;
      }
    }

    .timeline-content {
      .timeline-month {
        display: block;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .timeline-phase {
        display: block;
        font-size: 0.8rem;
        color: var(--text-color-secondary);
      }
    }

    .phase-detail {
      p {
        margin-bottom: 1rem;
        line-height: 1.6;
      }

      .phase-metrics {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;

        .metric {
          text-align: center;
          padding: 1rem;
          background: var(--surface-50);
          border-radius: 8px;

          .metric-label {
            display: block;
            font-size: 0.8rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.25rem;
          }

          .metric-value {
            display: block;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--primary-color);
            text-transform: capitalize;
          }
        }
      }

      h5 {
        margin-bottom: 0.5rem;
      }

      ul {
        margin: 0;
        padding-left: 1.5rem;

        li {
          margin-bottom: 0.25rem;
        }
      }
    }

    .evidence-section {
      .evidence-intro {
        margin-bottom: 1.5rem;
        color: var(--text-color-secondary);
        line-height: 1.6;
      }

      .research-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      .research-card {
        padding: 1.5rem;
        background: var(--surface-50);
        border-radius: 8px;
        border: 1px solid var(--surface-200);

        .research-header {
          font-size: 0.9rem;
          color: var(--text-color-secondary);
          margin-bottom: 0.5rem;
        }

        .research-title {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .research-journal {
          display: block;
          font-size: 0.85rem;
          font-style: italic;
          color: var(--text-color-secondary);
          margin-bottom: 1rem;
        }

        .research-finding,
        .research-application {
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          line-height: 1.5;

          strong {
            color: var(--primary-color);
          }
        }
      }
    }

    :host ::ng-deep .adjustments-card {
      margin-bottom: 1.5rem;

      .adjustments-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--surface-200);
          font-size: 1rem;

          &:last-child {
            border-bottom: none;
          }
        }
      }
    }

    .warnings-section {
      .warning-item {
        padding: 1rem;
        background: var(--yellow-50);
        border: 1px solid var(--yellow-200);
        border-radius: 8px;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;

        i {
          color: var(--yellow-600);
          font-size: 1.2rem;
        }
      }
    }

    @media (max-width: 768px) {
      .periodization-dashboard {
        padding: 1rem;
      }

      .weekly-schedule {
        grid-template-columns: 1fr;
      }

      .weekly-totals .totals-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .phase-detail .phase-metrics {
        grid-template-columns: repeat(2, 1fr);
      }

      .research-cards {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class PeriodizationDashboardComponent implements OnInit {
  // Services
  private periodizationService = inject(FlagFootballPeriodizationService);
  private sprintService = inject(SprintTrainingKnowledgeService);
  private loadCalculator = inject(PhaseLoadCalculatorService);
  private athleteProfileService = inject(FlagFootballAthleteProfileService);

  // State
  readonly currentDate = new Date();

  // Signals from services
  readonly currentPhase = signal<PhaseConfig | null>(null);
  readonly currentWeek = signal<number>(1);
  readonly weeklyTemplate = signal<WeeklyTrainingTemplate | null>(null);
  readonly seasonalRecommendation = signal<SeasonalRecommendation | null>(null);
  readonly loadRecommendation = signal<LoadRecommendation | null>(null);
  readonly acwrStatus = signal<ACWRCalculation | null>(null);
  readonly sprintGuidelines = signal<SprintPhaseGuidelines | null>(null);
  readonly sprintRecommendations = signal<string[]>([]);
  readonly evidenceReferences = signal<any[]>([]);
  readonly allPhases = signal<PhaseConfig[]>([]);
  readonly annualTimeline = signal<TimelineEvent[]>([]);

  ngOnInit(): void {
    this.loadPeriodizationData();
  }

  private loadPeriodizationData(): void {
    // Get seasonal recommendation
    const recommendation = this.periodizationService.getSeasonalRecommendation(this.currentDate);
    this.seasonalRecommendation.set(recommendation);
    this.currentPhase.set(recommendation.currentPhase);
    this.currentWeek.set(recommendation.currentWeek);
    this.weeklyTemplate.set(recommendation.weeklyTemplate);

    // Get load recommendation
    const phaseType = recommendation.currentPhase.type;
    const loadRec = this.loadCalculator.calculatePhaseLoad(
      phaseType,
      2000, // Default chronic load - would come from athlete data
      recommendation.currentWeek
    );
    this.loadRecommendation.set(loadRec);

    // Get ACWR (mock data for demo)
    const acwr = this.loadCalculator.calculateACWR([
      { sessionRPE: 7, duration: 60, load: 420, type: "strength", date: new Date() },
      { sessionRPE: 8, duration: 45, load: 360, type: "speed", date: new Date() },
    ]);
    this.acwrStatus.set(acwr);

    // Get sprint guidelines
    const sprintPhase = this.mapPhaseToSprintPhase(phaseType);
    const guidelines = this.sprintService.getPhaseGuidelines(sprintPhase);
    this.sprintGuidelines.set(guidelines || null);

    // Get sprint recommendations
    this.sprintRecommendations.set(this.sprintService.getFlagFootballSprintRecommendations());

    // Get evidence references
    this.evidenceReferences.set(this.periodizationService.getAllEvidenceReferences());

    // Get all phases
    this.allPhases.set(this.periodizationService.getAllPhases());

    // Generate timeline
    this.generateAnnualTimeline();
  }

  private mapPhaseToSprintPhase(phaseType: string): string {
    const mapping: Record<string, string> = {
      off_season_rest: "foundation",
      foundation: "foundation",
      strength_accumulation: "strength_accumulation",
      power_development: "power_development",
      speed_development: "speed_development",
      competition_prep: "competition",
      in_season_maintenance: "competition",
      mid_season_reload: "mid_season_reload",
      peak: "peak",
      taper: "peak",
      active_recovery: "foundation",
    };
    return mapping[phaseType] || "foundation";
  }

  private generateAnnualTimeline(): void {
    const timeline: TimelineEvent[] = [
      { phase: "Recovery", month: "Nov", icon: "pi pi-heart", color: "#9CA3AF", description: "Active recovery" },
      { phase: "Foundation", month: "Dec", icon: "pi pi-building", color: "#3B82F6", description: "Base building" },
      { phase: "Strength", month: "Jan", icon: "pi pi-bolt", color: "#8B5CF6", description: "Strength accumulation" },
      { phase: "Power", month: "Feb", icon: "pi pi-chart-line", color: "#EC4899", description: "Power development" },
      { phase: "Speed", month: "Mar", icon: "pi pi-forward", color: "#F59E0B", description: "Speed development" },
      { phase: "Competition", month: "Apr-Jun", icon: "pi pi-trophy", color: "#10B981", description: "Tournament season" },
      { phase: "Reload", month: "Jul", icon: "pi pi-refresh", color: "#6366F1", description: "Mid-season reload" },
      { phase: "Peak", month: "Aug", icon: "pi pi-star", color: "#EF4444", description: "Championship peak" },
      { phase: "Late Season", month: "Sep-Oct", icon: "pi pi-calendar", color: "#14B8A6", description: "Season finish" },
    ];
    this.annualTimeline.set(timeline);
  }

  getPhaseSeverity(): "success" | "info" | "warn" | "danger" | "secondary" {
    const phase = this.currentPhase();
    if (!phase) return "info";

    switch (phase.type) {
      case "peak":
      case "taper":
        return "danger";
      case "speed_development":
      case "power_development":
        return "warn";
      case "in_season_maintenance":
      case "mid_season_reload":
        return "success";
      default:
        return "info";
    }
  }

  getSessionSeverity(sessionType: string): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (sessionType) {
      case "game":
        return "warn";
      case "recovery":
        return "success";
      case "rest":
        return "secondary";
      default:
        return "info";
    }
  }

  getAcwrSeverity(): "success" | "info" | "warn" | "danger" {
    const status = this.acwrStatus();
    if (!status) return "info";

    switch (status.riskZone) {
      case "optimal":
        return "success";
      case "caution":
        return "warn";
      case "danger":
        return "danger";
      default:
        return "info";
    }
  }

  getLoadProgress(): number {
    const rec = this.loadRecommendation();
    if (!rec) return 50;
    // This would be actual load vs target
    return 65; // Demo value
  }

  formatFocus(focus: string): string {
    return focus
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatProtocol(protocol: string): string {
    return protocol
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
