/**
 * Player Development Component (Coach View)
 *
 * Track individual player progress over time, set development goals,
 * compare against position benchmarks, and identify areas for improvement.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { ProgressBar } from "primeng/progressbar";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  goalStatusSeverityMap,
} from "../../../shared/utils/status.utils";
import { DatePickerComponent } from "../../../shared/components/date-picker/date-picker.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import {
  CoachDevelopmentGoal,
  CoachDevelopmentNote,
  CoachDevelopmentPlayer,
  CoachPlayerDevelopmentDataService,
  CoachSkillAssessment,
} from "../services/coach-player-development-data.service";

// ===== Local interfaces =====

interface PerformanceRecord {
  date: string;
  value: number;
}

// ===== Constants =====
const GOAL_CATEGORIES = [
  { label: "Physical Performance", value: "physical" },
  { label: "Position Skill", value: "skill" },
  { label: "Game Statistics", value: "stats" },
  { label: "Training Compliance", value: "compliance" },
];

const PHYSICAL_METRICS = [
  { label: "40-Yard Dash", value: "40-yard" },
  { label: "Pro Agility", value: "pro-agility" },
  { label: "Vertical Jump", value: "vertical" },
  { label: "Relative Squat", value: "squat" },
  { label: "Broad Jump", value: "broad-jump" },
];

const COMPARE_OPTIONS = [
  { label: "Position Average", value: "position-avg" },
  { label: "Elite Benchmark", value: "elite" },
  { label: "Team Average", value: "team-avg" },
];

@Component({
  selector: "app-player-development",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LazyChartComponent,
    DatePickerComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    CardShellComponent,
    FormInputComponent,
    ProgressBar,
    SelectComponent,
    TableModule,
    StatusTagComponent,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
  ],
  templateUrl: "./player-development.component.html",
  styleUrl: "./player-development.component.scss",
})
export class PlayerDevelopmentComponent implements OnInit {
  private readonly playerDevelopmentDataService = inject(
    CoachPlayerDevelopmentDataService,
  );
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  // State
  readonly players = signal<CoachDevelopmentPlayer[]>([]);
  readonly goals = signal<CoachDevelopmentGoal[]>([]);
  readonly assessments = signal<CoachSkillAssessment[]>([]);
  readonly notes = signal<CoachDevelopmentNote[]>([]);
  readonly performanceHistory = signal<PerformanceRecord[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Selection
  selectedPlayerId: string | null = null;
  compareToValue = "position-avg";
  selectedMetric = "40-yard";
  selectedPeriod = "6-months";

  // Dialog state
  showGoalDialog = false;
  showNoteDialog = false;
  showGoalDetailsDialog = false;
  showAssessmentDialog = false;
  noteContent = "";
  assessmentSkill = "";
  assessmentScore = "75";
  goalDialogMode: "create" | "edit" = "create";
  readonly selectedGoal = signal<CoachDevelopmentGoal | null>(null);

  // Form
  goalForm = this.getEmptyGoalForm();

  // Options
  readonly compareOptions = COMPARE_OPTIONS;
  readonly goalCategories = GOAL_CATEGORIES;
  readonly physicalMetrics = PHYSICAL_METRICS;
  readonly periodOptions = [
    { label: "Last 3 Months", value: "3-months" },
    { label: "Last 6 Months", value: "6-months" },
    { label: "Last Year", value: "year" },
  ];

  // Computed
  readonly playerOptions = computed(() =>
    this.players().map((p) => ({
      id: p.id,
      name: `${p.name} (${p.position})`,
    })),
  );

  readonly selectedPlayer = computed(
    () => this.players().find((p) => p.id === this.selectedPlayerId) || null,
  );

  readonly playerGoals = computed(() =>
    this.goals().filter((g) => g.playerId === this.selectedPlayerId),
  );

  readonly skillAssessments = computed(() =>
    this.assessments().filter(
      (assessment) => assessment.playerId === this.selectedPlayerId,
    ),
  );

  readonly coachNotes = computed(() =>
    this.notes().filter((note) => note.playerId === this.selectedPlayerId),
  );

  readonly radarChartData = computed(() => ({
    labels: [
      "Speed",
      "Agility",
      "Strength",
      "Explosiveness",
      "Technique",
      "Endurance",
    ],
    datasets: [
      {
        label: this.selectedPlayer()?.name || "Player",
        data: [85, 78, 70, 82, 88, 75],
        fill: true,
        backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.2)",
        borderColor: "var(--ds-primary-green)",
        pointBackgroundColor: "var(--ds-primary-green)",
      },
      {
        label: "Elite Benchmark",
        data: [95, 92, 90, 93, 95, 90],
        fill: true,
        backgroundColor: "rgba(var(--primitive-info-500-rgb), 0.1)",
        borderColor: "var(--color-chart-tertiary)",
        pointBackgroundColor: "var(--color-chart-tertiary)",
      },
      {
        label: "Position Avg",
        data: [75, 72, 68, 74, 76, 70],
        fill: true,
        backgroundColor: "var(--surface-tertiary)",
        borderColor: "var(--color-icon-preferences)",
        pointBackgroundColor: "var(--color-icon-preferences)",
      },
    ],
  }));

  readonly radarChartOptions = {
    scales: {
      r: {
        angleLines: { color: "var(--color-border-subtle)" },
        grid: { color: "var(--color-border-subtle)" },
        pointLabels: { font: { size: 12 } },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  readonly lineChartData = computed(() => ({
    labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    datasets: [
      {
        label: this.selectedMetric,
        data: this.performanceHistory().map((r) => r.value),
        fill: false,
        borderColor: "var(--ds-primary-green)",
        tension: 0.4,
      },
      {
        label: "Target",
        data: [4.45, 4.45, 4.45, 4.45, 4.45, 4.45],
        fill: false,
        borderColor: "var(--color-chart-quinary)",
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0,
      },
    ],
  }));

  readonly lineChartOptions = {
    scales: {
      y: {
        reverse: true,
        title: { display: true, text: "Time (s)" },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  readonly historyStats = computed(() => ({
    best: "4.48s (Jan 2)",
    avg: "4.52s",
    trend: "▼ -0.10s improvement",
  }));

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParamMap) => {
        this.syncSelectionFromRoute(queryParamMap);
      });

    this.loadData();
  }

  onSelectedPlayerIdChange(value: string | null): void {
    this.selectedPlayerId = value;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { player: value || null },
      queryParamsHandling: "merge",
    });
    this.onPlayerChange();
  }

  onCompareToValueChange(value: string | null): void {
    this.compareToValue = value ?? "position-avg";
  }

  onSelectedMetricChange(value: string | null): void {
    this.selectedMetric = value ?? "40-yard";
    this.onMetricChange();
  }

  onSelectedPeriodChange(value: string | null): void {
    this.selectedPeriod = value ?? "6-months";
    this.onMetricChange();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const { players, goals, notes, assessments, error } =
        await this.playerDevelopmentDataService.loadPlayerDevelopment();

      if (error) {
        throw error;
      }

      this.players.set(players);
      this.goals.set(goals);
      this.notes.set(notes);
      this.assessments.set(assessments);
      this.syncSelectionFromRoute(this.route.snapshot.queryParamMap);
    } catch (err) {
      this.logger.error("Failed to load player development data", err);
      this.players.set([]);
      this.goals.set([]);
      this.notes.set([]);
      this.assessments.set([]);
      this.loadError.set(
        "We couldn't load player development data. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadData(): void {
    void this.loadData();
  }

  private syncSelectionFromRoute(queryParamMap: ParamMap): void {
    const playerId = queryParamMap.get("player");
    if (!playerId) {
      return;
    }

    const matchingPlayer = this.players().find((player) => player.id === playerId);
    if (!matchingPlayer || this.selectedPlayerId === matchingPlayer.id) {
      return;
    }

    this.selectedPlayerId = matchingPlayer.id;
    this.onPlayerChange();
  }

  private getEmptyGoalForm() {
    return {
      playerId: "",
      category: "physical" as "physical" | "skill" | "stats" | "compliance",
      metric: "",
      currentValue: "",
      targetValue: "",
      dueDate: null as Date | null,
      notes: "",
    };
  }

  private resetGoalDialogState(): void {
    this.goalDialogMode = "create";
    this.selectedGoal.set(null);
    this.goalForm = this.getEmptyGoalForm();
    this.goalForm.playerId = this.selectedPlayerId || "";
  }

  closeGoalDialog(): void {
    this.showGoalDialog = false;
    this.resetGoalDialogState();
  }

  closeGoalDetailsDialog(): void {
    this.showGoalDetailsDialog = false;
  }

  closeNoteDialog(): void {
    this.showNoteDialog = false;
    this.noteContent = "";
  }

  closeAssessmentDialog(): void {
    this.showAssessmentDialog = false;
    this.assessmentSkill = "";
    this.assessmentScore = "75";
  }

  onGoalPlayerIdChange(value: string | null): void {
    this.goalForm = { ...this.goalForm, playerId: value ?? "" };
  }

  onGoalCategoryChange(value: "physical" | "skill" | "stats" | "compliance"): void {
    this.goalForm = { ...this.goalForm, category: value };
  }

  onGoalCategoryOptionChange(value: string): void {
    if (
      value === "physical" ||
      value === "skill" ||
      value === "stats" ||
      value === "compliance"
    ) {
      this.onGoalCategoryChange(value);
    }
  }

  onGoalMetricChange(value: string | null): void {
    this.goalForm = { ...this.goalForm, metric: value ?? "" };
  }

  onGoalCurrentValueChange(value: string): void {
    this.goalForm = { ...this.goalForm, currentValue: value };
  }

  onGoalTargetValueChange(value: string): void {
    this.goalForm = { ...this.goalForm, targetValue: value };
  }

  onGoalDueDateChange(value: Date | null): void {
    this.goalForm = { ...this.goalForm, dueDate: value };
  }

  onGoalNotesChange(value: string): void {
    this.goalForm = { ...this.goalForm, notes: value };
  }

  onNoteContentChange(value: string): void {
    this.noteContent = value;
  }

  onAssessmentSkillChange(value: string): void {
    this.assessmentSkill = value;
  }

  onAssessmentScoreChange(value: string): void {
    this.assessmentScore = value;
  }

  onPlayerChange(): void {
    // Would reload data for selected player
  }

  onMetricChange(): void {
    // Would reload performance history for selected metric/period
  }

  openGoalDialog(): void {
    this.resetGoalDialogState();
    this.showGoalDialog = true;
  }

  async createGoal(): Promise<void> {
    const playerId = this.goalForm.playerId || this.selectedPlayerId;
    if (!playerId || !this.goalForm.metric || !this.goalForm.targetValue) return;

    const activeGoal = this.selectedGoal();
    const { error } = await this.playerDevelopmentDataService.saveGoal({
      id: this.goalDialogMode === "edit" ? activeGoal?.id : undefined,
      playerId,
      category: this.goalForm.category,
      metric: this.goalForm.metric,
      currentValue: this.goalForm.currentValue || activeGoal?.currentValue || "",
      targetValue: this.goalForm.targetValue,
      startValue: activeGoal?.startValue || this.goalForm.currentValue || "",
      dueDate: this.toIsoDate(this.goalForm.dueDate),
      progress: activeGoal?.progress ?? 0,
      status: activeGoal?.status ?? "on-track",
      notes: this.goalForm.notes,
    });

    if (error) {
      this.logger.error("Failed to save development goal", error);
      this.toastService.error(
        "We couldn't save this development goal.",
        "Save Failed",
      );
      return;
    }

    await this.loadData();
    this.toastService.success(
      this.goalDialogMode === "edit"
        ? "Development goal has been updated"
        : "Development goal has been created",
      this.goalDialogMode === "edit" ? "Goal Updated" : "Goal Created",
    );

    this.closeGoalDialog();
  }

  updateGoal(goal: CoachDevelopmentGoal): void {
    this.goalDialogMode = "edit";
    this.selectedGoal.set(goal);
    this.goalForm = {
      playerId: goal.playerId,
      category: goal.category,
      metric: goal.metric,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      dueDate: this.parseGoalDueDate(goal.dueDate),
      notes: goal.notes || "",
    };
    this.closeGoalDetailsDialog();
    this.showGoalDialog = true;
  }

  viewGoalDetails(goal: CoachDevelopmentGoal): void {
    this.selectedGoal.set(goal);
    this.showGoalDetailsDialog = true;
  }

  openNoteDialog(): void {
    this.closeNoteDialog();
    this.showNoteDialog = true;
  }

  async saveNote(): Promise<void> {
    const content = this.noteContent.trim();
    if (!content) return;

    const playerId = this.selectedPlayerId;
    if (!playerId) {
      this.toastService.warn("Select a player before saving a note.");
      return;
    }

    const { data, error } = await this.playerDevelopmentDataService.saveNote({
      playerId,
      content,
    });

    if (error || !data) {
      this.logger.error("Failed to save development note", error);
      this.toastService.error("We couldn't save this note.", "Save Failed");
      return;
    }

    this.notes.update((notes) => [data, ...notes]);
    this.toastService.success(
      "Development note has been added",
      "Note Saved",
    );
    this.closeNoteDialog();
  }

  newAssessment(): void {
    this.closeAssessmentDialog();
    this.showAssessmentDialog = true;
  }

  exportReport(): void {
    const player = this.selectedPlayer();
    if (!player) {
      this.toastService.warn("Select a player before exporting a report.");
      return;
    }

    const lines = [
      `Player Development Report: ${player.name}`,
      `Position: ${player.position}`,
      `Overall Progress: ${player.overallProgress}%`,
      `Goals Completed: ${player.goalsCompleted}/${player.goalsTotal}`,
      `Improvement This Month: ${player.improvementThisMonth}%`,
      `Focus Area: ${player.focusArea}`,
      "",
      "Goals",
      ...this.playerGoals().map(
        (goal) =>
          `- ${goal.metric}: ${goal.currentValue} -> ${goal.targetValue} (${goal.progress}%, ${this.getStatusLabel(goal.status)})`,
      ),
      "",
      "Skill Assessments",
      ...this.skillAssessments().map(
        (assessment) =>
          `- ${assessment.skill}: ${assessment.score}% (${assessment.grade})`,
      ),
      "",
      "Coach Notes",
      ...this.coachNotes().map(
        (note) => `- ${note.date} ${note.coachName}: ${note.content}`,
      ),
    ];
    this.downloadTextFile(
      `${player.name.toLowerCase().replace(/\s+/g, "-")}-development-report.txt`,
      lines.join("\n"),
    );
    this.toastService.success("Development report downloaded.", "Export Ready");
  }

  async saveAssessment(): Promise<void> {
    const skill = this.assessmentSkill.trim();
    const score = Number(this.assessmentScore);
    if (!skill) {
      this.toastService.warn("Enter a skill before saving the assessment.");
      return;
    }
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      this.toastService.warn("Assessment score must be between 0 and 100.");
      return;
    }

    const playerId = this.selectedPlayerId;
    if (!playerId) {
      this.toastService.warn("Select a player before saving an assessment.");
      return;
    }

    const nextAssessment: CoachSkillAssessment = {
      playerId,
      skill,
      score,
      grade: this.getAssessmentGrade(score),
    };
    const { data, error } =
      await this.playerDevelopmentDataService.saveAssessment(nextAssessment);

    if (error || !data) {
      this.logger.error("Failed to save assessment", error);
      this.toastService.error(
        "We couldn't save this assessment.",
        "Save Failed",
      );
      return;
    }

    this.assessments.update((assessments) => {
      const existingIndex = assessments.findIndex(
        (assessment) =>
          assessment.playerId === playerId &&
          assessment.skill.toLowerCase() === skill.toLowerCase(),
      );
      if (existingIndex === -1) {
        return [...assessments, data].sort((a, b) =>
          a.skill.localeCompare(b.skill),
        );
      }

      return assessments.map((assessment, index) =>
        index === existingIndex ? data : assessment,
      );
    });
    await this.loadData();
    this.closeAssessmentDialog();
    this.toastService.success("Assessment saved.", "Assessment Updated");
  }

  private toIsoDate(value: Date | null): string | null {
    if (!value || Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString().slice(0, 10);
  }

  // Helpers
  getGoalIcon(category: string): string {
    const icons: Record<string, string> = {
      physical: "pi-forward",
      skill: "pi-bolt",
      stats: "pi-chart-bar",
      compliance: "pi-check",
    };
    return icons[category] || "pi-bullseye";
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      "on-track": "On Track",
      ahead: "Ahead of Schedule",
      behind: "Needs Focus",
      completed: "Completed",
    };
    return labels[status] || status;
  }

  private getAssessmentGrade(score: number): string {
    if (score >= 90) return "A";
    if (score >= 80) return "B+";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "Needs Work";
  }

  private downloadTextFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    return getMappedStatusSeverity(status, goalStatusSeverityMap, "secondary");
  }

  getGradeSeverity(
    grade: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary" | "contrast"
    > = {
      Elite: "success",
      Excellent: "success",
      Good: "info",
      Developing: "warning",
      "Needs Work": "danger",
    };
    return severities[grade] || "secondary";
  }

  editSelectedGoal(): void {
    const goal = this.selectedGoal();
    if (!goal) return;
    this.updateGoal(goal);
  }

  getPlayerName(playerId: string): string {
    return this.players().find((player) => player.id === playerId)?.name || "Unknown player";
  }

  getGoalCategoryLabel(category: CoachDevelopmentGoal["category"]): string {
    return this.goalCategories.find((option) => option.value === category)?.label || category;
  }

  private formatGoalDueDate(value: Date | null): string {
    if (!value) return "";
    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  private parseGoalDueDate(value: string): Date | null {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
