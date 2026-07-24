import { getDateKey } from "../shared/utils/date.utils";

export interface CheckInCoverageCell {
  date: string;
  status: "done" | "partial" | "miss" | "today" | "future";
  isToday: boolean;
}

export interface CheckInCoverageResult {
  cells: CheckInCoverageCell[];
  pct: number;
  missed: number;
  partial: number;
  streak: number;
}

interface WellnessRow {
  date?: string | null;
  sleep?: number | null;
  energy?: number | null;
  stress?: number | null;
  soreness?: number | null;
}

/**
 * The 28-day, Monday-first check-in coverage grid. Pure + time-injected so
 * it's unit-testable, and so the day-keying bug (below) can't regress silently.
 *
 * Every cell key MUST be the athlete's LOCAL calendar day (`getDateKey`, which
 * reads local Y/M/D), never `toISOString()`. The grid itself is built from
 * local-time Date arithmetic (`setHours`, `getDay`) — for any positive-UTC-offset
 * athlete (e.g. Ljubljana, UTC+2 in summer), `toISOString()` converts local
 * midnight back to 22:00 UTC the PREVIOUS day, which silently shifts every
 * cell's day-key back by one. That made today's own just-logged check-in never
 * match today's cell (audit 2026-07-24 — reported as "I logged more than the
 * grid shows").
 */
export function computeCheckInCoverage(
  scoredDays: readonly string[],
  wellnessRows: readonly WellnessRow[],
  now: Date,
): CheckInCoverageResult {
  // A scored day is unambiguously a full check-in.
  const scored = new Set(scoredDays);
  // The canonical wellness log gives an honest "partial": a check-in row that
  // exists but is missing a core driver (sleep / energy / stress / soreness).
  // This is the row's OWN gap — nothing is fabricated (the card's promise).
  const complete = new Set<string>();
  const partialDays = new Set<string>();
  for (const w of wellnessRows) {
    const day = w.date;
    if (!day) continue;
    const full =
      w.sleep != null &&
      w.energy != null &&
      w.stress != null &&
      w.soreness != null;
    if (full) complete.add(day);
    else partialDays.add(day);
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  // Start 27 days back, then walk back to the Monday of that week.
  const start = new Date(today);
  start.setDate(start.getDate() - 27);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const cells: CheckInCoverageCell[] = [];
  let done = 0;
  let partial = 0;
  let missed = 0;
  let elapsed = 0;
  const cur = new Date(start);
  while (cur <= today || cells.length % 7 !== 0) {
    const iso = getDateKey(cur);
    const isToday = cur.getTime() === today.getTime();
    const isFuture = cur > today;
    const status: CheckInCoverageCell["status"] = isFuture
      ? "future"
      : scored.has(iso) || complete.has(iso)
        ? "done"
        : partialDays.has(iso)
          ? "partial"
          : "miss";
    cells.push({ date: iso, status, isToday });
    if (!isFuture) {
      elapsed++;
      if (status === "done") done++;
      else if (status === "partial") partial++;
      else missed++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  // streak: consecutive full check-ins ending today (partial/miss breaks it).
  let streak = 0;
  for (let i = cells.length - 1; i >= 0; i--) {
    if (cells[i].status === "future") continue;
    if (cells[i].status === "done") streak++;
    else break;
  }

  // "Coverage" = days you checked in at all (full or partial); partial + missed
  // are broken out separately below it.
  const pct = elapsed ? Math.round(((done + partial) / elapsed) * 100) : 0;
  return { cells, pct, missed, partial, streak };
}
