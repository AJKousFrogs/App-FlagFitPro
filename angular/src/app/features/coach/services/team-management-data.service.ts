import { Injectable, inject } from "@angular/core";
import { DEFAULT_TEAM_BRAND_HEX } from "../../../core/utils/design-tokens.util";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { CoachTeamContextService } from "./coach-team-context.service";

export interface TeamManagementSettings {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  league: string;
  homeField: string;
  preferences: {
    requireWellnessCheckin: boolean;
    autoSendRsvpReminders: boolean;
    allowPlayersViewAnalytics: boolean;
    requireCoachApprovalPosts: boolean;
  };
}

type ServiceError = { message?: string } | null;

const DEFAULT_SETTINGS: TeamManagementSettings = {
  name: "",
  logoUrl: "",
  primaryColor: DEFAULT_TEAM_BRAND_HEX.primary,
  secondaryColor: DEFAULT_TEAM_BRAND_HEX.secondary,
  league: "",
  homeField: "",
  preferences: {
    requireWellnessCheckin: true,
    autoSendRsvpReminders: true,
    allowPlayersViewAnalytics: true,
    requireCoachApprovalPosts: false,
  },
};

@Injectable({
  providedIn: "root",
})
export class TeamManagementDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly coachTeamContextService = inject(CoachTeamContextService);
  private readonly logger = inject(LoggerService);

  async loadSettings(): Promise<{
    data: TeamManagementSettings;
    error: ServiceError;
  }> {
    try {
      const { teamId } = await this.coachTeamContextService.resolveCoachContext();
      const [{ data: team, error: teamError }, { data: preferences, error: preferencesError }] =
        await Promise.all([
          this.supabaseService.client
            .from("teams")
            .select("name, team_logo_url, primary_color, secondary_color, league, home_field")
            .eq("id", teamId)
            .maybeSingle(),
          this.supabaseService.client
            .from("team_preferences")
            .select("*")
            .eq("team_id", teamId)
            .maybeSingle(),
        ]);

      if (teamError) {
        return { data: DEFAULT_SETTINGS, error: teamError };
      }

      if (preferencesError) {
        return { data: DEFAULT_SETTINGS, error: preferencesError };
      }

      return {
        data: {
          name: this.toString(team?.["name"]),
          logoUrl: this.toString(team?.["team_logo_url"]),
          primaryColor:
            this.toString(team?.["primary_color"]) || DEFAULT_SETTINGS.primaryColor,
          secondaryColor:
            this.toString(team?.["secondary_color"]) ||
            DEFAULT_SETTINGS.secondaryColor,
          league: this.toString(team?.["league"]),
          homeField: this.toString(team?.["home_field"]),
          preferences: {
            requireWellnessCheckin:
              this.toBoolean(preferences?.["require_wellness_checkin"]) ??
              DEFAULT_SETTINGS.preferences.requireWellnessCheckin,
            autoSendRsvpReminders:
              this.toBoolean(preferences?.["auto_send_rsvp_reminders"]) ??
              DEFAULT_SETTINGS.preferences.autoSendRsvpReminders,
            allowPlayersViewAnalytics:
              this.toBoolean(preferences?.["allow_players_view_analytics"]) ??
              DEFAULT_SETTINGS.preferences.allowPlayersViewAnalytics,
            requireCoachApprovalPosts:
              this.toBoolean(preferences?.["require_coach_approval_posts"]) ??
              DEFAULT_SETTINGS.preferences.requireCoachApprovalPosts,
          },
        },
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[TeamManagementDataService] Failed to load team settings",
        toLogContext(error),
      );
      return {
        data: DEFAULT_SETTINGS,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load team settings",
        },
      };
    }
  }

  async saveSettings(settings: TeamManagementSettings): Promise<{
    error: ServiceError;
  }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();

      const { error: teamError } = await this.supabaseService.client
        .from("teams")
        .update({
          name: settings.name.trim(),
          team_logo_url: settings.logoUrl?.trim() || null,
          primary_color: settings.primaryColor.trim(),
          secondary_color: settings.secondaryColor.trim(),
          league: settings.league.trim() || null,
          home_field: settings.homeField.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teamId);

      if (teamError) {
        return { error: teamError };
      }

      const { error: preferencesError } = await this.supabaseService.client
        .from("team_preferences")
        .upsert(
          {
            team_id: teamId,
            created_by: userId,
            require_wellness_checkin: settings.preferences.requireWellnessCheckin,
            auto_send_rsvp_reminders: settings.preferences.autoSendRsvpReminders,
            allow_players_view_analytics:
              settings.preferences.allowPlayersViewAnalytics,
            require_coach_approval_posts:
              settings.preferences.requireCoachApprovalPosts,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "team_id",
          },
        );

      return { error: preferencesError };
    } catch (error) {
      this.logger.error(
        "[TeamManagementDataService] Failed to save team settings",
        toLogContext(error),
      );
      return {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save team settings",
        },
      };
    }
  }

  private toString(value: unknown): string {
    return typeof value === "string" ? value : "";
  }

  private toBoolean(value: unknown): boolean | null {
    return typeof value === "boolean" ? value : null;
  }
}
