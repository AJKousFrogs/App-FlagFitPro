import { Injectable, inject, signal } from "@angular/core";
import {
  TIMEOUTS,
  TOAST,
  UI_LIMITS,
} from "../../../core/constants";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { PlatformService } from "../../../core/services/platform.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsDataService } from "./settings-data.service";

export type DataExportFormat = "json" | "csv";

export interface DataExportOptions {
  profile: boolean;
  training: boolean;
  wellness: boolean;
  achievements: boolean;
  settings: boolean;
}

@Injectable({
  providedIn: "root",
})
export class SettingsDataExportService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly platform = inject(PlatformService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  readonly isExportingData = signal(false);
  readonly exportProgress = signal(0);
  readonly exportTakingLong = signal(false);

  private exportTimeoutId: ReturnType<typeof setTimeout> | null = null;

  async exportUserData(input: {
    format: DataExportFormat;
    options: DataExportOptions;
  }): Promise<boolean> {
    this.logger.debug(
      "[exportUserData] Starting export",
      toLogContext({
        format: input.format,
        options: input.options,
      }),
    );

    this.isExportingData.set(true);
    this.exportProgress.set(0);
    this.exportTakingLong.set(false);

    this.exportTimeoutId = setTimeout(() => {
      if (this.isExportingData()) {
        this.exportTakingLong.set(true);
      }
    }, TIMEOUTS.SLOW_OPERATION_THRESHOLD);

    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return false;
      }

      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        email: user.email,
      };

      let progress = 0;
      const totalSteps = Object.values(input.options).filter(Boolean).length;

      if (input.options.profile) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { profile } =
          await this.settingsDataService.fetchExportProfile(user.id);
        if (profile) {
          exportData.profile = {
            fullName: profile.full_name,
            firstName: profile.first_name,
            lastName: profile.last_name,
            dateOfBirth: profile.date_of_birth,
            position: profile.position,
            jerseyNumber: profile.jersey_number,
            team: profile.team,
            phone: profile.phone,
            createdAt: profile.created_at,
          };
        }
      }

      if (input.options.training) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { sessions } = await this.settingsDataService.fetchExportTraining(
          user.id,
          UI_LIMITS.EXPORT_SESSIONS_MAX,
        );
        exportData.trainingSessions = sessions ?? [];
      }

      if (input.options.wellness) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { checkins } = await this.settingsDataService.fetchExportWellness(
          user.id,
          UI_LIMITS.EXPORT_WELLNESS_MAX,
        );
        exportData.wellnessCheckins = checkins ?? [];
      }

      if (input.options.achievements) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { achievements } =
          await this.settingsDataService.fetchExportAchievements(user.id);
        exportData.achievements = achievements ?? [];
      }

      if (input.options.settings) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const localSettings = this.platform.getLocalStorage("user_settings");
        exportData.settings = localSettings ? JSON.parse(localSettings) : {};
      }

      this.exportProgress.set(100);

      this.downloadExportFile({
        format: input.format,
        data: exportData,
      });

      this.toastService.success(TOAST.SUCCESS.DATA_EXPORTED);
      this.logger.info("[exportUserData] Data exported successfully");
      return true;
    } catch (error) {
      this.logger.error("[exportUserData] Export failed:", error);
      this.toastService.error(TOAST.ERROR.EXPORT_FAILED);
      return false;
    } finally {
      this.isExportingData.set(false);
      this.exportProgress.set(0);
      this.exportTakingLong.set(false);
      if (this.exportTimeoutId) {
        clearTimeout(this.exportTimeoutId);
        this.exportTimeoutId = null;
      }
    }
  }

  private downloadExportFile(input: {
    format: DataExportFormat;
    data: Record<string, unknown>;
  }): void {
    if (!this.platform.isBrowser) {
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (input.format === "json") {
      content = JSON.stringify(input.data, null, 2);
      filename = `flagfit-data-export-${new Date().toISOString().split("T")[0]}.json`;
      mimeType = "application/json";
    } else {
      content = this.convertToCSV(input.data);
      filename = `flagfit-data-export-${new Date().toISOString().split("T")[0]}.csv`;
      mimeType = "text/csv";
    }

    const documentRef = this.platform.getDocument();
    if (!documentRef) {
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = documentRef.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private convertToCSV(data: Record<string, unknown>): string {
    const lines: string[] = [];

    lines.push("FlagFit Pro Data Export");
    lines.push(`Export Date: ${data["exportDate"]}`);
    lines.push(`User ID: ${data["userId"]}`);
    lines.push(`Email: ${data["email"]}`);
    lines.push("");

    if (data["profile"]) {
      lines.push("=== PROFILE ===");
      Object.entries(data["profile"] as Record<string, unknown>).forEach(
        ([key, value]) => {
          lines.push(`${key},${value || ""}`);
        },
      );
      lines.push("");
    }

    const sessions = data["trainingSessions"] as
      | Record<string, unknown>[]
      | undefined;
    if (sessions && sessions.length > 0) {
      lines.push("=== TRAINING SESSIONS ===");
      const headers = Object.keys(sessions[0]);
      lines.push(headers.join(","));
      sessions.forEach((session: Record<string, unknown>) => {
        lines.push(
          headers.map((h) => JSON.stringify(session[h] || "")).join(","),
        );
      });
      lines.push("");
    }

    const checkins = data["wellnessCheckins"] as
      | Record<string, unknown>[]
      | undefined;
    if (checkins && checkins.length > 0) {
      lines.push("=== WELLNESS CHECKINS ===");
      const headers = Object.keys(checkins[0]);
      lines.push(headers.join(","));
      checkins.forEach((checkin: Record<string, unknown>) => {
        lines.push(
          headers.map((h) => JSON.stringify(checkin[h] || "")).join(","),
        );
      });
      lines.push("");
    }

    const achievements = data["achievements"] as
      | Record<string, unknown>[]
      | undefined;
    if (achievements && achievements.length > 0) {
      lines.push("=== ACHIEVEMENTS ===");
      const headers = Object.keys(achievements[0]);
      lines.push(headers.join(","));
      achievements.forEach((achievement: Record<string, unknown>) => {
        lines.push(
          headers.map((h) => JSON.stringify(achievement[h] || "")).join(","),
        );
      });
    }

    return lines.join("\n");
  }
}
