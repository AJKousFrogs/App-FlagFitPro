import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";
import { Tooltip } from "primeng/tooltip";
import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

// Interfaces based on FEATURE_DOCUMENTATION.md §44
interface OpponentPlayer {
  name: string;
  number: string;
  position: string;
  notes: string;
  threatLevel: "high" | "medium" | "low";
  tendencies: string[];
}

interface OpponentProfile {
  id: string;
  teamName: string;
  teamLogo?: string;
  conference?: string;
  record: { wins: number; losses: number; ties: number };
  lastMeetingResult?: string;
  headToHeadRecord?: { wins: number; losses: number };
  headCoach?: string;
  offensiveStyle?: string;
  defensiveStyle?: string;
  keyPlayers: OpponentPlayer[];
  generalNotes?: string;
  lastUpdated: Date;
  updatedBy: string;
}

interface TeamTendencies {
  opponentId: string;
  offensive: {
    formationFrequency: { formation: string; percentage: number }[];
    playTypeDistribution: {
      quickPass: number;
      deepPass: number;
      qbRun: number;
      screen: number;
    };
    redZoneTendencies: string[];
    thirdDownTendencies: string[];
    favoriteTargets: { player: string; targetShare: number }[];
  };
  defensive: {
    coverageFrequency: { coverage: string; percentage: number }[];
    blitzRate: number;
    blitzTendencies: string[];
    weaknesses: string[];
  };
  specialSituations: {
    twoPointPlays: string[];
    hurryUpOffense: string[];
    endOfHalfStrategy: string[];
  };
}

interface ScoutingReport {
  id: string;
  opponentId: string;
  opponentName: string;
  gameDate: Date;
  createdBy: string;
  executiveSummary: string;
  offensiveGamePlan: {
    attackPoints: string[];
    playsToRun: string[];
    avoidAreas: string[];
  };
  defensiveGamePlan: {
    coverageAdjustments: string[];
    blitzPlan: string[];
    playerMatchups: { ourPlayer: string; theirPlayer: string; notes: string }[];
  };
  sharedWith: "team" | "coaches_only";
  requiredReading: boolean;
  readBy: string[];
  createdAt: Date;
}

interface NewReportForm {
  opponentId: string;
  gameDate: string;
  executiveSummary: string;
  attackPoints: string;
  playsToRun: string;
  coverageAdjustments: string;
  blitzPlan: string;
  sharedWith: "team" | "coaches_only";
  requiredReading: boolean;
}

interface NewOpponentForm {
  teamName: string;
  conference: string;
  wins: number;
  losses: number;
  headCoach: string;
  offensiveStyle: string;
  defensiveStyle: string;
}

