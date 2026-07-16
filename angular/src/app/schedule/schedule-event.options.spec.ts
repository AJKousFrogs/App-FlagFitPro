import { describe, expect, it } from "vitest";
import {
  EVENT_CATEGORIES,
  EVENT_IMPORTANCES,
  EVENT_KINDS,
  EVENT_TIERS,
  KIND_DEFAULT_IMPORTANCE,
  categoryLabel,
  importanceClass,
  kindLabel,
  tierLabel,
} from "./schedule-event.options";
import type {
  AthleteEvent,
  AthleteEventKind,
} from "../core/models/athlete-event.models";

function event(over: Partial<AthleteEvent> = {}): AthleteEvent {
  return {
    id: "e1",
    category: "personal",
    kind: "gameday",
    title: "Match",
    startsAt: "2026-08-05T16:00:00.000Z",
    endsAt: null,
    expectedGameCount: 1,
    importance: "high",
    tier: null,
    location: null,
    venue: null,
    notes: null,
    status: "scheduled",
    ...over,
  } as AthleteEvent;
}

describe("schedule-event.options", () => {
  describe("KIND_DEFAULT_IMPORTANCE", () => {
    it("covers every kind offered in the form", () => {
      for (const k of EVENT_KINDS) {
        expect(KIND_DEFAULT_IMPORTANCE[k.key]).toBeDefined();
      }
    });

    it("peaks for a tournament and stays regular for a camp", () => {
      // Drives the taper depth, so these two must not drift.
      expect(KIND_DEFAULT_IMPORTANCE.tournament).toBe("peak");
      expect(KIND_DEFAULT_IMPORTANCE.camp).toBe("regular");
      expect(KIND_DEFAULT_IMPORTANCE.gameday).toBe("high");
    });

    it("only suggests importances the form can actually show", () => {
      const offered = EVENT_IMPORTANCES.map((i) => i.key);
      for (const k of Object.keys(
        KIND_DEFAULT_IMPORTANCE,
      ) as AthleteEventKind[]) {
        expect(offered).toContain(KIND_DEFAULT_IMPORTANCE[k]);
      }
    });
  });

  describe("tierLabel", () => {
    it("prefers the specific tier over the generic category", () => {
      expect(tierLabel(event({ category: "national", tier: "world" }))).toBe(
        "World Championship",
      );
    });

    it("falls back to the category label when no tier is set", () => {
      expect(tierLabel(event({ category: "national", tier: null }))).toBe(
        categoryLabel("national"),
      );
      expect(tierLabel(event({ category: "personal", tier: null }))).toBe(
        categoryLabel("personal"),
      );
    });
  });

  describe("importanceClass", () => {
    it("maps each importance to its band colour", () => {
      expect(importanceClass("peak")).toBe("danger");
      expect(importanceClass("high")).toBe("caution");
      expect(importanceClass("regular")).toBe("info");
    });
  });

  describe("option lists", () => {
    it("labels every category and kind via the canonical constants", () => {
      for (const c of EVENT_CATEGORIES) {
        expect(categoryLabel(c.key)).toBeTruthy();
      }
      for (const k of EVENT_KINDS) {
        expect(kindLabel(k.key)).toBeTruthy();
      }
    });

    it("offers 'not applicable' as the first tier so a camp can clear it", () => {
      expect(EVENT_TIERS[0].key).toBeNull();
    });
  });
});
