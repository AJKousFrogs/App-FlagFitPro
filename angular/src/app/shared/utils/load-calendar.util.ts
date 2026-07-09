/**
 * Load-calendar grid builder (pure, testable). Turns a sparse daily-load series
 * (`{ date, load }[]`, from `/api/daily-load`) into a Monday-first week grid the
 * `app-load-calendar` heatmap renders. Colour `level` is RELATIVE to the window
 * max — a purely visual "when was load concentrated" ramp, deliberately NOT an
 * absolute AU→risk threshold (no injury claim; the raw AU rides on each cell).
 */

export interface LoadDay {
  date: string; // YYYY-MM-DD
  load: number;
}

export interface LoadCell {
  date: string;
  load: number;
  /** 0 = rest/no session; 1..4 = relative intensity ramp. */
  level: 0 | 1 | 2 | 3 | 4;
  /** false for pad days outside the requested window (render faded). */
  inRange: boolean;
}

export interface LoadCalendar {
  weeks: LoadCell[][]; // rows of 7, Monday..Sunday
  maxLoad: number;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight, calendar-day exact
}

/** Monday = 0 … Sunday = 6 (JS getDay is Sunday = 0). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function levelFor(load: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (load <= 0 || max <= 0) {
    return 0;
  }
  const r = load / max;
  if (r <= 0.25) {
    return 1;
  }
  if (r <= 0.5) {
    return 2;
  }
  if (r <= 0.75) {
    return 3;
  }
  return 4;
}

export function buildLoadCalendar(
  series: LoadDay[],
  endDate: string,
  days: number,
  maxLoad?: number,
): LoadCalendar {
  const loadByDate = new Map(series.map((p) => [p.date, p.load]));
  const max =
    maxLoad && maxLoad > 0
      ? maxLoad
      : series.reduce((m, p) => Math.max(m, p.load), 0);

  const end = parseKey(endDate);
  const rangeStart = new Date(end);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  // Align the grid's first column to the Monday on/before the window start.
  const gridStart = new Date(rangeStart);
  gridStart.setDate(gridStart.getDate() - mondayIndex(gridStart));

  const cells: LoadCell[] = [];
  const cur = new Date(gridStart);
  while (cur <= end) {
    const key = dateKey(cur);
    const load = loadByDate.get(key) ?? 0;
    cells.push({
      date: key,
      load,
      level: levelFor(load, max),
      inRange: cur >= rangeStart,
    });
    cur.setDate(cur.getDate() + 1);
  }
  // Pad the trailing week out to 7 (future days, faded).
  while (cells.length % 7 !== 0) {
    const last = parseKey(cells[cells.length - 1].date);
    last.setDate(last.getDate() + 1);
    cells.push({ date: dateKey(last), load: 0, level: 0, inRange: false });
  }

  const weeks: LoadCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return { weeks, maxLoad: max };
}
