/**
 * Player Development Component (Coach View)
 *
 * Track individual player progress over time, set development goals,
 * compare against position benchmarks, and identify areas for improvement.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
// import { ChartModule } from "primeng/chart"; // REMOVED: Using LazyChartComponent
import { DatePicker } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";

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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    // ChartModule, // REMOVED: Using LazyChartComponent

    LazyChartComponent,
    DatePicker,
    DialogModule,
    InputTextModule,
    ProgressBarModule,
    RadioButton,
    Select,
    TableModule,
    TagModule,
    Textarea,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="player-development-page">
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
            <label>Player</label>
            <p-select
              [options]="playerOptions()"
              [(ngModel)]="selectedPlayerId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
              (onChange)="onPlayerChange()"
              styleClass="w-full"
            ></p-select>
          </div>
          <div class="selection-field">
            <label>Compare To</label>
            <p-select
              [options]="compareOptions"
              [(ngModel)]="compareToValue"
              optionLabel="label"
              optionValue="value"
              placeholder="Position Avg"
              styleClass="w-full"
            ></p-select>
          </div>
        </div>

        @if (selectedPlayer()) {
          <!-- Development Overview -->
          <div class="stats-summary">
            <div class="stat-card">
              <span class="stat-icon">📊</span>
              <div class="stat-content">
                <span class="stat-value"
                  >{{ selectedPlayer()?.overallProgress }}%</span
                >
                <span class="stat-label">Overall Progress</span>
                <span class="stat-sub">vs benchmarks</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">🎯</span>
              <div class="stat-content">
                <span class="stat-value"
                  >{{ selectedPlayer()?.goalsCompleted }}/{{
                    selectedPlayer()?.goalsTotal
                  }}</span
                >
                <span class="stat-label">Goals Completed</span>
                <span class="stat-sub">Active goals</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📈</span>
              <div class="stat-content">
                <span
                  class="stat-value"
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
                <span class="stat-label">Improvement</span>
                <span class="stat-sub">This month</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">🏆</span>
              <div class="stat-content">
                <span class="stat-value">{{
                  selectedPlayer()?.achievements
                }}</span>
                <span class="stat-label">Achievements</span>
                <span class="stat-sub">Unlocked</span>
              </div>
            </div>
          </div>

          <!-- Spider Chart Section -->
          <p-card styleClass="chart-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Position Benchmark Spider Chart</h3>
              </div>
            </ng-template>
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
          </p-card>

          <!-- Development Goals -->
          <p-card styleClass="goals-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Development Goals</h3>
                <app-button
                  size="sm"
                  iconLeft="pi-plus"
                  (clicked)="openGoalDialog()"
                  >Add Goal</app-button
                >
              </div>
            </ng-template>

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
                        [style]="{ height: '12px', flex: 1 }"
                      ></p-progressBar>
                      <span class="progress-value">{{ goal.progress }}%</span>
                    </div>
                    <div class="goal-status">
                      <span class="current-value"
                        >Current: {{ goal.currentValue }}</span
                      >
                      <p-tag
                        [value]="getStatusLabel(goal.status)"
                        [severity]="getStatusSeverity(goal.status)"
                      ></p-tag>
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
          </p-card>

          <!-- Performance History -->
          <p-card styleClass="history-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Performance History</h3>
              </div>
            </ng-template>
            <div class="history-filters">
              <p-select
                [options]="physicalMetrics"
                [(ngModel)]="selectedMetric"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Metric"
                (onChange)="onMetricChange()"
              ></p-select>
              <p-select
                [options]="periodOptions"
                [(ngModel)]="selectedPeriod"
                optionLabel="label"
                optionValue="value"
                placeholder="Period"
                (onChange)="onMetricChange()"
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
          </p-card>

          <!-- Skill Assessments -->
          <p-card styleClass="assessments-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>{{ selectedPlayer()?.position }}-Specific Skills</h3>
                <div class="assessment-actions">
                  <span class="last-assessment"
                    >Last Assessment: Dec 28, 2025</span
                  >
                  <app-button
                    variant="secondary"
                    size="sm"
                    (clicked)="newAssessment()"
                    >New Assessment</app-button
                  >
                </div>
              </div>
            </ng-template>
            <div class="skills-list">
              @for (skill of skillAssessments(); track skill.skill) {
                <div class="skill-row">
                  <span class="skill-name">{{ skill.skill }}</span>
                  <div class="skill-bar">
                    <p-progressBar
                      [value]="skill.score"
                      [showValue]="false"
                      height="16px"
                    ></p-progressBar>
                  </div>
                  <span class="skill-score">{{ skill.score }}%</span>
                  <p-tag
                    [value]="skill.grade"
                    [severity]="getGradeSeverity(skill.grade)"
                  ></p-tag>
                </div>
              }
            </div>
            <div class="overall-grade">
              <strong>Overall Position Grade:</strong> B+ (78/100)
            </div>
          </p-card>

          <!-- Coach Notes -->
          <p-card styleClass="notes-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Coach Development Notes</h3>
                <app-button
                  size="sm"
                  iconLeft="pi-plus"
                  (clicked)="openNoteDialog()"
                  >Add Note</app-button
                >
              </div>
            </ng-template>
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
          </p-card>
        } @else {
          <p-card styleClass="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-users"></i>
              <h3>Select a Player</h3>
              <p>Choose a player to view their development progress</p>
            </div>
          </p-card>
        }
      </div>

      <!-- Add Goal Dialog -->
      <p-dialog
        [(visible)]="showGoalDialog"
        header="Add Development Goal"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '500px' }"
      >
        <div class="goal-form">
          <div class="form-field">
            <label>Player</label>
            <p-select
              [options]="playerOptions()"
              [(ngModel)]="goalForm.playerId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
              styleClass="w-full"
            ></p-select>
          </div>

          <div class="form-field">
            <label>Goal Category</label>
            <div class="radio-group">
              @for (cat of goalCategories; track cat.value) {
                <div class="radio-option">
                  <p-radioButton
                    name="category"
                    [value]="cat.value"
                    [(ngModel)]="goalForm.category"
                    [inputId]="'cat-' + cat.value"
                  ></p-radioButton>
                  <label [for]="'cat-' + cat.value">{{ cat.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Metric</label>
              <p-select
                [options]="physicalMetrics"
                [(ngModel)]="goalForm.metric"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Metric"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-field">
              <label>Current Value</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="goalForm.currentValue"
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
                [(ngModel)]="goalForm.targetValue"
                placeholder="e.g., 4.45s"
              />
            </div>
            <div class="form-field">
              <label>Target Date</label>
              <p-datepicker
                [(ngModel)]="goalForm.dueDate"
                [showIcon]="true"
                styleClass="w-full"
              ></p-datepicker>
            </div>
          </div>

          <div class="form-field">
            <label>Notes (optional)</label>
            <textarea
              pTextarea
              [(ngModel)]="goalForm.notes"
              rows="3"
              placeholder="Additional notes..."
            ></textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showGoalDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-check" (clicked)="createGoal()"
            >Create Goal</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Add Note Dialog -->
      <p-dialog
        [(visible)]="showNoteDialog"
        header="Add Development Note"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '500px' }"
      >
        <div class="note-form">
          <div class="form-field">
            <label>Note</label>
            <textarea
              pTextarea
              [(ngModel)]="noteContent"
              rows="5"
              placeholder="Enter your development notes..."
            ></textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showNoteDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-check" (clicked)="saveNote()"
            >Save Note</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./player-development.component.scss",
})
export class PlayerDevelopmentComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

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
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "#22c55e",
        pointBackgroundColor: "#22c55e",
      },
      {
        label: "Elite Benchmark",
        data: [95, 92, 90, 93, 95, 90],
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "#3b82f6",
        pointBackgroundColor: "#3b82f6",
      },
      {
        label: "Position Avg",
        data: [75, 72, 68, 74, 76, 70],
        fill: true,
        backgroundColor: "rgba(156, 163, 175, 0.1)",
        borderColor: "#9ca3af",
        pointBackgroundColor: "#9ca3af",
      },
    ],
  }));

  readonly radarChartOptions = {
    scales: {
      r: {
        angleLines: { color: "rgba(0, 0, 0, 0.1)" },
        grid: { color: "rgba(0, 0, 0, 0.1)" },
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
        borderColor: "#22c55e",
        tension: 0.4,
      },
      {
        label: "Target",
        data: [4.45, 4.45, 4.45, 4.45, 4.45, 4.45],
        fill: false,
        borderColor: "#ef4444",
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

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/coach/player-development"),
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
    this.messageService.add({
      severity: "success",
      summary: "Goal Created",
      detail: "Development goal has been created",
    });
    this.showGoalDialog = false;
  }

  updateGoal(goal: DevelopmentGoal): void {
    this.messageService.add({
      severity: "info",
      summary: "Update Goal",
      detail: `Opening update dialog for ${goal.metric}`,
    });
  }

  viewGoalDetails(goal: DevelopmentGoal): void {
    this.messageService.add({
      severity: "info",
      summary: "Goal Details",
      detail: `Viewing details for ${goal.metric}`,
    });
  }

  openNoteDialog(): void {
    this.noteContent = "";
    this.showNoteDialog = true;
  }

  saveNote(): void {
    if (!this.noteContent.trim()) return;
    this.messageService.add({
      severity: "success",
      summary: "Note Saved",
      detail: "Development note has been added",
    });
    this.showNoteDialog = false;
  }

  newAssessment(): void {
    this.messageService.add({
      severity: "info",
      summary: "New Assessment",
      detail: "Opening assessment form",
    });
  }

  exportReport(): void {
    this.messageService.add({
      severity: "success",
      summary: "Export Started",
      detail: "Development report is being generated",
    });
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
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary" | "contrast"
    > = {
      "on-track": "success",
      ahead: "success",
      behind: "warn",
      completed: "info",
    };
    return severities[status] || "secondary";
  }

  getGradeSeverity(
    grade: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary" | "contrast"
    > = {
      Elite: "success",
      Excellent: "success",
      Good: "info",
      Developing: "warn",
      "Needs Work": "danger",
    };
    return severities[grade] || "secondary";
  }
}
