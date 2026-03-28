import { Injectable, inject } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import {
  CoachTeamContextService,
  CoachTeamPlayerSummary,
} from "./coach-team-context.service";

export interface CoachDevelopmentPlayer {
  id: string;
  name: string;
  position: string;
  overallProgress: number;
  goalsCompleted: number;
  goalsTotal: number;
  improvementThisMonth: number;
  focusArea: string;
  achievements: number;
}

export interface CoachDevelopmentGoal {
  id: string;
  playerId: string;
  category: "physical" | "skill" | "stats" | "compliance";
  metric: string;
  currentValue: string;
  targetValue: string;
  startValue: string;
  dueDate: string;
  progress: number;
  status: "on-track" | "ahead" | "behind" | "completed";
  notes?: string;
}

export interface CoachDevelopmentNote {
  id: string;
  playerId: string;
  date: string;
  coachName: string;
  content: string;
}

export interface CoachSkillAssessment {
  playerId: string;
  skill: string;
  score: number;
  grade: string;
}

export interface SaveCoachDevelopmentGoalInput {
  id?: string;
  playerId: string;
  category: "physical" | "skill" | "stats" | "compliance";
  metric: string;
  currentValue: string;
  targetValue: string;
  startValue: string;
  dueDate: string | null;
  progress?: number;
  status?: "on-track" | "ahead" | "behind" | "completed";
  notes: string;
}

type ServiceError = { message?: string } | null;

