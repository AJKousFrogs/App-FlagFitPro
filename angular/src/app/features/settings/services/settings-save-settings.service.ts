import { Injectable, inject, signal } from "@angular/core";
import { TOAST } from "../../../core/constants";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { PlatformService } from "../../../core/services/platform.service";
import { ProfileCompletionService } from "../../../core/services/profile-completion.service";
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
  trainingReminders: boolean;
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
  private readonly authService = inject(AuthService);
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly toastService = inject(ToastService);
  private readonly themeService = inject(ThemeService);
  private readonly logger = inject(LoggerService);
  private readonly profileCompletionService = inject(ProfileCompletionService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly platform = inject(PlatformService);

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

      const localSettings = {
        userId: user.id,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      this.platform.setLocalStorage(
        "user_settings",
        JSON.stringify(localSettings),
      );
      this.logger.info("Settings saved to localStorage");

      if (settings.preferences.theme) {
        this.themeService.setMode(settings.preferences.theme);
        this.logger.info("Theme applied:", settings.preferences.theme);
      }

      type ExistingUser = { id?: string } | null;
      let existingUser: ExistingUser = null;
      let resolvedTeamId = settings.profile.teamId;

      try {
        const nameParts = settings.profile.displayName?.split(" ") || [];

        let dateOfBirthStr: string | null = null;
        if (settings.profile.dateOfBirth) {
          const dob = new Date(settings.profile.dateOfBirth);
          if (!isNaN(dob.getTime())) {
            dateOfBirthStr = dob.toISOString().split("T")[0];
          }
        }

        const updateData = {
          email: user.email || null,
          full_name: settings.profile.displayName,
          first_name: nameParts[0] || null,
          last_name: nameParts.slice(1).join(" ") || null,
          position: settings.profile.position,
          jersey_number: settings.profile.jerseyNumber
            ? parseInt(settings.profile.jerseyNumber, 10)
            : null,
          height_cm: settings.profile.heightCm || null,
          weight_kg: settings.profile.weightKg || null,
          phone: settings.profile.phone || null,
          country: settings.profile.country || null,
          date_of_birth: dateOfBirthStr,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        };

        this.logger.info("Updating users table with:", updateData);

        const { user: foundUser } =
          await this.settingsDataService.findUserRecord(user.id);
        existingUser = foundUser as ExistingUser;

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
          this.toastService.error(
            `Failed to save profile: ${profileError.message}`,
          );
          throw profileError;
        }

        if (upsertedUser) {
          this.logger.info("User profile saved successfully:", upsertedUser);
        } else {
          this.logger.warn("User profile save returned no data");
        }

        const { member: existingTeamMember } =
          await this.settingsDataService.fetchTeamMember(user.id);

        if (existingTeamMember) {
          const parsedJersey = settings.profile.jerseyNumber
            ? parseInt(settings.profile.jerseyNumber, 10)
            : null;

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
              this.logger.warn("Team transfer requested without team ID");
              return;
            }

            if (!existingTeamMember.id) {
              this.logger.warn("Existing team member missing ID");
              return;
            }

            const { error: deleteError } =
              await this.settingsDataService.deleteTeamMember(
                existingTeamMember.id,
              );

            if (deleteError) {
              this.logger.error(
                "Failed to delete old team membership:",
                deleteError,
              );
              throw new Error(
                `Failed to transfer teams: ${deleteError.message}`,
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
              this.logger.error(
                "Failed to create new team membership:",
                insertError,
              );
              throw new Error(
                `Failed to join new team: ${insertError.message}`,
              );
            }

            this.logger.info(
              "Successfully transferred to new team:",
              newMember,
            );
            resolvedTeamId = newTeamId;
          } else {
            if (!existingTeamMember.id) {
              this.logger.warn("Existing team member missing ID");
              return;
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
              this.logger.error(
                "Failed to update team_members:",
                memberError.message,
                memberError,
              );
              throw new Error(
                `Failed to update team membership: ${memberError.message}`,
              );
            }

            this.logger.info(
              "Successfully updated team membership:",
              updatedMember,
            );
            resolvedTeamId = existingTeamMember.team_id ?? resolvedTeamId;
          }
        } else if (settings.profile.teamId) {
          this.logger.info(
            "Creating team membership:",
            settings.profile.teamId,
          );
          await this.updateTeamMembership(
            user.id,
            settings.profile.teamId,
            settings.profile.position,
            settings.profile.jerseyNumber,
          );
          resolvedTeamId = settings.profile.teamId;
        }

        if (resolvedTeamId) {
          await this.syncTeamPlayerProfile(user.id, resolvedTeamId, settings.profile);
        }
      } catch (error) {
        this.logger.warn("Users table update failed:", toLogContext(error));
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

      try {
        const settingsData = {
          user_id: user.id,
          email_notifications: settings.notifications.emailNotifications,
          push_notifications: settings.notifications.pushNotifications,
          training_reminders: settings.notifications.trainingReminders,
          profile_visibility: settings.privacy.profileVisibility,
          show_stats: settings.privacy.showStats,
          theme: settings.preferences.theme,
          language: settings.preferences.language,
          updated_at: new Date().toISOString(),
        };

        this.logger.info("Upserting user_settings:", settingsData);

        const { settings: existingSettings } =
          await this.settingsDataService.fetchUserSettings(user.id);

        let settingsResult;
        let settingsError;

        if (existingSettings) {
          this.logger.info("User settings exist, updating...");
          const result = await this.settingsDataService.updateUserSettings(
            user.id,
            {
              email_notifications: settings.notifications.emailNotifications,
              push_notifications: settings.notifications.pushNotifications,
              training_reminders: settings.notifications.trainingReminders,
              profile_visibility: settings.privacy.profileVisibility,
              show_stats: settings.privacy.showStats,
              theme: settings.preferences.theme,
              language: settings.preferences.language,
              updated_at: new Date().toISOString(),
            },
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
          this.logger.warn(
            "Settings table update failed:",
            settingsError.message,
          );
        } else {
          this.logger.info("User settings saved successfully:", settingsResult);
        }
      } catch (error) {
        this.logger.warn("user_settings table error:", toLogContext(error));
      }

      if (settings.profile.email !== this.authService.getUser()?.email) {
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
      await this.authService.refreshUser();
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
        await this.settingsDataService.updateTeamMember(
          existingMembership.id as string,
          {
            position: position || null,
            jersey_number: parsedJersey,
            updated_at: new Date().toISOString(),
          },
        );
      } else {
        const { membership: otherMembership } =
          await this.settingsDataService.fetchOtherMembership({
            userId,
            teamId,
          });

        if (otherMembership) {
          await this.settingsDataService.updateTeamMember(
            otherMembership.id as string,
            {
              team_id: teamId,
              position: position || null,
              jersey_number: parsedJersey,
              updated_at: new Date().toISOString(),
            },
          );
        } else {
          await this.settingsDataService.insertTeamMember({
            user_id: userId,
            team_id: teamId,
            role: "player",
            position: position || null,
            jersey_number: parsedJersey,
            status: "active",
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        "Could not update team membership:",
        toLogContext(error),
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
}
