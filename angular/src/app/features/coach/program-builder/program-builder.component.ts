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
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { InputNumber, type InputNumberInputEvent } from "primeng/inputnumber";
import { ProgressBar } from "primeng/progressbar";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  programStatusSeverityMap,
} from "../../../shared/utils/status.utils";
import { DatePickerComponent } from "../../../shared/components/date-picker/date-picker.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { firstValueFrom } from "rxjs";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { DialogService } from "../../../core/ui/dialog.service";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
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
  { label: "Speed Development", value: "speed", icon: "pi-bolt" },
  { label: "Strength Training", value: "strength", icon: "pi-heart" },
  { label: "Active Recovery", value: "recovery", icon: "pi-refresh" },
  { label: "Agility & Skills", value: "agility", icon: "pi-bolt" },
  { label: "Position Practice", value: "position", icon: "pi-flag" },
  { label: "Team Practice/Game", value: "team", icon: "pi-trophy" },
  { label: "Rest Day", value: "rest", icon: "pi-moon" },
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    DatePickerComponent,
    FormInputComponent,
    InputNumber,
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
    CardShellComponent,
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
  ],
  templateUrl: "./program-builder.component.html",
  styleUrl: "./program-builder.component.scss",
})
export class ProgramBuilderComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  // Expose constants to template
  DAYS = DAYS;

  // State
  readonly activeTab = signal<"my" | "team" | "templates">("my");
  readonly programs = signal<TrainingProgram[]>([]);
  readonly teamMembers = signal<TeamMemberOption[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isEditing = signal(false);
  readonly selectedProgram = signal<TrainingProgram | null>(null);

  // Dialog state
  showCreateDialog = false;
  showProgramDetailsDialog = false;
  showComplianceDialog = false;
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

  onProgramNameChange(value: string): void {
    this.formData = { ...this.formData, name: value };
  }

  onProgramDescriptionChange(value: string): void {
    this.formData = { ...this.formData, description: value };
  }

  onProgramStartDateChange(value: Date | null): void {
    this.formData = {
      ...this.formData,
      startDate: value ?? this.formData.startDate,
    };
  }

  onProgramDurationWeeksChange(value: number | null): void {
    this.formData = {
      ...this.formData,
      durationWeeks: value ?? this.formData.durationWeeks,
    };
  }

  onProgramGoalEventChange(value: string): void {
    this.formData = { ...this.formData, goalEvent: value };
  }

  onProgramTypeChange(value: ProgramType | null): void {
    this.formData = {
      ...this.formData,
      type: value ?? this.formData.type,
    };
  }

  onWeekTemplateSessionTypeChange(day: DayOfWeek, value: SessionType): void {
    this.formData = {
      ...this.formData,
      weekTemplate: {
        ...this.formData.weekTemplate,
        [day]: { ...this.formData.weekTemplate[day], sessionType: value },
      },
    };
  }

  onWeekTemplateDurationInput(
    day: DayOfWeek,
    event: InputNumberInputEvent,
  ): void {
    this.onWeekTemplateDurationChange(day, event.value ?? null);
  }

  onWeekTemplateDurationChange(day: DayOfWeek, value: number | null): void {
    this.formData = {
      ...this.formData,
      weekTemplate: {
        ...this.formData.weekTemplate,
        [day]: {
          ...this.formData.weekTemplate[day],
          duration: value ?? this.formData.weekTemplate[day].duration,
        },
      },
    };
  }

  onWeekTemplateTargetRpeInput(
    day: DayOfWeek,
    event: InputNumberInputEvent,
  ): void {
    this.onWeekTemplateTargetRpeChange(day, event.value ?? null);
  }

  onWeekTemplateTargetRpeChange(day: DayOfWeek, value: number | null): void {
    this.formData = {
      ...this.formData,
      weekTemplate: {
        ...this.formData.weekTemplate,
        [day]: {
          ...this.formData.weekTemplate[day],
          targetRpe: value ?? this.formData.weekTemplate[day].targetRpe,
        },
      },
    };
  }

  onSelectAllPlayersChange(value: boolean): void {
    this.selectAllPlayers = value;
    this.toggleSelectAll();
  }

  onSelectAllPlayersToggle(event: Event): void {
    this.onSelectAllPlayersChange(this.readChecked(event));
  }

  onTeamMemberSelectedChange(memberId: string, value: boolean): void {
    this.teamMembers.update((members) =>
      members.map((member) =>
        member.id === memberId ? { ...member, selected: value } : member,
      ),
    );
    this.selectAllPlayers =
      this.teamMembers().filter((m) => m.status === "active").length > 0 &&
      this.teamMembers()
        .filter((m) => m.status === "active")
        .every((m) => m.selected);
  }

  onTeamMemberSelectedToggle(memberId: string, event: Event): void {
    this.onTeamMemberSelectedChange(memberId, this.readChecked(event));
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const response = await firstValueFrom(
        this.api.get<{
        programs?: TrainingProgram[];
        teamMembers?: TeamMemberOption[];
      }>(API_ENDPOINTS.coach.programs),
      );
      const payload = extractApiPayload<{
        programs?: TrainingProgram[];
        teamMembers?: TeamMemberOption[];
      }>(response);
      this.programs.set(payload?.programs ?? []);
      this.teamMembers.set(payload?.teamMembers ?? []);
    } catch (err) {
      this.logger.error("Failed to load programs", err);
      this.programs.set([]);
      this.teamMembers.set([]);
      this.loadError.set(
        "We couldn't load training programs. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadData(): void {
    void this.loadData();
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

  private resetCreateDialogState(): void {
    this.isEditing.set(false);
    this.formData = this.getEmptyFormData();
    this.teamMembers.update((members) =>
      members.map((member) => ({ ...member, selected: false })),
    );
    this.selectAllPlayers = false;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
    this.resetCreateDialogState();
  }

  closeProgramDetailsDialog(): void {
    this.showProgramDetailsDialog = false;
  }

  closeComplianceDialog(): void {
    this.showComplianceDialog = false;
  }

  private refreshPrograms(): void {
    this.loadData();
  }

  private showProgramDetailsDialogFor(program: TrainingProgram): void {
    this.closeProgramDetailsDialog();
    this.selectedProgram.set(program);
    this.showProgramDetailsDialog = true;
  }

  private showComplianceDialogFor(program: TrainingProgram): void {
    this.closeComplianceDialog();
    this.selectedProgram.set(program);
    this.showComplianceDialog = true;
  }

  private handleProgramMutation(
    operation$: ReturnType<ApiService["post"]> | ReturnType<ApiService["put"]>,
    options: {
      successTitle: string;
      successMessage: string;
      closeDialog?: () => void;
    },
  ): void {
    operation$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastService.success(options.successMessage, options.successTitle);
        options.closeDialog?.();
        this.refreshPrograms();
      },
      error: (err) => {
        this.logger.error(`Failed to ${options.successTitle.toLowerCase()}`, err);
        this.toastService.error(TOAST.ERROR.SAVE_FAILED);
      },
    });
  }

  // Dialog methods
  openCreateDialog(): void {
    this.resetCreateDialogState();
    this.showCreateDialog = true;
  }

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

  editProgram(program: TrainingProgram): void {
    this.closeCreateDialog();
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

    this.handleProgramMutation(this.api.post(API_ENDPOINTS.coach.programsDraft, program), {
      successMessage: `${this.formData.name} saved as draft`,
      successTitle: "Draft Saved",
      closeDialog: () => this.closeCreateDialog(),
    });
  }

  previewProgram(): void {
    this.showProgramDetailsDialogFor(this.buildPreviewProgram());
  }

  publishNewProgram(): void {
    if (!this.formData.name) return;

    const program: Partial<TrainingProgram> = {
      ...this.formData,
      status: "active",
      startDate: this.formData.startDate.toISOString(),
      assignedCount: this.selectedPlayerCount(),
    };

    this.handleProgramMutation(this.api.post(API_ENDPOINTS.coach.programs, program), {
      successMessage: `${this.formData.name} is now active`,
      successTitle: "Program Published",
      closeDialog: () => this.closeCreateDialog(),
    });
  }

  publishProgram(program: TrainingProgram): void {
    this.handleProgramMutation(
      this.api.put(API_ENDPOINTS.coach.programPublish(program.id), {}),
      {
        successMessage: `${program.name} is now active`,
        successTitle: "Program Published",
      },
    );
  }

  async deleteProgram(program: TrainingProgram): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `Delete "${program.name}"?`,
      "Delete Program",
    );
    if (!confirmed) return;

    this.programs.update((progs) => progs.filter((p) => p.id !== program.id));

    this.api.delete(API_ENDPOINTS.coach.programDelete(program.id)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastService.info("Program deleted", "Program Deleted");
        this.refreshPrograms();
      },
      error: (err) => {
        this.logger.error("Failed to delete program", err);
        this.toastService.error(TOAST.ERROR.DELETE_FAILED);
      },
    });
  }

  duplicateProgram(program: TrainingProgram): void {
    this.toastService.info(
      `Creating copy of ${program.name}...`,
      "Duplicating",
    );
  }

  viewProgramDetails(program: TrainingProgram): void {
    this.showProgramDetailsDialogFor(program);
  }

  viewCompliance(program: TrainingProgram): void {
    this.showComplianceDialogFor(program);
  }

  showProgramDetailsFromCompliance(): void {
    const program = this.selectedProgram();
    if (!program) return;
    this.showProgramDetailsDialogFor(program);
  }

  openProgramMenu(_event: Event, program: TrainingProgram): void {
    this.viewProgramDetails(program);
  }

  private readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  // Helper methods
  getProgramIcon(type: ProgramType): string {
    const icons: Record<ProgramType, string> = {
      "competition-prep": "pi-trophy",
      "off-season": "pi-calendar",
      "in-season": "pi-flag",
      rtp: "pi-heart",
      "position-specific": "pi-bullseye",
    };
    return icons[type] ?? "pi-file";
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

  getProgramTypeLabel(type: ProgramType): string {
    return this.programTypeOptions.find((option) => option.value === type)?.label || type;
  }

  getOnTrackCount(program: TrainingProgram): number {
    return Math.round((program.assignedCount * program.compliance) / 100);
  }

  getNeedsFollowUpCount(program: TrainingProgram): number {
    return Math.max(program.assignedCount - this.getOnTrackCount(program), 0);
  }

  editSelectedProgram(): void {
    const program = this.selectedProgram();
    if (!program) return;
    this.closeProgramDetailsDialog();
    this.editProgram(program);
  }

  private buildPreviewProgram(): TrainingProgram {
    return {
      id: this.formData.id || "preview-program",
      name: this.formData.name || "Untitled Program",
      description: this.formData.description,
      type: this.formData.type,
      status: "draft",
      startDate: this.formData.startDate.toISOString(),
      durationWeeks: this.formData.durationWeeks,
      currentWeek: 1,
      currentPhase: this.formData.phases[0]?.name || "",
      goalEvent: this.formData.goalEvent || "",
      assignedCount: this.selectedPlayerCount(),
      compliance: 0,
      phases: this.formData.phases.map((phase) => ({ ...phase })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  getStatusSeverity(
    status: ProgramStatus,
  ): "success" | "info" | "warning" | "secondary" {
    return getMappedStatusSeverity(status, programStatusSeverityMap, "info");
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
