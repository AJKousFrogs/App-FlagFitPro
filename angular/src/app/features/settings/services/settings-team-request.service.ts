import { Injectable, inject, signal } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SettingsDataService } from "./settings-data.service";

@Injectable({
  providedIn: "root",
})
export class SettingsTeamRequestService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly logger = inject(LoggerService);

  readonly availableTeams = signal<{ label: string; value: string }[]>([]);
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
      this.availableTeams.set(teamOptions);
      return null;
    } catch (error) {
      this.logger.warn("Failed to load teams:", toLogContext(error));
      return "We couldn't load your available teams.";
    }
  }

}
