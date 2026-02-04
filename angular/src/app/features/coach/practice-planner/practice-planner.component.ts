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
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { MessageService, PrimeTemplate } from "primeng/api";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";

import { Select } from "primeng/select";

import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { getStatusSeverity as getStatusSeverityValue } from "../../../shared/utils/status.utils";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

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
  attendance: { confirmed: number; pending: number; total: number };
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
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
  { value: "warmup", label: "Warm-up", icon: "🏃" },
  { value: "position", label: "Position Work", icon: "🎯" },
  { value: "offense", label: "Team Offense", icon: "🏈" },
  { value: "defense", label: "Team Defense", icon: "🛡️" },
  { value: "scrimmage", label: "Scrimmage", icon: "⚔️" },
  { value: "cooldown", label: "Cool Down", icon: "😌" },
  { value: "conditioning", label: "Conditioning", icon: "💪" },
  { value: "film", label: "Film Review", icon: "📹" },
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    Card,
    Checkbox,
    DatePicker,
    Dialog,
    PrimeTemplate,
    InputNumber,
    InputText,
    Select,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
<div class="practice-planner-page">
        <app-page-header
          title="Practice Planner"
          subtitle="Design detailed practice sessions"
          icon="pi-calendar"
        >
          <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
            >New Practice Plan</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'upcoming'"
            (click)="activeTab.set('upcoming')"
          >
            Upcoming Practices
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'past'"
            (click)="activeTab.set('past')"
          >
            Past Practices
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'templates'"
            (click)="activeTab.set('templates')"
          >
            Templates
          </button>
        </div>

        <!-- Practice List -->
        @if (filteredPractices().length > 0) {
          <div class="practices-list">
            @for (practice of filteredPractices(); track practice.id) {
              <p-card styleClass="practice-card">
                <div class="practice-header">
                  <div class="practice-title">
                    <span class="practice-icon">🏋️</span>
                    <h4>{{ practice.title }}</h4>
                    <app-status-tag
                      [value]="getStatusLabel(practice.status)"
                      [severity]="getStatusSeverity(practice.status)"
                      size="sm"
                    />
                  </div>
                  <div class="practice-actions">
                    <app-button
                      variant="secondary"
                      size="sm"
                      iconLeft="pi-pencil"
                      (clicked)="editPractice(practice)"
                      >Edit</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-copy"
                      (clicked)="copyPractice(practice)"
                      >Copy</app-button
                    >
                    <app-button
                      size="sm"
                      iconLeft="pi-play"
                      [disabled]="practice.status !== 'scheduled'"
                      (clicked)="startPractice(practice)"
                      >Start</app-button
                    >
                  </div>
                </div>

                <div class="practice-info">
                  <div class="info-row">
                    <i class="pi pi-calendar"></i>
                    <span>{{ practice.date | date: "EEEE, MMM d, y" }}</span>
                  </div>
                  <div class="info-row">
                    <i class="pi pi-clock"></i>
                    <span
                      >{{ practice.startTime }} - {{ practice.endTime }} ({{
                        practice.durationMinutes
                      }}
                      min)</span
                    >
                  </div>
                  <div class="info-row">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ practice.location }}</span>
                  </div>
                </div>

                <div class="practice-focus">
                  <strong>Focus:</strong> {{ practice.focus }}
                </div>

                @if (practice.equipment.length > 0) {
                  <div class="practice-equipment">
                    <strong>Equipment:</strong>
                    {{ getEquipmentSummary(practice.equipment) }}
                  </div>
                }

                <!-- Timeline Preview -->
                <div class="timeline-preview">
                  <h5>Timeline Preview:</h5>
                  <div class="timeline-items">
                    @for (activity of practice.activities; track activity.id) {
                      <div class="timeline-item">
                        <span class="item-time">{{ activity.startTime }}</span>
                        <span class="activity">{{ activity.title }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="attendance-row">
                  <span>Attendance:</span>
                  <span class="attendance-stats">
                    {{ practice.attendance.confirmed }}/{{
                      practice.attendance.total
                    }}
                    confirmed
                    @if (practice.attendance.pending > 0) {
                      <span class="pending"
                        >({{ practice.attendance.pending }} pending)</span
                      >
                    }
                  </span>
                </div>
              </p-card>
            }
          </div>
        } @else {
          <p-card styleClass="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-calendar"></i>
              <h3>No Practices Found</h3>
              <p>Create your first practice plan</p>
              <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
                >Create Practice</app-button
              >
            </div>
          </p-card>
        }
      </div>

      <!-- Create/Edit Dialog -->
      <p-dialog
        [(visible)]="showDialog"
        [header]="isEditing() ? 'Edit Practice Plan' : 'Create Practice Plan'"
        [modal]="true"
        styleClass="practice-dialog"
      >
        <div class="practice-form">
          <!-- Details Section -->
          <div class="form-section">
            <h4>Practice Details</h4>

            <div class="form-field">
              <label for="practiceTitle">Practice Title</label>
              <input
                id="practiceTitle"
                type="text"
                pInputText
                [(ngModel)]="formData.title"
                placeholder="e.g., Tuesday Practice - Red Zone Focus"
                class="w-full"
              />
            </div>

            <div class="form-row three-col">
              <div class="form-field">
                <label for="practiceDate">Date</label>
                <p-datepicker
                  inputId="practiceDate"
                  [(ngModel)]="formData.date"
                  [showIcon]="true"
                  dateFormat="M d, yy"
                ></p-datepicker>
              </div>
              <div class="form-field">
                <label for="startTime">Start Time</label>
                <p-select
                  inputId="startTime"
                  [options]="timeOptions"
                  [(ngModel)]="formData.startTime"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>
              <div class="form-field">
                <label for="endTime">End Time</label>
                <p-select
                  inputId="endTime"
                  [options]="timeOptions"
                  [(ngModel)]="formData.endTime"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>
            </div>

            <div class="form-field">
              <label for="location">Location</label>
              <p-select
                inputId="location"
                [options]="locationOptions"
                [(ngModel)]="formData.location"
                optionLabel="label"
                optionValue="value"
                [editable]="true"
              ></p-select>
            </div>

            <div class="form-field">
              <label for="focus">Practice Focus (main objectives)</label>
              <input
                id="focus"
                type="text"
                pInputText
                [(ngModel)]="formData.focus"
                placeholder="e.g., Red zone offense, Defensive rotations"
                class="w-full"
              />
            </div>
          </div>

          <!-- Timeline Section -->
          <div class="form-section">
            <div class="section-header">
              <h4>Practice Timeline</h4>
              <div class="duration-summary">
                <span>Total: {{ formData.durationMinutes }} min</span>
                <span>Allocated: {{ allocatedMinutes() }} min</span>
                <span [class.warning]="remainingMinutes() < 0">
                  Remaining: {{ remainingMinutes() }} min
                </span>
              </div>
            </div>

            <div class="timeline-editor">
              @for (
                activity of formData.activities;
                track activity.id;
                let i = $index
              ) {
                <div class="activity-block">
                  <div class="activity-header">
                    <span class="item-time">{{ activity.startTime }}</span>
                    <span class="activity-icon">{{
                      getActivityIcon(activity.type)
                    }}</span>
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="activity.title"
                      class="activity-title-input"
                    />
                    <p-inputNumber
                      [(ngModel)]="activity.durationMinutes"
                      suffix=" min"
                      [min]="5"
                      [max]="60"
                      styleClass="activity-duration-input"
                      (ngModelChange)="updateActivityTimes()"
                    ></p-inputNumber>
                    <app-button
                      variant="text"
                      iconLeft="pi-pencil"
                      (clicked)="editActivity(activity)"
                      >Edit activity</app-button
                    >
                    <app-button
                      variant="text"
                      iconLeft="pi-times"
                      (clicked)="removeActivity(i)"
                      >Remove activity</app-button
                    >
                  </div>
                  @if (activity.details.length > 0) {
                    <div class="activity-details">
                      <ul>
                        @for (detail of activity.details; track detail) {
                          <li>{{ detail }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            </div>

            <app-button
              variant="text"
              iconLeft="pi-plus"
              (clicked)="addActivity()"
              >Add Activity Block</app-button
            >
          </div>

          <!-- Equipment Section -->
          <div class="form-section">
            <h4>Equipment Needed</h4>
            <div class="equipment-grid">
              @for (item of formData.equipment; track item.name) {
                <div class="equipment-item">
                  <p-checkbox
                    [(ngModel)]="item.checked"
                    [binary]="true"
                    variant="filled"
                    [inputId]="'eq-' + item.name"
                  ></p-checkbox>
                  <label [for]="'eq-' + item.name"
                    >{{ item.name }} ({{ item.quantity }})</label
                  >
                </div>
              }
            </div>
          </div>

          <!-- Coach Notes -->
          <div class="form-section">
            <h4>Notes for Coaches</h4>
            <textarea
              pTextarea
              [(ngModel)]="formData.coachNotes"
              placeholder="• Player-specific instructions&#10;• Key coaching points&#10;• Modifications needed"
              rows="4"
            ></textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="saveDraft()"
            >Save as Draft</app-button
          >
          <app-button variant="text" (clicked)="saveAsTemplate()"
            >Save as Template</app-button
          >
          <app-button variant="text" (clicked)="showDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [disabled]="!formData.title"
            (clicked)="saveAndNotify()"
            >Save & Notify Team</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Activity Editor Dialog -->
      <p-dialog
        [(visible)]="showActivityDialog"
        [header]="'Edit Activity: ' + (editingActivity?.title || '')"
        [modal]="true"
        styleClass="practice-activity-dialog"
      >
        @if (editingActivity) {
          <div class="activity-form">
            <div class="form-row">
              <div class="form-field">
                <label for="actType">Activity Type</label>
                <p-select
                  inputId="actType"
                  [options]="activityTypeOptions"
                  [(ngModel)]="editingActivity.type"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>
              <div class="form-field">
                <label for="actDuration">Duration (min)</label>
                <p-inputNumber
                  inputId="actDuration"
                  [(ngModel)]="editingActivity.durationMinutes"
                  [min]="5"
                  [max]="60"
                ></p-inputNumber>
              </div>
            </div>

            <div class="form-field">
              <label>Activity Details</label>
              <div class="details-list">
                @for (
                  detail of editingActivity.details;
                  track detail;
                  let i = $index
                ) {
                  <div class="detail-row">
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="editingActivity.details[i]"
                      class="w-full"
                    />
                    <app-button
                      variant="text"
                      iconLeft="pi-times"
                      (clicked)="removeDetail(i)"
                      >Remove</app-button
                    >
                  </div>
                }
              </div>
              <app-button
                variant="text"
                size="sm"
                iconLeft="pi-plus"
                (clicked)="addDetail()"
                >Add Detail</app-button
              >
            </div>

            @if (editingActivity.type === "offense") {
              <div class="form-field">
                <label>Plays to Run</label>
                <textarea
                  pTextarea
                  [ngModel]="
                    editingActivity.plays?.join(
                      '
'
                    )
                  "
                  (ngModelChange)="updatePlays($event)"
                  placeholder="One play per line"
                  rows="4"
                ></textarea>
              </div>

              <div class="form-field">
                <label>Key Coaching Points</label>
                <textarea
                  pTextarea
                  [ngModel]="
                    editingActivity.keyPoints?.join(
                      '
'
                    )
                  "
                  (ngModelChange)="updateKeyPoints($event)"
                  placeholder="One point per line"
                  rows="3"
                ></textarea>
              </div>
            }
          </div>

          <ng-template pTemplate="footer">
            <app-button
              variant="secondary"
              (clicked)="showActivityDialog = false"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-check" (clicked)="saveActivity()"
              >Save Activity</app-button
            >
          </ng-template>
        }
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./practice-planner.component.scss",
})
export class PracticePlannerComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly activeTab = signal<"upcoming" | "past" | "templates">("upcoming");
  readonly practices = signal<PracticePlan[]>([]);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);

  // Dialog state
  showDialog = false;
  showActivityDialog = false;
  editingActivity: ActivityBlock | null = null;

  // Form data
  formData = this.getEmptyFormData();

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
        (p) => p.date >= now && p.status !== "cancelled",
      );
    } else if (tab === "past") {
      return this.practices().filter(
        (p) => p.date < now || p.status === "completed",
      );
    }
    return [];
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

    try {
      const response = await firstValueFrom(
        this.api.get<{ practices?: PracticePlan[] }>("/api/coach/practices"),
      );
      if (response?.success && response.data?.practices) {
        this.practices.set(response.data.practices);
      }
    } catch (err) {
      this.logger.error("Failed to load practices", err);
      // No data available - show empty state
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEmptyFormData() {
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
    this.showDialog = true;
  }

  editPractice(practice: PracticePlan): void {
    this.isEditing.set(true);
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
        id: `new-${Date.now()}-${Math.random()}`,
        details: [...a.details],
      })),
      coachNotes: practice.coachNotes,
    };
    this.showDialog = true;
  }

  startPractice(_practice: PracticePlan): void {
    this.messageService.add({
      severity: "info",
      summary: "Starting Practice",
      detail: "Live practice mode would start here",
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
    this.formData.activities.push(newActivity);
  }

  removeActivity(index: number): void {
    this.formData.activities.splice(index, 1);
    this.updateActivityTimes();
  }

  editActivity(activity: ActivityBlock): void {
    this.editingActivity = { ...activity, details: [...activity.details] };
    this.showActivityDialog = true;
  }

  saveActivity(): void {
    if (!this.editingActivity) return;

    const index = this.formData.activities.findIndex(
      (a) => a.id === this.editingActivity?.id,
    );
    if (index >= 0) {
      this.formData.activities[index] = { ...this.editingActivity };
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
    let currentTime = this.formData.startTime;
    for (const activity of this.formData.activities) {
      activity.startTime = currentTime;
      currentTime = this.addMinutesToTime(
        currentTime,
        activity.durationMinutes,
      );
    }
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
  saveDraft(): void {
    this.messageService.add({
      severity: "success",
      summary: "Draft Saved",
      detail: `${this.formData.title} saved as draft`,
    });
    this.showDialog = false;
  }

  saveAsTemplate(): void {
    this.messageService.add({
      severity: "success",
      summary: "Template Saved",
      detail: `${this.formData.title} saved as template`,
    });
  }

  saveAndNotify(): void {
    if (!this.formData.title) return;

    this.api.post("/api/coach/practices", this.formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Practice Saved",
          detail: "Team has been notified",
        });
        this.showDialog = false;
        this.loadData();
      },
      error: (err) => this.logger.error("Failed to save practice", err),
    });
  }

  // Helper methods
  getActivityIcon(type: ActivityType): string {
    return ACTIVITY_TYPES.find((t) => t.value === type)?.icon || "📋";
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      scheduled: "Scheduled",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
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
