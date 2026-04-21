function toLocalDate(value: Date | string): Date {
  if (value instanceof Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/** Onboarding / user_preferences day labels → JS weekday (0 Sun … 6 Sat). */
export function practiceDayLabelsToSortedJsWeekdays(
  labels: string[],
): number[] {
  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const set = new Set<number>();
  for (const raw of labels) {
    const n = map[raw.trim().toLowerCase()];
    if (typeof n === "number") {
      set.add(n);
    }
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Program templates are stored on fixed weekdays; map each week’s ordered
 * sessions onto the user’s flag-football practice days from onboarding so
 * “Upcoming Sessions” reflects their chosen days and keeps distinct workouts.
 */
export interface ProgramTemplateLike {
  id: string;
  session_name?: string | null;
  session_type?: string | null;
  day_of_week?: number | null;
  session_order?: number | null;
  duration_minutes?: number | null;
  is_team_practice?: boolean | null;
  is_outdoor?: boolean | null;
  weather_sensitive?: boolean | null;
  training_weeks?: TrainingWeekLike | TrainingWeekLike[] | null;
}

interface TrainingWeekLike {
  start_date: string;
  end_date: string;
}

function weekDataFromTemplate(
  template: ProgramTemplateLike,
): TrainingWeekLike | null {
  const weeks = template.training_weeks;
  if (Array.isArray(weeks)) {
    return weeks[0] ?? null;
  }
  if (weeks && typeof weeks === "object" && "start_date" in weeks) {
    return weeks;
  }
  return null;
}

export interface MapProgramTemplatesResult {
  placed: {
    template: ProgramTemplateLike;
    sessionDate: Date;
  }[];
  /** Weeks where program had more sessions than the user has practice days (extras omitted). */
  weeksWhereSessionsWereTrimmed: number;
}

export function mapProgramTemplatesToUserPracticeDays(
  templates: ProgramTemplateLike[],
  practiceDayLabels: string[],
): MapProgramTemplatesResult {
  const practiceJsDays = practiceDayLabelsToSortedJsWeekdays(
    practiceDayLabels,
  );

  if (practiceJsDays.length === 0) {
    const placed = templates
      .map((template) => {
        const weekData = weekDataFromTemplate(template);
        if (!weekData?.start_date) {
          return null;
        }
        return {
          template,
          sessionDate: getTemplateSessionDateFromWeekRange({
            weekStart: weekData.start_date,
            weekEnd: weekData.end_date,
            dayOfWeek: template.day_of_week,
          }),
        };
      })
      .filter(
        (row): row is { template: ProgramTemplateLike; sessionDate: Date } =>
          row !== null,
      );

    return { placed, weeksWhereSessionsWereTrimmed: 0 };
  }

  const byWeek = new Map<string, ProgramTemplateLike[]>();
  for (const template of templates) {
    const weekData = weekDataFromTemplate(template);
    if (!weekData?.start_date) {
      continue;
    }
    const key = weekData.start_date;
    const arr = byWeek.get(key) ?? [];
    arr.push(template);
    byWeek.set(key, arr);
  }

  const result: { template: ProgramTemplateLike; sessionDate: Date }[] =
    [];
  let weeksWhereSessionsWereTrimmed = 0;

  for (const [, weekTemplates] of byWeek) {
    const sorted = [...weekTemplates].sort((a, b) => {
      const d = (a.day_of_week ?? 0) - (b.day_of_week ?? 0);
      if (d !== 0) {
        return d;
      }
      return (a.session_order ?? 0) - (b.session_order ?? 0);
    });

    const weekData = weekDataFromTemplate(sorted[0]);
    if (!weekData) {
      continue;
    }

    if (sorted.length > practiceJsDays.length) {
      weeksWhereSessionsWereTrimmed += 1;
    }

    const n = Math.min(sorted.length, practiceJsDays.length);
    for (let i = 0; i < n; i++) {
      const template = sorted[i];
      const jsDay = practiceJsDays[i];
      result.push({
        template,
        sessionDate: getTemplateSessionDateFromWeekRange({
          weekStart: weekData.start_date,
          weekEnd: weekData.end_date,
          dayOfWeek: jsDay,
        }),
      });
    }
  }

  return { placed: result, weeksWhereSessionsWereTrimmed };
}

export function normalizeTemplateDayOfWeekToWeekIndex(
  dayOfWeek: number | null | undefined,
): number {
  if (typeof dayOfWeek !== "number" || !Number.isFinite(dayOfWeek)) {
    return 0;
  }

  const safeDay = Math.trunc(dayOfWeek);
  if (safeDay < 0 || safeDay > 6) {
    return 0;
  }

  return safeDay === 0 ? 6 : safeDay - 1;
}

export function getTemplateSessionDateFromWeekRange(input: {
  weekStart: Date | string;
  weekEnd?: Date | string | null;
  dayOfWeek: number | null | undefined;
}): Date {
  const weekStart = toLocalDate(input.weekStart);
  const safeDay =
    typeof input.dayOfWeek === "number" && Number.isFinite(input.dayOfWeek)
      ? Math.trunc(input.dayOfWeek)
      : 1;

  if (input.weekEnd) {
    const weekEnd = toLocalDate(input.weekEnd);
    for (const cursor = new Date(weekStart); cursor <= weekEnd; cursor.setDate(cursor.getDate() + 1)) {
      if (cursor.getDay() === safeDay) {
        return new Date(cursor);
      }
    }
  }

  const fallbackDate = new Date(weekStart);
  fallbackDate.setDate(
    weekStart.getDate() + normalizeTemplateDayOfWeekToWeekIndex(safeDay),
  );
  return fallbackDate;
}
