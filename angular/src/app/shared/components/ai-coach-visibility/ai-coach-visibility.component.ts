import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Input,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { FormsModule } from "@angular/forms";
import { TooltipModule } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";

/**
 * AI Recommendation from the backend
 */
interface AIRecommendation {
  id: string;
  user_id: string;
  player_name?: string;
  recommendation_type: string;
  reason: string;
  recommendation_data?: Record<string, unknown>;
  status: "pending" | "accepted" | "rejected" | "completed" | "expired";
  created_at: string;
  accepted_at?: string;
  rejected_at?: string;
  completed_at?: string;
  outcome?: string;
  risk_level?: "low" | "medium" | "high";
}

/**
 * AI Message with risk classification
 */
interface AIMessage {
  id: string;
  user_id: string;
  player_name?: string;
  content: string;
  risk_level: "low" | "medium" | "high";
  intent?: string;
  created_at: string;
}

/**
 * Coach visibility record
 */
interface CoachVisibilityRecord {
  id: string;
  recommendation_id?: string;
  message_id?: string;
  player_id: string;
  player_name?: string;
  visibility_type: "risk_warning" | "recommendation" | "override" | "note";
  coach_notes?: string;
  override_reason?: string;
  viewed_at?: string;
  created_at: string;
  recommendation?: AIRecommendation;
  message?: AIMessage;
}

/**
 * AI Coach Visibility Component
 *
 * Displays AI recommendations and high-risk interactions for coaches
 * to monitor their players' AI coaching sessions.
 */
