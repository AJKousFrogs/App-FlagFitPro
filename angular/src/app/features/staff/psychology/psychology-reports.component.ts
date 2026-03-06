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
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";

import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { SharedInsightFeedService } from "../../../core/services/shared-insight-feed.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { formatDate } from "../../../shared/utils/date.utils";

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

interface PsychologyReportForm {
  type: string;
  period: string;
  notes: string;
}

interface PreCompForm {
  name: string;
  significance: "regular" | "important" | "championship";
  readiness: number;
  concern: string;
}

@Component({
  selector: "app-psychology-reports",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Card,
    LazyChartComponent,
    Dialog,
    InputText,
    ProgressBar,
    Select,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    StatusTagComponent,
    Textarea,
    MainLayoutComponent,
    PageHeaderComponent,
    AlertComponent,
    ButtonComponent,
    IconButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./psychology-reports.component.html",

  styleUrl: "./psychology-reports.component.scss",
})
export class PsychologyReportsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);
  protected insightFeedService = inject(SharedInsightFeedService);

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

  readonly openGenerateDialogHandler = (): void =>
    this.showGenerateDialog.set(true);
  readonly openPreCompDialogHandler = (): void =>
    this.showPreCompDialog.set(true);

  // Form data
  newReport: PsychologyReportForm = {
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

  newPreComp: PreCompForm = {
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
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Stress",
          data: [5.5, 4.8, 5.2, data.wellnessTrends.avgStressLevel],
          borderColor: "var(--ds-primary-orange)",
          backgroundColor: "var(--ds-primary-orange-subtle)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Confidence",
          data: [7.0, 7.5, 7.2, data.wellnessTrends.avgConfidence],
          borderColor: "var(--color-chart-tertiary)",
          backgroundColor: "rgba(var(--primitive-info-500-rgb), 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadData();
    this.loadInsights();
  }

  async loadInsights(): Promise<void> {
    await this.insightFeedService.loadInsights();
  }

  loadWellnessData(): void {
    this.loadData();
  }

  updateSelectedPeriod(value: string | null | undefined): void {
    this.selectedPeriod = value ?? "30days";
    this.loadWellnessData();
  }

  updateNewReportType(value: string | null | undefined): void {
    this.newReport = { ...this.newReport, type: value ?? "weekly" };
  }

  updateNewReportPeriod(value: string | null | undefined): void {
    this.newReport = { ...this.newReport, period: value ?? "7days" };
  }

  updateNewReportNotes(value: string | null | undefined): void {
    this.newReport = { ...this.newReport, notes: value ?? "" };
  }

  updatePrivacySetting(
    field: keyof ReportPrivacySettings,
    value: boolean | null | undefined,
  ): void {
    this.privacySettings = {
      ...this.privacySettings,
      [field]: value ?? false,
    };
  }

  updateNewPreCompText(
    field: "name" | "concern",
    value: string | null | undefined,
  ): void {
    this.newPreComp = { ...this.newPreComp, [field]: value ?? "" };
  }

  updateNewPreCompSignificance(
    value: "regular" | "important" | "championship" | null | undefined,
  ): void {
    this.newPreComp = {
      ...this.newPreComp,
      significance: value ?? "regular",
    };
  }

  updateNewPreCompReadiness(value: string | number | null | undefined): void {
    const parsed = typeof value === "number" ? value : Number(value ?? 7);
    this.newPreComp = {
      ...this.newPreComp,
      readiness: Number.isFinite(parsed) ? parsed : 7,
    };
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
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
      this.logger.error("Failed to load psychology data", error);
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
  ): "success" | "warning" | "danger" | "info" | "secondary" {
    if (invertForStress) {
      return trend === "declining"
        ? "success"
        : trend === "improving"
          ? "warning"
          : "info";
    }
    return trend === "improving"
      ? "success"
      : trend === "declining"
        ? "warning"
        : "info";
  }

  getScreenTimeSeverity(
    level: string,
  ): "success" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "warning" | "danger" | "secondary"
    > = {
      low: "success",
      moderate: "warning",
      high: "danger",
    };
    return severities[level] || "secondary";
  }

  getSignificanceSeverity(
    significance: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      regular: "info",
      important: "warning",
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

  trackByPreCompReport(
    index: number,
    report: PreCompetitionReport,
  ): string {
    const c = report.competition;
    return `${c.name}-${c.date.getTime()}-${index}`;
  }

  trackByGeneratedReport(
    index: number,
    report: { type: string; generatedDate: Date; periodStart: Date },
  ): string {
    return `${report.type}-${report.generatedDate.getTime()}-${report.periodStart.getTime()}`;
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

  getRoleSeverity(role: string): "success" | "info" | "warning" | "danger" {
    const roleMap: Record<string, "success" | "info" | "warning" | "danger"> = {
      coach: "info",
      physiotherapist: "success",
      nutritionist: "warning",
      psychologist: "danger",
    };
    return roleMap[role] || "info";
  }

  getInsightTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      physio_note: "Physio Note",
      nutrition_compliance: "Nutrition Compliance",
      psychology_flag: "Psychology Flag",
      coach_note: "Coach Note",
    };
    return typeMap[type] || type;
  }

  getPrioritySeverity(
    priority: string,
  ): "success" | "info" | "warning" | "danger" {
    const priorityMap: Record<
      string,
      "success" | "info" | "warning" | "danger"
    > = {
      low: "info",
      medium: "warning",
      high: "danger",
    };
    return priorityMap[priority] || "info";
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date, "P");
  }

  getMetadataEntries(
    metadata: Record<string, unknown>,
  ): Array<{ key: string; value: string }> {
    return Object.entries(metadata).map(([key, value]) => ({
      key: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: String(value),
    }));
  }

  hasMetadata(metadata: Record<string, unknown>): boolean {
    return Object.keys(metadata).length > 0;
  }
}
