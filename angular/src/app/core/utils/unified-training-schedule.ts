import type { SupabaseClient } from "@supabase/supabase-js";
import { TrainingSessionRecord } from "../models/api.models";
import {
  SessionType,
  WeeklyScheduleDay,
  Workout,
} from "../models/training.models";
import { normalizeTemplateDayOfWeekToWeekIndex } from "../../shared/utils/training-template.utils";

interface PlayerProgramRecord {
  program_id: string;
}

interface TrainingPhaseRecord {
  id: string;
}

interface TrainingWeekRecord {
  id: string;
}

interface TrainingSessionTemplateRecord {
  id: string;
  day_of_week: number;
  session_name: string;
  session_type?: string;
  duration_minutes?: number;
  notes?: string;
  warm_up_protocol?: string;
  session_order?: number;
}

interface LoadWeeklyScheduleOptions {
  supabaseClient: SupabaseClient;
  userId: string;
  today: string;
  weekStart: Date;
  onInfo?: (message: string) => void;
  onError?: (message: string, error: unknown) => void;
}

interface LoadTrainingSessionsOptions {
  supabaseClient: SupabaseClient;
  userId: string;
  startDate: string;
  onError?: (message: string, error: unknown) => void;
}

interface LoadAvailableWorkoutsOptions {
  supabaseClient: SupabaseClient;
  userId: string;
  today: string;
  toWorkout: (session: TrainingSessionRecord) => Workout;
  onInfo?: (message: string) => void;
  onError?: (message: string, error: unknown) => void;
}

export function getEmptyWeekSchedule(weekStart: Date): WeeklyScheduleDay[] {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return days.map((name, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return {
      name,
      date,
      sessions: [],
      isToday: date.toDateString() === new Date().toDateString(),
    };
  });
}

export function mapSessionTypeToScheduleType(
  sessionType: string,
): SessionType | undefined {
  const lower = sessionType.toLowerCase();
  if (lower.includes("recovery") || lower.includes("rest")) return "recovery";
  if (lower.includes("game") || lower.includes("match")) return "game";
  if (lower.includes("speed")) return "speed";
  if (lower.includes("strength")) return "strength";
  if (lower.includes("skills")) return "skills";
  if (lower.includes("conditioning")) return "conditioning";
  if (lower.includes("technique")) return "technique";
  if (lower.includes("team_practice") || lower.includes("team practice")) {
    return "team_practice";
  }
  if (lower.includes("scrimmage")) return "scrimmage";
  if (lower.includes("mixed")) return "mixed";
  return undefined;
}

export function transformSessionTemplatesToWeeklySchedule(
  templates: TrainingSessionTemplateRecord[],
  weekStart: Date,
): WeeklyScheduleDay[] {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return days.map((name, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const daySessions = templates.filter(
      (template) =>
        normalizeTemplateDayOfWeekToWeekIndex(template.day_of_week) === i,
    );

    return {
      name,
      date,
      sessions: daySessions.map((session) => ({
        time: "TBD",
        title: session.session_name || "Training Session",
        type: mapSessionTypeToScheduleType(
          session.session_type || "training",
        ),
        duration: session.duration_minutes || 60,
        description: session.notes || session.warm_up_protocol || "",
      })),
      isToday: date.toDateString() === new Date().toDateString(),
    };
  });
}

export async function loadTrainingSessionsSnapshot({
  supabaseClient,
  userId,
  startDate,
  onError,
}: LoadTrainingSessionsOptions): Promise<TrainingSessionRecord[]> {
  const { data, error } = await supabaseClient
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("session_date", startDate)
    .order("session_date", { ascending: false });

  if (error) {
    onError?.("Failed to load training sessions", error);
    return [];
  }

  return (data as TrainingSessionRecord[]) || [];
}

export async function loadWeeklyScheduleSnapshot({
  supabaseClient,
  userId,
  today,
  weekStart,
  onInfo,
  onError,
}: LoadWeeklyScheduleOptions): Promise<WeeklyScheduleDay[]> {
  try {
    const { data: playerProgram } = await supabaseClient
      .from("player_programs")
      .select("*")
      .eq("player_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!(playerProgram as PlayerProgramRecord | null)?.program_id) {
      onInfo?.("No active program assigned, returning empty schedule");
      return getEmptyWeekSchedule(weekStart);
    }

    const programId = (playerProgram as PlayerProgramRecord).program_id;

    const { data: currentPhase } = await supabaseClient
      .from("training_phases")
      .select("*")
      .eq("program_id", programId)
      .lte("start_date", today)
      .gte("end_date", today)
      .single();

    if (!(currentPhase as TrainingPhaseRecord | null)?.id) {
      onInfo?.("No active phase found for current date");
      return getEmptyWeekSchedule(weekStart);
    }

    const { data: currentWeek } = await supabaseClient
      .from("training_weeks")
      .select("*")
      .eq("phase_id", (currentPhase as TrainingPhaseRecord).id)
      .lte("start_date", today)
      .gte("end_date", today)
      .single();

    if (!(currentWeek as TrainingWeekRecord | null)?.id) {
      onInfo?.("No active week found for current date");
      return getEmptyWeekSchedule(weekStart);
    }

    const { data: sessionTemplates } = await supabaseClient
      .from("training_session_templates")
      .select("*")
      .eq("week_id", (currentWeek as TrainingWeekRecord).id)
      .order("day_of_week", { ascending: true })
      .order("session_order", { ascending: true });

    if (!sessionTemplates || sessionTemplates.length === 0) {
      onInfo?.("No session templates found for current week");
      return getEmptyWeekSchedule(weekStart);
    }

    return transformSessionTemplatesToWeeklySchedule(
      sessionTemplates as TrainingSessionTemplateRecord[],
      weekStart,
    );
  } catch (error) {
    onError?.("Error loading weekly schedule", error);
    return getEmptyWeekSchedule(weekStart);
  }
}

export async function loadAvailableWorkoutsSnapshot({
  supabaseClient,
  userId,
  today,
  toWorkout,
  onInfo,
  onError,
}: LoadAvailableWorkoutsOptions): Promise<Workout[]> {
  const { data, error } = await supabaseClient
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("session_date", today)
    .eq("status", "scheduled")
    .order("created_at", { ascending: true });

  if (error) {
    onError?.("Failed to load available workouts", error);
    return [];
  }

  if (!data || data.length === 0) {
    onInfo?.("No scheduled workouts for today");
    return [];
  }

  return (data as TrainingSessionRecord[]).map((workout) => toWorkout(workout));
}
