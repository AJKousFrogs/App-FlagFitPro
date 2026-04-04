import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { UI_LIMITS } from "@core/constants";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TableComponent } from "../../../shared/components/table/table.component";
import { TabsComponent, AppTabPanelDirective } from "../../../shared/components/tabs/tabs.component";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import {
  SharedInsight,
  SharedInsightFeedService,
} from "../../../core/services/shared-insight-feed.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { StaffDashboardLoadStateComponent } from "../../../shared/components/staff-dashboard-load-state/staff-dashboard-load-state.component";
import { StaffInsightFeedCardComponent } from "../../../shared/components/staff-insight-feed-card/staff-insight-feed-card.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { PhysioHistorySectionComponent } from "./components/physio-history-section.component";
import { PhysioRiskSectionComponent } from "./components/physio-risk-section.component";
import { PhysioRtpSectionComponent } from "./components/physio-rtp-section.component";

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
  acwrRisk: "low" | "moderate" | "high" | "unknown";
  acwrValue: number | null; // null = no training data
  trainingLoadSpike: boolean;
  sleepDeficit: boolean;
  weightFluctuation: boolean;
  soreness: number | null; // null = no wellness data
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    PhysioHistorySectionComponent,
    PhysioRiskSectionComponent,
    PhysioRtpSectionComponent,
    SelectComponent,
    TableComponent,
    TabsComponent,
    AppTabPanelDirective,
    StatusTagComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
    StaffDashboardLoadStateComponent,
    StaffInsightFeedCardComponent,
  ],
  templateUrl: "./physiotherapist-dashboard.component.html",
  styleUrl: "./physiotherapist-dashboard.component.scss",
})
export class PhysiotherapistDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);
  protected insightFeedService = inject(SharedInsightFeedService);

  // Constants exposed to template
  protected readonly UI_LIMITS = UI_LIMITS;

  // State
  loading = signal(true);
  loadError = signal<string | null>(null);
  athletes = signal<AthletePhysioData[]>([]);
  riskIndicators = signal<RiskIndicators[]>([]);
  rtpData = signal<ReturnToPlayData[]>([]);
  injuryHistoryMap = signal<Map<string, InjuryHistory>>(new Map());
  sharedInsights = signal<SharedInsight[]>([]);

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
    this.loadInsights();
  }

  async loadInsights(): Promise<void> {
    await this.insightFeedService.loadInsights();
    this.sharedInsights.set(this.insightFeedService.filteredInsights());
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      // Load athletes with physio status from real API
      const response = await firstValueFrom(
        this.api.get<{
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
        }>("/api/staff-physiotherapist/athletes"),
      );
      const payload = extractApiPayload<{
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
      }>(response);

      if (payload?.athletes) {
        const athletes: AthletePhysioData[] = payload.athletes.map(
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
        const risks: RiskIndicators[] = payload.athletes.map((a) => ({
          athleteId: a.id,
          acwrRisk:
            a.riskLevel === "high"
              ? "high"
              : a.riskLevel === "medium"
                ? "moderate"
                : a.acwr === null || a.acwr === undefined
                  ? "unknown"
                  : "low",
          // CRITICAL: Do not use default for ACWR - null means no data
          acwrValue: a.acwr ?? null,
          trainingLoadSpike: a.acwr !== null && a.acwr > 1.4,
          sleepDeficit: false,
          weightFluctuation: false,
          soreness: null, // null = no data
          asymmetries: [],
        }));
        this.riskIndicators.set(risks);
      }

      // Load RTP athletes
      await this.loadRTPData();

      // Load injury history for each athlete
      await this.loadAllInjuryHistory();
    } catch (error) {
      this.logger.error("Failed to load physiotherapy data", error);
      this.loadError.set(
        "Unable to load physiotherapy data right now. Please try again.",
      );
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
      const response = await firstValueFrom(
        this.api.get<{
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
        }>("/api/staff-physiotherapist/rtp"),
      );
      const payload = extractApiPayload<{
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
      }>(response);

      if (payload?.athletes) {
        const rtpList: ReturnToPlayData[] = payload.athletes.map(
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
        const response = await firstValueFrom(
          this.api.get<{
            activeInjuries: Array<{ injury_type: string; injury_date: string }>;
            injuryHistory: Array<{ injury_type: string; injury_date: string }>;
          }>(`/api/staff-physiotherapist/athletes/${athlete.id}`),
        );
        const payload = extractApiPayload<{
          activeInjuries: Array<{ injury_type: string; injury_date: string }>;
          injuryHistory: Array<{ injury_type: string; injury_date: string }>;
        }>(response);

        if (payload) {
          const allInjuries = [...(payload.injuryHistory || [])];
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
  ): "success" | "warning" | "danger" | "secondary" {
    const risk = this.riskIndicators().find((r) => r.athleteId === id);
    if (!risk) return "secondary";
    const severityMap: Record<
      string,
      "success" | "warning" | "danger" | "secondary"
    > = {
      low: "success",
      moderate: "warning",
      high: "danger",
      unknown: "secondary",
    };
    return severityMap[risk.acwrRisk] ?? "secondary";
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
  ): "success" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warning" | "danger" | "secondary"
    > = {
      full: "success",
      limited: "warning",
      not_cleared: "danger",
    };
    return severities[status] || "secondary";
  }

  getInjurySeverity(
    severity: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      mild: "info",
      moderate: "warning",
      severe: "danger",
    };
    return severities[severity] || "secondary";
  }

  getRiskSeverity(
    risk: string,
  ): "success" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warning" | "danger" | "secondary"
    > = {
      low: "success",
      moderate: "warning",
      high: "danger",
    };
    return severities[risk] || "secondary";
  }

  getRtpStatusSeverity(
    status: string,
  ): "success" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warning" | "danger" | "secondary"
    > = {
      full_clearance: "success",
      limited_return: "warning",
      not_ready: "danger",
    };
    return severities[status] || "secondary";
  }

  getLatestPain(rtp: ReturnToPlayData): number {
    const painLevels = rtp.progressMetrics.painLevel;
    return painLevels[painLevels.length - 1] || 0;
  }

  getLatestPainView(rtp: { progressMetrics: { painLevel: number[] } }): number {
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

  handleRtpProgressUpdate(rtp: unknown): void {
    this.updateRtpProgress(rtp as ReturnToPlayData);
  }

  viewRtpReport(rtp: ReturnToPlayData): void {
    this.toast.info(
      `Viewing RTP report for ${this.getAthleteName(rtp.athleteId)}`,
    );
  }

  handleRtpReportView(rtp: unknown): void {
    this.viewRtpReport(rtp as ReturnToPlayData);
  }

  loadInjuryHistory(): void {
    if (this.selectedHistoryAthlete) {
      const history = this.injuryHistoryMap().get(this.selectedHistoryAthlete);
      this.currentInjuryHistory.set(history || null);
    }
  }

  onClearanceFilterChange(value: string | null): void {
    this.clearanceFilter = value;
  }

  onHistoryAthleteChange(value: string | null): void {
    this.selectedHistoryAthlete = value;
    this.loadInjuryHistory();
  }

  onReportTypeChange(value: string | null): void {
    this.selectedReportType = value ?? "recovery";
  }

  onReportAthleteChange(value: string | null): void {
    this.reportAthleteId = value;
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
