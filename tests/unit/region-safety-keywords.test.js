import { describe, it, expect } from "vitest";
import {
  isExerciseSafeForInjuries,
  keywordsForRegion,
} from "../../netlify/functions/utils/daily-protocol-blocks.js";

const ex = (name, slug = null) => ({
  name,
  slug: slug ?? name.toLowerCase().replace(/\s+/g, "-"),
});

describe("keywordsForRegion: anatomical linking", () => {
  it("achilles resolves to the full calf–Achilles complex", () => {
    const kws = keywordsForRegion("achilles");
    expect(kws).toContain("calf");
    expect(kws).toContain("soleus");
    expect(kws).toContain("gastrocnemius");
  });

  it("composite regions from the Today body check resolve via substring keys", () => {
    // "foot / plantar" is not an exact REGION_KEYWORDS key but contains two
    expect(keywordsForRegion("foot / plantar")).toEqual(
      expect.arrayContaining(["plantar", "foot"]),
    );
    // "hip flexor" resolves through the "hip" entry
    expect(keywordsForRegion("hip flexor")).toEqual(
      expect.arrayContaining(["hip", "iliopsoas"]),
    );
  });

  it("unknown region falls back to itself", () => {
    expect(keywordsForRegion("elbow")).toEqual(["elbow"]);
  });
});

describe("isExerciseSafeForInjuries: calf–Achilles complex (P2 fix)", () => {
  it("blocks a Calf Raise for an achilles report (loads the tendon directly)", () => {
    expect(isExerciseSafeForInjuries(ex("Calf Raise"), ["achilles"])).toBe(
      false,
    );
  });

  it("blocks Standing Calf Stretch and Eccentric Heel Drop for achilles", () => {
    expect(
      isExerciseSafeForInjuries(ex("Standing Calf Stretch"), ["achilles"]),
    ).toBe(false);
    expect(
      isExerciseSafeForInjuries(ex("Eccentric Heel Drop"), ["achilles"]),
    ).toBe(false);
  });

  it("blocks Achilles-named work for a calf report (both directions)", () => {
    expect(
      isExerciseSafeForInjuries(ex("Achilles Tendon Stretch"), ["calf"]),
    ).toBe(false);
  });

  it("blocks patellar-tendon work for a knee report", () => {
    expect(
      isExerciseSafeForInjuries(ex("Patellar Tendon Isometric"), ["knee"]),
    ).toBe(false);
  });

  it("still allows unrelated work for an achilles report", () => {
    expect(
      isExerciseSafeForInjuries(ex("Shoulder Pass-Through"), ["achilles"]),
    ).toBe(true);
    expect(isExerciseSafeForInjuries(ex("Hamstring Curl"), ["achilles"])).toBe(
      true,
    );
  });

  it("no injured regions → everything is safe", () => {
    expect(isExerciseSafeForInjuries(ex("Calf Raise"), [])).toBe(true);
  });
});
