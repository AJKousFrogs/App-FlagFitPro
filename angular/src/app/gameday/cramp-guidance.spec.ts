import { describe, it, expect } from "vitest";
import { crampGuidance } from "./cramp-guidance";

describe("crampGuidance", () => {
  describe("scope", () => {
    it("is silent on a cool multi-game day", () => {
      expect(crampGuidance({ hot: false, gameCount: 4 })).toBeNull();
    });

    it("is silent on a hot single-game day", () => {
      expect(crampGuidance({ hot: true, gameCount: 1 })).toBeNull();
    });

    it("is silent for a non-finite game count", () => {
      expect(crampGuidance({ hot: true, gameCount: Number.NaN })).toBeNull();
    });

    it("fires on a hot multi-game day", () => {
      expect(crampGuidance({ hot: true, gameCount: 2 })).not.toBeNull();
    });
  });

  describe("evidence ordering — fatigue first, sodium second", () => {
    const g = crampGuidance({ hot: true, gameCount: 4 });

    it("leads with fatigue, not electrolytes", () => {
      expect(g?.note).toMatch(/fatigue/i);
      expect(g?.note).toMatch(/not a salt one/i);
    });

    it("gives the acute lever that actually works (stretch and hold)", () => {
      expect(g?.note).toMatch(/stretch/i);
      expect(g?.note).toMatch(/hold/i);
    });

    it("never claims cramps are caused by electrolyte loss", () => {
      const note = g?.note ?? "";
      expect(note).not.toMatch(
        /caused by (dehydration|electrolyte)|lost electrolytes|replace .*electrolytes to (stop|prevent)/i,
      );
    });

    it("ranks sodium as secondary and conditions it on the right subgroup", () => {
      expect(g?.sodiumNote).toMatch(/second lever/i);
      expect(g?.sodiumNote).toMatch(/repeatedly/i);
      expect(g?.sodiumNote).toMatch(/salt stains|salty/i);
    });

    it("does not promise sodium prevents cramps for everyone", () => {
      expect(g?.sodiumNote).toMatch(/won't beat being better conditioned/i);
    });

    it("always ships both notes together so the hierarchy stays visible", () => {
      expect(g?.note).toBeTruthy();
      expect(g?.sodiumNote).toBeTruthy();
    });
  });

  describe("single-source discipline", () => {
    it("states no fluid/sodium numbers — those live in nutrition-protocols/REFUEL", () => {
      const g = crampGuidance({ hot: true, gameCount: 4 });
      const all = `${g?.note} ${g?.sodiumNote}`;
      // no mg / ml / L / g-per-kg style figures may appear here
      expect(all).not.toMatch(/\d+\s*(mg|ml|l\b|g\/kg|g per kg)/i);
    });
  });
});
