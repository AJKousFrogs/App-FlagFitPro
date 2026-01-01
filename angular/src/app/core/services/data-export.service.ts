import { Injectable, inject, signal } from "@angular/core";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { ToastService } from "./toast.service";

/**
 * Data Export Service
 *
 * Implements GDPR Article 20 - Right to Data Portability
 * Allows users to export all their personal data in a portable format.
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

export interface ExportMetadata {
  userId: string;
  exportedAt: string;
  formatVersion: string;
  dataController: string;
  exportType: "full" | "partial";
  includedCategories: string[];
}

export interface ExportedData {
  exportMetadata: ExportMetadata;
  profile?: Record<string, unknown>;
  privacySettings?: Record<string, unknown>;
  teamMemberships?: Array<Record<string, unknown>>;
  teamSharingSettings?: Array<Record<string, unknown>>;
  workoutLogs?: Array<Record<string, unknown>>;
  loadMonitoring?: Array<Record<string, unknown>>;
  wellnessEntries?: Array<Record<string, unknown>>;
  achievements?: Array<Record<string, unknown>>;
  userPreferences?: Record<string, unknown>;
  consentHistory?: Array<Record<string, unknown>>;
}

export type ExportFormat = "json" | "csv";
export type ExportCategory =
  | "profile"
  | "privacy"
  | "teams"
  | "workouts"
  | "wellness"
  | "achievements"
  | "preferences"
  | "consent";

@Injectable({
  providedIn: "root",
})
export class DataExportService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);

  // Export state
  private _exporting = signal(false);
  private _progress = signal(0);
  private _currentStep = signal("");

  readonly exporting = this._exporting.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();

  /**
   * Export all user data in the specified format
   */
  async exportAllData(format: ExportFormat = "json"): Promise<Blob | null> {
    return this.exportData(
      [
        "profile",
        "privacy",
        "teams",
        "workouts",
        "wellness",
        "achievements",
        "preferences",
        "consent",
      ],
      format,
    );
  }

  /**
   * Export specific categories of user data
   */
  async exportData(
    categories: ExportCategory[],
    format: ExportFormat = "json",
  ): Promise<Blob | null> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this.toastService.error("Not authenticated");
      return null;
    }

    this._exporting.set(true);
    this._progress.set(0);

    try {
      const data: ExportedData = {
        exportMetadata: {
          userId,
          exportedAt: new Date().toISOString(),
          formatVersion: "1.0",
          dataController: "Športno društvo Žabe",
          exportType: categories.length === 8 ? "full" : "partial",
          includedCategories: categories,
        },
      };

      const totalSteps = categories.length;
      let completedSteps = 0;

      // Export each category
      for (const category of categories) {
        this._currentStep.set(`Exporting ${category}...`);

        switch (category) {
          case "profile":
            data.profile = await this.exportProfile(userId);
            break;
          case "privacy":
            data.privacySettings = await this.exportPrivacySettings(userId);
            break;
          case "teams":
            data.teamMemberships = await this.exportTeamMemberships(userId);
            data.teamSharingSettings =
              await this.exportTeamSharingSettings(userId);
            break;
          case "workouts":
            data.workoutLogs = await this.exportWorkoutLogs(userId);
            data.loadMonitoring = await this.exportLoadMonitoring(userId);
            break;
          case "wellness":
            data.wellnessEntries = await this.exportWellnessEntries(userId);
            break;
          case "achievements":
            data.achievements = await this.exportAchievements(userId);
            break;
          case "preferences":
            data.userPreferences = await this.exportUserPreferences(userId);
            break;
          case "consent":
            data.consentHistory = await this.exportConsentHistory(userId);
            break;
        }

        completedSteps++;
        this._progress.set(Math.round((completedSteps / totalSteps) * 100));
      }

      this._currentStep.set("Preparing download...");

      // Convert to requested format
      let blob: Blob;
      let filename: string;
      const timestamp = new Date().toISOString().split("T")[0];

      if (format === "json") {
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        filename = `flagfit-data-export-${timestamp}.json`;
      } else {
        blob = this.convertToCSV(data);
        filename = `flagfit-data-export-${timestamp}.csv`;
      }

      // Trigger download
      this.downloadBlob(blob, filename);

      this.toastService.success("Data export completed successfully");
      this.logger.info("Data export completed", { categories, format });

      return blob;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export data";
      this.toastService.error(message);
      this.logger.error("Data export failed:", err);
      return null;
    } finally {
      this._exporting.set(false);
      this._progress.set(0);
      this._currentStep.set("");
    }
  }

  // ============================================================================
  // EXPORT HELPERS
  // ============================================================================

  private async exportProfile(
    userId: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      // Use 'users' table instead of 'profiles' (which doesn't exist)
      const { data } = await this.supabase.client
        .from("users")
        .select(
          "id, email, first_name, last_name, full_name, position, jersey_number, team, bio, created_at",
        )
        .eq("id", userId)
        .single();

      return data || undefined;
    } catch {
      return undefined;
    }
  }

  private async exportPrivacySettings(
    userId: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const { data } = await this.supabase.client
        .from("privacy_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      return data || undefined;
    } catch {
      return undefined;
    }
  }

  private async exportTeamMemberships(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const { data } = await this.supabase.client
        .from("team_members")
        .select("*, teams(id, name)")
        .eq("user_id", userId);

      return data || [];
    } catch {
      return [];
    }
  }

  private async exportTeamSharingSettings(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const { data } = await this.supabase.client
        .from("team_sharing_settings")
        .select("*")
        .eq("user_id", userId);

      return data || [];
    } catch {
      return [];
    }
  }

  private async exportWorkoutLogs(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const { data } = await this.supabase.client
        .from("workout_logs")
        .select("*")
        .eq("player_id", userId)
        .order("created_at", { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }

  private async exportLoadMonitoring(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const { data } = await this.supabase.client
        .from("load_monitoring")
        .select("*")
        .eq("player_id", userId)
        .order("calculated_at", { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }

  private async exportWellnessEntries(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const { data } = await this.supabase.client
        .from("wellness_entries")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }

  private async exportAchievements(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const { data } = await this.supabase.client
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }

  private async exportUserPreferences(
    userId: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const { data } = await this.supabase.client
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      return data || undefined;
    } catch {
      return undefined;
    }
  }

  private async exportConsentHistory(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const { data } = await this.supabase.client
        .from("gdpr_consent")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }

  // ============================================================================
  // FORMAT CONVERSION
  // ============================================================================

  private convertToCSV(data: ExportedData): Blob {
    const csvParts: string[] = [];

    // Add metadata section
    csvParts.push("=== EXPORT METADATA ===");
    csvParts.push(`User ID,${data.exportMetadata.userId}`);
    csvParts.push(`Exported At,${data.exportMetadata.exportedAt}`);
    csvParts.push(`Format Version,${data.exportMetadata.formatVersion}`);
    csvParts.push(`Data Controller,${data.exportMetadata.dataController}`);
    csvParts.push(`Export Type,${data.exportMetadata.exportType}`);
    csvParts.push(
      `Included Categories,"${data.exportMetadata.includedCategories.join(", ")}"`,
    );
    csvParts.push("");

    // Convert each data section to CSV
    if (data.profile) {
      csvParts.push("=== PROFILE ===");
      csvParts.push(this.objectToCSV([data.profile]));
      csvParts.push("");
    }

    if (data.privacySettings) {
      csvParts.push("=== PRIVACY SETTINGS ===");
      csvParts.push(this.objectToCSV([data.privacySettings]));
      csvParts.push("");
    }

    if (data.teamMemberships?.length) {
      csvParts.push("=== TEAM MEMBERSHIPS ===");
      csvParts.push(this.objectToCSV(data.teamMemberships));
      csvParts.push("");
    }

    if (data.teamSharingSettings?.length) {
      csvParts.push("=== TEAM SHARING SETTINGS ===");
      csvParts.push(this.objectToCSV(data.teamSharingSettings));
      csvParts.push("");
    }

    if (data.workoutLogs?.length) {
      csvParts.push("=== WORKOUT LOGS ===");
      csvParts.push(this.objectToCSV(data.workoutLogs));
      csvParts.push("");
    }

    if (data.loadMonitoring?.length) {
      csvParts.push("=== LOAD MONITORING ===");
      csvParts.push(this.objectToCSV(data.loadMonitoring));
      csvParts.push("");
    }

    if (data.wellnessEntries?.length) {
      csvParts.push("=== WELLNESS ENTRIES ===");
      csvParts.push(this.objectToCSV(data.wellnessEntries));
      csvParts.push("");
    }

    if (data.achievements?.length) {
      csvParts.push("=== ACHIEVEMENTS ===");
      csvParts.push(this.objectToCSV(data.achievements));
      csvParts.push("");
    }

    if (data.userPreferences) {
      csvParts.push("=== USER PREFERENCES ===");
      csvParts.push(this.objectToCSV([data.userPreferences]));
      csvParts.push("");
    }

    if (data.consentHistory?.length) {
      csvParts.push("=== CONSENT HISTORY ===");
      csvParts.push(this.objectToCSV(data.consentHistory));
      csvParts.push("");
    }

    return new Blob([csvParts.join("\n")], { type: "text/csv" });
  }

  private objectToCSV(objects: Array<Record<string, unknown>>): string {
    if (!objects.length) return "";

    // Get all unique keys
    const keys = [...new Set(objects.flatMap((obj) => Object.keys(obj)))];

    // Create header row
    const header = keys.join(",");

    // Create data rows
    const rows = objects.map((obj) => {
      return keys
        .map((key) => {
          const value = obj[key];
          if (value === null || value === undefined) return "";
          if (typeof value === "object")
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"') || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(",");
    });

    return [header, ...rows].join("\n");
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
