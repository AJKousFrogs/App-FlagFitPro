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
import { firstValueFrom } from "rxjs";
import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../../../shared/components/button/button.component";

import { Checkbox } from "primeng/checkbox";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { Slider } from "primeng/slider";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { Tooltip } from "primeng/tooltip";
import { ToastService } from "../../../core/services/toast.service";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { FeatureFlagsService } from "../../../core/services/feature-flags.service";
import { ApiResponse } from "../../../core/models/common.models";
import { DIALOG_WIDTHS } from "../../../core/utils/design-tokens.util";
import { DesignTokens } from "../../../shared/models/design-tokens";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Checkbox,
    Dialog,
    
    InputNumber,
    InputText,
    ProgressBar,
    Select,
    Slider,
    StatusTagComponent,

    Tooltip,
    ButtonComponent,
    EmptyStateComponent,
  ],
  template: `
<div class="qb-throwing-tracker">
      <!-- Progression Status Card -->
      @if (progressionStatus()) {
        <div class="status-card">
          <div class="status-header">
            <div class="phase-badge" [class]="getPhaseClass()">
              {{ progressionStatus()!.progressionPhase }}
            </div>
            @if (progressionStatus()!.daysSinceLastSession <= 3) {
              <app-status-tag value="Active" severity="success" size="sm" />
            } @else {
              <app-status-tag
                [value]="
                  progressionStatus()!.daysSinceLastSession + ' days ago'
                "
                severity="warning"
                size="sm"
              />
            }
          </div>

          <div class="status-metrics">
            <div class="metric">
              <div class="metric-value">
                {{ progressionStatus()!.currentWeekAvg }}
              </div>
              <div class="metric-label">Avg/Session</div>
            </div>
            <div class="metric target">
              <div class="metric-value">
                {{ progressionStatus()!.targetThrows }}
              </div>
              <div class="metric-label">Target</div>
            </div>
            <div class="metric">
              <div class="metric-value">
                {{
                  progressionStatus()!.weeklyCompliancePct | number: "1.0-0"
                }}%
              </div>
              <div class="metric-label">Arm Care</div>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-label">
              <span>Progress to Target</span>
              <span>{{ getProgressPercent() }}%</span>
            </div>
            <p-progressBar
              [value]="getProgressPercent()"
              [showValue]="false"
              class="progress-bar"
            ></p-progressBar>
          </div>

          <div class="recommendation">
            <i class="pi pi-lightbulb"></i>
            <span>{{ progressionStatus()!.recommendation }}</span>
          </div>

          @if (nextGenEnabled() && throwingSpikeAlert()) {
            <div class="preview-alert">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ throwingSpikeAlert() }}</span>
            </div>
          }
        </div>
      }

      <!-- Weekly Stats -->
      <div class="section">
        <h2 class="section-title">Weekly History</h2>
        @if (weeklyStats().length === 0) {
          <app-empty-state
            icon="pi-chart-bar"
            heading="No throwing data yet"
            description="Log your first session to see weekly history."
          />
        } @else {
          <div class="weekly-chart">
            @for (week of weeklyStats(); track week.weekStart) {
              <div class="week-bar">
                <div
                  class="bar-fill"
                  [style.height.%]="getBarHeight(week.weeklyThrows)"
                  [class.high]="week.weeklyThrows >= 600"
                  [class.medium]="
                    week.weeklyThrows >= 300 && week.weeklyThrows < 600
                  "
                  pTooltip="{{ week.weeklyThrows }} throws in {{
                    week.sessionsCount
                  }} sessions"
                >
                  <span class="bar-value">{{ week.weeklyThrows }}</span>
                </div>
                <div class="bar-label">
                  {{ formatWeekLabel(week.weekStart) }}
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Recent Sessions -->
      <div class="section">
        <h2 class="section-title">Recent Sessions</h2>
        @if (recentSessions().length === 0) {
          <app-empty-state
            icon="pi-calendar"
            heading="No sessions yet"
            description="Log your first throwing session to see recent history."
          />
        } @else {
          <div class="sessions-list">
            @for (session of recentSessions(); track session.id) {
              <div class="session-card">
                <div class="session-main">
                  <div class="session-info">
                    <div class="session-date">
                      {{ session.sessionDate | date: "EEE, MMM d" }}
                      <app-status-tag
                        [value]="formatSessionType(session.sessionType)"
                        [severity]="getSessionTypeSeverity(session.sessionType)"
                        size="sm"
                      />
                    </div>
                    <div class="throw-breakdown">
                      <span class="throw-total"
                        >{{ session.totalThrows }} throws</span
                      >
                      @if (
                        session.shortThrows ||
                        session.mediumThrows ||
                        session.longThrows
                      ) {
                        <span class="throw-detail">
                          ({{ session.shortThrows || 0 }}S /
                          {{ session.mediumThrows || 0 }}M /
                          {{ session.longThrows || 0 }}L)
                        </span>
                      }
                    </div>
                  </div>
                  <div class="session-compliance">
                    <div
                      class="compliance-item"
                      [class.done]="session.preThrowingWarmupDone"
                    >
                      <i
                        class="pi"
                        [class.pi-check]="session.preThrowingWarmupDone"
                        [class.pi-times]="!session.preThrowingWarmupDone"
                      ></i>
                      <span>Warm-up</span>
                    </div>
                    <div
                      class="compliance-item"
                      [class.done]="session.postThrowingArmCareDone"
                    >
                      <i
                        class="pi"
                        [class.pi-check]="session.postThrowingArmCareDone"
                        [class.pi-times]="!session.postThrowingArmCareDone"
                      ></i>
                      <span>Arm Care</span>
                    </div>
                    @if (session.iceApplied) {
                      <div class="compliance-item done">
                        <i class="pi pi-check"></i>
                        <span>Ice</span>
                      </div>
                    }
                  </div>
                </div>
                @if (session.armFeelingAfter) {
                  <div class="arm-feeling">
                    <span class="feeling-label">Arm feeling:</span>
                    <div class="feeling-scale">
                      @for (i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track i) {
                        <div
                          class="feeling-dot"
                          [class.active]="i <= (session.armFeelingAfter || 0)"
                          [class.good]="i <= 3"
                          [class.moderate]="i > 3 && i <= 6"
                          [class.concern]="i > 6"
                        ></div>
                      }
                    </div>
                    <span class="feeling-value"
                      >{{ session.armFeelingAfter }}/10</span
                    >
                  </div>
                }
                @if (session.notes) {
                  <div class="session-notes">
                    <i class="pi pi-comment"></i>
                    {{ session.notes }}
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Arm Care Reminder -->
      @if (showArmCareReminder()) {
        <div class="arm-care-reminder">
          <div class="reminder-icon"><i class="pi pi-bolt" aria-hidden="true"></i></div>
          <div class="reminder-content">
            <h4>Arm Care Reminder</h4>
            <p>
              You threw {{ lastSessionThrows() }} balls. Don't forget your
              post-throwing arm care routine!
            </p>
          </div>
          <app-button
            size="sm"
            iconLeft="pi-check"
            (clicked)="markArmCareDone()"
            >Mark Complete</app-button
          >
        </div>
      }
    </div>

    <!-- Log Session Dialog -->
    <p-dialog
      header="Log Throwing Session"
      [modal]="true"
      [visible]="showLogDialog()"
      (visibleChange)="showLogDialog.set($event)"
      [breakpoints]="dialogBreakpoints"
      [draggable]="false"
      class="qb-throwing-log-dialog"
    >
      <div class="log-form">
        <!-- Session Type -->
        <div class="form-field">
          <label>Session Type *</label>
          <p-select
            [options]="sessionTypes"
            [(ngModel)]="formData.sessionType"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            class="w-full"
          ></p-select>
        </div>

        <!-- Total Throws -->
        <div class="form-field">
          <label>Total Throws *</label>
          <p-inputNumber
            [(ngModel)]="formData.totalThrows"
            [min]="0"
            [max]="500"
            [showButtons]="true"
            [step]="10"
            class="w-full"
            placeholder="0"
          ></p-inputNumber>
          <small class="field-hint">
            Target:
            {{ progressionStatus()?.targetThrows || 150 }} throws/session
          </small>
        </div>

        <!-- Throw Breakdown -->
        <div class="form-row">
          <div class="form-field">
            <label>Short (0-10y)</label>
            <p-inputNumber
              [(ngModel)]="formData.shortThrows"
              [min]="0"
              [max]="300"
              class="w-full"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label>Medium (10-20y)</label>
            <p-inputNumber
              [(ngModel)]="formData.mediumThrows"
              [min]="0"
              [max]="300"
              class="w-full"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label>Long (20y+)</label>
            <p-inputNumber
              [(ngModel)]="formData.longThrows"
              [min]="0"
              [max]="200"
              class="w-full"
            ></p-inputNumber>
          </div>
        </div>

        <!-- Arm Feeling -->
        <div class="form-field">
          <label>Arm Feeling After (1=fresh, 10=fatigued)</label>
          <p-slider
            [(ngModel)]="formData.armFeelingAfter"
            [min]="1"
            [max]="10"
            [step]="1"
          ></p-slider>
          <div class="slider-labels">
            <span>Fresh</span>
            <span class="current-value">{{
              formData.armFeelingAfter || 5
            }}</span>
            <span>Fatigued</span>
          </div>
        </div>

        <!-- Compliance Checkboxes -->
        <div class="compliance-section">
          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="formData.preThrowingWarmupDone"
              [binary]="true"
              variant="filled"
              inputId="warmup"
            ></p-checkbox>
            <label for="warmup">Pre-throwing warm-up completed (30 min)</label>
          </div>

          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="formData.postThrowingArmCareDone"
              [binary]="true"
              variant="filled"
              inputId="armcare"
            ></p-checkbox>
            <label for="armcare">Post-throwing arm care completed</label>
          </div>

          @if ((formData.totalThrows || 0) >= 100) {
            <div class="form-field checkbox-group">
              <p-checkbox
                [(ngModel)]="formData.iceApplied"
                [binary]="true"
                variant="filled"
                inputId="ice"
              ></p-checkbox>
              <label for="ice">Ice applied (recommended for 100+ throws)</label>
            </div>
          }
        </div>

        <!-- Notes -->
        <div class="form-field">
          <label>Notes / Mechanics Focus</label>
          <textarea
            pInputText
            [(ngModel)]="formData.notes"
            rows="2"
            placeholder="What did you work on?"
            class="w-full"
          ></textarea>
        </div>
      </div>

      <ng-template #footer>
        <app-button variant="outlined" (clicked)="closeLogDialog()"
          >Cancel</app-button
        >
        <app-button
          iconLeft="pi-check"
          [loading]="isSaving()"
          [disabled]="!isFormValid()"
          (clicked)="saveSession()"
          >Save Session</app-button
        >
      </ng-template>
    </p-dialog>
  `,
  styleUrl: "./qb-throwing-tracker.component.scss",
})
export class QbThrowingTrackerComponent {
  readonly dialogBreakpoints = {
    [DesignTokens.breakpoints.mobile]: DIALOG_WIDTHS.full,
  };
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
      const response: ApiResponse<{
        progression?: ProgressionStatus;
        weeklyStats?: WeeklyStats[];
        recentSessions?: ThrowingSession[];
      }> = await firstValueFrom(
        this.api.get("/api/qb-throwing"),
      );
      if (response?.success) {
        const data = response.data;
        if (!data) {
          this.progressionStatus.set(null);
          this.weeklyStats.set([]);
          this.recentSessions.set([]);
          return;
        }
        this.progressionStatus.set(data.progression ?? null);
        this.weeklyStats.set(data.weeklyStats || []);
        this.recentSessions.set(data.recentSessions || []);
      }
    } catch (err) {
      this.logger.error("Failed to load QB throwing data", err);
    }
  }

  openLogDialog(): void {
    this.formData = this.getEmptyForm();
    this.showLogDialog.set(true);
  }

  closeLogDialog(): void {
    this.showLogDialog.set(false);
  }

  async saveSession(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);

    try {
      await firstValueFrom(this.api.post("/api/qb-throwing", this.formData));

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
        this.api.post("/api/qb-throwing/arm-care", {
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
