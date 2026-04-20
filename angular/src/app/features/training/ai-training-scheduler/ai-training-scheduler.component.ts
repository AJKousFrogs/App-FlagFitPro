import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";

import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { DatePicker } from "primeng/datepicker";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Skeleton } from "primeng/skeleton";
import { ProgressBar } from "primeng/progressbar";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AiConsentRequiredComponent } from "../../../shared/components/ai-consent-required/ai-consent-required.component";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";
import { PrivacySettingsService } from "../../../core/services/privacy-settings.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AiTrainingSchedulerDataService } from "../services/ai-training-scheduler-data.service";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";

interface AISuggestion {
  id: string;
  type: "swap" | "reduce" | "increase" | "rest" | "recovery" | "intensity";
  priority: "high" | "medium" | "low";
  message: string;
  reason: string;
  date: Date;
  accepted: boolean;
  dismissed: boolean;
  affected_session_id?: string;
  suggested_changes?: Record<string, unknown>;
}

interface ScheduledSession {
  id: string;
  date: string;
  session_type: string;
  duration_minutes: number;
  intensity: string;
  status: string;
  ai_optimized: boolean;
}

const suggestionTypes: AISuggestion["type"][] = [
  "swap",
  "reduce",
  "increase",
  "rest",
  "recovery",
  "intensity",
];

const suggestionPriorities: AISuggestion["priority"][] = [
  "low",
  "medium",
  "high",
];

const isSuggestionType = (value: unknown): value is AISuggestion["type"] =>
  suggestionTypes.includes(value as AISuggestion["type"]);

const isSuggestionPriority = (
  value: unknown,
): value is AISuggestion["priority"] =>
  suggestionPriorities.includes(value as AISuggestion["priority"]);

const isString = (value: unknown): value is string => typeof value === "string";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface AthleteMetrics {
  readiness_score: number | null;
  acwr: number | null;
  fatigue_level: number | null;
  sleep_quality: number | null;
  soreness_level: number | null;
}

@Component({
  selector: "app-ai-training-scheduler",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    CardShellComponent,
    DatePicker,
    StatusTagComponent,
    Skeleton,

    ProgressBar,
    MainLayoutComponent,
    PageHeaderComponent,
    AiConsentRequiredComponent,
    ButtonComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./ai-training-scheduler.component.html",
  styleUrl: "./ai-training-scheduler.component.scss",
})
export class AiTrainingSchedulerComponent implements OnInit {
  private aiTrainingSchedulerDataService = inject(AiTrainingSchedulerDataService);
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private privacyService = inject(PrivacySettingsService);
  private api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  // AI consent check - shows banner when disabled
  readonly aiEnabled = this.privacyService.aiProcessingEnabled;

  readonly selectedDateControl = new FormControl(new Date(), {
    nonNullable: true,
  });
  selectedDate = signal<Date>(new Date());
  suggestions = signal<AISuggestion[]>([]);
  scheduledSessions = signal<ScheduledSession[]>([]);
  athleteMetrics = signal<AthleteMetrics | null>(null);

  isLoading = signal(false);
  isGenerating = signal(false);
  applyingId = signal<string | null>(null);

  pendingSuggestions = computed(() =>
    this.suggestions().filter((s) => !s.accepted && !s.dismissed),
  );

  selectedDateSessions = computed(() => {
    const selected = this.selectedDate();
    const dateStr = selected.toISOString().split("T")[0];
    return this.scheduledSessions().filter((s) => s.date.startsWith(dateStr));
  });

