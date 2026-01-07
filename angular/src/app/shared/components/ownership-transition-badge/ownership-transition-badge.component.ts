/**
 * Ownership Transition Badge Component
 * 
 * Phase 2.1 - Trust Repair
 * Displays ownership transition status to players following the 5-Question Contract:
 * Shows who is responsible now and what happens next
 */

import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { OwnershipTransitionService, OwnershipTransition } from "../../../core/services/ownership-transition.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-ownership-transition-badge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    TagModule,
    TooltipModule,
  ],
  template: `
    @if (transition()) {
      <div class="ownership-badge" [class]="'status-' + transition()!.status">
        <div class="badge-content">
          <i [class]="getStatusIcon(transition()!.status)"></i>
          <div class="badge-text">
            <span class="badge-title">{{ getTitle(transition()!) }}</span>
            @if (showDetails()) {
              <span class="badge-subtitle">{{ getSubtitle(transition()!) }}</span>
            }
          </div>
          <p-tag
            [value]="getStatusLabel(transition()!.status)"
            [severity]="getStatusSeverity(transition()!.status)"
            styleClass="status-tag"
          ></p-tag>
        </div>
        
        @if (showDetails()) {
          <div class="badge-details">
            <div class="detail-item">
              <span class="detail-label">Action Required:</span>
              <span class="detail-value">{{ transition()!.actionRequired }}</span>
            </div>
            @if (transition()!.createdAt) {
              <div class="detail-item">
                <span class="detail-label">Notified:</span>
                <span class="detail-value">{{ getTimeAgo(transition()!.createdAt!) }}</span>
              </div>
            }
            @if (getResponseTimeline(transition()!)) {
              <div class="detail-item">
                <span class="detail-label">Expected Response:</span>
                <span class="detail-value">{{ getResponseTimeline(transition()!) }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .ownership-badge {
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border-primary);
        background: var(--surface-primary);
        margin-bottom: var(--space-3);
      }

      .ownership-badge.status-pending {
        border-color: var(--color-status-warning);
        background: var(--color-status-warning-subtle);
      }

      .ownership-badge.status-in_progress {
        border-color: var(--color-status-info);
        background: var(--color-status-info-subtle);
      }

      .ownership-badge.status-completed {
        border-color: var(--color-status-success);
        background: var(--color-status-success-subtle);
      }

      .ownership-badge.status-overdue {
        border-color: var(--color-status-error);
        background: var(--color-status-error-subtle);
      }

      .badge-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .badge-content i {
        font-size: var(--font-size-h3);
        color: var(--color-text-primary);
      }

      .badge-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .badge-title {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        font-size: var(--font-size-body);
      }

      .badge-subtitle {
        font-size: var(--font-size-h4);
        color: var(--color-text-secondary);
      }

      .status-tag {
        font-size: var(--font-size-h4);
      }

      .badge-details {
        margin-top: var(--space-3);
        padding-top: var(--space-3);
        border-top: 1px solid var(--color-border-secondary);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .detail-item {
        display: flex;
        gap: var(--space-2);
        font-size: var(--font-size-h4);
      }

      .detail-label {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        min-width: 120px;
      }

      .detail-value {
        color: var(--color-text-primary);
      }
    `,
  ],
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

  getStatusSeverity(status: OwnershipTransition["status"]): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
    const severities: Record<string, "secondary" | "success" | "info" | "warn" | "danger" | "contrast"> = {
      pending: "warn",
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

  getTimeAgo(date: Date): string {
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
}

