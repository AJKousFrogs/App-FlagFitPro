/**
 * QB Throwing Tracker Component
 *
 * Tracks QB throwing sessions, arm care compliance, and progression toward 320-throw capacity.
 * Shows weekly totals, arm health metrics, and progression phase.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { InputNumber } from "primeng/inputnumber";
import { ProgressBar } from "primeng/progressbar";
import { type SelectChangeEvent } from "primeng/select";
import { Slider } from "primeng/slider";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { Tooltip } from "primeng/tooltip";
import { ToastService } from "../../../core/services/toast.service";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { FeatureFlagsService } from "../../../core/services/feature-flags.service";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";
import { DIALOG_BREAKPOINTS } from "../../../core/utils/design-tokens.util";

interface ThrowingSession {
  id: string;
  sessionDate: string;
  totalThrows: number;
  shortThrows: number;
  mediumThrows: number;
  longThrows: number;
  sessionType: string;
  location?: string;
  armFeelingBefore?: number;
  armFeelingAfter?: number;
  preThrowingWarmupDone: boolean;
  postThrowingArmCareDone: boolean;
  iceApplied: boolean;
  warmupDurationMinutes?: number;
  throwingDurationMinutes?: number;
  armCareDurationMinutes?: number;
  notes?: string;
  mechanicsFocus?: string;
  fatigueLevel?: number;
}

interface ProgressionStatus {
  currentWeekAvg: number;
  targetThrows: number;
  progressionPhase: string;
  daysSinceLastSession: number;
  weeklyCompliancePct: number;
  recommendation: string;
}

interface WeeklyStats {
  weekStart: string;
  weeklyThrows: number;
  sessionsCount: number;
  avgArmFeeling: number;
  warmupCompliancePct: number;
  armCareCompliancePct: number;
  iceSessions: number;
}

interface SessionTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-qb-throwing-tracker",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    InputNumber,
    ProgressBar,
    SelectComponent,
    Slider,
    TextareaComponent,
    StatusTagComponent,

    Tooltip,
    AlertComponent,
    ButtonComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./qb-throwing-tracker.component.html",
  styleUrl: "./qb-throwing-tracker.component.scss",
})
export class QbThrowingTrackerComponent {
  readonly dialogBreakpoints = DIALOG_BREAKPOINTS.mobileFull;
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly featureFlags = inject(FeatureFlagsService);

  // State
  readonly progressionStatus = signal<ProgressionStatus | null>(null);
  readonly weeklyStats = signal<WeeklyStats[]>([]);
  readonly recentSessions = signal<ThrowingSession[]>([]);
  readonly showLogDialog = signal(false);
  readonly isSaving = signal(false);
  readonly nextGenEnabled = this.featureFlags.nextGenMetricsPreview;

  readonly throwingSpikeAlert = computed(() => {
    if (!this.nextGenEnabled()) return null;
    const sessions = this.recentSessions();
    if (sessions.length < 2) return null;
    const latest = sessions[0];
    const baselineSessions = sessions.slice(1, 4);
    if (baselineSessions.length === 0) return null;
    const baselineAvg =
      baselineSessions.reduce((sum, s) => sum + s.totalThrows, 0) /
      baselineSessions.length;
    if (baselineAvg <= 0) return null;
    const spikeRatio = latest.totalThrows / baselineAvg;
    if (spikeRatio < 1.25) return null;
    const pct = Math.round((spikeRatio - 1) * 100);
    return `Throwing load spike detected (+${pct}%). Consider extra recovery.`;
  });

  // Form
  formData: Partial<ThrowingSession> = this.getEmptyForm();

  readonly sessionTypes: SessionTypeOption[] = [
    { label: "Practice", value: "practice" },
    { label: "Warm-up Only", value: "warm_up" },
    { label: "Drill Work", value: "drill_work" },
    { label: "Game", value: "game" },
    { label: "Tournament", value: "tournament" },
    { label: "320 Simulation", value: "simulation" },
  ];

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<{
          progression?: ProgressionStatus;
          weeklyStats?: WeeklyStats[];
          recentSessions?: ThrowingSession[];
        }>(API_ENDPOINTS.qbThrowing.base),
      );
      const data = extractApiPayload<{
        progression?: ProgressionStatus;
        weeklyStats?: WeeklyStats[];
        recentSessions?: ThrowingSession[];
      }>(response);
      if (!data) {
        this.progressionStatus.set(null);
        this.weeklyStats.set([]);
        this.recentSessions.set([]);
        return;
      }
      this.progressionStatus.set(data.progression ?? null);
      this.weeklyStats.set(data.weeklyStats || []);
      this.recentSessions.set(data.recentSessions || []);
    } catch (err) {
      this.logger.error("Failed to load QB throwing data", err);
    }
  }

  openLogDialog(): void {
    this.formData = this.getEmptyForm();
    this.showLogDialog.set(true);
  }

  private updateFormData(patch: Partial<ThrowingSession>): void {
    this.formData = { ...this.formData, ...patch };
  }

  onSessionTypeChange(value: string | null): void {
    this.updateFormData({ sessionType: value ?? "practice" });
  }

  onSessionTypeSelect(event: SelectChangeEvent): void {
    this.onSessionTypeChange(
      typeof event.value === "string" ? event.value : null,
    );
  }

  onTotalThrowsChange(value: number | null): void {
    this.updateFormData({ totalThrows: value ?? 0 });
  }

  onShortThrowsChange(value: number | null): void {
    this.updateFormData({ shortThrows: value ?? 0 });
  }

  onMediumThrowsChange(value: number | null): void {
    this.updateFormData({ mediumThrows: value ?? 0 });
  }

  onLongThrowsChange(value: number | null): void {
    this.updateFormData({ longThrows: value ?? 0 });
  }

  onArmFeelingAfterChange(value: number | null): void {
    this.updateFormData({ armFeelingAfter: value ?? 5 });
  }

  onArmFeelingAfterSliderChange(value: number | number[] | null | undefined): void {
    const normalized = Array.isArray(value) ? value[0] : value;
    this.onArmFeelingAfterChange(typeof normalized === "number" ? normalized : null);
  }

  onPreThrowingWarmupDoneChange(value: boolean): void {
    this.updateFormData({ preThrowingWarmupDone: value });
  }

  onPreThrowingWarmupDoneToggle(event: Event): void {
    this.onPreThrowingWarmupDoneChange(this.readChecked(event));
  }

  onPostThrowingArmCareDoneChange(value: boolean): void {
    this.updateFormData({ postThrowingArmCareDone: value });
  }

  onPostThrowingArmCareDoneToggle(event: Event): void {
    this.onPostThrowingArmCareDoneChange(this.readChecked(event));
  }

  onIceAppliedChange(value: boolean): void {
    this.updateFormData({ iceApplied: value });
  }

  onIceAppliedToggle(event: Event): void {
    this.onIceAppliedChange(this.readChecked(event));
  }

  onNotesChange(value: string): void {
    this.updateFormData({ notes: value });
  }

  private readChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  closeLogDialog(): void {
    this.showLogDialog.set(false);
  }

  async saveSession(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);

    try {
      await firstValueFrom(this.api.post(API_ENDPOINTS.qbThrowing.base, this.formData));

      this.toastService.success(
        `${this.formData.totalThrows} throws recorded!`,
        "Session Logged",
        3000,
      );

      await this.loadData();
      this.closeLogDialog();
    } catch (err) {
      this.logger.error("Failed to save throwing session", err);
      this.toastService.error("Failed to save session. Please try again.");
    } finally {
      this.isSaving.set(false);
    }
  }

  getEmptyForm(): Partial<ThrowingSession> {
    return {
      sessionType: "practice",
      totalThrows: 0,
      shortThrows: 0,
      mediumThrows: 0,
      longThrows: 0,
      armFeelingAfter: 5,
      preThrowingWarmupDone: false,
      postThrowingArmCareDone: false,
      iceApplied: false,
      notes: "",
    };
  }

  isFormValid(): boolean {
    return !!(
      this.formData.sessionType && (this.formData.totalThrows || 0) > 0
    );
  }

  getProgressPercent(): number {
    const status = this.progressionStatus();
    if (!status || !status.targetThrows) return 0;
    return Math.min(
      100,
      Math.round((status.currentWeekAvg / status.targetThrows) * 100),
    );
  }

  getPhaseClass(): string {
    const phase = this.progressionStatus()?.progressionPhase || "";
    if (phase.includes("Tournament")) return "phase-tournament";
    if (phase.includes("Building")) return "phase-building";
    return "phase-foundation";
  }

  getBarHeight(throws: number): number {
    const maxThrows = 800; // Max expected weekly throws
    return Math.min(100, Math.max(15, (throws / maxThrows) * 100));
  }

  formatWeekLabel(weekStart: string): string {
    const date = new Date(weekStart);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  formatSessionType(type: string): string {
    const labels: Record<string, string> = {
      practice: "Practice",
      warm_up: "Warm-up",
      drill_work: "Drills",
      game: "Game",
      tournament: "Tournament",
      simulation: "Simulation",
    };
    return labels[type] || type;
  }

  getSessionTypeSeverity(
    type: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      practice: "info",
      warm_up: "secondary",
      drill_work: "info",
      game: "success",
      tournament: "danger",
      simulation: "warning",
    };
    return severities[type] || "secondary";
  }

  showArmCareReminder(): boolean {
    const sessions = this.recentSessions();
    if (sessions.length === 0) return false;
    const lastSession = sessions[0];
    const today = new Date().toISOString().split("T")[0];
    return (
      lastSession.sessionDate === today &&
      !lastSession.postThrowingArmCareDone &&
      lastSession.totalThrows >= 50
    );
  }

  lastSessionThrows(): number {
    return this.recentSessions()[0]?.totalThrows || 0;
  }

  async markArmCareDone(): Promise<void> {
    const lastSession = this.recentSessions()[0];
    if (!lastSession) return;

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.qbThrowing.armCare, {
          sessionId: lastSession.id,
        }),
      );

      this.toastService.success(
        "Great job taking care of your arm!",
        "Arm Care Complete",
        2000,
      );

      await this.loadData();
    } catch (err) {
      this.logger.error("Failed to mark arm care done", err);
    }
  }
}
