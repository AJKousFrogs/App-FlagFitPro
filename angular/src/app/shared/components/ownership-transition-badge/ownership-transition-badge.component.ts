/**
 * Ownership Transition Badge Component
 *
 * Phase 2.1 - Trust Repair
 * Displays ownership transition status to players following the 5-Question Contract:
 * Shows who is responsible now and what happens next
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";

import { StatusTagComponent } from "../status-tag/status-tag.component";
import { OwnershipTransition } from "../../../core/services/ownership-transition.service";
import { LoggerService } from "../../../core/services/logger.service";
import { getTimeAgo } from "../../utils/date.utils";

@Component({
  selector: "app-ownership-transition-badge",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusTagComponent],
  template: `
    @if (transition()) {
      <div class="ownership-badge" [class]="'status-' + transition()!.status">
        <div class="badge-content">
          <i [class]="getStatusIcon(transition()!.status)"></i>
          <div class="badge-text">
            <span class="badge-title">{{ getTitle(transition()!) }}</span>
            @if (showDetails()) {
              <span class="badge-subtitle">{{
                getSubtitle(transition()!)
              }}</span>
            }
          </div>
          <app-status-tag
            [value]="getStatusLabel(transition()!.status)"
            [severity]="getStatusSeverity(transition()!.status)"
            size="sm"
          />
        </div>

        @if (showDetails()) {
          <div class="badge-details">
            <div class="detail-item">
              <span class="detail-label">Action Required:</span>
              <span class="detail-value">{{
                transition()!.actionRequired
              }}</span>
            </div>
            @if (transition()!.createdAt) {
              <div class="detail-item">
                <span class="detail-label">Notified:</span>
                <span class="detail-value">{{
                  getTimeAgoStr(transition()!.createdAt!)
                }}</span>
              </div>
            }
            @if (getResponseTimeline(transition()!)) {
              <div class="detail-item">
                <span class="detail-label">Expected Response:</span>
                <span class="detail-value">{{
                  getResponseTimeline(transition()!)
                }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styleUrl: "./ownership-transition-badge.component.scss",
})
export class OwnershipTransitionBadgeComponent {
  transition = input.required<OwnershipTransition>();
  showDetails = input<boolean>(false);

  private logger = inject(LoggerService);

  getTitle(transition: OwnershipTransition): string {
    if (transition.toRole === "coach") {
      return "Your coach has been notified";
    } else if (transition.toRole === "physio") {
      return "Physiotherapist has been notified";
    }
    return "Ownership transferred";
  }

  getSubtitle(transition: OwnershipTransition): string {
    if (transition.toRole === "coach") {
      return "Coach will review and adjust your plan";
    } else if (transition.toRole === "physio") {
      return "Physiotherapist will create a recovery protocol";
    }
    return transition.actionRequired;
  }

  getStatusIcon(status: OwnershipTransition["status"]): string {
    const icons: Record<string, string> = {
      pending: "pi pi-clock",
      in_progress: "pi pi-spin pi-spinner",
      completed: "pi pi-check-circle",
      overdue: "pi pi-exclamation-triangle",
    };
    return icons[status] || "pi pi-info-circle";
  }

  getStatusLabel(status: OwnershipTransition["status"]): string {
    const labels: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      overdue: "Overdue",
    };
    return labels[status] || status;
  }

  getStatusSeverity(
    status: OwnershipTransition["status"],
  ): "secondary" | "success" | "info" | "warning" | "danger" | "contrast" {
    const severities: Record<
      string,
      "secondary" | "success" | "info" | "warning" | "danger" | "contrast"
    > = {
      pending: "warning",
      in_progress: "info",
      completed: "success",
      overdue: "danger",
    };
    return severities[status] || "info";
  }

  getResponseTimeline(transition: OwnershipTransition): string | null {
    if (transition.status === "completed") {
      return "Completed";
    }

    if (transition.toRole === "coach") {
      if (transition.trigger === "acwr_critical") {
        return "Within 24 hours (critical)";
      }
      return "Within 48 hours";
    }

    if (transition.toRole === "physio") {
      return "Within 72 hours";
    }

    return null;
  }

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(date: Date): string {
    return getTimeAgo(date);
  }
}
