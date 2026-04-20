/**
 * Onboarding Completion Service
 *
 * Orchestrates all data-saving operations when a user completes onboarding:
 * profile upsert, training preferences, athlete config, roster placement,
 * and training program assignment.
 *
 * Returns a structured result so the component only handles navigation.
 */
import { inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { UI_LIMITS } from "../../../core/constants/app.constants";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import {
  LoggerService,
  toLogContext,
} from "../../../core/services/logger.service";
import { PlatformService } from "../../../core/services/platform.service";
import {
  PlayerProgramService,
  getProgramIdForPosition,
  normalizePositionForModifiers,
} from "../../../core/services/player-program.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  isApiResponse,
  isSuccessfulApiResponse,
} from "../../../core/utils/api-response-mapper";
import { AuthFlowDataService } from "../../auth/services/auth-flow-data.service";
import { RosterService } from "../../roster/roster.service";
import { OnboardingDataService } from "./onboarding-data.service";
import { OnboardingStateService } from "./onboarding-state.service";

export interface OnboardingCompletionResult {
  success: boolean;
  isStaff: boolean;
  redirectUrl: string | null;
}

@Injectable({ providedIn: "root" })
export class OnboardingCompletionService {
  private readonly state = inject(OnboardingStateService);
  private readonly onboardingDataService = inject(OnboardingDataService);
  private readonly api = inject(ApiService);
  private readonly rosterService = inject(RosterService);
  private readonly playerProgramService = inject(PlayerProgramService);
  private readonly platform = inject(PlatformService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly authFlowDataService = inject(AuthFlowDataService);

  async execute(): Promise<OnboardingCompletionResult> {
    const user = this.onboardingDataService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const nameParts = this.state.formData.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const isStaffUser = this.state.isStaff();
    const heightCm = isStaffUser ? null : this.getHeightInCm();
    const weightKg = isStaffUser ? null : this.getWeightInKg();

    const profileData = {
      full_name: this.state.formData.name,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: this.state.formData.dateOfBirth?.toISOString().split("T")[0],
      gender: this.state.formData.gender,
      country: this.state.formData.country,
      phone: this.state.formData.phone || null,
      team: this.state.formData.team,
      position: isStaffUser ? null : this.state.formData.position,
      secondary_position: isStaffUser ? null : this.state.formData.secondaryPosition,
      throwing_arm: isStaffUser ? null : this.state.formData.throwingArm,
      experience_level: isStaffUser ? null : this.state.formData.experience,
      jersey_number: isStaffUser ? null : this.state.formData.jerseyNumber,
      height_cm: heightCm,
      weight_kg: weightKg,
      preferred_units: isStaffUser ? null : this.state.formData.unitSystem,
      updated_at: new Date().toISOString(),
    };

    const profileDataWithOnboarding = {
      ...profileData,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    };

    const { error: updateError } =
      await this.onboardingDataService.updateUserProfileByEmail(
        user.email ?? "",
        profileDataWithOnboarding,
      );

    if (updateError) {
      const { error: insertError } =
        await this.onboardingDataService.insertUserProfile({
          id: user.id,
          email: user.email,
          ...profileDataWithOnboarding,
          is_active: true,
          email_verified: true,
        });

      if (insertError) {
        throw new Error(`Failed to save profile: ${insertError.message}`);
      }
    }

    const authRole = isStaffUser
      ? this.state.formData.staffRole === "head_coach"
        ? "coach"
        : this.state.formData.staffRole === "assistant_coach"
          ? "assistant_coach"
          : this.state.formData.staffRole || "coach"
      : "player";

    await this.onboardingDataService.updateAuthUser({
      data: {
        role: authRole,
        user_type: this.state.formData.userType,
        full_name: this.state.formData.name,
      },
    });

    if (!isStaffUser) {
      await this.saveTrainingPreferences(user.id, user.email ?? "");
      await this.seedCanonicalPlayerSettings();
      await this.saveCurrentInjuries(user.id);
      await this.createAthleteTrainingConfig(user.id);

      const assignmentResult = await this.assignTrainingProgram();

      if (!assignmentResult) {
        this.logger.error(
          "[Onboarding] Program assignment FAILED - this is a critical error",
        );
        this.toastService.warn(
          "Training program assignment is pending. You can still access the app, but your personalized plan may not be ready yet. Please contact support if this persists.",
          "Setup Incomplete",
        );
        this.platform.setSessionStorage("programAssignmentPending", "true");
        this.logger.error(
          "[Onboarding] Allowing user to proceed without program assignment",
          { position: this.state.formData.position },
        );
      }

      if (this.state.formData.team) {
        await this.addPlayerToTeamRoster(user.id);
      }

      this.platform.setSessionStorage("refreshProgramAssignment", "true");
    } else {
      if (this.state.formData.team) {
        await this.addStaffToTeamRoster(user.id);
      }
    }

    this.state.clearDraft();

    const successMessage = isStaffUser
      ? "Your staff profile has been set up!"
      : "Your profile and training preferences have been set up!";
    this.toastService.success(successMessage, "Welcome to FlagFit Pro!");

    const redirectUrl = this.authFlowDataService.consumePostOnboardingRedirect();

    return {
      success: true,
      isStaff: isStaffUser,
      redirectUrl,
    };
  }

  // ===== Private helpers =====

  private getHeightInCm(): number | null {
    if (this.state.formData.unitSystem === "metric") {
      return this.state.formData.heightCm;
    } else {
      if (this.state.formData.heightFt || this.state.formData.heightIn) {
        const totalInches =
          (this.state.formData.heightFt || 0) * 12 +
          (this.state.formData.heightIn || 0);
        return Math.round(totalInches * 2.54);
      }
      return null;
    }
  }

  private getWeightInKg(): number | null {
    if (this.state.formData.unitSystem === "metric") {
      return this.state.formData.weightKg;
    } else {
      if (this.state.formData.weightLbs) {
        return Math.round(this.state.formData.weightLbs * 0.453592 * 10) / 10;
      }
      return null;
    }
  }

  private async saveTrainingPreferences(
    userId: string,
    email: string,
  ): Promise<void> {
    try {
      const preferences = {
        user_id: userId,
        email: email,
        schedule_type: this.state.formData.scheduleType,
        practices_per_week: this.state.formData.practicesPerWeek,
        practice_days: this.state.formData.practiceDays,
        morning_mobility: this.state.formData.morningMobility,
        evening_mobility: this.state.formData.eveningMobility,
        foam_rolling_time: this.state.formData.foamRollingTime,
        rest_day_preference: this.state.formData.restDayPreference,
        training_goals: this.state.formData.goals,
        equipment_available: this.state.formData.equipmentAvailable,
        current_injuries: this.state.formData.currentInjuries,
        injury_history: this.state.formData.injuryHistory,
        medical_notes: this.state.formData.medicalNotes || null,
        enable_reminders: this.state.formData.enableReminders,
        reminder_time: this.state.formData.reminderTime,
        notification_preferences: this.state.formData.notificationPreferences,
        consent_terms_of_service: this.state.formData.consentTermsOfService,
        consent_privacy_policy: this.state.formData.consentPrivacyPolicy,
        consent_data_usage: this.state.formData.consentDataUsage,
        consent_ai_coach: this.state.formData.consentAICoach,
        consent_email_updates: this.state.formData.consentEmailUpdates,
        consent_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } =
        await this.onboardingDataService.upsertUserPreferences(preferences);

      if (error) {
        this.platform.removeLocalStorage("flagfit_preferences");
        this.logger.error(
          "Failed to save onboarding preferences to Supabase",
          toLogContext(error.message),
        );
        throw new Error(
          "Failed to save training preferences. Please try again.",
        );
      }
      this.platform.removeLocalStorage("flagfit_preferences");
    } catch (error) {
      this.platform.removeLocalStorage("flagfit_preferences");
      throw error;
    }
  }

  private async seedCanonicalPlayerSettings(): Promise<void> {
    try {
      const preferredDayIndices = this.getPreferredTrainingDayIndices();
      const payload = {
        primaryPosition: normalizePositionForModifiers(
          this.state.formData.position || "WR",
        ),
        secondaryPosition: this.state.formData.secondaryPosition
          ? normalizePositionForModifiers(this.state.formData.secondaryPosition)
          : null,
        birthDate:
          this.state.formData.dateOfBirth?.toISOString().split("T")[0] || null,
        availabilitySchedule: preferredDayIndices.map((dayOfWeek) => ({
          dayOfWeek,
          available: true,
        })),
        preferredTrainingDays: preferredDayIndices,
        maxSessionsPerWeek: Math.min(
          14,
          Math.max(
            1,
            Math.round(
              Number(this.state.formData.practicesPerWeek ?? 3) || 3,
            ),
          ),
        ),
        hasGymAccess:
          this.state.formData.equipmentAvailable?.includes("gym") || false,
        hasFieldAccess:
          this.state.formData.equipmentAvailable?.includes("field") || true,
        availableEquipment: this.state.formData.equipmentAvailable || [],
        currentLimitations:
          this.state.formData.currentInjuries?.length > 0
            ? { injuries: this.state.formData.currentInjuries }
            : null,
      };

      await firstValueFrom(
        this.api.post(API_ENDPOINTS.playerSettings.save, payload),
      );
    } catch (error) {
      this.logger.warn(
        "[Onboarding] Failed to seed canonical player settings",
        toLogContext(error),
      );
    }
  }

  private async createAthleteTrainingConfig(userId: string): Promise<void> {
    try {
      const normalizedPosition = normalizePositionForModifiers(
        this.state.formData.position || "WR",
      );

      const preferredDayIndices = this.getPreferredTrainingDayIndices();
      const config = {
        user_id: userId,
        primary_position: normalizedPosition,
        secondary_position: this.state.formData.secondaryPosition
          ? normalizePositionForModifiers(this.state.formData.secondaryPosition)
          : null,
        birth_date:
          this.state.formData.dateOfBirth?.toISOString().split("T")[0] || null,
        preferred_training_days: preferredDayIndices,
        max_sessions_per_week: Math.min(
          14,
          Math.max(
            1,
            Math.round(
              Number(this.state.formData.practicesPerWeek ?? 3) || 3,
            ),
          ),
        ),
        available_equipment: this.state.formData.equipmentAvailable || [],
        has_gym_access:
          this.state.formData.equipmentAvailable?.includes("gym") || false,
        has_field_access:
          this.state.formData.equipmentAvailable?.includes("field") || true,
        current_limitations:
          this.state.formData.currentInjuries?.length > 0
            ? { injuries: this.state.formData.currentInjuries }
            : null,
        acwr_target_min: 0.8,
        acwr_target_max: 1.3,
        updated_at: new Date().toISOString(),
      };

      const { error } =
        await this.onboardingDataService.upsertAthleteTrainingConfig(config);

      if (error) {
        this.logger.warn(
          "[Onboarding] Failed to create athlete_training_config:",
          error.message,
        );
      } else {
        this.logger.info(
          `[Onboarding] Created athlete_training_config for position: ${normalizedPosition}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error creating athlete_training_config:",
        e,
      );
    }
  }

  private async saveCurrentInjuries(_userId: string): Promise<void> {
    try {
      if (
        !this.state.formData.currentInjuries ||
        this.state.formData.currentInjuries.length === 0
      ) {
        return;
      }

      const injuryHistoryNotes =
        this.state.formData.injuryHistory.length > 0
          ? `Past injuries: ${this.state.formData.injuryHistory.join(", ")}`
          : null;

      const today = new Date().toISOString().split("T")[0];
      const payload = {
        date: today,
        notes: injuryHistoryNotes || null,
        sleepQuality: 5,
        sleepHours: 7,
        energyLevel: 5,
        muscleSoreness: this.state.formData.currentInjuries.length > 0 ? 5 : 0,
        stressLevel: 5,
        sorenessAreas: this.state.formData.currentInjuries.map(
          (injury) => injury.area,
        ),
      };

      const response = await firstValueFrom(
        this.api.post(API_ENDPOINTS.wellness.checkin, payload),
      );
      const responseError =
        isApiResponse(response) && typeof response.error === "string"
          ? response.error
          : undefined;

      if (!isSuccessfulApiResponse(response)) {
        this.logger.warn(
          "[Onboarding] Failed to save current injuries via API:",
          responseError,
        );
      } else {
        this.logger.info(
          `[Onboarding] Saved ${this.state.formData.currentInjuries.length} current injuries via wellness-checkin API`,
        );
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error saving current injuries:",
        toLogContext(e),
      );
    }
  }

  private async addPlayerToTeamRoster(userId: string): Promise<void> {
    try {
      const teamName = this.state.formData.team;
      if (!teamName) {
        this.logger.warn(
          "[Onboarding] No team name provided, skipping roster addition",
        );
        return;
      }

      let teamId: string | null = null;

      const { team: existingTeam } =
        await this.onboardingDataService.findTeamByName(teamName);

      if (existingTeam) {
        teamId = existingTeam.id;
        this.logger.info(
          `[Onboarding] Found existing team: ${teamName} (${teamId})`,
        );
      } else {
        const { team: newTeam, error: teamError } =
          await this.onboardingDataService.createTeam({
            name: teamName,
            createdBy: userId,
          });

        if (teamError) {
          this.logger.warn(
            "[Onboarding] Failed to create team:",
            teamError.message,
          );
          return;
        }
        if (!newTeam) {
          this.logger.warn("onboarding_team_creation_empty");
          return;
        }
        teamId = newTeam.id;
        this.logger.info(
          `[Onboarding] Created new team: ${teamName} (${teamId})`,
        );
      }

      if (!teamId) {
        this.logger.warn("onboarding_team_id_unknown");
        return;
      }

      const { member: existingMember } =
        await this.onboardingDataService.findTeamMember({ teamId, userId });

      if (!existingMember) {
        const { error: memberError } =
          await this.onboardingDataService.addTeamMember({
            teamId,
            userId,
            role: "player",
          });

        if (memberError) {
          this.logger.warn(
            "[Onboarding] Failed to add team member:",
            memberError.message,
          );
        } else {
          this.logger.info("onboarding_team_member_player_added");
        }
      }

      let age = 0;
      if (this.state.formData.dateOfBirth) {
        const birthDate = new Date(this.state.formData.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }

      const heightCm = this.getHeightInCm();
      const weightKg = this.getWeightInKg();

      const result = await this.rosterService.addPlayer({
        name: this.state.formData.name,
        position: this.state.formData.position || "Unassigned",
        jersey: this.state.formData.jerseyNumber?.toString() || "0",
        country: this.state.formData.country || "Unknown",
        age,
        height: heightCm ? `${heightCm} cm` : "N/A",
        weight: weightKg ? `${weightKg} kg` : "N/A",
        status: "active",
        user_id: userId,
      });

      if (!result.success) {
        this.logger.warn(
          "[Onboarding] Failed to add to team_players:",
          result.error,
        );
      } else {
        this.logger.info(
          `[Onboarding] Added player to team_players: ${this.state.formData.name}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error adding player to team roster:",
        toLogContext(e),
      );
    }
  }

  private async addStaffToTeamRoster(userId: string): Promise<void> {
    try {
      const teamName = this.state.formData.team;
      if (!teamName) {
        this.logger.warn(
          "[Onboarding] No team name provided, skipping staff roster addition",
        );
        return;
      }

      let teamId: string | null = null;

      const { team: existingTeam } =
        await this.onboardingDataService.findTeamByName(teamName);

      if (existingTeam) {
        teamId = existingTeam.id;
        this.logger.info(
          `[Onboarding] Found existing team for staff: ${teamName} (${teamId})`,
        );
      } else {
        const { team: newTeam, error: teamError } =
          await this.onboardingDataService.createTeam({
            name: teamName,
            createdBy: userId,
          });

        if (teamError) {
          this.logger.warn(
            "[Onboarding] Failed to create team:",
            teamError.message,
          );
          return;
        }
        if (!newTeam) {
          this.logger.warn("onboarding_team_creation_empty");
          return;
        }
        teamId = newTeam.id;
        this.logger.info(
          `[Onboarding] Created new team for staff: ${teamName} (${teamId})`,
        );
      }

      if (!teamId) {
        this.logger.warn("onboarding_team_id_unknown_staff");
        return;
      }

      const staffRoleToMemberRole: Record<string, string> = {
        head_coach: "head_coach",
        assistant_coach: "assistant_coach",
        offensive_coordinator: "offense_coordinator",
        defensive_coordinator: "defense_coordinator",
        strength_coach: "strength_conditioning_coach",
        athletic_trainer: "physiotherapist",
        physiotherapist: "physiotherapist",
        nutritionist: "nutritionist",
        sports_psychologist: "psychologist",
        team_manager: "manager",
        video_analyst: "manager",
        equipment_manager: "manager",
        other_staff: "manager",
      };

      const memberRole =
        staffRoleToMemberRole[this.state.formData.staffRole || ""] || "manager";

      const { member: existingMember } =
        await this.onboardingDataService.findTeamMember({ teamId, userId });

      if (!existingMember) {
        const { error: memberError } =
          await this.onboardingDataService.addTeamMember({
            teamId,
            userId,
            role: memberRole,
          });

        if (memberError) {
          this.logger.warn(
            "[Onboarding] Failed to add staff member:",
            memberError.message,
          );
        } else {
          this.logger.info(
            `[Onboarding] Added staff to team_members as ${memberRole}`,
          );
        }
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error adding staff to team roster:",
        toLogContext(e),
      );
    }
  }

  private async assignTrainingProgram(): Promise<boolean> {
    const position = this.state.formData.position;

    if (!position) {
      this.logger.error(
        "[Onboarding] No position selected - cannot assign program (CRITICAL)",
      );
      return false;
    }

    const programId = getProgramIdForPosition(position);
    this.logger.info(
      `[Onboarding] Assigning program for position "${position}" -> ${programId}`,
    );

    try {
      const assignment = await firstValueFrom(
        this.playerProgramService.assignMyProgram(programId, { force: true }),
      );

      if (assignment) {
        this.logger.info(
          `[Onboarding] ✅ Successfully assigned program: ${assignment.program.name}`,
        );
        return true;
      } else {
        this.logger.error(
          "[Onboarding] ❌ Program assignment returned null (CRITICAL - BLOCKER B)",
          {
            position,
            programId,
            reason:
              "API returned null - possible causes: program not found in DB, RLS policy blocking, or API error",
          },
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        "[Onboarding] ❌ Failed to assign training program (CRITICAL - BLOCKER B):",
        {
          position,
          programId,
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode:
            typeof error === "object" && error !== null && "code" in error
              ? (error as { code: unknown }).code
              : undefined,
          errorDetails:
            typeof error === "object" && error !== null && "details" in error
              ? (error as { details: unknown }).details
              : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return false;
    }
  }

  private getDayNumber(dayName: string): number {
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[dayName.toLowerCase()] ?? 1;
  }

  private getPreferredTrainingDayIndices(): number[] {
    return this.getPreferredTrainingDays().map((day) => this.getDayNumber(day));
  }

  private getPreferredTrainingDays(): string[] {
    const allDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const practiceDays = this.state.formData.practiceDays || [];
    const trainingDays = allDays.filter(
      (day) =>
        !practiceDays.map((d: string) => d.toLowerCase()).includes(day),
    );
    return trainingDays.length >= 3
      ? trainingDays.slice(0, UI_LIMITS.ONBOARDING_DAYS_PREVIEW)
      : allDays.slice(0, UI_LIMITS.ONBOARDING_DAYS_PREVIEW);
  }
}
