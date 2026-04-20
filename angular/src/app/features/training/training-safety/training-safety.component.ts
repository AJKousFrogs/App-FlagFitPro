/**
 * Training Safety Component
 *
 * Comprehensive safety dashboard showing:
 * - Current safety warnings and alerts
 * - Age-adjusted recovery recommendations
 * - Sleep debt analysis
 * - Movement volume limits
 * - Return-to-play protocols
 *
 * CRITICAL SAFETY COMPONENT - This helps prevent athlete injuries
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { ProgressBar } from "primeng/progressbar";
import { Tabs, TabPanel } from "primeng/tabs";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { SafetyWarningsComponent } from "../../../shared/components/safety-warnings/safety-warnings.component";
import { TrafficLightRiskComponent } from "../../../shared/components/traffic-light-risk/traffic-light-risk.component";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TrainingSafetyDataService } from "../services/training-safety-data.service";
import {
  METRIC_INSUFFICIENT_DATA,
  DATA_STATE_MESSAGES,
} from "../../../shared/utils/privacy-ux-copy";
import { calculateAge } from "../../../shared/utils/date.utils";
import {
  getProtocolAcwrDisplay,
  getProtocolRiskZone,
} from "../../../core/utils/protocol-metrics-presentation";

@Component({
  selector: "app-training-safety",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ProgressBar,
    Tabs,
    TabPanel,
    MainLayoutComponent,
    PageHeaderComponent,
    SafetyWarningsComponent,
    TrafficLightRiskComponent,
    AlertComponent,
    ButtonComponent,
    CardShellComponent,
    IconButtonComponent,
    StatusTagComponent,
  ],
  templateUrl: "./training-safety.component.html",
  styleUrl: "./training-safety.component.scss",
})
export class TrainingSafetyComponent implements OnInit {
  private trainingService = inject(UnifiedTrainingService);
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  private trainingSafetyDataService = inject(TrainingSafetyDataService);
  private destroyRef = inject(DestroyRef);

  // ACWR signals
  readonly todayProtocol = this.trainingService.todayProtocol;
  readonly acwrDisplay = computed(() =>
    getProtocolAcwrDisplay(
      this.todayProtocol(),
      this.trainingService.acwrRatio(),
      null,
    ),
  );
  acwrValue = computed(
    () => this.acwrDisplay().value ?? this.trainingService.acwrRatio() ?? 0,
  );
  acwrRiskZone = computed(() =>
    getProtocolRiskZone(
      this.todayProtocol(),
      this.trainingService.acwrRiskZone(),
      this.trainingService.acwrRatio(),
      null,
    ),
  );
  acuteLoad = this.trainingService.acuteLoad;
  chronicLoad = this.trainingService.chronicLoad;

  // Centralized privacy/safety messages
  readonly acwrInsufficientMessage = METRIC_INSUFFICIENT_DATA.acwr;
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  // Data state checks
  hasInsufficientAcwrData = computed(() => !this.acwrDisplay().hasData);

  // Age-adjusted recovery signals
  ageGroup = signal<string>("Adult");
  recoveryMultiplier = signal<number>(1.0);
  maxSessionsPerWeek = signal<number>(6);
  minRestDays = signal<number>(1);

  // Sleep debt signals
  sleepDebtHours = signal<number>(0);
  sleepDebtLevel = signal<string>("None");
  trainingCapacity = signal<number>(100);

  // Movement limits signals
  movementLimits = signal<
    Array<{ type: string; current: number; max: number }>
  >([
    { type: "Sprints", current: 0, max: 100 },
    { type: "Cuts", current: 0, max: 200 },
    { type: "Throws", current: 0, max: 300 },
    { type: "Jumps", current: 0, max: 150 },
  ]);
  movementLimitStatus = signal<string>("Safe");

  // Recommendations
  recommendations = signal<
    Array<{
      id: string;
      title: string;
      message: string;
      priority: string;
      action?: { label: string; route: string };
    }>
  >([]);

  // Return to play
  hasActiveRTP = signal<boolean>(false);
  rtpStage = signal<string>("");
  rtpProgress = signal<number>(0);
  rtpInjuryType = signal<string>("");
  rtpDaysInProtocol = signal<number>(0);
  rtpRestrictions = signal<string>("");

  // Training history
  totalSessionsThisWeek = signal<number>(0);
  totalLoadThisWeek = signal<number>(0);
  consecutiveTrainingDays = signal<number>(0);
  weeklyLoadChange = signal<number>(0);

  ngOnInit(): void {
    this.trainingService
      .getTodayOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) =>
          this.logger.warn(
            "[TrainingSafety] Failed to load protocol overview, using live ACWR fallback",
            error,
          ),
      });

    this.loadSafetyData();
  }

  private async loadSafetyData(): Promise<void> {
    const user = this.supabase.currentUser();
    if (!user?.id) {
      this.showEmptyState();
      return;
    }

    try {
      // Load age-adjusted recovery from user profile
      await this.loadAgeRecoveryData(user.id);

      // Load sleep debt from wellness data
      await this.loadSleepDebtData(user.id);

      // Load movement limits from training sessions
      await this.loadMovementLimits(user.id);

      // Load training history for the week
      await this.loadTrainingHistory(user.id);

      // Load return-to-play status if any
      await this.loadRTPStatus(user.id);

      // Generate recommendations based on real data
      this.generateRecommendations();
    } catch (error) {
      this.logger.error("training_safety_load_failed", error);
      this.showEmptyState();
    }
  }

  private async loadAgeRecoveryData(userId: string): Promise<void> {
    try {
      // Get user's date of birth from profile
      const { dateOfBirth } =
        await this.trainingSafetyDataService.getUserProfileDob(userId);

      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        const age = calculateAge(dob);

        // Set age group and recovery parameters
        if (age < 18) {
          this.ageGroup.set("Youth");
          this.recoveryMultiplier.set(0.8);
          this.maxSessionsPerWeek.set(5);
          this.minRestDays.set(2);
        } else if (age < 25) {
          this.ageGroup.set("Young Adult");
          this.recoveryMultiplier.set(0.9);
          this.maxSessionsPerWeek.set(6);
          this.minRestDays.set(1);
        } else if (age < 35) {
          this.ageGroup.set("Adult");
          this.recoveryMultiplier.set(1.0);
          this.maxSessionsPerWeek.set(6);
          this.minRestDays.set(1);
        } else {
          this.ageGroup.set("Masters");
          this.recoveryMultiplier.set(1.2);
          this.maxSessionsPerWeek.set(5);
          this.minRestDays.set(2);
        }
      }
    } catch (_error) {
      this.logger.debug(
        "[TrainingSafety] Could not load age data, using defaults",
      );
    }
  }

  private async loadSleepDebtData(userId: string): Promise<void> {
    try {
      // Get last 7 days of wellness entries for sleep data
      // Read directly from daily_wellness_checkin (the canonical table)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { entries: wellnessEntries } =
        await this.trainingSafetyDataService.getWellnessEntries({
          userId,
          sinceDate: sevenDaysAgo.toISOString().split("T")[0],
        });

      if (wellnessEntries && wellnessEntries.length > 0) {
        // Calculate sleep debt (assuming 8 hours is optimal)
        const optimalSleep = 8;
        let totalDebt = 0;

        wellnessEntries.forEach((entry: { sleep_quality?: number }) => {
          if (entry.sleep_quality) {
            // Convert 1-10 scale to hours (1=4h, 10=10h)
            const estimatedHours = 4 + (entry.sleep_quality / 10) * 6;
            const dailyDebt = Math.max(0, optimalSleep - estimatedHours);
            totalDebt += dailyDebt;
          }
        });

        this.sleepDebtHours.set(Math.round(totalDebt * 10) / 10);

        // Determine sleep debt level
        if (totalDebt === 0) {
          this.sleepDebtLevel.set("None");
          this.trainingCapacity.set(100);
        } else if (totalDebt < 5) {
          this.sleepDebtLevel.set("Mild");
          this.trainingCapacity.set(90);
        } else if (totalDebt < 10) {
          this.sleepDebtLevel.set("Moderate");
          this.trainingCapacity.set(75);
        } else {
          this.sleepDebtLevel.set("Severe");
          this.trainingCapacity.set(60);
        }
      } else {
        // No wellness data - show defaults
        this.sleepDebtHours.set(0);
        this.sleepDebtLevel.set("Unknown");
        this.trainingCapacity.set(100);
      }
    } catch (_error) {
      this.logger.debug("training_safety_sleep_unavailable");
    }
  }

  private async loadMovementLimits(userId: string): Promise<void> {
    try {
      // Get this week's workout logs to count movement types
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

      const { logs: workoutLogs } =
        await this.trainingSafetyDataService.getWorkoutLogsSince({
          userId,
          sinceDate: weekStart.toISOString(),
        });

      // Count movement types from workout notes
      let sprints = 0,
        cuts = 0,
        throws = 0,
        jumps = 0;

      if (workoutLogs) {
        workoutLogs.forEach(
          (log: { notes?: string; duration_minutes?: number }) => {
            const notes = (log.notes || "").toLowerCase();
            const duration = log.duration_minutes || 0;

            // Estimate movement counts based on session type
            if (notes.includes("sprint") || notes.includes("speed")) {
              sprints += Math.round(duration / 2); // ~30 sprints per hour
            }
            if (
              notes.includes("route") ||
              notes.includes("agility") ||
              notes.includes("cut")
            ) {
              cuts += Math.round(duration * 1.5); // ~90 cuts per hour
            }
            if (
              notes.includes("throw") ||
              notes.includes("passing") ||
              notes.includes("qb")
            ) {
              throws += Math.round(duration * 2); // ~120 throws per hour
            }
            if (notes.includes("jump") || notes.includes("plyometric")) {
              jumps += Math.round(duration / 3); // ~20 jumps per hour
            }
          },
        );
      }

      this.movementLimits.set([
        { type: "Sprints", current: sprints, max: 100 },
        { type: "Cuts", current: cuts, max: 200 },
        { type: "Throws", current: throws, max: 300 },
        { type: "Jumps", current: jumps, max: 150 },
      ]);

      // Determine overall status
      const limits = this.movementLimits();
      const anyOverLimit = limits.some((l) => l.current > l.max);
      const anyNearLimit = limits.some((l) => l.current > l.max * 0.8);

      if (anyOverLimit) {
        this.movementLimitStatus.set("Over Limit");
      } else if (anyNearLimit) {
        this.movementLimitStatus.set("Caution");
      } else {
        this.movementLimitStatus.set("Safe");
      }
    } catch (_error) {
      this.logger.debug("training_safety_movement_limits_unavailable");
    }
  }

  private async loadTrainingHistory(userId: string): Promise<void> {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // Get this week's sessions
      const { logs: thisWeekSessions } =
        await this.trainingSafetyDataService.getWorkoutLogsSince({
          userId,
          sinceDate: weekStart.toISOString(),
        });

      // Get last week's sessions for comparison
      const { logs: lastWeekSessions } =
        await this.trainingSafetyDataService.getWorkoutLogsBetween({
          userId,
          startDate: lastWeekStart.toISOString(),
          endDate: weekStart.toISOString(),
        });

      if (thisWeekSessions) {
        this.totalSessionsThisWeek.set(thisWeekSessions.length);

        // Calculate total load (RPE × duration)
        const thisWeekLoad = thisWeekSessions.reduce(
          (sum: number, s: { rpe?: number; duration_minutes?: number }) =>
            sum + (s.rpe || 5) * (s.duration_minutes || 60),
          0,
        );
        this.totalLoadThisWeek.set(thisWeekLoad);

        // Calculate consecutive training days
        const trainingDates = new Set(
          thisWeekSessions
            .map((s: { completed_at?: string | null }) =>
              s.completed_at ? new Date(s.completed_at).toDateString() : null,
            )
            .filter((date): date is string => Boolean(date)),
        );
        let consecutive = 0;
        const today = new Date();
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          if (trainingDates.has(checkDate.toDateString())) {
            consecutive++;
          } else {
            break;
          }
        }
        this.consecutiveTrainingDays.set(consecutive);

        // Calculate week-over-week change
        if (lastWeekSessions && lastWeekSessions.length > 0) {
          const lastWeekLoad = lastWeekSessions.reduce(
            (sum: number, s: { rpe?: number; duration_minutes?: number }) =>
              sum + (s.rpe || 5) * (s.duration_minutes || 60),
            0,
          );

          if (lastWeekLoad > 0) {
            const change = ((thisWeekLoad - lastWeekLoad) / lastWeekLoad) * 100;
            this.weeklyLoadChange.set(Math.round(change));
          }
        }
      }
    } catch (_error) {
      this.logger.debug("training_safety_history_unavailable");
    }
  }

  private async loadRTPStatus(userId: string): Promise<void> {
    try {
      // Check for active return-to-play protocols
      const { protocol: rtpProtocol } =
        await this.trainingSafetyDataService.getActiveRtpProtocol(userId);

      if (rtpProtocol) {
        this.hasActiveRTP.set(true);
        this.rtpInjuryType.set(rtpProtocol.injury_type || "Unknown");

        if (rtpProtocol.injury_date) {
          const injuryDate = new Date(rtpProtocol.injury_date);
          const daysInProtocol = Math.floor(
            (Date.now() - injuryDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          this.rtpDaysInProtocol.set(daysInProtocol);
        } else {
          this.rtpDaysInProtocol.set(0);
        }

        // Estimate progress based on typical recovery times
        const typicalRecovery: Record<string, number> = {
          muscle_strain: 14,
          hamstring: 21,
          ankle_sprain: 14,
          knee: 28,
          concussion: 14,
          default: 21,
        };
        const injuryKey = rtpProtocol.injury_type?.toLowerCase();
        const expectedDays =
          (injuryKey ? typicalRecovery[injuryKey] : undefined) ??
          typicalRecovery["default"];
        const daysInProtocol = this.rtpDaysInProtocol();
        const progress = Math.min(
          100,
          Math.round((daysInProtocol / expectedDays) * 100),
        );
        this.rtpProgress.set(progress);

        // Determine stage
        if (progress < 25) {
          this.rtpStage.set("Phase 1: Rest");
          this.rtpRestrictions.set("No training, focus on recovery");
        } else if (progress < 50) {
          this.rtpStage.set("Phase 2: Light Activity");
          this.rtpRestrictions.set("Walking, light stretching only");
        } else if (progress < 75) {
          this.rtpStage.set("Phase 3: Sport-Specific");
          this.rtpRestrictions.set("No contact, 50% intensity");
        } else {
          this.rtpStage.set("Phase 4: Full Training");
          this.rtpRestrictions.set("Full participation with monitoring");
        }
      } else {
        this.hasActiveRTP.set(false);
      }
    } catch (_error) {
      this.logger.debug("training_safety_rtp_unavailable");
      this.hasActiveRTP.set(false);
    }
  }

  private showEmptyState(): void {
    // Set default values for empty state
    this.ageGroup.set("Unknown");
    this.recoveryMultiplier.set(1.0);
    this.maxSessionsPerWeek.set(6);
    this.minRestDays.set(1);
    this.sleepDebtHours.set(0);
    this.sleepDebtLevel.set("No Data");
    this.trainingCapacity.set(100);
    this.movementLimits.set([
      { type: "Sprints", current: 0, max: 100 },
      { type: "Cuts", current: 0, max: 200 },
      { type: "Throws", current: 0, max: 300 },
      { type: "Jumps", current: 0, max: 150 },
    ]);
    this.movementLimitStatus.set("No Data");
    this.totalSessionsThisWeek.set(0);
    this.totalLoadThisWeek.set(0);
    this.consecutiveTrainingDays.set(0);
    this.weeklyLoadChange.set(0);
  }

  private generateRecommendations(): void {
    const recs: Array<{
      id: string;
      title: string;
      message: string;
      priority: string;
      action?: { label: string; route: string };
    }> = [];

    // Check ACWR
    const acwr = this.acwrDisplay();
    if (acwr.level === "danger-zone") {
      recs.push({
        id: "acwr-high",
        title: "High Injury Risk",
        message:
          "Your ACWR is above the safe range. Consider reducing training load by 20-30%.",
        priority: "critical",
        action: { label: "View Training Plan", route: "/training" },
      });
    } else if (acwr.level === "elevated-risk") {
      recs.push({
        id: "acwr-elevated",
        title: "Elevated Risk Zone",
        message:
          "Your ACWR is in the caution zone. Monitor closely and avoid high-intensity work.",
        priority: "high",
      });
    } else if (acwr.level === "under-training") {
      recs.push({
        id: "acwr-under",
        title: "Load Below Target",
        message:
          "Your recent training load is below target. Build back up gradually instead of making a sudden jump.",
        priority: "medium",
      });
    }

    // Check sleep debt
    if (this.sleepDebtHours() > 5) {
      recs.push({
        id: "sleep-debt",
        title: "Significant Sleep Debt",
        message:
          "You have accumulated significant sleep debt. Prioritize sleep to reduce injury risk.",
        priority: "high",
        action: { label: "Log Sleep", route: "/wellness" },
      });
    }

    this.recommendations.set(recs);
  }

  getAgeGroupSeverity(): "success" | "info" | "warning" | "danger" {
    const group = this.ageGroup();
    if (group === "Youth" || group === "Young Adult") return "success";
    if (group === "Adult") return "info";
    if (group === "Masters") return "warning";
    return "danger";
  }

  getSleepDebtSeverity(): "success" | "info" | "warning" | "danger" {
    const level = this.sleepDebtLevel();
    if (level === "None") return "success";
    if (level === "Mild") return "info";
    if (level === "Moderate") return "warning";
    return "danger";
  }

  getMovementLimitSeverity(): "success" | "info" | "warning" | "danger" {
    const status = this.movementLimitStatus();
    if (status === "Safe") return "success";
    if (status === "Caution") return "warning";
    return "danger";
  }

  executeAction(action: { label: string; route: string }): void {
    // Navigate to the action route
    // In real implementation, use Router
    this.logger.info("Executing action", toLogContext(action));
  }

  openRTPCheckin(): void {
    // Open return-to-play check-in dialog
    this.logger.info("Opening RTP check-in");
  }

  reportInjury(): void {
    // Open injury report dialog
    this.logger.info("Opening injury report");
  }
}
