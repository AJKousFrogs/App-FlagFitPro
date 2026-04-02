import { Injectable, inject, signal } from "@angular/core";
import { TOAST } from "../../../core/constants";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { PlatformService } from "../../../core/services/platform.service";
import { ProfileCompletionService } from "../../../core/services/profile-completion.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
import { ThemeMode, ThemeService } from "../../../core/services/theme.service";
import { ToastService } from "../../../core/services/toast.service";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { SettingsDataService } from "./settings-data.service";

export interface SaveSettingsInput {
  profile: SettingsProfileInput;
  notifications: SettingsNotificationInput;
  privacy: SettingsPrivacyInput;
  preferences: SettingsPreferenceInput;
}

interface SettingsProfileInput {
  displayName: string;
  email: string;
  dateOfBirth: Date | string | null;
  position: string;
  jerseyNumber: string;
  heightCm: number | null;
  weightKg: number | null;
  teamId: string | null;
  phone: string;
  country: string;
}

interface SettingsNotificationInput {
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

interface SettingsPrivacyInput {
  profileVisibility: string;
  showStats: boolean;
}

interface SettingsPreferenceInput {
  theme: ThemeMode;
  language: string;
}

@Injectable({
  providedIn: "root",
})
export class SettingsSaveSettingsService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly toastService = inject(ToastService);
  private readonly themeService = inject(ThemeService);
  private readonly logger = inject(LoggerService);
  private readonly profileCompletionService = inject(ProfileCompletionService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly platform = inject(PlatformService);
  private readonly supabase = inject(SupabaseService);

  readonly isSavingSettings = signal(false);

  async saveSettings(settings: SaveSettingsInput): Promise<void> {
    this.isSavingSettings.set(true);
    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      this.logger.info("Saving settings for user:", user.id);

      if (settings.preferences.theme) {
        this.themeService.setMode(settings.preferences.theme);
        this.logger.info("Theme applied:", settings.preferences.theme);
      }

      type ExistingUser = Record<string, unknown> | null;
      let existingUser: ExistingUser = null;
      let resolvedTeamId = settings.profile.teamId;
      const nameParts = settings.profile.displayName?.split(" ") || [];
      const dateOfBirthStr = this.normalizeDateOfBirth(
        settings.profile.dateOfBirth,
      );
      const parsedJersey = this.parseJerseyNumber(settings.profile.jerseyNumber);

      const updateData = {
        email: settings.profile.email || user.email || null,
        full_name: settings.profile.displayName,
        first_name: nameParts[0] || null,
        last_name: nameParts.slice(1).join(" ") || null,
        position: settings.profile.position,
        jersey_number: parsedJersey,
        height_cm: settings.profile.heightCm || null,
        weight_kg: settings.profile.weightKg || null,
        phone: settings.profile.phone || null,
        country: settings.profile.country || null,
        date_of_birth: dateOfBirthStr,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      this.logger.info("Updating users table with:", updateData);

      const { profile: existingProfile, error: existingProfileError } =
        await this.settingsDataService.fetchUserProfile(user.id);

      if (existingProfileError) {
        throw new Error(
          existingProfileError.message ||
            "Failed to load your current profile before saving.",
        );
      }

      existingUser = existingProfile;
      this.logger.info("User exists check:", { exists: !!existingUser });

      let upsertedUser;
      let profileError;

      if (existingUser) {
        this.logger.info("User exists in users table, updating...");
        const result = await this.settingsDataService.updateUser(
          user.id,
          updateData,
        );
        upsertedUser = result.data;
        profileError = result.error;
      } else {
        this.logger.info("User not in users table, inserting...");
        const insertData = {
          ...updateData,
          id: user.id,
          created_at: new Date().toISOString(),
        };

        const result = await this.settingsDataService.insertUser(insertData);
        upsertedUser = result.data;
        profileError = result.error;
      }

      if (profileError) {
        this.logger.error(
          "User profile save failed:",
          profileError.message,
          profileError,
        );
        throw new Error(
          `Failed to save profile: ${profileError.message || "unknown error"}`,
        );
      }

      if (upsertedUser) {
        this.logger.info("User profile saved successfully:", upsertedUser);
      } else {
        this.logger.warn("User profile save returned no data");
      }

      const { member: existingTeamMember, error: teamMemberError } =
        await this.settingsDataService.fetchTeamMember(user.id);

      if (teamMemberError) {
        throw new Error(
          `Failed to load team membership: ${teamMemberError.message ?? "unknown error"}`,
        );
      }

      if (existingTeamMember) {
        const teamChanged =
          settings.profile.teamId &&
          settings.profile.teamId !== existingTeamMember.team_id;

        this.logger.info("Updating team_members:", {
          position: settings.profile.position,
          jersey: parsedJersey,
          requestedTeamId: settings.profile.teamId,
          currentTeamId: existingTeamMember.team_id,
          teamChanged,
        });

        if (teamChanged) {
          this.logger.info("Team transfer detected, creating new membership");
          const newTeamId = settings.profile.teamId;
          if (!newTeamId) {
            throw new Error("Team transfer requested without a team.");
          }

          if (!existingTeamMember.id) {
            throw new Error("Existing team membership is missing an ID.");
          }

          const { error: deleteError } =
            await this.settingsDataService.deleteTeamMember(
              existingTeamMember.id,
            );

          if (deleteError) {
            throw new Error(
              `Failed to leave current team: ${deleteError.message ?? "unknown error"}`,
            );
          }

          const { data: newMember, error: insertError } =
            await this.settingsDataService.insertTeamMember({
              user_id: user.id,
              team_id: newTeamId,
              role: "player",
              position: settings.profile.position || null,
              jersey_number: parsedJersey,
              status: "active",
            });

          if (insertError) {
            throw new Error(
              `Failed to join new team: ${insertError.message ?? "unknown error"}`,
            );
          }

          this.logger.info("Successfully transferred to new team:", newMember);
          resolvedTeamId = newTeamId;
        } else {
          if (!existingTeamMember.id) {
            throw new Error("Existing team membership is missing an ID.");
          }

          const { data: updatedMember, error: memberError } =
            await this.settingsDataService.updateTeamMember(
              existingTeamMember.id,
              {
                position: settings.profile.position || null,
                jersey_number: parsedJersey,
                updated_at: new Date().toISOString(),
              },
            );

          if (memberError) {
            throw new Error(
              `Failed to update team membership: ${memberError.message ?? "unknown error"}`,
            );
          }

          this.logger.info(
            "Successfully updated team membership:",
            updatedMember,
          );
          resolvedTeamId = existingTeamMember.team_id ?? resolvedTeamId;
        }
      } else if (settings.profile.teamId) {
        this.logger.info("Creating team membership:", settings.profile.teamId);
        await this.updateTeamMembership(
          user.id,
          settings.profile.teamId,
          settings.profile.position,
          settings.profile.jerseyNumber,
        );
        resolvedTeamId = settings.profile.teamId;
      }

      await this.syncPhysicalMeasurementSnapshot(
        user.id,
        settings.profile,
        existingProfile,
      );

      if (resolvedTeamId) {
        try {
          await this.syncTeamPlayerProfile(
            user.id,
            resolvedTeamId,
            settings.profile,
          );
        } catch (error) {
          this.logger.warn(
            "Could not sync team player profile:",
            toLogContext(error),
          );
        }
      }

      try {
        const { data: authData, error: authError } =
          await this.settingsDataService.updateAuthUser({
            data: {
              full_name: settings.profile.displayName,
              name: settings.profile.displayName,
              position: settings.profile.position,
            },
          });

        if (authError) {
          this.logger.warn("Auth metadata update failed:", authError);
        } else {
          this.logger.info("Auth metadata updated successfully:", authData);
        }
      } catch (error) {
        this.logger.warn("Auth metadata update error:", toLogContext(error));
      }

      const settingsData = this.buildUserSettingsPayload(user.id, settings);

      this.logger.info("Upserting user_settings:", settingsData);

      const { settings: existingSettings, error: existingSettingsError } =
        await this.settingsDataService.fetchUserSettings(user.id);

      if (existingSettingsError) {
        throw new Error(
          existingSettingsError.message ||
            "Failed to load your saved app settings.",
        );
      }

      let settingsResult;
      let settingsError;

      if (existingSettings) {
        this.logger.info("User settings exist, updating...");
        const result = await this.settingsDataService.updateUserSettings(
          user.id,
          settingsData,
        );

        settingsResult = result.data;
        settingsError = result.error;
      } else {
        this.logger.info("User settings don't exist, inserting...");
        const result =
          await this.settingsDataService.insertUserSettings(settingsData);

        settingsResult = result.data;
        settingsError = result.error;
      }

      if (settingsError) {
        throw new Error(
          `Failed to save app settings: ${settingsError.message ?? "unknown error"}`,
        );
      }

      this.logger.info("User settings saved successfully:", settingsResult);
      this.cacheSavedSettingsSnapshot(settingsData);

      if (settings.profile.email !== this.supabase.currentUser()?.email) {
        try {
          this.logger.info("Updating email to:", settings.profile.email);
          const { error: emailError } =
            await this.settingsDataService.updateAuthUser({
              email: settings.profile.email,
            });

          if (emailError) {
            this.logger.warn("Email update error:", emailError);
            this.toastService.info(
              "Email update requires verification. Check your inbox.",
            );
          } else {
            this.logger.info("Email update initiated");
          }
        } catch (error) {
          this.logger.warn("Email update failed:", toLogContext(error));
        }
      }

      this.logger.info("Refreshing centralized services...");
      await this.supabase.refreshCurrentUser();
      await this.profileCompletionService.refresh();
      await this.teamMembershipService.refresh();
      this.logger.info("Services refreshed successfully");

      this.toastService.success(TOAST.SUCCESS.SETTINGS_SAVED);

      if (!existingUser) {
        this.toastService.info(
          "Profile created! Visit the Roster page to see yourself listed.",
          { life: 5000 },
        );
      }
    } catch (error) {
      this.logger.error("Save settings error", error, {
        context: "saveSettings",
      });
      this.toastService.error(
        getErrorMessage(error, TOAST.ERROR.SETTINGS_SAVE_FAILED),
      );
    } finally {
      this.isSavingSettings.set(false);
    }
  }

  private async updateTeamMembership(
    userId: string,
    teamId: string,
    position?: string,
    jerseyNumber?: string,
  ): Promise<void> {
    try {
      const currentMembership = this.teamMembershipService.membership();
      const parsedJersey = jerseyNumber ? parseInt(jerseyNumber, 10) : null;

      if (currentMembership && currentMembership.teamId === teamId) {
        await this.teamMembershipService.updatePositionAndJersey(
          position || null,
          parsedJersey,
        );
        return;
      }

      const { membership: existingMembership } =
        await this.settingsDataService.fetchExistingMembership({
          userId,
          teamId,
        });

        if (existingMembership) {
        const { error } = await this.settingsDataService.updateTeamMember(
          existingMembership.id as string,
          {
            position: position || null,
            jersey_number: parsedJersey,
            updated_at: new Date().toISOString(),
          },
        );
        if (error) {
          throw new Error(
            `Failed to update team membership: ${error.message ?? "unknown error"}`,
          );
        }
      } else {
        const { membership: otherMembership } =
          await this.settingsDataService.fetchOtherMembership({
            userId,
            teamId,
          });

        if (otherMembership) {
          const { error: deleteError } =
            await this.settingsDataService.deleteTeamMember(
              otherMembership.id as string,
            );
          if (deleteError) {
            throw new Error(
              `Failed to leave previous team: ${deleteError.message ?? "unknown error"}`,
            );
          }

          const { error: insertError } =
            await this.settingsDataService.insertTeamMember({
              user_id: userId,
              team_id: teamId,
              role: "player",
              position: position || null,
              jersey_number: parsedJersey,
              status: "active",
            });

          if (insertError) {
            throw new Error(
              `Failed to join selected team: ${insertError.message ?? "unknown error"}`,
            );
          }
        } else {
          const { error: insertError } =
            await this.settingsDataService.insertTeamMember({
            user_id: userId,
            team_id: teamId,
            role: "player",
            position: position || null,
            jersey_number: parsedJersey,
            status: "active",
          });

          if (insertError) {
            throw new Error(
              `Failed to create team membership: ${insertError.message ?? "unknown error"}`,
            );
          }
        }
      }
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Could not update team membership."),
      );
    }
  }

