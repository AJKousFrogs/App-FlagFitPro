import { Injectable, inject, signal } from "@angular/core";
import { TIMEOUTS, TOAST } from "../../../core/constants";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";

type DeviceType = "desktop" | "mobile" | "tablet";

export interface ActiveSession {
  id: string;
  deviceName: string;
  deviceType: DeviceType;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

@Injectable({
  providedIn: "root",
})
export class SettingsSessionManagementService {
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  readonly activeSessions = signal<ActiveSession[]>([]);
  readonly loadingSessions = signal(false);
  readonly isRevokingAll = signal(false);

  async loadSessions(): Promise<void> {
    this.loadingSessions.set(true);

    try {
      const user = this.authService.getUser();
      if (!user) {
        this.activeSessions.set([]);
        return;
      }

      this.activeSessions.set([
        {
          id: "current",
          deviceName: "Current Session",
          deviceType: "desktop",
          location: "Unknown",
          lastActive: "Active now",
          isCurrent: true,
        },
      ]);
    } catch (error) {
      this.logger.error("Error loading sessions:", error);
    } finally {
      this.loadingSessions.set(false);
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      this.activeSessions.update((sessions) =>
        sessions.filter((s) => s.id !== sessionId),
      );
      this.toastService.success(TOAST.SUCCESS.UPDATED);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.UPDATE_FAILED);
    }
  }

  async revokeAllSessions(): Promise<boolean> {
    this.isRevokingAll.set(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.UI_TRANSITION_DELAY),
      );

      this.activeSessions.update((sessions) =>
        sessions.filter((s) => s.isCurrent),
      );
      this.toastService.success(TOAST.SUCCESS.UPDATED);
      return true;
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.UPDATE_FAILED);
      return false;
    } finally {
      this.isRevokingAll.set(false);
    }
  }
}
