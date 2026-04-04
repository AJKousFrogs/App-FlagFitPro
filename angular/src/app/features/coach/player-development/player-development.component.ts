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
import { CoachPlayerDevelopmentDataService } from "../services/coach-player-development-data.service";

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
  playerId: string;
  skill: string;
  score: number;
  grade: string;
}

interface CoachNote {
  id: string;
  playerId: string;
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
            <app-select
              label="Player"
              [options]="playerOptions()"
              (valueChange)="onSelectedPlayerIdChange($event)"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
            />
          </div>
          <div class="selection-field">
            <app-select
              label="Compare To"
              [options]="compareOptions"
              (valueChange)="onCompareToValueChange($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Position Avg"
            />
          </div>
        </div>

        @if (isLoading()) {
          <app-loading message="Loading player development..." />
        } @else if (loadError()) {
          <app-page-error-state
            title="Unable to load player development"
            [message]="loadError()!"
            (retry)="retryLoadData()"
          />
        } @else if (selectedPlayer()) {
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
              <app-select
                [options]="physicalMetrics"
                (valueChange)="onSelectedMetricChange($event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Metric"
              />
              <app-select
                [options]="periodOptions"
                (valueChange)="onSelectedPeriodChange($event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Period"
              />
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
        dialogSize="lg"
        [blockScroll]="true"
        [draggable]="false"
        ariaLabel="Add development goal"
      >
        <app-dialog-header
          icon="bullseye"
          [title]="goalDialogMode === 'edit' ? 'Update Development Goal' : 'Add Development Goal'"
          [subtitle]="
            goalDialogMode === 'edit'
              ? 'Adjust progress, target values, or notes for the selected athlete.'
              : 'Set a measurable development target for the selected athlete.'
          "
          (close)="closeGoalDialog()"
        />
        <div class="goal-form">
          <div class="form-field">
            <app-select
              label="Player"
              [options]="playerOptions()"
              (valueChange)="onGoalPlayerIdChange($event)"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
            />
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
              <app-select
                label="Metric"
                [options]="physicalMetrics"
                (valueChange)="onGoalMetricChange($event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Metric"
              />
            </div>
            <div class="form-field">
              <app-form-input
                label="Current Value"
                [value]="goalForm.currentValue"
                (valueChange)="onGoalCurrentValueChange($event)"
                placeholder="e.g., 4.52s"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <app-form-input
                label="Target Value"
                [value]="goalForm.targetValue"
                (valueChange)="onGoalTargetValueChange($event)"
                placeholder="e.g., 4.45s"
              />
            </div>
            <div class="form-field">
              <app-date-picker
                label="Target Date"
                (select)="onGoalDueDateChange($event)"
              />
            </div>
          </div>

          <div class="form-field">
            <app-textarea
              label="Notes (optional)"
              [value]="goalForm.notes"
              (valueChange)="onGoalNotesChange($event)"
              [rows]="3"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          [primaryLabel]="goalDialogMode === 'edit' ? 'Save Goal' : 'Create Goal'"
          [primaryIcon]="goalDialogMode === 'edit' ? 'save' : 'check'"
          (cancel)="closeGoalDialog()"
          (primary)="createGoal()"
        />
      </app-dialog>

      <!-- Goal Details Dialog -->
      <app-dialog
        [(visible)]="showGoalDetailsDialog"
        [modal]="true"
        styleClass="development-goal-details-dialog"
        [blockScroll]="true"
        [draggable]="false"
        ariaLabel="Development goal details"
      >
        <app-dialog-header
          icon="bullseye"
          title="Goal Details"
          subtitle="Review progress, timing, and coaching notes for this development target."
          (close)="closeGoalDetailsDialog()"
        />
        @if (selectedGoal(); as goal) {
          <div class="goal-details">
            <div class="goal-detail-card">
              <span class="goal-detail-label">Player</span>
              <span class="goal-detail-value">{{ getPlayerName(goal.playerId) }}</span>
            </div>
            <div class="goal-detail-card">
              <span class="goal-detail-label">Category</span>
              <span class="goal-detail-value">{{ getGoalCategoryLabel(goal.category) }}</span>
            </div>
            <div class="goal-detail-card">
              <span class="goal-detail-label">Metric</span>
              <span class="goal-detail-value">{{ goal.metric }}</span>
            </div>
            <div class="goal-detail-card">
              <span class="goal-detail-label">Status</span>
              <span class="goal-detail-value">{{ getStatusLabel(goal.status) }}</span>
            </div>
            <div class="goal-detail-card">
              <span class="goal-detail-label">Start value</span>
              <span class="goal-detail-value">{{ goal.startValue }}</span>
            </div>
            <div class="goal-detail-card">
              <span class="goal-detail-label">Current value</span>
              <span class="goal-detail-value">{{ goal.currentValue }}</span>
            </div>
            <div class="goal-detail-card">
              <span class="goal-detail-label">Target value</span>
              <span class="goal-detail-value">{{ goal.targetValue }}</span>
            </div>
            <div class="goal-detail-card">
              <span class="goal-detail-label">Due date</span>
              <span class="goal-detail-value">{{ goal.dueDate }}</span>
            </div>
            <div class="goal-detail-card goal-detail-card--wide">
              <span class="goal-detail-label">Progress</span>
              <div class="goal-detail-progress">
                <p-progressBar
                  [value]="goal.progress"
                  [showValue]="false"
                  class="goal-progress-bar"
                ></p-progressBar>
                <span class="goal-detail-value">{{ goal.progress }}%</span>
              </div>
            </div>
            <div class="goal-detail-card goal-detail-card--wide">
              <span class="goal-detail-label">Coach notes</span>
              <span class="goal-detail-value">{{
                goal.notes?.trim() || "No notes added yet."
              }}</span>
            </div>
          </div>
        }

        <app-dialog-footer
          dialogFooter
          cancelLabel="Close"
          primaryLabel="Edit Goal"
          primaryIcon="pencil"
          (cancel)="closeGoalDetailsDialog()"
          (primary)="editSelectedGoal()"
        />
      </app-dialog>

      <!-- Add Note Dialog -->
      <app-dialog
        [(visible)]="showNoteDialog"
        [modal]="true"
        dialogSize="lg"
        styleClass="development-note-dialog"
        [blockScroll]="true"
        [draggable]="false"
        ariaLabel="Add development note"
      >
        <app-dialog-header
          icon="file-edit"
          title="Add Development Note"
          subtitle="Capture progress context, coaching observations, or follow-up actions."
          (close)="closeNoteDialog()"
        />
        <div class="note-form">
          <div class="form-field">
            <app-textarea
              label="Note"
              [value]="noteContent"
              (valueChange)="onNoteContentChange($event)"
              [rows]="5"
              placeholder="Enter your development notes..."
            />
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Save Note"
          primaryIcon="check"
          (cancel)="closeNoteDialog()"
          (primary)="saveNote()"
        />
      </app-dialog>

      <app-dialog
        [(visible)]="showAssessmentDialog"
        [modal]="true"
        styleClass="development-assessment-dialog"
        [blockScroll]="true"
        [draggable]="false"
        ariaLabel="Add skill assessment"
      >
        <app-dialog-header
          icon="chart-bar"
          title="Record Skill Assessment"
          subtitle="Add or update a player skill grade from the current review session."
          (close)="closeAssessmentDialog()"
        />
        <div class="note-form">
          <div class="form-field">
            <app-form-input
              label="Skill"
              [value]="assessmentSkill"
              (valueChange)="onAssessmentSkillChange($event)"
              placeholder="e.g. Route Running"
            />
          </div>
          <div class="form-field">
            <app-form-input
              label="Score"
              [value]="assessmentScore"
              (valueChange)="onAssessmentScoreChange($event)"
              placeholder="0-100"
            />
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Save Assessment"
          primaryIcon="check"
          (cancel)="closeAssessmentDialog()"
          (primary)="saveAssessment()"
        />
      </app-dialog>
    </app-main-layout>
  `,
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
  readonly players = signal<Player[]>([]);
  readonly goals = signal<DevelopmentGoal[]>([]);
  readonly assessments = signal<SkillAssessment[]>([]);
  readonly notes = signal<CoachNote[]>([]);
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
  readonly selectedGoal = signal<DevelopmentGoal | null>(null);

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

  updateGoal(goal: DevelopmentGoal): void {
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

  viewGoalDetails(goal: DevelopmentGoal): void {
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

    const nextAssessment: SkillAssessment = {
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

  getGoalCategoryLabel(category: DevelopmentGoal["category"]): string {
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
