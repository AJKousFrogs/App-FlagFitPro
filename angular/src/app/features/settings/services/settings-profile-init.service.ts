import { Injectable, inject } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
import type { ThemeMode } from "../../../core/services/theme.service";
import { SettingsDataService } from "./settings-data.service";

export interface SettingsProfilePatch {
  displayName?: string;
  dateOfBirth?: Date | null;
  position?: string;
  jerseyNumber?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  phone?: string;
  country?: string;
}

export interface SettingsMembershipPatch {
  teamId: string;
  position: string | null;
  jerseyNumber: string | null;
}

export interface SettingsNotificationPatch {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  trainingReminders: boolean;
  wellnessReminders: boolean;
  gameAlerts: boolean;
  teamAnnouncements: boolean;
  coachMessages: boolean;
  achievementAlerts: boolean;
  tournamentAlerts: boolean;
  injuryRiskAlerts: boolean;
  digestFrequency: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface SettingsPrivacyPatch {
  profileVisibility: string;
  showStats: boolean;
}

export interface SettingsPreferencePatch {
  theme: ThemeMode;
  language: string;
}

@Injectable({
  providedIn: "root",
})
export class SettingsProfileInitService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  async loadProfileData(): Promise<{
    profilePatch: SettingsProfilePatch | null;
    membershipPatch: SettingsMembershipPatch | null;
    notificationPatch: SettingsNotificationPatch | null;
    privacyPatch: SettingsPrivacyPatch | null;
    preferencePatch: SettingsPreferencePatch | null;
    errorMessage: string | null;
  }> {
    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) {
        return {
          profilePatch: null,
          membershipPatch: null,
          notificationPatch: null,
          privacyPatch: null,
          preferencePatch: null,
          errorMessage: "Please sign in again to load your settings.",
        };
      }

      let profilePatch: SettingsProfilePatch | null = null;
      let notificationPatch: SettingsNotificationPatch | null = null;
      let privacyPatch: SettingsPrivacyPatch | null = null;
      let preferencePatch: SettingsPreferencePatch | null = null;

      const [{ profile, error }, { settings, error: settingsError }] =
        await Promise.all([
          this.settingsDataService.fetchUserProfile(user.id),
          this.settingsDataService.fetchUserSettings(user.id),
        ]);

      if (error) {
        return {
          profilePatch: null,
          membershipPatch: null,
          notificationPatch: null,
          privacyPatch: null,
          preferencePatch: null,
          errorMessage:
            error.message || "We couldn't load your profile settings.",
        };
      }

      if (settingsError) {
        return {
          profilePatch: null,
          membershipPatch: null,
          notificationPatch: null,
          privacyPatch: null,
          preferencePatch: null,
          errorMessage:
            settingsError.message || "We couldn't load your app settings.",
        };
      }

      if (profile) {
        const profileRecord = profile as Record<string, unknown>;
        this.logger.debug("[Settings] Loaded user profile:", {
          position: profileRecord["position"],
          jerseyNumber: profileRecord["jersey_number"],
        });

        const dateOfBirthValue =
          typeof profileRecord["date_of_birth"] === "string"
            ? new Date(profileRecord["date_of_birth"])
            : null;

        const firstName = this.toStringOrEmpty(profileRecord["first_name"]);
        const lastName = this.toStringOrEmpty(profileRecord["last_name"]);
        const fullName =
          this.toStringOrEmpty(profileRecord["full_name"]) ||
          `${firstName} ${lastName}`.trim();

        profilePatch = {
          displayName: fullName,
          dateOfBirth: dateOfBirthValue,
          position: this.toStringOrEmpty(profileRecord["position"]),
          jerseyNumber:
            this.toStringOrEmpty(profileRecord["jersey_number"]) || "",
          heightCm: this.toNumberOrNull(profileRecord["height_cm"]),
          weightKg: this.toNumberOrNull(profileRecord["weight_kg"]),
          phone: this.toStringOrEmpty(profileRecord["phone"]),
          country: this.toStringOrEmpty(profileRecord["country"]),
        };
      }

      if (settings) {
        notificationPatch = {
          emailNotifications: this.toBoolean(
            settings["email_notifications"],
            true,
          ),
          pushNotifications: this.toBoolean(
            settings["push_notifications"],
            true,
          ),
          inAppNotifications: this.toBoolean(
            settings["in_app_notifications"],
            true,
          ),
          trainingReminders: this.toBoolean(
            settings["training_reminders"],
            true,
          ),
          wellnessReminders: this.toBoolean(
            settings["wellness_reminders"],
            true,
          ),
          gameAlerts: this.toBoolean(settings["game_alerts"], true),
          teamAnnouncements: this.toBoolean(
            settings["team_announcements"],
            true,
          ),
          coachMessages: this.toBoolean(settings["coach_messages"], true),
          achievementAlerts: this.toBoolean(
            settings["achievement_alerts"],
            true,
          ),
          tournamentAlerts: this.toBoolean(
            settings["tournament_alerts"],
            true,
          ),
          injuryRiskAlerts: this.toBoolean(
            settings["injury_risk_alerts"],
            true,
          ),
          digestFrequency: this.toStringWithDefault(
            settings["digest_frequency"],
            "realtime",
          ),
          quietHoursEnabled: this.toBoolean(
            settings["quiet_hours_enabled"],
            true,
          ),
          quietHoursStart: this.toStringWithDefault(
            settings["quiet_hours_start"],
            "22:00",
          ),
          quietHoursEnd: this.toStringWithDefault(
            settings["quiet_hours_end"],
            "07:00",
          ),
        };

        privacyPatch = {
          profileVisibility: this.toStringWithDefault(
            settings["profile_visibility"],
            "public",
          ),
          showStats: this.toBoolean(settings["show_stats"], true),
        };

        preferencePatch = {
          theme: this.toThemeMode(settings["theme"]),
          language: this.toStringWithDefault(settings["language"], "en"),
        };
      }

      await this.teamMembershipService.loadMembership();
      const membership = this.teamMembershipService.membership();

      let membershipPatch: SettingsMembershipPatch | null = null;
      if (membership) {
        this.logger.debug(
          "[Settings] Loaded team membership (authoritative):",
          {
            position: membership.position,
            jerseyNumber: membership.jerseyNumber,
          },
        );

        membershipPatch = {
          teamId: membership.teamId,
          position: membership.position || null,
          jerseyNumber: membership.jerseyNumber?.toString() || null,
        };
      }

      return {
        profilePatch,
        membershipPatch,
        notificationPatch,
        privacyPatch,
        preferencePatch,
        errorMessage: null,
      };
    } catch (error) {
      this.logger.warn("Could not load profile data:", toLogContext(error));
      return {
        profilePatch: null,
        membershipPatch: null,
        notificationPatch: null,
        privacyPatch: null,
        preferencePatch: null,
        errorMessage:
          "We couldn't load your settings right now. Please try again.",
      };
    }
  }

  private toStringOrEmpty(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    return "";
  }

  private toNumberOrNull(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    return fallback;
  }

  private toStringWithDefault(value: unknown, fallback: string): string {
    const parsed = this.toStringOrEmpty(value);
    return parsed || fallback;
  }

  private toThemeMode(value: unknown): ThemeMode {
    if (value === "light" || value === "dark" || value === "auto") {
      return value;
    }
    return "auto";
  }
}
