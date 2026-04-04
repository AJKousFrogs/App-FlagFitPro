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
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";

import { ButtonComponent } from "../button/button.component";
import { CoachOverrideBadgeComponent } from "../coach-override-badge/coach-override-badge.component";
import {
  OverrideLoggingService,
  CoachOverride,
} from "../../../core/services/override-logging.service";
import { LoggerService } from "../../../core/services/logger.service";
import { getTimeAgo } from "../../utils/date.utils";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { AppDialogComponent } from "../dialog/dialog.component";
import { DialogHeaderComponent } from "../dialog-header/dialog-header.component";

@Component({
  selector: "app-coach-override-notification",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ButtonComponent,
    CoachOverrideBadgeComponent,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
  ],
  template: `
    @if (override()) {
      <app-card-shell
        class="override-notification-card"
        title="Training Plan Adjusted"
        headerIcon="info-circle"
      >
        <ng-container header-actions>
          <app-coach-override-badge
            [overrideType]="getSemanticOverrideType(override()!.overrideType)"
            [placement]="'inline'"
            [showTag]="true"
            [showTimestamp]="true"
            [timestamp]="getTimestamp(override()!.createdAt)"
          ></app-coach-override-badge>
        </ng-container>
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
              {{ getCoachName() }} made this adjustment and will monitor your
              response.
            </p>
            <small class="timestamp">
              Adjusted {{ getTimeAgoStr(override()!.createdAt!) }}
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
                  showTransparency() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
                "
              ></i>
              <span>View AI Recommendation vs Coach Decision</span>
            </button>

            @if (showTransparency()) {
              <div class="transparency-content">
                <div class="comparison-row">
                  <div class="comparison-item ai">
                    <h5>AI Recommended</h5>
                    <pre>{{
                      formatRecommendation(override()!.aiRecommendation)
                    }}</pre>
                  </div>
                  <div class="comparison-item coach">
                    <h5>Coach Set</h5>
                    <pre>{{
                      formatRecommendation(override()!.coachDecision)
                    }}</pre>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </app-card-shell>
    }

    <!-- Override History Dialog -->
    <app-dialog
      [(visible)]="showHistory"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [styleClass]="'dialog-w-lg'"
      ariaLabel="Override History"
      (onHide)="showHistory.set(false)"
      (visibleChange)="onHistoryVisibleChange($event)"
    >
      <app-dialog-header
        icon="history"
        title="Override History"
        subtitle="Recent coach adjustments to your training plan"
        (close)="showHistory.set(false)"
      />
      @if (overrideHistory().length > 0) {
        <div class="history-list">
          @for (item of overrideHistory(); track item.id) {
            <div class="history-item">
              <div class="history-header">
                <span class="history-date">{{
                  formatDate(item.createdAt!)
                }}</span>
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
    </app-dialog>
  `,
  styleUrl: "./coach-override-notification.component.scss",
})
export class CoachOverrideNotificationComponent {
  override = input.required<CoachOverride>();
  coachName = input<string>("Your coach");
  playerId = input.required<string>();

  private overrideLoggingService = inject(OverrideLoggingService);
  private logger = inject(LoggerService);
  private router = inject(Router);

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
  getSemanticOverrideType(
    type: CoachOverride["overrideType"],
  ):
    | "load-adjustment"
    | "session-modification"
    | "plan-change"
    | "threshold-override"
    | "general" {
    const map: Record<
      CoachOverride["overrideType"],
      ReturnType<typeof this.getSemanticOverrideType>
    > = {
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

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(dateString: string): string {
    return getTimeAgo(dateString);
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
    this.logger.info("[OverrideNotification] Ask coach clicked");
    this.router.navigate(["/team-chat"]);
  }

  async loadHistory(): Promise<void> {
    try {
      const history = await this.overrideLoggingService.getPlayerOverrides(
        this.playerId(),
        10,
      );
      this.overrideHistory.set(history);
    } catch (error) {
      this.logger.error("[OverrideNotification] Error loading history:", error);
    }
  }

  onHistoryVisibleChange(visible: boolean): void {
    if (visible) {
      void this.loadHistory();
    }
  }
}
