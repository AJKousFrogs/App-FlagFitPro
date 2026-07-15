/**
 * perf-viz — pure SVG geometry helpers (no Angular, no DOM).
 *
 * The premium data-viz component library renders from plain data; all the
 * coordinate math lives here so it is unit-testable in isolation and shared
 * across the components (one implementation, per CLAUDE §4). Every function is
 * total — empty / single-point / flat series return safe, non-NaN output so a
 * component never emits a broken `path` (Law #7: no fabricated data, and no
 * fabricated geometry either).
 */

export type PerfZone = "good" | "caution" | "danger" | "neutral";

/** Readiness → zone, matching the server bands (low < 55, high > 75). */
export function readinessZone(score: number | null | undefined): PerfZone {
  if (typeof score !== "number" || !Number.isFinite(score)) return "neutral";
  if (score < 55) return "danger";
  if (score <= 75) return "caution";
  return "good";
}

/** ACWR → zone (adult bands; the safe sweet spot is 0.8–1.3, danger > 1.5). */
export function acwrZone(acwr: number | null | undefined): PerfZone {
  if (typeof acwr !== "number" || !Number.isFinite(acwr)) return "neutral";
  if (acwr > 1.5 || acwr < 0.8) return acwr > 1.5 ? "danger" : "caution";
  if (acwr > 1.3) return "caution";
  return "good";
}

const finite = (xs: readonly number[]): number[] =>
  xs.filter((v) => typeof v === "number" && Number.isFinite(v));

export interface Pt {
  x: number;
  y: number;
}

/**
 * Map a numeric series to points inside a [0,w]×[pad,h-pad] box. The y-domain
 * is the series' own min→max (with a floor span so a flat line sits mid-box,
 * never divides by zero). Newest point is rightmost.
 */
export function seriesPoints(
  series: readonly number[],
  w: number,
  h: number,
  pad = 4,
): Pt[] {
  const s = finite(series);
  if (s.length === 0) return [];
  if (s.length === 1) return [{ x: w / 2, y: h / 2 }];
  const min = Math.min(...s);
  const max = Math.max(...s);
  const span = max - min || 1;
  const innerH = h - 2 * pad;
  return s.map((v, i) => ({
    x: +((i / (s.length - 1)) * w).toFixed(2),
    y: +(h - pad - ((v - min) / span) * innerH).toFixed(2),
  }));
}

/** A polyline `points` string from mapped points. */
export function polyline(pts: readonly Pt[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(" ");
}

/** A closed area polygon (line dropped to the baseline at both ends). */
export function areaPolygon(pts: readonly Pt[], baselineY: number): string {
  if (pts.length === 0) return "";
  const line = polyline(pts);
  return `${pts[0].x},${baselineY} ${line} ${pts[pts.length - 1].x},${baselineY}`;
}

/** An `M…L…` path (for stroked lines that need a real path element). */
export function linePath(pts: readonly Pt[]): string {
  return pts
    .map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`)
    .join(" ");
}

/**
 * Ring gauge dash geometry: circumference and the dashoffset for `fraction`
 * (0→empty, 1→full). Clamped so an out-of-range value never over/under-draws.
 */
export function ringDash(
  radius: number,
  fraction: number,
): { circumference: number; offset: number } {
  const c = 2 * Math.PI * radius;
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  return { circumference: +c.toFixed(2), offset: +(c * (1 - f)).toFixed(2) };
}

/**
 * Bar geometry for a load timeline: each value → {x, y, width, height} inside
 * the plot box, scaled to `maxValue`. Zero/negative values yield height 0
 * (a rest day draws nothing, not a fabricated stub).
 */
export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  index: number;
}
export function bars(
  values: readonly number[],
  maxValue: number,
  plot: { left: number; top: number; width: number; height: number },
  widthRatio = 0.6,
): Bar[] {
  const n = values.length;
  if (n === 0 || !(maxValue > 0)) return [];
  const step = plot.width / n;
  const bw = step * widthRatio;
  return values.map((v, i) => {
    const value = Number.isFinite(v) && v > 0 ? v : 0;
    const height = (value / maxValue) * plot.height;
    const cx = plot.left + step * (i + 0.5);
    return {
      x: +(cx - bw / 2).toFixed(2),
      y: +(plot.top + plot.height - height).toFixed(2),
      width: +bw.toFixed(2),
      height: +height.toFixed(2),
      value,
      index: i,
    };
  });
}

/** Map a value in [lo,hi] to a y inside a plot box (hi at top). */
export function bandY(
  value: number,
  lo: number,
  hi: number,
  plot: { top: number; height: number },
): number {
  const t = (Math.min(hi, Math.max(lo, value)) - lo) / (hi - lo || 1);
  return +(plot.top + plot.height - t * plot.height).toFixed(2);
}

/**
 * Sequential ramp index for a heatmap cell: 0 → the "no data / rest" slot,
 * else 1..steps by relative magnitude vs the series max. Relative by design —
 * the app makes no absolute AU→risk claim.
 */
export function rampIndex(
  value: number,
  maxValue: number,
  steps: number,
): number {
  if (!(value > 0) || !(maxValue > 0)) return 0;
  const t = Math.min(1, value / maxValue);
  return Math.min(steps, 1 + Math.floor(t * (steps - 1)));
}