@Component({
  selector: "app-ai-coach-visibility",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    TextareaModule,
    FormsModule,
    TooltipModule,
    SkeletonModule,
  ],
  template: `
    <div class="ai-coach-visibility">
      <!-- Summary Stats -->
      <div class="visibility-stats">
        <div class="stat-card risk-high">
          <div class="stat-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ highRiskCount() }}</span>
            <span class="stat-label">High Risk Queries</span>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingRecommendations() }}</span>
            <span class="stat-label">Pending Actions</span>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">
            <i class="pi pi-comments"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalInteractions() }}</span>
            <span class="stat-label">AI Interactions</span>
          </div>
        </div>
      </div>

      <!-- High Risk Alerts -->
      @if (highRiskAlerts().length > 0) {
        <p-card class="alerts-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>
                <i class="pi pi-exclamation-triangle"></i>
                High Risk Alerts
              </h3>
              <span class="alert-count">{{ highRiskAlerts().length }}</span>
            </div>
          </ng-template>
          <div class="alerts-list">
            @for (alert of highRiskAlerts(); track alert.id) {
              <div class="alert-item" [class.unviewed]="!alert.viewed_at">
                <div class="alert-icon">
                  <i class="pi pi-user"></i>
                </div>
                <div class="alert-content">
                  <div class="alert-header">
                    <span class="player-name">{{
                      alert.player_name || "Player"
                    }}</span>
                    <p-tag
                      value="High Risk"
                      severity="danger"
                      [rounded]="true"
                    ></p-tag>
                  </div>
                  <p class="alert-message">
                    {{
                      alert.message?.content ||
                        alert.recommendation?.reason ||
                        "AI interaction flagged for review"
                    }}
                  </p>
                  <div class="alert-meta">
                    <span class="alert-time">
                      <i class="pi pi-clock"></i>
                      {{ formatDate(alert.created_at) }}
                    </span>
                    @if (alert.message?.intent) {
                      <span class="alert-intent">
                        <i class="pi pi-tag"></i>
                        {{ alert.message.intent }}
                      </span>
                    }
                  </div>
                </div>
                <div class="alert-actions">
                  <p-button
                    icon="pi pi-eye"
                    [text]="true"
                    [rounded]="true"
                    severity="secondary"
                    pTooltip="View Details"
                    (onClick)="viewAlert(alert)"
                  ></p-button>
                  <p-button
                    icon="pi pi-comment"
                    [text]="true"
                    [rounded]="true"
                    severity="info"
                    pTooltip="Add Note"
                    (onClick)="openNoteDialog(alert)"
                  ></p-button>
                </div>
              </div>
            }
          </div>
        </p-card>
      }

      <!-- Recommendations Table -->
      <p-card class="recommendations-card">
        <ng-template pTemplate="header">
          <div class="card-header">
            <h3>
              <i class="pi pi-lightbulb"></i>
              AI Recommendations to Players
            </h3>
          </div>
        </ng-template>

        @if (loading()) {
          <div class="loading-state">
            @for (i of [1, 2, 3]; track i) {
              <p-skeleton height="60px" styleClass="mb-2"></p-skeleton>
            }
          </div>
        } @else if (recommendations().length === 0) {
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>No AI recommendations yet</p>
            <span>Recommendations made to your players will appear here</span>
          </div>
        } @else {
          <p-table
            [value]="recommendations()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[5, 10, 25]"
            [globalFilterFields]="[
              'player_name',
              'recommendation_type',
              'reason',
            ]"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Player</th>
                <th>Type</th>
                <th>Recommendation</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-rec>
              <tr>
                <td>
                  <div class="player-cell">
                    <span class="player-avatar">
                      {{ getInitials(rec.player_name) }}
                    </span>
                    <span>{{ rec.player_name || "Unknown" }}</span>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="formatRecType(rec.recommendation_type)"
                    [severity]="getRecTypeSeverity(rec.recommendation_type)"
                  ></p-tag>
                </td>
                <td class="reason-cell">
                  <span [pTooltip]="rec.reason" tooltipPosition="top">
                    {{ truncate(rec.reason, 50) }}
                  </span>
                </td>
                <td>
                  <p-tag
                    [value]="rec.status | titlecase"
                    [severity]="getStatusSeverity(rec.status)"
                  ></p-tag>
                </td>
                <td class="date-cell">
                  {{ formatDate(rec.created_at) }}
                </td>
                <td>
                  <div class="action-buttons">
                    <p-button
                      icon="pi pi-eye"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      pTooltip="View"
                      (onClick)="viewRecommendation(rec)"
                    ></p-button>
                    @if (rec.status === "pending") {
                      <p-button
                        icon="pi pi-times"
                        [text]="true"
                        [rounded]="true"
                        severity="danger"
                        pTooltip="Override"
                        (onClick)="openOverrideDialog(rec)"
                      ></p-button>
                    }
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>

      <!-- Note Dialog -->
      <p-dialog
        header="Add Coach Note"
        [(visible)]="noteDialogVisible"
        [modal]="true"
        [style]="{ width: '450px' }"
        [closable]="true"
      >
        <div class="dialog-content">
          <p class="dialog-context">
            Adding note for:
            <strong>{{ selectedRecord()?.player_name || "Player" }}</strong>
          </p>
          <textarea
            pInputTextarea
            [(ngModel)]="coachNote"
            placeholder="Enter your note..."
            [rows]="4"
            class="w-full"
          ></textarea>
        </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="noteDialogVisible = false"
          ></p-button>
          <p-button
            label="Save Note"
            icon="pi pi-check"
            (onClick)="saveNote()"
            [disabled]="!coachNote.trim()"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Override Dialog -->
      <p-dialog
        header="Override Recommendation"
        [(visible)]="overrideDialogVisible"
        [modal]="true"
        [style]="{ width: '450px' }"
        [closable]="true"
      >
        <div class="dialog-content">
          <div class="override-warning">
            <i class="pi pi-exclamation-triangle"></i>
            <p>
              You are about to override an AI recommendation. The player will be
              notified that their coach has reviewed this suggestion.
            </p>
          </div>
          <p class="dialog-context">
            Recommendation:
            <strong>{{ selectedRecommendation()?.reason }}</strong>
          </p>
          <label class="field-label">Override Reason</label>
          <textarea
            pInputTextarea
            [(ngModel)]="overrideReason"
            placeholder="Explain why you're overriding this recommendation..."
            [rows]="4"
            class="w-full"
          ></textarea>
        </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="overrideDialogVisible = false"
          ></p-button>
          <p-button
            label="Override"
            icon="pi pi-times"
            severity="danger"
            (onClick)="submitOverride()"
            [disabled]="!overrideReason.trim()"
          ></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styleUrl: './ai-coach-visibility.component.scss',
})
export class AiCoachVisibilityComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  @Input() teamId?: string;

  // State
  loading = signal(true);
  recommendations = signal<AIRecommendation[]>([]);
  highRiskAlerts = signal<CoachVisibilityRecord[]>([]);
  selectedRecord = signal<CoachVisibilityRecord | null>(null);
  selectedRecommendation = signal<AIRecommendation | null>(null);

  // Computed
  highRiskCount = computed(
    () => this.highRiskAlerts().filter((a) => !a.viewed_at).length,
  );
  pendingRecommendations = computed(
    () => this.recommendations().filter((r) => r.status === "pending").length,
  );
  totalInteractions = computed(
    () => this.recommendations().length + this.highRiskAlerts().length,
  );

  // Dialog state
  noteDialogVisible = false;
  overrideDialogVisible = false;
  coachNote = "";
  overrideReason = "";

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      await Promise.all([
        this.loadRecommendations(),
        this.loadHighRiskAlerts(),
      ]);
    } catch (error) {
      this.logger.error("Error loading AI coach visibility data:", error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadRecommendations(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Load AI recommendations from Supabase
      let query = this.supabaseService.client
        .from("ai_recommendations")
        .select(
          `
          id,
          user_id,
          recommendation_type,
          reason,
          recommendation_data,
          status,
          created_at,
          accepted_at,
          rejected_at,
          completed_at,
          outcome
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      // If teamId is provided, filter by team members
      if (this.teamId) {
        const { data: teamMembers } = await this.supabaseService.client
          .from("team_members")
          .select("user_id")
          .eq("team_id", this.teamId);

        if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map((m) => m.user_id);
          query = query.in("user_id", memberIds);
        }
      }

      const { data, error } = await query;

      if (error) {
        this.logger.warn("Error loading recommendations:", error);
        return;
      }

      if (data && data.length > 0) {
        // Enrich with player names
        const userIds = [...new Set(data.map((r) => r.user_id))];
        const { data: users } = await this.supabaseService.client
          .from("users")
          .select("id, first_name, last_name")
          .in("id", userIds);

        const userMap = new Map(
          users?.map((u) => [u.id, `${u.first_name} ${u.last_name}`]) || [],
        );

        const enrichedData: AIRecommendation[] = data.map((r) => ({
          ...r,
          player_name: userMap.get(r.user_id) || "Unknown Player",
          risk_level: this.getRiskLevelFromType(r.recommendation_type),
        }));

        this.recommendations.set(enrichedData);
      } else {
        this.recommendations.set([]);
      }
    } catch (error) {
      this.logger.error("Error loading recommendations:", error);
      this.recommendations.set([]);
    }
  }

  async loadHighRiskAlerts(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Load high-risk AI coach visibility records
      let query = this.supabaseService.client
        .from("ai_coach_visibility")
        .select(
          `
          id,
          recommendation_id,
          message_id,
          player_id,
          visibility_type,
          coach_notes,
          override_reason,
          viewed_at,
          created_at
        `,
        )
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (this.teamId) {
        query = query.eq("team_id", this.teamId);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.warn("Error loading alerts:", error);
        return;
      }

      if (data && data.length > 0) {
        // Enrich with player names
        const playerIds = [...new Set(data.map((r) => r.player_id))];
        const { data: users } = await this.supabaseService.client
          .from("users")
          .select("id, first_name, last_name")
          .in("id", playerIds);

        const userMap = new Map(
          users?.map((u) => [u.id, `${u.first_name} ${u.last_name}`]) || [],
        );

        const enrichedData: CoachVisibilityRecord[] = data.map((r) => ({
          ...r,
          player_name: userMap.get(r.player_id) || "Unknown Player",
        }));

        this.highRiskAlerts.set(enrichedData);
      } else {
        this.highRiskAlerts.set([]);
      }
    } catch (error) {
      this.logger.error("Error loading alerts:", error);
      this.highRiskAlerts.set([]);
    }
  }

  private getRiskLevelFromType(type: string): "low" | "medium" | "high" {
    const highRiskTypes = ["reduce_load", "ask_coach"];
    const mediumRiskTypes = ["modify_plan", "schedule_recovery"];
    if (highRiskTypes.includes(type)) return "high";
    if (mediumRiskTypes.includes(type)) return "medium";
    return "low";
  }

  // Actions
  viewAlert(alert: CoachVisibilityRecord): void {
    this.selectedRecord.set(alert);
    this.markAsViewed(alert.id);
  }

  viewRecommendation(rec: AIRecommendation): void {
    this.selectedRecommendation.set(rec);
  }

  openNoteDialog(record: CoachVisibilityRecord): void {
    this.selectedRecord.set(record);
    this.coachNote = record.coach_notes || "";
    this.noteDialogVisible = true;
  }

  openOverrideDialog(rec: AIRecommendation): void {
    this.selectedRecommendation.set(rec);
    this.overrideReason = "";
    this.overrideDialogVisible = true;
  }

  async saveNote(): Promise<void> {
    const record = this.selectedRecord();
    if (!record || !this.coachNote.trim()) return;

    try {
      const { error } = await this.supabaseService.client
        .from("ai_coach_visibility")
        .update({ coach_notes: this.coachNote })
        .eq("id", record.id);

      if (error) throw error;

      // Update local state
      const alerts = this.highRiskAlerts();
      const index = alerts.findIndex((a) => a.id === record.id);
      if (index !== -1) {
        alerts[index] = { ...alerts[index], coach_notes: this.coachNote };
        this.highRiskAlerts.set([...alerts]);
      }

      this.toastService.success("Note saved successfully");
    } catch (error) {
      this.logger.error("Error saving note:", error);
      this.toastService.error("Failed to save note");
    }

    this.noteDialogVisible = false;
    this.coachNote = "";
  }

  async submitOverride(): Promise<void> {
    const rec = this.selectedRecommendation();
    if (!rec || !this.overrideReason.trim()) return;

    try {
      const { error } = await this.supabaseService.client
        .from("ai_recommendations")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
        })
        .eq("id", rec.id);

      if (error) throw error;

      // Create visibility record for the override
      const user = this.authService.getUser();
      if (user?.id) {
        await this.supabaseService.client.from("ai_coach_visibility").insert({
          recommendation_id: rec.id,
          coach_id: user.id,
          player_id: rec.user_id,
          team_id: this.teamId || null,
          visibility_type: "override",
          override_reason: this.overrideReason,
        });
      }

      // Update local state
      const recs = this.recommendations();
      const index = recs.findIndex((r) => r.id === rec.id);
      if (index !== -1) {
        recs[index] = { ...recs[index], status: "rejected" };
        this.recommendations.set([...recs]);
      }

      this.toastService.success("Recommendation overridden");
    } catch (error) {
      this.logger.error("Error overriding recommendation:", error);
      this.toastService.error("Failed to override recommendation");
    }

    this.overrideDialogVisible = false;
    this.overrideReason = "";
  }

  async markAsViewed(recordId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("ai_coach_visibility")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", recordId);

      if (error) throw error;

      const alerts = this.highRiskAlerts();
      const index = alerts.findIndex((a) => a.id === recordId);
      if (index !== -1) {
        alerts[index] = {
          ...alerts[index],
          viewed_at: new Date().toISOString(),
        };
        this.highRiskAlerts.set([...alerts]);
      }
    } catch (error) {
      this.logger.error("Error marking as viewed:", error);
    }
  }

  // Helpers
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  formatRecType(type: string): string {
    const types: Record<string, string> = {
      create_session: "New Session",
      modify_plan: "Plan Change",
      add_exercise: "Exercise",
      read_article: "Article",
      ask_coach: "Consult Coach",
      schedule_recovery: "Recovery",
      reduce_load: "Reduce Load",
      increase_load: "Increase Load",
    };
    return types[type] || type;
  }

  getRecTypeSeverity(
    type: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      create_session: "info",
      modify_plan: "warn",
      add_exercise: "success",
      reduce_load: "danger",
      increase_load: "warn",
      ask_coach: "secondary",
    };
    return severities[type] || "info";
  }

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      pending: "warn",
      accepted: "success",
      rejected: "danger",
      completed: "success",
      expired: "secondary",
    };
    return severities[status] || "info";
  }

  getInitials(name?: string): string {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + "...";
  }
}
