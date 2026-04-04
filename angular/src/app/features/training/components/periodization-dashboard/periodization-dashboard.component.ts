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

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
// PrimeNG
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";

// Services
import {
  FlagFootballPeriodizationService,
  PhaseConfig,
  SeasonalRecommendation,
  WeeklyTrainingTemplate,
  EvidenceReference,
} from "../../../../core/services/flag-football-periodization.service";
import {
  SprintTrainingKnowledgeService,
  SprintPhaseGuidelines,
} from "../../../../core/services/sprint-training-knowledge.service";
import {
  PhaseLoadCalculatorService,
  LoadRecommendation,
  ACWRCalculation,
} from "../../../../core/services/phase-load-calculator.service";
import { FlagFootballAthleteProfileService } from "../../../../core/services/flag-football-athlete-profile.service";
import { AcwrService } from "../../../../core/services/acwr.service";

// Layout Components
import { MainLayoutComponent } from "../../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../../shared/components/page-header/page-header.component";
import { AlertComponent } from "../../../../shared/components/alert/alert.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { PeriodizationAnnualTabComponent } from "./periodization-annual-tab.component";
import { PeriodizationOverviewCardComponent } from "./periodization-overview-card.component";
import { PeriodizationResearchTabComponent } from "./periodization-research-tab.component";
import { PeriodizationScheduleTabComponent } from "./periodization-schedule-tab.component";
import { PeriodizationSprintTabComponent } from "./periodization-sprint-tab.component";

