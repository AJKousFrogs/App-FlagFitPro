import { Injectable, inject } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";

export type PracticePlanStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "draft"
  | "template";

export type PracticePlanActivityType =
  | "warmup"
  | "position"
  | "offense"
  | "defense"
  | "scrimmage"
  | "cooldown"
  | "conditioning"
  | "film";

export interface PracticePlanActivity {
  id: string;
  startTime: string;
  type: PracticePlanActivityType;
  title: string;
  durationMinutes: number;
  details: string[];
  plays?: string[];
  keyPoints?: string[];
  completed?: boolean;
}

export interface PracticePlanEquipment {
  name: string;
  quantity: number;
  checked: boolean;
}

export interface PracticePlanAttendance {
  confirmed: number;
  pending: number;
  total: number;
}

export interface CoachPracticePlanRecord {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location: string;
  focus: string;
  equipment: PracticePlanEquipment[];
  activities: PracticePlanActivity[];
  coachNotes: string;
  attendance: PracticePlanAttendance;
  status: PracticePlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SavePracticePlanInput {
  id?: string | null;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location: string;
  focus: string;
  equipment: PracticePlanEquipment[];
  activities: PracticePlanActivity[];
  coachNotes: string;
  attendance: PracticePlanAttendance;
  status: PracticePlanStatus;
}

type ServiceError = { message?: string } | null;

@Injectable({
  providedIn: "root",
})
export class CoachPlanningDataService {
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  async listPracticePlans(): Promise<{
    data: CoachPracticePlanRecord[];
    error: ServiceError;
  }> {
    try {
      const { teamId } = await this.resolveCoachContext();

      const { data, error } = await this.supabaseService.client
        .from("practice_plans")
        .select("*")
        .eq("team_id", teamId)
        .order("practice_date", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        return { data: [], error };
      }

      return {
        data: Array.isArray(data)
          ? data.map((row) => this.mapPracticePlanRow(row))
          : [],
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlanningDataService] Failed to list practice plans",
        toLogContext(error),
      );
      return {
        data: [],
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load practice plans",
        },
      };
    }
  }

  async savePracticePlan(input: SavePracticePlanInput): Promise<{
    data: CoachPracticePlanRecord | null;
    error: ServiceError;
  }> {
    try {
      const { userId, teamId } = await this.resolveCoachContext();
      const payload = {
        team_id: teamId,
        created_by: userId,
        title: input.title.trim(),
        practice_date: input.date,
        start_time: input.startTime,
        end_time: input.endTime,
        duration_minutes: input.durationMinutes,
        location: input.location.trim(),
        focus: input.focus.trim() || null,
        equipment: input.equipment,
        activities: input.activities,
        coach_notes: input.coachNotes.trim() || null,
        attendance: input.attendance,
        status: input.status,
        updated_at: new Date().toISOString(),
      };

      if (input.id) {
        const { data, error } = await this.supabaseService.client
          .from("practice_plans")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();

        return {
          data: data ? this.mapPracticePlanRow(data) : null,
          error,
        };
      }

      const { data, error } = await this.supabaseService.client
        .from("practice_plans")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return {
        data: data ? this.mapPracticePlanRow(data) : null,
        error,
      };
    } catch (error) {
      this.logger.error(
        "[CoachPlanningDataService] Failed to save practice plan",
        toLogContext(error),
      );
      return {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save practice plan",
        },
      };
    }
  }

  async updatePracticePlanStatus(
    practicePlanId: string,
    status: PracticePlanStatus,
  ): Promise<{ error: ServiceError }> {
    const { error } = await this.supabaseService.client
      .from("practice_plans")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", practicePlanId);

    return { error };
  }

  private async resolveCoachContext(): Promise<{
    userId: string;
    teamId: string;
  }> {
    const user = this.authService.getUser();
    if (!user?.id) {
      throw new Error("You must be logged in to manage practice plans.");
    }

    let teamId = this.teamMembershipService.teamId();
    if (!teamId) {
      const membership = await this.teamMembershipService.loadMembership();
      teamId = membership?.teamId ?? null;
    }

    if (!teamId) {
      throw new Error("A team membership is required to manage practice plans.");
    }

    return {
      userId: user.id,
      teamId,
    };
  }

  private mapPracticePlanRow(
    row: Record<string, unknown>,
  ): CoachPracticePlanRecord {
    return {
      id: String(row["id"]),
      title: this.toString(row["title"]),
      date: this.toString(row["practice_date"]),
      startTime: this.toString(row["start_time"]),
      endTime: this.toString(row["end_time"]),
      durationMinutes: this.toNumber(row["duration_minutes"]),
      location: this.toString(row["location"]),
      focus: this.toString(row["focus"]),
      equipment: this.toEquipmentList(row["equipment"]),
      activities: this.toActivityList(row["activities"]),
      coachNotes: this.toString(row["coach_notes"]),
      attendance: this.toAttendance(row["attendance"]),
      status: this.toStatus(row["status"]),
      createdAt: this.toString(row["created_at"]),
      updatedAt: this.toString(row["updated_at"]),
    };
  }

  private toString(value: unknown): string {
    return typeof value === "string" ? value : "";
  }

  private toNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }

  private toStatus(value: unknown): PracticePlanStatus {
    if (
      value === "scheduled" ||
      value === "in-progress" ||
      value === "completed" ||
      value === "cancelled" ||
      value === "draft" ||
      value === "template"
    ) {
      return value;
    }

    return "scheduled";
  }

  private toEquipmentList(value: unknown): PracticePlanEquipment[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const name = typeof record["name"] === "string" ? record["name"] : "";
        if (!name) {
          return null;
        }

        return {
          name,
          quantity:
            typeof record["quantity"] === "number" &&
            Number.isFinite(record["quantity"])
              ? record["quantity"]
              : 0,
          checked: record["checked"] === true,
        } satisfies PracticePlanEquipment;
      })
      .filter((item): item is PracticePlanEquipment => item !== null);
  }

  private toActivityList(value: unknown): PracticePlanActivity[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const activities: PracticePlanActivity[] = [];

    for (const item of value) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const record = item as Record<string, unknown>;
      const id = typeof record["id"] === "string" ? record["id"] : "";
      const title = typeof record["title"] === "string" ? record["title"] : "";
      if (!id || !title) {
        continue;
      }

      activities.push({
        id,
        startTime:
          typeof record["startTime"] === "string" ? record["startTime"] : "",
        type: this.toActivityType(record["type"]),
        title,
        durationMinutes:
          typeof record["durationMinutes"] === "number" &&
          Number.isFinite(record["durationMinutes"])
            ? record["durationMinutes"]
            : 0,
        details: Array.isArray(record["details"])
          ? record["details"].filter(
              (detail): detail is string => typeof detail === "string",
            )
          : [],
        plays: Array.isArray(record["plays"])
          ? record["plays"].filter(
              (play): play is string => typeof play === "string",
            )
          : undefined,
        keyPoints: Array.isArray(record["keyPoints"])
          ? record["keyPoints"].filter(
              (point): point is string => typeof point === "string",
            )
          : undefined,
        completed: record["completed"] === true,
      });
    }

    return activities;
  }

  private toAttendance(value: unknown): PracticePlanAttendance {
    if (!value || typeof value !== "object") {
      return { confirmed: 0, pending: 0, total: 0 };
    }

    const record = value as Record<string, unknown>;
    return {
      confirmed: this.toNumber(record["confirmed"]),
      pending: this.toNumber(record["pending"]),
      total: this.toNumber(record["total"]),
    };
  }

  private toActivityType(value: unknown): PracticePlanActivityType {
    if (
      value === "warmup" ||
      value === "position" ||
      value === "offense" ||
      value === "defense" ||
      value === "scrimmage" ||
      value === "cooldown" ||
      value === "conditioning" ||
      value === "film"
    ) {
      return value;
    }

    return "position";
  }
}
