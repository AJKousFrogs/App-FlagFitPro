import { COLORS } from "../constants/app.constants";
import { TrainingSessionRecord } from "../models/api.models";
import { WeeklyScheduleDay, Workout } from "../models/training.models";

export function getStartOfTrainingWeek(referenceDate = new Date()): Date {
  const now = new Date(referenceDate);
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function isDateInCurrentTrainingWeek(
  date: Date,
  referenceDate = new Date(),
): boolean {
  const start = getStartOfTrainingWeek(referenceDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return date >= start && date <= end;
}

export function transformSessionsToWeeklySchedule(
  sessions: TrainingSessionRecord[],
  referenceDate = new Date(),
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
  const weekStart = getStartOfTrainingWeek(referenceDate);

  return days.map((name, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);

    const daySessions = sessions.filter((session) => {
      const dateStr = session.session_date || session.date;
      if (!dateStr) return false;
      const sessionDate = new Date(dateStr);
      return (
        !Number.isNaN(sessionDate.getTime()) &&
        sessionDate.toDateString() === date.toDateString()
      );
    });

    return {
      name,
      date,
      sessions: daySessions.map((session) => ({
        time: session.scheduled_time || "TBD",
        title: session.title || "Session",
        type: session.session_type as WeeklyScheduleDay["sessions"][0]["type"],
        duration:
          typeof session.duration === "number" ? session.duration : undefined,
      })),
      isToday: date.toDateString() === new Date(referenceDate).toDateString(),
    };
  });
}

/**
 * Combines program template days with sessions logged this week so the workspace
 * shows real activity even when templates are missing or incomplete.
 */
export function mergeWeeklyScheduleWithLoggedSessions(
  programSchedule: WeeklyScheduleDay[],
  sessions: TrainingSessionRecord[],
  referenceDate = new Date(),
): WeeklyScheduleDay[] {
  const loggedWeek = transformSessionsToWeeklySchedule(sessions, referenceDate);
  if (!programSchedule.length) {
    return loggedWeek;
  }

  return programSchedule.map((day, index) => {
    const loggedDay = loggedWeek[index];
    const programSessions = day.sessions;
    const loggedSessions = loggedDay?.sessions ?? [];

    if (programSessions.length > 0) {
      const merged = [...programSessions];
      for (const ls of loggedSessions) {
        if (
          !merged.some(
            (m) => m.title.toLowerCase() === ls.title.toLowerCase(),
          )
        ) {
          merged.push(ls);
        }
      }
      return {
        ...day,
        sessions: merged,
        isToday: loggedDay?.isToday ?? day.isToday,
      };
    }

    if (loggedSessions.length > 0) {
      return {
        ...day,
        sessions: loggedSessions,
        isToday: loggedDay?.isToday ?? day.isToday,
      };
    }

    return { ...day, isToday: loggedDay?.isToday ?? day.isToday };
  });
}

export function transformSessionRecordToWorkout(
  session: TrainingSessionRecord,
): Workout {
  return {
    id: session.id,
    type: session.session_type || "training",
    title: session.title || "Workout",
    description: session.description || "",
    duration: `${session.duration ?? 60} min`,
    intensity:
      (session.intensity ?? 5) > 6
        ? "high"
        : (session.intensity ?? 5) > 3
          ? "medium"
          : "low",
    location: session.location || "Gym",
    icon: "pi-bolt",
    iconBg: COLORS.ERROR,
  };
}