interface TimelineEvent {
  phase: string;
  month: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: "app-periodization-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    MainLayoutComponent,
    PageHeaderComponent,
    AlertComponent,
    CardShellComponent,
    PeriodizationOverviewCardComponent,
    PeriodizationScheduleTabComponent,
    PeriodizationSprintTabComponent,
    PeriodizationAnnualTabComponent,
    PeriodizationResearchTabComponent,
  ],
  template: `
    <app-main-layout>
      <div class="periodization-dashboard-page ui-page-stack">
        <!-- Page Header -->
        <app-page-header
          title="Training Periodization"
          subtitle="Evidence-based annual training plan for flag football athletes"
          icon="pi-calendar"
        >
        </app-page-header>

        <div class="periodization-dashboard ui-page-stack">
          @defer (on idle) {
            <app-periodization-overview-card
              [currentPhase]="currentPhase()"
              [currentWeek]="currentWeek()"
              [currentDate]="currentDate"
              [loadRecommendation]="loadRecommendation()"
              [acwrStatus]="acwrStatus()"
            />
          }

          <!-- Tabs for different views -->
          <p-tabs class="training-tabs" [(value)]="activeTab">
            <p-tablist>
              <p-tab value="schedule">Weekly Schedule</p-tab>
              <p-tab value="sprint">Sprint Training</p-tab>
              <p-tab value="annual">Annual Plan</p-tab>
              <p-tab value="research">Research</p-tab>
            </p-tablist>
            <p-tabpanels>
              <!-- Weekly Schedule Tab -->
              <p-tabpanel value="schedule">
                @defer (when activeTab() === 'schedule') {
                  <app-periodization-schedule-tab
                    [template]="weeklyTemplate()"
                  />
                }
              </p-tabpanel>

              <!-- Sprint Protocols Tab -->
              <p-tabpanel value="sprint">
                @defer (when activeTab() === 'sprint') {
                  <app-periodization-sprint-tab
                    [guidelines]="sprintGuidelines()"
                    [recommendedProtocols]="formattedRecommendedProtocols()"
                    [avoidProtocols]="formattedAvoidProtocols()"
                    [tips]="sprintRecommendations()"
                  />
                }
              </p-tabpanel>

              <!-- Annual Timeline Tab -->
              <p-tabpanel value="annual">
                @defer (when activeTab() === 'annual') {
                  <app-periodization-annual-tab
                    [timeline]="annualTimeline()"
                    [phases]="allPhases()"
                  />
                }
              </p-tabpanel>

              <!-- Evidence Base Tab -->
              <p-tabpanel value="research">
                @defer (when activeTab() === 'research') {
                  <app-periodization-research-tab
                    [references]="evidenceReferences()"
                  />
                }
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>

          <!-- Personalized Adjustments -->
          @if (seasonalRecommendation()?.personalizedAdjustments?.length) {
            <app-card-shell
              title="Personalized Recommendations"
              class="adjustments-card"
            >
              <ul class="adjustments-list">
                @for (
                  adjustment of seasonalRecommendation()
                    ?.personalizedAdjustments || [];
                  track adjustment
                ) {
                  <li>{{ adjustment }}</li>
                }
              </ul>
            </app-card-shell>
          }

          <!-- Warnings -->
          @if (loadRecommendation()?.warnings?.length) {
            <div class="warnings-section">
              @for (
                warning of loadRecommendation()?.warnings || [];
                track warning
              ) {
                <app-alert
                  variant="warning"
                  density="compact"
                  [message]="warning"
                />
              }
            </div>
          }
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./periodization-dashboard.component.scss",
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
  activeTab = signal<string>("schedule");

  // Signals from services
  readonly currentPhase = signal<PhaseConfig | null>(null);
  readonly currentWeek = signal<number>(1);
  readonly weeklyTemplate = signal<WeeklyTrainingTemplate | null>(null);
  readonly seasonalRecommendation = signal<SeasonalRecommendation | null>(null);
  readonly loadRecommendation = signal<LoadRecommendation | null>(null);
  readonly acwrStatus = signal<ACWRCalculation | null>(null);
  readonly sprintGuidelines = signal<SprintPhaseGuidelines | null>(null);
  readonly sprintRecommendations = signal<string[]>([]);
  readonly evidenceReferences = signal<EvidenceReference[]>([]);
  readonly allPhases = signal<PhaseConfig[]>([]);
  readonly annualTimeline = signal<TimelineEvent[]>([]);
  readonly formattedRecommendedProtocols = signal<string[]>([]);
  readonly formattedAvoidProtocols = signal<string[]>([]);

  ngOnInit(): void {
    this.loadPeriodizationData();
  }

  private loadPeriodizationData(): void {
    // Get seasonal recommendation
    const recommendation = this.periodizationService.getSeasonalRecommendation(
      this.currentDate,
    );
    this.seasonalRecommendation.set(recommendation);
    this.currentPhase.set(recommendation.currentPhase);
    this.currentWeek.set(recommendation.currentWeek);
    this.weeklyTemplate.set(recommendation.weeklyTemplate);

    // Get load recommendation
    const phaseType = recommendation.currentPhase.type;
    const loadRec = this.loadCalculator.calculatePhaseLoad(
      phaseType,
      2000, // Default chronic load - would come from athlete data
      recommendation.currentWeek,
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
    this.formattedRecommendedProtocols.set(
      (guidelines?.recommendedProtocols || []).map((protocol) =>
        this.formatProtocol(protocol),
      ),
    );
    this.formattedAvoidProtocols.set(
      (guidelines?.avoidProtocols || []).map((protocol) =>
        this.formatProtocol(protocol),
      ),
    );

    // Get sprint recommendations
    this.sprintRecommendations.set(
      this.sprintService.getFlagFootballSprintRecommendations(),
    );

    // Get evidence references
    this.evidenceReferences.set(
      this.periodizationService.getAllEvidenceReferences(),
    );

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
      {
        phase: "Recovery",
        month: "Nov",
        icon: "pi pi-heart",
        color: "var(--color-phase-recovery)",
        description: "Active recovery",
      },
      {
        phase: "Foundation",
        month: "Dec",
        icon: "pi pi-building",
        color: "var(--color-phase-foundation)",
        description: "Base building",
      },
      {
        phase: "Strength",
        month: "Jan",
        icon: "pi pi-bolt",
        color: "var(--color-phase-strength)",
        description: "Strength accumulation",
      },
      {
        phase: "Power",
        month: "Feb",
        icon: "pi pi-chart-line",
        color: "var(--color-phase-power)",
        description: "Power development",
      },
      {
        phase: "Speed",
        month: "Mar",
        icon: "pi pi-forward",
        color: "var(--color-phase-speed)",
        description: "Speed development",
      },
      {
        phase: "Competition",
        month: "Apr-Jun",
        icon: "pi pi-trophy",
        color: "var(--color-phase-competition)",
        description: "Tournament season",
      },
      {
        phase: "Reload",
        month: "Jul",
        icon: "pi pi-refresh",
        color: "var(--color-phase-reload)",
        description: "Mid-season reload",
      },
      {
        phase: "Peak",
        month: "Aug",
        icon: "pi pi-star",
        color: "var(--color-phase-peak)",
        description: "Championship peak",
      },
      {
        phase: "Late Season",
        month: "Sep-Oct",
        icon: "pi pi-calendar",
        color: "var(--color-phase-late-season)",
        description: "Season finish",
      },
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

  getSessionSeverity(
    sessionType: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (sessionType) {
      case "game":
        return "warning";
      case "recovery":
        return "success";
      case "rest":
        return "secondary";
      default:
        return "info";
    }
  }

  formatProtocol(protocol: string): string {
    return protocol.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
