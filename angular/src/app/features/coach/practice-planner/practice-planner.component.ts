/**
 * Practice Planner Component (Coach View)
 *
 * Plan detailed practice sessions with timing, drills, plays to run,
 * equipment needed, and position-specific activities.
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
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { InputNumber, type InputNumberInputEvent } from "primeng/inputnumber";
import { DatePickerComponent } from "../../../shared/components/date-picker/date-picker.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { getStatusSeverity as getStatusSeverityValue } from "../../../shared/utils/status.utils";
import { DIALOG_BREAKPOINTS } from "../../../core/utils/design-tokens.util";

import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";
import {
  CoachPlanningDataService,
  type PracticePlanAttendance,
} from "../services/coach-planning-data.service";

// ===== Interfaces =====
interface PracticePlan {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location: string;
  focus: string;
  equipment: EquipmentItem[];
  activities: ActivityBlock[];
  coachNotes: string;
  attendance: PracticePlanAttendance;
  status:
    | "scheduled"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "draft"
    | "template";
}

interface ActivityBlock {
  id: string;
  startTime: string;
  type: ActivityType;
  title: string;
  durationMinutes: number;
  details: string[];
  plays?: string[];
  keyPoints?: string[];
  completed?: boolean;
}

interface EquipmentItem {
  name: string;
  quantity: number;
  checked: boolean;
}

interface PracticeFormData {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location: string;
  focus: string;
  equipment: EquipmentItem[];
  activities: ActivityBlock[];
  coachNotes: string;
}

type ActivityType =
  | "warmup"
  | "position"
  | "offense"
  | "defense"
  | "scrimmage"
  | "cooldown"
  | "conditioning"
  | "film";

// ===== Constants =====
const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: "warmup", label: "Warm-up", icon: "pi-bolt" },
  { value: "position", label: "Position Work", icon: "pi-bullseye" },
  { value: "offense", label: "Team Offense", icon: "pi-flag" },
  { value: "defense", label: "Team Defense", icon: "pi-shield" },
  { value: "scrimmage", label: "Scrimmage", icon: "pi-shield" },
  { value: "cooldown", label: "Cool Down", icon: "pi-heart" },
  { value: "conditioning", label: "Conditioning", icon: "pi-bolt" },
  { value: "film", label: "Film Review", icon: "pi-video" },
];

const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  { name: "Cones", quantity: 20, checked: true },
  { name: "Footballs", quantity: 5, checked: true },
  { name: "Flag belts", quantity: 30, checked: true },
  { name: "Agility ladder", quantity: 2, checked: false },
  { name: "First aid kit", quantity: 1, checked: true },
  { name: "Water cooler", quantity: 1, checked: true },
  { name: "Whistle", quantity: 2, checked: true },
];

@Component({
  selector: "app-practice-planner",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    CardShellComponent,
    DatePickerComponent,
    FormInputComponent,
    InputNumber,
    SelectComponent,
    StatusTagComponent,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
  ],
  templateUrl: "./practice-planner.component.html",
  styleUrl: "./practice-planner.component.scss",
})
export class PracticePlannerComponent implements OnInit {
  private readonly coachPlanningDataService = inject(CoachPlanningDataService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  protected readonly dialogBreakpoints = DIALOG_BREAKPOINTS;

  // State
  readonly activeTab = signal<"upcoming" | "past" | "templates">("upcoming");
  readonly practices = signal<PracticePlan[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isEditing = signal(false);

  // Dialog state
  showDialog = false;
  showActivityDialog = false;
  editingActivity: ActivityBlock | null = null;

  // Form data
  formData: PracticeFormData = this.getEmptyFormData();
  private editingAttendance: PracticePlanAttendance = this.getEmptyAttendance();

  // Options
  readonly activityTypeOptions = ACTIVITY_TYPES;
  readonly timeOptions = this.generateTimeOptions();
  readonly locationOptions = [
    { label: "Central Park Field", value: "Central Park Field" },
    { label: "Main Stadium", value: "Main Stadium" },
    { label: "Indoor Facility", value: "Indoor Facility" },
    { label: "Practice Field B", value: "Practice Field B" },
  ];

  // Computed
  readonly filteredPractices = computed(() => {
    const tab = this.activeTab();
    const now = new Date().toISOString().split("T")[0];

    if (tab === "upcoming") {
      return this.practices().filter(
        (p) =>
          p.date >= now &&
          p.status !== "cancelled" &&
          p.status !== "draft" &&
          p.status !== "template",
      );
    } else if (tab === "past") {
      return this.practices().filter(
        (p) =>
          p.status !== "draft" &&
          p.status !== "template" &&
          (p.date < now || p.status === "completed"),
      );
    }
    return this.practices().filter(
      (p) => p.status === "draft" || p.status === "template",
    );
  });

  readonly allocatedMinutes = computed(() =>
    this.formData.activities.reduce((sum, a) => sum + a.durationMinutes, 0),
  );

  readonly remainingMinutes = computed(
    () => this.formData.durationMinutes - this.allocatedMinutes(),
  );

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const { data, error } =
        await this.coachPlanningDataService.listPracticePlans();

      if (error) {
        throw new Error(error.message || "Failed to load practice plans.");
      }

      this.practices.set(data);
    } catch (err) {
      this.logger.error("Failed to load practices", err);
      this.practices.set([]);
      this.loadError.set(
        "We couldn't load practice plans. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadData(): void {
    void this.loadData();
  }

  private getEmptyFormData(): PracticeFormData {
    return {
      id: "",
      title: "",
      date: new Date(),
      startTime: "6:00 PM",
      endTime: "8:00 PM",
      durationMinutes: 120,
      location: "Central Park Field",
      focus: "",
      equipment: [...DEFAULT_EQUIPMENT],
      activities: [] as ActivityBlock[],
      coachNotes: "",
    };
  }

  private getEmptyAttendance(): PracticePlanAttendance {
    return {
      confirmed: 0,
      pending: 0,
      total: 0,
    };
  }

  private generateTimeOptions() {
    const options = [];
    for (let h = 6; h <= 21; h++) {
      for (const m of ["00", "30"]) {
        const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const ampm = h >= 12 ? "PM" : "AM";
        const label = `${hour}:${m} ${ampm}`;
        options.push({ label, value: label });
      }
    }
    return options;
  }

  // Dialog methods
  openCreateDialog(): void {
    this.isEditing.set(false);
    this.formData = this.getEmptyFormData();
    this.editingAttendance = this.getEmptyAttendance();
    this.showDialog = true;
  }

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

  editPractice(practice: PracticePlan): void {
    this.isEditing.set(true);
    this.editingAttendance = { ...practice.attendance };
    this.formData = {
      id: practice.id,
      title: practice.title,
      date: new Date(practice.date),
      startTime: practice.startTime,
      endTime: practice.endTime,
      durationMinutes: practice.durationMinutes,
      location: practice.location,
      focus: practice.focus,
      equipment: [...practice.equipment],
      activities: practice.activities.map((a) => ({
        ...a,
        details: [...a.details],
      })),
      coachNotes: practice.coachNotes,
    };
    this.showDialog = true;
  }

  copyPractice(practice: PracticePlan): void {
    this.isEditing.set(false);
    this.editingAttendance = { ...practice.attendance };
    this.formData = {
      id: "",
      title: `${practice.title} (Copy)`,
      date: new Date(),
      startTime: practice.startTime,
      endTime: practice.endTime,
      durationMinutes: practice.durationMinutes,
      location: practice.location,
      focus: practice.focus,
      equipment: [...practice.equipment],
      activities: practice.activities.map((a) => ({
        ...a,
        id: crypto.randomUUID(),
        details: [...a.details],
      })),
      coachNotes: practice.coachNotes,
    };
    this.showDialog = true;
  }

  startPractice(practice: PracticePlan): void {
    this.practices.update((plans) =>
      plans.map((plan) =>
        plan.id === practice.id
          ? { ...plan, status: "in-progress" as const }
          : plan,
      ),
    );
    void this.coachPlanningDataService.updatePracticePlanStatus(
      practice.id,
      "in-progress",
    );
    this.editPractice({
      ...practice,
      status: "in-progress",
    });
  }

  // Activity management
  addActivity(): void {
    const lastActivity =
      this.formData.activities[this.formData.activities.length - 1];
    const newActivity: ActivityBlock = {
      id: `new-${Date.now()}`,
      startTime: lastActivity
        ? this.calculateNextTime(lastActivity)
        : this.formData.startTime,
      type: "position",
      title: "New Activity",
      durationMinutes: 15,
      details: [],
    };
    this.formData = {
      ...this.formData,
      activities: [...this.formData.activities, newActivity],
    };
    this.updateActivityTimes();
  }

  removeActivity(index: number): void {
    this.formData = {
      ...this.formData,
      activities: this.formData.activities.filter((_, i) => i !== index),
    };
    this.updateActivityTimes();
  }

  editActivity(activity: ActivityBlock): void {
    this.editingActivity = { ...activity, details: [...activity.details] };
    this.showActivityDialog = true;
  }

  saveActivity(): void {
    if (!this.editingActivity) return;
    const editingActivity = this.editingActivity;

    const index = this.formData.activities.findIndex(
      (a) => a.id === editingActivity.id,
    );
    if (index >= 0) {
      this.formData = {
        ...this.formData,
        activities: this.formData.activities.map((activity, activityIndex) =>
          activityIndex === index ? { ...editingActivity } : activity,
        ),
      };
    }
    this.showActivityDialog = false;
    this.updateActivityTimes();
  }

  addDetail(): void {
    if (this.editingActivity) {
      this.editingActivity.details.push("");
    }
  }

  removeDetail(index: number): void {
    if (this.editingActivity) {
      this.editingActivity.details.splice(index, 1);
    }
  }

  updatePlays(value: string): void {
    if (this.editingActivity) {
      this.editingActivity.plays = value.split("\n").filter((p) => p.trim());
    }
  }

  updateKeyPoints(value: string): void {
    if (this.editingActivity) {
      this.editingActivity.keyPoints = value
        .split("\n")
        .filter((p) => p.trim());
    }
  }

  updateActivityTimes(): void {
    const updatedActivities = [...this.formData.activities];
    let currentTime = this.formData.startTime;
    for (const activity of updatedActivities) {
      activity.startTime = currentTime;
      currentTime = this.addMinutesToTime(
        currentTime,
        activity.durationMinutes,
      );
    }
    this.formData = { ...this.formData, activities: updatedActivities };
  }

  onActivityDurationInput(index: number, event: InputNumberInputEvent): void {
    this.updateActivityDuration(index, event.value ?? null);
  }

  onEquipmentCheckedChange(equipmentName: string, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.updateEquipmentChecked(equipmentName, checked);
  }

  onEditingActivityDurationInput(event: InputNumberInputEvent): void {
    this.updateEditingActivityDuration(event.value ?? null);
  }

  updateFormDataTextField(
    field: "title" | "startTime" | "endTime" | "location" | "focus" | "coachNotes",
    value: string | null | undefined,
  ): void {
    this.formData = { ...this.formData, [field]: value ?? "" };
    if (field === "startTime") {
      this.updateActivityTimes();
    }
  }

  updatePracticeDate(value: Date | Date[] | null | undefined): void {
    const d = Array.isArray(value) ? value[0] ?? null : value ?? null;
    this.formData = { ...this.formData, date: d ?? new Date() };
  }

  updateActivityTitle(index: number, value: string | null | undefined): void {
    this.formData = {
      ...this.formData,
      activities: this.formData.activities.map((activity, activityIndex) =>
        activityIndex === index
          ? { ...activity, title: value ?? "" }
          : activity,
      ),
    };
  }

  updateActivityDuration(index: number, value: number | null | undefined): void {
    this.formData = {
      ...this.formData,
      activities: this.formData.activities.map((activity, activityIndex) =>
        activityIndex === index
          ? { ...activity, durationMinutes: value ?? activity.durationMinutes }
          : activity,
      ),
    };
    this.updateActivityTimes();
  }

  updateEquipmentChecked(
    equipmentName: string,
    checked: boolean | null | undefined,
  ): void {
    this.formData = {
      ...this.formData,
      equipment: this.formData.equipment.map((item) =>
        item.name === equipmentName ? { ...item, checked: checked ?? false } : item,
      ),
    };
  }

  updateEditingActivityType(value: ActivityType | null | undefined): void {
    if (!this.editingActivity) return;
    this.editingActivity = { ...this.editingActivity, type: value ?? "position" };
  }

  updateEditingActivityDuration(value: number | null | undefined): void {
    if (!this.editingActivity) return;
    this.editingActivity = {
      ...this.editingActivity,
      durationMinutes: value ?? this.editingActivity.durationMinutes,
    };
  }

  updateEditingActivityDetail(
    index: number,
    value: string | null | undefined,
  ): void {
    if (!this.editingActivity) return;
    this.editingActivity = {
      ...this.editingActivity,
      details: this.editingActivity.details.map((detail, detailIndex) =>
        detailIndex === index ? value ?? "" : detail,
      ),
    };
  }

  private calculateNextTime(activity: ActivityBlock): string {
    return this.addMinutesToTime(activity.startTime, activity.durationMinutes);
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return time;

    const [, hours, mins, period] = match;
    let h = parseInt(hours);
    let m = parseInt(mins) + minutes;

    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;

    h += Math.floor(m / 60);
    m = m % 60;

    const newPeriod = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;

    return `${displayHour}:${m.toString().padStart(2, "0")} ${newPeriod}`;
  }

  // Save methods
  async saveDraft(): Promise<void> {
    await this.persistPracticePlan(
      "draft",
      `${this.formData.title} saved as draft`,
      "Draft Saved",
    );
  }

  async saveAsTemplate(): Promise<void> {
    await this.persistPracticePlan(
      "template",
      `${this.formData.title} saved as template`,
      "Template Saved",
    );
  }

  async saveAndNotify(): Promise<void> {
    if (!this.formData.title) return;

    await this.persistPracticePlan(
      "scheduled",
      "Team practice has been saved.",
      "Practice Saved",
    );
  }

  private async persistPracticePlan(
    status: PracticePlan["status"],
    successMessage: string,
    successTitle: string,
  ): Promise<void> {
    if (!this.formData.title.trim()) {
      this.toastService.warn(
        "Please add a title before saving this practice plan.",
      );
      return;
    }

    const { data, error } = await this.coachPlanningDataService.savePracticePlan({
      id: this.getPersistedPracticeId(status),
      title: this.formData.title,
      date: this.formData.date.toISOString().split("T")[0],
      startTime: this.formData.startTime,
      endTime: this.formData.endTime,
      durationMinutes: this.formData.durationMinutes,
      location: this.formData.location,
      focus: this.formData.focus,
      equipment: this.formData.equipment,
      activities: this.formData.activities,
      coachNotes: this.formData.coachNotes,
      attendance: this.editingAttendance,
      status,
    });

    if (error || !data) {
      this.logger.error("Failed to save practice", error);
      this.toastService.error(
        error?.message || "Failed to save practice plan. Please try again.",
      );
      return;
    }

    this.toastService.success(successMessage, successTitle);
    this.showDialog = false;
    await this.loadData();
  }

  private getPersistedPracticeId(
    nextStatus: PracticePlan["status"],
  ): string | null {
    if (!this.formData.id) {
      return null;
    }

    const existing = this.practices().find((plan) => plan.id === this.formData.id);
    if (!existing) {
      return null;
    }

    if (
      (nextStatus === "draft" || nextStatus === "template") &&
      existing.status !== "draft" &&
      existing.status !== "template"
    ) {
      return null;
    }

    return existing.id;
  }

  // Helper methods
  getActivityIcon(type: ActivityType): string {
    return ACTIVITY_TYPES.find((t) => t.value === type)?.icon || "pi-list";
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      scheduled: "Scheduled",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      draft: "Draft",
      template: "Template",
    };
    return labels[status] || status;
  }

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    return getStatusSeverityValue(status);
  }

  getEquipmentSummary(equipment: EquipmentItem[]): string {
    return equipment
      .filter((e) => e.checked)
      .map((e) => `${e.name} (${e.quantity})`)
      .join(", ");
  }
}
