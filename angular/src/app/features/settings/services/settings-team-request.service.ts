import { Injectable, inject, signal } from "@angular/core";
import { TOAST } from "../../../core/constants";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { SettingsDataService } from "./settings-data.service";

@Injectable({
  providedIn: "root",
})
export class SettingsTeamRequestService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  readonly availableTeams = signal<Array<{ label: string; value: string }>>([]);
  readonly isSubmittingTeamRequest = signal(false);

  async loadAvailableTeams(): Promise<string | null> {
    try {
      const { teams, error } =
        await this.settingsDataService.fetchApprovedTeams();

      if (error) {
        this.logger.warn("Could not load teams:", toLogContext(error.message));
        return error.message || "We couldn't load your available teams.";
      }

      const teamOptions = (teams || []).map((team) => ({
        label: team.name,
        value: team.id,
      }));

      teamOptions.push({
        label: "➕ Request to create a new team...",
        value: "__new_team__",
      });

      this.availableTeams.set(teamOptions);
      return null;
    } catch (error) {
      this.logger.warn("Failed to load teams:", toLogContext(error));
      return "We couldn't load your available teams.";
    }
  }

  async submitNewTeamRequest(input: {
    teamName: string;
    teamNotes: string;
  }): Promise<boolean> {
    this.logger.debug(
      "[submitNewTeamRequest] Attempting to create team:",
      toLogContext(input.teamName),
    );

    if (!input.teamName.trim()) {
      this.logger.warn("[submitNewTeamRequest] Team name empty, aborting");
      this.toastService.warn(TOAST.WARN.REQUIRED_FIELDS);
      return false;
    }

    this.isSubmittingTeamRequest.set(true);

    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return false;
      }

      const { team: newTeam, error: teamError } =
        await this.settingsDataService.createTeam({
          name: input.teamName.trim(),
          approval_status: "pending_approval",
          application_notes: input.teamNotes.trim() || null,
          coach_id: user.id,
        });

      if (teamError) {
        throw new Error(teamError.message);
      }

      if (!newTeam) {
        throw new Error("Failed to create team - no data returned");
      }

      await this.settingsDataService.insertApprovalRequest({
        request_type: "new_team",
        team_id: newTeam.id,
        user_id: user.id,
        request_reason:
          input.teamNotes.trim() ||
          `User requested to create team: ${input.teamName}`,
        status: "pending",
      });

      await this.sendTeamApprovalNotification(user, input.teamName.trim());

      this.toastService.success(
        "Your team request has been submitted for approval. You will be notified once it's reviewed.",
      );
      this.logger.info(
        "[submitNewTeamRequest] Team request submitted successfully",
      );
      return true;
    } catch (error) {
      this.logger.error(
        "[submitNewTeamRequest] Failed to submit team request:",
        error,
      );
      this.toastService.error(
        getErrorMessage(error, TOAST.ERROR.TEAM_REQUEST_FAILED),
      );
      return false;
    } finally {
      this.isSubmittingTeamRequest.set(false);
    }
  }

  private async sendTeamApprovalNotification(
    user: { id: string; email?: string },
    teamName: string,
  ): Promise<void> {
    try {
      const { error } = await this.settingsDataService.invokeFunction(
        "send-team-approval-notification",
        {
          teamName,
          requestedBy: user.email || "Unknown user",
          requestedById: user.id,
          adminEmail: "merlin@ljubljanafrogs.si",
        },
      );

      if (error) {
        this.logger.warn(
          "Could not send notification email:",
          toLogContext(error.message),
        );
      }
    } catch (error) {
      this.logger.warn(
        "Failed to send team approval notification:",
        toLogContext(error),
      );
    }
  }
}