  constructor() {
    this.selectedDateControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date) => {
        this.selectedDate.set(date);
      });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private currentUserId(): string | null {
    return this.supabase.userId();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const userId = this.currentUserId();
      if (!userId) {
        this.logger.warn("No user found");
        return;
      }

      // Load athlete metrics
      await this.loadAthleteMetrics(userId);

      // Load AI suggestions
      await this.loadSuggestions(userId);

      // Load scheduled sessions
      await this.loadScheduledSessions(userId);
    } catch (error) {
      this.logger.error("Error loading AI scheduler data:", error);
      this.toastService.error(TOAST.ERROR.LOAD_FAILED);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAthleteMetrics(userId: string): Promise<void> {
    try {
      // Load readiness data
      const { readiness } =
        await this.aiTrainingSchedulerDataService.getLatestReadiness(userId);

      // Load ACWR data
      const { acwr } =
        await this.aiTrainingSchedulerDataService.getLatestAcwr(userId);

      // Load wellness data via API
      const today = new Date().toISOString().split("T")[0];
      let wellness: {
        sleepQuality?: number;
        muscleSoreness?: number;
        energyLevel?: number;
      } | null = null;
      try {
        const response = await firstValueFrom(
          this.api.get<{
            sleepQuality?: number;
            muscleSoreness?: number;
            energyLevel?: number;
          }>(`/api/wellness/checkin?date=${today}`),
        );
        wellness = extractApiPayload<{
          sleepQuality?: number;
          muscleSoreness?: number;
          energyLevel?: number;
        }>(response);
      } catch {
        // Wellness API failed, continue with null
      }

      // Only set metrics if we have real data - no defaults to avoid wrong calculations
      if (readiness || acwr || wellness) {
        this.athleteMetrics.set({
          readiness_score: readiness?.score ?? null,
          acwr: acwr?.acwr_ratio ?? null,
          fatigue_level: wellness?.energyLevel ?? null,
          sleep_quality: wellness?.sleepQuality ?? null,
          soreness_level: wellness?.muscleSoreness ?? null,
        });
      } else {
        // No data available - show empty state
        this.athleteMetrics.set(null);
      }
    } catch (error) {
      this.logger.warn(
        "Could not load all athlete metrics:",
        toLogContext(error),
      );
      // No defaults - show empty state
      this.athleteMetrics.set(null);
    }
  }

  private async loadSuggestions(userId: string): Promise<void> {
    try {
      const { suggestions: data, error } =
        await this.aiTrainingSchedulerDataService.getSuggestions(userId);

      if (error) {
        this.logger.warn("Error loading suggestions:", toLogContext(error));
        // Generate suggestions based on metrics
        this.generateLocalSuggestions();
        return;
      }

      if (data && data.length > 0) {
        this.suggestions.set(
          data.map((s) => ({
            id: s.id,
            type: isSuggestionType(s.suggestion_type)
              ? s.suggestion_type
              : "recovery",
            priority: isSuggestionPriority(s.priority) ? s.priority : "medium",
            message: s.message,
            reason: s.reason || "",
            date: new Date(s.created_at),
            accepted: s.accepted || false,
            dismissed: s.dismissed || false,
            affected_session_id: isString(s.affected_session_id)
              ? s.affected_session_id
              : undefined,
            suggested_changes: isRecord(s.suggested_changes)
              ? s.suggested_changes
              : undefined,
          })),
        );
      } else {
        // Generate suggestions based on current metrics
        this.generateLocalSuggestions();
      }
    } catch (error) {
      this.logger.warn("Error loading suggestions:", toLogContext(error));
      this.generateLocalSuggestions();
    }
  }

  private generateLocalSuggestions(): void {
    const metrics = this.athleteMetrics();
    const suggestions: AISuggestion[] = [];

    // Only generate suggestions if we have real data - no demo suggestions
    if (!metrics) {
      return;
    }

    // Generate suggestions based on metrics
    if (metrics.acwr !== null && metrics.acwr > 1.5) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: "reduce",
        priority: "high",
        message: "Reduce training load - ACWR is elevated",
        reason: `Your ACWR of ${metrics.acwr.toFixed(2)} indicates increased injury risk. Consider reducing intensity by 20-30%.`,
        date: new Date(),
        accepted: false,
        dismissed: false,
      });
    }

    if (metrics.readiness_score !== null && metrics.readiness_score < 60) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: "rest",
        priority: "high",
        message: "Consider a recovery day",
        reason: `Your readiness score of ${metrics.readiness_score}% suggests your body needs more recovery time.`,
        date: new Date(),
        accepted: false,
        dismissed: false,
      });
    }

    if (metrics.sleep_quality !== null && metrics.sleep_quality < 6) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: "recovery",
        priority: "medium",
        message: "Focus on sleep recovery",
        reason:
          "Poor sleep quality is affecting your recovery. Consider lighter training today.",
        date: new Date(),
        accepted: false,
        dismissed: false,
      });
    }

    if (metrics.soreness_level !== null && metrics.soreness_level > 7) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: "swap",
        priority: "medium",
        message: "Swap high-intensity session for mobility work",
        reason:
          "High soreness levels suggest active recovery would be more beneficial.",
        date: new Date(),
        accepted: false,
        dismissed: false,
      });
    }

    if (
      metrics.readiness_score !== null &&
      metrics.readiness_score > 80 &&
      metrics.acwr !== null &&
      metrics.acwr < 1.2
    ) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: "increase",
        priority: "low",
        message: "Good opportunity for progressive overload",
        reason:
          "Your metrics indicate you're well-recovered. Consider increasing intensity by 10%.",
        date: new Date(),
        accepted: false,
        dismissed: false,
      });
    }

    this.suggestions.set(suggestions);
  }

  private async loadScheduledSessions(userId: string): Promise<void> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const { sessions: data, error } =
        await this.aiTrainingSchedulerDataService.getScheduledSessions({
          userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      if (error) {
        this.logger.warn("Error loading sessions:", toLogContext(error));
        return;
      }

      this.scheduledSessions.set(
        (data || []).map((s) => ({
          id: s.id,
          date: isString(s.scheduled_date) ? s.scheduled_date : "",
          session_type: s.session_type || "Training",
          duration_minutes: s.duration_minutes || 60,
          intensity: s.intensity || "moderate",
          status: isString(s.status) ? s.status : "scheduled",
          ai_optimized: s.ai_optimized || false,
        })),
      );
    } catch (error) {
      this.logger.warn("Error loading sessions:", toLogContext(error));
    }
  }

  async generateNewPlan(): Promise<void> {
    this.isGenerating.set(true);

    try {
      const userId = this.currentUserId();
      if (!userId) return;

      // Regenerate suggestions based on current metrics
      this.generateLocalSuggestions();

      this.toastService.success(TOAST.SUCCESS.AI_SUGGESTIONS_GENERATED);
    } catch (error) {
      this.logger.error("Error generating plan:", error);
      this.toastService.error(TOAST.ERROR.AI_SUGGESTIONS_FAILED);
    } finally {
      this.isGenerating.set(false);
    }
  }

  async applySuggestion(suggestion: AISuggestion): Promise<void> {
    this.applyingId.set(suggestion.id);

    try {
      const userId = this.currentUserId();
      if (!userId) return;

      // Save to database if table exists
      try {
        await this.aiTrainingSchedulerDataService.upsertSuggestion({
          id: suggestion.id,
          userId,
          suggestionType: suggestion.type,
          priority: suggestion.priority,
          message: suggestion.message,
          reason: suggestion.reason,
          accepted: true,
          appliedAt: new Date().toISOString(),
        });
      } catch {
        // Table might not exist, continue with local update
      }

      // Update local state
      this.suggestions.update((suggestions) =>
        suggestions.map((s) =>
          s.id === suggestion.id ? { ...s, accepted: true } : s,
        ),
      );

      this.toastService.success(TOAST.SUCCESS.SUGGESTION_APPLIED);
    } catch (error) {
      this.logger.error("Error applying suggestion:", error);
      this.toastService.error(TOAST.ERROR.SUGGESTION_APPLY_FAILED);
    } finally {
      this.applyingId.set(null);
    }
  }

  async dismissSuggestion(suggestion: AISuggestion): Promise<void> {
    try {
      const userId = this.currentUserId();
      if (!userId) return;

      // Save dismissal to database if table exists
      try {
        await this.aiTrainingSchedulerDataService.upsertSuggestion({
          id: suggestion.id,
          userId,
          suggestionType: suggestion.type,
          message: suggestion.message,
          dismissed: true,
          dismissedAt: new Date().toISOString(),
        });
      } catch {
        // Table might not exist, continue with local update
      }

      // Update local state
      this.suggestions.update((suggestions) =>
        suggestions.filter((s) => s.id !== suggestion.id),
      );

      this.toastService.info(TOAST.INFO.SUGGESTION_DISMISSED);
    } catch (error) {
      this.logger.error("Error dismissing suggestion:", error);
    }
  }

  onDateSelect(date: Date): void {
    this.selectedDateControl.setValue(date);
  }

  getReadinessClass(): string {
    const metrics = this.athleteMetrics();
    if (!metrics || metrics.readiness_score === null) return "unknown";
    const score = metrics.readiness_score;
    if (score >= 80) return "excellent";
    if (score >= 65) return "good";
    if (score >= 50) return "moderate";
    return "low";
  }

  getSuggestionSeverity(
    type: string,
  ): "success" | "info" | "warning" | "secondary" | "contrast" | "danger" {
    switch (type) {
      case "swap":
        return "info";
      case "reduce":
        return "warning";
      case "increase":
        return "success";
      case "rest":
        return "secondary";
      case "recovery":
        return "info";
      case "intensity":
        return "warning";
      default:
        return "info";
    }
  }
}
