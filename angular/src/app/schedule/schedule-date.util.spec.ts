import { describe, expect, it } from "vitest";
import {
  combineLocal,
  toDateInput,
  toTimeInput,
  whenLabel,
} from "./schedule-date.util";

// These are deliberately timezone-agnostic: they assert round-trips and
// structure rather than a fixed UTC offset, so they hold wherever CI runs.
describe("schedule-date.util", () => {
  describe("combineLocal", () => {
    it("round-trips a local date+time through the input formatters", () => {
      const iso = combineLocal("2026-08-05", "18:30");
      expect(toDateInput(iso)).toBe("2026-08-05");
      expect(toTimeInput(iso)).toBe("18:30");
    });

    it("interprets the date in local time, not UTC", () => {
      const iso = combineLocal("2026-08-05", "00:00");
      const dt = new Date(iso);
      expect(dt.getFullYear()).toBe(2026);
      expect(dt.getMonth()).toBe(7); // August is 0-indexed 7
      expect(dt.getDate()).toBe(5);
      expect(dt.getHours()).toBe(0);
    });

    it("defaults a missing time to midnight rather than NaN", () => {
      const iso = combineLocal("2026-08-05", "");
      expect(Number.isNaN(new Date(iso).getTime())).toBe(false);
      expect(toDateInput(iso)).toBe("2026-08-05");
    });
  });

  describe("toDateInput / toTimeInput", () => {
    it("zero-pads single-digit months, days, hours and minutes", () => {
      const iso = combineLocal("2026-01-02", "03:04");
      expect(toDateInput(iso)).toBe("2026-01-02");
      expect(toTimeInput(iso)).toBe("03:04");
    });
  });

  describe("whenLabel", () => {
    it("shows date and kickoff time for a single-day event", () => {
      const start = combineLocal("2026-08-05", "18:00");
      const label = whenLabel(start, null);
      expect(label).toContain("·");
      expect(label).not.toContain("→");
      expect(label).toContain("18:00");
    });

    it("shows a range when the event spans more than one day", () => {
      const start = combineLocal("2026-08-05", "09:00");
      const end = combineLocal("2026-08-09", "23:59");
      const label = whenLabel(start, end);
      expect(label).toContain("→");
      expect(label).not.toContain("·");
    });

    it("falls back to date + time when endsAt lands on the start day", () => {
      // A gameday saved with an end time still reads as one day, not a range.
      const start = combineLocal("2026-08-05", "18:00");
      const end = combineLocal("2026-08-05", "23:59");
      expect(whenLabel(start, end)).toBe(whenLabel(start, null));
    });
  });
});
