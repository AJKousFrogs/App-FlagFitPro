import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import { TagModule } from "primeng/tag";
import { SkeletonModule } from "primeng/skeleton";
import { ToastModule } from "primeng/toast";
import { ProgressBarModule } from "primeng/progressbar";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { AiConsentRequiredComponent } from "../../../shared/components/ai-consent-required/ai-consent-required.component";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { PrivacySettingsService } from "../../../core/services/privacy-settings.service";

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
  suggested_changes?: Record<string, any>;
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

interface AthleteMetrics {
  readiness_score: number;
  acwr: number;
  fatigue_level: number;
  sleep_quality: number;
  soreness_level: number;
}

@Component({
  selector: "app-ai-training-scheduler",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    CardModule,
    ButtonModule,
    DatePicker,
    TagModule,
    SkeletonModule,
    ToastModule,
    ProgressBarModule,
    MainLayoutComponent,
    PageHeaderComponent,
    AiConsentRequiredComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="ai-training-scheduler-page">
        <app-page-header
          title="AI Training Scheduler"
          subtitle="AI-powered training schedule optimization based on your readiness and performance"
          icon="pi-sparkles"
        >
          <p-button
            label="Generate New Plan"
            icon="pi pi-refresh"
            (onClick)="generateNewPlan()"
            [loading]="isGenerating()"
            [disabled]="!aiEnabled()"
          ></p-button>
        </app-page-header>

        <!-- AI Consent Required Banner -->
        @if (!aiEnabled()) {
          <app-ai-consent-required
            featureName="AI Training Scheduler"
            [showSettingsLink]="true"
            [status]="'disabled'"
            variant="banner"
          ></app-ai-consent-required>
        }

        <!-- Readiness Overview -->
        <div class="readiness-overview">
          <p-card class="readiness-card">
            <div class="readiness-header">
              <h3><i class="pi pi-heart-fill"></i> Your Readiness</h3>
              <span class="readiness-score" [class]="getReadinessClass()">
                {{ athleteMetrics().readiness_score }}%
              </span>
            </div>
            <div class="metrics-grid">
              <div class="metric-item">
                <span class="metric-label">ACWR</span>
                <span
                  class="metric-value"
                  [class.warning]="athleteMetrics().acwr > 1.5"
                >
                  {{ athleteMetrics().acwr.toFixed(2) }}
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Fatigue</span>
                <p-progressBar
                  [value]="athleteMetrics().fatigue_level"
                  [showValue]="false"
                  styleClass="fatigue-bar"
                ></p-progressBar>
              </div>
              <div class="metric-item">
                <span class="metric-label">Sleep</span>
                <span class="metric-value"
                  >{{ athleteMetrics().sleep_quality }}/10</span
                >
              </div>
              <div class="metric-item">
                <span class="metric-label">Soreness</span>
                <span class="metric-value"
                  >{{ athleteMetrics().soreness_level }}/10</span
                >
              </div>
            </div>
          </p-card>
        </div>

        <div class="scheduler-content">
          <!-- AI Suggestions -->
          <p-card class="suggestions-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3><i class="pi pi-sparkles"></i> AI Suggestions</h3>
                @if (pendingSuggestions().length > 0) {
                  <p-tag
                    [value]="pendingSuggestions().length + ' pending'"
                    severity="info"
                  ></p-tag>
                }
              </div>
            </ng-template>

            @if (isLoading()) {
              <div class="suggestions-list">
                @for (i of [1, 2, 3]; track i) {
                  <div class="suggestion-item">
                    <div class="suggestion-content">
                      <p-skeleton width="80px" height="24px"></p-skeleton>
                      <p-skeleton
                        width="100%"
                        height="40px"
                        class="mt-2"
                      ></p-skeleton>
                      <p-skeleton
                        width="120px"
                        height="14px"
                        class="mt-2"
                      ></p-skeleton>
                    </div>
                  </div>
                }
              </div>
            } @else if (suggestions().length === 0) {
              <div class="empty-state">
                <i class="pi pi-check-circle"></i>
                <h4>All Optimized!</h4>
                <p>No suggestions at this time. Your schedule looks optimal!</p>
              </div>
            } @else {
              <div class="suggestions-list">
                @for (suggestion of suggestions(); track suggestion.id) {
                  <div
                    class="suggestion-item"
                    [class.accepted]="suggestion.accepted"
                    [class.priority-high]="suggestion.priority === 'high'"
                  >
                    <div class="suggestion-content">
                      <div class="suggestion-tags">
                        <p-tag
                          [value]="suggestion.type"
                          [severity]="getSuggestionSeverity(suggestion.type)"
                        ></p-tag>
                        @if (suggestion.priority === "high") {
                          <p-tag value="Priority" severity="danger"></p-tag>
                        }
                      </div>
                      <p class="suggestion-message">{{ suggestion.message }}</p>
                      <p class="suggestion-reason">{{ suggestion.reason }}</p>
                      <small class="suggestion-date">
                        {{ suggestion.date | date: "MMM d, y 'at' h:mm a" }}
                      </small>
                    </div>
                    <div class="suggestion-actions">
                      @if (!suggestion.accepted && !suggestion.dismissed) {
                        <p-button
                          label="Apply"
                          icon="pi pi-check"
                          size="small"
                          (onClick)="applySuggestion(suggestion)"
                          [loading]="applyingId() === suggestion.id"
                        ></p-button>
                        <p-button
                          label="Dismiss"
                          [outlined]="true"
                          severity="secondary"
                          size="small"
                          (onClick)="dismissSuggestion(suggestion)"
                        ></p-button>
                      } @else if (suggestion.accepted) {
                        <p-tag value="Applied" severity="success"></p-tag>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </p-card>

          <!-- Optimized Schedule -->
          <div class="schedule-section">
            <p-card class="calendar-card">
              <ng-template pTemplate="header">
                <h3><i class="pi pi-calendar"></i> Optimized Schedule</h3>
              </ng-template>
              <p-datepicker
                [(ngModel)]="selectedDate"
                [inline]="true"
                [showWeek]="true"
                (onSelect)="onDateSelect($event)"
              ></p-datepicker>
            </p-card>

            <p-card class="sessions-card">
              <ng-template pTemplate="header">
                <h3>Sessions for {{ selectedDate() | date: "MMM d" }}</h3>
              </ng-template>
              @if (selectedDateSessions().length === 0) {
                <div class="empty-sessions">
                  <p>No sessions scheduled for this date</p>
                  <p-button
                    label="Add Session"
                    icon="pi pi-plus"
                    [outlined]="true"
                    size="small"
                  ></p-button>
                </div>
              } @else {
                <div class="sessions-list">
                  @for (session of selectedDateSessions(); track session.id) {
                    <div
                      class="session-item"
                      [class.ai-optimized]="session.ai_optimized"
                    >
                      <div class="session-info">
                        <h4>{{ session.session_type }}</h4>
                        <p>
                          {{ session.duration_minutes }} min •
                          {{ session.intensity }}
                        </p>
                      </div>
                      @if (session.ai_optimized) {
                        <p-tag
                          value="AI Optimized"
                          severity="success"
                          icon="pi pi-sparkles"
                        ></p-tag>
                      }
                    </div>
                  }
                </div>
              }
            </p-card>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .ai-training-scheduler-page {
        padding: var(--space-6);
      }

      .readiness-overview {
        margin-top: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .readiness-card {
        background: linear-gradient(
          135deg,
          var(--p-surface-50),
          var(--p-surface-100)
        );
      }

      .readiness-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .readiness-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        font-size: 1.125rem;
      }

      .readiness-score {
        font-size: 2rem;
        font-weight: 700;
      }

      .readiness-score.excellent {
        color: var(--p-green-500);
      }

      .readiness-score.good {
        color: var(--p-blue-500);
      }

      .readiness-score.moderate {
        color: var(--p-yellow-500);
      }

      .readiness-score.low {
        color: var(--p-red-500);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-4);
      }

      @media (max-width: 768px) {
        .metrics-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .metric-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .metric-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
      }

      .metric-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .metric-value.warning {
        color: var(--p-red-500);
      }

      .scheduler-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
      }

      @media (max-width: 1024px) {
        .scheduler-content {
          grid-template-columns: 1fr;
        }
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .card-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
      }

      .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .suggestion-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        border-left: 4px solid transparent;
        transition: all 0.2s;
      }

      .suggestion-item.priority-high {
        border-left-color: var(--p-red-500);
        background: var(--p-red-50);
      }

      .suggestion-item.accepted {
        opacity: 0.7;
        background: var(--p-green-50);
        border-left-color: var(--p-green-500);
      }

      .suggestion-content {
        flex: 1;
      }

      .suggestion-tags {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .suggestion-message {
        margin: var(--space-2) 0;
        color: var(--text-primary);
        font-weight: 500;
      }

      .suggestion-reason {
        margin: 0 0 var(--space-2);
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .suggestion-date {
        color: var(--text-tertiary);
        font-size: 0.75rem;
      }

      .suggestion-actions {
        display: flex;
        gap: var(--space-2);
        margin-left: var(--space-4);
      }

      .empty-state {
        text-align: center;
        padding: var(--space-8);
        color: var(--text-secondary);
      }

      .empty-state i {
        font-size: 3rem;
        color: var(--p-green-500);
        margin-bottom: var(--space-4);
      }

      .empty-state h4 {
        margin: 0 0 var(--space-2);
        color: var(--text-primary);
      }

      .schedule-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .sessions-card {
        margin-top: var(--space-4);
      }

      .sessions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .session-item.ai-optimized {
        border-left: 3px solid var(--p-green-500);
      }

      .session-info h4 {
        margin: 0;
        font-size: 1rem;
      }

      .session-info p {
        margin: var(--space-1) 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .empty-sessions {
        text-align: center;
        padding: var(--space-6);
        color: var(--text-secondary);
      }

      .empty-sessions p {
        margin-bottom: var(--space-4);
      }
    `,
  ],
})
export class AiTrainingSchedulerComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private privacyService = inject(PrivacySettingsService);

  // AI consent check - shows banner when disabled
  readonly aiEnabled = this.privacyService.aiProcessingEnabled;

  selectedDate = signal<Date>(new Date());
  suggestions = signal<AISuggestion[]>([]);
  scheduledSessions = signal<ScheduledSession[]>([]);
  athleteMetrics = signal<AthleteMetrics>({
    readiness_score: 75,
    acwr: 1.1,
    fatigue_level: 40,
    sleep_quality: 7,
    soreness_level: 3,
  });

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

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.logger.warn("No user found");
        return;
      }

      // Load athlete metrics
      await this.loadAthleteMetrics(user.id);

      // Load AI suggestions
      await this.loadSuggestions(user.id);

      // Load scheduled sessions
      await this.loadScheduledSessions(user.id);
    } catch (error) {
      this.logger.error("Error loading AI scheduler data:", error);
      this.toastService.error("Failed to load training data");
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAthleteMetrics(userId: string): Promise<void> {
    try {
      // Load readiness data
      const { data: readiness } = await this.supabaseService.client
        .from("readiness_scores")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      // Load ACWR data
      const { data: acwr } = await this.supabaseService.client
        .from("acwr_calculations")
        .select("acwr_ratio")
        .eq("user_id", userId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .single();

      // Load wellness data
      const { data: wellness } = await this.supabaseService.client
        .from("wellness_logs")
        .select("sleep_quality, soreness, fatigue")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      this.athleteMetrics.set({
        readiness_score: readiness?.score || 75,
        acwr: acwr?.acwr_ratio || 1.0,
        fatigue_level: wellness?.fatigue || 40,
        sleep_quality: wellness?.sleep_quality || 7,
        soreness_level: wellness?.soreness || 3,
      });
    } catch (error) {
      this.logger.warn("Could not load all athlete metrics:", error);
      // Use defaults
    }
  }

  private async loadSuggestions(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("ai_training_suggestions")
        .select("*")
        .eq("user_id", userId)
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        this.logger.warn("Error loading suggestions:", error);
        // Generate suggestions based on metrics
        this.generateLocalSuggestions();
        return;
      }

      if (data && data.length > 0) {
        this.suggestions.set(
          data.map((s) => ({
            id: s.id,
            type: s.suggestion_type,
            priority: s.priority || "medium",
            message: s.message,
            reason: s.reason || "",
            date: new Date(s.created_at),
            accepted: s.accepted || false,
            dismissed: s.dismissed || false,
            affected_session_id: s.affected_session_id,
            suggested_changes: s.suggested_changes,
          })),
        );
      } else {
        // Generate suggestions based on current metrics
        this.generateLocalSuggestions();
      }
    } catch (error) {
      this.logger.warn("Error loading suggestions:", error);
      this.generateLocalSuggestions();
    }
  }

  private generateLocalSuggestions(): void {
    const metrics = this.athleteMetrics();
    const suggestions: AISuggestion[] = [];

    // Generate suggestions based on metrics
    if (metrics.acwr > 1.5) {
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

    if (metrics.readiness_score < 60) {
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

    if (metrics.sleep_quality < 6) {
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

    if (metrics.soreness_level > 7) {
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

    if (metrics.readiness_score > 80 && metrics.acwr < 1.2) {
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

      const { data, error } = await this.supabaseService.client
        .from("training_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("scheduled_date", startDate.toISOString())
        .lte("scheduled_date", endDate.toISOString())
        .order("scheduled_date", { ascending: true });

      if (error) {
        this.logger.warn("Error loading sessions:", error);
        return;
      }

      this.scheduledSessions.set(
        (data || []).map((s) => ({
          id: s.id,
          date: s.scheduled_date,
          session_type: s.session_type || "Training",
          duration_minutes: s.duration_minutes || 60,
          intensity: s.intensity || "moderate",
          status: s.status,
          ai_optimized: s.ai_optimized || false,
        })),
      );
    } catch (error) {
      this.logger.warn("Error loading sessions:", error);
    }
  }

  async generateNewPlan(): Promise<void> {
    this.isGenerating.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Regenerate suggestions based on current metrics
      this.generateLocalSuggestions();

      this.toastService.success("New AI suggestions generated!");
    } catch (error) {
      this.logger.error("Error generating plan:", error);
      this.toastService.error("Failed to generate new plan");
    } finally {
      this.isGenerating.set(false);
    }
  }

  async applySuggestion(suggestion: AISuggestion): Promise<void> {
    this.applyingId.set(suggestion.id);

    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Save to database if table exists
      try {
        await this.supabaseService.client
          .from("ai_training_suggestions")
          .upsert({
            id: suggestion.id,
            user_id: user.id,
            suggestion_type: suggestion.type,
            priority: suggestion.priority,
            message: suggestion.message,
            reason: suggestion.reason,
            accepted: true,
            applied_at: new Date().toISOString(),
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

      this.toastService.success("Suggestion applied to your schedule!");
    } catch (error) {
      this.logger.error("Error applying suggestion:", error);
      this.toastService.error("Failed to apply suggestion");
    } finally {
      this.applyingId.set(null);
    }
  }

  async dismissSuggestion(suggestion: AISuggestion): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Save dismissal to database if table exists
      try {
        await this.supabaseService.client
          .from("ai_training_suggestions")
          .upsert({
            id: suggestion.id,
            user_id: user.id,
            suggestion_type: suggestion.type,
            message: suggestion.message,
            dismissed: true,
            dismissed_at: new Date().toISOString(),
          });
      } catch {
        // Table might not exist, continue with local update
      }

      // Update local state
      this.suggestions.update((suggestions) =>
        suggestions.filter((s) => s.id !== suggestion.id),
      );

      this.toastService.info("Suggestion dismissed");
    } catch (error) {
      this.logger.error("Error dismissing suggestion:", error);
    }
  }

  onDateSelect(date: Date): void {
    this.selectedDate.set(date);
  }

  getReadinessClass(): string {
    const score = this.athleteMetrics().readiness_score;
    if (score >= 80) return "excellent";
    if (score >= 65) return "good";
    if (score >= 50) return "moderate";
    return "low";
  }

  getSuggestionSeverity(
    type: string,
  ):
    | "success"
    | "info"
    | "warn"
    | "secondary"
    | "contrast"
    | "danger"
    | null
    | undefined {
    switch (type) {
      case "swap":
        return "info";
      case "reduce":
        return "warn";
      case "increase":
        return "success";
      case "rest":
        return "secondary";
      case "recovery":
        return "info";
      case "intensity":
        return "warn";
      default:
        return "info";
    }
  }
}
