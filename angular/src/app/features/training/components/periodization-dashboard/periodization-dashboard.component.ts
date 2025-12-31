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
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { Chip } from "primeng/chip";
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
import { AcwrService } from "../../../../core/services/acwr.service";

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
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TooltipModule,
    ButtonModule,
    DividerModule,
    Chip,
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
      <p-tabs styleClass="training-tabs" [(value)]="activeTab">
        <p-tablist>
          <p-tab value="schedule">Weekly Schedule</p-tab>
          <p-tab value="sprint">Sprint Training</p-tab>
          <p-tab value="annual">Annual Plan</p-tab>
          <p-tab value="research">Research</p-tab>
        </p-tablist>
        <p-tabpanels>
          <!-- Weekly Schedule Tab -->
          <p-tabpanel value="schedule">
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
          </p-tabpanel>

          <!-- Sprint Protocols Tab -->
          <p-tabpanel value="sprint">
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
          </p-tabpanel>

          <!-- Annual Timeline Tab -->
          <p-tabpanel value="annual">
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
              <p-accordion-panel [value]="phase.type">
                <p-accordion-header>{{ phase.name }}</p-accordion-header>
                <p-accordion-content>
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
                </p-accordion-content>
              </p-accordion-panel>
            }
          </p-accordion>
          </p-tabpanel>

          <!-- Evidence Base Tab -->
          <p-tabpanel value="research">
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
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

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
  styleUrls: ["./periodization-dashboard.component.scss"],
})
export class PeriodizationDashboardComponent implements OnInit {
  // Services
  private periodizationService = inject(FlagFootballPeriodizationService);
  private sprintService = inject(SprintTrainingKnowledgeService);
  private loadCalculator = inject(PhaseLoadCalculatorService);
  private athleteProfileService = inject(FlagFootballAthleteProfileService);
  private acwrService = inject(AcwrService);

  // State
  readonly currentDate = new Date();
  activeTab = signal<string>('schedule');

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

    // Get ACWR from canonical AcwrService (single source of truth)
    const acwrData = this.acwrService.acwrData();
    if (acwrData.ratio > 0) {
      const acwr: ACWRCalculation = {
        acuteLoad: Math.round(acwrData.acute),
        chronicLoad: Math.round(acwrData.chronic),
        acwr: parseFloat(acwrData.ratio.toFixed(2)),
        riskZone: this.mapRiskZone(acwrData.riskZone.level),
        recommendation: acwrData.riskZone.recommendation,
      };
      this.acwrStatus.set(acwr);
    }

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
    // Colors reference --color-phase-* tokens from design-system-tokens.scss
    const timeline: TimelineEvent[] = [
      { phase: "Recovery", month: "Nov", icon: "pi pi-heart", color: "var(--color-phase-recovery)", description: "Active recovery" },
      { phase: "Foundation", month: "Dec", icon: "pi pi-building", color: "var(--color-phase-foundation)", description: "Base building" },
      { phase: "Strength", month: "Jan", icon: "pi pi-bolt", color: "var(--color-phase-strength)", description: "Strength accumulation" },
      { phase: "Power", month: "Feb", icon: "pi pi-chart-line", color: "var(--color-phase-power)", description: "Power development" },
      { phase: "Speed", month: "Mar", icon: "pi pi-forward", color: "var(--color-phase-speed)", description: "Speed development" },
      { phase: "Competition", month: "Apr-Jun", icon: "pi pi-trophy", color: "var(--color-phase-competition)", description: "Tournament season" },
      { phase: "Reload", month: "Jul", icon: "pi pi-refresh", color: "var(--color-phase-reload)", description: "Mid-season reload" },
      { phase: "Peak", month: "Aug", icon: "pi pi-star", color: "var(--color-phase-peak)", description: "Championship peak" },
      { phase: "Late Season", month: "Sep-Oct", icon: "pi pi-calendar", color: "var(--color-phase-late-season)", description: "Season finish" },
    ];
    this.annualTimeline.set(timeline);
  }

  /**
   * Map AcwrService risk zone level to ACWRCalculation riskZone format
   */
  private mapRiskZone(level: string): "optimal" | "caution" | "danger" {
    switch (level) {
      case "sweet-spot":
        return "optimal";
      case "elevated-risk":
        return "caution";
      case "danger-zone":
        return "danger";
      case "under-training":
        return "caution";
      default:
        return "optimal";
    }
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
