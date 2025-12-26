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
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";

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
                    <span class="player-name">{{ alert.player_name || 'Player' }}</span>
                    <p-tag
                      value="High Risk"
                      severity="danger"
                      [rounded]="true"
                    ></p-tag>
                  </div>
                  <p class="alert-message">
                    {{ alert.message?.content || alert.recommendation?.reason || 'AI interaction flagged for review' }}
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
            [globalFilterFields]="['player_name', 'recommendation_type', 'reason']"
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
                    <span>{{ rec.player_name || 'Unknown' }}</span>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="formatRecType(rec.recommendation_type)"
                    [severity]="getRecTypeSeverity(rec.recommendation_type)"
                  ></p-tag>
                </td>
                <td class="reason-cell">
                  <span
                    [pTooltip]="rec.reason"
                    tooltipPosition="top"
                  >
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
                    @if (rec.status === 'pending') {
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
            Adding note for: <strong>{{ selectedRecord()?.player_name || 'Player' }}</strong>
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
            Recommendation: <strong>{{ selectedRecommendation()?.reason }}</strong>
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
  styles: [
    `
      .ai-coach-visibility {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .visibility-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-4);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
      }

      .stat-card.risk-high {
        border-left: 4px solid #ef4444;
      }

      .stat-card.pending {
        border-left: 4px solid #f59e0b;
      }

      .stat-card.total {
        border-left: 4px solid #3b82f6;
      }

      .stat-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--p-surface-100);
      }

      .stat-card.risk-high .stat-icon {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      .stat-card.pending .stat-icon {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }

      .stat-card.total .stat-icon {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4);
      }

      .card-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .alert-count {
        background: #ef4444;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .alerts-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .alert-item {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-4);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-50);
        border: 1px solid var(--p-surface-200);
        transition: all 0.2s;
      }

      .alert-item.unviewed {
        border-left: 3px solid #ef4444;
        background: rgba(239, 68, 68, 0.05);
      }

      .alert-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--p-surface-200);
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      .alert-content {
        flex: 1;
        min-width: 0;
      }

      .alert-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-1);
      }

      .player-name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .alert-message {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0 0 var(--space-2) 0;
        line-height: 1.4;
      }

      .alert-meta {
        display: flex;
        gap: var(--space-4);
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }

      .alert-meta span {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .alert-actions {
        display: flex;
        gap: var(--space-1);
        align-items: flex-start;
      }

      .loading-state,
      .empty-state {
        padding: var(--space-8);
        text-align: center;
      }

      .empty-state i {
        font-size: 3rem;
        color: var(--p-surface-300);
        margin-bottom: var(--space-4);
      }

      .empty-state p {
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 var(--space-2) 0;
      }

      .empty-state span {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .player-cell {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .player-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--color-brand-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .reason-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .date-cell {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-1);
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .dialog-context {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .override-warning {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3);
        background: rgba(245, 158, 11, 0.1);
        border-radius: var(--p-border-radius);
        color: #b45309;
      }

      .override-warning i {
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .override-warning p {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .field-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      @media (max-width: 768px) {
        .visibility-stats {
          grid-template-columns: 1fr;
        }

        .alert-item {
          flex-direction: column;
        }

        .alert-actions {
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class AiCoachVisibilityComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  @Input() teamId?: string;

  // State
  loading = signal(true);
  recommendations = signal<AIRecommendation[]>([]);
  highRiskAlerts = signal<CoachVisibilityRecord[]>([]);
  selectedRecord = signal<CoachVisibilityRecord | null>(null);
  selectedRecommendation = signal<AIRecommendation | null>(null);

  // Computed
  highRiskCount = computed(
    () => this.highRiskAlerts().filter((a) => !a.viewed_at).length
  );
  pendingRecommendations = computed(
    () => this.recommendations().filter((r) => r.status === "pending").length
  );
  totalInteractions = computed(
    () => this.recommendations().length + this.highRiskAlerts().length
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
      // Load recommendations for team players
      await Promise.all([
        this.loadRecommendations(),
        this.loadHighRiskAlerts(),
      ]);
    } catch (error) {
      console.error("Error loading AI coach visibility data:", error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadRecommendations(): Promise<void> {
    try {
      // This would call a coach-specific endpoint to get player recommendations
      const response = await this.apiService
        .get<{ data: AIRecommendation[] }>("/api/coach/ai-recommendations", {
          teamId: this.teamId,
        })
        .toPromise();

      if (response?.data) {
        this.recommendations.set(response.data);
      } else {
        // Mock data for development
        this.recommendations.set(this.getMockRecommendations());
      }
    } catch {
      // Use mock data if endpoint doesn't exist yet
      this.recommendations.set(this.getMockRecommendations());
    }
  }

  async loadHighRiskAlerts(): Promise<void> {
    try {
      const response = await this.apiService
        .get<{ data: CoachVisibilityRecord[] }>("/api/coach/ai-alerts", {
          teamId: this.teamId,
        })
        .toPromise();

      if (response?.data) {
        this.highRiskAlerts.set(response.data);
      } else {
        this.highRiskAlerts.set(this.getMockAlerts());
      }
    } catch {
      this.highRiskAlerts.set(this.getMockAlerts());
    }
  }

  // Actions
  viewAlert(alert: CoachVisibilityRecord): void {
    this.selectedRecord.set(alert);
    // Mark as viewed
    this.markAsViewed(alert.id);
  }

  viewRecommendation(rec: AIRecommendation): void {
    this.selectedRecommendation.set(rec);
    // Could open a detail dialog
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
      await this.apiService
        .post("/api/coach/ai-visibility/note", {
          recordId: record.id,
          note: this.coachNote,
        })
        .toPromise();

      // Update local state
      const alerts = this.highRiskAlerts();
      const index = alerts.findIndex((a) => a.id === record.id);
      if (index !== -1) {
        alerts[index] = { ...alerts[index], coach_notes: this.coachNote };
        this.highRiskAlerts.set([...alerts]);
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }

    this.noteDialogVisible = false;
    this.coachNote = "";
  }

  async submitOverride(): Promise<void> {
    const rec = this.selectedRecommendation();
    if (!rec || !this.overrideReason.trim()) return;

    try {
      await this.apiService
        .post("/api/coach/ai-recommendations/override", {
          recommendationId: rec.id,
          reason: this.overrideReason,
        })
        .toPromise();

      // Update local state
      const recs = this.recommendations();
      const index = recs.findIndex((r) => r.id === rec.id);
      if (index !== -1) {
        recs[index] = { ...recs[index], status: "rejected" };
        this.recommendations.set([...recs]);
      }
    } catch (error) {
      console.error("Error overriding recommendation:", error);
    }

    this.overrideDialogVisible = false;
    this.overrideReason = "";
  }

  async markAsViewed(recordId: string): Promise<void> {
    try {
      await this.apiService
        .post("/api/coach/ai-visibility/viewed", { recordId })
        .toPromise();

      const alerts = this.highRiskAlerts();
      const index = alerts.findIndex((a) => a.id === recordId);
      if (index !== -1) {
        alerts[index] = { ...alerts[index], viewed_at: new Date().toISOString() };
        this.highRiskAlerts.set([...alerts]);
      }
    } catch (error) {
      console.error("Error marking as viewed:", error);
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
    type: string
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
    status: string
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

  // Mock data for development
  private getMockRecommendations(): AIRecommendation[] {
    return [
      {
        id: "1",
        user_id: "player-1",
        player_name: "Alex Johnson",
        recommendation_type: "reduce_load",
        reason: "ACWR is 1.52, recommend reducing training load by 20%",
        status: "pending",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        risk_level: "high",
      },
      {
        id: "2",
        user_id: "player-2",
        player_name: "Sarah Williams",
        recommendation_type: "add_exercise",
        reason: "Add hamstring strengthening exercises for injury prevention",
        status: "accepted",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        risk_level: "medium",
      },
      {
        id: "3",
        user_id: "player-3",
        player_name: "Mike Davis",
        recommendation_type: "schedule_recovery",
        reason: "High fatigue detected, recommend active recovery session",
        status: "pending",
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        risk_level: "medium",
      },
    ];
  }

  private getMockAlerts(): CoachVisibilityRecord[] {
    return [
      {
        id: "alert-1",
        player_id: "player-1",
        player_name: "Alex Johnson",
        visibility_type: "risk_warning",
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        message: {
          id: "msg-1",
          user_id: "player-1",
          content: "Asked about creatine dosage for performance enhancement",
          risk_level: "high",
          intent: "dosage",
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        id: "alert-2",
        player_id: "player-2",
        player_name: "Sarah Williams",
        visibility_type: "recommendation",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        viewed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        recommendation: {
          id: "rec-1",
          user_id: "player-2",
          recommendation_type: "ask_coach",
          reason: "Persistent shoulder pain - recommended professional evaluation",
          status: "pending",
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          risk_level: "medium",
        },
      },
    ];
  }
}

