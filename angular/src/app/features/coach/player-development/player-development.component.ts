/**
 * Player Development Component (Coach View)
 *
 * Track individual player progress over time, set development goals,
 * compare against position benchmarks, and identify areas for improvement.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { DatePicker } from "primeng/datepicker";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  goalStatusSeverityMap,
} from "../../../shared/utils/status.utils";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

// ===== Interfaces =====
interface Player {
  id: string;
  name: string;
  position: string;
  overallProgress: number;
  goalsCompleted: number;
  goalsTotal: number;
  improvementThisMonth: number;
  focusArea: string;
  achievements: number;
}

interface DevelopmentGoal {
  id: string;
  playerId: string;
  category: "physical" | "skill" | "stats" | "compliance";
  metric: string;
  currentValue: string;
  targetValue: string;
  startValue: string;
  dueDate: string;
  progress: number;
  status: "on-track" | "ahead" | "behind" | "completed";
  notes?: string;
}

interface SkillAssessment {
  skill: string;
  score: number;
  grade: string;
}

interface CoachNote {
  id: string;
  date: string;
  coachName: string;
  content: string;
}

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
    CommonModule,
    LazyChartComponent,
    DatePicker,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    CardShellComponent,
    InputText,
    ProgressBar,
    Select,
    TableModule,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-main-layout>
<div class="player-development-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Player Development"
          subtitle="Track progress and set goals"
          icon="pi-chart-line"
        >
          <app-button
            variant="secondary"
            iconLeft="pi-download"
            (clicked)="exportReport()"
            >Export Report</app-button
          >
        </app-page-header>

        <!-- Player/Compare Selection -->
        <div class="selection-row">
          <div class="selection-field">
            <label for="player-select">Player</label>
            <p-select
              inputId="player-select"
              [options]="playerOptions()"
              (onChange)="onSelectedPlayerIdChange($event.value)"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
              class="w-full"
              [attr.aria-label]="'Select player'"
            ></p-select>
          </div>
          <div class="selection-field">
            <label for="compare-select">Compare To</label>
            <p-select
              inputId="compare-select"
              [options]="compareOptions"
              (onChange)="onCompareToValueChange($event.value)"
              optionLabel="label"
              optionValue="value"
              placeholder="Position Avg"
              class="w-full"
              [attr.aria-label]="'Select comparison baseline'"
            ></p-select>
          </div>
        </div>

        @if (selectedPlayer()) {
          <!-- Development Overview -->
          <div class="stats-summary">
            <div class="stat-card">
              <span class="stat-icon"><i class="pi pi-chart-bar" aria-hidden="true"></i></span>
              <div class="stat-content">
                <span class="stat-block__value"
                  >{{ selectedPlayer()?.overallProgress }}%</span
                >
                <span class="stat-block__label">Overall Progress</span>
                <span class="stat-sub">vs benchmarks</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon"><i class="pi pi-bullseye" aria-hidden="true"></i></span>
              <div class="stat-content">
                <span class="stat-block__value"
                  >{{ selectedPlayer()?.goalsCompleted }}/{{
                    selectedPlayer()?.goalsTotal
                  }}</span
                >
                <span class="stat-block__label">Goals Completed</span>
                <span class="stat-sub">Active goals</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon"><i class="pi pi-chart-line" aria-hidden="true"></i></span>
              <div class="stat-content">
                <span
                  class="stat-block__value"
                  [class.positive]="
                    (selectedPlayer()?.improvementThisMonth ?? 0) > 0
                  "
                >
                  {{
                    (selectedPlayer()?.improvementThisMonth ?? 0) > 0
                      ? "+"
                      : ""
                  }}{{ selectedPlayer()?.improvementThisMonth }}%
                </span>
                <span class="stat-block__label">Improvement</span>
                <span class="stat-sub">This month</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon"><i class="pi pi-trophy" aria-hidden="true"></i></span>
              <div class="stat-content">
                <span class="stat-block__value">{{
                  selectedPlayer()?.achievements
                }}</span>
                <span class="stat-block__label">Achievements</span>
                <span class="stat-sub">Unlocked</span>
              </div>
            </div>
          </div>

          <!-- Spider Chart Section -->
          <app-card-shell
            class="chart-card"
            title="Position Benchmark Spider Chart"
          >
            <div class="spider-chart-container">
              <app-lazy-chart
                type="radar"
                [data]="radarChartData()"
                [options]="radarChartOptions"
              ></app-lazy-chart>
            </div>
            <div class="chart-legend">
              <span class="legend-item"
                ><span class="legend-color player"></span>
                {{ selectedPlayer()?.name }} ({{
                  selectedPlayer()?.position
                }})</span
              >
              <span class="legend-item"
                ><span class="legend-color elite"></span> Elite
                {{ selectedPlayer()?.position }} Benchmark</span
              >
              <span class="legend-item"
                ><span class="legend-color avg"></span> Position Average</span
              >
            </div>
          </app-card-shell>

          <!-- Development Goals -->
          <app-card-shell class="goals-card" title="Development Goals">
            <app-button
              header-actions
              size="sm"
              iconLeft="pi-plus"
              (clicked)="openGoalDialog()"
              >Add Goal</app-button
            >

            @if (playerGoals().length > 0) {
              <div class="goals-list">
                @for (goal of playerGoals(); track goal.id) {
                  <div class="goal-item">
                    <div class="goal-header">
                      <div class="goal-title">
                        <span class="goal-icon">{{
                          getGoalIcon(goal.category)
                        }}</span>
                        <span
                          >{{ goal.metric }}: {{ goal.startValue }} →
                          {{ goal.targetValue }}</span
                        >
                      </div>
                      <span class="goal-due">Due: {{ goal.dueDate }}</span>
                    </div>
                    <div class="goal-progress">
                      <span class="progress-label">Progress:</span>
                      <p-progressBar
                        [value]="goal.progress"
                        [showValue]="false"
                        class="goal-progress-bar"
                      ></p-progressBar>
                      <span class="progress-value">{{ goal.progress }}%</span>
                    </div>
                    <div class="goal-status">
                      <span class="current-value"
                        >Current: {{ goal.currentValue }}</span
                      >
                      <app-status-tag
                        [value]="getStatusLabel(goal.status)"
                        [severity]="getStatusSeverity(goal.status)"
                        size="sm"
                      />
                    </div>
                    <div class="goal-actions">
                      <app-button
                        variant="secondary"
                        size="sm"
                        (clicked)="updateGoal(goal)"
                        >Update</app-button
                      >
                      <app-button
                        variant="text"
                        size="sm"
                        (clicked)="viewGoalDetails(goal)"
                        >Details</app-button
                      >
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-goals">
                <p>No development goals set for this player.</p>
                <app-button iconLeft="pi-plus" (clicked)="openGoalDialog()"
                  >Set First Goal</app-button
                >
              </div>
            }
          </app-card-shell>

          <!-- Performance History -->
          <app-card-shell class="history-card" title="Performance History">
            <div class="history-filters">
              <p-select
                inputId="metric-filter"
                [options]="physicalMetrics"
                (onChange)="onSelectedMetricChange($event.value)"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Metric"
                [attr.aria-label]="'Select performance metric'"
              ></p-select>
              <p-select
                inputId="period-filter"
                [options]="periodOptions"
                (onChange)="onSelectedPeriodChange($event.value)"
                optionLabel="label"
                optionValue="value"
                placeholder="Period"
                [attr.aria-label]="'Select time period'"
              ></p-select>
            </div>
            <div class="history-chart">
              <app-lazy-chart
                type="line"
                [data]="lineChartData()"
                [options]="lineChartOptions"
              ></app-lazy-chart>
            </div>
            <div class="history-stats">
              <span><strong>Best:</strong> {{ historyStats().best }}</span>
              <span><strong>Avg:</strong> {{ historyStats().avg }}</span>
              <span><strong>Trend:</strong> {{ historyStats().trend }}</span>
            </div>
          </app-card-shell>

          <!-- Skill Assessments -->
          <app-card-shell
            class="assessments-card"
            [title]="selectedPlayer()?.position + '-Specific Skills'"
          >
            <div header-actions class="assessment-actions">
              <span class="last-assessment">Last Assessment: Dec 28, 2025</span>
              <app-button
                variant="secondary"
                size="sm"
                (clicked)="newAssessment()"
                >New Assessment</app-button
              >
            </div>
            <div class="skills-list">
              @for (skill of skillAssessments(); track skill.skill) {
                <div class="skill-row">
                  <span class="skill-name">{{ skill.skill }}</span>
                  <div class="skill-bar">
                    <p-progressBar
                      [value]="skill.score"
                      [showValue]="false"
                      height="var(--space-4)"
                    ></p-progressBar>
                  </div>
                  <span class="skill-score">{{ skill.score }}%</span>
                  <app-status-tag
                    [value]="skill.grade"
                    [severity]="getGradeSeverity(skill.grade)"
                    size="sm"
                  />
                </div>
              }
            </div>
            <div class="overall-grade">
              <strong>Overall Position Grade:</strong> B+ (78/100)
            </div>
          </app-card-shell>

          <!-- Coach Notes -->
          <app-card-shell class="notes-card" title="Coach Development Notes">
            <app-button
              header-actions
              size="sm"
              iconLeft="pi-plus"
              (clicked)="openNoteDialog()"
              >Add Note</app-button
            >
            <div class="notes-list">
              @for (note of coachNotes(); track note.id) {
                <div class="note-item">
                  <div class="note-header">
                    <span class="note-date">{{ note.date }}</span>
                    <span class="note-author">{{ note.coachName }}</span>
                  </div>
                  <p class="note-content">{{ note.content }}</p>
                </div>
              }
            </div>
          </app-card-shell>
        } @else {
          <app-empty-state
            [useCard]="true"
            icon="pi-users"
            heading="Select a Player"
            description="Choose a player to view their development progress"
          />
        }
      </div>

      <!-- Add Goal Dialog -->
      <app-dialog
        [(visible)]="showGoalDialog"
        [modal]="true"
        styleClass="development-goal-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Add development goal"
      >
        <app-dialog-header
          icon="bullseye"
          title="Add Development Goal"
          subtitle="Set a measurable development target for the selected athlete."
          (close)="showGoalDialog = false"
        />
        <div class="goal-form">
          <div class="form-field">
            <label for="goal-player-select">Player</label>
            <p-select
              inputId="goal-player-select"
              [options]="playerOptions()"
              (onChange)="onGoalPlayerIdChange($event.value)"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
              class="w-full"
              [attr.aria-label]="'Select player for goal'"
            ></p-select>
          </div>

          <div class="form-field">
            <label>Goal Category</label>
            <div class="radio-group">
              @for (cat of goalCategories; track cat.value) {
                <div class="radio-option">
                  <input
                    type="radio"
                    name="category"
                    [value]="cat.value"
                    [id]="'cat-' + cat.value"
                    [checked]="goalForm.category === cat.value"
                    (change)="onGoalCategoryOptionChange(cat.value)"
                  />
                  <label [for]="'cat-' + cat.value">{{ cat.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="goal-metric-select">Metric</label>
              <p-select
                inputId="goal-metric-select"
                [options]="physicalMetrics"
                (onChange)="onGoalMetricChange($event.value)"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Metric"
                class="w-full"
                [attr.aria-label]="'Select goal metric'"
              ></p-select>
            </div>
            <div class="form-field">
              <label>Current Value</label>
              <input
                type="text"
                pInputText
                [value]="goalForm.currentValue"
                (input)="onGoalCurrentValueChange(getInputValue($event))"
                placeholder="e.g., 4.52s"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Target Value</label>
              <input
                type="text"
                pInputText
                [value]="goalForm.targetValue"
                (input)="onGoalTargetValueChange(getInputValue($event))"
                placeholder="e.g., 4.45s"
              />
            </div>
            <div class="form-field">
              <label for="goal-due-date">Target Date</label>
              <p-datepicker
                inputId="goal-due-date"
                (onSelect)="onGoalDueDateChange($event)"
                [showIcon]="true"
                class="w-full"
                [attr.aria-label]="'Select target date for goal'"
              ></p-datepicker>
            </div>
          </div>

          <div class="form-field">
            <label>Notes (optional)</label>
            <textarea
              pTextarea
              [value]="goalForm.notes"
              (input)="onGoalNotesChange(getInputValue($event))"
              rows="3"
              placeholder="Additional notes..."
            ></textarea>
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Create Goal"
          primaryIcon="check"
          (cancel)="showGoalDialog = false"
          (primary)="createGoal()"
        />
      </app-dialog>

      <!-- Add Note Dialog -->
      <app-dialog
        [(visible)]="showNoteDialog"
        [modal]="true"
        styleClass="development-note-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Add development note"
      >
        <app-dialog-header
          icon="file-edit"
          title="Add Development Note"
          subtitle="Capture progress context, coaching observations, or follow-up actions."
          (close)="showNoteDialog = false"
        />
        <div class="note-form">
          <div class="form-field">
            <label>Note</label>
            <textarea
              pTextarea
              [value]="noteContent"
              (input)="onNoteContentChange(getInputValue($event))"
              rows="5"
              placeholder="Enter your development notes..."
            ></textarea>
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Save Note"
          primaryIcon="check"
          (cancel)="showNoteDialog = false"
          (primary)="saveNote()"
        />
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./player-development.component.scss",
})
export class PlayerDevelopmentComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly players = signal<Player[]>([]);
  readonly goals = signal<DevelopmentGoal[]>([]);
  readonly assessments = signal<SkillAssessment[]>([]);
  readonly notes = signal<CoachNote[]>([]);
  readonly performanceHistory = signal<PerformanceRecord[]>([]);
  readonly isLoading = signal(true);

  // Selection
  selectedPlayerId: string | null = null;
  compareToValue = "position-avg";
  selectedMetric = "40-yard";
  selectedPeriod = "6-months";

  // Dialog state
  showGoalDialog = false;
  showNoteDialog = false;
  noteContent = "";

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

  readonly skillAssessments = computed(() => this.assessments());

  readonly coachNotes = computed(() => this.notes());

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
    this.loadData();
  }

  onSelectedPlayerIdChange(value: string | null): void {
    this.selectedPlayerId = value;
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

    try {
      const response: ApiResponse<{
        players?: Player[];
        goals?: DevelopmentGoal[];
      }> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.coach.playerDevelopment),
      );
      if (response?.success && response.data) {
        this.players.set(response.data.players || []);
        this.goals.set(response.data.goals || []);
      }
    } catch (err) {
      this.logger.error("Failed to load player development data", err);
      // No data available - show empty state
    } finally {
      this.isLoading.set(false);
    }
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

  onGoalPlayerIdChange(value: string | null): void {
    this.goalForm = { ...this.goalForm, playerId: value ?? "" };
  }

  onGoalCategoryChange(value: "physical" | "skill" | "stats" | "compliance"): void {
    this.goalForm = { ...this.goalForm, category: value };
  }

  onGoalCategoryOptionChange(value: string): void {
    this.onGoalCategoryChange(
      value as "physical" | "skill" | "stats" | "compliance",
    );
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

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  onPlayerChange(): void {
    // Would reload data for selected player
  }

  onMetricChange(): void {
    // Would reload performance history for selected metric/period
  }

  openGoalDialog(): void {
    this.goalForm = this.getEmptyGoalForm();
    this.goalForm.playerId = this.selectedPlayerId || "";
    this.showGoalDialog = true;
  }

  createGoal(): void {
    this.toastService.success(
      "Development goal has been created",
      "Goal Created",
    );
    this.showGoalDialog = false;
  }

  updateGoal(goal: DevelopmentGoal): void {
    this.toastService.info(
      `Opening update dialog for ${goal.metric}`,
      "Update Goal",
    );
  }

  viewGoalDetails(goal: DevelopmentGoal): void {
    this.toastService.info(
      `Viewing details for ${goal.metric}`,
      "Goal Details",
    );
  }

  openNoteDialog(): void {
    this.noteContent = "";
    this.showNoteDialog = true;
  }

  saveNote(): void {
    if (!this.noteContent.trim()) return;
    this.toastService.success(
      "Development note has been added",
      "Note Saved",
    );
    this.showNoteDialog = false;
  }

  newAssessment(): void {
    this.toastService.info("Opening assessment form", "New Assessment");
  }

  exportReport(): void {
    this.toastService.success(
      "Development report is being generated",
      "Export Started",
    );
  }

  // Helpers
  getGoalIcon(category: string): string {
    const icons: Record<string, string> = {
      physical: "🏃",
      skill: "⚡",
      stats: "📊",
      compliance: "✅",
    };
    return icons[category] || "🎯";
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
}
