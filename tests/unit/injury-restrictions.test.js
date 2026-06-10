import { describe, it, expect } from "vitest";
import { restrictionsFor } from "../../netlify/functions/athlete-injuries.js";

// Safety contract: a self-reported sore region must restrict the right work.
// The client injury guard sets restrictsSprint when restrictions include
// "sprint" or "high_intensity", so those tokens are what gate explosive work.
const restrictsSprint = (out) =>
  out.includes("sprint") || out.includes("high_intensity");

describe("restrictionsFor — lower-limb regions gate sprinting", () => {
  for (const region of [
    "soleus", // was missing — the bug this fixes
    "achilles",
    "gastrocnemius",
    "hamstring",
    "calf",
    "quad",
    "knee",
    "patella",
    "ankle",
    "adductor",
    "groin",
    "glute",
    "tibialis",
    "plantar fascia",
    "IT band",
  ]) {
    it(`"${region}" restricts sprint/plyo/agility/high-intensity`, () => {
      const out = restrictionsFor(region, "moderate");
      expect(out).toContain("sprint");
      expect(out).toContain("plyometric");
      expect(out).toContain("high_intensity");
      expect(restrictsSprint(out)).toBe(true);
    });
  }

  it("non-minor severity also pulls strength", () => {
    expect(restrictionsFor("hamstring", "severe")).toContain("strength");
    expect(restrictionsFor("hamstring", "minor")).not.toContain("strength");
  });
});

describe("restrictionsFor — core/trunk gates explosive AND throwing", () => {
  for (const region of ["core", "low back", "lumbar", "oblique", "abdominal"]) {
    it(`"${region}" restricts sprint + throwing`, () => {
      const out = restrictionsFor(region, "moderate");
      expect(restrictsSprint(out)).toBe(true);
      expect(out).toContain("throwing");
    });
  }
});

describe("restrictionsFor — upper body spares running, blocks throwing", () => {
  for (const region of ["shoulder", "elbow", "wrist", "rotator cuff"]) {
    it(`"${region}" does NOT restrict sprinting but blocks throwing/loaded upper work`, () => {
      const out = restrictionsFor(region, "moderate");
      expect(restrictsSprint(out)).toBe(false);
      expect(out).toContain("throwing");
      expect(out).toContain("upper_strength");
    });
  }
});

describe("restrictionsFor — unrecognised region FAILS SAFE", () => {
  for (const region of ["", "hamstrng (typo)", "somewhere", "xyz", "sholder"]) {
    it(`"${region}" defaults to restricting sprint AND throwing (never spares either)`, () => {
      const out = restrictionsFor(region, "moderate");
      expect(restrictsSprint(out)).toBe(true);
      expect(out).toContain("throwing");
    });
  }
});
