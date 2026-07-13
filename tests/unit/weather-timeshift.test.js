import { describe, it, expect } from "vitest";
import {
  findCoolerHour,
  prescribeFor,
} from "../../angular/src/app/core/services/periodization-engine.ts";

/**
 * Phase 5b — the "train later, when it's cooler" time-shift. Over the hourly
 * forecast (venue-local), when the athlete's training hour is hot (≥ WBGT_REDUCE)
 * and a materially cooler, comfortable hour exists later the SAME day, suggest
 * it ("32°C WBGT at 18:00 — train at 20:00, ~26°"). Never invents a window: no
 * hourly / already-fine / no cooler hour → null.
 */

// Build a venue-local hourly series for 2026-07-13 from an {hour: [tempC, RH]} map.
const hourly = (byHour) =>
  Object.entries(byHour).map(([h, [tempC, humidityPct]]) => ({
    time: `2026-07-13T${String(h).padStart(2, "0")}:00`,
    tempC,
    humidityPct,
    apparentC: tempC,
    weatherCode: 0,
    windKmh: 5,
    precipMm: 0,
  }));

describe("findCoolerHour", () => {
  it("hot at 18:00, cool by 20:00 → suggests the 20:00 shift", () => {
    const forecast = hourly({
      17: [34, 55],
      18: [33, 55], // WBGT ~33.5 — hot
      19: [30, 55], // WBGT ~30.1 — still ≥ reduce
      20: [26, 50], // WBGT ~25.3 — comfortable
      21: [24, 50],
    });
    const shift = findCoolerHour(forecast, 18, null);
    expect(shift).not.toBeNull();
    expect(shift.fromHour).toBe(18);
    expect(shift.toHour).toBe(20); // earliest comfortable hour, not 19
    expect(shift.fromWbgt).toBeGreaterThanOrEqual(32);
    expect(shift.toWbgt).toBeLessThan(30);
    expect(shift.message).toContain("20:00");
  });

  it("training hour already comfortable → no suggestion", () => {
    const forecast = hourly({ 18: [22, 45], 19: [21, 45], 20: [20, 45] });
    expect(findCoolerHour(forecast, 18, null)).toBeNull();
  });

  it("hot all evening (no cooler hour within the window) → no suggestion", () => {
    const forecast = hourly({
      18: [35, 60],
      19: [35, 60],
      20: [34, 60],
      21: [34, 60],
    });
    expect(findCoolerHour(forecast, 18, null)).toBeNull();
  });

  it("never pushes a session past the evening cap (21:00)", () => {
    // hot until 21, only cool at 22 → past the cap → no suggestion
    const forecast = hourly({
      18: [33, 55],
      19: [32, 55],
      20: [31, 55],
      21: [31, 55],
      22: [24, 50],
    });
    expect(findCoolerHour(forecast, 18, null)).toBeNull();
  });

  it("no hourly data → null (never fabricates a window)", () => {
    expect(findCoolerHour([], 18, 33)).toBeNull();
    expect(findCoolerHour(null, 18, 33)).toBeNull();
  });
});

describe("prescribeFor — the time-shift attaches to a real outdoor session", () => {
  const base = {
    date: new Date("2026-07-13T00:00:00"),
    phase: "accumulation",
    upcoming: [],
    lastEvent: null,
    acwr: 1.0,
    readiness: 75,
    bodyweightKg: 80,
    density14d: null,
    seasonPhase: "inseason",
    weeklyIntentHint: "sprint", // force an outdoor field intent
    preferredTrainingHour: 18,
    weather: {
      tempC: 33,
      apparentC: 33,
      humidityPct: 55,
      condition: "clear",
      weatherCode: 0,
      precipMm: 0,
      windKmh: 5,
      hourly: hourly({
        18: [33, 55],
        19: [30, 55],
        20: [26, 50],
        21: [24, 50],
      }),
    },
  };

  it("a hot planned sprint gets a cooler-hour suggestion", () => {
    const rx = prescribeFor(structuredClone(base));
    expect(rx.timeShift).toBeTruthy();
    expect(rx.timeShift.toHour).toBe(20);
  });

  it("no time-shift when there's no hourly forecast (parity-safe)", () => {
    const noHourly = structuredClone(base);
    noHourly.weather.hourly = null;
    expect(prescribeFor(noHourly).timeShift ?? null).toBeNull();
  });
});
