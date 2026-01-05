import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";

export type ConnectionStatus = "online" | "offline" | "slow" | "syncing";

@Component({
  selector: "app-offline-banner",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent, IconButtonComponent],
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
            <app-button
              variant="text"
              size="sm"
              iconLeft="pi-refresh"
              (clicked)="retry()"
              >Retry</app-button
            >
          }
          @if (connectionStatus() === "online" && showBanner()) {
            <app-icon-button
              icon="pi-times"
              variant="text"
              size="sm"
              (clicked)="dismiss()"
              ariaLabel="times"
            />
          }
        </div>
      </div>
    }
  `,
  styleUrl: "./offline-banner.component.scss",
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
    const connection = (
      navigator as Navigator & { connection?: { effectiveType: string } }
    ).connection;
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
