import { Injectable, inject } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";

export interface CoachTeamContext {
  userId: string;
  teamId: string;
}

export interface CoachTeamPlayerSummary {
  id: string;
  name: string;
  number: string;
  position: string;
}

type ServiceError = { message?: string } | null;

@Injectable({
  providedIn: "root",
})
export class CoachTeamContextService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  async resolveCoachContext(): Promise<CoachTeamContext> {
    const user = this.supabaseService.currentUser();
    if (!user?.id) {
      throw new Error("You must be logged in to manage team data.");
    }

    let teamId = this.teamMembershipService.teamId();
    if (!teamId) {
      const membership = await this.teamMembershipService.loadMembership();
      teamId = membership?.teamId ?? null;
    }

    if (!teamId) {
      throw new Error("An active team membership is required.");
    }

    return {
      userId: user.id,
      teamId,
    };
  }

  async listTeamPlayers(): Promise<{
    data: CoachTeamPlayerSummary[];
    error: ServiceError;
  }> {
    try {
      const { teamId } = await this.resolveCoachContext();
      const { data: members, error: membersError } =
        await this.supabaseService.client
          .from("team_members")
          .select("user_id, position, jersey_number")
          .eq("team_id", teamId)
          .eq("status", "active")
          .eq("role", "player");

      if (membersError) {
        return { data: [], error: membersError };
      }

      const userIds = (members ?? [])
        .map((member) => this.toString(member["user_id"]))
        .filter((value): value is string => value.length > 0);

      if (userIds.length === 0) {
        return { data: [], error: null };
      }

      const { data: users, error: usersError } = await this.supabaseService.client
        .from("users")
        .select("id, full_name, first_name, last_name, name, jersey_number, position")
        .in("id", userIds);

      if (usersError) {
        return { data: [], error: usersError };
      }

      const userMap = new Map(
        (users ?? []).map((row) => [this.toString(row["id"]), row]),
      );

      const data = (members ?? []).map((member) => {
        const userId = this.toString(member["user_id"]);
        const userRow = userMap.get(userId) as Record<string, unknown> | undefined;
        const jerseyNumber =
          this.toString(member["jersey_number"]) ||
          this.toString(userRow?.["jersey_number"]) ||
          "--";

        return {
          id: userId,
          name: this.formatUserName(userRow, userId),
          number: jerseyNumber,
          position:
            this.toString(member["position"]) ||
            this.toString(userRow?.["position"]) ||
            "Athlete",
        };
      });

      return {
        data: data.sort((left, right) => left.name.localeCompare(right.name)),
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[CoachTeamContextService] Failed to load team players",
        toLogContext(error),
      );
      return {
        data: [],
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load team players",
        },
      };
    }
  }

  private formatUserName(
    row: Record<string, unknown> | undefined,
    fallback: string,
  ): string {
    const fullName = this.toString(row?.["full_name"]);
    if (fullName) {
      return fullName;
    }

    const explicitName = this.toString(row?.["name"]);
    if (explicitName) {
      return explicitName;
    }

    const firstName = this.toString(row?.["first_name"]);
    const lastName = this.toString(row?.["last_name"]);
    const joined = [firstName, lastName].filter(Boolean).join(" ").trim();

    return joined || fallback;
  }

  private toString(value: unknown): string {
    return typeof value === "string" ? value : "";
  }
}
