/**
 * Training Program Builder Component (Coach View)
 *
 * Create and manage multi-week training programs with periodization phases,
 * assign programs to players, and track compliance.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
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

// ===== Interfaces =====
interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  type: ProgramType;
  status: ProgramStatus;
  startDate: string;
  durationWeeks: number;
  currentWeek?: number;
  currentPhase?: string;
  goalEvent?: string;
  assignedCount: number;
  compliance: number;
  phases: ProgramPhase[];
  createdAt: string;
  updatedAt: string;
}

interface ProgramPhase {
  id: string;
  name: string;
  weekStart: number;
  weekEnd: number;
  loadPercentage: number;
  focus: string;
}

interface _DaySession {
  id?: string;
  day: DayOfWeek;
  sessionType: SessionType;
  duration: number;
  targetRpe: number;
  exercises: SessionExercise[];
  notes?: string;
}

interface SessionExercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number | string;
  duration?: number;
  notes?: string;
}

interface TeamMemberOption {
  id: string;
  name: string;
  position: string;
  status: "active" | "minor-injury" | "rtp" | "inactive";
  selected: boolean;
}

type ProgramType =
  | "competition-prep"
  | "off-season"
  | "in-season"
  | "rtp"
  | "position-specific";
type ProgramStatus = "draft" | "active" | "completed" | "archived";
type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
type SessionType =
  | "speed"
  | "strength"
  | "recovery"
  | "agility"
  | "position"
  | "team"
  | "rest";

// ===== Constants =====
const PROGRAM_TYPES: { label: string; value: ProgramType }[] = [
  { label: "Competition Prep", value: "competition-prep" },
  { label: "Off-Season", value: "off-season" },
  { label: "In-Season", value: "in-season" },
  { label: "Return-to-Play", value: "rtp" },
  { label: "Position-Specific", value: "position-specific" },
];

const SESSION_TYPES: { label: string; value: SessionType; icon: string }[] = [
  { label: "Speed Development", value: "speed", icon: "🏃" },
  { label: "Strength Training", value: "strength", icon: "💪" },
  { label: "Active Recovery", value: "recovery", icon: "🔄" },
  { label: "Agility & Skills", value: "agility", icon: "⚡" },
  { label: "Position Practice", value: "position", icon: "🏈" },
  { label: "Team Practice/Game", value: "team", icon: "🏆" },
  { label: "Rest Day", value: "rest", icon: "😴" },
];

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const PHASE_PRESETS = [
  { name: "Foundation", loadPercentage: 70, focus: "Base fitness, technique" },
  { name: "Building", loadPercentage: 85, focus: "Progressive overload" },
  { name: "Peak Load", loadPercentage: 100, focus: "Maximum training stress" },
  { name: "Taper", loadPercentage: 50, focus: "Recovery before competition" },
  { name: "Competition", loadPercentage: 75, focus: "Game-day performance" },
];

@Component({
  selector: "app-program-builder",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CardModule,
    CheckboxModule,
    DatePicker,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    ProgressBarModule,
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

      <div class="program-builder-page">
        <app-page-header
          title="Training Programs"
          subtitle="Build and assign training plans"
          icon="pi-list-check"
        >
          <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
            >Create Program</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'my'"
            (click)="activeTab.set('my')"
          >
            My Programs
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'team'"
            (click)="activeTab.set('team')"
          >
            Team Programs
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'templates'"
            (click)="activeTab.set('templates')"
          >
            Templates
          </button>
        </div>

        <!-- Active Programs -->
        @if (activePrograms().length > 0) {
          <div class="programs-section">
            <h3>Active Programs</h3>
            <div class="programs-list">
              @for (program of activePrograms(); track program.id) {
                <p-card styleClass="program-card">
                  <div class="program-header">
                    <div class="program-title">
                      <span class="program-icon">{{
                        getProgramIcon(program.type)
                      }}</span>
                      <h4>{{ program.name }}</h4>
                    </div>
                    <div class="program-actions">
                      <app-button
                        variant="text"
                        iconLeft="pi-pencil"
                        (clicked)="editProgram(program)"
                        >Edit program</app-button
                      >
                      <app-button
                        variant="text"
                        iconLeft="pi-ellipsis-v"
                        (clicked)="openProgramMenu($event, program)"
                        >More actions</app-button
                      >
                    </div>
                  </div>

                  <div class="program-details">
                    <div class="detail-row">
                      <span class="detail-label">Duration:</span>
                      <span>{{ program.durationWeeks }} weeks</span>
                      <span class="detail-label">Status:</span>
                      <p-tag
                        [value]="getStatusLabel(program.status)"
                        [severity]="getStatusSeverity(program.status)"
                      ></p-tag>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Start:</span>
                      <span>{{ program.startDate | date: "MMM d, y" }}</span>
                      <span class="detail-label">Current:</span>
                      <span
                        >Week {{ program.currentWeek }} of
                        {{ program.durationWeeks }}</span
                      >
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Phase:</span>
                      <span>{{ program.currentPhase }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Assigned:</span>
                      <span>{{ program.assignedCount }} players</span>
                      <span class="detail-label">Compliance:</span>
                      <span
                        class="compliance"
                        [class.good]="program.compliance >= 80"
                        >{{ program.compliance }}%</span
                      >
                    </div>
                  </div>

                  <div class="program-progress">
                    <p-progressBar
                      [value]="getProgressPercent(program)"
                      [showValue]="false"
                    ></p-progressBar>
                    <span class="progress-label"
                      >{{ getProgressPercent(program) | number: "1.0-0" }}%
                      complete</span
                    >
                  </div>

                  <div class="phase-timeline">
                    @for (phase of program.phases; track phase.id) {
                      <div
                        class="phase-chip"
                        [class.current]="phase.name === program.currentPhase"
                      >
                        {{ phase.name }}
                      </div>
                      @if (!$last) {
                        <i class="pi pi-arrow-right"></i>
                      }
                    }
                  </div>

                  <div class="program-footer">
                    <app-button
                      variant="secondary"
                      size="sm"
                      (clicked)="viewProgramDetails(program)"
                      >View Details</app-button
                    >
                    <app-button
                      variant="secondary"
                      size="sm"
                      (clicked)="viewCompliance(program)"
                      >View Compliance</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      (clicked)="duplicateProgram(program)"
                      >Duplicate</app-button
                    >
                  </div>
                </p-card>
              }
            </div>
          </div>
        }

        <!-- Draft Programs -->
        @if (draftPrograms().length > 0) {
          <div class="programs-section">
            <h3>Draft Programs</h3>
            <div class="programs-list">
              @for (program of draftPrograms(); track program.id) {
                <p-card styleClass="program-card draft">
                  <div class="program-header">
                    <div class="program-title">
                      <span class="program-icon">📝</span>
                      <h4>{{ program.name }} (Draft)</h4>
                    </div>
                    <div class="program-actions">
                      <app-button
                        variant="text"
                        iconLeft="pi-pencil"
                        (clicked)="editProgram(program)"
                        >Edit program</app-button
                      >
                    </div>
                  </div>

                  <div class="program-details">
                    <div class="detail-row">
                      <span class="detail-label">Duration:</span>
                      <span>{{ program.durationWeeks }} weeks</span>
                      <span class="detail-label">Last edited:</span>
                      <span>{{ program.updatedAt | date: "MMM d, y" }}</span>
                    </div>
                  </div>

                  <div class="program-footer">
                    <app-button
                      variant="secondary"
                      size="sm"
                      (clicked)="editProgram(program)"
                      >Continue Editing</app-button
                    >
                    <app-button
                      size="sm"
                      iconLeft="pi-check"
                      (clicked)="publishProgram(program)"
                      >Publish</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      (clicked)="deleteProgram(program)"
                      >Delete</app-button
                    >
                  </div>
                </p-card>
              }
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (programs().length === 0) {
          <p-card styleClass="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-list-check"></i>
              <h3>No Programs Yet</h3>
              <p>Create your first training program to get started</p>
              <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
                >Create Program</app-button
              >
            </div>
          </p-card>
        }
      </div>

      <!-- Create/Edit Program Dialog -->
      <p-dialog
        [(visible)]="showCreateDialog"
        [header]="isEditing() ? 'Edit Program' : 'Create Training Program'"
        [modal]="true"
        [style]="{ width: '95vw', maxWidth: '900px' }"
        [closable]="true"
        styleClass="program-dialog"
      >
        <div class="program-form">
          <!-- Program Details -->
          <div class="form-section">
            <h4>Program Details</h4>

            <div class="form-field">
              <label for="programName">Program Name *</label>
              <input
                id="programName"
                type="text"
                pInputText
                [(ngModel)]="formData.name"
                placeholder="e.g., Spring Championship Prep"
                class="w-full"
              />
            </div>

            <div class="form-field">
              <label for="programDesc">Description</label>
              <textarea
                pTextarea
                id="programDesc"
                [(ngModel)]="formData.description"
                placeholder="Program goals and focus areas..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label for="startDate">Start Date</label>
                <p-datepicker
                  inputId="startDate"
                  [(ngModel)]="formData.startDate"
                  [showIcon]="true"
                  dateFormat="M d, yy"
                ></p-datepicker>
              </div>
              <div class="form-field">
                <label for="duration">Duration</label>
                <p-select
                  inputId="duration"
                  [options]="durationOptions"
                  [(ngModel)]="formData.durationWeeks"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label for="goalEvent">Goal Event</label>
                <input
                  id="goalEvent"
                  type="text"
                  pInputText
                  [(ngModel)]="formData.goalEvent"
                  placeholder="e.g., Spring Championship"
                />
              </div>
              <div class="form-field">
                <label for="programType">Program Type</label>
                <p-select
                  inputId="programType"
                  [options]="programTypeOptions"
                  [(ngModel)]="formData.type"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>
            </div>
          </div>

          <!-- Periodization Phases -->
          <div class="form-section">
            <h4>Periodization Phases</h4>
            <div class="phases-timeline">
              @for (
                phase of formData.phases;
                track phase.name;
                let i = $index
              ) {
                <div class="phase-block">
                  <div class="phase-header">
                    <span class="phase-name">{{ phase.name }}</span>
                    <span class="phase-weeks"
                      >Wk {{ phase.weekStart }}-{{ phase.weekEnd }}</span
                    >
                  </div>
                  <div class="phase-load">
                    Load: {{ phase.loadPercentage }}%
                  </div>
                </div>
              }
            </div>
            <app-button
              variant="text"
              size="sm"
              iconLeft="pi-plus"
              (clicked)="addPhase()"
              >Add Phase</app-button
            >
          </div>

          <!-- Weekly Schedule (Simplified) -->
          <div class="form-section">
            <h4>Weekly Schedule Template</h4>
            <div class="week-schedule">
              @for (day of DAYS; track day) {
                <div class="day-row">
                  <span class="day-label">{{ day }}</span>
                  <p-select
                    [options]="sessionTypeOptions"
                    [(ngModel)]="formData.weekTemplate[day].sessionType"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Session type"
                    [style]="{ width: '180px' }"
                  ></p-select>
                  <p-inputNumber
                    [(ngModel)]="formData.weekTemplate[day].duration"
                    suffix=" min"
                    [min]="0"
                    [max]="180"
                    [style]="{ width: '100px' }"
                  ></p-inputNumber>
                  <span class="rpe-label">RPE:</span>
                  <p-inputNumber
                    [(ngModel)]="formData.weekTemplate[day].targetRpe"
                    [min]="1"
                    [max]="10"
                    [style]="{ width: '70px' }"
                  ></p-inputNumber>
                </div>
              }
            </div>
          </div>

          <!-- Assign Players -->
          <div class="form-section">
            <h4>Assign to Players</h4>
            <div class="player-selection">
              <div class="select-all">
                <p-checkbox
                  [(ngModel)]="selectAllPlayers"
                  [binary]="true"
                  variant="filled"
                  inputId="selectAll"
                  (onChange)="toggleSelectAll()"
                ></p-checkbox>
                <label for="selectAll"
                  >Select All Active Players ({{ activePlayerCount() }})</label
                >
              </div>

              <div class="players-grid">
                @for (player of teamMembers(); track player.id) {
                  <div
                    class="player-option"
                    [class.disabled]="player.status === 'rtp'"
                  >
                    <p-checkbox
                      [(ngModel)]="player.selected"
                      [binary]="true"
                      variant="filled"
                      [inputId]="'player-' + player.id"
                      [disabled]="player.status === 'rtp'"
                    ></p-checkbox>
                    <label [for]="'player-' + player.id">
                      {{ player.name }} ({{ player.position }})
                      @if (player.status !== "active") {
                        <span class="player-status"
                          >- {{ getPlayerStatusLabel(player.status) }}</span
                        >
                      }
                    </label>
                  </div>
                }
              </div>

              <p class="selected-count">
                Selected: {{ selectedPlayerCount() }} of
                {{ teamMembers().length }} players
              </p>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="saveDraft()"
            >Save as Draft</app-button
          >
          <app-button variant="secondary" (clicked)="previewProgram()"
            >Preview</app-button
          >
          <app-button
            iconLeft="pi-check"
            [disabled]="!formData.name"
            (clicked)="publishNewProgram()"
            >Publish Program</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./program-builder.component.scss",
})
export class ProgramBuilderComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // Expose constants to template
  DAYS = DAYS;

  // State
  readonly activeTab = signal<"my" | "team" | "templates">("my");
  readonly programs = signal<TrainingProgram[]>([]);
  readonly teamMembers = signal<TeamMemberOption[]>([]);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);

  // Dialog state
  showCreateDialog = false;
  selectAllPlayers = false;

  // Form data
  formData: {
    id?: string;
    name: string;
    description: string;
    type: ProgramType;
    startDate: Date;
    durationWeeks: number;
    goalEvent: string;
    phases: ProgramPhase[];
    weekTemplate: Record<
      DayOfWeek,
      { sessionType: SessionType; duration: number; targetRpe: number }
    >;
  } = this.getEmptyFormData();

  // Options
  readonly programTypeOptions = PROGRAM_TYPES;
  readonly sessionTypeOptions = SESSION_TYPES;
  readonly durationOptions = [
    { label: "4 weeks", value: 4 },
    { label: "6 weeks", value: 6 },
    { label: "8 weeks", value: 8 },
    { label: "10 weeks", value: 10 },
    { label: "12 weeks", value: 12 },
  ];

  // Computed
  readonly activePrograms = computed(() =>
    this.programs().filter((p) => p.status === "active"),
  );

  readonly draftPrograms = computed(() =>
    this.programs().filter((p) => p.status === "draft"),
  );

  readonly activePlayerCount = computed(
    () => this.teamMembers().filter((m) => m.status === "active").length,
  );

  readonly selectedPlayerCount = computed(
    () => this.teamMembers().filter((m) => m.selected).length,
  );

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/coach/programs"),
      );
      if (response?.success && response.data) {
        if (response.data.programs) this.programs.set(response.data.programs);
        if (response.data.teamMembers)
          this.teamMembers.set(response.data.teamMembers);
      }
    } catch (err) {
      this.logger.error("Failed to load programs", err);
      // No data available - show empty state
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEmptyFormData() {
    const weekTemplate: Record<
      DayOfWeek,
      { sessionType: SessionType; duration: number; targetRpe: number }
    > = {
      MON: { sessionType: "speed", duration: 60, targetRpe: 7 },
      TUE: { sessionType: "strength", duration: 75, targetRpe: 8 },
      WED: { sessionType: "recovery", duration: 30, targetRpe: 4 },
      THU: { sessionType: "agility", duration: 60, targetRpe: 7 },
      FRI: { sessionType: "position", duration: 90, targetRpe: 8 },
      SAT: { sessionType: "team", duration: 120, targetRpe: 9 },
      SUN: { sessionType: "rest", duration: 0, targetRpe: 0 },
    };

    return {
      name: "",
      description: "",
      type: "competition-prep" as ProgramType,
      startDate: new Date(),
      durationWeeks: 8,
      goalEvent: "",
      phases: PHASE_PRESETS.slice(0, 4).map((p, i) => ({
        id: `new-${i}`,
        name: p.name,
        weekStart: i * 2 + 1,
        weekEnd: (i + 1) * 2,
        loadPercentage: p.loadPercentage,
        focus: p.focus,
      })),
      weekTemplate,
    };
  }

  // Dialog methods
  openCreateDialog(): void {
    this.isEditing.set(false);
    this.formData = this.getEmptyFormData();
    this.teamMembers.update((members) =>
      members.map((m) => ({ ...m, selected: false })),
    );
    this.selectAllPlayers = false;
    this.showCreateDialog = true;
  }

  editProgram(program: TrainingProgram): void {
    this.isEditing.set(true);
    this.formData = {
      id: program.id,
      name: program.name,
      description: program.description,
      type: program.type,
      startDate: new Date(program.startDate),
      durationWeeks: program.durationWeeks,
      goalEvent: program.goalEvent || "",
      phases: [...program.phases],
      weekTemplate: this.getEmptyFormData().weekTemplate,
    };
    this.showCreateDialog = true;
  }

  toggleSelectAll(): void {
    this.teamMembers.update((members) =>
      members.map((m) => ({
        ...m,
        selected: m.status !== "rtp" ? this.selectAllPlayers : false,
      })),
    );
  }

  addPhase(): void {
    const lastPhase = this.formData.phases[this.formData.phases.length - 1];
    const nextWeekStart = lastPhase ? lastPhase.weekEnd + 1 : 1;

    this.formData.phases.push({
      id: `new-${Date.now()}`,
      name: "New Phase",
      weekStart: nextWeekStart,
      weekEnd: nextWeekStart + 1,
      loadPercentage: 80,
      focus: "",
    });
  }

  saveDraft(): void {
    const program: Partial<TrainingProgram> = {
      ...this.formData,
      status: "draft",
      startDate: this.formData.startDate.toISOString(),
    };

    this.api.post("/api/coach/programs/draft", program).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Draft Saved",
          detail: `${this.formData.name} saved as draft`,
        });
        this.showCreateDialog = false;
        this.loadData();
      },
      error: (err) => this.logger.error("Failed to save draft", err),
    });
  }

  previewProgram(): void {
    this.messageService.add({
      severity: "info",
      summary: "Preview",
      detail: "Program preview would open here",
    });
  }

  publishNewProgram(): void {
    if (!this.formData.name) return;

    const program: Partial<TrainingProgram> = {
      ...this.formData,
      status: "active",
      startDate: this.formData.startDate.toISOString(),
      assignedCount: this.selectedPlayerCount(),
    };

    this.api.post("/api/coach/programs", program).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Program Published",
          detail: `${this.formData.name} is now active`,
        });
        this.showCreateDialog = false;
        this.loadData();
      },
      error: (err) => this.logger.error("Failed to publish program", err),
    });
  }

  publishProgram(program: TrainingProgram): void {
    this.api.put(`/api/coach/programs/${program.id}/publish`, {}).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Program Published",
          detail: `${program.name} is now active`,
        });
        this.loadData();
      },
      error: (err) => this.logger.error("Failed to publish program", err),
    });
  }

  deleteProgram(program: TrainingProgram): void {
    if (!confirm(`Delete "${program.name}"?`)) return;

    this.programs.update((progs) => progs.filter((p) => p.id !== program.id));

    this.api.delete(`/api/coach/programs/${program.id}`).subscribe({
      next: () => {
        this.messageService.add({
          severity: "info",
          summary: "Program Deleted",
        });
      },
      error: (err) => this.logger.error("Failed to delete program", err),
    });
  }

  duplicateProgram(program: TrainingProgram): void {
    this.messageService.add({
      severity: "info",
      summary: "Duplicating",
      detail: `Creating copy of ${program.name}...`,
    });
  }

  viewProgramDetails(program: TrainingProgram): void {
    this.messageService.add({
      severity: "info",
      summary: "View Details",
      detail: `Opening ${program.name} details`,
    });
  }

  viewCompliance(program: TrainingProgram): void {
    this.messageService.add({
      severity: "info",
      summary: "Compliance Report",
      detail: `Opening compliance for ${program.name}`,
    });
  }

  openProgramMenu(_event: Event, _program: TrainingProgram): void {
    // Menu would open here
  }

  // Helper methods
  getProgramIcon(type: ProgramType): string {
    const icons: Record<ProgramType, string> = {
      "competition-prep": "🏆",
      "off-season": "📆",
      "in-season": "🏈",
      rtp: "🏥",
      "position-specific": "🎯",
    };
    return icons[type];
  }

  getStatusLabel(status: ProgramStatus): string {
    const labels: Record<ProgramStatus, string> = {
      draft: "Draft",
      active: "Active",
      completed: "Completed",
      archived: "Archived",
    };
    return labels[status];
  }

  getStatusSeverity(
    status: ProgramStatus,
  ): "success" | "info" | "warn" | "secondary" {
    const severities: Record<
      ProgramStatus,
      "success" | "info" | "warn" | "secondary"
    > = {
      draft: "secondary",
      active: "success",
      completed: "info",
      archived: "warn",
    };
    return severities[status];
  }

  getProgressPercent(program: TrainingProgram): number {
    if (!program.currentWeek) return 0;
    return (program.currentWeek / program.durationWeeks) * 100;
  }

  getPlayerStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      "minor-injury": "Minor Injury",
      rtp: "RTP",
      inactive: "Inactive",
    };
    return labels[status] || status;
  }
}
