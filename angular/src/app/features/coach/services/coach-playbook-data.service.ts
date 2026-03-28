import { Injectable, inject } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import {
  CoachTeamContextService,
  CoachTeamPlayerSummary,
} from "./coach-team-context.service";

export interface CoachPlayAssignment {
  position: string;
  playerName?: string;
  route?: string;
  instructions: string[];
  isPrimary?: boolean;
}

export interface CoachPlaybookPlay {
  id: string;
  name: string;
  formation: string;
  situation: string;
  type: "offense" | "defense" | "special";
  assignments: CoachPlayAssignment[];
  coachNotes: string;
  teamMemorized: number;
  status: "active" | "archived";
  createdAt: string;
}

export interface CoachPlayMemorizationStatus {
  playerId: string;
  playerName: string;
  status: "memorized" | "needs-review" | "not-started";
  memorizedAt?: string;
  quizScore?: number;
  lastStudied?: string;
}

export interface SaveCoachPlayInput {
  id?: string;
  name: string;
  formation: string;
  situation: string;
  type: "offense" | "defense" | "special";
  assignments: CoachPlayAssignment[];
  coachNotes: string;
  teamMemorized?: number;
  status?: "active" | "archived";
}

type ServiceError = { message?: string } | null;

@Injectable({
  providedIn: "root",
})
export class CoachPlaybookDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly coachTeamContextService = inject(CoachTeamContextService);
  private readonly logger = inject(LoggerService);

  async loadPlaybook(): Promise<{
    plays: CoachPlaybookPlay[];
    memorization: CoachPlayMemorizationStatus[];
    error: ServiceError;
  }> {
    try {
      const [{ teamId }, playersResult] = await Promise.all([
        this.coachTeamContextService.resolveCoachContext(),
        this.coachTeamContextService.listTeamPlayers(),
      ]);

      if (playersResult.error) {
        return {
          plays: [],
          memorization: [],
          error: playersResult.error,
        };
      }

      const { data, error } = await this.supabaseService.client
        .from("coach_playbook_plays")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) {
        return {
          plays: [],
          memorization: [],
          error,
        };
      }

      return {
        plays: Array.isArray(data) ? data.map((row) => this.mapPlay(row)) : [],
        memorization: this.mapMemorization(playersResult.data),
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlaybookDataService] Failed to load playbook",
        toLogContext(error),
      );
      return {
        plays: [],
        memorization: [],
        error: {
          message:
            error instanceof Error ? error.message : "Failed to load playbook",
        },
      };
    }
  }

  async savePlay(input: SaveCoachPlayInput): Promise<{
    data: CoachPlaybookPlay | null;
    error: ServiceError;
  }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();
      const payload = {
        team_id: teamId,
        created_by: userId,
        name: input.name.trim(),
        formation: input.formation,
        situation: input.situation,
        type: input.type,
        assignments: input.assignments,
        coach_notes: input.coachNotes.trim() || null,
        team_memorized: input.teamMemorized ?? 0,
        status: input.status ?? "active",
        updated_at: new Date().toISOString(),
      };

      if (input.id) {
        const { data, error } = await this.supabaseService.client
          .from("coach_playbook_plays")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();

        return {
          data: data ? this.mapPlay(data) : null,
          error,
        };
      }

      const { data, error } = await this.supabaseService.client
        .from("coach_playbook_plays")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return {
        data: data ? this.mapPlay(data) : null,
        error,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlaybookDataService] Failed to save play",
        toLogContext(error),
      );
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to save play",
        },
      };
    }
  }

  async archivePlay(playId: string): Promise<{ error: ServiceError }> {
    const { error } = await this.supabaseService.client
      .from("coach_playbook_plays")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", playId);

    return { error };
  }

  private mapMemorization(
    players: CoachTeamPlayerSummary[],
  ): CoachPlayMemorizationStatus[] {
    return players.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      status: "not-started",
    }));
  }

  private mapPlay(row: Record<string, unknown>): CoachPlaybookPlay {
    return {
      id: this.toString(row["id"]),
      name: this.toString(row["name"]),
      formation: this.toString(row["formation"]),
      situation: this.toString(row["situation"]),
      type: this.toType(row["type"]),
      assignments: this.toAssignments(row["assignments"]),
      coachNotes: this.toString(row["coach_notes"]),
      teamMemorized: this.toNumber(row["team_memorized"]),
      status: this.toStatus(row["status"]),
      createdAt: this.toString(row["created_at"]),
    };
  }

  private toAssignments(value: unknown): CoachPlayAssignment[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((assignment): assignment is Record<string, unknown> =>
        typeof assignment === "object" && assignment !== null,
      )
      .map((assignment) => ({
        position: this.toString(assignment["position"]),
        playerName: this.toOptionalString(assignment["playerName"]),
        route: this.toOptionalString(assignment["route"]),
        instructions: Array.isArray(assignment["instructions"])
          ? assignment["instructions"]
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        isPrimary:
          typeof assignment["isPrimary"] === "boolean"
            ? assignment["isPrimary"]
            : undefined,
      }));
  }

  private toType(value: unknown): "offense" | "defense" | "special" {
    return value === "defense" || value === "special" ? value : "offense";
  }

  private toStatus(value: unknown): "active" | "archived" {
    return value === "archived" ? "archived" : "active";
  }

  private toString(value: unknown): string {
    return typeof value === "string" ? value : "";
  }

  private toOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  private toNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }
}
