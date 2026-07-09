import { describe, it, expect } from "vitest";
import { buildLoadCalendar } from "./load-calendar.util";

describe("buildLoadCalendar", () => {
  it("aligns the grid to Monday and pads every row to 7", () => {
    const cal = buildLoadCalendar([], "2026-07-08", 7, 0);
    for (const w of cal.weeks) {
      expect(w.length).toBe(7);
    }
    const firstKey = cal.weeks[0][0].date;
    // JS getDay: Monday === 1
    expect(new Date(firstKey + "T00:00:00").getDay()).toBe(1);
    const end = cal.weeks.flat().find((c) => c.date === "2026-07-08");
    expect(end?.inRange).toBe(true);
  });

  it("maps loads to a relative 1–4 ramp against the window max", () => {
    const series = [
      { date: "2026-07-06", load: 100 }, // max → 4
      { date: "2026-07-07", load: 70 }, // 0.70 → 3
      { date: "2026-07-08", load: 40 }, // 0.40 → 2
      { date: "2026-07-09", load: 10 }, // 0.10 → 1
    ];
    const cal = buildLoadCalendar(series, "2026-07-09", 7, 100);
    const byDate = new Map(cal.weeks.flat().map((c) => [c.date, c]));
    expect(byDate.get("2026-07-06")?.level).toBe(4);
    expect(byDate.get("2026-07-07")?.level).toBe(3);
    expect(byDate.get("2026-07-08")?.level).toBe(2);
    expect(byDate.get("2026-07-09")?.level).toBe(1);
    expect(cal.maxLoad).toBe(100);
  });

  it("derives maxLoad from the series when not supplied", () => {
    const cal = buildLoadCalendar(
      [
        { date: "2026-07-07", load: 250 },
        { date: "2026-07-08", load: 400 },
      ],
      "2026-07-08",
      7,
    );
    expect(cal.maxLoad).toBe(400);
  });

  it("marks in-window rest days level 0 and pad days inRange=false", () => {
    const cal = buildLoadCalendar(
      [{ date: "2026-07-08", load: 50 }],
      "2026-07-08",
      3,
      50,
    );
    const cells = cal.weeks.flat();
    const rest = cells.find((c) => c.date === "2026-07-07"); // in-window, no load
    expect(rest?.level).toBe(0);
    expect(rest?.inRange).toBe(true);
    // window start is 07-06; the Monday-aligned leading days before it are pads
    expect(cells.some((c) => !c.inRange)).toBe(true);
  });
});
