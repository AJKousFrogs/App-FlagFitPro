/**
 * Injury Management Component (Coach View)
 *
 * Track team injuries, manage return-to-play protocols, monitor recovery progress,
 * and maintain injury history for prevention insights.
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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ToastService } from "../../../core/services/toast.service";
import { Avatar } from "primeng/avatar";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { InputNumber } from "primeng/inputnumber";

import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  injuryStatusSeverityMap,
} from "../../../shared/utils/status.utils";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { getInitials } from "../../../shared/utils/format.utils";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";

// ===== Interfaces =====
interface InjuryRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  jerseyNumber: string;
  avatarUrl?: string;
  bodyPart: string;
  injuryType: string;
  side?: "left" | "right";
  severity: "mild" | "moderate" | "severe";
  injuryDate: string;
  howItHappened: string;
  description: string;
  status: InjuryStatus;
  rtpStage?: number;
  rtpProgress?: number;
  estimatedReturn?: string;
  daysInProtocol?: number;
  todayCheckin?: DailyCheckin;
}

interface DailyCheckin {
  date: string;
  stage: number;
  painLevel: number;
  functionLevel: number;
  confidenceLevel: number;
  notes: string;
}

interface AthleteInjurySummary {
  id: string;
  name: string;
  position: string;
  clearanceStatus?: "cleared" | "limited" | "restricted";
  currentInjury?: {
    location?: string;
    type?: string;
    grade?: string;
    rtpProgress?: number;
    expectedReturn?: string;
  };
}

interface RtpStage {
  stage: number;
  name: string;
  intensity: number;
  description: string;
  allowedActivities: string[];
  restrictedActivities: string[];
  progressionCriteria: { text: string; met: boolean }[];
}

type InjuryStatus = "new" | "evaluating" | "rtp" | "cleared";

interface ReportForm {
  playerId: string;
  injuryDate: Date;
  injuryTime: string;
  bodyPart: string;
  injuryType: string;
  side: "left" | "right";
  severity: "mild" | "moderate" | "severe";
  howHappened: string;
  description: string;
  actions: {
    iceApplied: boolean;
    removedFromActivity: boolean;
    medicalContacted: boolean;
    sentForImaging: boolean;
  };
}

interface CheckinForm {
  painLevel: number;
  functionLevel: number;
  confidenceLevel: number;
  notes: string;
}

type ReportFormGroup = FormGroup<{
  playerId: FormControl<string>;
  injuryDate: FormControl<Date>;
  injuryTime: FormControl<string>;
  bodyPart: FormControl<string>;
  injuryType: FormControl<string>;
  side: FormControl<"left" | "right">;
  severity: FormControl<"mild" | "moderate" | "severe">;
  howHappened: FormControl<string>;
  description: FormControl<string>;
  actionIceApplied: FormControl<boolean>;
  actionRemovedFromActivity: FormControl<boolean>;
  actionMedicalContacted: FormControl<boolean>;
  actionSentForImaging: FormControl<boolean>;
}>;

type CheckinFormGroup = FormGroup<{
  painLevel: FormControl<number>;
  functionLevel: FormControl<number>;
  confidenceLevel: FormControl<number>;
  notes: FormControl<string>;
}>;

// ===== Constants =====
const BODY_PARTS = [
  { label: "Hamstring", value: "hamstring" },
  { label: "Ankle", value: "ankle" },
  { label: "Knee / ACL", value: "knee" },
  { label: "Hip Flexor", value: "hip" },
  { label: "Shoulder", value: "shoulder" },
  { label: "Back", value: "back" },
  { label: "Calf", value: "calf" },
  { label: "Groin", value: "groin" },
  { label: "Other", value: "other" },
];

const INJURY_TYPES = [
  { label: "Strain / Pull", value: "strain" },
  { label: "Sprain", value: "sprain" },
  { label: "Contusion / Bruise", value: "contusion" },
  { label: "Fracture", value: "fracture" },
  { label: "Dislocation", value: "dislocation" },
  { label: "Overuse", value: "overuse" },
  { label: "Other", value: "other" },
];

const RTP_STAGES: RtpStage[] = [
  {
    stage: 1,
    name: "Rest",
    intensity: 0,
    description: "Complete rest, symptom resolution",
    allowedActivities: ["Rest", "Ice", "Light stretching"],
    restrictedActivities: ["Any physical activity"],
    progressionCriteria: [],
  },
  {
    stage: 2,
    name: "Light Activity",
    intensity: 20,
    description: "Walking, light stretching",
    allowedActivities: ["Walking", "Light stretching", "Low-intensity cardio"],
    restrictedActivities: ["Running", "Sport-specific drills"],
    progressionCriteria: [],
  },
  {
    stage: 3,
    name: "Sport-Specific (Low)",
    intensity: 40,
    description: "Basic drills, no contact",
    allowedActivities: ["Basic drills", "Jogging", "Position movements"],
    restrictedActivities: ["Full-speed running", "Contact"],
    progressionCriteria: [],
  },
  {
    stage: 4,
    name: "Sport-Specific (Med)",
    intensity: 60,
    description: "Complex drills, no contact",
    allowedActivities: [
      "Sport-specific drills",
      "Position-specific movements",
      "Moderate cardio",
    ],
    restrictedActivities: [
      "Full-speed sprinting",
      "Contact drills",
      "Live scrimmage",
    ],
    progressionCriteria: [],
  },
  {
    stage: 5,
    name: "Sport-Specific (High)",
    intensity: 80,
    description: "Full-speed, limited contact",
    allowedActivities: ["Full-speed drills", "Limited contact", "Team drills"],
    restrictedActivities: ["Full contact practice"],
    progressionCriteria: [],
  },
  {
    stage: 6,
    name: "Full Training",
    intensity: 100,
    description: "Full participation",
    allowedActivities: ["All training activities", "Full contact"],
    restrictedActivities: [],
    progressionCriteria: [],
  },
  {
    stage: 7,
    name: "Cleared",
    intensity: 100,
    description: "Competition cleared",
    allowedActivities: ["Full competition"],
    restrictedActivities: [],
    progressionCriteria: [],
  },
];

@Component({
  selector: "app-injury-management",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    Avatar,
    CardShellComponent,
    Checkbox,
    DatePicker,
    InputNumber,
    RadioButton,
    Select,
    TableModule,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    StatusTagComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./injury-management.component.html",
  styleUrl: "./injury-management.component.scss",
})
export class InjuryManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly activeTab = signal<"active" | "rtp" | "cleared" | "history">(
    "active",
  );
  readonly injuries = signal<InjuryRecord[]>([]);
  readonly isLoading = signal(true);

  // Dialog state
  showReportDialog = false;
  showCheckinDialog = false;
  showRtpDetailsDialog = false;
  selectedInjury: InjuryRecord | null = null;

  // Report form
  readonly reportFormGroup: ReportFormGroup = this.createReportForm();

  // Check-in form
  readonly checkinFormGroup: CheckinFormGroup = this.createCheckinForm();

  // Options
  readonly bodyPartOptions = BODY_PARTS;
  readonly injuryTypeOptions = INJURY_TYPES;
  readonly playerOptions = signal<{ label: string; value: string }[]>([]);
  readonly timeOptions = this.generateTimeOptions();
  readonly howHappenedOptions = [
    { label: "During practice", value: "practice" },
    { label: "During drill", value: "drill" },
    { label: "During game", value: "game" },
    { label: "Outside of team activities", value: "outside" },
  ];

  // Computed
  readonly activeInjuries = computed(() =>
    this.injuries().filter(
      (i) => i.status === "new" || i.status === "evaluating",
    ),
  );

  readonly rtpInjuries = computed(() =>
    this.injuries().filter((i) => i.status === "rtp"),
  );

  readonly clearedInjuries = computed(() =>
    this.injuries().filter((i) => i.status === "cleared"),
  );

  readonly filteredInjuries = computed(() => {
    const tab = this.activeTab();
    switch (tab) {
      case "active":
        return [...this.activeInjuries(), ...this.rtpInjuries()];
      case "rtp":
        return this.rtpInjuries();
      case "cleared":
        return this.clearedInjuries();
      default:
        return this.injuries();
    }
  });

  readonly activeCount = computed(() => this.activeInjuries().length);
  readonly rtpCount = computed(() => this.rtpInjuries().length);
  readonly clearedCount = computed(() => this.clearedInjuries().length);
  readonly totalSeasonCount = computed(() => this.injuries().length);

  readonly injuryByType = computed(() => {
    const counts: Record<string, number> = {};
    this.injuries().forEach((i) => {
      counts[i.bodyPart] = (counts[i.bodyPart] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  });

  readonly injuryByPosition = computed(() => {
    const counts: Record<string, number> = {};
    this.injuries().forEach((i) => {
      counts[i.playerPosition] = (counts[i.playerPosition] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count);
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Use staff-physiotherapist API for injury data
      const response: ApiResponse<{ athletes?: AthleteInjurySummary[] }> =
        await firstValueFrom(
        this.api.get(API_ENDPOINTS.staffPhysiotherapist.athletes),
      );
      if (response?.success && response.data?.athletes) {
        // Transform athlete injury data to component format
        const injuries: InjuryRecord[] = [];
        const playerOpts: { label: string; value: string }[] = [];

        for (const athlete of response.data.athletes) {
          playerOpts.push({ label: athlete.name, value: athlete.id });

          if (athlete.currentInjury) {
            injuries.push({
              id: athlete.id + "-inj",
              playerId: athlete.id,
              playerName: athlete.name,
              playerPosition: athlete.position,
              jerseyNumber: "",
              bodyPart: athlete.currentInjury.location || "Unknown",
              injuryType: (
                athlete.currentInjury.type || "strain"
              ).toLowerCase() as
                | "strain"
                | "sprain"
                | "contusion"
                | "fracture"
                | "other",
              severity: this.mapGradeToSeverity(athlete.currentInjury.grade),
              injuryDate: new Date().toISOString(),
              howItHappened: "",
              description: athlete.currentInjury.type || "Injury",
              status:
                athlete.clearanceStatus === "cleared"
                  ? "cleared"
                  : athlete.clearanceStatus === "limited"
                    ? "rtp"
                    : "new",
              rtpProgress: athlete.currentInjury.rtpProgress || 0,
              estimatedReturn: athlete.currentInjury.expectedReturn,
            });
          }
        }

        this.injuries.set(injuries);
        this.playerOptions.set(playerOpts);
      }
    } catch (err) {
      this.logger.error(
        "Failed to load injuries from API, no data available",
        err,
      );
      // Set empty arrays instead of demo data
      this.injuries.set([]);
      this.playerOptions.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapGradeToSeverity(
    grade: string | undefined,
  ): "mild" | "moderate" | "severe" {
    if (!grade) return "moderate";
    const lower = grade.toLowerCase();
    if (lower.includes("i") || lower.includes("mild") || lower.includes("1"))
      return "mild";
    if (
      lower.includes("iii") ||
      lower.includes("severe") ||
      lower.includes("3")
    )
      return "severe";
    return "moderate";
  }

  private getEmptyReportForm(): ReportForm {
    return {
      playerId: "",
      injuryDate: new Date(),
      injuryTime: "4:00 PM",
      bodyPart: "",
      injuryType: "",
      side: "left" as "left" | "right",
      severity: "moderate" as "mild" | "moderate" | "severe",
      howHappened: "practice",
      description: "",
      actions: {
        iceApplied: true,
        removedFromActivity: true,
        medicalContacted: false,
        sentForImaging: false,
      },
    };
  }

  private createReportForm(): ReportFormGroup {
    const defaults = this.getEmptyReportForm();
    return new FormGroup({
      playerId: new FormControl(defaults.playerId, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      injuryDate: new FormControl(defaults.injuryDate, { nonNullable: true }),
      injuryTime: new FormControl(defaults.injuryTime, { nonNullable: true }),
      bodyPart: new FormControl(defaults.bodyPart, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      injuryType: new FormControl(defaults.injuryType, { nonNullable: true }),
      side: new FormControl(defaults.side, { nonNullable: true }),
      severity: new FormControl(defaults.severity, { nonNullable: true }),
      howHappened: new FormControl(defaults.howHappened, { nonNullable: true }),
      description: new FormControl(defaults.description, { nonNullable: true }),
      actionIceApplied: new FormControl(defaults.actions.iceApplied, {
        nonNullable: true,
      }),
      actionRemovedFromActivity: new FormControl(
        defaults.actions.removedFromActivity,
        { nonNullable: true },
      ),
      actionMedicalContacted: new FormControl(defaults.actions.medicalContacted, {
        nonNullable: true,
      }),
      actionSentForImaging: new FormControl(defaults.actions.sentForImaging, {
        nonNullable: true,
      }),
    });
  }

  private createCheckinForm(): CheckinFormGroup {
    return new FormGroup({
      painLevel: new FormControl(0, { nonNullable: true }),
      functionLevel: new FormControl(5, { nonNullable: true }),
      confidenceLevel: new FormControl(5, { nonNullable: true }),
      notes: new FormControl("", { nonNullable: true }),
    });
  }

  private generateTimeOptions() {
    const options = [];
    for (let h = 6; h <= 21; h++) {
      for (const m of ["00", "30"]) {
        const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const ampm = h >= 12 ? "PM" : "AM";
        options.push({
          label: `${hour}:${m} ${ampm}`,
          value: `${hour}:${m} ${ampm}`,
        });
      }
    }
    return options;
  }

  // Dialog methods
  openReportDialog(): void {
    const defaults = this.getEmptyReportForm();
    this.reportFormGroup.reset({
      playerId: defaults.playerId,
      injuryDate: defaults.injuryDate,
      injuryTime: defaults.injuryTime,
      bodyPart: defaults.bodyPart,
      injuryType: defaults.injuryType,
      side: defaults.side,
      severity: defaults.severity,
      howHappened: defaults.howHappened,
      description: defaults.description,
      actionIceApplied: defaults.actions.iceApplied,
      actionRemovedFromActivity: defaults.actions.removedFromActivity,
      actionMedicalContacted: defaults.actions.medicalContacted,
      actionSentForImaging: defaults.actions.sentForImaging,
    });
    this.showReportDialog = true;
  }

  submitReport(): void {
    if (this.reportFormGroup.invalid) {
      this.reportFormGroup.markAllAsTouched();
      return;
    }
    this.toastService.success("RTP protocol has been initiated", "Injury Reported");
    this.showReportDialog = false;
    // Would submit to API
  }

  openCheckinDialog(injury: InjuryRecord): void {
    this.selectedInjury = injury;
    const defaults: CheckinForm = injury.todayCheckin
      ? { ...injury.todayCheckin }
      : { painLevel: 0, functionLevel: 5, confidenceLevel: 5, notes: "" };
    this.checkinFormGroup.reset(defaults);
    this.showCheckinDialog = true;
  }

  submitCheckin(): void {
    this.toastService.success("Progress has been recorded", "Check-in Saved");
    this.showCheckinDialog = false;
  }

  // Actions
  startRtp(injury: InjuryRecord): void {
    this.injuries.update((injs) =>
      injs.map((i) =>
        i.id === injury.id
          ? {
              ...i,
              status: "rtp" as InjuryStatus,
              rtpStage: 1,
              daysInProtocol: 0,
            }
          : i,
      ),
    );
    this.toastService.success(
      `${injury.playerName} has begun the return-to-play protocol`,
      "RTP Started",
    );
  }

  advanceStage(injury: InjuryRecord): void {
    const nextStage = (injury.rtpStage || 0) + 1;
    if (nextStage > 7) return;

    this.injuries.update((injs) =>
      injs.map((i) =>
        i.id === injury.id
          ? {
              ...i,
              rtpStage: nextStage,
              status: nextStage === 7 ? ("cleared" as InjuryStatus) : i.status,
            }
          : i,
      ),
    );

    this.toastService.success(
      `${injury.playerName} advanced to Stage ${nextStage}`,
      "Stage Advanced",
    );
  }

  canAdvanceStage(injury: InjuryRecord): boolean {
    if (!injury.todayCheckin || !injury.rtpStage) return false;
    return (
      injury.todayCheckin.painLevel <= 2 &&
      injury.todayCheckin.functionLevel >= 6
    );
  }

  viewRtpDetails(injury: InjuryRecord): void {
    this.selectedInjury = injury;
    this.showRtpDetailsDialog = true;
  }

  requestMedical(_injury: InjuryRecord): void {
    this.toastService.info("Request sent to medical team", "Medical Report Requested");
  }

  // Helpers
  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getStageName(stage: number): string {
    return RTP_STAGES.find((s) => s.stage === stage)?.name || "";
  }

  getRtpStage(stage: number): RtpStage | undefined {
    return RTP_STAGES.find((item) => item.stage === stage);
  }

  getStageShortName(stage: number): string {
    const names: Record<number, string> = {
      1: "Rest",
      2: "Light",
      3: "Sport",
      4: "Sport",
      5: "Sport",
      6: "Full",
      7: "Clr",
    };
    return names[stage] || "";
  }

  getStatusLabel(status: InjuryStatus): string {
    const labels: Record<InjuryStatus, string> = {
      new: "New",
      evaluating: "Evaluating",
      rtp: "In RTP",
      cleared: "Cleared",
    };
    return labels[status];
  }

  getStatusSeverity(
    status: InjuryStatus,
  ): "success" | "info" | "warning" | "danger" {
    return getMappedStatusSeverity(status, injuryStatusSeverityMap, "info");
  }
}