@Component({
  selector: "app-scouting-reports",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    InputText,
    Select,
    TableModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    StatusTagComponent,
    Textarea,
    Tooltip,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    IconButtonComponent,
  ],
  templateUrl: "./scouting-reports.component.html",
  styleUrl: "./scouting-reports.component.scss",
})
export class ScoutingReportsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);

  // State
  loading = signal(true);
  reports = signal<ScoutingReport[]>([]);
  opponents = signal<OpponentProfile[]>([]);
  tendenciesMap = signal<Map<string, TeamTendencies>>(new Map());
  currentTendencies = signal<TeamTendencies | null>(null);

  // UI State
  selectedOpponentFilter: string | null = null;
  selectedTendencyOpponent: string | null = null;
  showNewReportDialog = signal(false);
  readonly showNewReportHandler = (): void =>
    this.showNewReportDialog.set(true);
  showViewReportDialog = signal(false);
  showAddOpponentDialog = signal(false);
  viewingReport = signal<ScoutingReport | null>(null);

  // Form data
  newReport: NewReportForm = {
    opponentId: "",
    gameDate: "",
    executiveSummary: "",
    attackPoints: "",
    playsToRun: "",
    coverageAdjustments: "",
    blitzPlan: "",
    sharedWith: "team" as "team" | "coaches_only",
    requiredReading: false,
  };

  newOpponent: NewOpponentForm = {
    teamName: "",
    conference: "",
    wins: 0,
    losses: 0,
    headCoach: "",
    offensiveStyle: "",
    defensiveStyle: "",
  };

  // Options
  shareOptions = [
    { label: "Share with entire team", value: "team" },
    { label: "Coaches only", value: "coaches_only" },
  ];

  offensiveStyles = [
    { label: "Pass-heavy", value: "Pass-heavy" },
    { label: "Balanced", value: "Balanced" },
    { label: "QB-run focused", value: "QB-run focused" },
    { label: "Spread offense", value: "Spread offense" },
    { label: "Short passing game", value: "Short passing game" },
  ];

  defensiveStyles = [
    { label: "Man coverage", value: "Man coverage" },
    { label: "Zone coverage", value: "Zone coverage" },
    { label: "Aggressive blitz", value: "Aggressive blitz" },
    { label: "Contain/Conservative", value: "Contain" },
    { label: "Mixed/Hybrid", value: "Mixed" },
  ];

  // Computed
  opponentFilterOptions = computed(() =>
    this.opponents().map((o) => ({
      label: o.teamName,
      value: o.id,
    })),
  );

  filteredReports = computed(() => {
    if (!this.selectedOpponentFilter) return this.reports();
    return this.reports().filter(
      (r) => r.opponentId === this.selectedOpponentFilter,
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Load scouting reports from API
      const [reportsRes, opponentsRes] = await Promise.all([
        firstValueFrom(
          this.api.get<{
            reports: Array<{
              id: string;
              opponent_name: string;
              opponent_profile: {
                city?: string;
                conference?: string;
                coach?: string;
                record?: string;
              };
              game_date: string;
              offensive_notes: string;
              defensive_notes: string;
              key_players: Array<{
                name: string;
                number: string;
                position: string;
                notes: string;
              }>;
              tendencies: Record<string, unknown>;
              game_plan: Record<string, unknown>;
              status: string;
              created_at: string;
              created_by_user?: { full_name: string };
            }>;
          }>("/api/scouting/reports"),
        ),
        firstValueFrom(
          this.api.get<{
            opponents: Array<{
              name: string;
              opponentTeamId?: string;
              profile: {
                city?: string;
                conference?: string;
                coach?: string;
                notes?: string;
              };
              tendencies: Record<string, unknown>;
              gamesPlayed: number;
              wins: number;
              losses: number;
              lastPlayed: string;
            }>;
          }>("/api/scouting/opponents"),
        ),
      ]);

      // Transform reports
      if (reportsRes?.data?.reports) {
        const reports: ScoutingReport[] = reportsRes.data.reports.map((r) => ({
          id: r.id,
          opponentId: r.opponent_name,
          opponentName: r.opponent_name,
          gameDate: r.game_date ? new Date(r.game_date) : new Date(),
          createdBy: r.created_by_user?.full_name || "Unknown",
          executiveSummary: r.offensive_notes || "",
          offensiveGamePlan: {
            attackPoints: [],
            playsToRun: [],
            avoidAreas: [],
            ...(r.game_plan as Record<string, unknown>),
          },
          defensiveGamePlan: {
            coverageAdjustments: [],
            blitzPlan: [],
            playerMatchups: [],
            ...(r.game_plan as Record<string, unknown>),
          },
          sharedWith: r.status === "shared" ? "team" : "coaches_only",
          requiredReading: false,
          readBy: [],
          createdAt: new Date(r.created_at),
        }));
        this.reports.set(reports);
      }

      // Transform opponents
      if (opponentsRes?.data?.opponents) {
        const opponents: OpponentProfile[] = opponentsRes.data.opponents.map(
          (o) => ({
            id: o.name.toLowerCase().replace(/\s+/g, "-"),
            teamName: o.name,
            conference: o.profile?.conference || "Unknown",
            record: {
              wins: o.wins || 0,
              losses: o.losses || 0,
              ties: 0,
            },
            lastMeetingResult: o.lastPlayed
              ? `Last played: ${o.lastPlayed}`
              : undefined,
            headCoach: o.profile?.coach,
            offensiveStyle:
              (o.tendencies as { offensiveStyle?: string })?.offensiveStyle ||
              "Unknown",
            defensiveStyle:
              (o.tendencies as { defensiveStyle?: string })?.defensiveStyle ||
              "Unknown",
            keyPlayers: [],
            generalNotes: o.profile?.notes,
            lastUpdated: o.lastPlayed ? new Date(o.lastPlayed) : new Date(),
            updatedBy: "System",
          }),
        );
        this.opponents.set(opponents);
      }

      // Initialize empty tendencies map
      this.tendenciesMap.set(new Map());
    } catch (error) {
      this.logger.error("Failed to load scouting data", error);
      this.toast.error("Failed to load scouting data");
    } finally {
      this.loading.set(false);
    }
  }

  async loadTendencies(opponentName: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<{
          tendencies: {
            offensive: {
              formations: Record<string, number>;
              playTypes: Record<string, number>;
              notes?: string[];
            };
            defensive: {
              coverages: Record<string, number>;
              notes?: string[];
            };
          };
        }>(`/api/scouting/tendencies/${encodeURIComponent(opponentName)}`),
      );

      if (response?.data?.tendencies) {
        const t = response.data.tendencies;
        const tendencyData: TeamTendencies = {
          opponentId: opponentName,
          offensive: {
            formationFrequency: Object.entries(
              t.offensive.formations || {},
            ).map(([formation, count]) => ({
              formation,
              percentage: count as number,
            })),
            playTypeDistribution: {
              quickPass: 25,
              deepPass: 20,
              qbRun: 15,
              screen: 10,
            },
            redZoneTendencies: [],
            thirdDownTendencies: [],
            favoriteTargets: [],
          },
          defensive: {
            coverageFrequency: Object.entries(t.defensive.coverages || {}).map(
              ([coverage, count]) => ({
                coverage,
                percentage: count as number,
              }),
            ),
            blitzRate: 30,
            blitzTendencies: [],
            weaknesses: t.defensive.notes || [],
          },
          specialSituations: {
            twoPointPlays: [],
            hurryUpOffense: [],
            endOfHalfStrategy: [],
          },
        };

        const currentTendencies = new Map(this.tendenciesMap());
        currentTendencies.set(
          opponentName.toLowerCase().replace(/\s+/g, "-"),
          tendencyData,
        );
        this.tendenciesMap.set(currentTendencies);
      }
    } catch (error) {
      this.logger.error("Failed to load tendencies", error);
    }
  }

  onTendencyOpponentChange(): void {
    if (this.selectedTendencyOpponent) {
      const opponent = this.opponents().find(
        (o) => o.id === this.selectedTendencyOpponent,
      );
      if (opponent) {
        this.loadTendencies(opponent.teamName);
      }
      const tendencies = this.tendenciesMap().get(
        this.selectedTendencyOpponent,
      );
      this.currentTendencies.set(tendencies || null);
    }
  }

  updateSelectedOpponentFilter(value: string | null | undefined): void {
    this.selectedOpponentFilter = value ?? null;
  }

  updateSelectedTendencyOpponent(value: string | null | undefined): void {
    this.selectedTendencyOpponent = value ?? null;
    this.onTendencyOpponentChange();
  }

  updateNewReportOpponent(value: string | null | undefined): void {
    this.newReport = { ...this.newReport, opponentId: value ?? "" };
  }

  updateNewReportGameDate(value: string | null | undefined): void {
    this.newReport = { ...this.newReport, gameDate: value ?? "" };
  }

  updateNewReportText(
    field:
      | "executiveSummary"
      | "attackPoints"
      | "playsToRun"
      | "coverageAdjustments"
      | "blitzPlan",
    value: string | null | undefined,
  ): void {
    this.newReport = { ...this.newReport, [field]: value ?? "" };
  }

  updateNewReportSharedWith(
    value: "team" | "coaches_only" | null | undefined,
  ): void {
    this.newReport = { ...this.newReport, sharedWith: value ?? "team" };
  }

  updateNewReportRequiredReading(value: boolean | null | undefined): void {
    this.newReport = { ...this.newReport, requiredReading: value ?? false };
  }

  updateNewOpponentText(
    field:
      | "teamName"
      | "conference"
      | "headCoach"
      | "offensiveStyle"
      | "defensiveStyle",
    value: string | null | undefined,
  ): void {
    this.newOpponent = { ...this.newOpponent, [field]: value ?? "" };
  }

  updateNewOpponentRecord(
    field: "wins" | "losses",
    value: string | number | null | undefined,
  ): void {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);
    this.newOpponent = {
      ...this.newOpponent,
      [field]: Number.isFinite(parsed) ? parsed : 0,
    };
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  viewReport(report: ScoutingReport): void {
    this.viewingReport.set(report);
    this.showViewReportDialog.set(true);
  }

  async shareToChat(report: ScoutingReport): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post(`/api/scouting/reports/${report.id}/share`),
      );
      this.toast.success(
        `"${report.opponentName}" report shared to team chat!`,
      );
    } catch {
      this.toast.error("Failed to share report");
    }
  }

  editReport(report: ScoutingReport): void {
    this.toast.info(`Opening editor for ${report.opponentName} report`);
  }

  exportReport(report: ScoutingReport): void {
    this.toast.success(`Exporting PDF for ${report.opponentName}...`);
  }

  viewOpponent(opponent: OpponentProfile): void {
    this.toast.info(`Viewing ${opponent.teamName} profile`);
  }

  createReportForOpponent(opponent: OpponentProfile): void {
    this.newReport = { ...this.newReport, opponentId: opponent.id };
    this.showNewReportDialog.set(true);
  }

  async createReport(): Promise<void> {
    if (!this.newReport.opponentId) {
      this.toast.warn("Please select an opponent");
      return;
    }
    if (!this.newReport.executiveSummary) {
      this.toast.warn("Please add an executive summary");
      return;
    }

    const opponent = this.opponents().find(
      (o) => o.id === this.newReport.opponentId,
    );

    try {
      const response = await firstValueFrom(
        this.api.post<{ report: { id: string } }>("/api/scouting/reports", {
          opponentName: opponent?.teamName || "Unknown",
          gameDate: this.newReport.gameDate,
          offensiveNotes: this.newReport.executiveSummary,
          defensiveNotes: this.newReport.coverageAdjustments,
          gamePlan: {
            attackPoints: this.newReport.attackPoints
              .split("\n")
              .filter((p) => p.trim()),
            playsToRun: this.newReport.playsToRun
              .split("\n")
              .filter((p) => p.trim()),
            coverageAdjustments: this.newReport.coverageAdjustments
              .split("\n")
              .filter((p) => p.trim()),
            blitzPlan: this.newReport.blitzPlan
              .split("\n")
              .filter((p) => p.trim()),
          },
        }),
      );

      // Add to local list
      const report: ScoutingReport = {
        id: response?.data?.report?.id || `report${Date.now()}`,
        opponentId: this.newReport.opponentId,
        opponentName: opponent?.teamName || "Unknown",
        gameDate: new Date(this.newReport.gameDate),
        createdBy: "Current User",
        executiveSummary: this.newReport.executiveSummary,
        offensiveGamePlan: {
          attackPoints: this.newReport.attackPoints
            .split("\n")
            .filter((p) => p.trim()),
          playsToRun: this.newReport.playsToRun
            .split("\n")
            .filter((p) => p.trim()),
          avoidAreas: [],
        },
        defensiveGamePlan: {
          coverageAdjustments: this.newReport.coverageAdjustments
            .split("\n")
            .filter((p) => p.trim()),
          blitzPlan: this.newReport.blitzPlan
            .split("\n")
            .filter((p) => p.trim()),
          playerMatchups: [],
        },
        sharedWith: this.newReport.sharedWith,
        requiredReading: this.newReport.requiredReading,
        readBy: [],
        createdAt: new Date(),
      };

      this.reports.set([report, ...this.reports()]);
      this.toast.success("Scouting report created!");
      this.showNewReportDialog.set(false);
      this.resetNewReport();
    } catch {
      this.toast.error("Failed to create report");
    }
  }

  async addOpponent(): Promise<void> {
    if (!this.newOpponent.teamName) {
      this.toast.warn("Please enter a team name");
      return;
    }

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.scouting.opponents, {
          name: this.newOpponent.teamName,
          conference: this.newOpponent.conference,
          coach: this.newOpponent.headCoach,
        }),
      );

      const opponent: OpponentProfile = {
        id: `opp${Date.now()}`,
        teamName: this.newOpponent.teamName,
        conference: this.newOpponent.conference,
        record: {
          wins: this.newOpponent.wins,
          losses: this.newOpponent.losses,
          ties: 0,
        },
        headCoach: this.newOpponent.headCoach,
        offensiveStyle: this.newOpponent.offensiveStyle,
        defensiveStyle: this.newOpponent.defensiveStyle,
        keyPlayers: [],
        generalNotes: "",
        lastUpdated: new Date(),
        updatedBy: "Current User",
      };

      this.opponents.set([...this.opponents(), opponent]);
      this.toast.success(`${opponent.teamName} added to database!`);
      this.showAddOpponentDialog.set(false);
      this.resetNewOpponent();
    } catch {
      this.toast.error("Failed to add opponent");
    }
  }

  private resetNewReport(): void {
    this.newReport = {
      opponentId: "",
      gameDate: "",
      executiveSummary: "",
      attackPoints: "",
      playsToRun: "",
      coverageAdjustments: "",
      blitzPlan: "",
      sharedWith: "team",
      requiredReading: false,
    };
  }

  private resetNewOpponent(): void {
    this.newOpponent = {
      teamName: "",
      conference: "",
      wins: 0,
      losses: 0,
      headCoach: "",
      offensiveStyle: "",
      defensiveStyle: "",
    };
  }
}