@Injectable({
  providedIn: "root",
})
export class CoachPlayerDevelopmentDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly coachTeamContextService = inject(CoachTeamContextService);
  private readonly logger = inject(LoggerService);

  async loadPlayerDevelopment(): Promise<{
    players: CoachDevelopmentPlayer[];
    goals: CoachDevelopmentGoal[];
    notes: CoachDevelopmentNote[];
    assessments: CoachSkillAssessment[];
    error: ServiceError;
  }> {
    try {
      const [{ teamId }, playersResult] = await Promise.all([
        this.coachTeamContextService.resolveCoachContext(),
        this.coachTeamContextService.listTeamPlayers(),
      ]);

      if (playersResult.error) {
        return {
          players: [],
          goals: [],
          notes: [],
          assessments: [],
          error: playersResult.error,
        };
      }

      const [goalsQuery, notesQuery, assessmentsQuery] = await Promise.all([
        this.supabaseService.client
          .from("player_development_goals")
          .select("*")
          .eq("team_id", teamId)
          .order("created_at", { ascending: false }),
        this.supabaseService.client
          .from("player_development_notes")
          .select("*")
          .eq("team_id", teamId)
          .order("created_at", { ascending: false }),
        this.supabaseService.client
          .from("player_skill_assessments")
          .select("*")
          .eq("team_id", teamId)
          .order("updated_at", { ascending: false }),
      ]);

      const firstError =
        goalsQuery.error ?? notesQuery.error ?? assessmentsQuery.error;
      if (firstError) {
        return {
          players: [],
          goals: [],
          notes: [],
          assessments: [],
          error: firstError,
        };
      }

      const goals = Array.isArray(goalsQuery.data)
        ? goalsQuery.data.map((row) => this.mapGoal(row))
        : [];
      const notes = Array.isArray(notesQuery.data)
        ? notesQuery.data.map((row) => this.mapNote(row))
        : [];
      const assessments = Array.isArray(assessmentsQuery.data)
        ? assessmentsQuery.data.map((row) => this.mapAssessment(row))
        : [];

      return {
        players: this.buildPlayers(playersResult.data, goals, assessments),
        goals,
        notes,
        assessments,
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlayerDevelopmentDataService] Failed to load player development",
        toLogContext(error),
      );
      return {
        players: [],
        goals: [],
        notes: [],
        assessments: [],
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load player development",
        },
      };
    }
  }

  async saveGoal(input: SaveCoachDevelopmentGoalInput): Promise<{
    data: CoachDevelopmentGoal | null;
    error: ServiceError;
  }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();
      const payload = {
        team_id: teamId,
        player_id: input.playerId,
        coach_id: userId,
        category: input.category,
        metric: input.metric.trim(),
        current_value: input.currentValue.trim() || null,
        target_value: input.targetValue.trim(),
        start_value: input.startValue.trim() || null,
        due_date: input.dueDate || null,
        progress: input.progress ?? 0,
        status: input.status ?? "on-track",
        notes: input.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (input.id) {
        const { data, error } = await this.supabaseService.client
          .from("player_development_goals")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();

        return {
          data: data ? this.mapGoal(data) : null,
          error,
        };
      }

      const { data, error } = await this.supabaseService.client
        .from("player_development_goals")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return {
        data: data ? this.mapGoal(data) : null,
        error,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlayerDevelopmentDataService] Failed to save goal",
        toLogContext(error),
      );
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to save goal",
        },
      };
    }
  }

  async saveNote(input: {
    playerId: string;
    content: string;
  }): Promise<{ data: CoachDevelopmentNote | null; error: ServiceError }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();
      const { data, error } = await this.supabaseService.client
        .from("player_development_notes")
        .insert({
          team_id: teamId,
          player_id: input.playerId,
          coach_id: userId,
          content: input.content.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return {
        data: data ? this.mapNote(data) : null,
        error,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlayerDevelopmentDataService] Failed to save note",
        toLogContext(error),
      );
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to save note",
        },
      };
    }
  }

  async saveAssessment(input: {
    playerId: string;
    skill: string;
    score: number;
    grade: string;
  }): Promise<{ data: CoachSkillAssessment | null; error: ServiceError }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();
      const { data, error } = await this.supabaseService.client
        .from("player_skill_assessments")
        .upsert(
          {
            team_id: teamId,
            player_id: input.playerId,
            coach_id: userId,
            skill: input.skill.trim(),
            skill_key: input.skill.trim().toLowerCase(),
            score: input.score,
            grade: input.grade,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "team_id,player_id,skill_key",
          },
        )
        .select()
        .single();

      return {
        data: data ? this.mapAssessment(data) : null,
        error,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlayerDevelopmentDataService] Failed to save assessment",
        toLogContext(error),
      );
      return {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save assessment",
        },
      };
    }
  }

  private buildPlayers(
    players: CoachTeamPlayerSummary[],
    goals: CoachDevelopmentGoal[],
    assessments: CoachSkillAssessment[],
  ): CoachDevelopmentPlayer[] {
    return players.map((player) => {
      const playerGoals = goals.filter((goal) => goal.playerId === player.id);
      const completedGoals = playerGoals.filter(
        (goal) => goal.status === "completed",
      ).length;
      const totalGoals = playerGoals.length;
      const playerAssessments = assessments.filter(
        (assessment) => assessment.playerId === player.id,
      );
      const averageAssessment =
        playerAssessments.length > 0
          ? Math.round(
              playerAssessments.reduce(
                (sum, assessment) => sum + assessment.score,
                0,
              ) / playerAssessments.length,
            )
          : 0;
      const goalProgress =
        totalGoals > 0
          ? Math.round(
              playerGoals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals,
            )
          : 0;

      return {
        id: player.id,
        name: player.name,
        position: player.position,
        overallProgress:
          totalGoals > 0 || averageAssessment > 0
            ? Math.round((goalProgress + averageAssessment) / 2)
            : 0,
        goalsCompleted: completedGoals,
        goalsTotal: totalGoals,
        improvementThisMonth: 0,
        focusArea: playerGoals[0]?.metric || player.position,
        achievements: playerAssessments.filter((assessment) => assessment.score >= 90)
          .length,
      };
    });
  }

  private mapGoal(row: Record<string, unknown>): CoachDevelopmentGoal {
    return {
      id: this.toString(row["id"]),
      playerId: this.toString(row["player_id"]),
      category: this.toCategory(row["category"]),
      metric: this.toString(row["metric"]),
      currentValue: this.toString(row["current_value"]),
      targetValue: this.toString(row["target_value"]),
      startValue: this.toString(row["start_value"]),
      dueDate: this.formatDate(row["due_date"]),
      progress: this.toNumber(row["progress"]),
      status: this.toStatus(row["status"]),
      notes: this.toOptionalString(row["notes"]),
    };
  }

  private mapNote(row: Record<string, unknown>): CoachDevelopmentNote {
    return {
      id: this.toString(row["id"]),
      playerId: this.toString(row["player_id"]),
      date: this.formatDisplayDate(this.toString(row["created_at"])),
      coachName: "Coaching Staff",
      content: this.toString(row["content"]),
    };
  }

  private mapAssessment(row: Record<string, unknown>): CoachSkillAssessment {
    return {
      playerId: this.toString(row["player_id"]),
      skill: this.toString(row["skill"]),
      score: this.toNumber(row["score"]),
      grade: this.toString(row["grade"]),
    };
  }

  private formatDate(value: unknown): string {
    return typeof value === "string" ? value : "";
  }

  private formatDisplayDate(value: string): string {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  private toCategory(
    value: unknown,
  ): "physical" | "skill" | "stats" | "compliance" {
    return value === "skill" || value === "stats" || value === "compliance"
      ? value
      : "physical";
  }

  private toStatus(
    value: unknown,
  ): "on-track" | "ahead" | "behind" | "completed" {
    return value === "ahead" || value === "behind" || value === "completed"
      ? value
      : "on-track";
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
