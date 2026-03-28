import { Injectable, inject } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { CoachTeamContextService } from "./coach-team-context.service";

export interface CoachFilmSession {
  id: string;
  title: string;
  type: "game" | "practice" | "scouting" | "training";
  duration: string;
  uploadDate: string;
  thumbnailUrl?: string;
  videoUrl: string;
  tagCount: number;
  assignment: string;
  dueDate: string;
  watchedCount: number;
  totalAssigned: number;
  notWatched: string[];
}

export interface CoachFilmPlayer {
  id: string;
  name: string;
  number: string;
}

export interface CoachFilmPlayOption {
  id: string;
  name: string;
}

export interface SaveCoachFilmSessionInput {
  source: "url" | "file";
  url: string;
  title: string;
  type: "game" | "practice" | "scouting" | "training";
  description: string;
}

export interface SaveCoachFilmTagInput {
  sessionId: string;
  timestamp: string;
  type: "positive" | "correction" | "teaching" | "opponent";
  target: "everyone" | "specific";
  playerIds: string[];
  playId: string;
  comment: string;
}

type ServiceError = { message?: string } | null;

@Injectable({
  providedIn: "root",
})
export class CoachFilmRoomDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly coachTeamContextService = inject(CoachTeamContextService);
  private readonly logger = inject(LoggerService);

  async loadFilmRoom(): Promise<{
    sessions: CoachFilmSession[];
    players: CoachFilmPlayer[];
    plays: CoachFilmPlayOption[];
    error: ServiceError;
  }> {
    try {
      const [{ teamId }, playersResult] = await Promise.all([
        this.coachTeamContextService.resolveCoachContext(),
        this.coachTeamContextService.listTeamPlayers(),
      ]);

      if (playersResult.error) {
        return {
          sessions: [],
          players: [],
          plays: [],
          error: playersResult.error,
        };
      }

      const [sessionsQuery, playsQuery] = await Promise.all([
        this.supabaseService.client
          .from("coach_film_sessions")
          .select("*")
          .eq("team_id", teamId)
          .order("upload_date", { ascending: false })
          .order("created_at", { ascending: false }),
        this.supabaseService.client
          .from("coach_playbook_plays")
          .select("id, name")
          .eq("team_id", teamId)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ]);

      const firstError = sessionsQuery.error ?? playsQuery.error;
      if (firstError) {
        return {
          sessions: [],
          players: [],
          plays: [],
          error: firstError,
        };
      }

      return {
        sessions: Array.isArray(sessionsQuery.data)
          ? sessionsQuery.data.map((row) => this.mapSession(row))
          : [],
        players: playersResult.data.map((player) => ({
          id: player.id,
          name: player.name,
          number: player.number,
        })),
        plays: Array.isArray(playsQuery.data)
          ? playsQuery.data.map((row) => ({
              id: this.toString(row["id"]),
              name: this.toString(row["name"]),
            }))
          : [],
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[CoachFilmRoomDataService] Failed to load film room",
        toLogContext(error),
      );
      return {
        sessions: [],
        players: [],
        plays: [],
        error: {
          message:
            error instanceof Error ? error.message : "Failed to load film room",
        },
      };
    }
  }

  async saveSession(input: SaveCoachFilmSessionInput): Promise<{
    data: CoachFilmSession | null;
    error: ServiceError;
  }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();
      const videoUrl =
        input.source === "url" && input.url.trim()
          ? input.url.trim()
          : `pending-upload://${Date.now()}`;

      const { data, error } = await this.supabaseService.client
        .from("coach_film_sessions")
        .insert({
          team_id: teamId,
          created_by: userId,
          title: input.title.trim(),
          film_type: input.type,
          video_url: videoUrl,
          description: input.description.trim() || null,
          upload_date: new Date().toISOString().slice(0, 10),
          duration: "",
          assignment: "",
          due_date: null,
          watched_count: 0,
          total_assigned: 0,
          not_watched: [],
          tag_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return {
        data: data ? this.mapSession(data) : null,
        error,
      };
    } catch (error) {
      this.logger.error(
        "[CoachFilmRoomDataService] Failed to save film session",
        toLogContext(error),
      );
      return {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save film session",
        },
      };
    }
  }

  async saveTag(input: SaveCoachFilmTagInput): Promise<{
    error: ServiceError;
  }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();
      const { error } = await this.supabaseService.client
        .from("coach_film_tags")
        .insert({
          session_id: input.sessionId,
          team_id: teamId,
          coach_id: userId,
          timestamp_label: input.timestamp,
          timestamp_seconds: this.toTimestampSeconds(input.timestamp),
          tag_type: input.type,
          target: input.target,
          player_ids: input.playerIds,
          play_id: input.playId || null,
          comment: input.comment.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        return { error };
      }

      const { data: sessionRow, error: sessionError } =
        await this.supabaseService.client
          .from("coach_film_sessions")
          .select("tag_count")
          .eq("id", input.sessionId)
          .maybeSingle();

      if (sessionError) {
        return { error: sessionError };
      }

      const currentCount =
        typeof sessionRow?.["tag_count"] === "number"
          ? sessionRow["tag_count"]
          : 0;
      const { error: updateError } = await this.supabaseService.client
        .from("coach_film_sessions")
        .update({
          tag_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.sessionId);

      if (updateError) {
        return { error: updateError };
      }

      return { error: null };
    } catch (error) {
      this.logger.error(
        "[CoachFilmRoomDataService] Failed to save film tag",
        toLogContext(error),
      );
      return {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to save film tag",
        },
      };
    }
  }

  private mapSession(row: Record<string, unknown>): CoachFilmSession {
    return {
      id: this.toString(row["id"]),
      title: this.toString(row["title"]),
      type: this.toType(row["film_type"]),
      duration: this.toString(row["duration"]),
      uploadDate: this.toString(row["upload_date"]),
      thumbnailUrl: this.toOptionalString(row["thumbnail_url"]),
      videoUrl: this.toString(row["video_url"]),
      tagCount: this.toNumber(row["tag_count"]),
      assignment: this.toString(row["assignment"]),
      dueDate: this.toString(row["due_date"]),
      watchedCount: this.toNumber(row["watched_count"]),
      totalAssigned: this.toNumber(row["total_assigned"]),
      notWatched: Array.isArray(row["not_watched"])
        ? row["not_watched"].filter(
            (entry): entry is string => typeof entry === "string",
          )
        : [],
    };
  }

  private toTimestampSeconds(value: string): number {
    const parts = value
      .split(":")
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part));

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
  }

  private toType(value: unknown): "game" | "practice" | "scouting" | "training" {
    return value === "practice" || value === "scouting" || value === "training"
      ? value
      : "game";
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
