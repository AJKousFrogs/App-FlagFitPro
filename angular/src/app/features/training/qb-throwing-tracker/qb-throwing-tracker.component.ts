/**
 * QB Throwing Tracker Component
 *
 * Tracks QB throwing sessions, arm care compliance, and progression toward 320-throw capacity.
 * Shows weekly totals, arm health metrics, and progression phase.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { firstValueFrom } from "rxjs";
import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { Slider } from "primeng/slider";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { MessageService } from "primeng/api";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";

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
    CardModule,
    Checkbox,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    ProgressBarModule,
    Select,
    Slider,
    TagModule,
    ToastModule,
    TooltipModule,

    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="qb-throwing-tracker">
      <!-- Progression Status Card -->
      @if (progressionStatus()) {
        <div class="status-card">
          <div class="status-header">
            <div class="phase-badge" [class]="getPhaseClass()">
              {{ progressionStatus()!.progressionPhase }}
            </div>
            @if (progressionStatus()!.daysSinceLastSession <= 3) {
              <p-tag value="Active" severity="success"></p-tag>
            } @else {
              <p-tag
                [value]="
                  progressionStatus()!.daysSinceLastSession + ' days ago'
                "
                severity="warn"
              ></p-tag>
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
              styleClass="progress-bar"
            ></p-progressBar>
          </div>

          <div class="recommendation">
            <i class="pi pi-lightbulb"></i>
            <span>{{ progressionStatus()!.recommendation }}</span>
          </div>
        </div>
      }

      <!-- Weekly Stats -->
      <div class="section">
        <h2 class="section-title">Weekly History</h2>
        @if (weeklyStats().length === 0) {
          <div class="empty-state">
            <i class="pi pi-chart-bar"></i>
            <p>No throwing data yet. Log your first session!</p>
          </div>
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
          <div class="empty-state">
            <i class="pi pi-calendar"></i>
            <p>No sessions logged yet.</p>
          </div>
        } @else {
          <div class="sessions-list">
            @for (session of recentSessions(); track session.id) {
              <div class="session-card">
                <div class="session-main">
                  <div class="session-info">
                    <div class="session-date">
                      {{ session.sessionDate | date: "EEE, MMM d" }}
                      <p-tag
                        [value]="formatSessionType(session.sessionType)"
                        [severity]="getSessionTypeSeverity(session.sessionType)"
                      ></p-tag>
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
          <div class="reminder-icon">💪</div>
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
      [style]="{ width: '500px' }"
      [breakpoints]="{ '640px': '95vw' }"
      [draggable]="false"
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
            [style]="{ width: '100%' }"
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
            [style]="{ width: '100%' }"
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
              [style]="{ width: '100%' }"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label>Medium (10-20y)</label>
            <p-inputNumber
              [(ngModel)]="formData.mediumThrows"
              [min]="0"
              [max]="300"
              [style]="{ width: '100%' }"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label>Long (20y+)</label>
            <p-inputNumber
              [(ngModel)]="formData.longThrows"
              [min]="0"
              [max]="200"
              [style]="{ width: '100%' }"
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
              inputId="warmup"
            ></p-checkbox>
            <label for="warmup">Pre-throwing warm-up completed (30 min)</label>
          </div>

          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="formData.postThrowingArmCareDone"
              [binary]="true"
              inputId="armcare"
            ></p-checkbox>
            <label for="armcare">Post-throwing arm care completed</label>
          </div>

          @if ((formData.totalThrows || 0) >= 100) {
            <div class="form-field checkbox-group">
              <p-checkbox
                [(ngModel)]="formData.iceApplied"
                [binary]="true"
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
            [style]="{ width: '100%' }"
          ></textarea>
        </div>
      </div>

      <ng-template pTemplate="footer">
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
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly progressionStatus = signal<ProgressionStatus | null>(null);
  readonly weeklyStats = signal<WeeklyStats[]>([]);
  readonly recentSessions = signal<ThrowingSession[]>([]);
  readonly showLogDialog = signal(false);
  readonly isSaving = signal(false);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/qb-throwing"),
      );
      if (response?.success) {
        this.progressionStatus.set(response.data.progression);
        this.weeklyStats.set(response.data.weeklyStats || []);
        this.recentSessions.set(response.data.recentSessions || []);
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

      this.messageService.add({
        severity: "success",
        summary: "Session Logged",
        detail: `${this.formData.totalThrows} throws recorded!`,
        life: 3000,
      });

      await this.loadData();
      this.closeLogDialog();
    } catch (err) {
      this.logger.error("Failed to save throwing session", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to save session. Please try again.",
      });
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
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      practice: "info",
      warm_up: "secondary",
      drill_work: "info",
      game: "success",
      tournament: "danger",
      simulation: "warn",
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

      this.messageService.add({
        severity: "success",
        summary: "Arm Care Complete",
        detail: "Great job taking care of your arm!",
        life: 2000,
      });

      await this.loadData();
    } catch (err) {
      this.logger.error("Failed to mark arm care done", err);
    }
  }
}
