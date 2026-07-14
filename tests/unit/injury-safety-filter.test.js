import { describe, it, expect } from "vitest";
import {
  isExerciseSafeForInjuries,
  tissuesForRegion,
  keywordsForRegion,
} from "../../netlify/functions/utils/daily-protocol-blocks.js";

/**
 * SAFETY-CRITICAL: this is the filter that decides which exercises an INJURED
 * athlete is allowed to load. The most dangerous failure mode in the whole app is
 * a plantarflexor loader (anything that loads the Achilles/calf) slipping through
 * when the athlete has an Achilles/calf injury — so it is locked here through BOTH
 * of the filter's paths (the structured tissue_targets graph AND the name-keyword
 * fail-safe), because either one firing must mark the exercise unsafe.
 */

// Every way an athlete's calf/Achilles complex can be named as the injured region.
const CALF_ACHILLES_REGIONS = [
  "achilles",
  "calf",
  "soleus",
  "gastrocnemius",
  "heel",
];

// The plantarflexor tissue tags — loading ANY of these loads the Achilles.
const PLANTARFLEXOR_TISSUES = [
  "achilles",
  "soleus",
  "gastrocnemius",
  "plantaris",
];

describe("injury safety filter — the Achilles complex is one unit", () => {
  it("maps every calf/Achilles region name to the full plantarflexor tissue set", () => {
    for (const region of CALF_ACHILLES_REGIONS) {
      const tissues = tissuesForRegion(region);
      expect(
        PLANTARFLEXOR_TISSUES.some((t) => tissues.includes(t)),
        `${region} → plantarflexor tissues`,
      ).toBe(true);
    }
  });

  it("STRUCTURED path: a plantarflexor loader is UNSAFE for an Achilles injury even when its NAME hides the load", () => {
    for (const tissue of PLANTARFLEXOR_TISSUES) {
      // a machine whose name reveals nothing about the calf
      const ex = {
        name: "Seated Resistance Machine",
        slug: "seated-machine",
        tissue_targets: [tissue],
      };
      for (const region of CALF_ACHILLES_REGIONS) {
        expect(
          isExerciseSafeForInjuries(ex, [region]),
          `${tissue} loader must be unsafe for ${region}`,
        ).toBe(false);
      }
    }
  });

  it("KEYWORD fail-safe: an untagged calf loader is still UNSAFE for an Achilles injury", () => {
    // tissue_targets missing (a row not yet backfilled) — the name keyword must catch it
    const ex = {
      name: "Standing Calf Raise",
      slug: "standing-calf-raise",
      tissue_targets: null,
    };
    expect(isExerciseSafeForInjuries(ex, ["achilles"])).toBe(false);
    expect(isExerciseSafeForInjuries(ex, ["calf"])).toBe(false);
  });

  it("the real library row 'Calf & Achilles Cool-Down Mobility' (untagged) is caught by the keyword path", () => {
    const ex = {
      name: "Calf & Achilles Cool-Down Mobility",
      slug: "calf-achilles-cool-down-mobility",
      tissue_targets: null,
    };
    expect(isExerciseSafeForInjuries(ex, ["achilles"])).toBe(false);
  });

  it("keywordsForRegion(achilles) treats the calf complex as one unit", () => {
    const kws = keywordsForRegion("achilles");
    expect(kws.some((k) => k.includes("calf"))).toBe(true);
    expect(kws.some((k) => k.includes("achilles"))).toBe(true);
  });

  it("does NOT over-block: an upper-body exercise is SAFE for an Achilles injury", () => {
    const ex = {
      name: "Band External Rotation",
      slug: "band-external-rotation",
      tissue_targets: ["rotator_cuff"],
    };
    expect(isExerciseSafeForInjuries(ex, ["achilles"])).toBe(true);
  });

  it("no injured regions → everything is safe", () => {
    const ex = { name: "Standing Calf Raise", tissue_targets: ["achilles"] };
    expect(isExerciseSafeForInjuries(ex, [])).toBe(true);
    expect(isExerciseSafeForInjuries(ex, null)).toBe(true);
  });

  it("cross-region: a hamstring loader is unsafe for a hamstring injury but safe for an Achilles injury", () => {
    const ham = {
      name: "Nordic Hamstring Curl",
      slug: "nordic",
      tissue_targets: ["hamstring"],
    };
    expect(isExerciseSafeForInjuries(ham, ["hamstring"])).toBe(false);
    expect(isExerciseSafeForInjuries(ham, ["achilles"])).toBe(true);
  });

  it("patellar-tendon loaders are unsafe for a knee/patellar injury (both paths)", () => {
    // STRUCTURED path catches a name-hiding machine that loads the patellar tendon
    const tagged = {
      name: "Machine X",
      slug: "machine-x",
      tissue_targets: ["patellar_tendon"],
    };
    expect(isExerciseSafeForInjuries(tagged, ["knee"])).toBe(false);
    expect(isExerciseSafeForInjuries(tagged, ["patellar"])).toBe(false);
    // KEYWORD fail-safe catches a knee-named exercise even when untagged
    const named = {
      name: "Knee Extension",
      slug: "knee-extension",
      tissue_targets: null,
    };
    expect(isExerciseSafeForInjuries(named, ["knee"])).toBe(false);
  });

  it("demonstrates WHY tissue tagging matters: a name-hiding untagged loader escapes the keyword path", () => {
    // A 'Decline Squat' heavily loads the patellar tendon, but its NAME reveals
    // nothing about the knee — with no tissue_targets, the keyword path cannot see
    // it. This is exactly the gap tissue_targets closes: once tagged, the structured
    // path catches it (asserted above). Documented here so the fail-safe's limit is
    // explicit, not a surprise.
    const untaggedHidden = {
      name: "Decline Squat",
      slug: "decline-squat",
      tissue_targets: null,
    };
    expect(isExerciseSafeForInjuries(untaggedHidden, ["patellar"])).toBe(true); // escapes — needs a tag
    const taggedSame = {
      ...untaggedHidden,
      tissue_targets: ["patellar_tendon"],
    };
    expect(isExerciseSafeForInjuries(taggedSame, ["patellar"])).toBe(false); // tagged → caught
  });
});
