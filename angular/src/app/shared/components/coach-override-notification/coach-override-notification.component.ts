/**
 * Coach Override Notification Component
 * 
 * Phase 2.1 - Trust Repair
 * Displays coach override notifications following the 5-Question Contract:
 * 1. What changed
 * 2. Why it changed
 * 3. What this means
 * 4. Who is responsible now
 * 5. What happens next
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ButtonComponent } from "../button/button.component";
import { CoachOverrideBadgeComponent } from "../coach-override-badge/coach-override-badge.component";
import { OverrideLoggingService, CoachOverride } from "../../../core/services/override-logging.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-coach-override-notification",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    DialogModule,
    TagModule,
    TooltipModule,
    ButtonComponent,
    CoachOverrideBadgeComponent,
  ],
  template: `
    @if (override()) {
      <p-card styleClass="override-notification-card">
        <ng-template #header>
          <div class="override-header">
            <div class="header-content">
              <i class="pi pi-info-circle override-icon"></i>
              <h3>Training Plan Adjusted</h3>
            </div>
            <!-- Phase 3: Semantic Coach Override Badge -->
            <app-coach-override-badge
              [overrideType]="getSemanticOverrideType(override()!.overrideType)"
              [placement]="'inline'"
              [showTag]="true"
              [showTimestamp]="true"
              [timestamp]="getTimestamp(override()!.createdAt)"
            ></app-coach-override-badge>
          </div>
        </ng-template>

        <!-- 5-Question Contract Display -->
        <div class="override-content">
          <!-- 1. What changed -->
          <div class="contract-section">
            <h4 class="contract-question">What changed:</h4>
            <p class="contract-answer">
              {{ getChangeDescription(override()!) }}
            </p>
            @if (getChangeDetails(override()!)) {
              <div class="change-details">
                {{ getChangeDetails(override()!) }}
              </div>
            }
          </div>

          <!-- 2. Why it changed -->
          @if (override()!.reason) {
            <div class="contract-section">
              <h4 class="contract-question">Why it changed:</h4>
              <p class="contract-answer">{{ override()!.reason }}</p>
            </div>
          }

          <!-- 3. What this means -->
          <div class="contract-section">
            <h4 class="contract-question">What this means:</h4>
            <p class="contract-answer">
              {{ getImpactDescription(override()!) }}
            </p>
          </div>

          <!-- 4. Who is responsible now -->
          <div class="contract-section">
            <h4 class="contract-question">Who is responsible now:</h4>
            <p class="contract-answer">
              {{ getCoachName() }} made this adjustment and will monitor your response.
            </p>
            <small class="timestamp">
              Adjusted {{ getTimeAgo(override()!.createdAt!) }}
            </small>
          </div>

          <!-- 5. What happens next -->
          <div class="contract-section">
            <h4 class="contract-question">What happens next:</h4>
            <p class="contract-answer">
              Follow the updated plan. Contact your coach with any questions.
            </p>
            <div class="action-buttons">
              <app-button
                variant="outlined"
                iconLeft="pi-comments"
                (clicked)="askCoach()"
                >Ask Coach About This Change</app-button
              >
              <app-button
                variant="text"
                iconLeft="pi-history"
                (clicked)="showHistory.set(true)"
                >View Override History</app-button
              >
            </div>
          </div>

          <!-- Transparency Panel (Expandable) -->
          <div class="transparency-panel">
            <button
              class="transparency-toggle"
              (click)="showTransparency.set(!showTransparency())"
            >
              <i
                [class]="
                  showTransparency()
                    ? 'pi pi-chevron-up'
                    : 'pi pi-chevron-down'
                "
              ></i>
              <span>View AI Recommendation vs Coach Decision</span>
            </button>

            @if (showTransparency()) {
              <div class="transparency-content">
                <div class="comparison-row">
                  <div class="comparison-item ai">
                    <h5>AI Recommended</h5>
                    <pre>{{ formatRecommendation(override()!.aiRecommendation) }}</pre>
                  </div>
                  <div class="comparison-item coach">
                    <h5>Coach Set</h5>
                    <pre>{{ formatRecommendation(override()!.coachDecision) }}</pre>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </p-card>
    }

    <!-- Override History Dialog -->
    <p-dialog
      header="Override History"
      [(visible)]="showHistory"
      [modal]="true"
      [style]="{ width: '700px' }"
      [dismissableMask]="true"
      (onShow)="loadHistory()"
    >
      @if (overrideHistory().length > 0) {
        <div class="history-list">
          @for (item of overrideHistory(); track item.id) {
            <div class="history-item">
              <div class="history-header">
                <span class="history-date">{{ formatDate(item.createdAt!) }}</span>
                <!-- Phase 3: Semantic Coach Override Badge -->
                <app-coach-override-badge
                  [overrideType]="getSemanticOverrideType(item.overrideType)"
                  [placement]="'inline'"
                  [showTag]="true"
                  [showTimestamp]="true"
                  [timestamp]="getTimestamp(item.createdAt)"
                ></app-coach-override-badge>
              </div>
              @if (item.reason) {
                <p class="history-reason">{{ item.reason }}</p>
              }
            </div>
          }
        </div>
      } @else {
        <p>No override history available.</p>
      }
    </p-dialog>
  `,
  styles: [
    `
      .override-notification-card {
        margin-bottom: 1rem;
        border-left: 4px solid var(--primary-color);
      }

      .override-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .override-icon {
        color: var(--primary-color);
        font-size: 1.25rem;
      }

      .override-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .contract-section {
        padding: 0.75rem;
        background: var(--surface-50);
        border-radius: 0.5rem;
      }

      .contract-question {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-color-secondary);
        margin-bottom: 0.5rem;
      }

      .contract-answer {
        margin: 0;
        color: var(--text-color);
      }

      .change-details {
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: var(--surface-100);
        border-radius: 0.25rem;
        font-size: 0.875rem;
      }

      .timestamp {
        display: block;
        margin-top: 0.5rem;
        color: var(--text-color-secondary);
        font-size: 0.75rem;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
      }

      .transparency-panel {
        margin-top: 1rem;
        border-top: 1px solid var(--surface-200);
        padding-top: 1rem;
      }

      .transparency-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: transparent;
        border: 1px solid var(--surface-300);
        border-radius: 0.25rem;
        cursor: pointer;
        color: var(--text-color);
        transition: all 0.2s;
      }

      .transparency-toggle:hover {
        background: var(--surface-100);
      }

      .transparency-content {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--surface-50);
        border-radius: 0.5rem;
      }

      .comparison-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .comparison-item {
        padding: 0.75rem;
        border-radius: 0.25rem;
      }

      .comparison-item.ai {
        background: var(--blue-50);
        border-left: 3px solid var(--blue-500);
      }

      .comparison-item.coach {
        background: var(--green-50);
        border-left: 3px solid var(--green-500);
      }

      .comparison-item h5 {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .comparison-item pre {
        margin: 0;
        font-size: 0.875rem;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .history-item {
        padding: 0.75rem;
        background: var(--surface-50);
        border-radius: 0.25rem;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .history-date {
        font-weight: 600;
        color: var(--text-color);
      }

      .history-reason {
        margin: 0;
        color: var(--text-color-secondary);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class CoachOverrideNotificationComponent {
  override = input.required<CoachOverride>();
  coachName = input<string>("Your coach");
  playerId = input.required<string>();

  private overrideLoggingService = inject(OverrideLoggingService);
  private logger = inject(LoggerService);

  showTransparency = signal(false);
  showHistory = signal(false);
  overrideHistory = signal<CoachOverride[]>([]);

  constructor() {
    // Load history when dialog opens
    // Using effect would be better but keeping it simple for now
  }

  /**
   * Phase 3: Map override type to semantic override type
   */
  getSemanticOverrideType(type: CoachOverride["overrideType"]): "load-adjustment" | "session-modification" | "plan-change" | "threshold-override" | "general" {
    const map: Record<CoachOverride["overrideType"], ReturnType<typeof this.getSemanticOverrideType>> = {
      training_load: "load-adjustment",
      session_modification: "session-modification",
      acwr_override: "threshold-override",
      recovery_protocol: "plan-change",
      other: "general",
    };
    return map[type] || "general";
  }

  getOverrideTypeLabel(type: CoachOverride["overrideType"]): string {
    const labels: Record<string, string> = {
      training_load: "Training Load",
      session_modification: "Session Modification",
      acwr_override: "ACWR Override",
      recovery_protocol: "Recovery Protocol",
      other: "Other",
    };
    return labels[type] || type;
  }

  getChangeDescription(override: CoachOverride): string {
    if (override.overrideType === "training_load") {
      const aiLoad = override.aiRecommendation.load as number;
      const coachLoad = override.coachDecision.load as number;
      return `Training load adjusted from ${aiLoad}% to ${coachLoad}%`;
    } else if (override.overrideType === "session_modification") {
      return "Training session modified";
    } else if (override.overrideType === "acwr_override") {
      return "ACWR calculation adjusted";
    }
    return "Training plan adjusted";
  }

  getChangeDetails(override: CoachOverride): string | null {
    if (override.overrideType === "session_modification") {
      const aiType = override.aiRecommendation.sessionType as string;
      const coachType = override.coachDecision.sessionType as string;
      if (aiType && coachType && aiType !== coachType) {
        return `Session type changed from ${aiType} to ${coachType}`;
      }
    }
    return null;
  }

  getImpactDescription(override: CoachOverride): string {
    if (override.context?.acwr) {
      const acwr = override.context.acwr as number;
      return `These changes are effective immediately. Expected ACWR impact: ${acwr.toFixed(2)}`;
    }
    return "Training plan adjusted to optimize performance and reduce injury risk.";
  }

  getCoachName(): string {
    return this.coachName() || "Your coach";
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  formatRecommendation(data: Record<string, unknown>): string {
    return JSON.stringify(data, null, 2);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getTimestamp(dateValue: Date | string | undefined): Date | null {
    if (!dateValue) return null;
    return typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  }

  async askCoach(): Promise<void> {
    // Navigate to chat/messaging with coach
    // This would integrate with your messaging system
    this.logger.info("[OverrideNotification] Ask coach clicked");
    // TODO: Implement navigation to coach chat
  }

  async loadHistory(): Promise<void> {
    try {
      const history = await this.overrideLoggingService.getPlayerOverrides(
        this.playerId(),
        10
      );
      this.overrideHistory.set(history);
    } catch (error) {
      this.logger.error("[OverrideNotification] Error loading history:", error);
    }
  }
}

