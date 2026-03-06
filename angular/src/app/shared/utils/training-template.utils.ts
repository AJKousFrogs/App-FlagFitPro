function toLocalDate(value: Date | string): Date {
  if (value instanceof Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
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
