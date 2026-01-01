import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";

export type ConnectionStatus = "online" | "offline" | "slow" | "syncing";

@Component({
  selector: "app-offline-banner",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule],
  template: `
    @if (showBanner()) {
      <div
        class="offline-banner"
        [class]="'status-' + connectionStatus()"
        role="alert"
        aria-live="polite"
      >
        <div class="banner-content">
          <div class="status-icon">
            @switch (connectionStatus()) {
              @case ("offline") {
                <i class="pi pi-wifi-off"></i>
              }
              @case ("slow") {
                <i class="pi pi-exclamation-triangle"></i>
              }
              @case ("syncing") {
                <i class="pi pi-spin pi-sync"></i>
              }
              @default {
                <i class="pi pi-check-circle"></i>
              }
            }
          </div>
          <div class="status-text">
            <span class="status-title">{{ statusTitle() }}</span>
            <span class="status-message">{{ statusMessage() }}</span>
          </div>
        </div>
        <div class="banner-actions">
          @if (connectionStatus() === "offline") {
            <p-button
              label="Retry"
              icon="pi pi-refresh"
              size="small"
              [text]="true"
              (onClick)="retry()"
            ></p-button>
          }
          @if (connectionStatus() === "online" && showBanner()) {
            <p-button
              icon="pi pi-times"
              size="small"
              [text]="true"
              [rounded]="true"
              (onClick)="dismiss()"
            ></p-button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .offline-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3) var(--space-4);
        animation: slideDown 0.3s ease;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .status-offline {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }

      .status-slow {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }

      .status-syncing {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }

      .status-online {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }

      .banner-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .status-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
      }

      .status-icon i {
        font-size: 1rem;
      }

      .status-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .status-title {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .status-message {
        font-size: 0.75rem;
        opacity: 0.9;
      }

      .banner-actions {
        display: flex;
        gap: var(--space-2);
      }

      .banner-actions ::ng-deep .p-button {
        color: white !important;
      }

      .banner-actions ::ng-deep .p-button:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }

      @media (max-width: 768px) {
        .offline-banner {
          padding: var(--space-2) var(--space-3);
        }

        .status-message {
          display: none;
        }
      }
    `,
  ],
})
export class OfflineBannerComponent implements OnInit, OnDestroy {
  connectionStatus = signal<ConnectionStatus>("online");
  pendingSyncCount = signal(0);
  dismissed = signal(false);
  wasOffline = signal(false);

  showBanner = computed(() => {
    const status = this.connectionStatus();
    const wasPreviouslyOffline = this.wasOffline();

    // Always show if offline or syncing
    if (status === "offline" || status === "syncing") {
      return true;
    }

    // Show "back online" message briefly after reconnection
    if (status === "online" && wasPreviouslyOffline && !this.dismissed()) {
      return true;
    }

    // Show slow connection warning
    if (status === "slow") {
      return true;
    }

    return false;
  });

  statusTitle = computed(() => {
    switch (this.connectionStatus()) {
      case "offline":
        return "You're offline";
      case "slow":
        return "Slow connection";
      case "syncing":
        return "Syncing...";
      case "online":
        return "Back online";
      default:
        return "";
    }
  });

  statusMessage = computed(() => {
    const pending = this.pendingSyncCount();
    switch (this.connectionStatus()) {
      case "offline":
        return pending > 0
          ? `${pending} changes will sync when connected`
          : "Some features may be unavailable";
      case "slow":
        return "Data may take longer to load";
      case "syncing":
        return `Syncing ${pending} changes...`;
      case "online":
        return "All changes saved";
      default:
        return "";
    }
  });

  private onlineHandler = () => this.handleOnline();
  private offlineHandler = () => this.handleOffline();
  private connectionCheckInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Set initial status
    this.connectionStatus.set(navigator.onLine ? "online" : "offline");

    // Listen for online/offline events
    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);

    // Periodically check connection quality
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnectionQuality();
    }, 30000); // Check every 30 seconds
  }

  ngOnDestroy(): void {
    window.removeEventListener("online", this.onlineHandler);
    window.removeEventListener("offline", this.offlineHandler);

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  private handleOnline(): void {
    const wasOfflinePreviously = this.connectionStatus() === "offline";

    if (wasOfflinePreviously) {
      this.wasOffline.set(true);
      this.connectionStatus.set("syncing");
      this.dismissed.set(false);

      // Simulate sync completion
      setTimeout(() => {
        this.connectionStatus.set("online");
        this.pendingSyncCount.set(0);

        // Auto-dismiss after showing "back online"
        setTimeout(() => {
          this.dismissed.set(true);
          this.wasOffline.set(false);
        }, 3000);
      }, 1500);
    }
  }

  private handleOffline(): void {
    this.connectionStatus.set("offline");
    this.dismissed.set(false);
  }

  private async checkConnectionQuality(): Promise<void> {
    if (!navigator.onLine) {
      this.connectionStatus.set("offline");
      return;
    }

    // Use Network Information API if available
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === "slow-2g" || effectiveType === "2g") {
        this.connectionStatus.set("slow");
        return;
      }
    }

    // Fallback: measure response time
    try {
      const start = performance.now();
      await fetch("/api/health", { method: "HEAD", cache: "no-store" });
      const duration = performance.now() - start;

      if (duration > 3000) {
        this.connectionStatus.set("slow");
      } else if (this.connectionStatus() === "slow") {
        this.connectionStatus.set("online");
      }
    } catch {
      // Ignore fetch errors for health check
    }
  }

  retry(): void {
    this.checkConnectionQuality();

    // Trigger a page reload if still offline
    if (navigator.onLine) {
      window.location.reload();
    }
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  // Public method to update pending sync count from services
  updatePendingSyncCount(count: number): void {
    this.pendingSyncCount.set(count);
  }
}
