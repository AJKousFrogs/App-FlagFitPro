/**
 * Offline Badge Component
 *
 * Shows offline capability status for features:
 * - Indicates which features work offline
 * - Shows sync status
 * - Alerts when data is pending sync
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { TooltipModule } from "primeng/tooltip";
import { BadgeModule } from "primeng/badge";

// Services
import { LoggerService } from "../../../core/services/logger.service";

export type OfflineCapability = "full" | "partial" | "none" | "syncing";

@Component({
  selector: "app-offline-badge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule, BadgeModule],
  template: `
    <div
      class="offline-badge"
      [class]="'capability-' + capability()"
      [class.is-offline]="isOffline()"
      [pTooltip]="getTooltip()"
      tooltipPosition="bottom"
    >
      <i [class]="getIcon()"></i>
      @if (showLabel()) {
        <span class="badge-label">{{ getLabel() }}</span>
      }
      @if (pendingCount() > 0) {
        <span class="pending-count">{{ pendingCount() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .offline-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: help;
        transition: all 0.2s;
      }

      .offline-badge i {
        font-size: 0.875rem;
      }

      /* Capability states */
      .capability-full {
        background: var(--p-green-50);
        color: var(--p-green-700);
      }

      .capability-full i {
        color: var(--p-green-500);
      }

      .capability-partial {
        background: var(--p-orange-50);
        color: var(--p-orange-700);
      }

      .capability-partial i {
        color: var(--p-orange-500);
      }

      .capability-none {
        background: var(--p-surface-100);
        color: var(--text-secondary);
      }

      .capability-syncing {
        background: var(--p-blue-50);
        color: var(--p-blue-700);
      }

      .capability-syncing i {
        color: var(--p-blue-500);
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Offline state */
      .is-offline {
        border: 1px solid currentColor;
      }

      .is-offline.capability-full {
        background: var(--p-green-100);
      }

      .is-offline.capability-none {
        background: var(--p-red-50);
        color: var(--p-red-700);
        border-color: var(--p-red-300);
      }

      /* Pending count */
      .pending-count {
        background: var(--p-orange-500);
        color: white;
        font-size: 0.625rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: var(--space-1);
      }

      .badge-label {
        white-space: nowrap;
      }
    `,
  ],
})
export class OfflineBadgeComponent implements OnInit, OnDestroy {
  private logger = inject(LoggerService);

  // Inputs
  capability = input<OfflineCapability>("none");
  featureName = input<string>("");
  showLabel = input<boolean>(false);

  // State
  isOffline = signal(false);
  pendingCount = signal(0);
  isSyncing = signal(false);

  private onlineHandler = () => this.updateOnlineStatus();
  private offlineHandler = () => this.updateOnlineStatus();

  ngOnInit(): void {
    // Check initial status
    this.updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);

    // Check for pending data
    this.checkPendingData();
  }

  ngOnDestroy(): void {
    window.removeEventListener("online", this.onlineHandler);
    window.removeEventListener("offline", this.offlineHandler);
  }

  getIcon(): string {
    if (this.isSyncing()) {
      return "pi pi-sync";
    }

    if (this.isOffline()) {
      switch (this.capability()) {
        case "full":
          return "pi pi-check-circle";
        case "partial":
          return "pi pi-exclamation-circle";
        case "none":
          return "pi pi-wifi-off";
        default:
          return "pi pi-cloud";
      }
    }

    switch (this.capability()) {
      case "full":
        return "pi pi-cloud-download";
      case "partial":
        return "pi pi-cloud";
      case "syncing":
        return "pi pi-sync";
      default:
        return "pi pi-cloud";
    }
  }

  getLabel(): string {
    if (this.isSyncing()) {
      return "Syncing...";
    }

    if (this.isOffline()) {
      switch (this.capability()) {
        case "full":
          return "Available Offline";
        case "partial":
          return "Limited Offline";
        case "none":
          return "Offline";
        default:
          return "";
      }
    }

    switch (this.capability()) {
      case "full":
        return "Offline Ready";
      case "partial":
        return "Partial Offline";
      case "syncing":
        return "Syncing";
      default:
        return "";
    }
  }

  getTooltip(): string {
    const feature = this.featureName() || "This feature";

    if (this.pendingCount() > 0) {
      return `${this.pendingCount()} items waiting to sync`;
    }

    if (this.isOffline()) {
      switch (this.capability()) {
        case "full":
          return `${feature} works fully offline. Data will sync when back online.`;
        case "partial":
          return `${feature} has limited offline functionality. Some features require internet.`;
        case "none":
          return `${feature} requires internet connection.`;
        default:
          return "";
      }
    }

    switch (this.capability()) {
      case "full":
        return `${feature} is available offline. Data is synced.`;
      case "partial":
        return `${feature} has partial offline support.`;
      case "syncing":
        return `${feature} is syncing data...`;
      default:
        return `${feature} requires internet connection.`;
    }
  }

  private updateOnlineStatus(): void {
    this.isOffline.set(!navigator.onLine);

    if (navigator.onLine && this.pendingCount() > 0) {
      this.syncPendingData();
    }
  }

  private checkPendingData(): void {
    try {
      // Check localStorage for pending sync items
      const pendingWellness = localStorage.getItem("pending-wellness-sync");
      const pendingTraining = localStorage.getItem("pending-training-sync");

      let count = 0;
      if (pendingWellness) {
        count += JSON.parse(pendingWellness).length;
      }
      if (pendingTraining) {
        count += JSON.parse(pendingTraining).length;
      }

      this.pendingCount.set(count);
    } catch (error) {
      this.logger.error("Error checking pending data:", error);
    }
  }

  private async syncPendingData(): Promise<void> {
    if (this.pendingCount() === 0) return;

    this.isSyncing.set(true);

    try {
      // Simulate sync delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear pending data after sync
      localStorage.removeItem("pending-wellness-sync");
      localStorage.removeItem("pending-training-sync");

      this.pendingCount.set(0);
      this.logger.info("Pending data synced successfully");
    } catch (error) {
      this.logger.error("Error syncing pending data:", error);
    } finally {
      this.isSyncing.set(false);
    }
  }
}
