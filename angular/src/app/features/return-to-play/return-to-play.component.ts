/**
 * Return-to-Play Protocol Component
 *
 * Evidence-based graduated protocols for athletes returning from injury.
 * Implements 7-stage protocol with daily tracking and progression criteria.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../core/services/toast.service";

import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { Slider } from "primeng/slider";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import {
  RTPPhaseCelebrationComponent,
  RTPPhaseInfo,
} from "../../shared/components/rtp-phase-celebration/rtp-phase-celebration.component";

import { UI_LIMITS } from "../../core/constants/app.constants";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { ApiResponse } from "../../core/models/common.models";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import {
  LazyChartComponent,
  LazyChartData,
} from "../../shared/components/lazy-chart/lazy-chart.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";

// ===== Interfaces =====
interface ProtocolStage {
  stage: number;
  name: string;
  shortName: string;
  loadPercentage: number;
  minimumDays: number;
  activities: string[];
  restrictions: string[];
  progressionCriteria: string[];
}

interface ActiveProtocol {
  id: string;
  injuryType: string;
  injuryLocation: string;
  severity: string;
  startDate: string;
  targetReturnDate: string;
  currentStage: number;
  daysInRecovery: number;
  daysInCurrentStage: number;
  progressPercentage: number;
  criteriaCompleted: boolean[];
  medicalNotes?: string;
}

interface DailyCheckin {
  id: string;
  date: string;
  painLevel: number;
  functionScore: number;
  confidenceLevel: number;
  activitiesCompleted: string[];
  notes?: string;
}

interface NewProtocolForm {
  injuryType: string | null;
  injuryLocation: string | null;
  severity: string | null;
  injuryDate: Date | null;
  targetReturnDate: Date | null;
  medicalNotes: string;
  understandProtocol: boolean;
  notifyCoach: boolean;
}

interface TodayCheckinForm {
  painLevel: number;
  functionScore: number;
  confidenceLevel: number;
  activitiesCompleted: string[];
  notes: string;
}

// ===== Constants =====
const PROTOCOL_STAGES: ProtocolStage[] = [
  {
    stage: 1,
    name: "Initial Rest",
    shortName: "Rest",
    loadPercentage: 0,
    minimumDays: 2,
    activities: [
      "Complete rest",
      "Ice application",
      "Compression",
      "Elevation",
      "Medical treatment",
    ],
    restrictions: [
      "No running",
      "No sport activity",
      "No weight bearing (if applicable)",
    ],
    progressionCriteria: [
      "Pain at rest < 2/10",
      "Swelling significantly reduced",
      "Able to perform daily activities",
    ],
  },
  {
    stage: 2,
    name: "Light Activity",
    shortName: "Light Activ",
    loadPercentage: 20,
    minimumDays: 3,
    activities: [
      "Walking",
      "Gentle stretching",
      "Pool walking/swimming",
      "Light mobility work",
    ],
    restrictions: [
      "No sprinting",
      "No cutting movements",
      "No sport-specific drills",
    ],
    progressionCriteria: [
      "Pain-free walking",
      "ROM 90% of normal",
      "No swelling after activity",
    ],
  },
  {
    stage: 3,
    name: "Sport-Specific Low",
    shortName: "Sport Low",
    loadPercentage: 40,
    minimumDays: 3,
    activities: [
      "Position drills at low intensity",
      "Light jogging",
      "Basic footwork",
      "Throwing/catching (if applicable)",
    ],
    restrictions: [
      "No full-speed running",
      "No contact",
      "No explosive movements",
    ],
    progressionCriteria: [
      "Pain-free at 40% intensity",
      "Light jogging without discomfort",
      "No next-day soreness",
    ],
  },
  {
    stage: 4,
    name: "Sport-Specific Moderate",
    shortName: "Sport Med",
    loadPercentage: 60,
    minimumDays: 3,
    activities: [
      "Position-specific drills at 60% intensity",
      "Jogging with direction changes",
      "Non-contact team drills",
      "Controlled agility work",
    ],
    restrictions: [
      "No full-speed sprinting",
      "No competition/scrimmage",
      "No explosive cutting",
      "No plyometrics",
    ],
    progressionCriteria: [
      "Pain-free during all Stage 4 activities",
      "No swelling or tenderness",
      "3 consecutive pain-free sessions",
      "ROM > 90% of uninjured side",
      "Strength > 80% of uninjured side",
    ],
  },
  {
    stage: 5,
    name: "Sport-Specific High",
    shortName: "Sport High",
    loadPercentage: 80,
    minimumDays: 3,
    activities: [
      "Full drills at 80% intensity",
      "Sprint work",
      "Agility drills",
      "Non-contact scrimmage participation",
    ],
    restrictions: ["No full competition", "Limited contact"],
    progressionCriteria: [
      "Sprint pain-free",
      "Strength > 90% of uninjured side",
      "Full confidence in movements",
      "No compensation patterns",
    ],
  },
  {
    stage: 6,
    name: "Full Training",
    shortName: "Full Train",
    loadPercentage: 100,
    minimumDays: 2,
    activities: [
      "Full team training",
      "Complete practice participation",
      "Contact drills (if applicable)",
      "Game-speed activities",
    ],
    restrictions: ["Monitor closely", "May limit full game minutes initially"],
    progressionCriteria: [
      "Complete full practice without issues",
      "No pain or swelling",
      "Full strength and ROM",
      "Coach approval",
    ],
  },
  {
    stage: 7,
    name: "Full Competition",
    shortName: "Full Comp",
    loadPercentage: 100,
    minimumDays: 0,
    activities: ["Full game participation", "No restrictions"],
    restrictions: [],
    progressionCriteria: [
      "Medical clearance",
      "Coach clearance",
      "Player confidence",
    ],
  },
];

const INJURY_TYPES = [
  { label: "Muscle Strain", value: "muscle_strain" },
  { label: "Ligament Sprain", value: "ligament_sprain" },
  { label: "Tendinopathy", value: "tendinopathy" },
  { label: "Bone Stress", value: "bone_stress" },
  { label: "Concussion", value: "concussion" },
  { label: "Illness", value: "illness" },
  { label: "General Absence (2+ weeks)", value: "general_absence" },
];

const INJURY_LOCATIONS = [
  { label: "Left Hamstring", value: "left_hamstring" },
  { label: "Right Hamstring", value: "right_hamstring" },
  { label: "Left Quad", value: "left_quad" },
  { label: "Right Quad", value: "right_quad" },
  { label: "Left Ankle", value: "left_ankle" },
  { label: "Right Ankle", value: "right_ankle" },
  { label: "Left Knee", value: "left_knee" },
  { label: "Right Knee", value: "right_knee" },
  { label: "Lower Back", value: "lower_back" },
  { label: "Shoulder", value: "shoulder" },
  { label: "Groin", value: "groin" },
  { label: "Calf", value: "calf" },
  { label: "Head/Neck", value: "head_neck" },
  { label: "Other", value: "other" },
];

const SEVERITY_LEVELS = [
  { label: "Mild (Grade I)", value: "mild", days: 7 },
  { label: "Moderate (Grade II)", value: "moderate", days: 14 },
  { label: "Severe (Grade III)", value: "severe", days: 28 },
];

@Component({
  selector: "app-return-to-play",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LazyChartComponent,
    AppDialogComponent,
    ProgressBar,
    Select,
    Slider,
    TableModule,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    CardShellComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    PageHeaderComponent,
    ButtonComponent,
    RTPPhaseCelebrationComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./return-to-play.component.html",
  styleUrl: "./return-to-play.component.scss",
})
export class ReturnToPlayComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // Constants exposed to template
  protected readonly UI_LIMITS = UI_LIMITS;

  // State
  readonly activeProtocol = signal<ActiveProtocol | null>(null);
  readonly recentCheckins = signal<DailyCheckin[]>([]);
  readonly showStartDialog = signal(false);
  readonly isStartingProtocol = signal(false);
  readonly isSavingCheckin = signal(false);
  readonly chartData = signal<LazyChartData | null>(null);

  // Phase 2.3: RTP Phase Celebration
  readonly showPhaseCelebration = signal(false);
  readonly phaseCelebrationInfo = signal<RTPPhaseInfo | null>(null);
  readonly previousPhaseDays = signal<number>(0);

  // Constants
  readonly protocolStages = PROTOCOL_STAGES;
  readonly injuryTypes = INJURY_TYPES;
  readonly injuryLocations = INJURY_LOCATIONS;
  readonly severityLevels = SEVERITY_LEVELS;
  readonly today = new Date();

  // Form data
  newProtocol: NewProtocolForm = this.getEmptyProtocolForm();
  todayCheckin: TodayCheckinForm = this.getEmptyCheckinForm();

  // Chart options
  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
      },
    },
  };

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const response: ApiResponse<{
        activeProtocol?: ActiveProtocol;
        checkins?: DailyCheckin[];
      }> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.returnToPlay.base),
      );
      if (response?.success && response.data) {
        if (response.data.activeProtocol) {
          this.activeProtocol.set(response.data.activeProtocol);
        }
        if (response.data.checkins) {
          this.recentCheckins.set(response.data.checkins);
          this.updateChartData(response.data.checkins);
        }
      }
    } catch (err) {
      this.logger.error("Failed to load return-to-play data", err);
      // No active protocol - user hasn't started one
      this.activeProtocol.set(null);
      this.recentCheckins.set([]);
    }
  }

  private updateChartData(checkins: DailyCheckin[]): void {
    if (checkins.length === 0) {
      this.chartData.set(null);
      return;
    }

    const reversed = [...checkins].reverse();
    this.chartData.set({
      labels: reversed.map((c) =>
        new Date(c.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      ),
      datasets: [
        {
          label: "Pain Level",
          data: reversed.map((c) => c.painLevel),
          borderColor: "var(--color-status-error)",
          backgroundColor: "rgba(var(--primitive-error-500-rgb), 0.1)",
          tension: 0.3,
        },
        {
          label: "Function Score (÷10)",
          data: reversed.map((c) => c.functionScore / 10),
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.1)",
          tension: 0.3,
        },
      ],
    });
  }

  getCurrentStage(): ProtocolStage {
    const protocol = this.activeProtocol();
    if (!protocol) return PROTOCOL_STAGES[0];
    return PROTOCOL_STAGES[protocol.currentStage - 1] || PROTOCOL_STAGES[0];
  }

  canAdvanceStage(): boolean {
    const protocol = this.activeProtocol();
    if (!protocol) return false;

    const currentStage = this.getCurrentStage();
    const allCriteriaComplete = protocol.criteriaCompleted.every((c) => c);
    const minDaysMet = protocol.daysInCurrentStage >= currentStage.minimumDays;

    return allCriteriaComplete && minDaysMet && protocol.currentStage < 7;
  }

  async advanceStage(): Promise<void> {
    const protocol = this.activeProtocol();
    if (!protocol || !this.canAdvanceStage()) return;

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.returnToPlay.advance, {
          protocolId: protocol.id,
        }),
      );

      // Phase 2.3: Store previous phase days for celebration
      const previousPhaseDays = protocol.daysInCurrentStage;
      const newStage = protocol.currentStage + 1;
      const _currentStageData = PROTOCOL_STAGES[protocol.currentStage - 1]; // Available for stage comparison
      const nextStageData = PROTOCOL_STAGES[newStage - 1];

      // Update local state
      this.activeProtocol.update((p) => {
        if (!p) return p;
        return {
          ...p,
          currentStage: newStage,
          daysInCurrentStage: 0,
          criteriaCompleted: new Array(
            PROTOCOL_STAGES[newStage - 1].progressionCriteria.length,
          ).fill(false),
          progressPercentage: Math.round((newStage / 7) * 100),
        };
      });

      // Phase 2.3: Show celebration
      this.previousPhaseDays.set(previousPhaseDays);
      this.phaseCelebrationInfo.set({
        currentPhase: newStage,
        phaseName: nextStageData.name,
        daysInPhase: 0,
        minimumDays: nextStageData.minimumDays,
        allowedActivities: nextStageData.activities,
        restrictions: nextStageData.restrictions,
        progressionCriteria: nextStageData.progressionCriteria,
        nextPhase:
          newStage < 7
            ? {
                phase: newStage + 1,
                name: PROTOCOL_STAGES[newStage]?.name || "",
                unlockCriteria:
                  PROTOCOL_STAGES[newStage]?.progressionCriteria || [],
              }
            : undefined,
      });
      this.showPhaseCelebration.set(true);

      this.toastService.success(
        `Congratulations! You've progressed to Stage ${newStage}`,
        "Stage Advanced",
        4000,
      );
    } catch (err) {
      this.logger.error("Failed to advance stage", err);
      this.toastService.error("Failed to advance stage. Please try again.");
    }
  }

  updateCriterion(index: number, event: { checked?: boolean }): void {
    const protocol = this.activeProtocol();
    if (!protocol) return;

    // Update local state immediately for responsiveness
    this.activeProtocol.update((p) => {
      if (!p) return p;
      const newCriteria = [...p.criteriaCompleted];
      newCriteria[index] = event.checked ?? false;
      return { ...p, criteriaCompleted: newCriteria };
    });

    // Save to backend
    this.api
      .post(API_ENDPOINTS.returnToPlay.criterion, {
        protocolId: protocol.id,
        criterionIndex: index,
        completed: event.checked,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: (err) => this.logger.error("Failed to update criterion", err),
      });
  }

  async saveCheckin(): Promise<void> {
    this.isSavingCheckin.set(true);

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.returnToPlay.checkin, {
          protocolId: this.activeProtocol()?.id,
          ...this.todayCheckin,
        }),
      );

      // Add to local checkins
      const newCheckin: DailyCheckin = {
        id: Date.now().toString(),
        date: new Date().toISOString().split("T")[0],
        ...this.todayCheckin,
      };
      this.recentCheckins.update((checkins) => [newCheckin, ...checkins]);
      this.updateChartData([newCheckin, ...this.recentCheckins()]);

      // Reset form
      this.todayCheckin = this.getEmptyCheckinForm();

      this.toastService.success(
        "Your daily recovery check-in has been recorded.",
        "Check-in Saved",
      );
    } catch (err) {
      this.logger.error("Failed to save checkin", err);
      this.toastService.error("Failed to save check-in. Please try again.");
    } finally {
      this.isSavingCheckin.set(false);
    }
  }

  openStartDialog(): void {
    this.newProtocol = this.getEmptyProtocolForm();
    this.showStartDialog.set(true);
  }

  closeStartDialog(): void {
    this.showStartDialog.set(false);
  }

  onSeverityChange(): void {
    // Auto-calculate target return date based on severity
    const severity = SEVERITY_LEVELS.find(
      (s) => s.value === this.newProtocol.severity,
    );
    if (severity && this.newProtocol.injuryDate) {
      const targetDate = new Date(this.newProtocol.injuryDate);
      targetDate.setDate(targetDate.getDate() + severity.days);
      this.newProtocol = { ...this.newProtocol, targetReturnDate: targetDate };
    }
  }

  updateTodayCheckinMetric(
    field: "painLevel" | "functionScore" | "confidenceLevel",
    value: number | null | undefined,
  ): void {
    const fallback: Record<typeof field, number> = {
      painLevel: 0,
      functionScore: 0,
      confidenceLevel: 1,
    };
    this.todayCheckin = {
      ...this.todayCheckin,
      [field]: value ?? fallback[field],
    };
  }

  updateTodayCheckinActivities(value: string[] | null | undefined): void {
    this.todayCheckin = {
      ...this.todayCheckin,
      activitiesCompleted: value ?? [],
    };
  }

  updateTodayCheckinNotes(value: string | null | undefined): void {
    this.todayCheckin = { ...this.todayCheckin, notes: value ?? "" };
  }

  updateNewProtocolField(
    field: "injuryType" | "injuryLocation",
    value: string | null | undefined,
  ): void {
    this.newProtocol = { ...this.newProtocol, [field]: value ?? null };
  }

  updateProtocolSeverity(value: string | null | undefined): void {
    this.newProtocol = { ...this.newProtocol, severity: value ?? null };
    this.onSeverityChange();
  }

  updateProtocolDate(
    field: "injuryDate" | "targetReturnDate",
    value: Date | null | undefined,
  ): void {
    this.newProtocol = { ...this.newProtocol, [field]: value ?? null };
    if (field === "injuryDate") {
      this.onSeverityChange();
    }
  }

  updateProtocolDateInput(
    field: "injuryDate" | "targetReturnDate",
    value: string,
  ): void {
    this.updateProtocolDate(field, this.parseDateInputValue(value));
  }

  updateProtocolMedicalNotes(value: string | null | undefined): void {
    this.newProtocol = { ...this.newProtocol, medicalNotes: value ?? "" };
  }

  updateProtocolToggle(
    field: "understandProtocol" | "notifyCoach",
    value: boolean | null | undefined,
  ): void {
    this.newProtocol = { ...this.newProtocol, [field]: value ?? false };
  }

  toggleTodayCheckinActivity(activity: string, checked: boolean): void {
    const current = this.todayCheckin.activitiesCompleted;
    const next = checked
      ? Array.from(new Set([...current, activity]))
      : current.filter((item) => item !== activity);
    this.updateTodayCheckinActivities(next);
  }

  isActivitySelected(activity: string): boolean {
    return this.todayCheckin.activitiesCompleted.includes(activity);
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  getProtocolDateInputValue(
    field: "injuryDate" | "targetReturnDate",
  ): string {
    return this.formatDateInputValue(this.newProtocol[field]);
  }

  getTodayDateInputValue(): string {
    return this.formatDateInputValue(this.today);
  }

  private formatDateInputValue(value: Date | null | undefined): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  private parseDateInputValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  isStartFormValid(): boolean {
    return !!(
      this.newProtocol.injuryType &&
      this.newProtocol.injuryLocation &&
      this.newProtocol.severity &&
      this.newProtocol.injuryDate &&
      this.newProtocol.understandProtocol
    );
  }

  async startProtocol(): Promise<void> {
    if (!this.isStartFormValid()) return;

    this.isStartingProtocol.set(true);

    try {
      const response = await firstValueFrom(
        this.api.post(API_ENDPOINTS.returnToPlay.start, this.newProtocol),
      );

      // Create local protocol
      const _severity = SEVERITY_LEVELS.find(
        (s) => s.value === this.newProtocol.severity,
      );
      const proto = this.newProtocol;
      const newProtocol: ActiveProtocol = {
        id:
          (response as { data?: { id: string } })?.data?.id ||
          Date.now().toString(),
        injuryType: proto.injuryType ?? "",
        injuryLocation: proto.injuryLocation ?? "",
        severity: proto.severity ?? "mild",
        startDate:
          proto.injuryDate?.toISOString().split("T")[0] ??
          new Date().toISOString().split("T")[0],
        targetReturnDate:
          this.newProtocol.targetReturnDate?.toISOString().split("T")[0] || "",
        currentStage: 1,
        daysInRecovery: 1,
        daysInCurrentStage: 1,
        progressPercentage: 5,
        criteriaCompleted: new Array(
          PROTOCOL_STAGES[0].progressionCriteria.length,
        ).fill(false),
        medicalNotes: this.newProtocol.medicalNotes,
      };

      this.activeProtocol.set(newProtocol);
      this.closeStartDialog();

      this.toastService.success(
        `Your ${_severity?.days || 14}-day recovery protocol has begun. Follow the stages carefully.`,
        "Protocol Started",
        5000,
      );
    } catch (err) {
      this.logger.error("Failed to start protocol", err);
      this.toastService.error("Failed to start protocol. Please try again.");
    } finally {
      this.isStartingProtocol.set(false);
    }
  }

  // Helper methods
  formatInjuryType(type: string): string {
    return INJURY_TYPES.find((t) => t.value === type)?.label || type;
  }

  formatInjuryLocation(location: string): string {
    return (
      INJURY_LOCATIONS.find((l) => l.value === location)?.label || location
    );
  }

  formatSeverity(severity: string): string {
    return SEVERITY_LEVELS.find((s) => s.value === severity)?.label || severity;
  }

  getSeverityColor(
    severity: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const colors: Record<string, "success" | "warning" | "danger"> = {
      mild: "success",
      moderate: "warning",
      severe: "danger",
    };
    return colors[severity] || "info";
  }

  getEstimatedDays(severity: string): number {
    return SEVERITY_LEVELS.find((s) => s.value === severity)?.days || 14;
  }

  getPainClass(painLevel: number): string {
    if (painLevel <= 3) return "pain-good";
    if (painLevel <= 6) return "pain-moderate";
    return "pain-bad";
  }

  private getEmptyProtocolForm(): NewProtocolForm {
    return {
      injuryType: null as string | null,
      injuryLocation: null as string | null,
      severity: null as string | null,
      injuryDate: new Date() as Date | null,
      targetReturnDate: null as Date | null,
      medicalNotes: "",
      understandProtocol: false,
      notifyCoach: true,
    };
  }

  private getEmptyCheckinForm(): TodayCheckinForm {
    return {
      painLevel: 3,
      functionScore: 50,
      confidenceLevel: 5,
      activitiesCompleted: [] as string[],
      notes: "",
    };
  }
}
