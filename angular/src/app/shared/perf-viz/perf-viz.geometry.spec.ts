import { describe, it, expect } from "vitest";
import {
  readinessZone,
  acwrZone,
  seriesPoints,
  polyline,
  areaPolygon,
  linePath,
  ringDash,
  bars,
  bandY,
  rampIndex,
} from "./perf-viz.geometry";

// perf-viz geometry is the testable core shared by every chart component —
// total functions, no NaN, honest empties (Law #7 extends to geometry).

describe("zone classifiers match the server bands", () => {
  it("readiness: <55 danger, 55-75 caution, >75 good, null neutral", () => {
    expect(readinessZone(40)).toBe("danger");
    expect(readinessZone(54.9)).toBe("danger");
    expect(readinessZone(55)).toBe("caution");
    expect(readinessZone(75)).toBe("caution");
    expect(readinessZone(76)).toBe("good");
    expect(readinessZone(null)).toBe("neutral");
    expect(readinessZone(NaN)).toBe("neutral");
  });
  it("acwr: sweet 0.8-1.3 good, 1.3-1.5 caution, >1.5 danger, <0.8 caution", () => {
    expect(acwrZone(1.0)).toBe("good");
    expect(acwrZone(1.35)).toBe("caution");
    expect(acwrZone(1.6)).toBe("danger");
    expect(acwrZone(0.6)).toBe("caution");
    expect(acwrZone(null)).toBe("neutral");
  });
});

describe("seriesPoints — safe on empty/flat/single", () => {
  it("empty → no points; single → centered", () => {
    expect(seriesPoints([], 100, 40)).toEqual([]);
    expect(seriesPoints([7], 100, 40)).toEqual([{ x: 50, y: 20 }]);
  });
  it("flat series does not divide by zero (all mid-box)", () => {
    const pts = seriesPoints([5, 5, 5], 100, 40, 4);
    expect(pts).toHaveLength(3);
    pts.forEach((p) => expect(Number.isFinite(p.y)).toBe(true));
    expect(pts[0].x).toBe(0);
    expect(pts[2].x).toBe(100);
  });
  it("newest point is rightmost; higher value is higher on screen (smaller y)", () => {
    const pts = seriesPoints([10, 20], 100, 40);
    expect(pts[1].x).toBe(100);
    expect(pts[1].y).toBeLessThan(pts[0].y); // 20 sits above 10
  });
  it("ignores non-finite entries", () => {
    const pts = seriesPoints([10, NaN, 30] as number[], 100, 40);
    expect(pts).toHaveLength(2);
  });
});

describe("path builders", () => {
  const pts = [
    { x: 0, y: 10 },
    { x: 50, y: 5 },
    { x: 100, y: 8 },
  ];
  it("polyline joins points", () => {
    expect(polyline(pts)).toBe("0,10 50,5 100,8");
  });
  it("area closes to the baseline at both ends", () => {
    expect(areaPolygon(pts, 40)).toBe("0,40 0,10 50,5 100,8 100,40");
    expect(areaPolygon([], 40)).toBe("");
  });
  it("linePath uses M then L", () => {
    expect(linePath(pts)).toBe("M0 10 L50 5 L100 8");
  });
});

describe("ringDash — clamped fraction", () => {
  it("0 → full offset (empty ring); 1 → zero offset (full ring)", () => {
    const r = 63;
    const c = 2 * Math.PI * r;
    expect(ringDash(r, 0).offset).toBeCloseTo(c, 1);
    expect(ringDash(r, 1).offset).toBeCloseTo(0, 1);
  });
  it("out-of-range and NaN are clamped, never NaN out", () => {
    expect(ringDash(63, 2).offset).toBeCloseTo(0, 1);
    expect(ringDash(63, -1).offset).toBeCloseTo(ringDash(63, 0).circumference, 1);
    expect(Number.isFinite(ringDash(63, NaN).offset)).toBe(true);
  });
});

describe("bars — rest days draw nothing", () => {
  const plot = { left: 0, top: 0, width: 100, height: 100 };
  it("zero/negative values yield height 0", () => {
    const b = bars([0, 50, -5, 100], 100, plot);
    expect(b[0].height).toBe(0);
    expect(b[2].height).toBe(0);
    expect(b[3].height).toBe(100);
  });
  it("empty or non-positive max → no bars", () => {
    expect(bars([1, 2], 0, plot)).toEqual([]);
    expect(bars([], 100, plot)).toEqual([]);
  });
});

describe("bandY + rampIndex", () => {
  it("bandY clamps and inverts (hi at top)", () => {
    const plot = { top: 0, height: 100 };
    expect(bandY(1.7, 0.6, 1.7, plot)).toBe(0); // hi → top
    expect(bandY(0.6, 0.6, 1.7, plot)).toBe(100); // lo → bottom
    expect(bandY(5, 0.6, 1.7, plot)).toBe(0); // clamped
  });
  it("rampIndex: 0 for rest, 1..steps by relative magnitude", () => {
    expect(rampIndex(0, 500, 5)).toBe(0);
    expect(rampIndex(500, 500, 5)).toBe(5);
    expect(rampIndex(250, 500, 5)).toBeGreaterThanOrEqual(1);
    expect(rampIndex(100, 0, 5)).toBe(0); // no max → rest slot
  });
});
