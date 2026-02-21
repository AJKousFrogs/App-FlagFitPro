import { Injectable, inject } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
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
  }> {
    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) {
        return { profilePatch: null, membershipPatch: null };
      }

      let profilePatch: SettingsProfilePatch | null = null;

      const { profile, error } =
        await this.settingsDataService.fetchUserProfile(user.id);

      if (!error && profile) {
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

      return { profilePatch, membershipPatch };
    } catch (error) {
      this.logger.warn("Could not load profile data:", toLogContext(error));
      return { profilePatch: null, membershipPatch: null };
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
}