  private async syncTeamPlayerProfile(
    userId: string,
    teamId: string,
    profile: SettingsProfileInput,
  ): Promise<void> {
    const parsedJersey = profile.jerseyNumber
      ? parseInt(profile.jerseyNumber, 10)
      : null;

    const teamPlayerPayload = {
      team_id: teamId,
      user_id: userId,
      name: profile.displayName,
      position: profile.position || "Unknown",
      jersey_number: parsedJersey,
      country: profile.country || null,
      age: this.calculateAge(profile.dateOfBirth),
      height: profile.heightCm ? `${profile.heightCm} cm` : null,
      weight: profile.weightKg ? `${profile.weightKg} kg` : null,
      email: profile.email || null,
      phone: profile.phone || null,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    const { player: existingPlayer, error: fetchError } =
      await this.settingsDataService.fetchTeamPlayer({
        userId,
        teamId,
      });

    if (fetchError) {
      throw new Error(
        `Failed to load team player profile: ${fetchError.message ?? "unknown error"}`,
      );
    }

    if (existingPlayer?.id) {
      const { error } = await this.settingsDataService.updateTeamPlayer(
        existingPlayer.id,
        teamPlayerPayload,
      );
      if (error) {
        throw new Error(
          `Failed to update team player profile: ${error.message ?? "unknown error"}`,
        );
      }
      return;
    }

    const { player: teamPlayerOnOtherTeam, error: otherTeamError } =
      await this.settingsDataService.fetchAnyTeamPlayer(userId);

    if (otherTeamError) {
      throw new Error(
        `Failed to load existing roster record: ${otherTeamError.message ?? "unknown error"}`,
      );
    }

    if (teamPlayerOnOtherTeam?.id) {
      const { error } = await this.settingsDataService.updateTeamPlayer(
        teamPlayerOnOtherTeam.id,
        teamPlayerPayload,
      );

      if (error) {
        throw new Error(
          `Failed to move team player profile: ${error.message ?? "unknown error"}`,
        );
      }

      return;
    }

    const { error } = await this.settingsDataService.insertTeamPlayer({
      ...teamPlayerPayload,
      created_by: userId,
    });

    if (error) {
      throw new Error(
        `Failed to create team player profile: ${error.message ?? "unknown error"}`,
      );
    }
  }

  private calculateAge(dateOfBirth: Date | string | null): number | null {
    if (!dateOfBirth) {
      return null;
    }

    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private normalizeDateOfBirth(value: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString().split("T")[0];
  }

  private parseJerseyNumber(value: string): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private buildUserSettingsPayload(
    userId: string,
    settings: SaveSettingsInput,
  ): Record<string, unknown> {
    return {
      user_id: userId,
      email_notifications: settings.notifications.emailNotifications,
      push_notifications: settings.notifications.pushNotifications,
      in_app_notifications: settings.notifications.inAppNotifications,
      training_reminders: settings.notifications.trainingReminders,
      wellness_reminders: settings.notifications.wellnessReminders,
      game_alerts: settings.notifications.gameAlerts,
      team_announcements: settings.notifications.teamAnnouncements,
      coach_messages: settings.notifications.coachMessages,
      achievement_alerts: settings.notifications.achievementAlerts,
      tournament_alerts: settings.notifications.tournamentAlerts,
      injury_risk_alerts: settings.notifications.injuryRiskAlerts,
      digest_frequency: settings.notifications.digestFrequency,
      quiet_hours_enabled: settings.notifications.quietHoursEnabled,
      quiet_hours_start: settings.notifications.quietHoursStart,
      quiet_hours_end: settings.notifications.quietHoursEnd,
      profile_visibility: settings.privacy.profileVisibility,
      show_stats: settings.privacy.showStats,
      theme: settings.preferences.theme,
      language: settings.preferences.language,
      updated_at: new Date().toISOString(),
    };
  }

  private cacheSavedSettingsSnapshot(data: Record<string, unknown>): void {
    this.platform.setLocalStorage("user_settings", JSON.stringify(data));
    this.logger.info("Updated local user_settings cache from successful save");
  }

  private async syncPhysicalMeasurementSnapshot(
    userId: string,
    profile: SettingsProfileInput,
    existingProfile: Record<string, unknown> | null,
  ): Promise<void> {
    const previousHeight = this.toNumberOrNull(existingProfile?.["height_cm"]);
    const previousWeight = this.toNumberOrNull(existingProfile?.["weight_kg"]);
    const nextHeight = profile.heightCm ?? null;
    const nextWeight = profile.weightKg ?? null;

    const heightChanged = previousHeight !== nextHeight;
    const weightChanged = previousWeight !== nextWeight;

    if (!heightChanged && !weightChanged) {
      return;
    }

    if (nextHeight === null && nextWeight === null) {
      return;
    }

    const { error } = await this.settingsDataService.insertPhysicalMeasurement({
      user_id: userId,
      height: nextHeight,
      weight: nextWeight,
      created_at: new Date().toISOString(),
    });

    if (error) {
      this.logger.warn(
        "Could not write physical measurement snapshot:",
        error.message,
      );
    }
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
}
